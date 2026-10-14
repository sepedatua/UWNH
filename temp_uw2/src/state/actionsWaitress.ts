import state from './state';
import { getWaitressForPort } from '../data/waitressData';
import { itemData, itemCategories, ItemId } from '../data/itemData';

export interface WaitressActionResult {
  success: boolean;
  message: string;
  favorGain: number;
  currentFavor: number;
  intel?: {
    type: 'market' | 'pirate';
    title: string;
    body: string;
  };
}

export const getWaitressFavor = (portId: string): number => {
  if (!state.waitressFavor) {
    state.waitressFavor = {};
  }
  return state.waitressFavor[portId] ?? 0;
};

export const setWaitressFavor = (portId: string, favor: number): number => {
  if (!state.waitressFavor) {
    state.waitressFavor = {};
  }
  const clamped = Math.max(0, Math.min(100, Math.round(favor)));
  state.waitressFavor[portId] = clamped;
  return clamped;
};

export const tellStoryToWaitress = (portId: string): WaitressActionResult => {
  const waitress = getWaitressForPort(portId);
  const currentFavor = getWaitressFavor(portId);
  const adventureFame = state.fame?.adventure || 0;

  // Favor gain scales slightly with adventure fame
  let baseGain = 10;
  if (adventureFame > 5000) {
    baseGain = 16;
  } else if (adventureFame > 1000) {
    baseGain = 13;
  }

  const newFavor = setWaitressFavor(portId, currentFavor + baseGain);

  let reaction = `${waitress.name} listens with wide, sparkling eyes as you recount tales of distant shores, howling tempests, and undiscovered lands. “You are truly a daring navigator, Captain!”`;
  if (newFavor >= 80) {
    reaction = `${waitress.name} leans in close, holding your hand gently: “Whenever you tell your voyages, my heart races. I pray to the Holy Mother for your safe return each night.”`;
  } else if (newFavor >= 40) {
    reaction = `${waitress.name} smiles warmly and pours you a special reserve goblet: “Your stories are the talk of our tavern! Everyone longs to hear more of your adventures.”`;
  }

  return {
    success: true,
    message: reaction,
    favorGain: newFavor - currentFavor,
    currentFavor: newFavor,
  };
};

export const giveGoldTipToWaitress = (portId: string, amount: number = 500): WaitressActionResult => {
  const waitress = getWaitressForPort(portId);
  const currentFavor = getWaitressFavor(portId);

  if (state.gold < amount) {
    return {
      success: false,
      message: `You do not have enough gold! You need at least ${amount} Gold pieces to present a generous gift.`,
      favorGain: 0,
      currentFavor,
    };
  }

  state.gold -= amount;
  const gain = 22;
  const newFavor = setWaitressFavor(portId, currentFavor + gain);

  return {
    success: true,
    message: `You present a purse of ${amount} gleaming gold pieces to ${waitress.name}. She blushes with delight: “Oh Captain, you are far too generous! I shall treasure your kindness.”`,
    favorGain: newFavor - currentFavor,
    currentFavor: newFavor,
  };
};

export const giveItemGiftToWaitress = (portId: string, itemId: ItemId): WaitressActionResult => {
  const waitress = getWaitressForPort(portId);
  const currentFavor = getWaitressFavor(portId);

  const itemIndex = state.items.indexOf(itemId);
  if (itemIndex === -1) {
    return {
      success: false,
      message: 'You do not possess that item in your inventory!',
      favorGain: 0,
      currentFavor,
    };
  }

  const item = itemData[itemId];
  const itemCategoryName = itemCategories[item.categoryId] || 'Special';
  const isFavorite = itemCategoryName === waitress.favoriteGiftCategory;

  // Remove 1 instance of the item from player's inventory
  state.items.splice(itemIndex, 1);

  const gain = isFavorite ? 35 : 24;
  const newFavor = setWaitressFavor(portId, currentFavor + gain);

  let reaction = `You present the ${item.name} to ${waitress.name}. She marvels at its craft: “What an exquisite gift! Thank you, noble Captain.”`;
  if (isFavorite) {
    reaction = `You present the ${item.name} to ${waitress.name}. Her eyes light up with utter adoration: “Heavens! A ${waitress.favoriteGiftCategory}! This is my most cherished treasure in the world, Captain! I will never forget your devotion.”`;
  }

  return {
    success: true,
    message: reaction,
    favorGain: newFavor - currentFavor,
    currentFavor: newFavor,
  };
};

export const askWaitressForMarketIntel = (portId: string): WaitressActionResult => {
  const waitress = getWaitressForPort(portId);
  const favor = getWaitressFavor(portId);

  if (favor < 40) {
    return {
      success: false,
      message: `${waitress.name} smiles apologetically: “Forgive me, Captain... I only share valuable trade rumors with dear companions I truly trust. (Requires 40+ Favor; current: ${favor}/100).”`,
      favorGain: 0,
      currentFavor: favor,
    };
  }

  return {
    success: true,
    message: `${waitress.name} whispers confidentially into your ear: “A merchant captain from ${waitress.intelRemotePort} drank here yesterday and shared a profitable secret...”`,
    favorGain: 0,
    currentFavor: favor,
    intel: {
      type: 'market',
      title: `Secret Market Intel: ${waitress.intelCommodity} Arbitrage`,
      body: waitress.intelPriceNote,
    },
  };
};

export const askWaitressForPirateIntel = (portId: string): WaitressActionResult => {
  const waitress = getWaitressForPort(portId);
  const favor = getWaitressFavor(portId);

  if (favor < 80) {
    return {
      success: false,
      message: `${waitress.name} clutches her chest nervously: “High-seas pirates are terrifying cutthroats! I can only confide such dangerous rumors to someone very close to my heart. (Requires 80+ Favor; current: ${favor}/100).”`,
      favorGain: 0,
      currentFavor: favor,
    };
  }

  return {
    success: true,
    message: `${waitress.name} leans close and whispers with deep concern: “Be on your guard, my love! An infamous scoundrel has been sighted prowling nearby shipping lanes...”`,
    favorGain: 0,
    currentFavor: favor,
    intel: {
      type: 'pirate',
      title: `Wanted Pirate Alert: ${waitress.intelPirateName}`,
      body: `Fleet Commander: ${waitress.intelPirateName}\nPatrolling Waters: ${waitress.intelPirateSector}\nAdvisory: Prepare broadside cannons and heavy boarding marines before venturing into those coordinates!`,
    },
  };
};
