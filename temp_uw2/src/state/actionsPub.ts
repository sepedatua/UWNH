import state from './state';
import { updateGeneral } from './actionsPort';
import { getPlayerFleet } from './selectorsFleet';
import { shipData } from '../data/shipData';
import { sample, random } from '../utils';

export const TAVERN_RUMORS = [
  '“I heard black pepper from India fetches ten times its weight in silver when sold in Northern Europe!”',
  '“A Spanish treasure galleon laden with silver was sighted navigating the waters of the Caribbean!”',
  '“Beware the treacherous waters near Cape of Good Hope; heavy winds and savage currents have claimed many a balsa.”',
  '“If ye invest capital in the local shipyard, shipwrights can forge grander hulls like Carracks and Galleons!”',
  '“Spices from the Moluccas are rarer than gold in Iberia. A single expedition can make a pauper into a duke!”',
  '“A skilled first mate with high navigation will keep yer vessel steady even in raging squalls.”',
  '“The Ottoman merchants in Istanbul weave carpets that nobles in Venice will pay a king’s ransom for!”',
  '“Always keep at least 20 days of water and food when embarking on Atlantic crossings, or the scurvy will take ye!”',
];

/**
 * Dismiss surplus crew from player ships (cannot reduce below minimum crew requirement)
 */
export const dismissCrew = (amount: number): { success: boolean; message: string; dismissed: number } => {
  const ships = getPlayerFleet();
  let remainingToDismiss = amount;
  let totalDismissed = 0;

  for (let i = ships.length - 1; i >= 0; i -= 1) {
    if (remainingToDismiss <= 0) break;

    const ship = ships[i];
    const template = shipData[ship.id];
    const minCrew = template ? template.minimumCrew : 5;

    const surplus = Math.max(0, ship.crew - minCrew);
    if (surplus > 0) {
      const toRemove = Math.min(remainingToDismiss, surplus);
      ship.crew -= toRemove;
      totalDismissed += toRemove;
      remainingToDismiss -= toRemove;
    }
  }

  updateGeneral();

  if (totalDismissed === 0) {
    return {
      success: false,
      message: 'You cannot dismiss any more sailors; your ships require minimum crew to remain seaworthy!',
      dismissed: 0,
    };
  }

  return {
    success: true,
    message: `Dismissed ${totalDismissed} crew members. Daily ration consumption reduced!`,
    dismissed: totalDismissed,
  };
};

/**
 * Buy a round of drinks for tavern patrons to boost fleet morale and gather rumors
 */
export const treatPatrons = (): {
  success: boolean;
  message: string;
  rumor: string;
  morale: number;
} => {
  const DRINK_COST = 20;

  if (state.gold < DRINK_COST) {
    return {
      success: false,
      message: 'You don’t have enough coins to treat the tavern, Captain.',
      rumor: '',
      morale: state.morale || 80,
    };
  }

  state.gold -= DRINK_COST;
  state.morale = Math.min(100, (state.morale || 80) + 10);

  const rumor = sample(TAVERN_RUMORS);

  updateGeneral();

  return {
    success: true,
    message: 'The patrons raise their tankards high: “Three cheers for the Captain!” Fleet morale increased to ' + state.morale + '!',
    rumor,
    morale: state.morale,
  };
};

export interface DiceGameResult {
  playerDice: [number, number];
  playerTotal: number;
  gamblerDice: [number, number];
  gamblerTotal: number;
  outcome: 'win' | 'lose' | 'tie';
  payout: number;
}

/**
 * Play the 16th-century sailor dice game (High-Low / 2d6)
 */
export const playDiceGame = (wager: number): DiceGameResult => {
  const p1 = random(1, 6);
  const p2 = random(1, 6);
  const pTotal = p1 + p2;

  const g1 = random(1, 6);
  const g2 = random(1, 6);
  const gTotal = g1 + g2;

  let outcome: 'win' | 'lose' | 'tie';
  let payout = 0;

  if (pTotal > gTotal) {
    outcome = 'win';
    payout = wager;
    state.gold += wager;
  } else if (pTotal < gTotal) {
    outcome = 'lose';
    payout = -wager;
    state.gold -= wager;
  } else {
    outcome = 'tie';
    payout = 0;
  }

  updateGeneral();

  return {
    playerDice: [p1, p2],
    playerTotal: pTotal,
    gamblerDice: [g1, g2],
    gamblerTotal: gTotal,
    outcome,
    payout,
  };
};

/**
 * Get total surplus crew in fleet eligible for dismissal
 */
export const getTotalDismissibleCrew = (): number => {
  const ships = getPlayerFleet();
  return ships.reduce((acc, ship) => {
    const template = shipData[ship.id];
    const minCrew = template ? template.minimumCrew : 5;
    return acc + Math.max(0, ship.crew - minCrew);
  }, 0);
};

/**
 * Get total current crew headcount across all ships
 */
export const getTotalCurrentCrew = (): number => {
  const ships = getPlayerFleet();
  return ships.reduce((acc, ship) => acc + ship.crew, 0);
};
