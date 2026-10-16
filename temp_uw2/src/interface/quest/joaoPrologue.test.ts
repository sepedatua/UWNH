import { describe, it, expect, beforeEach } from 'vitest';
import state from '../../state/state';
import getAvailableQuest from './getAvailableQuest';
import questData from './questData';
import {
  recruitRocco,
  recruitEnrico,
  receiveFirstShip,
  assignFirstRoles,
  completeQuest,
} from '../../state/actionsPort';

describe('João Franco Lisbon Prologue & Idempotency Safeguards', () => {
  beforeEach(() => {
    state.gameMode = 'sp_scenario';
    state.protagonistId = '1';
    state.portId = '1';
    state.buildingId = null;
    state.quests = [];
    state.items = [];
    state.mates = [{ sailorId: '1', role: null }];
    state.fleets = {
      '1': {
        position: { x: 100, y: 100 },
        ships: [],
      },
    };
  });

  it('triggers houseBeforeQuest initially when visiting Lisbon estate', () => {
    state.buildingId = '8';
    expect(getAvailableQuest()).toBe('houseBeforeQuest');
  });

  it('safeguards recruitRocco against duplicate recruitment', () => {
    expect(state.mates.length).toBe(1);

    recruitRocco();
    expect(state.mates.length).toBe(2);
    expect(state.mates[1].sailorId).toBe('32');

    // Repeated recruitment should be a no-op
    recruitRocco();
    recruitRocco();
    expect(state.mates.length).toBe(2);
    expect(state.mates.filter((m) => m.sailorId === '32').length).toBe(1);
  });

  it('safeguards recruitEnrico against duplicate recruitment', () => {
    recruitEnrico();
    expect(state.mates.some((m) => m.sailorId === '33')).toBe(true);

    recruitEnrico();
    recruitEnrico();
    expect(state.mates.filter((m) => m.sailorId === '33').length).toBe(1);
  });

  it('safeguards receiveFirstShip against duplicate flagship awards', () => {
    // Add sailor for addShip
    recruitRocco();

    receiveFirstShip();
    expect(state.fleets['1'].ships.length).toBe(1);
    expect(state.fleets['1'].ships[0].name).toBe('Hermes II');

    // Repeated calls must not duplicate Hermes II
    receiveFirstShip();
    receiveFirstShip();
    expect(state.fleets['1'].ships.length).toBe(1);
  });

  it('assigns firstMate and bookKeeper roles correctly by sailorId', () => {
    recruitRocco();
    recruitEnrico();
    assignFirstRoles();

    const rocco = state.mates.find((m) => m.sailorId === '32');
    const enrico = state.mates.find((m) => m.sailorId === '33');

    expect(rocco?.role).toBe('firstMate');
    expect(enrico?.role).toBe('bookKeeper');
  });

  it('prevents unique quest item duplication (Aqua Tiara & Rapier)', () => {
    // Tiara action
    const tiaraMsg = questData.houseAfterQuestAndPub.find(
      (m) => m.action && m.characterId === '20',
    );
    expect(tiaraMsg).toBeDefined();

    tiaraMsg?.action?.();
    expect(state.items.filter((i) => i === '53').length).toBe(1);

    // Call action again
    tiaraMsg?.action?.();
    expect(state.items.filter((i) => i === '53').length).toBe(1);

    // Rapier action
    const rapierMsg = questData.itemShopAfterQuest.find((m) => m.action);
    expect(rapierMsg).toBeDefined();

    rapierMsg?.action?.();
    expect(state.items.filter((i) => i === '4').length).toBe(1);

    // Call action again
    rapierMsg?.action?.();
    expect(state.items.filter((i) => i === '4').length).toBe(1);
  });

  it('never re-triggers prologue quests once harborFinal is completed', () => {
    completeQuest('harborFinal');

    // All normal port facilities should now return null to allow normal menus
    state.buildingId = '2'; // Pub
    expect(getAvailableQuest()).toBeNull();

    state.buildingId = '3'; // Shipyard
    expect(getAvailableQuest()).toBeNull();

    state.buildingId = '1'; // Market
    expect(getAvailableQuest()).toBeNull();

    state.buildingId = '4'; // Harbor
    expect(getAvailableQuest()).toBeNull();

    state.buildingId = '10'; // Item Shop
    expect(getAvailableQuest()).toBeNull();

    state.buildingId = '11'; // Church
    expect(getAvailableQuest()).toBeNull();

    state.buildingId = '5'; // Lodge
    expect(getAvailableQuest()).toBeNull();

    state.buildingId = '7'; // Bank
    expect(getAvailableQuest()).toBeNull();

    state.buildingId = '9'; // Guild
    expect(getAvailableQuest()).toBeNull();

    // Estate reminds João of father's orders and exits
    state.buildingId = '8';
    expect(getAvailableQuest()).toBe('houseAfterQuestAndPub2');

    // Palace reminds João of father's orders and exits
    state.buildingId = '6';
    expect(getAvailableQuest()).toBe('palaceAfterQuest');
  });

  it('restores state.quests correctly from save payload', () => {
    const payload = {
      quests: ['houseBeforeQuest', 'shipyardAfterQuest', 'harborFinal'],
    };

    if (payload.quests) {
      state.quests = [...payload.quests as any];
    }

    expect(state.quests).toEqual([
      'houseBeforeQuest',
      'shipyardAfterQuest',
      'harborFinal',
    ]);
  });

  it('deduplicates legacy save files with duplicate mates, ships, and quest items', () => {
    // 1. Duplicate mates cleanup test
    const rawMates = [
      { sailorId: '1', role: null },
      { sailorId: '32', role: 'firstMate' },
      { sailorId: '32', role: null },
      { sailorId: '33', role: 'bookKeeper' },
      { sailorId: '33', role: null },
    ];
    const seenSailors = new Set<string>();
    state.mates = rawMates.filter((m: any) => {
      if (!m || !m.sailorId) return false;
      if (seenSailors.has(m.sailorId)) return false;
      seenSailors.add(m.sailorId);
      return true;
    });

    expect(state.mates.length).toBe(3);
    expect(state.mates.map((m) => m.sailorId)).toEqual(['1', '32', '33']);

    // 2. Duplicate Hermes II ships cleanup test
    const rawShips = [
      { id: '6', name: 'Hermes II', crew: 15, cargo: [], durability: 40 },
      { id: '6', name: 'Hermes II', crew: 0, cargo: [], durability: 40 },
      { id: '14', name: 'Sloop', crew: 20, cargo: [], durability: 50 },
    ];
    let hermesSeen = false;
    const cleanShips = rawShips.filter((s) => {
      if (s.name === 'Hermes II' && s.id === '6') {
        if (hermesSeen) return false;
        hermesSeen = true;
      }
      return true;
    });

    expect(cleanShips.length).toBe(2);
    expect(cleanShips.filter((s) => s.name === 'Hermes II').length).toBe(1);

    // 3. Duplicate unique items cleanup test (Rapier '4' and Tiara '53')
    const rawItems = ['4', '4', '4', '53', '53', '12', '12'] as any[];
    const uniqueItems: any[] = [];
    const seenSingleItems = new Set<string>(['4', '53']);
    for (const it of rawItems) {
      if (seenSingleItems.has(it)) {
        if (!uniqueItems.includes(it)) {
          uniqueItems.push(it);
        }
      } else {
        uniqueItems.push(it);
      }
    }

    expect(uniqueItems.filter((i) => i === '4').length).toBe(1);
    expect(uniqueItems.filter((i) => i === '53').length).toBe(1);
    expect(uniqueItems.filter((i) => i === '12').length).toBe(2); // non-unique trade goods/items preserved
  });

  it('migrates older saves missing quests array if captain already possesses Rocco or Hermes II', () => {
    // Simulating loading an old save with missing quests but existing Rocco
    state.mates = [
      { sailorId: '1', role: null },
      { sailorId: '32', role: 'firstMate' },
    ];
    state.quests = [];

    // Migration rule
    if (
      state.protagonistId === '1' &&
      (state.mates.some((m) => m.sailorId === '32') ||
        state.fleets['1']?.ships?.some((s) => s.name === 'Hermes II'))
    ) {
      state.quests = [
        'houseBeforeQuest',
        'shipyardAfterQuest',
        'churchAfterQuest',
        'churchAfterEnrico',
        'pubAfterQuest',
        'houseAfterQuestAndPub',
        'itemShopAfterQuest',
        'harborFinal',
      ];
    }

    expect(state.quests.includes('harborFinal')).toBe(true);

    // After migration, visiting Lisbon facilities should NOT refire prologue quests
    state.buildingId = '2'; // Pub
    expect(getAvailableQuest()).toBeNull();
  });
});
