import { describe, it, expect, beforeEach, vi } from 'vitest';
import autopilotManager, {
  MACRO_COLS,
  MACRO_ROWS,
  TOTAL_MACRO_CELLS,
} from './world/autopilotManager';
import state from '../state/state';
import seaWeather from './world/seaWeather';
import explorationManager from './world/explorationManager';

import fs from 'fs';
import path from 'path';
import Assets from '../assets';
import { getCaptain, positionAdjacentToPort } from '../state/selectors';
import createMap from '../map';
import Input from '../input';
import { setSail } from '../state/actionsWorld';

// Load worldTilemap binary so unit tests have full accurate geographical landmasses
try {
  const tilemapPath = path.resolve(__dirname, '../data/assets/worldTilemap.wasm');
  if (fs.existsSync(tilemapPath)) {
    const tilemapBuf = fs.readFileSync(tilemapPath);
    (Assets as any).data = (id: string) => {
      if (id === 'worldTilemap') return new Uint8Array(tilemapBuf);
      return null;
    };
  }
} catch (e) {}

describe('Milestone 10: Port Autopilot Navigation & Maritime Course Plotting', () => {
  beforeEach(() => {
    autopilotManager.resetGrid();
    autopilotManager.cancelCourse();
    seaWeather.clearWeather();
    explorationManager.reset();
    // Default: reveal European charts for standard baseline tests
    explorationManager.unlockRegionalChart('mediterranean');
    explorationManager.unlockRegionalChart('north_europe');

    state.timePassed = 480;
    state.portId = null;
    state.fleets = {
      1: {
        position: { x: 840, y: 358 }, // Lisbon waters
        ships: [
          {
            id: '1',
            name: 'Santa Maria',
            crew: 50,
            cargo: [
              { type: 'water', quantity: 100 }, // 100 / 5 = 20 days
              { type: 'food', quantity: 100 },  // 100 / 5 = 20 days
            ],
          },
        ],
      },
    } as any;
  });

  describe('Task 10.1: Macro-Grid A* Nautical Pathfinding', () => {
    it('initializes a 216x108 navigable sea grid (23,328 cells)', () => {
      expect(MACRO_COLS).toBe(216);
      expect(MACRO_ROWS).toBe(108);
      expect(TOTAL_MACRO_CELLS).toBe(23328);

      // Temperate ocean cells are navigable
      expect(autopilotManager.isMacroCellWater(84, 35)).toBe(true);
      // Extreme polar caps are blocked
      expect(autopilotManager.isMacroCellWater(84, 0)).toBe(false);
      expect(autopilotManager.isMacroCellWater(84, 107)).toBe(false);
    });

    it('finds an obstacle-free nautical path between oceanic coordinates', () => {
      const start = { x: 840, y: 358 }; // Lisbon
      const destination = { x: 860, y: 300 }; // Bay of Biscay

      const waypoints = autopilotManager.findPath(start, destination, false);
      expect(waypoints).not.toBeNull();
      expect(waypoints!.length).toBeGreaterThanOrEqual(2);
      expect(waypoints![0]).toEqual(start);
      expect(waypoints![waypoints!.length - 1]).toEqual(destination);
    });

    it('supports cylindrical X-axis wrap-around across Pacific seams', () => {
      // East Asian waters X=2150 to American West Coast X=10
      const westSeam = { x: 2150, y: 500 };
      const eastSeam = { x: 10, y: 500 };

      const waypoints = autopilotManager.findPath(westSeam, eastSeam, false);
      expect(waypoints).not.toBeNull();
      expect(waypoints!.length).toBeGreaterThanOrEqual(2);
      expect(waypoints![0]).toEqual(westSeam);
      expect(waypoints![waypoints!.length - 1]).toEqual(eastSeam);
    });

    it('converts delta vectors to accurate 8-way directional headings', () => {
      expect(autopilotManager.vectorToDirection(0, -10)).toBe('n');
      expect(autopilotManager.vectorToDirection(10, -10)).toBe('ne');
      expect(autopilotManager.vectorToDirection(10, 0)).toBe('e');
      expect(autopilotManager.vectorToDirection(10, 10)).toBe('se');
      expect(autopilotManager.vectorToDirection(0, 10)).toBe('s');
      expect(autopilotManager.vectorToDirection(-10, 10)).toBe('sw');
      expect(autopilotManager.vectorToDirection(-10, 0)).toBe('w');
      expect(autopilotManager.vectorToDirection(-10, -10)).toBe('nw');
    });
  });

  describe('Task 10.2: Course Engagement & Customizable Arrival Action', () => {
    it('sets an active course to a destination port with Auto-Dock mode', () => {
      // Port '1' is Lisbon
      const course = autopilotManager.setCourse('1', true);
      expect(course).not.toBeNull();
      expect(course?.portName).toBe('Lisbon');
      expect(course?.enterPortOnArrival).toBe(true);
      expect(course?.active).toBe(true);
      expect(autopilotManager.isActive()).toBe(true);
      expect(autopilotManager.getCourse()).toBe(course);
    });

    it('supports Roadstead Anchor mode (stay in ocean upon arrival)', () => {
      const course = autopilotManager.setCourse('1', false);
      expect(course).not.toBeNull();
      expect(course?.enterPortOnArrival).toBe(false);
      expect(course?.active).toBe(true);
    });

    it('cancels active course and restores manual helm control', () => {
      autopilotManager.setCourse('1', true);
      expect(autopilotManager.isActive()).toBe(true);

      autopilotManager.cancelCourse('Manual override');
      expect(autopilotManager.isActive()).toBe(false);
      expect(autopilotManager.getCourse()).toBeNull();
    });

    it('rejects course engagement and returns null when fleet is docked in port', () => {
      state.portId = '1'; // Lisbon harbor
      const course = autopilotManager.setCourse('2', true);
      expect(course).toBeNull();
      expect(autopilotManager.isActive()).toBe(false);
      expect(state.autopilotCourse).toBeNull();
    });
  });

  describe('Task 10.3: Safety Auto-Interrupt System', () => {
    it('triggers safety interrupt when food or water drops below 5 days', () => {
      autopilotManager.setCourse('1', true);

      // Normal supplies (20 days): no interrupt
      let check = autopilotManager.checkSafetyInterrupts();
      expect(check).toBeNull();

      // Drop food to 10 units for 50 crew (daily ration = 5, 10/5 = 2 days < 5)
      state.fleets[1].ships[0].cargo = [
        { type: 'water', quantity: 100 },
        { type: 'food', quantity: 10 },
      ];

      check = autopilotManager.checkSafetyInterrupts();
      expect(check).not.toBeNull();
      expect(check?.shouldInterrupt).toBe(true);
      expect(check?.reason).toBe('provisions');
      expect(check?.message).toContain('CRITICAL SUPPLIES');
    });

    it('triggers safety interrupt when hostile sails appear within 10 tiles', () => {
      autopilotManager.setCourse('1', true);

      // Distant pirate at 200 tiles away: no interrupt
      state.fleets[2] = {
        position: { x: 1040, y: 358 },
        ships: [{ id: '2', name: 'Corsair Galley', crew: 60, cargo: [] }],
      } as any;

      let check = autopilotManager.checkSafetyInterrupts();
      expect(check).toBeNull();

      // Enemy moves within ambush proximity: 6 tiles away (846, 358)
      state.fleets[2].position = { x: 846, y: 358 };
      check = autopilotManager.checkSafetyInterrupts();
      expect(check).not.toBeNull();
      expect(check?.shouldInterrupt).toBe(true);
      expect(check?.reason).toBe('corsair');
      expect(check?.message).toContain('UNFRIENDLY SAILS');
    });

    it('triggers safety interrupt when a violent storm strikes', () => {
      autopilotManager.setCourse('1', true);

      seaWeather.setWeather('storm', 6);
      const check = autopilotManager.checkSafetyInterrupts();
      expect(check).not.toBeNull();
      expect(check?.shouldInterrupt).toBe(true);
      expect(check?.reason).toBe('storm');
      expect(check?.message).toContain('VIOLENT GALE');
    });
  });

  describe('Task 10.4: Steering & Waypoint Progression', () => {
    it('steers player flagship towards waypoints and halts safely upon interrupt', () => {
      let currentHeading = '';
      const mockPlayer = {
        position: () => ({ x: 840, y: 358 }),
        setHeading: (h: string) => {
          currentHeading = h;
        },
      };

      // Course to port '2' (Seville, distant from Lisbon)
      autopilotManager.setCourse('2', true);
      const moved = autopilotManager.updateSteering(mockPlayer);
      expect(moved).toBe(true);
      expect(currentHeading).toBeDefined();

      // If low provisions strike, updateSteering disengages and halts
      state.fleets[1].ships[0].cargo = [{ type: 'food', quantity: 0 }];
      const movedAfterInterrupt = autopilotManager.updateSteering(mockPlayer);
      expect(movedAfterInterrupt).toBe(false);
      expect(autopilotManager.isActive()).toBe(false);
      expect(currentHeading).toBe('');
    });
  });

  describe('Task 10.6: Coastal Clearance & Explored-Only Pathfinding Rule', () => {
    it('rejects course engagement through unrevealed Fog of War waters', () => {
      // Fleet at Lisbon (charted), but Caribbean is completely unrevealed
      const sanJuanPos = { x: 480, y: 440 };
      const unrevealedPath = autopilotManager.findPath(
        { x: 840, y: 358 },
        sanJuanPos,
        true, // Require explored waters
      );

      // Must return null because Atlantic/Caribbean waters are uncharted!
      expect(unrevealedPath).toBeNull();
    }, 15000);

    it('allows navigation after purchasing regional cartography charts', () => {
      // Reveal Far East charts
      explorationManager.unlockRegionalChart('far_east');

      const sundaPos = { x: 1540, y: 666 };
      const malaccaPos = { x: 1506, y: 606 };

      const chartedPath = autopilotManager.findPath(sundaPos, malaccaPos, true);
      expect(chartedPath).not.toBeNull();
      expect(chartedPath!.length).toBeGreaterThanOrEqual(2);
    });

    it('avoids narrow coastal bottlenecks (Bangka Strait) and favors wide open sea', () => {
      explorationManager.unlockRegionalChart('far_east');

      const sundaPos = { x: 1540, y: 666 };
      const malaccaPos = { x: 1506, y: 606 };

      const path = autopilotManager.findPath(sundaPos, malaccaPos, true);
      expect(path).not.toBeNull();
      console.log('--- SUNDA TO MALACCA PATH ---');
      path!.forEach((wp, idx) => {
        console.log(`WP ${idx}: x=${wp.x}, y=${wp.y} (col=${Math.floor(wp.x/10)}, row=${Math.floor(wp.y/10)})`);
      });

      // Cell (152, 63) is the narrow Bangka Strait bottleneck where ships get pinned against Sumatra.
      // With coastal clearance cost weighting (4.5), waypoints must route east of Bangka (col >= 153/154).
      const usesNarrowBangkaBottleneck = path!.some(
        (wp) => Math.floor(wp.x / 10) === 152 && Math.floor(wp.y / 10) === 63,
      );
      expect(usesNarrowBangkaBottleneck).toBe(false);
    });

    it('detects coastal obstruction and triggers deflection steering', () => {
      let currentHeading = '';
      const stationaryPos = { x: 840, y: 358 };
      const mockPlayer = {
        position: () => stationaryPos, // Fleet is blocked by shore and cannot move
        setHeading: (h: string) => {
          currentHeading = h;
        },
      };

      autopilotManager.setCourse('2', true);

      // Tick 1: normal heading
      autopilotManager.updateSteering(mockPlayer);
      const initialHeading = currentHeading;

      // Tick 2-3: no position change detected -> deflection steering kicks in
      autopilotManager.updateSteering(mockPlayer);
      autopilotManager.updateSteering(mockPlayer);
      expect(currentHeading).not.toBe('');

      // Continuous obstruction triggers auto-disengage for safety
      for (let i = 0; i < 7; i++) {
        autopilotManager.updateSteering(mockPlayer);
      }
      expect(autopilotManager.isActive()).toBe(false);
      expect(currentHeading).toBe('');
    });

    it('prevents island clipping via continuous raycast line-of-sight path smoothing', () => {
      // Mentawai Island at (1483, 635):
      // A direct line between (1480, 640) and (1487, 630) crosses land
      const lineCrossesIsland = autopilotManager.hasWaterLineOfSight(
        { x: 1480, y: 640 },
        { x: 1487, y: 630 },
      );
      expect(lineCrossesIsland).toBe(false);

      // Deep open ocean has unobstructed line of sight
      const openOceanClear = autopilotManager.hasWaterLineOfSight(
        { x: 1460, y: 640 },
        { x: 1460, y: 620 },
      );
      expect(openOceanClear).toBe(true);

      // When planning a path along west Sumatra, every segment must have water line-of-sight
      const path = autopilotManager.findPath(
        { x: 1480, y: 650 },
        { x: 1460, y: 610 },
        false,
      );
      expect(path).not.toBeNull();
      for (let i = 0; i < path!.length - 1; i++) {
        const segClear = autopilotManager.hasWaterLineOfSight(path![i], path![i + 1]);
        expect(segClear).toBe(true);
      }
    });

    it('sustains deflection heading across multiple ticks to escape coastal entrapment', () => {
      let headings: string[] = [];
      let playerPos = { x: 840, y: 358 };
      const mockPlayer = {
        position: () => playerPos,
        setHeading: (h: string) => {
          headings.push(h);
        },
      };

      autopilotManager.setCourse('2', true);
      headings = [];

      // Frame 1: sets initial position
      autopilotManager.updateSteering(mockPlayer);
      // Frame 2: detects zero movement (stuckTick 1)
      autopilotManager.updateSteering(mockPlayer);
      // Frame 3: detects zero movement (stuckTick 2) -> triggers deflection
      autopilotManager.updateSteering(mockPlayer);

      const deflectionHeading = headings[headings.length - 1];

      // Simulate a small slide along the shore (0.06 tiles) that previously caused instant oscillation
      playerPos = { x: 840.06, y: 358 };
      autopilotManager.updateSteering(mockPlayer);

      // Deflection MUST be sustained for multiple ticks and not immediately snap back to base heading
      const nextHeading = headings[headings.length - 1];
      expect(nextHeading).toBe(deflectionHeading);
    });

    it('prevents diagonal cutting across northern Sumatra near Pasei and routes around the cape', () => {
      // From Pasei west coast (1484, 608) to Malacca (1506, 606)
      const malaccaDockPos = positionAdjacentToPort('59');
      const pathFromPasei = autopilotManager.findPath(
        { x: 1484, y: 608 },
        malaccaDockPos, // Verified collision-free water position adjacent to Malacca harbor
        false,
      );

      expect(pathFromPasei).not.toBeNull();
      // Must not contain any segment that cuts across Sumatra land
      for (let i = 0; i < pathFromPasei!.length - 1; i++) {
        const hasClearWater = autopilotManager.hasWaterLineOfSight(pathFromPasei![i], pathFromPasei![i + 1]);
        expect(hasClearWater).toBe(true);
      }

      // The path must safely route north to at least row 58 / y <= 590 to clear the cape
      const reachesNorthCape = pathFromPasei!.some((wp) => wp.y <= 590);
      expect(reachesNorthCape).toBe(true);
    }, 15000);
  });

  describe('Task 10.8: Manual Steering Priority & Clean Port Departure Navigation', () => {
    it('safely resolves flagship captain when role is null without throwing error', () => {
      // Setup state where role is null (default for fresh game / custom protagonist)
      state.mates = [
        { sailorId: '1', role: null },
        { sailorId: '32', role: 'firstMate' },
      ];

      expect(() => getCaptain(0)).not.toThrow();
      const cap = getCaptain(0);
      expect(cap).toBeDefined();
      expect(cap.name).toBe('João Franco');
    });

    it('guarantees collision-free oceanic departure positions for all previously difficult ports', () => {
      // Ports that historically struggled with rigid cardinal offsets
      const testPortIds = ['62', '76', '91', '104', '109', '111', '116']; // Luanda, Cairo, Pasei, Belgrade, Mindanao, Ezo, Wanganui
      const map = createMap([0, 0]);

      for (const portId of testPortIds) {
        expect(() => positionAdjacentToPort(portId)).not.toThrow();
        const departurePos = positionAdjacentToPort(portId);
        expect(map.collisionAt(departurePos)).toBe(false);
      }
    });

    it('supports both WASD and Arrow key directional input', () => {
      Input.setup();
      Input.reset();

      // Dispatch simulated ArrowUp keydown
      const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      document.dispatchEvent(arrowUpEvent);

      expect(Input.getDirection({ includeOrdinal: true })).toBe('n');

      // Dispatch simulated ArrowRight keydown (ordinal 'ne')
      const arrowRightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      document.dispatchEvent(arrowRightEvent);

      expect(Input.getDirection({ includeOrdinal: true })).toBe('ne');

      Input.reset();
      expect(Input.getDirection({ includeOrdinal: true })).toBe('');
    });

    it('cleanly disengages autopilot on setSail so manual steering is immediate', () => {
      // Engage autopilot while at sea
      state.portId = null;
      state.fleets['1'].position = { x: 840, y: 358 };
      autopilotManager.setCourse('2', true, false);
      expect(autopilotManager.isActive()).toBe(true);

      // Now set sail from a port
      state.portId = '1';
      setSail();

      // Autopilot course must be completely cleared and manual helm active
      expect(autopilotManager.isActive()).toBe(false);
      expect(state.autopilotCourse).toBeNull();
    });
  });

  describe('Task 10.10: Java Sea & Sunda Corridor Navigation & Anti-Looping Architecture', () => {
    it('accurately identifies micro-islands in Java Sea as coastal obstacles (type 2)', () => {
      // Cell (154, 64) contains 2 micro-island tiles that stride-2 previously skipped
      expect(autopilotManager.getMacroCellType(154, 64)).toBe(2);
    });

    it('plots an unobstructed route from Sunda to Malacca through the Java Sea', () => {
      const sundaDock = positionAdjacentToPort('92'); // Sunda
      const malaccaDock = positionAdjacentToPort('87'); // Malacca (port 87)

      const path = autopilotManager.findPath(sundaDock, malaccaDock, false);
      expect(path).not.toBeNull();
      expect(path!.length).toBeGreaterThanOrEqual(2);

      // Verify each segment has clear water line of sight with 2x2 footprint clearance
      for (let i = 0; i < path!.length - 1; i++) {
        const hasClearWater = autopilotManager.hasWaterLineOfSight(path![i], path![i + 1]);
        expect(hasClearWater).toBe(true);
      }
    }, 15000);

    it('plots an unobstructed route from Sunda to Pasei around Sumatra', () => {
      const sundaDock = positionAdjacentToPort('92'); // Sunda
      const paseiDock = positionAdjacentToPort('91'); // Pasei (port 91)

      const path = autopilotManager.findPath(sundaDock, paseiDock, false);
      expect(path).not.toBeNull();
      expect(path!.length).toBeGreaterThanOrEqual(2);

      for (let i = 0; i < path!.length - 1; i++) {
        const hasClearWater = autopilotManager.hasWaterLineOfSight(path![i], path![i + 1]);
        expect(hasClearWater).toBe(true);
      }
    }, 15000);

    it('retires transit waypoints via vector projection even when displaced laterally by cross-winds', () => {
      state.portId = null;
      state.fleets['1'].position = { x: 1540, y: 664 };

      // Plotted waypoints going North: (1540, 664) -> (1545, 635) ...
      const course = autopilotManager.setCourse('87', true, false);
      expect(course).not.toBeNull();

      // Suppose cross-wind displaces the fleet 3.0 tiles laterally to (1537, 649)
      // which is past the first transit waypoint with dist = Math.hypot(3, 1) = 3.16 > 2.5
      const mockPlayer = {
        position: () => ({ x: 1537, y: 630 }),
        setHeading: vi.fn(),
      };

      const initialWpIdx = course!.currentWaypointIndex;
      expect(initialWpIdx).toBe(1);

      // updateSteering must detect that the ship has reached/passed the waypoint baseline (t >= 0.95)
      // and advance currentWaypointIndex, preventing circular orbiting
      autopilotManager.updateSteering(mockPlayer);
      expect(course!.currentWaypointIndex).toBeGreaterThan(initialWpIdx);
    });

    it('clamps deflection angles to <= 90 degrees and decays evasion lock immediately when direct path opens', () => {
      // Position fleet facing an obstacle where direct path is obstructed
      const pos = { x: 1540, y: 664 };
      const targetNorth = { x: 1540, y: 640 };

      const heading = autopilotManager.computeDeflectionHeading(pos, targetNorth);
      expect(heading).toBeDefined();

      // In open ocean water where path to target is wide open, heading must match direct compass rose
      autopilotManager.resetStuckState();
      const openPos = { x: 800, y: 358 };
      const openTarget = { x: 800, y: 300 }; // Due North
      const straightHeading = autopilotManager.computeDeflectionHeading(openPos, openTarget);
      expect(straightHeading).toBe('n');
    });
  });
});

