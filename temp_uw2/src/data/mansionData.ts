import { Sailor, SailorSkills } from './sailorData';

export interface MansionInfo {
  portId: string;
  portName: string;
  estateName: string;
  residentName: string;
  title: string;
  greeting: string;
  teachSkill?: SailorSkills;
  skillCost?: number;
  skillReqs?: string;
  checkPrereqs?: (stats: Sailor['stats'], battleLevel?: number) => boolean;
  isCollector: boolean;
  isCartographer: boolean;
  explorationRumor: string;
}

export const mansionData: Record<string, MansionInfo> = {
  // 1: Lisbon
  '1': {
    portId: '1',
    portName: 'Lisbon',
    estateName: 'Ferrero Family Manor',
    residentName: 'Duchess Christiana Franco',
    title: 'Noble Matron of the House of Franco',
    greeting:
      'Duchess Christiana Franco welcomes you with regal grace: “Welcome to the Franco estate, Captain. Our family has charted oceans and served the Portuguese Crown for generations. How may our household assist your expedition?”',
    teachSkill: 'Negotiation',
    skillCost: 3000,
    skillReqs: 'Charm ≥ 70',
    checkPrereqs: (stats) => stats.charm >= 70,
    isCollector: true,
    isCartographer: false,
    explorationRumor:
      '“Whispers from Portuguese sailors tell of an ancient circle of giant monolithic stones standing in the mists of Britannia (Stonehenge, 51°N, 1°W).”',
  },
  // 2: Seville
  '2': {
    portId: '2',
    portName: 'Seville',
    estateName: 'Medina Sidonia Palace',
    residentName: 'Don Alonso de Guzmán',
    title: 'Duke of Medina Sidonia & Commander of the Ocean Sea',
    greeting:
      'The Duke of Medina Sidonia surveys his charts with martial dignity: “Captain, Seville is the beating heart of Spain’s Atlantic trade. If you possess the courage of a true naval officer, my admiralty officers can sharpen your gunnery.”',
    teachSkill: 'Gunnery',
    skillCost: 4000,
    skillReqs: 'Courage ≥ 70, Battle Level ≥ 3',
    checkPrereqs: (stats, battleLevel = 1) => stats.courage >= 70 && battleLevel >= 3,
    isCollector: true,
    isCartographer: false,
    explorationRumor:
      '“Spanish caravels patrolling near the Canary Islands report towering smoking volcanic peaks and strange ancient guanche caverns.”',
  },
  // 3: Istanbul
  '3': {
    portId: '3',
    portName: 'Istanbul',
    estateName: 'Topkapi Grand Pavilion',
    residentName: 'Pargalı Ibrahim Pasha',
    title: 'Grand Vizier of the Ottoman Empire',
    greeting:
      'The Grand Vizier sips spiced tea amid silk tapestries: “Welcome, voyager of the Levant. The Golden Horn welcomes those who bring valuable knowledge, rare relics, and respectful diplomacy to the High Porte.”',
    teachSkill: 'Negotiation',
    skillCost: 3500,
    skillReqs: 'Charm ≥ 70',
    checkPrereqs: (stats) => stats.charm >= 70,
    isCollector: true,
    isCartographer: false,
    explorationRumor:
      '“Bedouin caravans passing through the desert murmur of a rose-red city carved straight out of sandstone cliffs in the canyon of Petra.”',
  },
  // 4: Barcelona
  '4': {
    portId: '4',
    portName: 'Barcelona',
    estateName: 'Royal Cosmography Studio',
    residentName: 'Diogo Ribeiro',
    title: 'Royal Cosmographer & Hydrographer',
    greeting:
      'Diogo Ribeiro inspects an astrolabe and brass dividers: “Ah, an adventurous mariner! I am compiling the Padrón Real — the official world chart of all known lands. Sign an expedition contract with me and map the uncharted seas!”',
    teachSkill: 'Cartography',
    skillCost: 5000,
    skillReqs: 'Knowledge ≥ 70, Intuition ≥ 70, Seamanship ≥ 70',
    checkPrereqs: (stats) =>
      stats.knowledge >= 70 && stats.intuition >= 70 && stats.seamanship >= 70,
    isCollector: false,
    isCartographer: true,
    explorationRumor:
      '“Norse sailors speak of a freezing ocean where white bears hunt across floating sea ice and the midnight sun never sets.”',
  },
  // 10: Pisa
  '10': {
    portId: '10',
    portName: 'Pisa',
    estateName: 'Galilei Villa & Observatory',
    residentName: 'Galileo Galilei',
    title: 'Professor of Mathematics & Natural Philosophy',
    greeting:
      'Galileo looks up from his telescope with keen eyes: “Welcome, navigator! The earth and heavens dance to geometric harmony. With proper mathematics, the stars above can guide your vessel through the darkest tempest.”',
    teachSkill: 'Celestial Navigation',
    skillCost: 3000,
    skillReqs: 'Knowledge ≥ 65, Intuition ≥ 65',
    checkPrereqs: (stats) => stats.knowledge >= 65 && stats.intuition >= 65,
    isCollector: true,
    isCartographer: true,
    explorationRumor:
      '“Through my telescope and ancient Roman chronicles, I have deduced that ancient labyrinthine ruins lie submerged near the south coast of Crete.”',
  },
  // 11: Naples
  '11': {
    portId: '11',
    portName: 'Naples',
    estateName: 'Palazzo Colonna',
    residentName: 'Marquess Fabrizio Colonna',
    title: 'Patrician of Naples & Merchant Scholar',
    greeting:
      'Marquess Colonna welcomes you warmly: “Good captain! Mediterranean commerce requires sharp accounting and iron ledger books. Without sound math, the finest caravel will sink in red ink!”',
    teachSkill: 'Accounting',
    skillCost: 2500,
    skillReqs: 'Knowledge ≥ 60',
    checkPrereqs: (stats) => stats.knowledge >= 60,
    isCollector: true,
    isCartographer: false,
    explorationRumor:
      '“Fishermen near Mount Vesuvius whisper of marble statues and golden frescoes buried under volcanic ash near Pompeii.”',
  },
  // 13: Palma
  '13': {
    portId: '13',
    portName: 'Palma',
    estateName: 'Majorcan Chart Academy',
    residentName: 'Master Cresques',
    title: 'Dean of the Catalan Atlas School',
    greeting:
      'The elder geographer unfurls a lavish portolan chart: “Majorcan charts have guided sailors from the Baltic to the Red Sea. If you have the intellect, learn the noble craft of cartography and map the globe!”',
    teachSkill: 'Cartography',
    skillCost: 4500,
    skillReqs: 'Knowledge ≥ 70, Intuition ≥ 70, Seamanship ≥ 70',
    checkPrereqs: (stats) =>
      stats.knowledge >= 70 && stats.intuition >= 70 && stats.seamanship >= 70,
    isCollector: false,
    isCartographer: true,
    explorationRumor:
      '“North African merchants tell of an immense salt route crossing the blistering Sahara to the wealthy mud-brick empire of Timbuktu.”',
  },
  // 14: Venice
  '14': {
    portId: '14',
    portName: 'Venice',
    estateName: 'Palazzo Verrazano',
    residentName: 'Giovanni da Verrazano',
    title: 'Venetian Maritime Explorer & Patrician',
    greeting:
      'Giovanni da Verrazano welcomes you over a goblet of Chianti: “Greetings, fellow captain! Venice commands the eastern seas, but my eyes look to the boundless western ocean. Will you chart the unknown with us?”',
    teachSkill: 'Cartography',
    skillCost: 5000,
    skillReqs: 'Knowledge ≥ 70, Intuition ≥ 70, Seamanship ≥ 70',
    checkPrereqs: (stats) =>
      stats.knowledge >= 70 && stats.intuition >= 70 && stats.seamanship >= 70,
    isCollector: true,
    isCartographer: true,
    explorationRumor:
      '“Across the Atlantic, beyond the Spanish Main, lies a vast sheltered bay and river valley where native tribes trade fine beaver pelts.”',
  },
  // 19: Alexandria
  '19': {
    portId: '19',
    portName: 'Alexandria',
    estateName: 'Academy of the Great Pharos',
    residentName: 'Ahmad Al-Kindi',
    title: 'Curator of Ancient Manuscripts',
    greeting:
      'The venerable scholar bows with deep respect: “Peace be upon you, traveler. Though the ancient Library is no more, our archives preserve the astronomical secrets of Ptolemy and Eratosthenes.”',
    teachSkill: 'Celestial Navigation',
    skillCost: 3000,
    skillReqs: 'Knowledge ≥ 65, Intuition ≥ 65',
    checkPrereqs: (stats) => stats.knowledge >= 65 && stats.intuition >= 65,
    isCollector: true,
    isCartographer: true,
    explorationRumor:
      '“Journey south past Cairo along the fertile Nile: the Great Pyramids and the silent Sphinx still look across eternity.”',
  },
  // 28: Bordeaux
  '28': {
    portId: '28',
    portName: 'Bordeaux',
    estateName: 'Manor of Antiquities',
    residentName: 'Professor Mordecai',
    title: 'Grand Collector of World Antiquities',
    greeting:
      'Professor Mordecai adjusts his spectacles enthusiastically: “Aha! An explorer from the high seas! I collect the wonders of the world — strange beasts, ancient ruins, and forgotten relics. Bring your discovery reports to me and I will reward you handsomely with gold and fame!”',
    teachSkill: 'Accounting',
    skillCost: 2500,
    skillReqs: 'Knowledge ≥ 60',
    checkPrereqs: (stats) => stats.knowledge >= 60,
    isCollector: true,
    isCartographer: false,
    explorationRumor:
      '“Whispers from Celtic fishermen tell of deep sea monsters with colossal white fins sighted in the freezing waters off Iceland!”',
  },
  // 33: Antwerp
  '33': {
    portId: '33',
    portName: 'Antwerp',
    estateName: 'Theatrum Orbis Terrarum Hall',
    residentName: 'Abraham Ortelius',
    title: 'Master Geographer & Atlas Publisher',
    greeting:
      'Ortelius arranges engraved copper printing plates: “Welcome, Captain! I am publishing the very first unified world atlas. Every sea mile and coastline you explore brings us closer to mapping God’s creation!”',
    teachSkill: 'Cartography',
    skillCost: 5000,
    skillReqs: 'Knowledge ≥ 70, Intuition ≥ 70, Seamanship ≥ 70',
    checkPrereqs: (stats) =>
      stats.knowledge >= 70 && stats.intuition >= 70 && stats.seamanship >= 70,
    isCollector: false,
    isCartographer: true,
    explorationRumor:
      '“The mouth of the Amazon river across the Atlantic pours so much fresh water into the ocean that sailors can drink from the sea miles off shore!”',
  },
  // 34: Amsterdam
  '34': {
    portId: '34',
    portName: 'Amsterdam',
    estateName: 'Mercator Geodetic Institute',
    residentName: 'Gerardus Mercator',
    title: 'Master of Modern Cartography',
    greeting:
      'Gerardus Mercator points to a massive globe: “Ah, Captain! On my projection, a straight line drawn upon the chart is a course of constant bearing. Learn cartography from me, sign my charter, and let us unveil the entire globe!”',
    teachSkill: 'Cartography',
    skillCost: 5000,
    skillReqs: 'Knowledge ≥ 70, Intuition ≥ 70, Seamanship ≥ 70',
    checkPrereqs: (stats) =>
      stats.knowledge >= 70 && stats.intuition >= 70 && stats.seamanship >= 70,
    isCollector: false,
    isCartographer: true,
    explorationRumor:
      '“South of the stormy Cape of Good Hope lies a vast Indian Ocean where ancient sailors tell of the legendary island of Madagascar and giant birds.”',
  },
  // 35: Copenhagen
  '35': {
    portId: '35',
    portName: 'Copenhagen',
    estateName: 'Uraniborg Observatory Estate',
    residentName: 'Tycho Brahe',
    title: 'Royal Astronomer of Denmark',
    greeting:
      'Tycho Brahe consults a giant brass quadrant: “Welcome! The northern stars shine with crystalline clarity. With celestial navigation, the Pole Star will keep you on true course through any pitch-black fog.”',
    teachSkill: 'Celestial Navigation',
    skillCost: 3000,
    skillReqs: 'Knowledge ≥ 65, Intuition ≥ 65',
    checkPrereqs: (stats) => stats.knowledge >= 65 && stats.intuition >= 65,
    isCollector: true,
    isCartographer: true,
    explorationRumor:
      '“In the far northern seas near Svalbard, shimmering ribbons of green and violet light dance across the winter heavens — the Aurora Borealis!”',
  },
  // 36: Hamburg
  '36': {
    portId: '36',
    portName: 'Hamburg',
    estateName: 'Hanseatic Kontor & Guildhall',
    residentName: 'Johann von Hamburg',
    title: 'Grand Syndic of the Hanseatic League',
    greeting:
      'The Hanseatic Syndic strikes the table firmly: “A captain must protect his ships! Baltic trade is plagued by privateers and pirates. Master gunnery, keep your powder dry, and let your carronades speak truth!”',
    teachSkill: 'Gunnery',
    skillCost: 4000,
    skillReqs: 'Courage ≥ 70, Battle Level ≥ 3',
    checkPrereqs: (stats, battleLevel = 1) => stats.courage >= 70 && battleLevel >= 3,
    isCollector: true,
    isCartographer: false,
    explorationRumor:
      '“Russian fur trappers in the White Sea speak of giant tusked walruses and mammoth bones preserved in permanent ice.”',
  },
  // 65: Timbuktu
  '65': {
    portId: '65',
    portName: 'Timbuktu',
    estateName: 'Sankoré Scholar’s Courtyard',
    residentName: 'Ahmad Baba',
    title: 'Eminent Scholar of the Sankoré Madrasah',
    greeting:
      'Ahmad Baba welcomes you beneath a shaded portico: “Peace be with you, mariner who has crossed the sands and seas. Here in Timbuktu, gold and salt are traded, but true wealth lies in books, mathematics, and wisdom.”',
    teachSkill: 'Accounting',
    skillCost: 2500,
    skillReqs: 'Knowledge ≥ 60',
    checkPrereqs: (stats) => stats.knowledge >= 60,
    isCollector: true,
    isCartographer: false,
    explorationRumor:
      '“Far to the south, along the great river Niger, dwell wondrous animals: golden-spotted giraffes and giant horned rhinos.”',
  },
  // 75: Massawa
  '75': {
    portId: '75',
    portName: 'Massawa',
    estateName: 'Highland Envoy Residency',
    residentName: 'Patriarch Bermudez',
    title: 'Portuguese Envoy to the Empire of Abyssinia',
    greeting:
      'Patriarch Bermudez greets you with solemn faith: “Welcome, brother of the sea. Beyond these coastal hills lies the ancient Christian realm of Abyssinia, long guarded from the Ottoman corsairs.”',
    teachSkill: 'Celestial Navigation',
    skillCost: 3000,
    skillReqs: 'Knowledge ≥ 65, Intuition ≥ 65',
    checkPrereqs: (stats) => stats.knowledge >= 65 && stats.intuition >= 65,
    isCollector: true,
    isCartographer: false,
    explorationRumor:
      '“In the mountains of Lalibela, eleven majestic stone churches stand carved entirely out of solid volcanic bedrock.”',
  },
  // 76: Cairo
  '76': {
    portId: '76',
    portName: 'Cairo',
    estateName: 'Ibn Battuta Geodetic Bureau',
    residentName: 'Ahmad ibn Majid',
    title: 'Master Lion of the Sea (Asad al-Bahr)',
    greeting:
      'The veteran Arab navigator studies a Kamal altitude board: “Marhaba! I know the monsoon winds of the Indian Ocean from Aden to Calicut. Celestial navigation is the soul of every voyage across the Arabian Sea.”',
    teachSkill: 'Celestial Navigation',
    skillCost: 3000,
    skillReqs: 'Knowledge ≥ 65, Intuition ≥ 65',
    checkPrereqs: (stats) => stats.knowledge >= 65 && stats.intuition >= 65,
    isCollector: true,
    isCartographer: true,
    explorationRumor:
      '“At Giza outside Cairo, the great Pharaoh Khufu’s pyramid pierces the sky, guarded by the silent recumbent Sphinx.”',
  },
  // 78: Mecca
  '78': {
    portId: '78',
    portName: 'Mecca',
    estateName: 'Al-Haram Scholar Lodge',
    residentName: 'Sheikh Al-Zubayr',
    title: 'Guardian of Pilgrim Archives',
    greeting:
      'Sheikh Al-Zubayr welcomes you cordially: “Welcome to the sacred hub of Arabia. Pilgrims arrive from West Africa to Malacca. Understanding currency exchange and honest accounting is a virtue commended by the heavens.”',
    teachSkill: 'Accounting',
    skillCost: 2500,
    skillReqs: 'Knowledge ≥ 60',
    checkPrereqs: (stats) => stats.knowledge >= 60,
    isCollector: true,
    isCartographer: false,
    explorationRumor:
      '“The Red Sea is flanked by dangerous coral reefs. Heed the shoals near Jiddah and follow the deep water channel.”',
  },
  // 86: Goa
  '86': {
    portId: '86',
    portName: 'Goa',
    estateName: 'Palace of the Viceroy of the Indies',
    residentName: 'Dom Garcia de Noronha',
    title: 'Viceroy of Portuguese India',
    greeting:
      'The Viceroy reviews garrison reports: “Captain! Goa is the fortress of the Estado da Índia. Malabar pirates and Ottoman fleets contest these waters. If your cannon discipline is lacking, my gunners will train you properly.”',
    teachSkill: 'Gunnery',
    skillCost: 4000,
    skillReqs: 'Courage ≥ 70, Battle Level ≥ 3',
    checkPrereqs: (stats, battleLevel = 1) => stats.courage >= 70 && battleLevel >= 3,
    isCollector: true,
    isCartographer: false,
    explorationRumor:
      '“Off the southern tip of India lies Ceylon, famed for sweet cinnamon and giant stone stupas in ancient Anuradhapura.”',
  },
  // 93: Calicut
  '93': {
    portId: '93',
    portName: 'Calicut',
    estateName: 'Zamorin Courtier Villa',
    residentName: 'Nair Kunjali Diplomat',
    title: 'Chief Emissary of the Zamorin of Kozhikode',
    greeting:
      'The silk-clad emissary welcomes you with polite folded hands: “Namaste, Captain. Calicut has traded pepper and cardamom with Egypt and Venice for a thousand years. Diplomacy and courteous negotiation open more doors than iron cannons.”',
    teachSkill: 'Negotiation',
    skillCost: 3000,
    skillReqs: 'Charm ≥ 70',
    checkPrereqs: (stats) => stats.charm >= 70,
    isCollector: true,
    isCartographer: false,
    explorationRumor:
      '“Deep in the Western Ghats mountain jungles roam majestic royal Bengal tigers and herds of wild Asian elephants.”',
  },
  // 98: Changan
  '98': {
    portId: '98',
    portName: 'Changan',
    estateName: 'Imperial Hanlin Academy Pavilion',
    residentName: 'Grand Scholar Lin Zexu',
    title: 'Scholar of the Imperial Hanlin Academy',
    greeting:
      'Grand Scholar Lin bows gracefully: “Welcome, barbarian of the southern seas. Changan was the terminal of the ancient Silk Road. Bring reports of western lands and ancient curiosities to our bureau, and the Emperor shall reward you.”',
    teachSkill: 'Negotiation',
    skillCost: 3500,
    skillReqs: 'Charm ≥ 70',
    checkPrereqs: (stats) => stats.charm >= 70,
    isCollector: true,
    isCartographer: true,
    explorationRumor:
      '“To the north, running ten thousand li along jagged mountain crests, stands the Great Wall of China built to ward off northern nomads.”',
  },
  // 99: Sakai
  '99': {
    portId: '99',
    portName: 'Sakai',
    estateName: 'Zen Tea Pavilion of Sakai',
    residentName: 'Sen no Rikyu',
    title: 'Grand Master of the Tea Ceremony',
    greeting:
      'Master Rikyu pours fragrant green matcha into an earthy ceramic bowl: “Welcome to Sakai, city of autonomous merchants. In the tea room, samurai and foreign captains meet as equals. Gentle speech and respectful negotiation soothe all conflict.”',
    teachSkill: 'Negotiation',
    skillCost: 3000,
    skillReqs: 'Charm ≥ 70',
    checkPrereqs: (stats) => stats.charm >= 70,
    isCollector: true,
    isCartographer: false,
    explorationRumor:
      '“To the east, crowned in perpetual white snow, stands Mount Fuji — a sacred volcanic peak of breathtaking beauty.”',
  },
  // 100: Nagasaki
  '100': {
    portId: '100',
    portName: 'Nagasaki',
    estateName: 'Nanban Lord’s Residence',
    residentName: 'Lord Omura Sumitada',
    title: 'Christian Daimyo of Hizen Province',
    greeting:
      'Lord Omura bows formally, his kimono bearing both a cross and samurai mon: “Welcome, Nanban navigator! Portuguese black ships bring silks, clocks, and matchlock guns to Nagasaki. If your gunnery requires drill, our samurai can train your crew.”',
    teachSkill: 'Gunnery',
    skillCost: 4000,
    skillReqs: 'Courage ≥ 70, Battle Level ≥ 3',
    checkPrereqs: (stats, battleLevel = 1) => stats.courage >= 70 && battleLevel >= 3,
    isCollector: true,
    isCartographer: false,
    explorationRumor:
      '“South across the East China Sea, tropical islands harbor giant armored lizards that swallow goats whole — the Komodo Dragon!”',
  },
};

export const getMansionData = (portId: string, portName = 'Port'): MansionInfo => {
  if (mansionData[portId]) {
    return mansionData[portId];
  }

  return {
    portId,
    portName,
    estateName: `${portName} Governor’s Residence`,
    residentName: 'Lord Magistrate & Consul',
    title: 'Governor of the Maritime District',
    greeting: `The Magistrate greets you cordially: “Welcome to ${portName}. Our colonial manor oversees regional commerce, diplomacy, and maritime records. How may our estate assist your fleet, Captain?”`,
    teachSkill: 'Accounting',
    skillCost: 2500,
    skillReqs: 'Knowledge ≥ 60',
    checkPrereqs: (stats) => stats.knowledge >= 60,
    isCollector: true,
    isCartographer: false,
    explorationRumor:
      '“Foreign charts and relics of antiquity bring great honor to our colony. Bring your reports of wonders discovered across the sea.”',
  };
};
