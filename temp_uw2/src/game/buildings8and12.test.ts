import { describe, it, expect, beforeEach } from 'vitest';
import state from '../state/state';
import { buildings } from '../data/buildingData';
import { mansionData, getMansionData } from '../data/mansionData';
import { donate, pray } from '../state/actionsPort';
import { getCaptain, getMates } from '../state/selectors';
import { discoveries } from '../data/discoveryData';
import {
  reportDiscoveriesToCollector,
  signCartographyContract,
  reportChartedMapTiles,
} from './discovery/discoveryEngine';

describe('Milestone 2 Extension: Buildings 8 (Mansion) and 12 (Fortune Teller)', () => {
  beforeEach(() => {
    state.portId = '1';
    state.gold = 50000;
    state.luck = 80;
    state.morale = 80;
    state.fame = { adventure: 2000, trade: 1500, piracy: 500 };
    state.nobilityRank = 0;
    state.waitressFavor = { '1': 50 };
    state.discoveries = [discoveries[0].id, discoveries[1].id];
    state.reportedDiscoveries = [];
    state.cartographyContract = false;
    state.mates = [
      {
        sailorId: '1',
        role: 0,
        skills: [],
      },
    ];
  });

  describe('Task 2.6: The Fortune Teller & Hidden Luck Oracle (Building 12)', () => {
    it('defines Building 12 in buildingData with the 4 authentic Koei options', () => {
      expect(buildings['12']).toBeDefined();
      expect(buildings['12'].name).toBe('Fortune Teller');
      expect(buildings['12'].options).toEqual([
        'Life',
        'Career',
        'Love',
        'Mates',
      ]);
    });

    it('updates luck through Church/Mosque donations (≥10% donation boosts luck)', () => {
      state.gold = 1000;
      state.luck = 50;

      // Donating 50 gold (5%) -> not large donation
      donate(50);
      expect(state.gold).toBe(950);
      expect(state.luck).toBe(50);

      // Donating 100 gold (>10% of 950) -> large donation boosts luck!
      donate(100);
      expect(state.gold).toBe(850);
      expect(state.luck).toBeGreaterThan(50);
    });

    it('praying at the Church boosts crew morale', () => {
      state.morale = 70;
      pray();
      expect(state.morale).toBe(72);
    });

    it('fortune teller reads mate stats, virtues, and loyalty', () => {
      const mates = getMates();
      expect(mates.length).toBeGreaterThan(0);
      const joao = mates[0];
      expect(joao.name).toBe('João Franco');
      expect(joao.stats.leadership).toBe(78);
      expect(joao.stats.luck).toBeDefined();
    });
  });

  describe('Task 2.7: Historical Mansions, Scholarly Tutors & Sponsor Contracts (Building 8)', () => {
    it('defines Building 8 as Mansion in buildingData with proper options', () => {
      expect(buildings['8']).toBeDefined();
      expect(buildings['8'].name).toBe('Mansion');
      expect(buildings['8'].options).toEqual([
        'Meet Resident',
        'Learn Skill',
        'Expedition Contract',
      ]);
    });

    it('contains comprehensive historical entries for the 23 authentic ports', () => {
      const portIdsWith8 = [
        '1', '2', '3', '4', '10', '11', '13', '14', '19', '28',
        '33', '34', '35', '36', '65', '75', '76', '78', '86', '93',
        '98', '99', '100',
      ];

      for (const id of portIdsWith8) {
        expect(mansionData[id]).toBeDefined();
        expect(mansionData[id].estateName).toBeTruthy();
        expect(mansionData[id].residentName).toBeTruthy();
        expect(mansionData[id].greeting).toBeTruthy();
        expect(mansionData[id].explorationRumor).toBeTruthy();
      }

      // Check key historical scholars
      expect(mansionData['1'].residentName).toBe('Duchess Christiana Franco');
      expect(mansionData['10'].residentName).toBe('Galileo Galilei');
      expect(mansionData['34'].residentName).toBe('Gerardus Mercator');
      expect(mansionData['28'].residentName).toBe('Professor Mordecai');
      expect(mansionData['99'].residentName).toBe('Sen no Rikyu');
    });

    it('allows learning skills from resident tutors when prerequisites and tuition are met', () => {
      // Mercator in Amsterdam teaches Cartography (Knowledge >= 70, Intuition >= 70, Seamanship >= 70)
      const mercator = getMansionData('34', 'Amsterdam');
      expect(mercator.teachSkill).toBe('Cartography');
      expect(mercator.skillCost).toBe(5000);

      const captain = getCaptain(0);
      // João has knowledge 73, intuition 85, seamanship 75 -> qualifies!
      const qualifies = mercator.checkPrereqs!(captain.stats, captain.battleLevel);
      expect(qualifies).toBe(true);

      // Learn skill
      state.gold -= mercator.skillCost!;
      state.mates[0].skills = ['Cartography'];

      const updatedCaptain = getCaptain(0);
      expect(updatedCaptain.skills).toContain('Cartography');

      const updatedMates = getMates();
      expect(updatedMates[0].skills).toContain('Cartography');
    });

    it('rejects skill learning if attributes fail prerequisites', () => {
      // Test custom low stat
      const mercator = getMansionData('34', 'Amsterdam');
      const weakStats = {
        leadership: 50,
        seamanship: 50,
        knowledge: 50,
        intuition: 50,
        courage: 50,
        swordplay: 50,
        charm: 50,
        luck: 50,
      };

      const qualifies = mercator.checkPrereqs!(weakStats, 1);
      expect(qualifies).toBe(false);
    });

    it('allows signing Cartography Charter and submitting coastal charts at cartographer estates', () => {
      // At Mercator (34)
      expect(mansionData['34'].isCartographer).toBe(true);

      expect(state.cartographyContract).toBe(false);
      const signRes = signCartographyContract();
      expect(signRes.success).toBe(true);
      expect(state.cartographyContract).toBe(true);

      const reportRes = reportChartedMapTiles();
      expect(reportRes.success).toBe(true);
      expect(reportRes.goldEarned).toBeGreaterThan(0);
    });

    it('allows submitting discovery reports to antiquities collectors at collector mansions', () => {
      // At Professor Mordecai in Bordeaux (28)
      expect(mansionData['28'].isCollector).toBe(true);

      expect(state.reportedDiscoveries.length).toBe(0);
      const res = reportDiscoveriesToCollector();
      expect(res.unreportedCount).toBe(2);
      expect(res.totalGoldEarned).toBeGreaterThan(0);
      expect(res.totalFameEarned).toBeGreaterThan(0);
      expect(state.reportedDiscoveries).toEqual([
        discoveries[0].id,
        discoveries[1].id,
      ]);
    });

    it('provides an authentic fallback for ports without an explicit entry', () => {
      const fallback = getMansionData('999', 'Port Royale');
      expect(fallback.estateName).toBe('Port Royale Governor’s Residence');
      expect(fallback.residentName).toBe('Lord Magistrate & Consul');
      expect(fallback.isCollector).toBe(true);
    });
  });
});
