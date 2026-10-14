export interface Discovery {
  id: string;
  name: string;
  category: 'ruins' | 'monster' | 'flora_fauna' | 'wonder' | 'historic';
  rank: '☆' | 'A' | 'B' | 'C';
  fameReward: number;
  goldValue: number; // Contract cash-in value at Guild Collector
  position: { x: number; y: number };
  radius: number;
  lore: string;
  historicalSignificance: string;
  icon: string;
}

export const discoveries: Discovery[] = [
  {
    id: 'stonehenge',
    name: 'Stonehenge Megaliths',
    category: 'ruins',
    rank: 'B',
    fameReward: 350,
    goldValue: 12000,
    position: { x: 890, y: 265 },
    radius: 18,
    lore: 'Enormous standing stones arranged in concentric rings on Salisbury Plain. Aligned with the solstices, their construction defies ancient explanation.',
    historicalSignificance: 'Prehistoric astronomical observatory and sacred ceremonial ring of ancient Britain.',
    icon: '🗿',
  },
  {
    id: 'pyramids',
    name: 'The Great Pyramids & Sphinx',
    category: 'historic',
    rank: '☆',
    fameReward: 1000,
    goldValue: 50000,
    position: { x: 1084, y: 430 },
    radius: 20,
    lore: 'Colossal stone monuments soaring from the desert sands of Giza, guarded by the eternal gaze of the limestone Sphinx.',
    historicalSignificance: 'Tombs of Pharaohs Khufu, Khafre, and Menkaure, and the sole surviving Wonder of the Ancient World.',
    icon: '🏛️',
  },
  {
    id: 'great_wall',
    name: 'Great Wall of China',
    category: 'historic',
    rank: '☆',
    fameReward: 950,
    goldValue: 45000,
    position: { x: 1560, y: 330 },
    radius: 25,
    lore: 'A serpentine dragon of stone and brick undulating thousands of li across rugged mountains and high desert passes.',
    historicalSignificance: 'Defensive bastion constructed by Chinese imperial dynasties to repel nomadic incursions from the Eurasian steppe.',
    icon: '🧱',
  },
  {
    id: 'moai',
    name: 'Moai of Rapa Nui',
    category: 'ruins',
    rank: 'A',
    fameReward: 750,
    goldValue: 35000,
    position: { x: 210, y: 720 },
    radius: 20,
    lore: 'Towering monolithic statues carved from volcanic tuff, resting on stone platforms (ahu) facing inward across the loneliest island on Earth.',
    historicalSignificance: 'Sacred ancestral figures of the Polynesian Rapa Nui civilization.',
    icon: '🗿',
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis (Northern Lights)',
    category: 'wonder',
    rank: 'A',
    fameReward: 600,
    goldValue: 28000,
    position: { x: 970, y: 110 },
    radius: 25,
    lore: 'Spectacular ethereal ribbons of emerald and violet fire dancing across the polar night sky above frozen fjords and glaciers.',
    historicalSignificance: 'Atmospheric light display caused by cosmic solar particles colliding with Earth’s magnetic field.',
    icon: '🌌',
  },
  {
    id: 'victoria_falls',
    name: 'Victoria Falls (Mosi-oa-Tunya)',
    category: 'wonder',
    rank: 'A',
    fameReward: 700,
    goldValue: 30000,
    position: { x: 1050, y: 690 },
    radius: 22,
    lore: '“The Smoke That Thunders” — a mile-wide curtain of falling water plunging into a roaring basalt chasm on the Zambezi River.',
    historicalSignificance: 'One of the greatest natural waterfalls on Earth, producing spray visible from over thirty miles away.',
    icon: '🌊',
  },
  {
    id: 'komodo',
    name: 'Komodo Dragon',
    category: 'flora_fauna',
    rank: 'B',
    fameReward: 450,
    goldValue: 18000,
    position: { x: 1510, y: 640 },
    radius: 20,
    lore: 'A monstrous lizard resembling a prehistoric drake, reaching ten feet in length and equipped with armor-like scales and lethal venomous bite.',
    historicalSignificance: 'The largest living monitor lizard species, surviving exclusively in the Lesser Sunda islands.',
    icon: '🦎',
  },
  {
    id: 'giant_moa',
    name: 'Giant Moa of Aotearoa',
    category: 'flora_fauna',
    rank: 'A',
    fameReward: 650,
    goldValue: 25000,
    position: { x: 1820, y: 840 },
    radius: 22,
    lore: 'An enormous flightless avian standing over twelve feet tall, grazing serenely among fern-carpeted primeval forests.',
    historicalSignificance: 'Megafaunal flightless bird endemic to New Zealand.',
    icon: '🦤',
  },
  {
    id: 'el_dorado',
    name: 'El Dorado (City of Gold)',
    category: 'ruins',
    rank: '☆',
    fameReward: 1200,
    goldValue: 60000,
    position: { x: 510, y: 560 },
    radius: 20,
    lore: 'A hidden golden sanctuary nestled deep in the Amazon basin, adorned with pure hammered gold plaques and sacred emerald offerings.',
    historicalSignificance: 'The legendary golden kingdom sought by Spanish conquistadors and New World explorers.',
    icon: '👑',
  },
  {
    id: 'white_whale',
    name: 'The Great White Whale',
    category: 'monster',
    rank: '☆',
    fameReward: 1100,
    goldValue: 55000,
    position: { x: 740, y: 820 },
    radius: 25,
    lore: 'A titanic albino sperm whale scarred by iron harpoons, breaching the turbulent waters of the roaring forties with unbridled fury.',
    historicalSignificance: 'The apex leviathan of maritime folklore, inspiring generations of deep-sea whalers and novelists.',
    icon: '🐋',
  },
  {
    id: 'nazca_lines',
    name: 'Nazca Desert Geoglyphs',
    category: 'ruins',
    rank: 'B',
    fameReward: 500,
    goldValue: 20000,
    position: { x: 420, y: 680 },
    radius: 20,
    lore: 'Gigantic geometric shapes and animal figures scraped into the arid coastal desert plateau, discernible in their entirety only from the heavens.',
    historicalSignificance: 'Sacred geoglyphs etched by the Nazca civilization between 500 BCE and 500 CE.',
    icon: '🦅',
  },
  {
    id: 'taj_mahal',
    name: 'Taj Mahal (Crown Palace)',
    category: 'historic',
    rank: 'A',
    fameReward: 800,
    goldValue: 40000,
    position: { x: 1360, y: 480 },
    radius: 20,
    lore: 'An ivory-white marble mausoleum on the Yamuna river, decorated with intricate Pietra Dura gemstone inlays and reflecting pools.',
    historicalSignificance: 'Masterpiece of Mughal architecture, an enduring monument of romantic devotion.',
    icon: '🕌',
  },
  {
    id: 'chichen_itza',
    name: 'Chichén Itzá (El Castillo)',
    category: 'ruins',
    rank: 'A',
    fameReward: 700,
    goldValue: 32000,
    position: { x: 340, y: 490 },
    radius: 20,
    lore: 'A massive step pyramid dedicated to the Feathered Serpent Kukulkan. On the equinoxes, shadows create the illusion of a snake slithering down its balustrades.',
    historicalSignificance: 'Major ceremonial center and astronomical capital of the Maya civilization in Yucatan.',
    icon: '🐍',
  },
  {
    id: 'krakatoa',
    name: 'Krakatoa Volcano',
    category: 'wonder',
    rank: 'B',
    fameReward: 500,
    goldValue: 22000,
    position: { x: 1445, y: 630 },
    radius: 20,
    lore: 'A volcanic island caldera belching sulfurous steam and black ash into the tropical sky, vibrating the sea floor beneath passing keels.',
    historicalSignificance: 'Notorious caldera in the Sunda Strait, site of the most catastrophic volcanic detonations in recorded history.',
    icon: '🌋',
  },
  {
    id: 'loch_ness',
    name: 'Loch Ness Monster (Nessie)',
    category: 'monster',
    rank: 'A',
    fameReward: 650,
    goldValue: 30000,
    position: { x: 885, y: 215 },
    radius: 18,
    lore: 'A long-necked aquatic cryptid with serpentine humps, gliding silently through the peat-dark waters of the Scottish Highlands.',
    historicalSignificance: 'Scotland’s most celebrated mythical lake creature, dating back to 6th-century monastic chronicles.',
    icon: '🦕',
  },
  {
    id: 'mount_fuji',
    name: 'Mount Fuji (Fuji-san)',
    category: 'wonder',
    rank: 'B',
    fameReward: 550,
    goldValue: 24000,
    position: { x: 1720, y: 395 },
    radius: 22,
    lore: 'An exceptionally symmetrical snow-capped volcanic cone revered as a sacred mountain by the Japanese people.',
    historicalSignificance: 'Spiritual symbol of Japan and immortalized subject of Ukiyo-e woodblock prints.',
    icon: '🗻',
  },
  {
    id: 'atlantis_ruins',
    name: 'Sunken Ruins of Atlantis',
    category: 'ruins',
    rank: '☆',
    fameReward: 1500,
    goldValue: 80000,
    position: { x: 670, y: 420 },
    radius: 25,
    lore: 'Submerged cyclopean marble columns, concentric aqueducts, and orichalcum reliefs resting upon an underwater sea mount in the open Atlantic.',
    historicalSignificance: 'The lost utopian maritime empire chronicled by Plato, swallowed beneath the waves in a single day and night.',
    icon: '🔱',
  },
];

export const getDiscoveryById = (id: string): Discovery | undefined => {
  return discoveries.find((d) => d.id === id);
};

export const getNearbyDiscovery = (
  x: number,
  y: number,
  alreadyDiscovered: string[] = [],
): Discovery | null => {
  for (const disc of discoveries) {
    if (alreadyDiscovered.includes(disc.id)) continue;

    // Handle cylindrical wrap for X (width 2160)
    let dx = Math.abs(x - disc.position.x);
    if (dx > 1080) {
      dx = 2160 - dx;
    }
    const dy = Math.abs(y - disc.position.y);
    const dist = Math.hypot(dx, dy);

    if (dist <= disc.radius) {
      return disc;
    }
  }
  return null;
};

export const DISCOVERIES = discoveries;
