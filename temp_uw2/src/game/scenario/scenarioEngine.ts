import state from '../../state/state';
import { getTotalFame } from '../../state/actionsPalace';

export interface CampaignObjective {
  id: string;
  description: string;
  targetType: 'gold' | 'fame' | 'port_visit' | 'discovery' | 'rank' | 'flagship' | 'combat';
  targetValue: number | string;
  currentValue?: () => number | string;
  isComplete: () => boolean;
}

export interface CampaignChapter {
  chapter: number;
  title: string;
  synopsis: string;
  hint: string;
  objectives: CampaignObjective[];
  rewardDescription: string;
  onComplete: () => void;
}

export interface ProtagonistCampaign {
  protagonistId: string;
  protagonistName: string;
  campaignTitle: string;
  chapters: CampaignChapter[];
}

export const campaigns: Record<string, ProtagonistCampaign> = {
  // 1: João Franco (Portugal)
  '1': {
    protagonistId: '1',
    protagonistName: 'João Franco',
    campaignTitle: 'The Secret of Atlantis & the House of Franco',
    chapters: [
      {
        chapter: 1,
        title: 'Prologue: Setting Sail from Lisbon',
        synopsis: 'Your father, Duke Leon Franco, has entrusted you with family honor and an ancient compass. Seek Rocco Alemkel in Lisbon’s tavern, secure your caravel, and set your course on the Atlantic.',
        hint: 'Visit the Pub in Lisbon (Port 1) to speak with Carlotta and recruit Rocco, then check your fleet in Harbor.',
        objectives: [
          {
            id: 'joao_1_gold',
            description: 'Accumulate at least 5,000 Gold through Mediterranean trade.',
            targetType: 'gold',
            targetValue: 5000,
            currentValue: () => state.gold,
            isComplete: () => state.gold >= 5000,
          },
          {
            id: 'joao_1_fame',
            description: 'Earn at least 500 Adventure or Trade Fame.',
            targetType: 'fame',
            targetValue: 500,
            currentValue: () => getTotalFame(),
            isComplete: () => getTotalFame() >= 500,
          },
        ],
        rewardDescription: '+1,500 Gold, Adventure Fame +300',
        onComplete: () => {
          state.gold += 1500;
          state.fame.adventure = (state.fame.adventure || 0) + 300;
        },
      },
      {
        chapter: 2,
        title: 'Chapter 2: The Royal Audience & The Grand Voyage',
        synopsis: 'His Majesty King Manuel I has taken notice of your seamanship. The Crown requires daring navigators to chart oceanic passages past Cape Verde and seek the mythical Kingdom of Prester John.',
        hint: 'Earn audience with King Manuel I at the Lisbon Palace (Palace 6). Achieve at least Knight rank (3,000 Fame) to claim the Tax Permit.',
        objectives: [
          {
            id: 'joao_2_rank',
            description: 'Attain the rank of Knight (Rank 3) or higher at the Palace.',
            targetType: 'rank',
            targetValue: 3,
            currentValue: () => state.nobilityRank || 0,
            isComplete: () => (state.nobilityRank || 0) >= 3,
          },
          {
            id: 'joao_2_gold',
            description: 'Amass 25,000 Gold to finance a deep-sea exploration squadron.',
            targetType: 'gold',
            targetValue: 25000,
            currentValue: () => state.gold,
            isComplete: () => state.gold >= 25000,
          },
        ],
        rewardDescription: 'Royal Galleon Upgrade, Fame +800',
        onComplete: () => {
          state.gold += 5000;
          state.fame.adventure = (state.fame.adventure || 0) + 800;
        },
      },
      {
        chapter: 3,
        title: 'Chapter 3: The Sunken Relics of Atlantis',
        synopsis: 'Ancient charts indicate that the civilization of Atlantis rests deep in the mid-Atlantic waters. Brave the uncharted waves, locate the lost ruins, and bring historic glory to Portugal.',
        hint: 'Sail west into mid-Atlantic ocean coordinates (X: ~670, Y: ~420) to uncover the Sunken Ruins of Atlantis or report world discoveries to the Guild.',
        objectives: [
          {
            id: 'joao_3_discovery',
            description: 'Discover at least 3 world landmarks or ancient ruins.',
            targetType: 'discovery',
            targetValue: 3,
            currentValue: () => (state.discoveries || []).length,
            isComplete: () => (state.discoveries || []).length >= 3,
          },
          {
            id: 'joao_3_fame',
            description: 'Attain Grand Explorer status (Total Fame >= 10,000).',
            targetType: 'fame',
            targetValue: 10000,
            currentValue: () => getTotalFame(),
            isComplete: () => getTotalFame() >= 10000,
          },
        ],
        rewardDescription: 'Duke Rank Nomination, Royal Treasury Bounty 30,000 Gold',
        onComplete: () => {
          state.gold += 30000;
          state.nobilityRank = Math.min(9, (state.nobilityRank || 0) + 2);
        },
      },
    ],
  },

  // 2: Catalina Erantzo (Spain)
  '2': {
    protagonistId: '2',
    protagonistName: 'Catalina Erantzo',
    campaignTitle: 'Vengeance of the Red-Haired Corsair',
    chapters: [
      {
        chapter: 1,
        title: 'Prologue: Mutiny and the Jolly Roger',
        synopsis: 'Betrayed by Spanish naval command and burning for revenge after the murder of your brother, you have commandeered a warship in Seville. Prove your strength upon the waves!',
        hint: 'Engage enemy fleets in tactical naval combat and raise a battle chest in Mediterranean ports.',
        objectives: [
          {
            id: 'cat_1_gold',
            description: 'Capture booty worth at least 8,000 Gold.',
            targetType: 'gold',
            targetValue: 8000,
            currentValue: () => state.gold,
            isComplete: () => state.gold >= 8000,
          },
          {
            id: 'cat_1_fame',
            description: 'Attain at least 1,000 Piracy or Military Fame.',
            targetType: 'fame',
            targetValue: 1000,
            currentValue: () => state.fame?.piracy || 0,
            isComplete: () => (state.fame?.piracy || 0) >= 1000,
          },
        ],
        rewardDescription: 'Piracy Fame +500, +2,000 Gold',
        onComplete: () => {
          state.gold += 2000;
          state.fame.piracy = (state.fame.piracy || 0) + 500;
        },
      },
      {
        chapter: 2,
        title: 'Chapter 2: Terror of the Barbary Coast',
        synopsis: 'Whispers in Algiers and Ceuta speak of an elusive assassin captain operating under foreign colors. Hunt down pirate raiders and establish your fleet’s undisputed dominion.',
        hint: 'Visit North African taverns to gather pirate intelligence and upgrade your vessel with Culverins or Carronades.',
        objectives: [
          {
            id: 'cat_2_fame',
            description: 'Achieve 5,000 Piracy Fame across the Mediterranean.',
            targetType: 'fame',
            targetValue: 5000,
            currentValue: () => state.fame?.piracy || 0,
            isComplete: () => (state.fame?.piracy || 0) >= 5000,
          },
          {
            id: 'cat_2_gold',
            description: 'Amass 20,000 Gold in your fleet treasury.',
            targetType: 'gold',
            targetValue: 2000,
            currentValue: () => state.gold,
            isComplete: () => state.gold >= 20000,
          },
        ],
        rewardDescription: 'Spanish Flagship Bribe, +10,000 Gold',
        onComplete: () => {
          state.gold += 10000;
          state.fame.piracy = (state.fame.piracy || 0) + 1000;
        },
      },
    ],
  },

  // 4: Ali Vezas (Ottoman Empire)
  '4': {
    protagonistId: '4',
    protagonistName: 'Ali Vezas',
    campaignTitle: 'Rise of the Levant Merchant King',
    chapters: [
      {
        chapter: 1,
        title: 'Prologue: From Rags to Caravels',
        synopsis: 'An impoverished youth in the bustling bazaars of Istanbul, you dream of rebuilding your family’s fortune and providing for your sister Safiye. Turn modest coin into mercantile power.',
        hint: 'Purchase Turkish Carpets in Istanbul and sell them in Venice or Alexandria for tremendous profits.',
        objectives: [
          {
            id: 'ali_1_gold',
            description: 'Accumulate 10,000 Gold in trading profits.',
            targetType: 'gold',
            targetValue: 10000,
            currentValue: () => state.gold,
            isComplete: () => state.gold >= 10000,
          },
          {
            id: 'ali_1_fame',
            description: 'Earn 1,000 Trade Fame with merchant guilds.',
            targetType: 'fame',
            targetValue: 1000,
            currentValue: () => state.fame?.trade || 0,
            isComplete: () => (state.fame?.trade || 0) >= 1000,
          },
        ],
        rewardDescription: 'Merchant Guild Honor, +3,000 Gold, Trade Fame +500',
        onComplete: () => {
          state.gold += 3000;
          state.fame.trade = (state.fame.trade || 0) + 500;
        },
      },
      {
        chapter: 2,
        title: 'Chapter 2: The Spice Hegemony',
        synopsis: 'Sultan Suleiman the Magnificent welcomes your commercial achievements. Expand Ottoman trade routes beyond the Red Sea toward the Malabar Coast of India.',
        hint: 'Sail to Goa (Port 86) and Calicut to import high-value Nutmeg and Pepper, returning with unprecedented fortunes.',
        objectives: [
          {
            id: 'ali_2_gold',
            description: 'Build a merchant treasury of 50,000 Gold.',
            targetType: 'gold',
            targetValue: 50000,
            currentValue: () => state.gold,
            isComplete: () => state.gold >= 50000,
          },
          {
            id: 'ali_2_rank',
            description: 'Attain Viscount rank or higher at Topkapi Palace.',
            targetType: 'rank',
            targetValue: 6,
            currentValue: () => state.nobilityRank || 0,
            isComplete: () => (state.nobilityRank || 0) >= 6,
          },
        ],
        rewardDescription: 'Grand Vizier Trading Charter, +25,000 Gold',
        onComplete: () => {
          state.gold += 25000;
        },
      },
    ],
  },
};

export const getCurrentCampaign = (): ProtagonistCampaign => {
  const protId = state.protagonistId || '1';
  return campaigns[protId] || campaigns['1'];
};

export const getCurrentChapter = (): CampaignChapter => {
  const campaign = getCurrentCampaign();
  const currentChapterNum = state.scenarioChapter || 1;
  const chapter = campaign.chapters.find((c) => c.chapter === currentChapterNum);
  return chapter || campaign.chapters[0];
};

export const isCurrentChapterComplete = (): boolean => {
  const chapter = getCurrentChapter();
  return chapter.objectives.every((obj) => obj.isComplete());
};

export const completeCurrentChapter = (): {
  success: boolean;
  message: string;
  nextChapter?: number;
} => {
  const campaign = getCurrentCampaign();
  const chapter = getCurrentChapter();

  if (!isCurrentChapterComplete()) {
    return {
      success: false,
      message: 'You have not yet completed all required chapter objectives!',
    };
  }

  // Execute chapter rewards
  chapter.onComplete();

  const nextChapterNum = chapter.chapter + 1;
  const nextChapterExists = campaign.chapters.some((c) => c.chapter === nextChapterNum);

  if (nextChapterExists) {
    state.scenarioChapter = nextChapterNum;
    return {
      success: true,
      message: `🎉 CHAPTER COMPLETE: ${chapter.title}!\nReward: ${chapter.rewardDescription}\n\nYou have unlocked Chapter ${nextChapterNum}!`,
      nextChapter: nextChapterNum,
    };
  }

  return {
    success: true,
    message: `🏆 CAMPAIGN TRIUMPH: You have completed all chapters of ${campaign.campaignTitle}!\nYour name will be immortalized across maritime history!`,
  };
};
