export interface ProtagonistConfig {
  id: string;
  name: string;
  nation: string;
  homePortId: string;
  homePortName: string;
  desc: string;
  startingGold: number;
  startingDebt: number;
  startingShip: {
    id: string;
    name: string;
    crew: number;
    durability: number;
  };
  startingMates: { sailorId: string; role: any }[];
  prologueTitle: string;
  prologueStory: string;
  objective: string;
}

export const PROTAGONISTS: ProtagonistConfig[] = [
  {
    id: '1',
    name: 'João Franco',
    nation: 'Portugal',
    homePortId: '1',
    homePortName: 'Lisbon',
    desc: 'Portuguese Nobleman & Seeker of Atlantis',
    startingGold: 1000,
    startingDebt: 0,
    startingShip: { id: '14', name: 'Hermes', crew: 15, durability: 40 },
    startingMates: [
      { sailorId: '1', role: null },
      { sailorId: '32', role: 'firstMate' }, // Rocco Alemkel
    ],
    prologueTitle: 'The Legacy of Atlantis',
    prologueStory:
      'In Lisbon, year 1522. Duke Leon Franco summons his young son João to the grand palace estate. "João, the time has come for you to chart your own course as an officer of Portugal. Uncover the riddle of Atlantis, solve our family legacy, and uphold the Franco honor!" Veteran navigator Rocco Alemkel waits at Lisbon Harbor ready to guide your maiden voyage.',
    objective:
      'Visit Lisbon Harbor to join Rocco, provision the Hermes with food and water, and set sail into the Atlantic.',
  },
  {
    id: '2',
    name: 'Catalina Erantzo',
    nation: 'Spain',
    homePortId: '2',
    homePortName: 'Seville',
    desc: 'Renegade Spanish Naval Officer turned Pirate',
    startingGold: 1000,
    startingDebt: 0,
    startingShip: { id: '8', name: 'Santa Cruz', crew: 30, durability: 55 },
    startingMates: [
      { sailorId: '2', role: null },
      { sailorId: '35', role: 'firstMate' }, // Andreas Baes
    ],
    prologueTitle: 'Vow of Vengeance',
    prologueStory:
      'In Seville, news arrives at naval headquarters: the Spanish squadron commanded by Catalina\'s brother and fiancé has vanished in an ambush by warships bearing the Portuguese Franco crest. Ignored by royal bureaucracy, Catalina cuts her hair, commandeers the warship Santa Cruz with Andreas Baes, and hoists the pirate flag to track down the truth.',
    objective:
      'Board the Santa Cruz in Seville Harbor, recruit crew at the Pub, and hunt down clues across the Mediterranean.',
  },
  {
    id: '3',
    name: 'Otto Baynes',
    nation: 'England',
    homePortId: '30',
    homePortName: 'London',
    desc: 'Knighted English Royal Privateer',
    startingGold: 3000,
    startingDebt: 0,
    startingShip: { id: '11', name: 'Victoria', crew: 50, durability: 80 },
    startingMates: [
      { sailorId: '3', role: null },
      { sailorId: '36', role: 'firstMate' }, // Matthew Baker
    ],
    prologueTitle: 'Knight of the English Crown',
    prologueStory:
      'At the royal palace in London, King Henry VIII secretly commissions Otto Baynes. England must break the Spanish maritime monopoly over the high seas. Knighted as an undercover privateer with the mighty galleon Victoria and master shipwright Matthew Baker, Otto is charged with building English naval supremacy.',
    objective:
      'Arm the Victoria with cannons at the London Shipyard, hire sailors at the Pub, and patrol the English Channel.',
  },
  {
    id: '4',
    name: 'Ernst Von Bohr',
    nation: 'Holland',
    homePortId: '34',
    homePortName: 'Amsterdam',
    desc: 'Dutch World Cartographer',
    startingGold: 5000,
    startingDebt: 0,
    startingShip: { id: '4', name: 'Zeeland', crew: 25, durability: 50 },
    startingMates: [
      { sailorId: '4', role: null },
      { sailorId: '37', role: 'firstMate' }, // Hans Hucken
    ],
    prologueTitle: 'Charting the Earth',
    prologueStory:
      'In Amsterdam, legendary geographer Gerardus Mercator commissions his most gifted pupil, Ernst Von Bohr. "Venture to every horizon, traverse uncharted passages, and draw the first true map of the world." Accompanied by his young assistant Hans Hucken, Ernst prepares the expedition ship Zeeland to map the unknown seas.',
    objective:
      'Equip navigational instruments at the Item Shop, sign an expedition contract with Mercator, and set sail into Northern waters.',
  },
  {
    id: '5',
    name: 'Pietro Conti',
    nation: 'Italy',
    homePortId: '9',
    homePortName: 'Genoa',
    desc: 'Italian Treasure Hunter & Explorer',
    startingGold: 0,
    startingDebt: 10000,
    startingShip: { id: '3', name: 'Latina', crew: 15, durability: 35 },
    startingMates: [
      { sailorId: '5', role: null },
      { sailorId: '38', role: 'firstMate' }, // Camilo Stefan
    ],
    prologueTitle: 'In Search of El Dorado',
    prologueStory:
      'In Genoa, Pietro Conti faces ruin. Left with a 10,000 gold debt by his deceased father, bill collectors give him an ultimatum. Determined to turn the tables, Pietro partners with his clever friend Camilo: set sail into undiscovered lands, unearth ancient treasures, and discover the legendary Golden City of El Dorado to pay off the bank!',
    objective:
      'Speak with the Marco Polo Bank in Genoa, gather discovery rumors at the Pub, and set sail toward African exploration outposts.',
  },
  {
    id: '6',
    name: 'Ali Vezas',
    nation: 'Ottoman',
    homePortId: '3',
    homePortName: 'Istanbul',
    desc: 'Ottoman Merchant Tycoon',
    startingGold: 1000,
    startingDebt: 0,
    startingShip: { id: '3', name: 'Gull', crew: 15, durability: 30 },
    startingMates: [
      { sailorId: '6', role: null },
      { sailorId: '39', role: 'firstMate' }, // Salim
    ],
    prologueTitle: 'The Merchant of Istanbul',
    prologueStory:
      'In Istanbul, street orphan Ali Vezas secures a 1,000 gold loan with his childhood friend Salim. In the shadow of the Grand Bazaar, Ali vows to turn his humble dhow into the greatest trading syndicate in the Mediterranean, with one sacred dream: buying the freedom and happiness of his beloved Safiko.',
    objective:
      'Purchase local carpets at Istanbul Market, trade with nearby Mediterranean ports, and invest in merchant vessels.',
  },
];

export const HOME_PORTS_BY_NATION: Record<string, { id: string; name: string }> = {
  Portugal: { id: '1', name: 'Lisbon' },
  Spain: { id: '2', name: 'Seville' },
  Ottoman: { id: '3', name: 'Istanbul' },
  Italy: { id: '9', name: 'Genoa' },
  England: { id: '30', name: 'London' },
  Holland: { id: '34', name: 'Amsterdam' },
};

export interface CareerAmbition {
  id: string;
  name: string;
  desc: string;
  gold: number;
  ship: {
    id: string;
    name: string;
    crew: number;
    durability: number;
    cargo: any[];
  };
}

export const AMBITIONS: CareerAmbition[] = [
  {
    id: 'merchant',
    name: '🪙 Merchant Syndicate',
    desc: 'Starts with 3,000 Gold, a spacious Trading Buss (Zeeland-class) with 180 Cargo, and an Accounting mate. Focus on trade fame and building economic wealth.',
    gold: 3000,
    ship: { id: '4', name: 'Merchant Star', crew: 20, durability: 50, cargo: [] },
  },
  {
    id: 'corsair',
    name: '⚔️ Naval Corsair',
    desc: 'Starts with 2,000 Gold, an armed War Brigantine with 30 crew, cannons, and a Gunnery mate. Focus on piracy fame and hunting merchant fleets.',
    gold: 2000,
    ship: { id: '8', name: 'Sea Hawk', crew: 30, durability: 55, cargo: [] },
  },
  {
    id: 'explorer',
    name: '🧭 Royal Cartographer',
    desc: 'Starts with 2,500 Gold, a swift Sloop equipped with navigational tools, and a Cartography mate. Focus on charting coastlines and discovering ancient ruins.',
    gold: 2500,
    ship: { id: '14', name: 'Wanderer', crew: 15, durability: 40, cargo: [] },
  },
  {
    id: 'hardcore',
    name: '🪵 Humble Wanderer (Survival)',
    desc: 'Starts with only 500 Gold and a small Balsa. Pure roguelike permadeath survival from the very bottom!',
    gold: 500,
    ship: { id: '1', name: 'Humble Balsa', crew: 8, durability: 30, cargo: [] },
  },
];

export const NATIONS = ['Portugal', 'Spain', 'Ottoman', 'England', 'Holland', 'Italy'];
