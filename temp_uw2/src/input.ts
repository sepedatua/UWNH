import { CardinalDirection, Direction, OrdinalDirection } from './types';

type Wasd = 'w' | 'a' | 's' | 'd';

const cardinalKeyMap: { [key in Wasd]: CardinalDirection } = {
  w: 'n',
  d: 'e',
  s: 's',
  a: 'w',
};

const ordinalKeyMap: {
  [key: string]: {
    [key: string]: OrdinalDirection;
  };
} = {
  w: {
    d: 'ne',
    a: 'nw',
  },
  s: {
    d: 'se',
    a: 'sw',
  },
};

export const directionMap: { [key in Direction | '']: number } = {
  n: 0,
  ne: 1,
  e: 2,
  se: 3,
  s: 4,
  sw: 5,
  w: 6,
  nw: 7,
  '': 8,
};

const keyAliasMap: Record<string, Wasd> = {
  w: 'w',
  arrowup: 'w',
  '8': 'w',
  s: 's',
  arrowdown: 's',
  '2': 's',
  a: 'a',
  arrowleft: 'a',
  '4': 'a',
  d: 'd',
  arrowright: 'd',
  '6': 'd',
};

const isWasd = (key: string): key is Wasd => key in cardinalKeyMap;

let pressedWasd: Wasd[] = [];

let pressedE = false;

const PRESSED_E_TIME_MARGIN = 250;
let pressedETimeoutId: number;

const onKeydown = (e: KeyboardEvent) => {
  const pressedKey = e.key.toLowerCase();
  const normalizedKey = keyAliasMap[pressedKey];

  if (normalizedKey && !pressedWasd.includes(normalizedKey)) {
    pressedWasd.unshift(normalizedKey);
  }
};

const onKeyup = (e: KeyboardEvent) => {
  const pressedKey = e.key.toLowerCase();
  const normalizedKey = keyAliasMap[pressedKey];

  if (normalizedKey) {
    pressedWasd = pressedWasd.filter((key) => key !== normalizedKey);
  }

  if (pressedKey === 'e' || pressedKey === 'enter') {
    pressedE = true;

    window.clearTimeout(pressedETimeoutId);
    pressedETimeoutId = window.setTimeout(() => {
      pressedE = false;
    }, PRESSED_E_TIME_MARGIN);
  }
};

const onBlur = () => {
  Input.reset();
};

const Input = {
  setup: () => {
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('keyup', onKeyup);
    window.addEventListener('blur', onBlur);
  },
  getDirection: (options: { includeOrdinal: boolean }): Direction | '' => {
    if (!pressedWasd.length) {
      return '';
    }

    if (options.includeOrdinal && pressedWasd.length > 1) {
      const direction =
        ordinalKeyMap[pressedWasd[0]]?.[pressedWasd[1]] ||
        ordinalKeyMap[pressedWasd[1]]?.[pressedWasd[0]];

      if (direction) {
        return direction;
      }
    }

    return cardinalKeyMap[pressedWasd[0]];
  },
  getPressedE: () => pressedE,
  reset: () => {
    pressedWasd = [];

    pressedE = false;

    window.clearTimeout(pressedETimeoutId);
  },
};

export default Input;
