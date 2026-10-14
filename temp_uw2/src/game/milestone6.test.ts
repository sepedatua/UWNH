import { describe, it, expect, beforeEach } from 'vitest';
import state from '../state/state';
import { waitresses, getWaitressForPort } from '../data/waitressData';
import {
  getWaitressFavor,
  setWaitressFavor,
  tellStoryToWaitress,
  giveGoldTipToWaitress,
  giveItemGiftToWaitress,
  askWaitressForMarketIntel,
  askWaitressForPirateIntel,
} from '../state/actionsWaitress';
import {
  nobilityRanks,
  generateRoyalMission,
  getMonarchForNation,
} from '../data/palaceData';
import {
  checkPalaceGuard,
  meetRuler,
  requestRoyalMission,
  abandonRoyalMission,
  requestRoyalAid,
  defectNationality,
  getTotalFame,
  getCurrentNobilityRank,
} from '../state/actionsPalace';
import { discoveries, getNearbyDiscovery } from '../data/discoveryData';
import {
  exploreCurrentCoordinates,
  reportDiscoveriesToCollector,
  signCartographyContract,
  reportChartedMapTiles,
} from './discovery/discoveryEngine';
import {
  getCurrentCampaign,
  getCurrentChapter,
  isCurrentChapterComplete,
  completeCurrentChapter,
} from './scenario/scenarioEngine';

describe('Milestone 6: Quests, Romance, Palace & Scenarios', () => {
  beforeEach(() => {
    state.portId = '1';
    state.gold = 5000;
    state.fame = { adventure: 500, trade: 500, piracy: 0 };
    state.nationality = 'Portugal';
    state.protagonistId = '1';
    state.protagonistName = 'João Franco';
    state.nobilityRank = 0;
    state.taxPermit = false;
    state.royalMission = null;
    state.waitressFavor = {};
    state.discoveries = [];
    state.reportedDiscoveries = [];
    state.cartographyContract = false;
    state.scenarioChapter = 1;
    state.items = ['1', '3']; // Dagger, Long Sword
  });

  describe('Task 6.1: Pub Waitress & Romance System', () => {
    it('provides rich historical waitresses for major ports', () => {
      expect(waitresses['1'].name).toBe('Carlotta');
      expect(waitresses['1'].portName).toBe('Lisbon');
      expect(waitresses['2'].name).toBe('Monica');
      expect(waitresses['3'].name).toBe('Fatima');
      expect(waitresses['30'].name).toBe('Emma');
      expect(waitresses['34'].name).toBe('Nicole');
      expect(waitresses['86'].name).toBe('Priya');
      expect(waitresses['98'].name).toBe('Lian');
      expect(waitresses['100'].name).toBe('O-Sen');

      const fallback = getWaitressForPort('999');
      expect(fallback.name).toContain('Port 999');
    });

    it('tracks favor and increases favor when telling sea stories', () => {
      expect(getWaitressFavor('1')).toBe(0);

      const res = tellStoryToWaitress('1');
      expect(res.success).toBe(true);
      expect(res.favorGain).toBeGreaterThanOrEqual(10);
      expect(getWaitressFavor('1')).toBe(res.currentFavor);
      expect(res.message).toContain('Carlotta');
    });

    it('increases favor when presenting gold gifts or item gifts', () => {
      const tipRes = giveGoldTipToWaitress('1', 500);
      expect(tipRes.success).toBe(true);
      expect(state.gold).toBe(4500);
      expect(tipRes.favorGain).toBe(22);

      // Present item gift
      const itemRes = giveItemGiftToWaitress('1', '1');
      expect(itemRes.success).toBe(true);
      expect(state.items).not.toContain('1'); // removed from cargo
      expect(itemRes.favorGain).toBeGreaterThanOrEqual(24);
    });

    it('locks and unlocks market and pirate intelligence at 40 and 80 favor', () => {
      setWaitressFavor('1', 20);

      // Under 40 favor
      const lockedMarket = askWaitressForMarketIntel('1');
      expect(lockedMarket.success).toBe(false);
      expect(lockedMarket.message).toContain('Requires 40+ Favor');

      // 40+ favor unlocks market intel
      setWaitressFavor('1', 45);
      const openMarket = askWaitressForMarketIntel('1');
      expect(openMarket.success).toBe(true);
      expect(openMarket.intel?.type).toBe('market');
      expect(openMarket.intel?.body).toContain('Madeira produces rich raw sugar');

      // Under 80 favor
      const lockedPirate = askWaitressForPirateIntel('1');
      expect(lockedPirate.success).toBe(false);
      expect(lockedPirate.message).toContain('Requires 80+ Favor');

      // 80+ favor unlocks pirate intel
      setWaitressFavor('1', 85);
      const openPirate = askWaitressForPirateIntel('1');
      expect(openPirate.success).toBe(true);
      expect(openPirate.intel?.type).toBe('pirate');
      expect(openPirate.intel?.body).toContain('Corsair Raider Ismail');
    });
  });

  describe('Task 6.2 & 6.3: Palace Audience, Nobility Ranks & Royal Missions', () => {
    it('blocks commoners with under 500 fame, admits higher commanders', () => {
      state.fame = { adventure: 100, trade: 100, piracy: 0 }; // 200 total
      state.nobilityRank = 0;
      const guardRejected = checkPalaceGuard();
      expect(guardRejected.allowed).toBe(false);
      expect(guardRejected.message).toContain('Halt! Obscure wanderers and common mariners');

      state.fame = { adventure: 300, trade: 300, piracy: 0 }; // 600 total
      const guardAdmitted = checkPalaceGuard();
      expect(guardAdmitted.allowed).toBe(true);
      expect(guardAdmitted.message).toContain('The Royal Guards snap to attention');
    });

    it('confers noble titles and grants Tax Exemption Permit at Knight rank', () => {
      expect(nobilityRanks).toHaveLength(10);
      expect(nobilityRanks[0].title).toBe('Commoner');
      expect(nobilityRanks[1].title).toBe('Page');
      expect(nobilityRanks[3].title).toBe('Knight');
      expect(nobilityRanks[9].title).toBe('Duke');

      state.fame = { adventure: 2000, trade: 1500, piracy: 0 }; // 3500 total (> 3000 for Knight)
      const res = meetRuler();
      expect(res.allowed).toBe(true);
      expect(res.promoted).toBe(true);
      expect(res.newRank?.rank).toBeGreaterThanOrEqual(1);
    });

    it('generates royal missions, awards bounties, and penalizes abandonment', () => {
      const monarch = getMonarchForNation('Portugal');
      expect(monarch.name).toBe('King Manuel I');

      const missionRes = requestRoyalMission();
      expect(missionRes.success).toBe(true);
      expect(state.royalMission).not.toBeNull();
      expect(state.royalMission?.deadlineDays).toBeGreaterThan(0);

      // Abandoning halves fame
      const initialFame = getTotalFame();
      const abandonRes = abandonRoyalMission();
      expect(abandonRes.success).toBe(true);
      expect(state.royalMission).toBeNull();
      expect(getTotalFame()).toBe(Math.floor(initialFame / 2));
    });

    it('supports royal aid and defection to foreign nations', () => {
      state.gold = 100;
      const aidRes = requestRoyalAid('gold');
      expect(aidRes.success).toBe(true);
      expect(state.gold).toBe(1600);

      state.nobilityRank = 4;
      state.taxPermit = true;
      const defectRes = defectNationality('Spain');
      expect(defectRes.success).toBe(true);
      expect(state.nationality).toBe('Spain');
      expect(state.nobilityRank).toBe(0);
      expect(state.taxPermit).toBe(false);
    });
  });

  describe('Task 6.4: Adventure Discoveries & Cartography Contracts', () => {
    it('detects proximity to world landmarks and explores them', () => {
      expect(discoveries.length).toBeGreaterThanOrEqual(15);

      // Stonehenge position is { x: 890, y: 265 }
      const nearby = getNearbyDiscovery(892, 266, []);
      expect(nearby).not.toBeNull();
      expect(nearby?.id).toBe('stonehenge');

      const exploreRes = exploreCurrentCoordinates(892, 266);
      expect(exploreRes.discovered).toBe(true);
      expect(exploreRes.discovery?.name).toContain('Stonehenge');
      expect(state.discoveries).toContain('stonehenge');
      expect(state.fame.adventure).toBe(500 + (nearby?.fameReward || 0));
    });

    it('cash-in discovery reports with Antiquities Collector at Guild', () => {
      state.discoveries = ['stonehenge', 'pyramids'];
      state.gold = 1000;

      const reportRes = reportDiscoveriesToCollector();
      expect(reportRes.unreportedCount).toBe(2);
      expect(reportRes.totalGoldEarned).toBeGreaterThan(50000);
      expect(state.gold).toBe(1000 + reportRes.totalGoldEarned);
      expect(state.reportedDiscoveries).toContain('stonehenge');
      expect(state.reportedDiscoveries).toContain('pyramids');
    });

    it('signs and redeems cartography contracts for map exploration', () => {
      const signRes = signCartographyContract();
      expect(signRes.success).toBe(true);
      expect(state.cartographyContract).toBe(true);

      state.dayAtSea = 30;
      const chartRes = reportChartedMapTiles();
      expect(chartRes.success).toBe(true);
      expect(chartRes.goldEarned).toBeGreaterThan(500);
      expect(chartRes.fameEarned).toBeGreaterThan(0);
    });
  });

  describe('Task 6.5: Scenario Scripting Engine', () => {
    it('loads protagonist campaign chapters and checks objectives', () => {
      const campaign = getCurrentCampaign();
      expect(campaign.protagonistName).toBe('João Franco');
      expect(campaign.chapters.length).toBeGreaterThanOrEqual(2);

      const chapter = getCurrentChapter();
      expect(chapter.chapter).toBe(1);
      expect(chapter.title).toContain('Prologue');

      // Initially 5,000 gold and 1000 fame fulfills chapter 1 objectives
      expect(isCurrentChapterComplete()).toBe(true);

      const completeRes = completeCurrentChapter();
      expect(completeRes.success).toBe(true);
      expect(completeRes.nextChapter).toBe(2);
      expect(state.scenarioChapter).toBe(2);
    });
  });
});
