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

  test('prolonged voyage at sea for over 30 days triggers scurvy evaluation', () => {
    state.dayAtSea = 35;
    // Mock Math.random to trigger scurvy
    const originalRandom = Math.random;
    Math.random = () => 0.1; // < 0.25 threshold

    const result = processDailySurvival();

    Math.random = originalRandom;

    expect(result.scurvy).toBe(true);
    expect(result.moraleChange).toEqual(-8);
    expect(result.casualties).toBeGreaterThan(0);
    expect(result.alert?.text).toContain('SCURVY OUTBREAK');
  });
});
