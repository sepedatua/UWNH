import { describe, it, expect, beforeEach } from 'vitest';
import state from '../../state/state';
import {
  TAVERN_MATES,
  getAvailableTavernMate,
  canRecruitTavernMate,
  recruitTavernMate,
  assignMateRole,
  unassignMateRole,
} from './tavernMates';
import { getFirstMateId } from '../../state/selectors';

describe('Tavern Mates Recruitment & Fleet Officer Assignment', () => {
  beforeEach(() => {
    // Reset test state
    state.portId = '1';
    state.gold = 5000;
    state.fame = {
      adventure: 500,
      trade: 500,
      piracy: 500,
    };
    state.morale = 80;
    state.mates = [
      { sailorId: '1', role: 0 }, // João Franco (Protagonist / Commodore)
      { sailorId: '32', role: null }, // Rocco Alemkel
    ];
  });

  describe('Tavern Mates Directory', () => {
    it('has authentic navigators registered across global port taverns', () => {
      expect(TAVERN_MATES.length).toBeGreaterThanOrEqual(16);

      const lisbonMate = TAVERN_MATES.find((m) => m.homePortId === '1');
      expect(lisbonMate).toBeDefined();
      expect(lisbonMate?.name).toBe('Andreas Baes');

      const londonMate = TAVERN_MATES.find((m) => m.homePortId === '30');
      expect(londonMate?.name).toBe('Matthew Baker');

      const calicutMate = TAVERN_MATES.find((m) => m.homePortId === '93');
      expect(calicutMate?.name).toBe('Alfonso de Albuquerque');
    });

    it('retrieves the available unhired mate for the current port', () => {
      const mate = getAvailableTavernMate('1');
      expect(mate).not.toBeNull();
      expect(mate?.name).toBe('Andreas Baes');
      expect(mate?.sailor.navigationLevel).toBeGreaterThan(0);

      const athensMate = getAvailableTavernMate('17');
      expect(athensMate).not.toBeNull();
      expect(athensMate?.name).toBe('Dante Peleira');
      expect(athensMate?.sailor.skills).toContain('Celestial Navigation');
    });

    it('returns null if port has no tavern mate or all are recruited', () => {
      expect(getAvailableTavernMate('999')).toBeNull();
    });
  });

  describe('canRecruitTavernMate', () => {
    it('rejects if protagonist lacks sufficient gold for signing bonus', () => {
      state.gold = 10;
      const mate = TAVERN_MATES[0];
      const check = canRecruitTavernMate(mate);
      expect(check.canRecruit).toBe(false);
      expect(check.reason).toContain('Insufficient gold');
    });

    it('rejects if protagonist total fame is below required threshold', () => {
      state.gold = 10000;
      state.fame = { adventure: 0, trade: 0, piracy: 0 };
      const mate = TAVERN_MATES.find((m) => m.name === 'Alfonso de Albuquerque')!;
      const check = canRecruitTavernMate(mate);
      expect(check.canRecruit).toBe(false);
      expect(check.reason).toBe(mate.rejectQuote);
    });

    it('allows recruitment when gold and fame criteria are met', () => {
      state.gold = 2000;
      state.fame = { adventure: 600, trade: 600, piracy: 600 };
      const mate = TAVERN_MATES[0];
      const check = canRecruitTavernMate(mate);
      expect(check.canRecruit).toBe(true);
    });

    it('softens required fame by 25% when tavern has been treated (high morale >= 85)', () => {
      const mate = TAVERN_MATES.find((m) => m.name === 'Miguel Leal')!; // requires 400 fame
      state.gold = 5000;
      state.fame = { adventure: 150, trade: 150, piracy: 50 }; // total 350 (< 400)

      // At normal morale (80), 350 < 400 -> fails
      state.morale = 80;
      expect(canRecruitTavernMate(mate).canRecruit).toBe(false);

      // At tavern treat morale (85+), effective threshold is 300 (400 * 0.75) -> passes!
      state.morale = 90;
      expect(canRecruitTavernMate(mate).canRecruit).toBe(true);
    });
  });

  describe('recruitTavernMate', () => {
    it('deducts signing bonus and adds mate to fleet roster', () => {
      const initialGold = state.gold;
      const mate = TAVERN_MATES[0]; // Andreas Baes, bonus 350

      const result = recruitTavernMate(mate, 'firstMate');
      expect(result.success).toBe(true);
      expect(result.message).toBe(mate.hiredQuote);
      expect(state.gold).toBe(initialGold - mate.signingBonus);

      const added = state.mates.find((m) => m.sailorId === mate.sailorId);
      expect(added).toBeDefined();
      expect(added?.role).toBe('firstMate');

      // Next call for Lisbon should now find the next unhired mate (Miguel Leal)
      const nextAvailable = getAvailableTavernMate('1');
      expect(nextAvailable?.name).toBe('Miguel Leal');
    });
  });

  describe('assignMateRole & unassignMateRole', () => {
    it('assigns consort ship captaincy and enforces 1-to-1 uniqueness', () => {
      // Add two navigators
      state.mates.push({ sailorId: '35', role: null }); // Andreas
      state.mates.push({ sailorId: '40', role: null }); // Miguel

      // Assign Andreas to Ship 1
      assignMateRole('35', 1);
      expect(state.mates.find((m) => m.sailorId === '35')?.role).toBe(1);

      // Assign Miguel to Ship 1 -> Andreas should be bumped to null
      assignMateRole('40', 1);
      expect(state.mates.find((m) => m.sailorId === '40')?.role).toBe(1);
      expect(state.mates.find((m) => m.sailorId === '35')?.role).toBeNull();
    });

    it('assigns bridge officer roles with uniqueness swap', () => {
      state.mates.push({ sailorId: '38', role: 'lookout' });
      state.mates.push({ sailorId: '47', role: null });

      // Assign 47 as lookout -> 38 bumped to null
      assignMateRole('47', 'lookout');
      expect(state.mates.find((m) => m.sailorId === '47')?.role).toBe('lookout');
      expect(state.mates.find((m) => m.sailorId === '38')?.role).toBeNull();
    });

    it('unassigns role back to reserve/passenger status', () => {
      state.mates.push({ sailorId: '42', role: 'bookKeeper' });
      unassignMateRole('42');
      expect(state.mates.find((m) => m.sailorId === '42')?.role).toBeNull();
    });

    it('updates dynamic getFirstMateId when a First Mate is appointed', () => {
      // By default no first mate, returns '32'
      expect(getFirstMateId()).toBe('32');

      // Appoint sailor '40' as first mate
      state.mates.push({ sailorId: '40', role: null });
      assignMateRole('40', 'firstMate');
      expect(getFirstMateId()).toBe('40');

      // Relieve '40'
      unassignMateRole('40');
      expect(getFirstMateId()).toBe('32');
    });
  });
});
