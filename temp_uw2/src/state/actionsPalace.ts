import state from './state';
import {
  nobilityRanks,
  NobilityRank,
  getMonarchForNation,
  RoyalMission,
  generateRoyalMission,
} from '../data/palaceData';

export interface PalaceAudienceResult {
  allowed: boolean;
  message: string;
  promoted?: boolean;
  newRank?: NobilityRank;
  taxPermitGranted?: boolean;
  rewardGold?: number;
}

export const getTotalFame = (): number => {
  const f = state.fame || { adventure: 0, trade: 0, piracy: 0 };
  return (f.adventure || 0) + (f.trade || 0) + (f.piracy || 0);
};

export const getCurrentNobilityRank = (): NobilityRank => {
  const rankNum = state.nobilityRank || 0;
  return nobilityRanks[rankNum] || nobilityRanks[0];
};

export const getNextNobilityRank = (): NobilityRank | null => {
  const currentRankNum = state.nobilityRank || 0;
  if (currentRankNum >= 9) return null;
  return nobilityRanks[currentRankNum + 1] || null;
};

/**
 * Palace Gate Guard Check
 */
export const checkPalaceGuard = (): { allowed: boolean; message: string } => {
  const totalFame = getTotalFame();
  const currentRank = getCurrentNobilityRank();

  // If already at least Page (Rank 1+) or has >= 500 fame, admitted
  if (currentRank.rank >= 1 || totalFame >= 500) {
    return {
      allowed: true,
      message: 'The Royal Guards snap to attention, clashing halberds in formal salute: “Pass, Commander! His Majesty awaits your presence in the Throne Hall.”',
    };
  }

  return {
    allowed: false,
    message: 'The Royal Guards cross their heavy halberds, barring the bronze palace gates: “Halt! Obscure wanderers and common mariners are forbidden entry to the Royal Alcázar. Return when you have earned at least 500 Fame on the high seas!”',
  };
};

/**
 * Meet Ruler: Audience, Rank Conferral & Mission Resolution
 */
export const meetRuler = (): PalaceAudienceResult => {
  const monarch = getMonarchForNation(state.nationality);
  const totalFame = getTotalFame();
  const currentRankNum = state.nobilityRank || 0;
  let taxPermitGranted = false;
  let promoted = false;
  let newRank: NobilityRank | undefined = undefined;
  let rewardGold = 0;

  // 1. Check if active royal mission is completed
  if (state.royalMission && state.royalMission.status === 'completed') {
    rewardGold = state.royalMission.rewardGold;
    state.gold += rewardGold;

    // Advance rank by 1 if not max
    if (currentRankNum < 9) {
      state.nobilityRank = currentRankNum + 1;
      promoted = true;
      newRank = nobilityRanks[state.nobilityRank];
    }

    if (state.nobilityRank >= 3 && !state.taxPermit) {
      state.taxPermit = true;
      taxPermitGranted = true;
    }

    const completedMission = state.royalMission;
    state.royalMission = null;

    let msg = `${monarch.name} stands from his throne, applauding: “Splendid work, ${monarch.courtChamberlain}! You have faithfully executed our royal command: '${completedMission.title}'. Take this bounty of ${rewardGold} gold pieces!”`;
    if (promoted && newRank) {
      msg += `\n\n“Furthermore, by sovereign decree, we elevate you to the noble rank of ${newRank.title}! ${newRank.perks}”`;
    }
    if (taxPermitGranted) {
      msg += `\n\n“Take also this Royal Tax Exemption Permit — no port of our crown shall ever tax your cargoes again!”`;
    }

    return {
      allowed: true,
      message: msg,
      promoted,
      newRank,
      taxPermitGranted,
      rewardGold,
    };
  }

  // 2. Check if player qualifies for a fame-based nobility promotion
  const nextRank = getNextNobilityRank();
  if (nextRank && totalFame >= nextRank.minFame) {
    state.nobilityRank = nextRank.rank;
    promoted = true;
    newRank = nextRank;

    if (state.nobilityRank >= 3 && !state.taxPermit) {
      state.taxPermit = true;
      taxPermitGranted = true;
    }

    let msg = `${monarch.name} smiles regally upon you: “Word of your valor and achievements across the seven seas has reached our throne! Your deeds bring immense glory to ${state.nationality}.”\n\n“Kneel, captain! By our sovereign authority, we hereby dub you ${newRank.title} of the realm!”`;
    if (taxPermitGranted) {
      msg += `\n\n“As a Knight of the Realm, you are granted the Royal Tax Exemption Permit. Trade freely without tariffs in our allied ports!”`;
    }

    return {
      allowed: true,
      message: msg,
      promoted,
      newRank,
      taxPermitGranted,
    };
  }

  // 3. Standard Royal Audience
  const rank = getCurrentNobilityRank();
  let greeting = `${monarch.greeting}\n\n“Greetings, ${rank.salutation} ${state.protagonistName}. Your current fame stands at ${totalFame}. Continue to bring honor to our crown!”`;

  if (nextRank) {
    greeting += `\n\n(Next Nobility Rank: ${nextRank.title} at ${nextRank.minFame} Fame; current: ${totalFame}).`;
  }

  return {
    allowed: true,
    message: greeting,
  };
};

/**
 * Request or Check Royal Mission
 */
export const requestRoyalMission = (): { success: boolean; message: string; mission: RoyalMission } => {
  const monarch = getMonarchForNation(state.nationality);

  if (state.royalMission) {
    return {
      success: true,
      message: `${monarch.courtChamberlain} presents the royal docket: “You already hold a sacred charge from the Crown:\n\n📜 ${state.royalMission.title}\n${state.royalMission.description}\n\nTime Remaining: ${state.royalMission.daysRemaining} days. Do not fail His Majesty!”`,
      mission: state.royalMission,
    };
  }

  const mission = generateRoyalMission(state.nationality, state.nobilityRank || 0);
  state.royalMission = mission;

  return {
    success: true,
    message: `${monarch.name} unrolls an imperial parchment sealed with scarlet wax: “We have an urgent assignment of highest state importance for you, Captain!”\n\n📜 ${mission.title}\n${mission.description}\n\nRoyal Bounty: ${mission.rewardGold} Gold & Nobility Title Advancement (+1 Rank).\nTime Limit: ${mission.deadlineDays} days.`,
    mission,
  };
};

/**
 * Abandon Royal Mission with severe fame penalty
 */
export const abandonRoyalMission = (): { success: boolean; message: string } => {
  if (!state.royalMission) {
    return {
      success: false,
      message: 'You currently have no active royal mission to renounce.',
    };
  }

  const monarch = getMonarchForNation(state.nationality);
  const oldTitle = state.royalMission.title;
  state.royalMission = null;

  // Penalty: Halve all fame
  state.fame.adventure = Math.floor(state.fame.adventure / 2);
  state.fame.trade = Math.floor(state.fame.trade / 2);
  state.fame.piracy = Math.floor(state.fame.piracy / 2);

  return {
    success: true,
    message: `${monarch.name} slams his fist upon the armrest in fury: “Insolence! You dare abandon your sworn royal mission '${oldTitle}'? Your cowardice disgraces our flag! We hereby strip half of your accumulated fame and renown from the royal ledgers!”`,
  };
};

/**
 * Royal Aid for destitute commanders
 */
export const requestRoyalAid = (type: 'gold' | 'ship'): { success: boolean; message: string } => {
  const monarch = getMonarchForNation(state.nationality);

  if (type === 'gold') {
    if (state.gold < 500) {
      state.gold += 1500;
      return {
        success: true,
        message: `${monarch.name} pities your empty purse: “A loyal captain cannot sail without coin for provisions. The Crown grants you an emergency stipend of 1,500 Gold pieces. Put it to honorable use!”`,
      };
    }
    return {
      success: false,
      message: `${monarch.courtChamberlain} scoffs: “You possess ${state.gold} Gold pieces! The royal treasury reserves aid for genuinely destitute commanders.”`,
    };
  }

  return {
    success: false,
    message: 'Your fleet is fully sea-worthy. The Royal Navy yards only grant caravels to shipwrecked survivors.',
  };
};

/**
 * Defect to a foreign crown
 */
export const defectNationality = (newNation: string): { success: boolean; message: string } => {
  if (state.nationality === newNation) {
    return {
      success: false,
      message: `You are already a subject of ${newNation}!`,
    };
  }

  const oldNation = state.nationality;
  state.nationality = newNation;
  state.nobilityRank = 0; // Stripped of noble titles
  state.taxPermit = false;
  state.royalMission = null;

  // Fame halved for treason
  state.fame.adventure = Math.floor(state.fame.adventure / 2);
  state.fame.trade = Math.floor(state.fame.trade / 2);
  state.fame.piracy = Math.floor(state.fame.piracy / 2);

  return {
    success: true,
    message: `You have renounced your allegiance to ${oldNation} and sworn fealty to ${newNation}! All former nobility ranks and tax permits are revoked, and your fame has been halved for political betrayal.`,
  };
};
