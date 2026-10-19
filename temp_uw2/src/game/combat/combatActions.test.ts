import { beforeEach, describe, expect, test } from 'vitest';
import state from '../../state/state';
import {
  boardShip,
  canBoardShip,
  canFireCannonsAt,
  canMoveToHex,
  commissionPrizeShip,
  createCombatEngagement,
  deductPlayerShot,
  endActiveShipTurn,
  finalizeCombatResults,
  fireBroadside,
  fleeShip,
  moveShip,
  rotateShip,
  scuttlePrizeShip,
  setConsortOrder,
  setFleetPlan,
} from './combatActions';
import { staggeredBroadsideHexes } from './hexUtils';
import { endCombat, triggerCombat } from '../../state/actionsWorld';
import npcFleetManager from '../world/npcFleetManager';
import { getClosestRegularPort } from '../port/portUtils';

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

    // Place enemy ship right into player port broadside arc (range 1)
    const { port } = staggeredBroadsideHexes(playerShip.hex, playerShip.heading, 1);
    enemyShip.hex = { ...port[0] };

    const initialDurability = enemyShip.durability;
    const fired = fireBroadside(playerShip.id, enemyShip.id, combat);

    expect(fired).toBe(true);
    expect(playerShip.hasActed).toBe(true);
    expect(enemyShip.durability).toBeLessThanOrEqual(initialDurability);
  });

  test('deducts Shot ammunition from player cargo on broadside firing', () => {
    state.fleets['1'].ships[0].cargo = [{ type: 'shot', quantity: 5 }];
    expect(deductPlayerShot(1)).toBe(true);
    expect(state.fleets['1'].ships[0].cargo[0].quantity).toBe(4);

    // Drain all remaining shot
    expect(deductPlayerShot(4)).toBe(true);
    expect(state.fleets['1'].ships[0].cargo[0].quantity).toBe(0);

    // Out of ammo: should reject firing
    expect(deductPlayerShot(1)).toBe(false);
  });

  test('sets flagship fleet plans and individual consort orders', () => {
    const combat = createCombatEngagement();
    setFleetPlan('defend_flagship', combat);
    expect(combat.fleetPlan).toBe('defend_flagship');
    expect(combat.log[0]).toContain('Defend the Flagship');

    const consort = combat.ships.find((s) => s.team === 'player' && !s.isFlagship);
    if (consort) {
      setConsortOrder(consort.id, { targetShipId: null, tactic: 'cannon' }, combat);
      expect(consort.order?.tactic).toBe('cannon');
    }
  });

  test('fleeShip allows disengagement only at battlefield boundary', () => {
    const combat = createCombatEngagement();
    const playerShip = combat.ships[0];

    // Inside center of battlefield: cannot flee
    playerShip.hex = { q: 20, r: 20 };
    expect(fleeShip(playerShip.id, combat)).toBe(false);
    expect(playerShip.hasFled).toBeFalsy();

    // Move to outer border: can flee
    playerShip.hex = { q: 1, r: 20 };
    expect(fleeShip(playerShip.id, combat)).toBe(true);
    expect(playerShip.hasFled).toBe(true);
  });

  test('commissions and scuttles captured prize ships with persistent state writeback', () => {
    const combat = createCombatEngagement();
    combat.spoils = {
      gold: 5000,
      fame: 200,
      commodities: [{ type: 'spice', quantity: 20 }],
      capturedPrizeShips: [
        {
          id: 'prize_1',
          name: 'Galleon Prize',
          shipTypeId: '2',
          durability: 50,
          survivingCrew: 30,
          guns: 20,
          cannonType: 'Normal',
          cargo: [{ type: 'sugar', quantity: 15 }],
        },
      ],
    };

    // Add unassigned mate
    state.mates = [
      {
        sailorId: 'mate_rocco',
        role: null,
      } as any,
    ];

    const initialShipCount = state.fleets['1'].ships.length;
    const commissioned = commissionPrizeShip('prize_1', 'mate_rocco', combat);

    expect(commissioned).toBe(true);
    expect(state.fleets['1'].ships.length).toBe(initialShipCount + 1);
    expect(state.mates[0].role).toBe(initialShipCount);

    finalizeCombatResults(true, combat);
    expect(state.gold).toBeGreaterThan(0);
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

  test('fleeShip triggers escaped phase when player flagship reaches boundary', () => {
    const combat = createCombatEngagement();
    const playerShip = combat.ships[0];
    playerShip.hex = { q: 1, r: 24 };

    const fled = fleeShip(playerShip.id, combat);
    expect(fled).toBe(true);
    expect(combat.phase).toBe('escaped');
  });

  test('endCombat victory cleanly despawns defeated enemy fleet and grants combat immunity', () => {
    // Setup an active NPC pirate fleet near player
    npcFleetManager.populateBasin('mediterranean', { x: 840, y: 358 });
    const pirate = npcFleetManager.getActiveFleets().find((f) => f.hostile) || npcFleetManager.getActiveFleets()[0];
    expect(pirate).toBeDefined();

    triggerCombat(pirate.name, pirate.captainName, pirate.id);
    expect(state.inCombat).toBe(true);
    expect(state.combatEncounter?.enemyFleetId).toBe(pirate.id);

    // End combat with victory
    endCombat(true, 'victory');

    expect(state.inCombat).toBe(false);
    expect(state.combatEncounter).toBeNull();
    // Enemy fleet must be completely removed from manager and state
    expect(npcFleetManager.getFleetById(pirate.id)).toBeUndefined();
    expect(state.fleets[pirate.id]).toBeUndefined();
    // 10s grace period
    expect(state.combatCooldownUntil).toBeGreaterThan(Date.now() + 5000);
  });

  test('endCombat defeat in sp_scenario rescues player to nearest regular port with penalties', () => {
    state.gameMode = 'sp_scenario';
    state.gold = 10000;
    state.portId = null;
    state.morale = 80;
    state.fleets['1'].position = { x: 845, y: 360 }; // Near Lisbon (840, 358)
    state.fleets['1'].ships = [
      {
        id: '1',
        name: 'São Gabriel',
        durability: 0,
        crew: 0,
        cargo: [{ type: 'silver', quantity: 20 }],
      },
    ];

    triggerCombat('Barbary Fleet', 'Khayr ad-Din');
    endCombat(false, 'defeat');

    expect(state.inCombat).toBe(false);
    expect(state.isAlive).toBe(true);
    // Player rescued to nearest port (Lisbon, Port '1')
    expect(state.portId).toBe('1');
    expect(state.dayAtSea).toBe(0);
    // Gold penalty: 50% lost
    expect(state.gold).toBe(5000);
    // Flagship salvaged to seaworthiness
    expect(state.fleets['1'].ships[0].durability).toBeGreaterThanOrEqual(15);
    expect(state.fleets['1'].ships[0].crew).toBeGreaterThanOrEqual(10);
  });

  test('endCombat defeat in endless mode triggers permadeath', () => {
    state.gameMode = 'sp_endless';
    state.isAlive = true;

    triggerCombat('Pirate Raider', 'Blackbeard');
    endCombat(false, 'defeat');

    expect(state.inCombat).toBe(false);
    expect(state.isAlive).toBe(false);
  });

  test('endCombat escaped pushes hostile fleet away and grants 15s grace period', () => {
    npcFleetManager.populateBasin('mediterranean', { x: 840, y: 358 });
    const pirate = npcFleetManager.getActiveFleets().find((f) => f.hostile) || npcFleetManager.getActiveFleets()[0];

    triggerCombat(pirate.name, pirate.captainName, pirate.id);
    endCombat(false, 'escaped');

    expect(state.inCombat).toBe(false);
    // Hostile fleet should still exist but pushed away and set to patrolling
    const fleetAfter = npcFleetManager.getFleetById(pirate.id);
    if (fleetAfter) {
      expect(fleetAfter.aiState).toBe('patrolling');
    }
    // 15s grace period
    expect(state.combatCooldownUntil).toBeGreaterThan(Date.now() + 10000);
  });
});
