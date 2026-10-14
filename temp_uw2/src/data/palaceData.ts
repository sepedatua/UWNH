export interface NobilityRank {
  rank: number;
  title: string;
  minFame: number;
  salutation: string;
  perks: string;
}

export const nobilityRanks: NobilityRank[] = [
  { rank: 0, title: 'Commoner', minFame: 0, salutation: 'Wanderer', perks: 'No royal privileges.' },
  { rank: 1, title: 'Page', minFame: 500, salutation: 'Page', perks: 'Audience admitted past palace guards.' },
  { rank: 2, title: 'Squire', minFame: 1500, salutation: 'Squire', perks: 'Eligible for diplomatic dispatches.' },
  { rank: 3, title: 'Knight', minFame: 3000, salutation: 'Sir', perks: 'Royal Tax Exemption Permit (0% purchase tax).' },
  { rank: 4, title: 'Baronet', minFame: 6000, salutation: 'Sir', perks: 'Royal Fleet escort recognition.' },
  { rank: 5, title: 'Baron', minFame: 10000, salutation: 'Lord Baron', perks: 'Access to high-tier royal bounties.' },
  { rank: 6, title: 'Viscount', minFame: 15000, salutation: 'Lord Viscount', perks: 'Crown subsidies during financial distress.' },
  { rank: 7, title: 'Count', minFame: 20000, salutation: 'My Lord Count', perks: 'Command of sovereign naval expeditions.' },
  { rank: 8, title: 'Marquis', minFame: 25000, salutation: 'Most Noble Marquis', perks: 'Veto in imperial port treaties.' },
  { rank: 9, title: 'Duke', minFame: 30000, salutation: 'Your Grace', perks: 'Grand Admiral of the Royal Armada.' },
];

export interface Monarch {
  nation: string;
  capitalPortId: string;
  name: string;
  title: string;
  greeting: string;
  courtChamberlain: string;
}

export const monarchs: Record<string, Monarch> = {
  Portugal: {
    nation: 'Portugal',
    capitalPortId: '1',
    name: 'King Manuel I',
    title: 'King of Portugal and the Algarves',
    greeting: 'The King raises his golden scepter: “Welcome to the Court of Lisbon! Portugal’s caravels bridge the four oceans.”',
    courtChamberlain: 'Lord Chamberlain Dom Duarte',
  },
  Spain: {
    nation: 'Spain',
    capitalPortId: '2',
    name: 'King Carlos I',
    title: 'King of Spain and Holy Roman Emperor',
    greeting: 'The Emperor gazes with stern majesty: “Welcome to the Alcázar of Seville! Under the Spanish cross, the sun never sets.”',
    courtChamberlain: 'Grandee Don Fernando',
  },
  Ottoman: {
    nation: 'Ottoman',
    capitalPortId: '3',
    name: 'Sultan Suleiman I',
    title: 'Suleiman the Magnificent, Padishah of the Ottoman Empire',
    greeting: 'The Sultan reclines upon silk cushions: “Peace be upon you, brave captain! The Sublime Porte welcomes valiant warriors.”',
    courtChamberlain: 'Grand Vizier Ibrahim Pasha',
  },
  'Ottoman Empire': {
    nation: 'Ottoman Empire',
    capitalPortId: '3',
    name: 'Sultan Suleiman I',
    title: 'Suleiman the Magnificent, Padishah of the Ottoman Empire',
    greeting: 'The Sultan reclines upon silk cushions: “Peace be upon you, brave captain! The Sublime Porte welcomes valiant warriors.”',
    courtChamberlain: 'Grand Vizier Ibrahim Pasha',
  },
  England: {
    nation: 'England',
    capitalPortId: '30',
    name: 'King Henry VIII',
    title: 'King of England and Lord of Ireland',
    greeting: 'The King barks a hearty laugh: “Welcome to Whitehall! England’s wooden walls need stout captains like you!”',
    courtChamberlain: 'Lord Chancellor Thomas Wolsey',
  },
  Netherlands: {
    nation: 'Netherlands',
    capitalPortId: '34',
    name: 'Prince Maurice of Nassau',
    title: 'Stadtholder of the United Provinces',
    greeting: 'The Prince extends a firm handshake: “Welcome to Amsterdam! Freedom, commerce, and navigation guide our republic.”',
    courtChamberlain: 'Pensionary Johan van Oldenbarnevelt',
  },
  Italy: {
    nation: 'Italy',
    capitalPortId: '9',
    name: 'Doge Andrea Doria',
    title: 'Doge and Grand Admiral of Genoa',
    greeting: 'The Doge bows with republican nobility: “Welcome, captain! The merchant galleys of Liguria command Mediterranean destiny.”',
    courtChamberlain: 'Chancellor Spinola',
  },
};

export interface RoyalMission {
  id: string;
  nation: string;
  type: 'pirate_hunt' | 'diplomatic_delivery' | 'procure_commodity' | 'reclaim_port';
  title: string;
  description: string;
  targetName: string;
  targetId: string;
  targetQuantity?: number;
  rewardGold: number;
  rewardRankIncrement: number;
  deadlineDays: number;
  daysRemaining: number;
}

export const generateRoyalMission = (nation: string, _currentRank: number = 0): RoyalMission => {
  const missionPool: RoyalMission[] = [
    {
      id: `mission_pirate_${Date.now()}`,
      nation,
      type: 'pirate_hunt',
      title: 'Scourge of the Atlantic: Hunt Down Corsair Ismail',
      description: 'The infamous pirate Corsair Ismail is raiding trade convoys off Cape Finisterre. Engage his battle fleet, defeat him in cannon warfare or captain’s duel, and restore peace to our waters!',
      targetName: 'Corsair Raider Ismail',
      targetId: 'Off Cape Finisterre',
      rewardGold: 12000,
      rewardRankIncrement: 1,
      deadlineDays: 90,
      daysRemaining: 90,
    },
    {
      id: `mission_diplomacy_${Date.now()}`,
      nation,
      type: 'diplomatic_delivery',
      title: 'Royal Dispatch: Treaty Ratification with Alexandria',
      description: 'His Majesty commands you to deliver a sealed royal treaty parchment directly to the Governor of Alexandria (Port 19). Make all haste across the Mediterranean!',
      targetName: 'Alexandria Governor',
      targetId: '19',
      rewardGold: 8000,
      rewardRankIncrement: 1,
      deadlineDays: 60,
      daysRemaining: 60,
    },
    {
      id: `mission_commodity_${Date.now()}`,
      nation,
      type: 'procure_commodity',
      title: 'Imperial Banquet: Procure 30 Units of Spices',
      description: 'The Royal Court prepares for the coronation feast. Procure at least 30 units of fine Spices or Cinnamon from the Levant or Indies and deliver them to the royal palace storage.',
      targetName: 'Spices',
      targetId: 'Spices',
      targetQuantity: 30,
      rewardGold: 15000,
      rewardRankIncrement: 1,
      deadlineDays: 120,
      daysRemaining: 120,
    },
    {
      id: `mission_reclaim_${Date.now()}`,
      nation,
      type: 'reclaim_port',
      title: 'Diplomatic Influence: Invest in Ceuta',
      description: 'Foreign powers threaten our strategic foothold at the Strait of Gibraltar. Sail to Ceuta (Port 27) and invest at least 10,000 Gold pieces into its Harbor or Market to secure our crown allegiance!',
      targetName: 'Ceuta',
      targetId: '27',
      rewardGold: 10000,
      rewardRankIncrement: 1,
      deadlineDays: 90,
      daysRemaining: 90,
    },
  ];

  const selected = missionPool[Math.floor(Math.random() * missionPool.length)];
  return selected;
};

export const getMonarchForNation = (nation: string): Monarch => {
  return (
    monarchs[nation] || {
      nation,
      capitalPortId: '1',
      name: 'His Royal Majesty',
      title: 'Sovereign of the Realm',
      greeting: 'The King sits on his velvet throne: “Welcome, loyal navigator! Stand before your sovereign.”',
      courtChamberlain: 'Grand Chamberlain',
    }
  );
};
