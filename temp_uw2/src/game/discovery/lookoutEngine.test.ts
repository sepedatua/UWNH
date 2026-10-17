import { describe, it, expect, beforeEach } from 'vitest';
import state from '../../state/state';
import {
  checkLookoutSightings,
  calculateCompassBearing,
  getWrappedDistance,
  LANDING_PROXIMITY_TILES,
} from './lookoutEngine';
import {
  setCrewAssignment,
  applyCrewPreset,
  getFlagshipCrewDutyStats,
  recordVillageDiscovery,
  recordSupplyPortDiscovery,
  recordPortDiscovery,
  isVillageDiscovered,
  isSupplyPortDiscovered,
  isPortDiscovered,
} from '../../state/actionsCrew';
import { calculateSightRadius, BASE_SIGHT_TILES } from '../world/fogOfWarRenderer';
import { villages } from '../../data/villageData';
import { supplyPorts, regularPorts } from '../../data/portData';
import getShipSpeed from '../world/shipSpeed';
import { Sailor } from '../../data/sailorData';

describe('Milestone 13: Crow’s Nest Lookout & Proximity Detection System', () => {
  beforeEach(() => {
    state.discoveredVillages = [];
    state.discoveredSupplyPorts = [];
    state.discoveredPorts = ['1', '2', '3']; // Lisbon, Ceuta, Madeira known by default
    state.crewAssignment = { navigation: 70, lookout: 20, combat: 10 };
    state.fame = { adventure: 0, trade: 0, piracy: 0 };
    state.items = [];
    state.mates = [
      { sailorId: '1', role: null },
      { sailorId: '32', role: null, stats: { intuition: 85, knowledge: 80 } as any },
    ];
    state.fleets = {
      '1': {
        position: { x: 840, y: 358 },
        ships: [
          {
            id: '1',
            name: 'Hermes',
            crew: 30,
            maxCrew: 50,
            durability: 50,
            cargo: [],
          },
        ],
      },
    } as any;
  });

  describe('Part 1: Crew Duty Allocation & Presets', () => {
    it('initializes default crew assignment to 70% Navigation, 20% Lookout, 10% Combat', () => {
      const stats = getFlagshipCrewDutyStats();
      expect(stats.totalCrew).toBe(30);
      expect(stats.minimumCrew).toBe(5); // Balsa has minimumCrew: 5
      expect(stats.navCrew).toBe(21); // 70% of 30 = 21
      expect(stats.lookoutCrew).toBe(6); // 20% of 30 = 6
      expect(stats.combatCrew).toBe(3); // 10% of 30 = 3
      expect(stats.isNavDeficient).toBe(false);
      expect(stats.navFactor).toBe(1.0);
    });

    it('normalizes custom crew assignment percentages to always sum to exactly 100%', () => {
      const res = setCrewAssignment({ navigation: 50, lookout: 50, combat: 50 });
      expect(res.assignment.navigation + res.assignment.lookout + res.assignment.combat).toBe(100);
      expect(state.crewAssignment?.navigation).toBe(res.assignment.navigation);
    });

    it('applies classic Koei Age of Exploration presets', () => {
      applyCrewPreset('voyage');
      expect(state.crewAssignment).toEqual({ navigation: 80, lookout: 20, combat: 0 });

      applyCrewPreset('exploration');
      expect(state.crewAssignment).toEqual({ navigation: 50, lookout: 40, combat: 10 });

      applyCrewPreset('combat');
      expect(state.crewAssignment).toEqual({ navigation: 40, lookout: 10, combat: 50 });

      applyCrewPreset('balanced');
      expect(state.crewAssignment).toEqual({ navigation: 60, lookout: 20, combat: 20 });
    });

    it('detects understaffed navigation duty when nav crew falls below ship minimum requirement', () => {
      // Balsa needs 5 min crew. With 6 total crew and 50% nav duty, navCrew = 3 < 5
      state.fleets['1'].ships[0].crew = 6;
      setCrewAssignment({ navigation: 50, lookout: 40, combat: 10 });

      const stats = getFlagshipCrewDutyStats();
      expect(stats.navCrew).toBe(3);
      expect(stats.isNavDeficient).toBe(true);
      expect(stats.navFactor).toBeCloseTo(3 / 5, 2);
    });
  });

  describe('Part 2: Dynamic Line-of-Sight Scaling with Lookout Duty', () => {
    it('scales sight radius with Lookout crew ratio (0% penalty to 40% bonus)', () => {
      // 20% Lookout is baseline 1.0x (14 tiles)
      setCrewAssignment({ navigation: 80, lookout: 20, combat: 0 });
      let sight = calculateSightRadius();
      expect(sight.crewLookoutFactor).toBe(1.0);
      expect(sight.finalRadiusTiles).toBe(BASE_SIGHT_TILES);

      // 0% Lookout (blind watch) applies 0.5x penalty (7 tiles)
      setCrewAssignment({ navigation: 90, lookout: 0, combat: 10 });
      sight = calculateSightRadius();
      expect(sight.crewLookoutFactor).toBe(0.5);
      expect(sight.finalRadiusTiles).toBe(7.0);

      // 40% Lookout applies 1.5x bonus (21 tiles)
      setCrewAssignment({ navigation: 50, lookout: 40, combat: 10 });
      sight = calculateSightRadius();
      expect(sight.crewLookoutFactor).toBe(1.5);
      expect(sight.finalRadiusTiles).toBe(21.0);
    });

    it('stacks Lookout crew duty with Chief Lookout officer stats and brass Telescope', () => {
      // 40% Lookout + Officer + Telescope
      setCrewAssignment({ navigation: 50, lookout: 40, combat: 10 });
      state.mates[1].role = 'lookout'; // High intuition officer
      state.items = ['25']; // Telescope (+30%)

      const sight = calculateSightRadius();
      expect(sight.crewLookoutFactor).toBe(1.5);
      expect(sight.lookoutBonus).toBeGreaterThan(0.3);
      expect(sight.telescopeBonus).toBe(0.3);
      // Base 14 * 1.5 * ~1.7 = ~35 tiles
      expect(sight.finalRadiusTiles).toBeGreaterThan(30);
    });
  });

  describe('Part 3: Compass Bearings & Cylindrical Wrap Distance', () => {
    it('accurately computes 8-directional compass bearings', () => {
      expect(calculateCompassBearing(10, 0)).toBe('E');
      expect(calculateCompassBearing(10, 10)).toBe('SE');
      expect(calculateCompassBearing(0, 10)).toBe('S');
      expect(calculateCompassBearing(-10, 10)).toBe('SW');
      expect(calculateCompassBearing(-10, 0)).toBe('W');
      expect(calculateCompassBearing(-10, -10)).toBe('NW');
      expect(calculateCompassBearing(0, -10)).toBe('N');
      expect(calculateCompassBearing(10, -10)).toBe('NE');
    });

    it('handles cylindrical X-wrap across Pacific/Atlantic boundary (2160 columns)', () => {
      const posA = { x: 10, y: 500 };
      const posB = { x: 2150, y: 500 };

      const { dx, dist } = getWrappedDistance(posA, posB);
      // Distance should be 20 tiles, not 2140!
      expect(Math.abs(dx)).toBe(20);
      expect(dist).toBe(20);
    });
  });

  describe('Part 4: Village Proximity Detection & First-Time Discovery Fame', () => {
    it('detects an uncharted village within active line-of-sight and awards +50 Adventure Fame', () => {
      // Isolate village discovery by marking ports as known
      state.discoveredPorts = regularPorts.map((_, i) => String(i + 1));

      // Stonehenge settlement: x: 890, y: 265
      const vStonehenge = villages[0];
      expect(vStonehenge.name).toContain('Stonehenge');

      // Place player 12 tiles away (within 14-tile sight)
      const playerPos = { x: vStonehenge.position.x - 8, y: vStonehenge.position.y - 8 };

      expect(isVillageDiscovered(vStonehenge.id)).toBe(false);
      expect(state.fame.adventure).toBe(0);

      const result = checkLookoutSightings(playerPos);
      expect(result.sightedVillages.some((v) => v.id === vStonehenge.id)).toBe(true);
      expect(result.newDiscoveries.length).toBeGreaterThan(0);

      const discoveryEvent = result.newDiscoveries.find((d) => d.id === vStonehenge.id);
      expect(discoveryEvent).toBeDefined();
      expect(discoveryEvent?.type).toBe('village');
      expect(discoveryEvent?.fameAwarded).toBe(50);
      expect(discoveryEvent?.bearing).toBe('SE');

      // Verify state was persisted
      expect(isVillageDiscovered(vStonehenge.id)).toBe(true);
      expect(state.fame.adventure).toBe(50);
    });

    it('does not re-award fame or duplicate discovery events on subsequent ticks', () => {
      state.discoveredPorts = regularPorts.map((_, i) => String(i + 1));
      const vStonehenge = villages[0];
      const playerPos = { x: vStonehenge.position.x - 5, y: vStonehenge.position.y };

      // First tick: discovers village
      checkLookoutSightings(playerPos);
      expect(state.fame.adventure).toBe(50);

      // Second tick at same position
      const secondResult = checkLookoutSightings(playerPos);
      expect(secondResult.newDiscoveries.some((d) => d.id === vStonehenge.id)).toBe(false);
      expect(state.fame.adventure).toBe(50); // Did not double
    });

    it('detects landing proximity when player flagship is within 4 tiles of the village', () => {
      const vStonehenge = villages[0];
      // 3 tiles away: within landing proximity
      const closePos = { x: vStonehenge.position.x + 2, y: vStonehenge.position.y + 2 };
      const closeResult = checkLookoutSightings(closePos);
      expect(closeResult.nearbyLandingVillage?.id).toBe(vStonehenge.id);

      // 10 tiles away: sighted on horizon, but cannot land yet
      const farPos = { x: vStonehenge.position.x + 7, y: vStonehenge.position.y + 7 };
      const farResult = checkLookoutSightings(farPos);
      expect(farResult.sightedVillages.some((v) => v.id === vStonehenge.id)).toBe(true);
      expect(farResult.nearbyLandingVillage).toBeNull();
    });
  });

  describe('Part 5: Supply Haven Horizon Detection', () => {
    it('detects uncharted supply ports on the horizon and awards +100 Adventure Fame', () => {
      // Supply Port 0: Hekla (x: 784, y: 210)
      const sp = supplyPorts[0];
      expect(sp.name).toBe('Hekla');
      const portId = '101';

      const playerPos = { x: sp.position.x - 8, y: sp.position.y };

      expect(isSupplyPortDiscovered(portId)).toBe(false);
      expect(state.fame.adventure).toBe(0);

      const result = checkLookoutSightings(playerPos);
      expect(result.sightedSupplyPorts.some((p) => p.name === 'Hekla')).toBe(true);

      const spEvent = result.newDiscoveries.find((d) => d.id === portId);
      expect(spEvent).toBeDefined();
      expect(spEvent?.type).toBe('supplyPort');
      expect(spEvent?.fameAwarded).toBe(100);

      expect(isSupplyPortDiscovered(portId)).toBe(true);
      expect(state.fame.adventure).toBe(100);
    });
  });

  describe('Part 6: Ship Speed & Navigation Duty Integration', () => {
    it('scales ship speed proportionally when navigation crew ratio drops below required minimum', () => {
      const sailor = { navigationLevel: 1, stats: { seamanship: 80 } } as Sailor;
      const ship = { id: '1', cargo: [], crew: 5 }; // minimumCrew is 5

      // At 100% nav duty: full speed
      const fullSpeed = getShipSpeed(ship, sailor, 0, { direction: 0, speed: 3 }, undefined, 1.0);
      expect(fullSpeed).toBeGreaterThan(0);

      // At 50% nav duty: navCrew is 2.5 < 5, speed is halved
      const halfSpeed = getShipSpeed(ship, sailor, 0, { direction: 0, speed: 3 }, undefined, 0.5);
      expect(halfSpeed).toBeCloseTo(fullSpeed * 0.5, 1);
    });
  });

  describe('Part 7: Regular Trade Port Horizon Detection', () => {
    it('detects uncharted foreign commercial ports and awards +25 Adventure Fame', () => {
      // Port 4 is Porto or similar (regularPorts[3])
      const foreignPort = regularPorts[3];
      const portId = '4';

      expect(state.discoveredPorts?.includes(portId)).toBe(false);
      expect(isPortDiscovered(portId)).toBe(false);
      expect(state.fame.adventure).toBe(0);

      // Place player 9 tiles away (within 14-tile sight)
      const playerPos = { x: foreignPort.position.x - 6, y: foreignPort.position.y - 6 };
      const result = checkLookoutSightings(playerPos);

      expect(result.sightedPorts.some((p) => p.id === portId)).toBe(true);
      const portEvent = result.newDiscoveries.find((d) => d.id === portId);
      expect(portEvent).toBeDefined();
      expect(portEvent?.type).toBe('port');
      expect(portEvent?.fameAwarded).toBe(25);
      expect(portEvent?.name).toBe(foreignPort.name);

      expect(isPortDiscovered(portId)).toBe(true);
      expect(state.fame.adventure).toBe(25);
    });

    it('does not re-notify or award fame for known home ports like Lisbon', () => {
      // Lisbon is Port '1'
      const lisbon = regularPorts[0];
      expect(state.discoveredPorts?.includes('1')).toBe(true);

      const playerPos = { x: lisbon.position.x - 5, y: lisbon.position.y };
      const result = checkLookoutSightings(playerPos);

      // Sighted in visual horizon: yes
      expect(result.sightedPorts.some((p) => p.id === '1')).toBe(true);
      // New discovery event: NO (already known)
      expect(result.newDiscoveries.some((d) => d.id === '1')).toBe(false);
      expect(state.fame.adventure).toBe(0);
    });
  });
});
