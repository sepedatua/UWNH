export interface Discovery {
  id: string;
  name: string;
  category: 'ruins' | 'monster' | 'flora_fauna' | 'wonder' | 'historic';
  rank: '☆' | 'A' | 'B' | 'C';
  difficulty?: number;
  fameReward: number;
  goldValue: number; // Contract cash-in value at Guild Collector
  position: { x: number; y: number };
  coordinatesNav?: string;
  radius: number;
  lore: string;
  historicalSignificance: string;
  icon: string;
}

// 98 Authentic Koei Uncharted Waters II Discoveries from COLONY.DAT
export const discoveries: Discovery[] = [
  {
    "id": "stonehenge",
    "numId": 1,
    "name": "Stonehenge Megaliths",
    "category": "ruins",
    "rank": "B",
    "difficulty": 10,
    "fameReward": 350,
    "goldValue": 12000,
    "position": {
      "x": 890,
      "y": 265
    },
    "coordinatesNav": "51°N, 1°W",
    "radius": 18,
    "lore": "Enormous standing stones arranged in concentric rings on Salisbury Plain. Aligned with the solstices, their construction defies ancient explanation.",
    "historicalSignificance": "Prehistoric astronomical observatory and sacred ceremonial ring of ancient Britain.",
    "icon": "🗿"
  },
  {
    "id": "disc_2_rosettastone",
    "numId": 2,
    "name": "Rosetta Stone",
    "category": "ruins",
    "rank": "C",
    "difficulty": 10,
    "fameReward": 270,
    "goldValue": 8800,
    "position": {
      "x": 1067,
      "y": 388
    },
    "coordinatesNav": "31°N, 29°E",
    "radius": 18,
    "lore": "Black basalt slab bearing the same inscription in three languages- ancient Egyptian hieroglyphics, a simpler ancient Egyptian writing system, and Greek.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 31°N, 29°E.",
    "icon": "🗿"
  },
  {
    "id": "pyramids",
    "numId": 3,
    "name": "The Great Pyramids & Sphinx",
    "category": "historic",
    "rank": "☆",
    "difficulty": 30,
    "fameReward": 1000,
    "goldValue": 50000,
    "position": {
      "x": 1084,
      "y": 430
    },
    "coordinatesNav": "27°N, 30°E",
    "radius": 20,
    "lore": "Colossal stone monuments soaring from the desert sands of Giza, guarded by the eternal gaze of the limestone Sphinx.",
    "historicalSignificance": "Tombs of Pharaohs Khufu, Khafre, and Menkaure, and the sole surviving Wonder of the Ancient World.",
    "icon": "🏛️"
  },
  {
    "id": "disc_4_crocodile",
    "numId": 4,
    "name": "Crocodile",
    "category": "monster",
    "rank": "C",
    "difficulty": 30,
    "fameReward": 310,
    "goldValue": 10400,
    "position": {
      "x": 1097,
      "y": 447
    },
    "coordinatesNav": "19°N, 34°E",
    "radius": 18,
    "lore": "HFierce amphibious predator armored with hard leather skin, the crocodile sometimes reaches a length of 20 feet. With its powerful jaws, it can rip into livestock animals and even humans with one bite.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 19°N, 34°E.",
    "icon": "🐉"
  },
  {
    "id": "disc_5_nubiapyramid",
    "numId": 5,
    "name": "Nubia Pyramid",
    "category": "ruins",
    "rank": "B",
    "difficulty": 35,
    "fameReward": 520,
    "goldValue": 19500,
    "position": {
      "x": 1085,
      "y": 472
    },
    "coordinatesNav": "14°N, 32°E",
    "radius": 18,
    "lore": "Pyramid built by the ancient Cush in northern Africa. Though it's relatively small, with a 30 by 30 foot square base, it has distinctively steep sides.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 14°N, 32°E.",
    "icon": "🔺"
  },
  {
    "id": "disc_6_tessisatfalls",
    "numId": 6,
    "name": "Tessisat Falls",
    "category": "wonder",
    "rank": "C",
    "difficulty": 30,
    "fameReward": 310,
    "goldValue": 10400,
    "position": {
      "x": 1110,
      "y": 491
    },
    "coordinatesNav": "10°N, 36°E",
    "radius": 18,
    "lore": "This remote waterfall is 140 feet high and is found near the source of the Blue Nile.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 10°N, 36°E.",
    "icon": "🌊"
  },
  {
    "id": "disc_7_baobab",
    "numId": 7,
    "name": "Baobab",
    "category": "flora_fauna",
    "rank": "C",
    "difficulty": 30,
    "fameReward": 310,
    "goldValue": 10400,
    "position": {
      "x": 1079,
      "y": 491
    },
    "coordinatesNav": "10°N, 31°E",
    "radius": 18,
    "lore": "Huge tree with many useful qualities. The bark can be used to fashion rope or cloth, the fruit is edible, and the trunk itself is so large it can be used for storage or even shelter.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 10°N, 31°E.",
    "icon": "🌿"
  },
  {
    "id": "disc_8_pteranodon",
    "numId": 8,
    "name": "Pteranodon",
    "category": "monster",
    "rank": "B",
    "difficulty": 40,
    "fameReward": 530,
    "goldValue": 20000,
    "position": {
      "x": 1091,
      "y": 516
    },
    "coordinatesNav": "5°N, 33°E",
    "radius": 18,
    "lore": "A dark-colored bird whose bat-like wings measure 6 feet across. It's noted for its large beak and sharp teeth.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 5°N, 33°E.",
    "icon": "🐉"
  },
  {
    "id": "victoria_falls",
    "numId": 9,
    "name": "Victoria Falls (Mosi-oa-Tunya)",
    "category": "wonder",
    "rank": "A",
    "difficulty": 20,
    "fameReward": 700,
    "goldValue": 30000,
    "position": {
      "x": 1050,
      "y": 690
    },
    "coordinatesNav": "0°N, 32°E",
    "radius": 22,
    "lore": "“The Smoke That Thunders” — a mile-wide curtain of falling water plunging into a roaring basalt chasm on the Zambezi River.",
    "historicalSignificance": "One of the greatest natural waterfalls on Earth, producing spray visible from over thirty miles away.",
    "icon": "🌊"
  },
  {
    "id": "disc_10_diogosmonument",
    "numId": 10,
    "name": "Diogo's Monument",
    "category": "ruins",
    "rank": "C",
    "difficulty": 30,
    "fameReward": 310,
    "goldValue": 10400,
    "position": {
      "x": 939,
      "y": 535
    },
    "coordinatesNav": "1°N, 8°E",
    "radius": 18,
    "lore": "A tall stone monument with inscriptions in Latin, Portuguese, and Arabic. Erected when Diogo Cam discovered the Congo.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 1°N, 8°E.",
    "icon": "🗿"
  },
  {
    "id": "disc_11_anthill",
    "numId": 11,
    "name": "Ant Hill",
    "category": "ruins",
    "rank": "B",
    "difficulty": 40,
    "fameReward": 530,
    "goldValue": 20000,
    "position": {
      "x": 902,
      "y": 481
    },
    "coordinatesNav": "12°N, 2°E",
    "radius": 18,
    "lore": "These small ant castles, in their various shapes, often surpass the architectural feats of man.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 12°N, 2°E.",
    "icon": "🏛️"
  },
  {
    "id": "disc_12_claymosque",
    "numId": 12,
    "name": "Clay Mosque",
    "category": "ruins",
    "rank": "C",
    "difficulty": 30,
    "fameReward": 310,
    "goldValue": 10400,
    "position": {
      "x": 878,
      "y": 467
    },
    "coordinatesNav": "15°N, 2°W",
    "radius": 18,
    "lore": "Supposedly, the ruins of a golden city in the Sahara. Time has taken its toll, but the work of conscientious desert dwellers have helped preserve the ancient structure.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 15°N, 2°W.",
    "icon": "🏛️"
  },
  {
    "id": "disc_13_armadillo",
    "numId": 13,
    "name": "Armadillo",
    "category": "flora_fauna",
    "rank": "C",
    "difficulty": 25,
    "fameReward": 300,
    "goldValue": 10000,
    "position": {
      "x": 963,
      "y": 578
    },
    "coordinatesNav": "6°S, 12°E",
    "radius": 18,
    "lore": "Animal with bony plates on its back. When threatened, it curls up to cover its soft unprotected abdomen.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 6°S, 12°E.",
    "icon": "🐾"
  },
  {
    "id": "disc_14_moquelemubembe",
    "numId": 14,
    "name": "Moquele Mubembe",
    "category": "monster",
    "rank": "A",
    "difficulty": 70,
    "fameReward": 840,
    "goldValue": 38500,
    "position": {
      "x": 994,
      "y": 546
    },
    "coordinatesNav": "1°S, 17°E",
    "radius": 18,
    "lore": "The locals of Lake Tele have claimed to have seen this dinosaur from time to time. It's believed to be herbivorous and about 15 feet long.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 1°S, 17°E.",
    "icon": "🐉"
  },
  {
    "id": "disc_15_moonbow",
    "numId": 15,
    "name": "Moonbow",
    "category": "wonder",
    "rank": "C",
    "difficulty": 20,
    "fameReward": 290,
    "goldValue": 9600,
    "position": {
      "x": 1043,
      "y": 540
    },
    "coordinatesNav": "0°S, 25°E",
    "radius": 18,
    "lore": "A rainbow that shines gold and white in the dark night. Legend says that this beautiful, mysterious vision brings good luck to those who see it.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 0°S, 25°E.",
    "icon": "✨"
  },
  {
    "id": "disc_16_quagga",
    "numId": 16,
    "name": "Quagga",
    "category": "flora_fauna",
    "rank": "C",
    "difficulty": 30,
    "fameReward": 310,
    "goldValue": 10400,
    "position": {
      "x": 951,
      "y": 616
    },
    "coordinatesNav": "12°S, 10°E",
    "radius": 18,
    "lore": "A horse-like creature related to the zebra, but with no stripes on its hind portion. It takes its name from the sound it makes, {Kwahaha.}",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 12°S, 10°E.",
    "icon": "🐾"
  },
  {
    "id": "disc_17_diazsmonument",
    "numId": 17,
    "name": "Diaz's Monument",
    "category": "ruins",
    "rank": "B",
    "difficulty": 40,
    "fameReward": 530,
    "goldValue": 20000,
    "position": {
      "x": 1006,
      "y": 736
    },
    "coordinatesNav": "31°S, 19°E",
    "radius": 18,
    "lore": "Stone monument at the Cape of Good Hope on the southern tip of Africa. It was erected by Bartholomew Diaz and remains a symbol of brave sea adventurers.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 31°S, 19°E.",
    "icon": "🗿"
  },
  {
    "id": "disc_18_bigzimbabwe",
    "numId": 18,
    "name": "Big Zimbabwe",
    "category": "wonder",
    "rank": "B",
    "difficulty": 40,
    "fameReward": 530,
    "goldValue": 20000,
    "position": {
      "x": 1043,
      "y": 730
    },
    "coordinatesNav": "30°S, 25°E",
    "radius": 18,
    "lore": "UThe name means [large rock house.] It proves that there was once a glorious dynasty in this area.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 30°S, 25°E.",
    "icon": "✨"
  },
  {
    "id": "disc_19_mandrill",
    "numId": 19,
    "name": "Mandrill",
    "category": "flora_fauna",
    "rank": "A",
    "difficulty": 65,
    "fameReward": 830,
    "goldValue": 37750,
    "position": {
      "x": 1140,
      "y": 540
    },
    "coordinatesNav": "0°S, 41°E",
    "radius": 18,
    "lore": "GMonkey with a colorful face resembling that of a human. It has a beard, purple bottom, and a short tail.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 0°S, 41°E.",
    "icon": "🐾"
  },
  {
    "id": "disc_20_dodo",
    "numId": 20,
    "name": "Dodo",
    "category": "flora_fauna",
    "rank": "☆",
    "difficulty": 100,
    "fameReward": 1300,
    "goldValue": 65000,
    "position": {
      "x": 1195,
      "y": 667
    },
    "coordinatesNav": "20°S, 50°E",
    "radius": 18,
    "lore": "A bird the size of a turkey, with a large hooked bill. Its wings are very small, making it incapable of flight.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 20°S, 50°E.",
    "icon": "🪶"
  },
  {
    "id": "disc_21_chameleon",
    "numId": 21,
    "name": "Chameleon",
    "category": "flora_fauna",
    "rank": "C",
    "difficulty": 10,
    "fameReward": 270,
    "goldValue": 8800,
    "position": {
      "x": 1183,
      "y": 603
    },
    "coordinatesNav": "10°S, 48°E",
    "radius": 18,
    "lore": "Lizard with the amazing ability to change its color to match its surroundings. It's quite adept at capturing insects with its long and sticky tongue.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 10°S, 48°E.",
    "icon": "🦎"
  },
  {
    "id": "disc_22_papyrus",
    "numId": 22,
    "name": "Papyrus",
    "category": "flora_fauna",
    "rank": "C",
    "difficulty": 30,
    "fameReward": 310,
    "goldValue": 10400,
    "position": {
      "x": 1116,
      "y": 418
    },
    "coordinatesNav": "25°N, 37°E",
    "radius": 18,
    "lore": "Tall water plant that was used to make a form of paper in ancient Egypt.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 25°N, 37°E.",
    "icon": "🌿"
  },
  {
    "id": "disc_23_burningwater",
    "numId": 23,
    "name": "Burning Water",
    "category": "wonder",
    "rank": "B",
    "difficulty": 60,
    "fameReward": 570,
    "goldValue": 22000,
    "position": {
      "x": 1189,
      "y": 393
    },
    "coordinatesNav": "30°N, 49°E",
    "radius": 18,
    "lore": "Strange black liquid that springs out from underground in desert areas. It has a bad smell and burns easily.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 30°N, 49°E.",
    "icon": "🏛️"
  },
  {
    "id": "disc_24_mohenjodaro",
    "numId": 24,
    "name": "Mohenjo-Daro",
    "category": "ruins",
    "rank": "B",
    "difficulty": 60,
    "fameReward": 570,
    "goldValue": 22000,
    "position": {
      "x": 1287,
      "y": 418
    },
    "coordinatesNav": "25°N, 65°E",
    "radius": 18,
    "lore": "JRuins of a city dating from the time of the Indus civilization. Built around a dome-shaped Buddhist shrine on a hilltop, this city probably was a commercial center during the Bronze Age.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 25°N, 65°E.",
    "icon": "🏛️"
  },
  {
    "id": "disc_25_kingcobra",
    "numId": 25,
    "name": "King Cobra",
    "category": "flora_fauna",
    "rank": "C",
    "difficulty": 10,
    "fameReward": 270,
    "goldValue": 8800,
    "position": {
      "x": 1335,
      "y": 452
    },
    "coordinatesNav": "18°N, 73°E",
    "radius": 18,
    "lore": "The world's largest poisonous snake. When disturbed, it extends its ribs behind its head to form a flaring hood.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 18°N, 73°E.",
    "icon": "🐍"
  },
  {
    "id": "disc_26_inlelake",
    "numId": 26,
    "name": "Inle Lake",
    "category": "wonder",
    "rank": "B",
    "difficulty": 35,
    "fameReward": 520,
    "goldValue": 19500,
    "position": {
      "x": 1457,
      "y": 472
    },
    "coordinatesNav": "14°N, 93°E",
    "radius": 18,
    "lore": "aThe people who live here have built their homes and fields on the island that floats on the surface of this lake.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 14°N, 93°E.",
    "icon": "✨"
  },
  {
    "id": "disc_27_ayutthayasbuddha",
    "numId": 27,
    "name": "Ayutthaya's Buddha",
    "category": "ruins",
    "rank": "C",
    "difficulty": 30,
    "fameReward": 310,
    "goldValue": 10400,
    "position": {
      "x": 1482,
      "y": 486
    },
    "coordinatesNav": "11°N, 97°E",
    "radius": 18,
    "lore": "One of many busts of Buddha found in Siam, which has several temples and statues dedicated to him.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 11°N, 97°E.",
    "icon": "🗿"
  },
  {
    "id": "disc_28_hornbill",
    "numId": 28,
    "name": "Hornbill",
    "category": "flora_fauna",
    "rank": "B",
    "difficulty": 50,
    "fameReward": 550,
    "goldValue": 21000,
    "position": {
      "x": 1470,
      "y": 506
    },
    "coordinatesNav": "7°N, 95°E",
    "radius": 18,
    "lore": "RFriendly large-billed bird that makes a hissing sound to intimidate its enemies. It sometimes grows up to 60 inches in height.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 7°N, 95°E.",
    "icon": "🪶"
  },
  {
    "id": "disc_29_angkorwat",
    "numId": 29,
    "name": "Angkor Wat",
    "category": "ruins",
    "rank": "B",
    "difficulty": 60,
    "fameReward": 570,
    "goldValue": 22000,
    "position": {
      "x": 1512,
      "y": 481
    },
    "coordinatesNav": "12°N, 102°E",
    "radius": 18,
    "lore": "Ruins of a temple constructed by Khmer during the 12th century. The name means [temple of the capital].",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 12°N, 102°E.",
    "icon": "🏛️"
  },
  {
    "id": "disc_30_kalavinka",
    "numId": 30,
    "name": "Kalavinka",
    "category": "flora_fauna",
    "rank": "A",
    "difficulty": 70,
    "fameReward": 840,
    "goldValue": 38500,
    "position": {
      "x": 1549,
      "y": 432
    },
    "coordinatesNav": "22°N, 108°E",
    "radius": 18,
    "lore": "SA bird of legend said to have the face of a beautiful girl. Its sweet singing can make people forget everything, even their own names.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 22°N, 108°E.",
    "icon": "🐾"
  },
  {
    "id": "disc_31_plantworm",
    "numId": 31,
    "name": "Plant Worm",
    "category": "flora_fauna",
    "rank": "C",
    "difficulty": 30,
    "fameReward": 310,
    "goldValue": 10400,
    "position": {
      "x": 1659,
      "y": 354
    },
    "coordinatesNav": "38°N, 126°E",
    "radius": 18,
    "lore": "A strange insect which transforms itself into a fungus during the summer. It is highly valued in China as a tonic and an elixir.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 38°N, 126°E.",
    "icon": "🌿"
  },
  {
    "id": "mount_fuji",
    "numId": 32,
    "name": "Mount Fuji (Fuji-san)",
    "category": "wonder",
    "rank": "B",
    "difficulty": 40,
    "fameReward": 550,
    "goldValue": 24000,
    "position": {
      "x": 1720,
      "y": 395
    },
    "coordinatesNav": "35°N, 138°E",
    "radius": 22,
    "lore": "An exceptionally symmetrical snow-capped volcanic cone revered as a sacred mountain by the Japanese people.",
    "historicalSignificance": "Spiritual symbol of Japan and immortalized subject of Ukiyo-e woodblock prints.",
    "icon": "🗻"
  },
  {
    "id": "disc_33_namahage",
    "numId": 33,
    "name": "Namahage",
    "category": "monster",
    "rank": "A",
    "difficulty": 65,
    "fameReward": 830,
    "goldValue": 37750,
    "position": {
      "x": 1738,
      "y": 349
    },
    "coordinatesNav": "39°N, 139°E",
    "radius": 18,
    "lore": "Fabled demons that kidnap and devour bad children. The legend is told in a traditional festival where men disguise themselves as demons to scare the town's children.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 39°N, 139°E.",
    "icon": "🐉"
  },
  {
    "id": "disc_34_qianling",
    "numId": 34,
    "name": "Qian Ling",
    "category": "ruins",
    "rank": "☆",
    "difficulty": 90,
    "fameReward": 1270,
    "goldValue": 63000,
    "position": {
      "x": 1573,
      "y": 369
    },
    "coordinatesNav": "35°N, 112°E",
    "radius": 18,
    "lore": "Empress Zetian Wuhou's tomb. A hill with a circumference of 25 miles was turned into this huge tomb where all her treasures are buried.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 35°N, 112°E.",
    "icon": "🏛️"
  },
  {
    "id": "great_wall",
    "numId": 35,
    "name": "Great Wall of China",
    "category": "historic",
    "rank": "☆",
    "difficulty": 80,
    "fameReward": 950,
    "goldValue": 45000,
    "position": {
      "x": 1560,
      "y": 330
    },
    "coordinatesNav": "41°N, 110°E",
    "radius": 25,
    "lore": "A serpentine dragon of stone and brick undulating thousands of li across rugged mountains and high desert passes.",
    "historicalSignificance": "Defensive bastion constructed by Chinese imperial dynasties to repel nomadic incursions from the Eurasian steppe.",
    "icon": "🧱"
  },
  {
    "id": "disc_36_hedgehog",
    "numId": 36,
    "name": "Hedgehog",
    "category": "ruins",
    "rank": "C",
    "difficulty": 30,
    "fameReward": 310,
    "goldValue": 10400,
    "position": {
      "x": 1543,
      "y": 354
    },
    "coordinatesNav": "38°N, 107°E",
    "radius": 18,
    "lore": "CA small mammal with an arsenal of long prickly spines on its back. It rolls itself into a ball when threatened.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 38°N, 107°E.",
    "icon": "🏛️"
  },
  {
    "id": "disc_37_panda",
    "numId": 37,
    "name": "Panda",
    "category": "wonder",
    "rank": "A",
    "difficulty": 75,
    "fameReward": 850,
    "goldValue": 39250,
    "position": {
      "x": 1512,
      "y": 364
    },
    "coordinatesNav": "36°N, 102°E",
    "radius": 18,
    "lore": "A large bear-like black and white animal found at high altitudes in mountainous regions. It's friendly and feeds on bamboo.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 36°N, 102°E.",
    "icon": "🐾"
  },
  {
    "id": "disc_38_passengerpigeon",
    "numId": 38,
    "name": "Passenger Pigeon",
    "category": "wonder",
    "rank": "C",
    "difficulty": 30,
    "fameReward": 310,
    "goldValue": 10400,
    "position": {
      "x": 420,
      "y": 369
    },
    "coordinatesNav": "35°N, 77°W",
    "radius": 18,
    "lore": "A beautiful pigeon with slate blue wings and a russet breast. They migrate in large flocks every spring. People say that this species will never become extinct. (Or will it?)",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 35°N, 77°W.",
    "icon": "🪶"
  },
  {
    "id": "disc_39_totempole",
    "numId": 39,
    "name": "Totem Pole",
    "category": "ruins",
    "rank": "C",
    "difficulty": 20,
    "fameReward": 290,
    "goldValue": 9600,
    "position": {
      "x": 390,
      "y": 398
    },
    "coordinatesNav": "29°N, 82°W",
    "radius": 18,
    "lore": "VLarge wooden pole carved with the designs of animals. It symbolizes the status of the chief, and is sometimes used as a sign of the tribe.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 29°N, 82°W.",
    "icon": "🏛️"
  },
  {
    "id": "disc_40_jademask",
    "numId": 40,
    "name": "Jade Mask",
    "category": "ruins",
    "rank": "B",
    "difficulty": 40,
    "fameReward": 530,
    "goldValue": 20000,
    "position": {
      "x": 262,
      "y": 447
    },
    "coordinatesNav": "19°N, 103°W",
    "radius": 18,
    "lore": "A mask encrusted with small pieces of jade. Its eye holes give it a somewhat ominous appearance.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 19°N, 103°W.",
    "icon": "🏛️"
  },
  {
    "id": "el_dorado",
    "numId": 41,
    "name": "El Dorado (City of Gold)",
    "category": "ruins",
    "rank": "☆",
    "difficulty": 30,
    "fameReward": 1200,
    "goldValue": 60000,
    "position": {
      "x": 510,
      "y": 560
    },
    "coordinatesNav": "12°N, 90°W",
    "radius": 20,
    "lore": "A hidden golden sanctuary nestled deep in the Amazon basin, adorned with pure hammered gold plaques and sacred emerald offerings.",
    "historicalSignificance": "The legendary golden kingdom sought by Spanish conquistadors and New World explorers.",
    "icon": "👑"
  },
  {
    "id": "disc_42_cactus",
    "numId": 42,
    "name": "Cactus",
    "category": "flora_fauna",
    "rank": "C",
    "difficulty": 10,
    "fameReward": 270,
    "goldValue": 8800,
    "position": {
      "x": 463,
      "y": 506
    },
    "coordinatesNav": "7°N, 70°W",
    "radius": 18,
    "lore": "NSpiny, fleshy plant that grows up to 6 feet tall. This unique plant is well-adapted for arid climates.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 7°N, 70°W.",
    "icon": "🌿"
  },
  {
    "id": "disc_43_iguana",
    "numId": 43,
    "name": "Iguana",
    "category": "monster",
    "rank": "C",
    "difficulty": 30,
    "fameReward": 310,
    "goldValue": 10400,
    "position": {
      "x": 493,
      "y": 506
    },
    "coordinatesNav": "7°N, 65°W",
    "radius": 18,
    "lore": "TA large scaly lizard, measuring about 6 feet in length. The row of leathery spines on its back make it look like a fierce dinosaur, but it's actually a gentle creature.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 7°N, 65°W.",
    "icon": "🦎"
  },
  {
    "id": "disc_44_venusflytrap",
    "numId": 44,
    "name": "Venus' Flytrap",
    "category": "wonder",
    "rank": "C",
    "difficulty": 25,
    "fameReward": 300,
    "goldValue": 10000,
    "position": {
      "x": 298,
      "y": 379
    },
    "coordinatesNav": "33°N, 97°W",
    "radius": 18,
    "lore": "Insect-eating plant with a jaw-shaped flower that bears sharp spines and secretes a sweet liquid. Once its jaws snap shut they won't reopen until the prey has been digested.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 33°N, 97°W.",
    "icon": "✨"
  },
  {
    "id": "disc_45_niagarafalls",
    "numId": 45,
    "name": "Niagara Falls",
    "category": "wonder",
    "rank": "A",
    "difficulty": 80,
    "fameReward": 860,
    "goldValue": 40000,
    "position": {
      "x": 323,
      "y": 330
    },
    "coordinatesNav": "43°N, 93°W",
    "radius": 18,
    "lore": "A magnificent waterfall, about 158 feet high and 3010 feet wide. Ancient people must have thought that the edge of the earth looks something like this.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 43°N, 93°W.",
    "icon": "🌊"
  },
  {
    "id": "disc_46_amazonwaterlily",
    "numId": 46,
    "name": "Amazon Water Lily",
    "category": "flora_fauna",
    "rank": "C",
    "difficulty": 30,
    "fameReward": 310,
    "goldValue": 10400,
    "position": {
      "x": 518,
      "y": 565
    },
    "coordinatesNav": "4°S, 61°W",
    "radius": 18,
    "lore": "An aquatic plant with giant floating leaves and large flowers. The leaves measure over 6 feet in diameter and are so strong that they can bear the weight of a small child.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 4°S, 61°W.",
    "icon": "🌿"
  },
  {
    "id": "disc_47_anaconda",
    "numId": 47,
    "name": "Anaconda",
    "category": "monster",
    "rank": "B",
    "difficulty": 35,
    "fameReward": 520,
    "goldValue": 19500,
    "position": {
      "x": 524,
      "y": 591
    },
    "coordinatesNav": "8°S, 60°W",
    "radius": 18,
    "lore": "A gigantic serpent. Adults may grow 19 feet long and weigh as much as 235 pounds. They are found near the water and crush their victims by constricting them in their coils.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 8°S, 60°W.",
    "icon": "🐍"
  },
  {
    "id": "disc_48_pororoca",
    "numId": 48,
    "name": "Pororoca",
    "category": "wonder",
    "rank": "B",
    "difficulty": 60,
    "fameReward": 570,
    "goldValue": 22000,
    "position": {
      "x": 487,
      "y": 572
    },
    "coordinatesNav": "5°S, 66°W",
    "radius": 18,
    "lore": "An enormous tidal wave that occurs during the new moon in April. Locals say that huge waves may reach over 16 feet high and wash everything away from the shore.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 5°S, 66°W.",
    "icon": "✨"
  },
  {
    "id": "disc_49_matamata",
    "numId": 49,
    "name": "Matamata",
    "category": "flora_fauna",
    "rank": "A",
    "difficulty": 65,
    "fameReward": 830,
    "goldValue": 37750,
    "position": {
      "x": 457,
      "y": 540
    },
    "coordinatesNav": "0°N, 71°W",
    "radius": 18,
    "lore": "A spiny turtle with a large diamond-shaped head and an irregular, rugged shell.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 0°N, 71°W.",
    "icon": "🐢"
  },
  {
    "id": "disc_50_balsa",
    "numId": 50,
    "name": "Balsa",
    "category": "flora_fauna",
    "rank": "B",
    "difficulty": 55,
    "fameReward": 560,
    "goldValue": 21500,
    "position": {
      "x": 432,
      "y": 553
    },
    "coordinatesNav": "2°S, 75°W",
    "radius": 18,
    "lore": "A primitive vessel used for local inter-tribal trading. This raft has a grass hut mounted on top and uses a square sail.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 2°S, 75°W.",
    "icon": "🐾"
  },
  {
    "id": "disc_51_piranha",
    "numId": 51,
    "name": "Piranha",
    "category": "monster",
    "rank": "C",
    "difficulty": 20,
    "fameReward": 290,
    "goldValue": 9600,
    "position": {
      "x": 445,
      "y": 597
    },
    "coordinatesNav": "9°S, 73°W",
    "radius": 18,
    "lore": "The terror of South American rivers. It is not uncommon for these groups of fish to devour people or domesticated animals that try to cross their river.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 9°S, 73°W.",
    "icon": "🐉"
  },
  {
    "id": "disc_52_tarantula",
    "numId": 52,
    "name": "Tarantula",
    "category": "monster",
    "rank": "B",
    "difficulty": 35,
    "fameReward": 520,
    "goldValue": 19500,
    "position": {
      "x": 420,
      "y": 610
    },
    "coordinatesNav": "11°S, 77°W",
    "radius": 18,
    "lore": "A large hairy poisonous spider that feeds on birds and small animals.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 11°S, 77°W.",
    "icon": "🐉"
  },
  {
    "id": "disc_53_archaeopteryx",
    "numId": 53,
    "name": "Archaeopteryx",
    "category": "flora_fauna",
    "rank": "☆",
    "difficulty": 90,
    "fameReward": 1270,
    "goldValue": 63000,
    "position": {
      "x": 420,
      "y": 584
    },
    "coordinatesNav": "7°S, 77°W",
    "radius": 18,
    "lore": "XA reptilian bird thought to be an ancestor of today's birds. It had four legs and was unable to fly, but it is believed that this bird-reptile could glide.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 7°S, 77°W.",
    "icon": "🐾"
  },
  {
    "id": "disc_54_goldfrog",
    "numId": 54,
    "name": "Gold Frog",
    "category": "flora_fauna",
    "rank": "B",
    "difficulty": 50,
    "fameReward": 550,
    "goldValue": 21000,
    "position": {
      "x": 384,
      "y": 572
    },
    "coordinatesNav": "5°S, 83°W",
    "radius": 18,
    "lore": "DA tiny frog with beautiful golden skin that secretes a mysterious poison. Locals believe that this rare frog will guide one to a legendary land of gold.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 5°S, 83°W.",
    "icon": "🐸"
  },
  {
    "id": "disc_55_toucan",
    "numId": 55,
    "name": "Toucan",
    "category": "flora_fauna",
    "rank": "B",
    "difficulty": 55,
    "fameReward": 560,
    "goldValue": 21500,
    "position": {
      "x": 487,
      "y": 762
    },
    "coordinatesNav": "35°S, 66°W",
    "radius": 18,
    "lore": "QA loud-squawking bird with a huge, brightly colored beak. It feeds chiefly on fruit.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 35°S, 66°W.",
    "icon": "🪶"
  },
  {
    "id": "disc_56_claymonster",
    "numId": 56,
    "name": "Clay Monster",
    "category": "ruins",
    "rank": "A",
    "difficulty": 70,
    "fameReward": 840,
    "goldValue": 38500,
    "position": {
      "x": 506,
      "y": 730
    },
    "coordinatesNav": "30°S, 63°W",
    "radius": 18,
    "lore": "A clay figure of a monster with a large head and fangs.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 30°S, 63°W.",
    "icon": "🏛️"
  },
  {
    "id": "disc_57_giantgroundsloth",
    "numId": 57,
    "name": "Giant Ground Sloth",
    "category": "flora_fauna",
    "rank": "☆",
    "difficulty": 100,
    "fameReward": 1300,
    "goldValue": 65000,
    "position": {
      "x": 524,
      "y": 698
    },
    "coordinatesNav": "25°S, 60°W",
    "radius": 18,
    "lore": "A slow-moving, hairy mammal with sharp claws. Rumor has it this 20 feet tall creature walks upright and feeds on leaves and branches.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 25°S, 60°W.",
    "icon": "🐾"
  },
  {
    "id": "disc_58_anteater",
    "numId": 58,
    "name": "Anteater",
    "category": "flora_fauna",
    "rank": "B",
    "difficulty": 60,
    "fameReward": 570,
    "goldValue": 22000,
    "position": {
      "x": 481,
      "y": 698
    },
    "coordinatesNav": "25°S, 67°W",
    "radius": 18,
    "lore": "FA toothless mammal with powerful claws on its front feet and a long tongue that comes in handy for catching ants - the mainstay of its diet. Its long tail accounts for half of its 6 foot length.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 25°S, 67°W.",
    "icon": "🐾"
  },
  {
    "id": "disc_59_leonpenguin",
    "numId": 59,
    "name": "Leon Penguin",
    "category": "flora_fauna",
    "rank": "C",
    "difficulty": 25,
    "fameReward": 300,
    "goldValue": 10000,
    "position": {
      "x": 402,
      "y": 895
    },
    "coordinatesNav": "56°S, 80°W",
    "radius": 18,
    "lore": "A flightless goose-sized bird that uses its wings to swim. Found in large flocks, it was discovered by the Portuguese navigator, Leon Franco, about 20 years ago. Well, that's what some people say.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 56°S, 80°W.",
    "icon": "🪶"
  },
  {
    "id": "disc_60_vampirebat",
    "numId": 60,
    "name": "Vampire Bat",
    "category": "wonder",
    "rank": "B",
    "difficulty": 35,
    "fameReward": 520,
    "goldValue": 19500,
    "position": {
      "x": 396,
      "y": 844
    },
    "coordinatesNav": "48°S, 81°W",
    "radius": 18,
    "lore": "A large bat with a 12 inch wingspan. It uses its sharp teeth to make a shallow wound on its prey, secretes a liquid to prevent the wound from closing, and feeds on its blood.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 48°S, 81°W.",
    "icon": "✨"
  },
  {
    "id": "disc_61_laketiticaca",
    "numId": 61,
    "name": "Lake Titicaca",
    "category": "wonder",
    "rank": "B",
    "difficulty": 60,
    "fameReward": 570,
    "goldValue": 22000,
    "position": {
      "x": 420,
      "y": 667
    },
    "coordinatesNav": "20°S, 77°W",
    "radius": 18,
    "lore": "The world's highest lake at an altitude of 12,500 feet in the Andes Mountains. The Aztecs believe that a god lives in this lake.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 20°S, 77°W.",
    "icon": "✨"
  },
  {
    "id": "disc_62_templeofthesun",
    "numId": 62,
    "name": "Temple of the Sun",
    "category": "ruins",
    "rank": "A",
    "difficulty": 70,
    "fameReward": 840,
    "goldValue": 38500,
    "position": {
      "x": 371,
      "y": 597
    },
    "coordinatesNav": "9°S, 85°W",
    "radius": 18,
    "lore": "A pyramid-shaped shrine in the central Andes, with distinctive frontal stairs climbing 33 feet to the top.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 9°S, 85°W.",
    "icon": "🏛️"
  },
  {
    "id": "disc_63_terracottafigure",
    "numId": 63,
    "name": "Terracotta Figure",
    "category": "ruins",
    "rank": "B",
    "difficulty": 35,
    "fameReward": 520,
    "goldValue": 19500,
    "position": {
      "x": 384,
      "y": 535
    },
    "coordinatesNav": "1°N, 83°W",
    "radius": 18,
    "lore": "This large sculpture represents a legendary hero worshipped by local tribes. Its sculpting technique and intricate design prove that this area has a highly advanced culture.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 1°N, 83°W.",
    "icon": "🏛️"
  },
  {
    "id": "nazca_lines",
    "numId": 64,
    "name": "Nazca Desert Geoglyphs",
    "category": "ruins",
    "rank": "B",
    "difficulty": 50,
    "fameReward": 500,
    "goldValue": 20000,
    "position": {
      "x": 420,
      "y": 680
    },
    "coordinatesNav": "20°S, 77°W",
    "radius": 20,
    "lore": "Gigantic geometric shapes and animal figures scraped into the arid coastal desert plateau, discernible in their entirety only from the heavens.",
    "historicalSignificance": "Sacred geoglyphs etched by the Nazca civilization between 500 BCE and 500 CE.",
    "icon": "🦅"
  },
  {
    "id": "disc_65_muralofmarnalico",
    "numId": 65,
    "name": "Mural of Marnalico",
    "category": "ruins",
    "rank": "A",
    "difficulty": 65,
    "fameReward": 830,
    "goldValue": 37750,
    "position": {
      "x": 329,
      "y": 501
    },
    "coordinatesNav": "8°N, 92°W",
    "radius": 18,
    "lore": "A mural of warriors and hunting gods.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 8°N, 92°W.",
    "icon": "🏛️"
  },
  {
    "id": "chichen_itza",
    "numId": 66,
    "name": "Chichén Itzá (El Castillo)",
    "category": "ruins",
    "rank": "A",
    "difficulty": 70,
    "fameReward": 700,
    "goldValue": 32000,
    "position": {
      "x": 340,
      "y": 490
    },
    "coordinatesNav": "12°N, 98°W",
    "radius": 20,
    "lore": "A massive step pyramid dedicated to the Feathered Serpent Kukulkan. On the equinoxes, shadows create the illusion of a snake slithering down its balustrades.",
    "historicalSignificance": "Major ceremonial center and astronomical capital of the Maya civilization in Yucatan.",
    "icon": "🐍"
  },
  {
    "id": "disc_67_crystalskull",
    "numId": 67,
    "name": "Crystal Skull",
    "category": "ruins",
    "rank": "☆",
    "difficulty": 90,
    "fameReward": 1270,
    "goldValue": 63000,
    "position": {
      "x": 249,
      "y": 476
    },
    "coordinatesNav": "13°N, 105°W",
    "radius": 18,
    "lore": "An elaborately sculptured crystal skull used for generations in rituals by tribal leaders.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 13°N, 105°W.",
    "icon": "🏛️"
  },
  {
    "id": "disc_68_stoneface",
    "numId": 68,
    "name": "Stone Face",
    "category": "flora_fauna",
    "rank": "C",
    "difficulty": 30,
    "fameReward": 310,
    "goldValue": 10400,
    "position": {
      "x": 225,
      "y": 462
    },
    "coordinatesNav": "16°N, 109°W",
    "radius": 18,
    "lore": "A stone bust excavated from Tenochtitlan.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 16°N, 109°W.",
    "icon": "🗿"
  },
  {
    "id": "disc_69_monumentofthesun",
    "numId": 69,
    "name": "Monument of the Sun",
    "category": "ruins",
    "rank": "A",
    "difficulty": 85,
    "fameReward": 870,
    "goldValue": 40750,
    "position": {
      "x": 213,
      "y": 442
    },
    "coordinatesNav": "20°N, 111°W",
    "radius": 18,
    "lore": "A round stone monument symbolizing the sun and the seasons. It represents the Aztec people's concept of the universe.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 20°N, 111°W.",
    "icon": "🗿"
  },
  {
    "id": "disc_70_mexicanbeadedlizard",
    "numId": 70,
    "name": "Mexican Beaded Lizard",
    "category": "flora_fauna",
    "rank": "B",
    "difficulty": 50,
    "fameReward": 550,
    "goldValue": 21000,
    "position": {
      "x": 182,
      "y": 418
    },
    "coordinatesNav": "25°N, 116°W",
    "radius": 18,
    "lore": "A large lizard with black and yellow bead-like scales. Its secret weapon is its ability to produce poison in its mouth.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 25°N, 116°W.",
    "icon": "🦎"
  },
  {
    "id": "disc_71_bison",
    "numId": 71,
    "name": "Bison",
    "category": "flora_fauna",
    "rank": "C",
    "difficulty": 30,
    "fameReward": 310,
    "goldValue": 10400,
    "position": {
      "x": 152,
      "y": 398
    },
    "coordinatesNav": "29°N, 121°W",
    "radius": 18,
    "lore": "A large wild bull that can weigh almost a ton. It is hunted for both food and its hide, which can be used to make leather. Such great numbers roam the plains that it's hard to imagine them ever becoming extinct.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 29°N, 121°W.",
    "icon": "🐾"
  },
  {
    "id": "disc_72_prairiedog",
    "numId": 72,
    "name": "Prairie Dog",
    "category": "flora_fauna",
    "rank": "B",
    "difficulty": 55,
    "fameReward": 560,
    "goldValue": 21500,
    "position": {
      "x": 109,
      "y": 354
    },
    "coordinatesNav": "38°N, 128°W",
    "radius": 18,
    "lore": "BGround-dwelling squirrel-like mammals 11 - 16 inches long. They make their home underground in a complex system of interconnecting burrows with many entrances.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 38°N, 128°W.",
    "icon": "🐾"
  },
  {
    "id": "disc_73_borobudur",
    "numId": 73,
    "name": "Borobudur",
    "category": "ruins",
    "rank": "A",
    "difficulty": 75,
    "fameReward": 850,
    "goldValue": 39250,
    "position": {
      "x": 1531,
      "y": 559
    },
    "coordinatesNav": "3°S, 105°E",
    "radius": 18,
    "lore": "KThe ruins of a major Buddhist monument. It consists of eight diminishing tiers of terraces connected by stairways. The walls of the corridors are lined with intricately carved relief sculptures.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 3°S, 105°E.",
    "icon": "🏛️"
  },
  {
    "id": "disc_74_python",
    "numId": 74,
    "name": "Python",
    "category": "ruins",
    "rank": "B",
    "difficulty": 60,
    "fameReward": 570,
    "goldValue": 22000,
    "position": {
      "x": 1567,
      "y": 572
    },
    "coordinatesNav": "5°S, 111°E",
    "radius": 18,
    "lore": "A giant snake that can grow over 33 feet long in the jungle. After constricting and suffocating an animal, the python swallows its prey whole.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 5°S, 111°E.",
    "icon": "🐍"
  },
  {
    "id": "komodo",
    "numId": 75,
    "name": "Komodo Dragon",
    "category": "flora_fauna",
    "rank": "B",
    "difficulty": 85,
    "fameReward": 450,
    "goldValue": 18000,
    "position": {
      "x": 1510,
      "y": 640
    },
    "coordinatesNav": "5°S, 120°E",
    "radius": 20,
    "lore": "A monstrous lizard resembling a prehistoric drake, reaching ten feet in length and equipped with armor-like scales and lethal venomous bite.",
    "historicalSignificance": "The largest living monitor lizard species, surviving exclusively in the Lesser Sunda islands.",
    "icon": "🦎"
  },
  {
    "id": "disc_76_kangaroo",
    "numId": 76,
    "name": "Kangaroo",
    "category": "flora_fauna",
    "rank": "A",
    "difficulty": 80,
    "fameReward": 860,
    "goldValue": 40000,
    "position": {
      "x": 1598,
      "y": 641
    },
    "coordinatesNav": "16°S, 116°E",
    "radius": 18,
    "lore": "WIts long fat tail and powerful hind legs help this animal hip-hop along. The newly born infants, still small and pinkish, crawl into a pouch on the mother's belly and remain there during infancy.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 16°S, 116°E.",
    "icon": "🐾"
  },
  {
    "id": "disc_77_frilledlizard",
    "numId": 77,
    "name": "Frilled Lizard",
    "category": "flora_fauna",
    "rank": "A",
    "difficulty": 75,
    "fameReward": 850,
    "goldValue": 39250,
    "position": {
      "x": 1579,
      "y": 705
    },
    "coordinatesNav": "26°S, 113°E",
    "radius": 18,
    "lore": "EA lizard with a large umbrella-like frill. It rises up and opens the frill to intimidate enemies and runs away only on its rear legs.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 26°S, 113°E.",
    "icon": "🦎"
  },
  {
    "id": "disc_78_ayersrock",
    "numId": 78,
    "name": "Ayers Rock",
    "category": "wonder",
    "rank": "B",
    "difficulty": 50,
    "fameReward": 550,
    "goldValue": 21000,
    "position": {
      "x": 1659,
      "y": 717
    },
    "coordinatesNav": "28°S, 126°E",
    "radius": 18,
    "lore": "A legend says that there is a humongous red monolith in the center of this continent.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 28°S, 126°E.",
    "icon": "✨"
  },
  {
    "id": "disc_79_tasmaniandevil",
    "numId": 79,
    "name": "Tasmanian Devil",
    "category": "wonder",
    "rank": "C",
    "difficulty": 30,
    "fameReward": 310,
    "goldValue": 10400,
    "position": {
      "x": 1768,
      "y": 774
    },
    "coordinatesNav": "37°S, 144°E",
    "radius": 18,
    "lore": "A 30 inch long nocturnal animal that feeds on small animals and carrion. It hides in the cracks of rocks and trees.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 37°S, 144°E.",
    "icon": "✨"
  },
  {
    "id": "disc_80_koala",
    "numId": 80,
    "name": "Koala",
    "category": "flora_fauna",
    "rank": "B",
    "difficulty": 55,
    "fameReward": 560,
    "goldValue": 21500,
    "position": {
      "x": 1793,
      "y": 730
    },
    "coordinatesNav": "30°S, 148°E",
    "radius": 18,
    "lore": "A tree-dwelling marsupial mammal that only eats the leaves of the eucalyptus tree. Koala young spend their first 6 months in their mother's pouch, feeding on predigested eucalyptus leaves.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 30°S, 148°E.",
    "icon": "🐾"
  },
  {
    "id": "disc_81_kiwi",
    "numId": 81,
    "name": "Kiwi",
    "category": "flora_fauna",
    "rank": "B",
    "difficulty": 55,
    "fameReward": 560,
    "goldValue": 21500,
    "position": {
      "x": 1738,
      "y": 616
    },
    "coordinatesNav": "12°S, 139°E",
    "radius": 18,
    "lore": "Named for its cry, this is a flightless, nocturnal bird with a small head and a long, slender bill that has nostrils near the tip. It uses its highly developed sense of smell to find its food.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 12°S, 139°E.",
    "icon": "🪶"
  },
  {
    "id": "disc_82_greaterbirdofparadise",
    "numId": 82,
    "name": "Greater Bird of Paradise",
    "category": "flora_fauna",
    "rank": "A",
    "difficulty": 80,
    "fameReward": 860,
    "goldValue": 40000,
    "position": {
      "x": 1726,
      "y": 559
    },
    "coordinatesNav": "3°S, 137°E",
    "radius": 18,
    "lore": "PThe male of this beautiful bird has a yellow head, long tail and dark-green throat, but the female has only short feathers and is rather dull in color.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 3°S, 137°E.",
    "icon": "🪶"
  },
  {
    "id": "disc_83_stonebuddha",
    "numId": 83,
    "name": "Stone Buddha",
    "category": "ruins",
    "rank": "B",
    "difficulty": 60,
    "fameReward": 570,
    "goldValue": 22000,
    "position": {
      "x": 1610,
      "y": 540
    },
    "coordinatesNav": "0°S, 118°E",
    "radius": 18,
    "lore": "A huge statue of Buddha carved out of the side of a mountain.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 0°S, 118°E.",
    "icon": "🗿"
  },
  {
    "id": "disc_84_pitcherplant",
    "numId": 84,
    "name": "Pitcher Plant",
    "category": "flora_fauna",
    "rank": "B",
    "difficulty": 45,
    "fameReward": 540,
    "goldValue": 20500,
    "position": {
      "x": 1549,
      "y": 525
    },
    "coordinatesNav": "3°N, 108°E",
    "radius": 18,
    "lore": "A plant that feeds on insects by trapping and digesting them in its pitcher-like leaves.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 3°N, 108°E.",
    "icon": "🌿"
  },
  {
    "id": "disc_85_treesnake",
    "numId": 85,
    "name": "Tree Snake",
    "category": "flora_fauna",
    "rank": "B",
    "difficulty": 45,
    "fameReward": 540,
    "goldValue": 20500,
    "position": {
      "x": 1628,
      "y": 467
    },
    "coordinatesNav": "15°N, 121°E",
    "radius": 18,
    "lore": "A slender snake about 3 feet long. The name comes from the fact that it makes its home in trees.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 15°N, 121°E.",
    "icon": "🌿"
  },
  {
    "id": "disc_86_durian",
    "numId": 86,
    "name": "Durian",
    "category": "flora_fauna",
    "rank": "A",
    "difficulty": 85,
    "fameReward": 870,
    "goldValue": 40750,
    "position": {
      "x": 1659,
      "y": 476
    },
    "coordinatesNav": "13°N, 126°E",
    "radius": 18,
    "lore": "YA fruit that is covered with sharp needles. Some say that it is the most delicious of all tropical forest fruits, but it smells so bad that most don't dare taste it.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 13°N, 126°E.",
    "icon": "🌿"
  },
  {
    "id": "giant_moa",
    "numId": 87,
    "name": "Giant Moa of Aotearoa",
    "category": "flora_fauna",
    "rank": "A",
    "difficulty": 100,
    "fameReward": 650,
    "goldValue": 25000,
    "position": {
      "x": 1820,
      "y": 840
    },
    "coordinatesNav": "35°S, 175°E",
    "radius": 22,
    "lore": "An enormous flightless avian standing over twelve feet tall, grazing serenely among fern-carpeted primeval forests.",
    "historicalSignificance": "Megafaunal flightless bird endemic to New Zealand.",
    "icon": "🦤"
  },
  {
    "id": "disc_88_greatauk",
    "numId": 88,
    "name": "Great Auk",
    "category": "flora_fauna",
    "rank": "A",
    "difficulty": 70,
    "fameReward": 840,
    "goldValue": 38500,
    "position": {
      "x": 719,
      "y": 217
    },
    "coordinatesNav": "66°N, 28°W",
    "radius": 18,
    "lore": "A flightless bird about 30 inches long that makes its home near Greenland. Fishermen hunt this bird for its tasty meat.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 66°N, 28°W.",
    "icon": "🪶"
  },
  {
    "id": "aurora",
    "numId": 89,
    "name": "Aurora Borealis (Northern Lights)",
    "category": "wonder",
    "rank": "A",
    "difficulty": 90,
    "fameReward": 600,
    "goldValue": 28000,
    "position": {
      "x": 970,
      "y": 110
    },
    "coordinatesNav": "89°N, 87°E",
    "radius": 25,
    "lore": "Spectacular ethereal ribbons of emerald and violet fire dancing across the polar night sky above frozen fjords and glaciers.",
    "historicalSignificance": "Atmospheric light display caused by cosmic solar particles colliding with Earth’s magnetic field.",
    "icon": "🌌"
  },
  {
    "id": "disc_90_stellarsseacow",
    "numId": 90,
    "name": "Stellar's Sea Cow",
    "category": "flora_fauna",
    "rank": "B",
    "difficulty": 60,
    "fameReward": 570,
    "goldValue": 22000,
    "position": {
      "x": 1976,
      "y": 168
    },
    "coordinatesNav": "76°N, 178°E",
    "radius": 18,
    "lore": "A large water mammal about 10 feet long. The head resembles a seal and its rear part has a fish-like shape. Locals say its meat is delicious.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 76°N, 178°E.",
    "icon": "🐾"
  },
  {
    "id": "white_whale",
    "numId": 91,
    "name": "The Great White Whale",
    "category": "monster",
    "rank": "☆",
    "difficulty": 75,
    "fameReward": 1100,
    "goldValue": 55000,
    "position": {
      "x": 740,
      "y": 820
    },
    "coordinatesNav": "80°N, 119°W",
    "radius": 25,
    "lore": "A titanic albino sperm whale scarred by iron harpoons, breaching the turbulent waters of the roaring forties with unbridled fury.",
    "historicalSignificance": "The apex leviathan of maritime folklore, inspiring generations of deep-sea whalers and novelists.",
    "icon": "🐋"
  },
  {
    "id": "disc_92_mammoth",
    "numId": 92,
    "name": "Mammoth",
    "category": "monster",
    "rank": "☆",
    "difficulty": 100,
    "fameReward": 1300,
    "goldValue": 65000,
    "position": {
      "x": 323,
      "y": 105
    },
    "coordinatesNav": "89°N, 93°W",
    "radius": 18,
    "lore": "A legendary giant elephant with a coat of brown wool and long tusks that curve upward.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 89°N, 93°W.",
    "icon": "🦣"
  },
  {
    "id": "disc_93_sabertoothedtiger",
    "numId": 93,
    "name": "Saber-toothed Tiger",
    "category": "monster",
    "rank": "☆",
    "difficulty": 100,
    "fameReward": 1300,
    "goldValue": 65000,
    "position": {
      "x": 487,
      "y": 110
    },
    "coordinatesNav": "88°N, 66°W",
    "radius": 18,
    "lore": "A large carnivorous animal about 6 feet long. Its enormous, blade-like upper teeth extend 7 inches below its lower jaw.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 88°N, 66°W.",
    "icon": "🐅"
  },
  {
    "id": "disc_94_fruitbat",
    "numId": 94,
    "name": "Fruit Bat",
    "category": "flora_fauna",
    "rank": "A",
    "difficulty": 70,
    "fameReward": 840,
    "goldValue": 38500,
    "position": {
      "x": 1714,
      "y": 491
    },
    "coordinatesNav": "10°N, 135°E",
    "radius": 18,
    "lore": "bJust as the name suggests, this bat lives off of fruit. It is a very rare delicacy at tables throughout the area.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 10°N, 135°E.",
    "icon": "🐾"
  },
  {
    "id": "disc_95_indopacificcowrie",
    "numId": 95,
    "name": "Indo-Pacific Cowrie",
    "category": "flora_fauna",
    "rank": "A",
    "difficulty": 85,
    "fameReward": 870,
    "goldValue": 40750,
    "position": {
      "x": 1811,
      "y": 511
    },
    "coordinatesNav": "6°N, 151°E",
    "radius": 18,
    "lore": "A rare snail with a beautiful shell that lives deep in the sea. Its shell is used as an amulet by tribal leaders and shamans in the area.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 6°N, 151°E.",
    "icon": "🐾"
  },
  {
    "id": "disc_96_nasiped",
    "numId": 96,
    "name": "Nasiped",
    "category": "flora_fauna",
    "rank": "C",
    "difficulty": 10,
    "fameReward": 270,
    "goldValue": 8800,
    "position": {
      "x": 1970,
      "y": 616
    },
    "coordinatesNav": "12°S, 177°E",
    "radius": 18,
    "lore": "A creature rumored to resemble a mouse that walks upside down using its highly developed nose. This odd creature is probably fantastical.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 12°S, 177°E.",
    "icon": "🐾"
  },
  {
    "id": "disc_97_gianttortoise",
    "numId": 97,
    "name": "Giant Tortoise",
    "category": "flora_fauna",
    "rank": "A",
    "difficulty": 80,
    "fameReward": 860,
    "goldValue": 40000,
    "position": {
      "x": 304,
      "y": 572
    },
    "coordinatesNav": "5°S, 96°W",
    "radius": 18,
    "lore": "AA large, slow-moving tortoise that can weigh as much as 500 pounds. Its domed shell sometimes grows as long as three feet and serves as protection for its elephant-like skin.",
    "historicalSignificance": "Authentic discovery of the Age of Exploration located at 5°S, 96°W.",
    "icon": "🐢"
  },
  {
    "id": "moai",
    "numId": 98,
    "name": "Moai of Rapa Nui",
    "category": "ruins",
    "rank": "A",
    "difficulty": 100,
    "fameReward": 750,
    "goldValue": 35000,
    "position": {
      "x": 210,
      "y": 720
    },
    "coordinatesNav": "34°S, 127°W",
    "radius": 20,
    "lore": "Towering monolithic statues carved from volcanic tuff, resting on stone platforms (ahu) facing inward across the loneliest island on Earth.",
    "historicalSignificance": "Sacred ancestral figures of the Polynesian Rapa Nui civilization.",
    "icon": "🗿"
  }
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
