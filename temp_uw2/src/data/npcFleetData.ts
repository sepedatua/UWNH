import type { Position } from '../types';
import type { Cargo } from '../game/world/fleets';

export type RegionalBasin =
  | 'mediterranean'
  | 'north_europe'
  | 'west_africa'
  | 'caribbean'
  | 'indian_ocean'
  | 'southeast_asia'
  | 'east_asia'
  | 'oceanic';

export type FleetArchetype = 'merchant' | 'pirate' | 'patrol';

export interface BasinBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface NpcShipTemplate {
  shipTypeId: string; // ID in shipData.ts (e.g. '11' for Galleon, '18' for Junk)
  name: string;
  crew: number;
  durability: number;
  guns?: number;
  cargo: Cargo[];
}

export interface NpcFleetTemplate {
  templateId: string;
  name: string;
  captainName: string;
  nation: 'Portugal' | 'Spain' | 'England' | 'Holland' | 'Ottoman' | 'Genoa' | 'Pirate' | 'Ming' | 'Japan';
  archetype: FleetArchetype;
  flagshipId: string; // Determines sprite (oared vs non-oared)
  ships: NpcShipTemplate[];
  tradeRoute: [string, string]; // [originPortId, destinationPortId]
  dialogRumor: string;
  bountyGold?: number;
  hostile: boolean;
}

export interface RegionDefinition {
  id: RegionalBasin;
  name: string;
  bounds: BasinBounds;
  fleetTemplates: NpcFleetTemplate[];
}

export const REGIONAL_BASINS: Record<RegionalBasin, RegionDefinition> = {
  mediterranean: {
    id: 'mediterranean',
    name: 'Mediterranean & Black Sea',
    bounds: { minX: 810, maxX: 1060, minY: 320, maxY: 430 },
    fleetTemplates: [
      {
        templateId: 'med_portugal_wine',
        name: 'Portuguese Wine & Oil Convoy',
        captainName: 'Captain Duarte',
        nation: 'Portugal',
        archetype: 'merchant',
        flagshipId: '7', // Caravela Redonda
        ships: [
          {
            shipTypeId: '7',
            name: 'São Jerónimo',
            crew: 30,
            durability: 30,
            guns: 10,
            cargo: [
              { type: 'water', quantity: 50 },
              { type: 'food', quantity: 50 },
              { type: 'Wine', quantity: 30 },
              { type: 'Olive Oil', quantity: 20 },
            ],
          },
          {
            shipTypeId: '9', // Nao
            name: 'Santa Clara',
            crew: 45,
            durability: 50,
            guns: 15,
            cargo: [
              { type: 'water', quantity: 60 },
              { type: 'food', quantity: 60 },
              { type: 'Rock Salt', quantity: 40 },
            ],
          },
        ],
        tradeRoute: ['1', '2'], // Lisbon ⇄ Seville
        dialogRumor: 'Fair winds to ye! The merchants in Seville are paying a handsome ransom for Portuguese vintage wine.',
        hostile: false,
      },
      {
        templateId: 'med_venice_galeass',
        name: 'Venetian Silk Fleet',
        captainName: 'Commodore Grimaldi',
        nation: 'Genoa',
        archetype: 'merchant',
        flagshipId: '21', // Venetian Galeass (oared)
        ships: [
          {
            shipTypeId: '21',
            name: 'Leone di San Marco',
            crew: 120,
            durability: 90,
            guns: 40,
            cargo: [
              { type: 'water', quantity: 80 },
              { type: 'food', quantity: 80 },
              { type: 'Silk', quantity: 50 },
              { type: 'Glassware', quantity: 30 },
            ],
          },
        ],
        tradeRoute: ['17', '24'], // Venice ⇄ Alexandria
        dialogRumor: 'Greetings navigator. Venice controls the Adriatic, but watch the Levant shores for Ottoman corsairs.',
        hostile: false,
      },
      {
        templateId: 'med_barbary_corsair',
        name: 'Barbary Corsair Fleet',
        captainName: 'Khayr ad-Din Barbarossa',
        nation: 'Pirate',
        archetype: 'pirate',
        flagshipId: '12', // Xebec
        ships: [
          {
            shipTypeId: '12',
            name: 'Sea Wolf',
            crew: 150,
            durability: 70,
            guns: 35,
            cargo: [
              { type: 'water', quantity: 70 },
              { type: 'food', quantity: 70 },
              { type: 'shot', quantity: 50 },
            ],
          },
          {
            shipTypeId: '19', // Light Galley
            name: 'Dagger of Algiers',
            crew: 30,
            durability: 40,
            guns: 10,
            cargo: [
              { type: 'water', quantity: 40 },
              { type: 'food', quantity: 40 },
            ],
          },
        ],
        tradeRoute: ['5', '6'], // Algiers ⇄ Tunis
        dialogRumor: 'Stand and deliver your gold to the Red Beard, or feed the Mediterranean fishes!',
        bountyGold: 12000,
        hostile: true,
      },
      {
        templateId: 'med_spanish_patrol',
        name: 'Spanish Mediterranean Armada',
        captainName: 'Admiral Perez',
        nation: 'Spain',
        archetype: 'patrol',
        flagshipId: '11', // Galleon
        ships: [
          {
            shipTypeId: '11',
            name: 'San Felipe',
            crew: 160,
            durability: 80,
            guns: 60,
            cargo: [
              { type: 'water', quantity: 80 },
              { type: 'food', quantity: 80 },
              { type: 'shot', quantity: 60 },
            ],
          },
        ],
        tradeRoute: ['2', '14'], // Seville ⇄ Barcelona
        dialogRumor: 'Halt in the name of the Spanish Crown! Keep a sharp lookout for French raiders and Moorish corsairs.',
        hostile: false,
      },
    ],
  },

  north_europe: {
    id: 'north_europe',
    name: 'Northern Europe & Baltic Sea',
    bounds: { minX: 800, maxX: 960, minY: 220, maxY: 330 },
    fleetTemplates: [
      {
        templateId: 'ne_english_wool',
        name: 'English Wool & Cloth Fleet',
        captainName: 'Captain Hawkins',
        nation: 'England',
        archetype: 'merchant',
        flagshipId: '10', // Carrack
        ships: [
          {
            shipTypeId: '10',
            name: 'Golden Rose',
            crew: 80,
            durability: 50,
            guns: 25,
            cargo: [
              { type: 'water', quantity: 60 },
              { type: 'food', quantity: 60 },
              { type: 'Wool', quantity: 50 },
              { type: 'Tin', quantity: 30 },
            ],
          },
        ],
        tradeRoute: ['3', '10'], // London ⇄ Antwerp
        dialogRumor: 'Good day! The mills of London are turning English wool into royal coin across the Channel.',
        hostile: false,
      },
      {
        templateId: 'ne_dutch_fluyt',
        name: 'Dutch Baltic Grain Fluyt',
        captainName: 'Captain Van Rijn',
        nation: 'Holland',
        archetype: 'merchant',
        flagshipId: '20', // Flemish Galleon
        ships: [
          {
            shipTypeId: '20',
            name: 'De Vliegende Hollander',
            crew: 90,
            durability: 80,
            guns: 25,
            cargo: [
              { type: 'water', quantity: 70 },
              { type: 'food', quantity: 70 },
              { type: 'Grain', quantity: 80 },
              { type: 'Cheese', quantity: 30 },
            ],
          },
        ],
        tradeRoute: ['11', '31'], // Amsterdam ⇄ Hamburg
        dialogRumor: 'Dag navigator! Baltic wheat is cheap in Danzig and feeds all of Amsterdam.',
        hostile: false,
      },
      {
        templateId: 'ne_north_sea_pirate',
        name: 'North Sea Reavers',
        captainName: 'Captain Blackeye',
        nation: 'Pirate',
        archetype: 'pirate',
        flagshipId: '8', // Brigantine
        ships: [
          {
            shipTypeId: '8',
            name: 'Sea Raven',
            crew: 55,
            durability: 40,
            guns: 20,
            cargo: [
              { type: 'water', quantity: 40 },
              { type: 'food', quantity: 40 },
              { type: 'shot', quantity: 30 },
            ],
          },
        ],
        tradeRoute: ['31', '34'], // Hamburg ⇄ Oslo
        dialogRumor: 'The stormy North Sea swallows many ships... and your cargo will soon belong to us!',
        bountyGold: 6500,
        hostile: true,
      },
    ],
  },

  west_africa: {
    id: 'west_africa',
    name: 'West Africa & Guinea Coast',
    bounds: { minX: 770, maxX: 980, minY: 400, maxY: 760 },
    fleetTemplates: [
      {
        templateId: 'wa_india_run',
        name: 'Carreira da Índia Fleet',
        captainName: 'Commodore Albuquerque',
        nation: 'Portugal',
        archetype: 'merchant',
        flagshipId: '11', // Galleon
        ships: [
          {
            shipTypeId: '11',
            name: 'São Gabriel',
            crew: 150,
            durability: 80,
            guns: 50,
            cargo: [
              { type: 'water', quantity: 100 },
              { type: 'food', quantity: 100 },
              { type: 'Gold', quantity: 40 },
              { type: 'Ivory', quantity: 30 },
            ],
          },
        ],
        tradeRoute: ['1', '44'], // Lisbon ⇄ Luanda
        dialogRumor: 'The Cape of Storms is treacherous, but Lisbon will pay a kingdom for Guinea gold and African ivory.',
        hostile: false,
      },
      {
        templateId: 'wa_gold_trader',
        name: 'Guinea Coast Gold Convoy',
        captainName: 'Captain Cabral',
        nation: 'Portugal',
        archetype: 'merchant',
        flagshipId: '7', // Caravela Redonda
        ships: [
          {
            shipTypeId: '7',
            name: 'Esperança',
            crew: 35,
            durability: 30,
            guns: 15,
            cargo: [
              { type: 'water', quantity: 50 },
              { type: 'food', quantity: 50 },
              { type: 'Gold', quantity: 25 },
            ],
          },
        ],
        tradeRoute: ['7', '8'], // Madeira ⇄ Las Palmas
        dialogRumor: 'Keep plenty of citrus aboard, brother! The equatorial doldrums will drain your crew in a fortnight.',
        hostile: false,
      },
    ],
  },

  caribbean: {
    id: 'caribbean',
    name: 'Caribbean & Spanish Main',
    bounds: { minX: 350, maxX: 580, minY: 460, maxY: 640 },
    fleetTemplates: [
      {
        templateId: 'car_silver_armada',
        name: 'Flota de Indias Silver Fleet',
        captainName: 'Don Pedro de Valdivia',
        nation: 'Spain',
        archetype: 'merchant',
        flagshipId: '11', // Galleon
        ships: [
          {
            shipTypeId: '11',
            name: 'Nuestra Señora de Atocha',
            crew: 180,
            durability: 80,
            guns: 65,
            cargo: [
              { type: 'water', quantity: 90 },
              { type: 'food', quantity: 90 },
              { type: 'Silver', quantity: 90 },
              { type: 'Gold', quantity: 40 },
            ],
          },
        ],
        tradeRoute: ['56', '54'], // Veracruz ⇄ Havana
        dialogRumor: 'These holds are sealed with royal wax for His Majesty King Philip. Steer clear of English privateers!',
        hostile: false,
      },
      {
        templateId: 'car_tortuga_buccaneer',
        name: 'Tortuga Freebooter Crew',
        captainName: 'Henry "Redbeard" Morgan',
        nation: 'Pirate',
        archetype: 'pirate',
        flagshipId: '15', // Frigate
        ships: [
          {
            shipTypeId: '15',
            name: 'Black Pearl',
            crew: 140,
            durability: 80,
            guns: 50,
            cargo: [
              { type: 'water', quantity: 60 },
              { type: 'food', quantity: 60 },
              { type: 'shot', quantity: 45 },
            ],
          },
          {
            shipTypeId: '14', // Sloop
            name: 'Revenge',
            crew: 40,
            durability: 50,
            guns: 20,
            cargo: [
              { type: 'water', quantity: 30 },
              { type: 'food', quantity: 30 },
            ],
          },
        ],
        tradeRoute: ['55', '53'], // Jamaica ⇄ Santiago
        dialogRumor: 'Ahoy, matey! Spanish silver shines brightest when taken under the black flag!',
        bountyGold: 15000,
        hostile: true,
      },
    ],
  },

  indian_ocean: {
    id: 'indian_ocean',
    name: 'Indian Ocean & Arabian Sea',
    bounds: { minX: 1040, maxX: 1420, minY: 480, maxY: 740 },
    fleetTemplates: [
      {
        templateId: 'io_arabian_dhow',
        name: 'Muscat Frankincense Dhow',
        captainName: 'Sheikh Tariq',
        nation: 'Ottoman',
        archetype: 'merchant',
        flagshipId: '3', // Dhow
        ships: [
          {
            shipTypeId: '3',
            name: 'Nasr al-Bahr',
            crew: 20,
            durability: 30,
            guns: 10,
            cargo: [
              { type: 'water', quantity: 40 },
              { type: 'food', quantity: 40 },
              { type: 'Frankincense', quantity: 40 },
              { type: 'Pearls', quantity: 20 },
            ],
          },
        ],
        tradeRoute: ['38', '39'], // Aden ⇄ Muscat
        dialogRumor: 'Peace be upon you traveler. Arabian frankincense and Persian rugs fetch great fortunes in Cairo.',
        hostile: false,
      },
      {
        templateId: 'io_goa_spice',
        name: 'Portuguese Estado da Índia Fleet',
        captainName: 'Captain Da Gama',
        nation: 'Portugal',
        archetype: 'merchant',
        flagshipId: '9', // Nao
        ships: [
          {
            shipTypeId: '9',
            name: 'Flor da Mar',
            crew: 80,
            durability: 50,
            guns: 30,
            cargo: [
              { type: 'water', quantity: 70 },
              { type: 'food', quantity: 70 },
              { type: 'Pepper', quantity: 60 },
              { type: 'Cinnamon', quantity: 40 },
            ],
          },
        ],
        tradeRoute: ['69', '70'], // Goa ⇄ Calicut
        dialogRumor: 'Malabar black pepper is worth its weight in gold in Lisbon. Keep your gun ports open against corsairs.',
        hostile: false,
      },
      {
        templateId: 'io_malabar_corsair',
        name: 'Malabar Corsair War Dhow',
        captainName: 'Corsair Kunjali',
        nation: 'Pirate',
        archetype: 'pirate',
        flagshipId: '12', // Xebec
        ships: [
          {
            shipTypeId: '12',
            name: 'Thunder of Calicut',
            crew: 90,
            durability: 70,
            guns: 30,
            cargo: [
              { type: 'water', quantity: 50 },
              { type: 'food', quantity: 50 },
              { type: 'shot', quantity: 30 },
            ],
          },
        ],
        tradeRoute: ['70', '72'], // Calicut ⇄ Ceylon
        dialogRumor: 'No European conqueror passes the Malabar coast without paying tribute to the sea lords!',
        bountyGold: 8500,
        hostile: true,
      },
    ],
  },

  southeast_asia: {
    id: 'southeast_asia',
    name: 'Southeast Asia & Java Sea',
    bounds: { minX: 1420, maxX: 1680, minY: 550, maxY: 750 },
    fleetTemplates: [
      {
        templateId: 'sea_moluccan_spice_junk',
        name: 'Moluccan Spice Trade Junk',
        captainName: 'Juragan Surya',
        nation: 'Ming',
        archetype: 'merchant',
        flagshipId: '18', // Junk
        ships: [
          {
            shipTypeId: '18',
            name: 'Naga Laut',
            crew: 70,
            durability: 80,
            guns: 25,
            cargo: [
              { type: 'water', quantity: 70 },
              { type: 'food', quantity: 70 },
              { type: 'Nutmeg', quantity: 50 },
              { type: 'Cloves', quantity: 50 },
            ],
          },
        ],
        tradeRoute: ['88', '87'], // Ternate ⇄ Malacca
        dialogRumor: 'Tabik, Captain! The islands of Banda and Ternate hold the world’s only true clove and nutmeg groves.',
        hostile: false,
      },
      {
        templateId: 'sea_javanese_sunda_trader',
        name: 'Sunda Pepper & Silk Trader',
        captainName: 'Captain Raden',
        nation: 'Portugal',
        archetype: 'merchant',
        flagshipId: '18', // Junk
        ships: [
          {
            shipTypeId: '18',
            name: 'Sri Wijaya',
            crew: 60,
            durability: 80,
            guns: 20,
            cargo: [
              { type: 'water', quantity: 60 },
              { type: 'food', quantity: 60 },
              { type: 'Pepper', quantity: 60 },
              { type: 'Silk', quantity: 30 },
            ],
          },
        ],
        tradeRoute: ['92', '87'], // Sunda ⇄ Malacca
        dialogRumor: 'The Java Sea waters are peaceful today, but navigate carefully around the Bangka shallows and Sunda reefs.',
        hostile: false,
      },
      {
        templateId: 'sea_malacca_raider',
        name: 'Malacca Strait Sea Raiders',
        captainName: 'Pirate Panglima',
        nation: 'Pirate',
        archetype: 'pirate',
        flagshipId: '19', // Light Galley (fast oared)
        ships: [
          {
            shipTypeId: '19',
            name: 'Garuda Hitam',
            crew: 35,
            durability: 40,
            guns: 15,
            cargo: [
              { type: 'water', quantity: 30 },
              { type: 'food', quantity: 30 },
              { type: 'shot', quantity: 20 },
            ],
          },
          {
            shipTypeId: '18', // Junk
            name: 'Buaya Laut',
            crew: 70,
            durability: 80,
            guns: 25,
            cargo: [
              { type: 'water', quantity: 50 },
              { type: 'food', quantity: 50 },
            ],
          },
        ],
        tradeRoute: ['87', '91'], // Malacca ⇄ Pasei
        dialogRumor: 'The narrow straits belong to the Orang Laut! Hand over your spices or surrender your flagship!',
        bountyGold: 9500,
        hostile: true,
      },
    ],
  },

  east_asia: {
    id: 'east_asia',
    name: 'East Asia & China Seas',
    bounds: { minX: 1680, maxX: 1960, minY: 380, maxY: 600 },
    fleetTemplates: [
      {
        templateId: 'ea_ming_tribute',
        name: 'Ming Treasure Junk Convoy',
        captainName: 'Grand Envoy Zheng',
        nation: 'Ming',
        archetype: 'merchant',
        flagshipId: '18', // Junk
        ships: [
          {
            shipTypeId: '18',
            name: 'Wan Shou',
            crew: 90,
            durability: 80,
            guns: 35,
            cargo: [
              { type: 'water', quantity: 80 },
              { type: 'food', quantity: 80 },
              { type: 'Porcelain', quantity: 60 },
              { type: 'Tea', quantity: 50 },
            ],
          },
        ],
        tradeRoute: ['83', '96'], // Quanzhou ⇄ Nagasaki
        dialogRumor: 'Greetings from the Middle Kingdom. Jingdezhen porcelain and high-mountain tea are revered in Japanese castles.',
        hostile: false,
      },
      {
        templateId: 'ea_wokou_pirate',
        name: 'Wokou Sea Reavers',
        captainName: 'Lord Kuki',
        nation: 'Pirate',
        archetype: 'pirate',
        flagshipId: '24', // Atakabune
        ships: [
          {
            shipTypeId: '24',
            name: 'Kurofune',
            crew: 140,
            durability: 60,
            guns: 30,
            cargo: [
              { type: 'water', quantity: 60 },
              { type: 'food', quantity: 60 },
              { type: 'shot', quantity: 30 },
            ],
          },
        ],
        tradeRoute: ['96', '83'], // Nagasaki ⇄ Quanzhou
        dialogRumor: 'The sea belongs to the brave! Draw your blade, gaijin!',
        bountyGold: 11000,
        hostile: true,
      },
    ],
  },

  oceanic: {
    id: 'oceanic',
    name: 'High Seas & Deep Ocean',
    bounds: { minX: 0, maxX: 2160, minY: 0, maxY: 1080 },
    fleetTemplates: [
      {
        templateId: 'oc_global_explorer',
        name: 'High Seas Exploration Fleet',
        captainName: 'Captain Magellan',
        nation: 'Portugal',
        archetype: 'merchant',
        flagshipId: '7', // Caravela Redonda
        ships: [
          {
            shipTypeId: '7',
            name: 'Trinidad',
            crew: 40,
            durability: 30,
            guns: 15,
            cargo: [
              { type: 'water', quantity: 60 },
              { type: 'food', quantity: 60 },
            ],
          },
        ],
        tradeRoute: ['1', '92'], // Lisbon ⇄ Sunda
        dialogRumor: 'We chart unknown seas beyond the edge of maps. Godspeed on your voyage, fellow navigator!',
        hostile: false,
      },
    ],
  },
};

/**
 * Returns the regional maritime basin matching given world map coordinates.
 */
export function getBasinForCoordinates(x: number, y: number): RegionalBasin {
  const normX = ((x % 2160) + 2160) % 2160;

  // Check specific regional basins in order of priority before oceanic fallback
  const specificBasins: RegionalBasin[] = [
    'mediterranean',
    'north_europe',
    'southeast_asia',
    'caribbean',
    'indian_ocean',
    'east_asia',
    'west_africa',
  ];

  for (const basinId of specificBasins) {
    const { bounds } = REGIONAL_BASINS[basinId];
    if (
      normX >= bounds.minX &&
      normX <= bounds.maxX &&
      y >= bounds.minY &&
      y <= bounds.maxY
    ) {
      return basinId;
    }
  }

  return 'oceanic';
}
