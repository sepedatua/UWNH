export interface Village {
  id: string;
  numId: number;
  name: string;
  tribe: string;
  region: string;
  position: { x: number; y: number };
  coordinatesNav: string;
  discoveryId: string;
  theme: 'african_savannah' | 'amazon_rainforest' | 'native_american' | 'oceanic_polynesian' | 'asian_bamboo' | 'arctic_tundra' | 'european_ancient';
  initialFriendship: number;
  radius: number;
}

export const villages: Village[] = [
  {
    "id": "vil_1_stonehenge",
    "numId": 1,
    "name": "Stonehenge Settlement",
    "tribe": "Europe & Mediterranean Natives",
    "region": "Europe & Mediterranean",
    "position": {
      "x": 890,
      "y": 265
    },
    "coordinatesNav": "51°N, 1°W",
    "discoveryId": "stonehenge",
    "theme": "european_ancient",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_2_rosettastone",
    "numId": 2,
    "name": "Rosetta Stone Settlement",
    "tribe": "Europe & Mediterranean Natives",
    "region": "Europe & Mediterranean",
    "position": {
      "x": 1067,
      "y": 388
    },
    "coordinatesNav": "31°N, 29°E",
    "discoveryId": "disc_2_rosettastone",
    "theme": "european_ancient",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_3_khufupyramid",
    "numId": 3,
    "name": "Khufu Pyramid Settlement",
    "tribe": "Europe & Mediterranean Natives",
    "region": "Europe & Mediterranean",
    "position": {
      "x": 1084,
      "y": 430
    },
    "coordinatesNav": "27°N, 30°E",
    "discoveryId": "pyramids",
    "theme": "european_ancient",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_4_crocodile",
    "numId": 4,
    "name": "Crocodile Settlement",
    "tribe": "Europe & Mediterranean Natives",
    "region": "Europe & Mediterranean",
    "position": {
      "x": 1097,
      "y": 447
    },
    "coordinatesNav": "19°N, 34°E",
    "discoveryId": "disc_4_crocodile",
    "theme": "european_ancient",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_5_nubiapyramid",
    "numId": 5,
    "name": "Nubia Pyramid Settlement",
    "tribe": "Africa & South Atlantic Natives",
    "region": "Africa & South Atlantic",
    "position": {
      "x": 1085,
      "y": 472
    },
    "coordinatesNav": "14°N, 32°E",
    "discoveryId": "disc_5_nubiapyramid",
    "theme": "african_savannah",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_6_tessisatfalls",
    "numId": 6,
    "name": "Tessisat Falls Settlement",
    "tribe": "Africa & South Atlantic Natives",
    "region": "Africa & South Atlantic",
    "position": {
      "x": 1110,
      "y": 491
    },
    "coordinatesNav": "10°N, 36°E",
    "discoveryId": "disc_6_tessisatfalls",
    "theme": "african_savannah",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_7_baobab",
    "numId": 7,
    "name": "Baobab Settlement",
    "tribe": "Africa & South Atlantic Natives",
    "region": "Africa & South Atlantic",
    "position": {
      "x": 1079,
      "y": 491
    },
    "coordinatesNav": "10°N, 31°E",
    "discoveryId": "disc_7_baobab",
    "theme": "african_savannah",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_8_pteranodon",
    "numId": 8,
    "name": "Pteranodon Settlement",
    "tribe": "Africa & South Atlantic Natives",
    "region": "Africa & South Atlantic",
    "position": {
      "x": 1091,
      "y": 516
    },
    "coordinatesNav": "5°N, 33°E",
    "discoveryId": "disc_8_pteranodon",
    "theme": "african_savannah",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_9_victoriafalls",
    "numId": 9,
    "name": "Victoria Falls Settlement",
    "tribe": "Africa & South Atlantic Natives",
    "region": "Africa & South Atlantic",
    "position": {
      "x": 1050,
      "y": 690
    },
    "coordinatesNav": "0°N, 32°E",
    "discoveryId": "victoria_falls",
    "theme": "african_savannah",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_10_diogosmonument",
    "numId": 10,
    "name": "Diogo's Monument Settlement",
    "tribe": "Africa & South Atlantic Natives",
    "region": "Africa & South Atlantic",
    "position": {
      "x": 939,
      "y": 535
    },
    "coordinatesNav": "1°N, 8°E",
    "discoveryId": "disc_10_diogosmonument",
    "theme": "african_savannah",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_11_anthill",
    "numId": 11,
    "name": "Ant Hill Settlement",
    "tribe": "Africa & South Atlantic Natives",
    "region": "Africa & South Atlantic",
    "position": {
      "x": 902,
      "y": 481
    },
    "coordinatesNav": "12°N, 2°E",
    "discoveryId": "disc_11_anthill",
    "theme": "african_savannah",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_12_claymosque",
    "numId": 12,
    "name": "Clay Mosque Settlement",
    "tribe": "Africa & South Atlantic Natives",
    "region": "Africa & South Atlantic",
    "position": {
      "x": 878,
      "y": 467
    },
    "coordinatesNav": "15°N, 2°W",
    "discoveryId": "disc_12_claymosque",
    "theme": "african_savannah",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_13_armadillo",
    "numId": 13,
    "name": "Armadillo Settlement",
    "tribe": "Africa & South Atlantic Natives",
    "region": "Africa & South Atlantic",
    "position": {
      "x": 963,
      "y": 578
    },
    "coordinatesNav": "6°S, 12°E",
    "discoveryId": "disc_13_armadillo",
    "theme": "african_savannah",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_14_moquelemubembe",
    "numId": 14,
    "name": "Moquele Mubembe Settlement",
    "tribe": "Africa & South Atlantic Natives",
    "region": "Africa & South Atlantic",
    "position": {
      "x": 994,
      "y": 546
    },
    "coordinatesNav": "1°S, 17°E",
    "discoveryId": "disc_14_moquelemubembe",
    "theme": "african_savannah",
    "initialFriendship": 30,
    "radius": 18
  },
  {
    "id": "vil_15_moonbow",
    "numId": 15,
    "name": "Moonbow Settlement",
    "tribe": "Africa & South Atlantic Natives",
    "region": "Africa & South Atlantic",
    "position": {
      "x": 1043,
      "y": 540
    },
    "coordinatesNav": "0°S, 25°E",
    "discoveryId": "disc_15_moonbow",
    "theme": "african_savannah",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_16_quagga",
    "numId": 16,
    "name": "Quagga Settlement",
    "tribe": "Africa & South Atlantic Natives",
    "region": "Africa & South Atlantic",
    "position": {
      "x": 951,
      "y": 616
    },
    "coordinatesNav": "12°S, 10°E",
    "discoveryId": "disc_16_quagga",
    "theme": "african_savannah",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_17_diazsmonument",
    "numId": 17,
    "name": "Diaz's Monument Settlement",
    "tribe": "Africa & South Atlantic Natives",
    "region": "Africa & South Atlantic",
    "position": {
      "x": 1006,
      "y": 736
    },
    "coordinatesNav": "31°S, 19°E",
    "discoveryId": "disc_17_diazsmonument",
    "theme": "african_savannah",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_18_bigzimbabwe",
    "numId": 18,
    "name": "Big Zimbabwe Settlement",
    "tribe": "Africa & South Atlantic Natives",
    "region": "Africa & South Atlantic",
    "position": {
      "x": 1043,
      "y": 730
    },
    "coordinatesNav": "30°S, 25°E",
    "discoveryId": "disc_18_bigzimbabwe",
    "theme": "african_savannah",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_19_mandrill",
    "numId": 19,
    "name": "Mandrill Settlement",
    "tribe": "Africa & South Atlantic Natives",
    "region": "Africa & South Atlantic",
    "position": {
      "x": 1140,
      "y": 540
    },
    "coordinatesNav": "0°S, 41°E",
    "discoveryId": "disc_19_mandrill",
    "theme": "african_savannah",
    "initialFriendship": 35,
    "radius": 18
  },
  {
    "id": "vil_20_dodo",
    "numId": 20,
    "name": "Dodo Settlement",
    "tribe": "Africa & South Atlantic Natives",
    "region": "Africa & South Atlantic",
    "position": {
      "x": 1195,
      "y": 667
    },
    "coordinatesNav": "20°S, 50°E",
    "discoveryId": "disc_20_dodo",
    "theme": "african_savannah",
    "initialFriendship": 15,
    "radius": 18
  },
  {
    "id": "vil_21_chameleon",
    "numId": 21,
    "name": "Chameleon Settlement",
    "tribe": "Africa & South Atlantic Natives",
    "region": "Africa & South Atlantic",
    "position": {
      "x": 1183,
      "y": 603
    },
    "coordinatesNav": "10°S, 48°E",
    "discoveryId": "disc_21_chameleon",
    "theme": "african_savannah",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_22_papyrus",
    "numId": 22,
    "name": "Papyrus Settlement",
    "tribe": "Europe & Mediterranean Natives",
    "region": "Europe & Mediterranean",
    "position": {
      "x": 1116,
      "y": 418
    },
    "coordinatesNav": "25°N, 37°E",
    "discoveryId": "disc_22_papyrus",
    "theme": "european_ancient",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_23_burningwater",
    "numId": 23,
    "name": "Burning Water Settlement",
    "tribe": "Europe & Mediterranean Natives",
    "region": "Europe & Mediterranean",
    "position": {
      "x": 1189,
      "y": 393
    },
    "coordinatesNav": "30°N, 49°E",
    "discoveryId": "disc_23_burningwater",
    "theme": "european_ancient",
    "initialFriendship": 40,
    "radius": 18
  },
  {
    "id": "vil_24_mohenjodaro",
    "numId": 24,
    "name": "Mohenjo-Daro Settlement",
    "tribe": "East Asia & Indochina Natives",
    "region": "East Asia & Indochina",
    "position": {
      "x": 1287,
      "y": 418
    },
    "coordinatesNav": "25°N, 65°E",
    "discoveryId": "disc_24_mohenjodaro",
    "theme": "asian_bamboo",
    "initialFriendship": 40,
    "radius": 18
  },
  {
    "id": "vil_25_kingcobra",
    "numId": 25,
    "name": "King Cobra Settlement",
    "tribe": "East Asia & Indochina Natives",
    "region": "East Asia & Indochina",
    "position": {
      "x": 1335,
      "y": 452
    },
    "coordinatesNav": "18°N, 73°E",
    "discoveryId": "disc_25_kingcobra",
    "theme": "asian_bamboo",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_26_inlelake",
    "numId": 26,
    "name": "Inle Lake Settlement",
    "tribe": "East Asia & Indochina Natives",
    "region": "East Asia & Indochina",
    "position": {
      "x": 1457,
      "y": 472
    },
    "coordinatesNav": "14°N, 93°E",
    "discoveryId": "disc_26_inlelake",
    "theme": "asian_bamboo",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_27_ayutthayasbuddha",
    "numId": 27,
    "name": "Ayutthaya's Buddha Settlement",
    "tribe": "East Asia & Indochina Natives",
    "region": "East Asia & Indochina",
    "position": {
      "x": 1482,
      "y": 486
    },
    "coordinatesNav": "11°N, 97°E",
    "discoveryId": "disc_27_ayutthayasbuddha",
    "theme": "asian_bamboo",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_28_hornbill",
    "numId": 28,
    "name": "Hornbill Settlement",
    "tribe": "East Asia & Indochina Natives",
    "region": "East Asia & Indochina",
    "position": {
      "x": 1470,
      "y": 506
    },
    "coordinatesNav": "7°N, 95°E",
    "discoveryId": "disc_28_hornbill",
    "theme": "asian_bamboo",
    "initialFriendship": 50,
    "radius": 18
  },
  {
    "id": "vil_29_angkorwat",
    "numId": 29,
    "name": "Angkor Wat Settlement",
    "tribe": "East Asia & Indochina Natives",
    "region": "East Asia & Indochina",
    "position": {
      "x": 1512,
      "y": 481
    },
    "coordinatesNav": "12°N, 102°E",
    "discoveryId": "disc_29_angkorwat",
    "theme": "asian_bamboo",
    "initialFriendship": 40,
    "radius": 18
  },
  {
    "id": "vil_30_kalavinka",
    "numId": 30,
    "name": "Kalavinka Settlement",
    "tribe": "East Asia & Indochina Natives",
    "region": "East Asia & Indochina",
    "position": {
      "x": 1549,
      "y": 432
    },
    "coordinatesNav": "22°N, 108°E",
    "discoveryId": "disc_30_kalavinka",
    "theme": "asian_bamboo",
    "initialFriendship": 30,
    "radius": 18
  },
  {
    "id": "vil_31_plantworm",
    "numId": 31,
    "name": "Plant Worm Settlement",
    "tribe": "East Asia & Indochina Natives",
    "region": "East Asia & Indochina",
    "position": {
      "x": 1659,
      "y": 354
    },
    "coordinatesNav": "38°N, 126°E",
    "discoveryId": "disc_31_plantworm",
    "theme": "asian_bamboo",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_32_tororuins",
    "numId": 32,
    "name": "Toro Ruins Settlement",
    "tribe": "East Asia & Indochina Natives",
    "region": "East Asia & Indochina",
    "position": {
      "x": 1720,
      "y": 395
    },
    "coordinatesNav": "35°N, 138°E",
    "discoveryId": "mount_fuji",
    "theme": "asian_bamboo",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_33_namahage",
    "numId": 33,
    "name": "Namahage Settlement",
    "tribe": "East Asia & Indochina Natives",
    "region": "East Asia & Indochina",
    "position": {
      "x": 1738,
      "y": 349
    },
    "coordinatesNav": "39°N, 139°E",
    "discoveryId": "disc_33_namahage",
    "theme": "asian_bamboo",
    "initialFriendship": 35,
    "radius": 18
  },
  {
    "id": "vil_34_qianling",
    "numId": 34,
    "name": "Qian Ling Settlement",
    "tribe": "East Asia & Indochina Natives",
    "region": "East Asia & Indochina",
    "position": {
      "x": 1573,
      "y": 369
    },
    "coordinatesNav": "35°N, 112°E",
    "discoveryId": "disc_34_qianling",
    "theme": "asian_bamboo",
    "initialFriendship": 15,
    "radius": 18
  },
  {
    "id": "vil_35_greatwall",
    "numId": 35,
    "name": "Great Wall Settlement",
    "tribe": "East Asia & Indochina Natives",
    "region": "East Asia & Indochina",
    "position": {
      "x": 1560,
      "y": 330
    },
    "coordinatesNav": "41°N, 110°E",
    "discoveryId": "great_wall",
    "theme": "asian_bamboo",
    "initialFriendship": 20,
    "radius": 18
  },
  {
    "id": "vil_36_hedgehog",
    "numId": 36,
    "name": "Hedgehog Settlement",
    "tribe": "East Asia & Indochina Natives",
    "region": "East Asia & Indochina",
    "position": {
      "x": 1543,
      "y": 354
    },
    "coordinatesNav": "38°N, 107°E",
    "discoveryId": "disc_36_hedgehog",
    "theme": "asian_bamboo",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_37_panda",
    "numId": 37,
    "name": "Panda Settlement",
    "tribe": "East Asia & Indochina Natives",
    "region": "East Asia & Indochina",
    "position": {
      "x": 1512,
      "y": 364
    },
    "coordinatesNav": "36°N, 102°E",
    "discoveryId": "disc_37_panda",
    "theme": "asian_bamboo",
    "initialFriendship": 25,
    "radius": 18
  },
  {
    "id": "vil_38_passengerpigeon",
    "numId": 38,
    "name": "Passenger Pigeon Settlement",
    "tribe": "North America & Caribbean Natives",
    "region": "North America & Caribbean",
    "position": {
      "x": 420,
      "y": 369
    },
    "coordinatesNav": "35°N, 77°W",
    "discoveryId": "disc_38_passengerpigeon",
    "theme": "native_american",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_39_totempole",
    "numId": 39,
    "name": "Totem Pole Settlement",
    "tribe": "North America & Caribbean Natives",
    "region": "North America & Caribbean",
    "position": {
      "x": 390,
      "y": 398
    },
    "coordinatesNav": "29°N, 82°W",
    "discoveryId": "disc_39_totempole",
    "theme": "native_american",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_40_jademask",
    "numId": 40,
    "name": "Jade Mask Settlement",
    "tribe": "North America & Caribbean Natives",
    "region": "North America & Caribbean",
    "position": {
      "x": 262,
      "y": 447
    },
    "coordinatesNav": "19°N, 103°W",
    "discoveryId": "disc_40_jademask",
    "theme": "native_american",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_41_guatavitalake",
    "numId": 41,
    "name": "Guatavita Lake Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 510,
      "y": 560
    },
    "coordinatesNav": "12°N, 90°W",
    "discoveryId": "el_dorado",
    "theme": "amazon_rainforest",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_42_cactus",
    "numId": 42,
    "name": "Cactus Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 463,
      "y": 506
    },
    "coordinatesNav": "7°N, 70°W",
    "discoveryId": "disc_42_cactus",
    "theme": "amazon_rainforest",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_43_iguana",
    "numId": 43,
    "name": "Iguana Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 493,
      "y": 506
    },
    "coordinatesNav": "7°N, 65°W",
    "discoveryId": "disc_43_iguana",
    "theme": "amazon_rainforest",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_44_venusflytrap",
    "numId": 44,
    "name": "Venus' Flytrap Settlement",
    "tribe": "North America & Caribbean Natives",
    "region": "North America & Caribbean",
    "position": {
      "x": 298,
      "y": 379
    },
    "coordinatesNav": "33°N, 97°W",
    "discoveryId": "disc_44_venusflytrap",
    "theme": "native_american",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_45_niagarafalls",
    "numId": 45,
    "name": "Niagara Falls Settlement",
    "tribe": "North America & Caribbean Natives",
    "region": "North America & Caribbean",
    "position": {
      "x": 323,
      "y": 330
    },
    "coordinatesNav": "43°N, 93°W",
    "discoveryId": "disc_45_niagarafalls",
    "theme": "native_american",
    "initialFriendship": 20,
    "radius": 18
  },
  {
    "id": "vil_46_amazonwaterlily",
    "numId": 46,
    "name": "Amazon Water Lily Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 518,
      "y": 565
    },
    "coordinatesNav": "4°S, 61°W",
    "discoveryId": "disc_46_amazonwaterlily",
    "theme": "amazon_rainforest",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_47_anaconda",
    "numId": 47,
    "name": "Anaconda Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 524,
      "y": 591
    },
    "coordinatesNav": "8°S, 60°W",
    "discoveryId": "disc_47_anaconda",
    "theme": "amazon_rainforest",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_48_pororoca",
    "numId": 48,
    "name": "Pororoca Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 487,
      "y": 572
    },
    "coordinatesNav": "5°S, 66°W",
    "discoveryId": "disc_48_pororoca",
    "theme": "amazon_rainforest",
    "initialFriendship": 40,
    "radius": 18
  },
  {
    "id": "vil_49_matamata",
    "numId": 49,
    "name": "Matamata Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 457,
      "y": 540
    },
    "coordinatesNav": "0°N, 71°W",
    "discoveryId": "disc_49_matamata",
    "theme": "amazon_rainforest",
    "initialFriendship": 35,
    "radius": 18
  },
  {
    "id": "vil_50_balsa",
    "numId": 50,
    "name": "Balsa Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 432,
      "y": 553
    },
    "coordinatesNav": "2°S, 75°W",
    "discoveryId": "disc_50_balsa",
    "theme": "amazon_rainforest",
    "initialFriendship": 45,
    "radius": 18
  },
  {
    "id": "vil_51_piranha",
    "numId": 51,
    "name": "Piranha Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 445,
      "y": 597
    },
    "coordinatesNav": "9°S, 73°W",
    "discoveryId": "disc_51_piranha",
    "theme": "amazon_rainforest",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_52_tarantula",
    "numId": 52,
    "name": "Tarantula Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 420,
      "y": 610
    },
    "coordinatesNav": "11°S, 77°W",
    "discoveryId": "disc_52_tarantula",
    "theme": "amazon_rainforest",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_53_archaeopteryx",
    "numId": 53,
    "name": "Archaeopteryx Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 420,
      "y": 584
    },
    "coordinatesNav": "7°S, 77°W",
    "discoveryId": "disc_53_archaeopteryx",
    "theme": "amazon_rainforest",
    "initialFriendship": 15,
    "radius": 18
  },
  {
    "id": "vil_54_goldfrog",
    "numId": 54,
    "name": "Gold Frog Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 384,
      "y": 572
    },
    "coordinatesNav": "5°S, 83°W",
    "discoveryId": "disc_54_goldfrog",
    "theme": "amazon_rainforest",
    "initialFriendship": 50,
    "radius": 18
  },
  {
    "id": "vil_55_toucan",
    "numId": 55,
    "name": "Toucan Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 487,
      "y": 762
    },
    "coordinatesNav": "35°S, 66°W",
    "discoveryId": "disc_55_toucan",
    "theme": "amazon_rainforest",
    "initialFriendship": 45,
    "radius": 18
  },
  {
    "id": "vil_56_claymonster",
    "numId": 56,
    "name": "Clay Monster Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 506,
      "y": 730
    },
    "coordinatesNav": "30°S, 63°W",
    "discoveryId": "disc_56_claymonster",
    "theme": "amazon_rainforest",
    "initialFriendship": 30,
    "radius": 18
  },
  {
    "id": "vil_57_giantgroundsloth",
    "numId": 57,
    "name": "Giant Ground Sloth Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 524,
      "y": 698
    },
    "coordinatesNav": "25°S, 60°W",
    "discoveryId": "disc_57_giantgroundsloth",
    "theme": "amazon_rainforest",
    "initialFriendship": 15,
    "radius": 18
  },
  {
    "id": "vil_58_anteater",
    "numId": 58,
    "name": "Anteater Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 481,
      "y": 698
    },
    "coordinatesNav": "25°S, 67°W",
    "discoveryId": "disc_58_anteater",
    "theme": "amazon_rainforest",
    "initialFriendship": 40,
    "radius": 18
  },
  {
    "id": "vil_59_leonpenguin",
    "numId": 59,
    "name": "Leon Penguin Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 402,
      "y": 895
    },
    "coordinatesNav": "56°S, 80°W",
    "discoveryId": "disc_59_leonpenguin",
    "theme": "amazon_rainforest",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_60_vampirebat",
    "numId": 60,
    "name": "Vampire Bat Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 396,
      "y": 844
    },
    "coordinatesNav": "48°S, 81°W",
    "discoveryId": "disc_60_vampirebat",
    "theme": "amazon_rainforest",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_61_laketiticaca",
    "numId": 61,
    "name": "Lake Titicaca Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 420,
      "y": 667
    },
    "coordinatesNav": "20°S, 77°W",
    "discoveryId": "disc_61_laketiticaca",
    "theme": "amazon_rainforest",
    "initialFriendship": 40,
    "radius": 18
  },
  {
    "id": "vil_62_templeofthesun",
    "numId": 62,
    "name": "Temple of the Sun Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 371,
      "y": 597
    },
    "coordinatesNav": "9°S, 85°W",
    "discoveryId": "disc_62_templeofthesun",
    "theme": "amazon_rainforest",
    "initialFriendship": 30,
    "radius": 18
  },
  {
    "id": "vil_63_terracottafigure",
    "numId": 63,
    "name": "Terracotta Figure Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 384,
      "y": 535
    },
    "coordinatesNav": "1°N, 83°W",
    "discoveryId": "disc_63_terracottafigure",
    "theme": "amazon_rainforest",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_64_stoneball",
    "numId": 64,
    "name": "Stone Ball Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 420,
      "y": 680
    },
    "coordinatesNav": "20°S, 77°W",
    "discoveryId": "nazca_lines",
    "theme": "amazon_rainforest",
    "initialFriendship": 50,
    "radius": 18
  },
  {
    "id": "vil_65_muralofmarnalico",
    "numId": 65,
    "name": "Mural of Marnalico Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 329,
      "y": 501
    },
    "coordinatesNav": "8°N, 92°W",
    "discoveryId": "disc_65_muralofmarnalico",
    "theme": "amazon_rainforest",
    "initialFriendship": 35,
    "radius": 18
  },
  {
    "id": "vil_66_popolvuh",
    "numId": 66,
    "name": "Popol Vuh Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 340,
      "y": 490
    },
    "coordinatesNav": "12°N, 98°W",
    "discoveryId": "chichen_itza",
    "theme": "amazon_rainforest",
    "initialFriendship": 30,
    "radius": 18
  },
  {
    "id": "vil_67_crystalskull",
    "numId": 67,
    "name": "Crystal Skull Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 249,
      "y": 476
    },
    "coordinatesNav": "13°N, 105°W",
    "discoveryId": "disc_67_crystalskull",
    "theme": "amazon_rainforest",
    "initialFriendship": 15,
    "radius": 18
  },
  {
    "id": "vil_68_stoneface",
    "numId": 68,
    "name": "Stone Face Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 225,
      "y": 462
    },
    "coordinatesNav": "16°N, 109°W",
    "discoveryId": "disc_68_stoneface",
    "theme": "amazon_rainforest",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_69_monumentofthesun",
    "numId": 69,
    "name": "Monument of the Sun Settlement",
    "tribe": "North America & Caribbean Natives",
    "region": "North America & Caribbean",
    "position": {
      "x": 213,
      "y": 442
    },
    "coordinatesNav": "20°N, 111°W",
    "discoveryId": "disc_69_monumentofthesun",
    "theme": "native_american",
    "initialFriendship": 15,
    "radius": 18
  },
  {
    "id": "vil_70_mexicanbeadedlizard",
    "numId": 70,
    "name": "Mexican Beaded Lizard Settlement",
    "tribe": "North America & Caribbean Natives",
    "region": "North America & Caribbean",
    "position": {
      "x": 182,
      "y": 418
    },
    "coordinatesNav": "25°N, 116°W",
    "discoveryId": "disc_70_mexicanbeadedlizard",
    "theme": "native_american",
    "initialFriendship": 50,
    "radius": 18
  },
  {
    "id": "vil_71_bison",
    "numId": 71,
    "name": "Bison Settlement",
    "tribe": "North America & Caribbean Natives",
    "region": "North America & Caribbean",
    "position": {
      "x": 152,
      "y": 398
    },
    "coordinatesNav": "29°N, 121°W",
    "discoveryId": "disc_71_bison",
    "theme": "native_american",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_72_prairiedog",
    "numId": 72,
    "name": "Prairie Dog Settlement",
    "tribe": "North America & Caribbean Natives",
    "region": "North America & Caribbean",
    "position": {
      "x": 109,
      "y": 354
    },
    "coordinatesNav": "38°N, 128°W",
    "discoveryId": "disc_72_prairiedog",
    "theme": "native_american",
    "initialFriendship": 45,
    "radius": 18
  },
  {
    "id": "vil_73_borobudur",
    "numId": 73,
    "name": "Borobudur Settlement",
    "tribe": "East Asia & Indochina Natives",
    "region": "East Asia & Indochina",
    "position": {
      "x": 1531,
      "y": 559
    },
    "coordinatesNav": "3°S, 105°E",
    "discoveryId": "disc_73_borobudur",
    "theme": "asian_bamboo",
    "initialFriendship": 25,
    "radius": 18
  },
  {
    "id": "vil_74_python",
    "numId": 74,
    "name": "Python Settlement",
    "tribe": "East Asia & Indochina Natives",
    "region": "East Asia & Indochina",
    "position": {
      "x": 1567,
      "y": 572
    },
    "coordinatesNav": "5°S, 111°E",
    "discoveryId": "disc_74_python",
    "theme": "asian_bamboo",
    "initialFriendship": 40,
    "radius": 18
  },
  {
    "id": "vil_75_komododragon",
    "numId": 75,
    "name": "Komodo Dragon Settlement",
    "tribe": "Oceania & Pacific Atolls Natives",
    "region": "Oceania & Pacific Atolls",
    "position": {
      "x": 1510,
      "y": 640
    },
    "coordinatesNav": "5°S, 120°E",
    "discoveryId": "komodo",
    "theme": "oceanic_polynesian",
    "initialFriendship": 15,
    "radius": 18
  },
  {
    "id": "vil_76_kangaroo",
    "numId": 76,
    "name": "Kangaroo Settlement",
    "tribe": "Oceania & Pacific Atolls Natives",
    "region": "Oceania & Pacific Atolls",
    "position": {
      "x": 1598,
      "y": 641
    },
    "coordinatesNav": "16°S, 116°E",
    "discoveryId": "disc_76_kangaroo",
    "theme": "oceanic_polynesian",
    "initialFriendship": 20,
    "radius": 18
  },
  {
    "id": "vil_77_frilledlizard",
    "numId": 77,
    "name": "Frilled Lizard Settlement",
    "tribe": "Oceania & Pacific Atolls Natives",
    "region": "Oceania & Pacific Atolls",
    "position": {
      "x": 1579,
      "y": 705
    },
    "coordinatesNav": "26°S, 113°E",
    "discoveryId": "disc_77_frilledlizard",
    "theme": "oceanic_polynesian",
    "initialFriendship": 25,
    "radius": 18
  },
  {
    "id": "vil_78_ayersrock",
    "numId": 78,
    "name": "Ayers Rock Settlement",
    "tribe": "Oceania & Pacific Atolls Natives",
    "region": "Oceania & Pacific Atolls",
    "position": {
      "x": 1659,
      "y": 717
    },
    "coordinatesNav": "28°S, 126°E",
    "discoveryId": "disc_78_ayersrock",
    "theme": "oceanic_polynesian",
    "initialFriendship": 50,
    "radius": 18
  },
  {
    "id": "vil_79_tasmaniandevil",
    "numId": 79,
    "name": "Tasmanian Devil Settlement",
    "tribe": "Oceania & Pacific Atolls Natives",
    "region": "Oceania & Pacific Atolls",
    "position": {
      "x": 1768,
      "y": 774
    },
    "coordinatesNav": "37°S, 144°E",
    "discoveryId": "disc_79_tasmaniandevil",
    "theme": "oceanic_polynesian",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_80_koala",
    "numId": 80,
    "name": "Koala Settlement",
    "tribe": "Oceania & Pacific Atolls Natives",
    "region": "Oceania & Pacific Atolls",
    "position": {
      "x": 1793,
      "y": 730
    },
    "coordinatesNav": "30°S, 148°E",
    "discoveryId": "disc_80_koala",
    "theme": "oceanic_polynesian",
    "initialFriendship": 45,
    "radius": 18
  },
  {
    "id": "vil_81_kiwi",
    "numId": 81,
    "name": "Kiwi Settlement",
    "tribe": "Oceania & Pacific Atolls Natives",
    "region": "Oceania & Pacific Atolls",
    "position": {
      "x": 1738,
      "y": 616
    },
    "coordinatesNav": "12°S, 139°E",
    "discoveryId": "disc_81_kiwi",
    "theme": "oceanic_polynesian",
    "initialFriendship": 45,
    "radius": 18
  },
  {
    "id": "vil_82_greaterbirdofparadise",
    "numId": 82,
    "name": "Greater Bird of Paradise Settlement",
    "tribe": "East Asia & Indochina Natives",
    "region": "East Asia & Indochina",
    "position": {
      "x": 1726,
      "y": 559
    },
    "coordinatesNav": "3°S, 137°E",
    "discoveryId": "disc_82_greaterbirdofparadise",
    "theme": "asian_bamboo",
    "initialFriendship": 20,
    "radius": 18
  },
  {
    "id": "vil_83_stonebuddha",
    "numId": 83,
    "name": "Stone Buddha Settlement",
    "tribe": "East Asia & Indochina Natives",
    "region": "East Asia & Indochina",
    "position": {
      "x": 1610,
      "y": 540
    },
    "coordinatesNav": "0°S, 118°E",
    "discoveryId": "disc_83_stonebuddha",
    "theme": "asian_bamboo",
    "initialFriendship": 40,
    "radius": 18
  },
  {
    "id": "vil_84_pitcherplant",
    "numId": 84,
    "name": "Pitcher Plant Settlement",
    "tribe": "East Asia & Indochina Natives",
    "region": "East Asia & Indochina",
    "position": {
      "x": 1549,
      "y": 525
    },
    "coordinatesNav": "3°N, 108°E",
    "discoveryId": "disc_84_pitcherplant",
    "theme": "asian_bamboo",
    "initialFriendship": 55,
    "radius": 18
  },
  {
    "id": "vil_85_treesnake",
    "numId": 85,
    "name": "Tree Snake Settlement",
    "tribe": "East Asia & Indochina Natives",
    "region": "East Asia & Indochina",
    "position": {
      "x": 1628,
      "y": 467
    },
    "coordinatesNav": "15°N, 121°E",
    "discoveryId": "disc_85_treesnake",
    "theme": "asian_bamboo",
    "initialFriendship": 55,
    "radius": 18
  },
  {
    "id": "vil_86_durian",
    "numId": 86,
    "name": "Durian Settlement",
    "tribe": "East Asia & Indochina Natives",
    "region": "East Asia & Indochina",
    "position": {
      "x": 1659,
      "y": 476
    },
    "coordinatesNav": "13°N, 126°E",
    "discoveryId": "disc_86_durian",
    "theme": "asian_bamboo",
    "initialFriendship": 15,
    "radius": 18
  },
  {
    "id": "vil_87_moa",
    "numId": 87,
    "name": "Moa Settlement",
    "tribe": "Oceania & Pacific Atolls Natives",
    "region": "Oceania & Pacific Atolls",
    "position": {
      "x": 1820,
      "y": 840
    },
    "coordinatesNav": "35°S, 175°E",
    "discoveryId": "giant_moa",
    "theme": "oceanic_polynesian",
    "initialFriendship": 15,
    "radius": 18
  },
  {
    "id": "vil_88_greatauk",
    "numId": 88,
    "name": "Great Auk Settlement",
    "tribe": "Europe & Mediterranean Natives",
    "region": "Europe & Mediterranean",
    "position": {
      "x": 719,
      "y": 217
    },
    "coordinatesNav": "66°N, 28°W",
    "discoveryId": "disc_88_greatauk",
    "theme": "european_ancient",
    "initialFriendship": 30,
    "radius": 18
  },
  {
    "id": "vil_89_aurora",
    "numId": 89,
    "name": "Aurora Settlement",
    "tribe": "Polar & Arctic Frontier Natives",
    "region": "Polar & Arctic Frontier",
    "position": {
      "x": 970,
      "y": 110
    },
    "coordinatesNav": "89°N, 87°E",
    "discoveryId": "aurora",
    "theme": "arctic_tundra",
    "initialFriendship": 15,
    "radius": 18
  },
  {
    "id": "vil_90_stellarsseacow",
    "numId": 90,
    "name": "Stellar's Sea Cow Settlement",
    "tribe": "Polar & Arctic Frontier Natives",
    "region": "Polar & Arctic Frontier",
    "position": {
      "x": 1976,
      "y": 168
    },
    "coordinatesNav": "76°N, 178°E",
    "discoveryId": "disc_90_stellarsseacow",
    "theme": "arctic_tundra",
    "initialFriendship": 40,
    "radius": 18
  },
  {
    "id": "vil_91_bluewhale",
    "numId": 91,
    "name": "Blue Whale Settlement",
    "tribe": "Europe & Mediterranean Natives",
    "region": "Europe & Mediterranean",
    "position": {
      "x": 740,
      "y": 820
    },
    "coordinatesNav": "80°N, 119°W",
    "discoveryId": "white_whale",
    "theme": "european_ancient",
    "initialFriendship": 25,
    "radius": 18
  },
  {
    "id": "vil_92_mammoth",
    "numId": 92,
    "name": "Mammoth Settlement",
    "tribe": "North America & Caribbean Natives",
    "region": "North America & Caribbean",
    "position": {
      "x": 323,
      "y": 105
    },
    "coordinatesNav": "89°N, 93°W",
    "discoveryId": "disc_92_mammoth",
    "theme": "native_american",
    "initialFriendship": 15,
    "radius": 18
  },
  {
    "id": "vil_93_sabertoothedtiger",
    "numId": 93,
    "name": "Saber-toothed Tiger Settlement",
    "tribe": "North America & Caribbean Natives",
    "region": "North America & Caribbean",
    "position": {
      "x": 487,
      "y": 110
    },
    "coordinatesNav": "88°N, 66°W",
    "discoveryId": "disc_93_sabertoothedtiger",
    "theme": "native_american",
    "initialFriendship": 15,
    "radius": 18
  },
  {
    "id": "vil_94_fruitbat",
    "numId": 94,
    "name": "Fruit Bat Settlement",
    "tribe": "East Asia & Indochina Natives",
    "region": "East Asia & Indochina",
    "position": {
      "x": 1714,
      "y": 491
    },
    "coordinatesNav": "10°N, 135°E",
    "discoveryId": "disc_94_fruitbat",
    "theme": "asian_bamboo",
    "initialFriendship": 30,
    "radius": 18
  },
  {
    "id": "vil_95_indopacificcowrie",
    "numId": 95,
    "name": "Indo-Pacific Cowrie Settlement",
    "tribe": "Europe & Mediterranean Natives",
    "region": "Europe & Mediterranean",
    "position": {
      "x": 1811,
      "y": 511
    },
    "coordinatesNav": "6°N, 151°E",
    "discoveryId": "disc_95_indopacificcowrie",
    "theme": "european_ancient",
    "initialFriendship": 15,
    "radius": 18
  },
  {
    "id": "vil_96_nasiped",
    "numId": 96,
    "name": "Nasiped Settlement",
    "tribe": "Oceania & Pacific Atolls Natives",
    "region": "Oceania & Pacific Atolls",
    "position": {
      "x": 1970,
      "y": 616
    },
    "coordinatesNav": "12°S, 177°E",
    "discoveryId": "disc_96_nasiped",
    "theme": "oceanic_polynesian",
    "initialFriendship": 60,
    "radius": 18
  },
  {
    "id": "vil_97_gianttortoise",
    "numId": 97,
    "name": "Giant Tortoise Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 304,
      "y": 572
    },
    "coordinatesNav": "5°S, 96°W",
    "discoveryId": "disc_97_gianttortoise",
    "theme": "amazon_rainforest",
    "initialFriendship": 20,
    "radius": 18
  },
  {
    "id": "vil_98_moai",
    "numId": 98,
    "name": "Moai Settlement",
    "tribe": "South America & Amazon Natives",
    "region": "South America & Amazon",
    "position": {
      "x": 210,
      "y": 720
    },
    "coordinatesNav": "34°S, 127°W",
    "discoveryId": "moai",
    "theme": "amazon_rainforest",
    "initialFriendship": 15,
    "radius": 18
  }
];

export const getVillageById = (id: string): Village | undefined => {
  return villages.find((v) => v.id === id);
};

export const getNearbyVillage = (
  x: number,
  y: number,
  maxDistance = 18,
): Village | null => {
  let closest: Village | null = null;
  let minDistance = Infinity;

  for (const vil of villages) {
    let dx = Math.abs(x - vil.position.x);
    if (dx > 1080) {
      dx = 2160 - dx;
    }
    const dy = Math.abs(y - vil.position.y);
    const dist = Math.hypot(dx, dy);

    if (dist <= maxDistance && dist < minDistance) {
      minDistance = dist;
      closest = vil;
    }
  }

  return closest;
};

export const VILLAGES = villages;
