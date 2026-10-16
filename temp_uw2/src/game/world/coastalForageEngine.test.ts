import { beforeEach, describe, expect, test, vi } from 'vitest';
import state from '../../state/state';
import {
  isLocationDepleted,
  checkCoastStatus,
  conductShoreExpedition,
  stowForagedProvisions,
  getShoreRepairStatus,
  repairShipOnShore,
  repairEntireFleetOnShore,
  FIELD_REPAIR_CEILING_RATIO,
} from './coastalForageEngine';
import Assets from '../../assets';

describe('coastalForageEngine', () => {
  beforeEach(() => {
    state.morale = 80;
    state.isAlive = true;
    state.portId = null;
    state.dayAtSea = 10;
    state.timePassed = 480; // 08:00 AM
    state.foragedLocations = [];
    state.rationRate = 100;
    state.waterAccumulator = 0;
    state.foodAccumulator = 0;

    state.fleets = {
      '1': {
        position: { x: 840, y: 358 },
        ships: [
          {
            id: '1', // Caravel (max dur: 30, capacity: 45, minCrew: 4)
            name: 'Santa Maria',
            crew: 20,
            durability: 20, // Damaged (max 30, 80% ceiling = 24)
            cargo: [
              { type: 'water', quantity: 10 },
              { type: 'food', quantity: 10 },
              { type: 'lumber', quantity: 5 },
            ],
          },
        ],
      },
    };
  });

  describe('depletion zone & cylindrical wrapping', () => {
    test('marks locations within 4 tiles as depleted', () => {
      state.foragedLocations = [{ x: 100, y: 200, day: 1 }];

      // Within 4 tiles
      expect(isLocationDepleted({ x: 102, y: 201 })).toBe(true);
      // At exact 4 tiles distance (hypot(3, 2) ~ 3.6 <= 4)
      expect(isLocationDepleted({ x: 103, y: 202 })).toBe(true);
      // Beyond 4 tiles
      expect(isLocationDepleted({ x: 105, y: 200 })).toBe(false);
      expect(isLocationDepleted({ x: 100, y: 205 })).toBe(false);
    });

    test('respects world map cylindrical X-wrapping across meridian (x = 2160)', () => {
      // Location at eastern edge
      state.foragedLocations = [{ x: 2159, y: 500, day: 2 }];

      // Target at western edge (wrapped distance = 2 tiles)
      expect(isLocationDepleted({ x: 1, y: 500 })).toBe(true);
      // Beyond 4 tiles wrapped
      expect(isLocationDepleted({ x: 10, y: 500 })).toBe(false);
    });
  });

  describe('shore expedition & time advancement', () => {
    test('advances clock by 6 hours and grants morale on expedition', () => {
      const initialTime = state.timePassed;
      const initialMorale = state.morale;

      const result = conductShoreExpedition();

      expect(state.timePassed).toEqual(initialTime + 360); // 6 hours = 360 mins
      expect(result.hoursElapsed).toEqual(6);
      expect(result.waterFound).toBeGreaterThanOrEqual(15);
      expect(result.foodFound).toBeGreaterThanOrEqual(2);
      expect(result.lumberFound).toBeGreaterThanOrEqual(1);
      expect(state.morale).toBeGreaterThanOrEqual(initialMorale);
    });

    test('stows selected provisions into fleet cargo holds and records depletion', () => {
      const ship = state.fleets['1'].ships[0];
      const initialWater = ship.cargo.find((c) => c.type === 'water')?.quantity || 0;
      const initialFood = ship.cargo.find((c) => c.type === 'food')?.quantity || 0;

      const res = stowForagedProvisions(
        { water: 4, food: 2, lumber: 1 },
        { x: 500, y: 300 },
      );

      expect(res.success).toBe(true);
      expect(res.stowedWater).toEqual(4);
      expect(res.stowedFood).toEqual(2);
      expect(res.stowedLumber).toEqual(1);

      const updatedWater = ship.cargo.find((c) => c.type === 'water')?.quantity;
      expect(updatedWater).toEqual(initialWater + 4);

      // Check depletion recorded
      expect(isLocationDepleted({ x: 500, y: 300 })).toBe(true);
      expect(isLocationDepleted({ x: 502, y: 301 })).toBe(true);
    });
  });

  describe('light shore repair & 80% ceiling', () => {
    test('calculates 80% field repair ceiling and lumber cost (1 lumber = 5 dur)', () => {
      // Caravel: maxDurability = 30. 80% ceiling = 24.
      // Current dur = 20. Damage to ceiling = 4 pts. Lumber cost = ceil(4 / 5) = 1 lumber.
      const status = getShoreRepairStatus();

      expect(status.ships[0].maxDurability).toEqual(30);
      expect(status.ships[0].fieldCeiling).toEqual(24);
      expect(status.ships[0].currentDurability).toEqual(20);
      expect(status.ships[0].repairableDamage).toEqual(4);
      expect(status.ships[0].lumberCost).toEqual(1);
      expect(status.totalCargoLumber).toEqual(5);
    });

    test('repairs ship up to 80% ceiling and deducts lumber', () => {
      const res = repairShipOnShore(0);

      expect(res.success).toBe(true);
      const ship = state.fleets['1'].ships[0];
      expect(ship.durability).toEqual(24); // 80% ceiling reached!

      // Lumber deducted: was 5, 1 used -> 4 remaining
      const lumber = ship.cargo.find((c) => c.type === 'lumber')?.quantity;
      expect(lumber).toEqual(4);
    });

    test('blocks repair beyond 80% field ceiling with informative message', () => {
      state.fleets['1'].ships[0].durability = 25; // Already > 24 (80% ceiling)

      const res = repairShipOnShore(0);

      expect(res.success).toBe(false);
      expect(res.message).toContain('80% field repair ceiling');
    });

    test('repairs entire fleet to 80% ceiling', () => {
      state.fleets['1'].ships = [
        {
          id: '1',
          name: 'Ship 1',
          crew: 15,
          durability: 18, // max 30, ceiling 24, damage 6 -> needs 2 lumber
          cargo: [{ type: 'lumber', quantity: 10 }],
        },
        {
          id: '1',
          name: 'Ship 2',
          crew: 15,
          durability: 20, // max 30, ceiling 24, damage 4 -> needs 1 lumber
          cargo: [],
        },
      ];

      const res = repairEntireFleetOnShore();

      expect(res.success).toBe(true);
      expect(res.totalLumberUsed).toEqual(3); // 2 + 1 = 3 lumber
      expect(state.fleets['1'].ships[0].durability).toEqual(24);
      expect(state.fleets['1'].ships[1].durability).toEqual(24);
      expect(state.fleets['1'].ships[0].cargo[0].quantity).toEqual(7); // 10 - 3 = 7
    });
  });
});
