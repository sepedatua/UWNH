import { beforeEach, describe, expect, test, vi } from 'vitest';
import state from '../../state/state';
import { processDailySurvival } from './voyageSurvival';

describe('voyageSurvival', () => {
  beforeEach(() => {
    state.morale = 80;
    state.isAlive = true;
    state.dayAtSea = 5;
    state.gameMode = 'sp_endless';
    state.fleets = {
      '1': {
        position: { x: 840, y: 358 },
        ships: [
          {
            id: '1',
            name: 'Flagship',
            crew: 20,
            durability: 30,
            cargo: [
              { type: 'water', quantity: 10 },
              { type: 'food', quantity: 10 },
            ],
          },
        ],
      },
    };
  });

  test('normal daily consumption deducts 1 water and 1 food per 10 sailors', () => {
    const result = processDailySurvival();

    expect(result.waterConsumed).toEqual(2);
    expect(result.foodConsumed).toEqual(2);
    expect(result.waterShortage).toBe(false);
    expect(result.foodShortage).toBe(false);
    expect(result.casualties).toEqual(0);
    expect(state.morale).toEqual(80);

    const ship = state.fleets['1'].ships[0];
    const water = ship.cargo.find((c) => c.type === 'water')?.quantity;
    const food = ship.cargo.find((c) => c.type === 'food')?.quantity;
    expect(water).toEqual(8);
    expect(food).toEqual(8);
  });

  test('triggers dehydration penalty and casualties when water is depleted', () => {
    state.fleets['1'].ships[0].cargo = [
      { type: 'water', quantity: 0 },
      { type: 'food', quantity: 10 },
    ];

    const initialCrew = state.fleets['1'].ships[0].crew;
    const result = processDailySurvival();

    expect(result.waterShortage).toBe(true);
    expect(result.casualties).toBeGreaterThan(0);
    expect(state.morale).toBeLessThan(80);
    expect(state.fleets['1'].ships[0].crew).toBeLessThan(initialCrew);
    expect(result.alert?.type).toEqual('danger');
    expect(result.alert?.text).toContain('DEHYDRATION');
  });

  test('triggers starvation penalty and casualties when food is depleted', () => {
    state.fleets['1'].ships[0].cargo = [
      { type: 'water', quantity: 10 },
      { type: 'food', quantity: 0 },
    ];

    const initialCrew = state.fleets['1'].ships[0].crew;
    const result = processDailySurvival();

    expect(result.foodShortage).toBe(true);
    expect(result.casualties).toBeGreaterThan(0);
    expect(state.morale).toBeLessThan(80);
    expect(state.fleets['1'].ships[0].crew).toBeLessThan(initialCrew);
    expect(result.alert?.type).toEqual('danger');
    expect(result.alert?.text).toContain('STARVATION');
  });

  test('triggers ghost ship and game over when all crew perish', () => {
    state.fleets['1'].ships[0].crew = 0;

    const result = processDailySurvival();

    expect(result.allCrewLost).toBe(true);
    expect(state.isAlive).toBe(false);
    expect(result.alert?.text).toContain('Ghost ship');
  });

  test('prolonged voyage at sea for 50 or more days triggers scurvy evaluation', () => {
    state.dayAtSea = 55;
    state.items = [];
    const originalRandom = Math.random;
    Math.random = () => 0.1; // < 0.25 threshold

    const result = processDailySurvival();

    Math.random = originalRandom;

    expect(result.scurvy).toBe(true);
    expect(result.moraleChange).toEqual(-8);
    expect(result.casualties).toBeGreaterThan(0);
    expect(result.alert?.text).toContain('SCURVY OUTBREAK');
  });

  test('administers Lime Juice to avert scurvy casualties and morale drop', () => {
    state.dayAtSea = 55;
    state.items = ['44']; // Lime Juice
    const originalRandom = Math.random;
    Math.random = () => 0.1;

    const result = processDailySurvival();

    Math.random = originalRandom;

    expect(result.scurvy).toBe(false);
    expect(result.limeJuiceUsed).toBe(true);
    expect(result.casualties).toEqual(0);
    expect(state.items).not.toContain('44');
    expect(result.alert?.text).toContain('SCURVY AVERTED');
  });

  test('fractional sailors accumulate and deduct accurately over time', () => {
    // 15 sailors consume 1.5 water and 1.5 food per day
    state.fleets['1'].ships[0].crew = 15;
    state.fleets['1'].ships[0].cargo = [
      { type: 'water', quantity: 10 },
      { type: 'food', quantity: 10 },
    ];
    state.waterAccumulator = 0;
    state.foodAccumulator = 0;

    // Day 1: 1.5 accumulated -> 1 barrel consumed, 0.5 leftover
    const day1 = processDailySurvival();
    expect(day1.waterConsumed).toEqual(1);
    expect(day1.foodConsumed).toEqual(1);
    expect(state.waterAccumulator).toBeCloseTo(0.5);
    expect(state.foodAccumulator).toBeCloseTo(0.5);

    // Day 2: 0.5 + 1.5 = 2.0 -> 2 barrels consumed, 0.0 leftover
    const day2 = processDailySurvival();
    expect(day2.waterConsumed).toEqual(2);
    expect(day2.foodConsumed).toEqual(2);
    expect(state.waterAccumulator).toBeCloseTo(0.0);
    expect(state.foodAccumulator).toBeCloseTo(0.0);

    // Total consumed over 2 days = 3 barrels
    const ship = state.fleets['1'].ships[0];
    expect(ship.cargo.find((c) => c.type === 'water')?.quantity).toEqual(7);
  });

  test('reduced rations stretches provisions but inflicts morale penalty', () => {
    state.fleets['1'].ships[0].crew = 20;
    state.fleets['1'].ships[0].cargo = [
      { type: 'water', quantity: 10 },
      { type: 'food', quantity: 10 },
    ];
    state.waterAccumulator = 0;
    state.foodAccumulator = 0;
    state.rationRate = 50; // Half rations: 20 crew * 0.1 * 0.5 = 1.0/day instead of 2.0/day

    const result = processDailySurvival();

    expect(result.waterConsumed).toEqual(1);
    expect(result.foodConsumed).toEqual(1);
    // At 50% rations, -2 morale penalty is applied
    expect(state.morale).toEqual(78);
  });
});
