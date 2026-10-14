export const sailorSkills = [
  'Celestial Navigation',
  'Accounting',
  'Negotiation',
  'Gunnery',
  'Cartography',
] as const;
export type SailorSkills = (typeof sailorSkills)[number];

export type Sailor = {
  name: string;
  age: number;
  stats: {
    leadership: number;
    seamanship: number;
    knowledge: number;
    intuition: number;
    courage: number;
    swordplay: number;
    charm: number;
    luck: number;
  };
  navigationLevel: number;
  battleLevel: number;
  skills: SailorSkills[];
};

const sailorData: { [key: string]: Sailor } = {
  '1': {
    name: 'João Franco',
    age: 18,
    stats: {
      leadership: 78,
      seamanship: 75,
      knowledge: 73,
      intuition: 85,
      courage: 82,
      swordplay: 82,
      charm: 89,
      luck: 50,
    },
    navigationLevel: 1,
    battleLevel: 1,
    skills: ['Negotiation'],
  },
  '2': {
    name: 'Catalina Erantzo',
    age: 18,
    stats: {
      leadership: 80,
      seamanship: 78,
      knowledge: 65,
      intuition: 70,
      courage: 92,
      swordplay: 86,
      charm: 85,
      luck: 60,
    },
    navigationLevel: 8,
    battleLevel: 10,
    skills: ['Gunnery'],
  },
  '3': {
    name: 'Otto Baynes',
    age: 25,
    stats: {
      leadership: 82,
      seamanship: 74,
      knowledge: 68,
      intuition: 65,
      courage: 95,
      swordplay: 88,
      charm: 72,
      luck: 50,
    },
    navigationLevel: 10,
    battleLevel: 12,
    skills: ['Gunnery'],
  },
  '4': {
    name: 'Ernst Von Bohr',
    age: 23,
    stats: {
      leadership: 70,
      seamanship: 84,
      knowledge: 90,
      intuition: 76,
      courage: 68,
      swordplay: 60,
      charm: 78,
      luck: 80,
    },
    navigationLevel: 11,
    battleLevel: 1,
    skills: ['Cartography', 'Celestial Navigation'],
  },
  '5': {
    name: 'Pietro Conti',
    age: 33,
    stats: {
      leadership: 74,
      seamanship: 72,
      knowledge: 78,
      intuition: 88,
      courage: 80,
      swordplay: 70,
      charm: 84,
      luck: 85,
    },
    navigationLevel: 8,
    battleLevel: 5,
    skills: ['Accounting'],
  },
  '6': {
    name: 'Ali Vezas',
    age: 19,
    stats: {
      leadership: 75,
      seamanship: 65,
      knowledge: 82,
      intuition: 84,
      courage: 70,
      swordplay: 62,
      charm: 88,
      luck: 95,
    },
    navigationLevel: 1,
    battleLevel: 1,
    skills: ['Accounting', 'Negotiation'],
  },
  '32': {
    name: 'Rocco Alemkel',
    age: 65,
    stats: {
      leadership: 75,
      seamanship: 82,
      knowledge: 84,
      intuition: 90,
      courage: 93,
      swordplay: 92,
      charm: 70,
      luck: 70,
    },
    navigationLevel: 30,
    battleLevel: 32,
    skills: ['Celestial Navigation', 'Gunnery'],
  },
  '33': {
    name: 'Enrico Malione',
    age: 24,
    stats: {
      leadership: 66,
      seamanship: 48,
      knowledge: 93,
      intuition: 55,
      courage: 62,
      swordplay: 48,
      charm: 82,
      luck: 100,
    },
    navigationLevel: 1,
    battleLevel: 1,
    skills: ['Accounting'],
  },
  '35': {
    name: 'Andreas Baes',
    age: 32,
    stats: {
      leadership: 72,
      seamanship: 76,
      knowledge: 70,
      intuition: 74,
      courage: 85,
      swordplay: 80,
      charm: 68,
      luck: 60,
    },
    navigationLevel: 14,
    battleLevel: 15,
    skills: ['Celestial Navigation', 'Gunnery'],
  },
  '36': {
    name: 'Matthew Baker',
    age: 30,
    stats: {
      leadership: 68,
      seamanship: 78,
      knowledge: 82,
      intuition: 70,
      courage: 80,
      swordplay: 75,
      charm: 65,
      luck: 65,
    },
    navigationLevel: 15,
    battleLevel: 14,
    skills: ['Celestial Navigation', 'Gunnery'],
  },
  '37': {
    name: 'Hans Hucken',
    age: 17,
    stats: {
      leadership: 55,
      seamanship: 62,
      knowledge: 85,
      intuition: 72,
      courage: 58,
      swordplay: 45,
      charm: 75,
      luck: 85,
    },
    navigationLevel: 6,
    battleLevel: 1,
    skills: ['Cartography'],
  },
  '38': {
    name: 'Camilo Stefan',
    age: 28,
    stats: {
      leadership: 64,
      seamanship: 68,
      knowledge: 75,
      intuition: 80,
      courage: 72,
      swordplay: 65,
      charm: 70,
      luck: 70,
    },
    navigationLevel: 8,
    battleLevel: 6,
    skills: ['Accounting'],
  },
  '39': {
    name: 'Salim',
    age: 19,
    stats: {
      leadership: 60,
      seamanship: 55,
      knowledge: 78,
      intuition: 75,
      courage: 65,
      swordplay: 58,
      charm: 72,
      luck: 80,
    },
    navigationLevel: 3,
    battleLevel: 2,
    skills: ['Negotiation'],
  },
  'custom': {
    name: 'Custom Captain',
    age: 22,
    stats: {
      leadership: 75,
      seamanship: 75,
      knowledge: 75,
      intuition: 75,
      courage: 75,
      swordplay: 75,
      charm: 75,
      luck: 75,
    },
    navigationLevel: 5,
    battleLevel: 5,
    skills: ['Celestial Navigation', 'Accounting'],
  },
};

const getSailor = (id: string) => sailorData[id] || sailorData['1'];

export default getSailor;
