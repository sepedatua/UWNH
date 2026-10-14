export type CommodityCategory =
  | 'Food'
  | 'Beverage'
  | 'Textile'
  | 'Luxury'
  | 'Metal'
  | 'Spice'
  | 'Aroma'
  | 'Weapon';

export interface Commodity {
  id: string;
  name: string;
  category: CommodityCategory;
  basePrice: number;
  icon: string;
  desc: string;
  // Ports that produce and sell this item (port IDs matching regularPorts 1-based index)
  originPorts: string[];
  // Producing market regions (1-13)
  originRegions: string[];
}

export const COMMODITIES: Commodity[] = [
  // --- FOODSTUFFS ---
  {
    id: '1',
    name: 'Rock Salt',
    category: 'Food',
    basePrice: 40,
    icon: '🧂',
    desc: 'Essential mineral for food preservation and curing meat at sea.',
    originPorts: ['1', '14'], // Lisbon, Barcelona
    originRegions: ['1'],
  },
  {
    id: '2',
    name: 'Olive Oil',
    category: 'Food',
    basePrice: 75,
    icon: '🫒',
    desc: 'Golden oil pressed from Mediterranean olives. Highly sought worldwide.',
    originPorts: ['1', '13', '18', '21'], // Lisbon, Valencia, Naples, Athens
    originRegions: ['1', '3'],
  },
  {
    id: '3',
    name: 'Grain',
    category: 'Food',
    basePrice: 30,
    icon: '🌾',
    desc: 'Staple wheat and barley for daily sustenance.',
    originPorts: ['4', '16', '19', '28'], // Ceuta, Salonika, Syracuse, Plymouth
    originRegions: ['1', '2', '3', '4'],
  },
  {
    id: '4',
    name: 'Cheese',
    category: 'Food',
    basePrice: 65,
    icon: '🧀',
    desc: 'Aged Dutch and Scandinavian cheese with prolonged shelf life.',
    originPorts: ['34', '35'], // Amsterdam, Copenhagen
    originRegions: ['2'],
  },
  {
    id: '5',
    name: 'Sugar',
    category: 'Food',
    basePrice: 110,
    icon: '🍬',
    desc: 'Sweet crystals harvested from Atlantic island and Caribbean cane plantations.',
    originPorts: ['5', '6', '41', '42'], // Madeira, Santa Cruz, Santo Domingo, San Juan
    originRegions: ['1', '7'],
  },

  // --- BEVERAGES ---
  {
    id: '6',
    name: 'Wine',
    category: 'Beverage',
    basePrice: 85,
    icon: '🍷',
    desc: 'Fine aged vintage from French, Portuguese and Mediterranean vineyards.',
    originPorts: ['5', '17', '26', '27'], // Madeira, Bordeaux, Nantes, Candia
    originRegions: ['1', '2', '3'],
  },
  {
    id: '7',
    name: 'Tea',
    category: 'Beverage',
    basePrice: 220,
    icon: '🍵',
    desc: 'Exquisite fragrant dried green and black leaves from the Far East.',
    originPorts: ['72', '73'], // Macau, Changan
    originRegions: ['13'],
  },
  {
    id: '8',
    name: 'Coffee',
    category: 'Beverage',
    basePrice: 180,
    icon: '☕',
    desc: 'Dark aromatic roasted beans originating from the Arabian Red Sea port of Mocha.',
    originPorts: ['50'], // Aden
    originRegions: ['10'],
  },
  {
    id: '9',
    name: 'Cocoa',
    category: 'Beverage',
    basePrice: 160,
    icon: '🍫',
    desc: 'Sacred Mesoamerican cacao beans used to brew rich invigorating nectar.',
    originPorts: ['44', '45'], // Cartagena, Maracaibo
    originRegions: ['7', '8'],
  },

  // --- TEXTILES & FABRICS ---
  {
    id: '10',
    name: 'Wool',
    category: 'Textile',
    basePrice: 90,
    icon: '🧶',
    desc: 'Warm durable wool spun from English and Flemish pasture sheep.',
    originPorts: ['30', '31', '33'], // London, Bristol, Antwerp
    originRegions: ['2'],
  },
  {
    id: '11',
    name: 'Cotton',
    category: 'Textile',
    basePrice: 110,
    icon: '🌱',
    desc: 'Light breathable raw cotton harvested along the Nile and Levantine basins.',
    originPorts: ['22', '23', '55'], // Alexandria, Cairo, Diu
    originRegions: ['4', '11'],
  },
  {
    id: '12',
    name: 'Silk',
    category: 'Textile',
    basePrice: 420,
    icon: '👘',
    desc: 'Sumptuous lustrous fabric woven from imperial Chinese and Italian silkworms.',
    originPorts: ['9', '70', '72', '75'], // Genoa, Quanzhou, Macau, Nagasaki
    originRegions: ['3', '13'],
  },
  {
    id: '13',
    name: 'Velvet',
    category: 'Textile',
    basePrice: 320,
    icon: '🧣',
    desc: 'Plush densely woven royal fabric prized by European aristocracy.',
    originPorts: ['11', '12', '33'], // Venice, Pisa, Antwerp
    originRegions: ['2', '3'],
  },
  {
    id: '14',
    name: 'Carpet',
    category: 'Textile',
    basePrice: 280,
    icon: '🏮',
    desc: 'Intricately patterned hand-knotted Persian and Ottoman rugs.',
    originPorts: ['3', '47', '48', '49'], // Istanbul, Beirut, Hormuz, Basra
    originRegions: ['5', '10'],
  },

  // --- LUXURIES & JEWELRY ---
  {
    id: '15',
    name: 'Glass Beads',
    category: 'Luxury',
    basePrice: 80,
    icon: '🔮',
    desc: 'Vibrant Venetian blown glass beads, eager trade currency in African outposts.',
    originPorts: ['11', '34'], // Venice, Amsterdam
    originRegions: ['2', '3'],
  },
  {
    id: '16',
    name: 'Pottery',
    category: 'Luxury',
    basePrice: 130,
    icon: '🏺',
    desc: 'Glazed earthenware and fine Seville ceramics.',
    originPorts: ['2', '70'], // Seville, Quanzhou
    originRegions: ['1', '13'],
  },
  {
    id: '17',
    name: 'Ivory',
    category: 'Luxury',
    basePrice: 550,
    icon: '🐘',
    desc: 'Exotic elephant tusks traded along the Gold Coast and Swahili shores.',
    originPorts: ['8', '51', '52', '53'], // San Jorge, Sofala, Mozambique, Mombasa
    originRegions: ['6', '9'],
  },
  {
    id: '18',
    name: 'Pearls',
    category: 'Luxury',
    basePrice: 750,
    icon: '🦪',
    desc: 'Pristine iridescent natural pearls gathered by Persian Gulf divers.',
    originPorts: ['48'], // Hormuz
    originRegions: ['10'],
  },
  {
    id: '19',
    name: 'Diamonds',
    category: 'Luxury',
    basePrice: 1600,
    icon: '💎',
    desc: 'Brilliant unpolished precious gemstones of extraordinary value.',
    originPorts: ['51', '57'], // Sofala, Ceylon
    originRegions: ['9', '11'],
  },

  // --- METALS & MINERALS ---
  {
    id: '20',
    name: 'Silver',
    category: 'Metal',
    basePrice: 650,
    icon: '🪙',
    desc: 'Precious bullion mined from deep Alpine veins and Andean deposits.',
    originPorts: ['9', '36', '43', '75'], // Genoa, Lübeck, Portobelo, Nagasaki
    originRegions: ['2', '3', '7', '13'],
  },
  {
    id: '21',
    name: 'Gold',
    category: 'Metal',
    basePrice: 1250,
    icon: '🏆',
    desc: 'Heavy gleaming bullion bar; the universal currency of kings and empires.',
    originPorts: ['8', '40', '43', '51'], // San Jorge, Timbuktu, Portobelo, Sofala
    originRegions: ['6', '7', '9'],
  },
  {
    id: '22',
    name: 'Iron Ore',
    category: 'Metal',
    basePrice: 70,
    icon: '⛏️',
    desc: 'Dense raw iron required by shipwrights and armories.',
    originPorts: ['37', '38', '76'], // Hamburg, Stockholm, Sakai
    originRegions: ['2', '13'],
  },
  {
    id: '23',
    name: 'Tin Ore',
    category: 'Metal',
    basePrice: 90,
    icon: '🪨',
    desc: 'Mined from Cornish pits in Britain, essential for casting bronze and pewter.',
    originPorts: ['30', '31'], // London, Bristol
    originRegions: ['2'],
  },

  // --- SPICES ---
  {
    id: '24',
    name: 'Pepper',
    category: 'Spice',
    basePrice: 190,
    icon: '🌶️',
    desc: '"Black Gold" from the Malabar coast of India. Worth more than its weight in silver in Europe.',
    originPorts: ['54', '56', '60'], // Goa, Calicut, Pasai
    originRegions: ['11', '12'],
  },
  {
    id: '25',
    name: 'Cinnamon',
    category: 'Spice',
    basePrice: 240,
    icon: '🪵',
    desc: 'Sweet fragrant inner bark peeled exclusively on the isle of Ceylon.',
    originPorts: ['56', '57', '59'], // Calicut, Ceylon, Malacca
    originRegions: ['11', '12'],
  },
  {
    id: '26',
    name: 'Clove',
    category: 'Spice',
    basePrice: 310,
    icon: '🌿',
    desc: 'Dried aromatic flower buds grown only on the legendary Spice Islands (Moluccas).',
    originPorts: ['62', '63'], // Amboina, Ternate
    originRegions: ['12'],
  },
  {
    id: '27',
    name: 'Nutmeg',
    category: 'Spice',
    basePrice: 290,
    icon: '🌰',
    desc: 'Pungent spice harvested alongside mace in the secluded Banda archipelago.',
    originPorts: ['59', '61', '62'], // Malacca, Banda, Amboina
    originRegions: ['12'],
  },

  // --- AROMATICS & MEDICINE ---
  {
    id: '28',
    name: 'Frankincense',
    category: 'Aroma',
    basePrice: 170,
    icon: '🕯️',
    desc: 'Fragrant resin tapped from desert trees, sacred to mosques and cathedrals.',
    originPorts: ['3', '23', '46', '50'], // Istanbul, Cairo, Muscat, Aden
    originRegions: ['5', '10'],
  },
  {
    id: '29',
    name: 'Musk',
    category: 'Aroma',
    basePrice: 380,
    icon: '🌸',
    desc: 'Intense lasting glandular perfume harvested from high mountain fauna.',
    originPorts: ['53'], // Malindi
    originRegions: ['9'],
  },

  // --- WEAPONS & MUNITIONS ---
  {
    id: '30',
    name: 'Weapons',
    category: 'Weapon',
    basePrice: 210,
    icon: '⚔️',
    desc: 'Tempered steel cutlasses, polearms, and crossbows forged in European arsenals.',
    originPorts: ['14', '22'], // Barcelona, Alexandria
    originRegions: ['1', '4'],
  },
  {
    id: '31',
    name: 'Firearms',
    category: 'Weapon',
    basePrice: 340,
    icon: '🔫',
    desc: 'Matchlock arquebuses and cast iron ship swivel cannons from royal armories.',
    originPorts: ['2'], // Seville
    originRegions: ['1'],
  },
];

/**
 * Calculate the selling price of a commodity at a target port.
 * Incorporates geographic arbitrage: distance from origin region dramatically increases profit!
 */
export const calculateSellPrice = (
  commodity: Commodity,
  targetPortRegionId: string,
  targetMarketRate: number = 100, // 50 - 150
): number => {
  const isLocalOrigin = commodity.originRegions.includes(targetPortRegionId);
  
  let regionalMultiplier = 1.0;

  if (isLocalOrigin) {
    regionalMultiplier = 0.85; // Local origin gives lower resale profit
  } else {
    // Arbitrage tier based on commodity category and destination
    switch (commodity.category) {
      case 'Spice':
        // Spices sold in Europe or Middle East yield immense returns
        regionalMultiplier = ['1', '2', '3', '5'].includes(targetPortRegionId) ? 4.8 : 2.5;
        break;
      case 'Luxury':
        // Silk, Ivory, Pearls, Diamonds sold far away
        regionalMultiplier = ['1', '2', '3'].includes(targetPortRegionId) ? 3.8 : 2.2;
        break;
      case 'Metal':
        // Gold/Silver sold in industrial hubs
        regionalMultiplier = ['1', '2', '3', '13'].includes(targetPortRegionId) ? 2.4 : 1.5;
        break;
      case 'Weapon':
        // European weapons sold to Africa or Far East
        regionalMultiplier = ['6', '7', '8', '9', '13'].includes(targetPortRegionId) ? 3.2 : 1.4;
        break;
      case 'Beverage':
      case 'Food':
        regionalMultiplier = ['1', '2'].includes(targetPortRegionId) ? 2.2 : 1.6;
        break;
      default:
        regionalMultiplier = 1.8;
    }
  }

  const marketRateFactor = targetMarketRate / 100;
  const unitPrice = Math.round(commodity.basePrice * regionalMultiplier * marketRateFactor);
  return Math.max(10, unitPrice);
};

/**
 * Calculate the purchase price of a commodity at its producing port.
 */
export const calculateBuyPrice = (
  commodity: Commodity,
  marketRate: number = 100, // 50 - 150
): number => {
  const marketRateFactor = marketRate / 100;
  return Math.max(5, Math.round(commodity.basePrice * marketRateFactor));
};
