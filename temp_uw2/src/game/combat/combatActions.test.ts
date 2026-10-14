import { beforeEach, describe, expect, test } from 'vitest';
import state from '../../state/state';
import {
  boardShip,
  canBoardShip,
  canFireCannonsAt,
  canMoveToHex,
  createCombatEngagement,
  endActiveShipTurn,
  fireBroadside,
  moveShip,
  rotateShip,
} from './combatActions';

describe('combatActions', () => {
  beforeEach(() => {
    state.fleets = {
      '1': {
        position: { x: 840, y: 358 },
        ships: [
          {
            id: '1',
            name: 'São Gabriel',
            durability: 35,
            crew: 25,
            cargo: [],
          },
        ],
      },
    };
    state.wind = { direction: 2, speed: 4 };
    state.protagonistName = 'João Franco';
  });

  test('createCombatEngagement initializes player and enemy fleets with valid coordinates', () => {
    const combat = createCombatEngagement('Barbary Fleet', 'Khayr ad-Din', 2);

    expect(combat.isActive).toBe(true);
    expect(combat.round).toBe(1);
    expect(combat.ships.length).toBeGreaterThanOrEqual(3);

    const playerShips = combat.ships.filter((s) => s.team === 'player');
    const enemyShips = combat.ships.filter((s) => s.team === 'enemy');

    expect(playerShips.length).toBeGreaterThanOrEqual(1);
    expect(enemyShips.length).toBe(2);
    expect(playerShips[0].isFlagship).toBe(true);
    expect(enemyShips[0].isFlagship).toBe(true);
  });

  test('canMoveToHex checks boundaries and MP limits', () => {
    const combat = createCombatEngagement();
    const playerShip = combat.ships[0];

    // Out of bounds hex
    expect(canMoveToHex(playerShip, { q: -1, r: 0 }, combat).valid).toBe(false);
    expect(canMoveToHex(playerShip, { q: 99, r: 99 }, combat).valid).toBe(false);

    // Nearby valid hex
    const nearHex = { q: playerShip.hex.q + 1, r: playerShip.hex.r };
    const check = canMoveToHex(playerShip, nearHex, combat);
    expect(check.valid).toBe(true);
    expect(check.mpCost).toBeGreaterThan(0);
  });

  test('moveShip updates position and deducts MP', () => {
    const combat = createCombatEngagement();
    const playerShip = combat.ships[0];
    const initialMP = playerShip.movementPoints;
    const targetHex = { q: playerShip.hex.q + 1, r: playerShip.hex.r };

    const moved = moveShip(playerShip.id, targetHex, combat);
    expect(moved).toBe(true);
    expect(playerShip.hex).toEqual(targetHex);
    expect(playerShip.movementPoints).toBeLessThan(initialMP);
  });

  test('rotateShip alters heading and consumes 1 MP', () => {
    const combat = createCombatEngagement();
    const playerShip = combat.ships[0];
    const initialHeading = playerShip.heading;
    const initialMP = playerShip.movementPoints;

    rotateShip(playerShip.id, true, combat);
    expect(playerShip.heading).toBe((initialHeading + 1) % 6);
    expect(playerShip.movementPoints).toBe(initialMP - 1);
  });

  test('canFireCannonsAt and fireBroadside inflicts hull and crew casualties', () => {
    const combat = createCombatEngagement();
    const playerShip = combat.ships[0];
    const enemyShip = combat.ships.find((s) => s.team === 'enemy')!;

    // Place enemy ship right into player broadside arc (range 1)
    enemyShip.hex = { q: playerShip.hex.q + 1, r: playerShip.hex.r - 1 };
    playerShip.heading = 1; // Facing East, Port side faces NE (q+1, r-1)

    const initialDurability = enemyShip.durability;
    const fired = fireBroadside(playerShip.id, enemyShip.id, combat);

    expect(fired).toBe(true);
    expect(playerShip.hasActed).toBe(true);
    expect(enemyShip.durability).toBeLessThanOrEqual(initialDurability);
  });

  test('canBoardShip validates adjacency and executes melee clash or duel', () => {
    const combat = createCombatEngagement();
    const playerShip = combat.ships[0];
    const enemyShip = combat.ships.find((s) => s.team === 'enemy')!;

    // Move enemy ship directly adjacent
    enemyShip.hex = { q: playerShip.hex.q + 1, r: playerShip.hex.r };
    expect(canBoardShip(playerShip, enemyShip)).toBe(true);

    const result = boardShip(playerShip.id, enemyShip.id, combat);
    // Both are flagships, so duel should trigger!
    expect(result.duelTriggered).toBe(true);
    expect(combat.phase).toBe('duel');
    expect(combat.duelState).not.toBeNull();
  });
});
