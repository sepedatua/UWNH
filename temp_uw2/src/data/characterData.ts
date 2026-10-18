// Characters are only used during dialog

export type Character = {
  name: string;
  color: string;
};

const characterData: { [key: string]: Character } = {
  '1': {
    name: 'João Franco',
    color: 'text-blue-600',
  },
  '2': {
    name: 'Catalina Erantzo',
    color: 'text-red-500',
  },
  '3': {
    name: 'Otto Baynes',
    color: 'text-emerald-500',
  },
  '4': {
    name: 'Ernst Von Bohr',
    color: 'text-cyan-500',
  },
  '5': {
    name: 'Pietro Conti',
    color: 'text-purple-500',
  },
  '6': {
    name: 'Ali Vezas',
    color: 'text-amber-500',
  },
  '7': {
    name: 'Butler Marco',
    color: 'text-blue-900',
  },
  '19': {
    name: 'Duke Franco',
    color: 'text-red-600',
  },
  '20': {
    name: 'Duchess Christiana',
    color: 'text-yellow-600',
  },
  '32': {
    name: 'Old Sea Hand Rocco',
    color: 'text-amber-800',
  },
  '33': {
    name: 'Brother Enrico',
    color: 'text-purple-800',
  },
  '35': {
    name: 'Andreas Baes',
    color: 'text-red-800',
  },
  '36': {
    name: 'Matthew Baker',
    color: 'text-emerald-800',
  },
  '37': {
    name: 'Hans Hucken',
    color: 'text-cyan-800',
  },
  '38': {
    name: 'Camilo Stefan',
    color: 'text-purple-800',
  },
  '39': {
    name: 'Salim',
    color: 'text-amber-800',
  },
  '40': {
    name: 'Miguel Leal',
    color: 'text-blue-800',
  },
  '41': {
    name: 'Anthony Sherley',
    color: 'text-red-700',
  },
  '42': {
    name: 'Cesare Fedrici',
    color: 'text-purple-700',
  },
  '43': {
    name: 'Lawrence Edward',
    color: 'text-emerald-700',
  },
  '44': {
    name: 'Zaganos',
    color: 'text-amber-900',
  },
  '45': {
    name: 'Diego Silva',
    color: 'text-orange-800',
  },
  '46': {
    name: 'Jean Lafitte',
    color: 'text-indigo-700',
  },
  '47': {
    name: 'Pierino',
    color: 'text-cyan-700',
  },
  '48': {
    name: 'Duarte Barbosa',
    color: 'text-teal-800',
  },
  '49': {
    name: 'Fernao Mendes',
    color: 'text-blue-900',
  },
  '50': {
    name: 'Vasco de Ataide',
    color: 'text-red-900',
  },
  '51': {
    name: 'Alfonso de Albuquerque',
    color: 'text-yellow-700',
  },
  '52': {
    name: 'Dante Peleira',
    color: 'text-cyan-800',
  },
  '98': {
    name: 'Carlotta, Owner of the Pub',
    color: 'text-amber-600',
  },
  '99': {
    name: 'Lucia the Waitress',
    color: 'text-pink-600',
  },
};

export default characterData;
