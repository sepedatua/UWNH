import state from '../../state/state';
import {
  Discovery,
  getNearbyDiscovery,
  getDiscoveryById,
} from '../../data/discoveryData';

export interface ExplorationResult {
  discovered: boolean;
  discovery?: Discovery;
  message: string;
}

export const checkExplorationAtPosition = (
  x: number,
  y: number,
): Discovery | null => {
  return getNearbyDiscovery(x, y, state.discoveries || []);
};

export const exploreCurrentCoordinates = (
  x: number,
  y: number,
): ExplorationResult => {
  const nearby = checkExplorationAtPosition(x, y);

  if (!nearby) {
    return {
      discovered: false,
      message: 'Your landing party searches the coastline and waters thoroughly, but finds no extraordinary landmarks or forgotten ruins at these coordinates.',
    };
  }

  if (!state.discoveries) {
    state.discoveries = [];
  }

  state.discoveries.push(nearby.id);

  // Award adventure fame
  if (!state.fame) {
    state.fame = { adventure: 0, trade: 0, piracy: 0 };
  }
  state.fame.adventure = (state.fame.adventure || 0) + nearby.fameReward;

  return {
    discovered: true,
    discovery: nearby,
    message: `EUREKA! You have discovered the legendary ${nearby.name} (${nearby.icon})!\nRank: ${nearby.rank} | Category: ${nearby.category.toUpperCase()}\n\n${nearby.lore}\n\nAdventure Fame +${nearby.fameReward}!`,
  };
};

export interface CollectorReportResult {
  unreportedCount: number;
  totalGoldEarned: number;
  totalFameEarned: number;
  reportedDiscoveries: Discovery[];
}

export const reportDiscoveriesToCollector = (): CollectorReportResult => {
  if (!state.discoveries) state.discoveries = [];
  if (!state.reportedDiscoveries) state.reportedDiscoveries = [];

  const unreportedIds = state.discoveries.filter(
    (id) => !state.reportedDiscoveries.includes(id),
  );

  const reportedList: Discovery[] = [];
  let totalGold = 0;
  let totalFame = 0;

  for (const id of unreportedIds) {
    const disc = getDiscoveryById(id);
    if (disc) {
      reportedList.push(disc);
      totalGold += disc.goldValue;
      totalFame += Math.round(disc.fameReward * 0.5);
      state.reportedDiscoveries.push(id);
    }
  }

  state.gold += totalGold;
  if (!state.fame) state.fame = { adventure: 0, trade: 0, piracy: 0 };
  state.fame.adventure = (state.fame.adventure || 0) + totalFame;

  return {
    unreportedCount: reportedList.length,
    totalGoldEarned: totalGold,
    totalFameEarned: totalFame,
    reportedDiscoveries: reportedList,
  };
};

export const signCartographyContract = (): { success: boolean; message: string } => {
  if (state.cartographyContract) {
    return {
      success: false,
      message: 'You already hold an active Cartography Charter with the Guild!',
    };
  }

  state.cartographyContract = true;
  return {
    success: true,
    message: 'The Guild Master stamps your Cartography Charter: “Congratulations, Captain! Map the uncharted coastlines and deep oceans. Return here to submit your charts for gold and global renown.”',
  };
};

export const reportChartedMapTiles = (): {
  success: boolean;
  message: string;
  goldEarned: number;
  fameEarned: number;
} => {
  if (!state.cartographyContract) {
    return {
      success: false,
      message: 'You must first sign a Cartography Charter before the Guild can purchase your coastal map charts!',
      goldEarned: 0,
      fameEarned: 0,
    };
  }

  // Calculate exploration charting based on voyage distance & days at sea
  const days = state.dayAtSea || 1;
  const discoveredCount = (state.discoveries || []).length;
  const baseReward = Math.max(500, Math.min(25000, days * 45 + discoveredCount * 800));
  const fameReward = Math.max(50, Math.round(baseReward / 20));

  state.gold += baseReward;
  if (!state.fame) state.fame = { adventure: 0, trade: 0, piracy: 0 };
  state.fame.adventure = (state.fame.adventure || 0) + fameReward;

  return {
    success: true,
    message: `The Guild cartographers meticulously transcribe your logbooks and coastal soundings into the Grand World Atlas! His Majesty’s geographers are astounded by your charts.`,
    goldEarned: baseReward,
    fameEarned: fameReward,
  };
};
