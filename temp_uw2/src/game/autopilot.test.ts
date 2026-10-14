import { describe, it, expect, beforeEach } from 'vitest';
import autopilotManager, {
  MACRO_COLS,
  MACRO_ROWS,
  TOTAL_MACRO_CELLS,
} from './world/autopilotManager';
import state from '../state/state';
import seaWeather from './world/seaWeather';

describe('Milestone 10: Port Autopilot Navigation & Maritime Course Plotting', () => {
  beforeEach(() => {
    autopilotManager.cancelCourse();
    seaWeather.clearWeather();
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

      const waypoints = autopilotManager.findPath(start, destination);
      expect(waypoints.length).toBeGreaterThanOrEqual(2);
      expect(waypoints[0]).toEqual(start);
      expect(waypoints[waypoints.length - 1]).toEqual(destination);
    });

    it('supports cylindrical X-axis wrap-around across Pacific seams', () => {
      // East Asian waters X=2150 to American West Coast X=10
      const westSeam = { x: 2150, y: 500 };
      const eastSeam = { x: 10, y: 500 };

      const waypoints = autopilotManager.findPath(westSeam, eastSeam);
      expect(waypoints.length).toBeGreaterThanOrEqual(2);
      expect(waypoints[0]).toEqual(westSeam);
      expect(waypoints[waypoints.length - 1]).toEqual(eastSeam);
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
});
