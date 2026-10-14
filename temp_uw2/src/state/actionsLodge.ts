import state from './state';
import updateInterface from './updateInterface';
import { updateGeneral, exitBuilding } from './actionsPort';
import { sample } from '../utils';

export const LODGE_GOSSIP = [
  'A Dutch merchant from Amsterdam says the Baltic ports are buying wine for double its price in Bordeaux.',
  'Travelers from the New World whisper of ancient stone temples deep in the Amazon, filled with gold and emeralds.',
  'The Marco Polo Bank reports that Portuguese trade fleets have established a dominant trade route around Africa to India.',
  'An English privateer captain named Otto Baynes was reportedly commissioned by King Henry VIII to scour Spanish shipping lanes.',
  'Word has reached the inn that Catalina Erantzo, former Spanish naval officer, has turned corsair to avenge her lost squadron.',
  'The cartographers at Mercator’s guild in Amsterdam pay lavish bounties for complete maps of the southern hemisphere.',
  'Sailors resting here say the waters around Madagascar harbor peaceful lagoons rich in natural pearls.',
  'If your vessel takes heavy cannon fire, make port immediately; a weakened hull will break apart in Atlantic gales.',
];

/**
 * Rest until night (8:00 PM / 1200 minutes)
 */
export const restUntilNight = () => {
  const currentMinutes = state.timePassed % 1440;
  const targetNightMinutes = 1200; // 8:00 PM

  let minutesToAdvance = 0;
  if (currentMinutes < targetNightMinutes) {
    minutesToAdvance = targetNightMinutes - currentMinutes;
  } else {
    // Already past 8 PM, advance through next day's 8 PM
    minutesToAdvance = 1440 - currentMinutes + targetNightMinutes;
  }

  updateInterface.fade(() => {
    state.timePassed += minutesToAdvance;
    exitBuilding();
    updateGeneral();
  });
};

/**
 * Get random traveler gossip
 */
export const getLodgeGossip = (): string => {
  return sample(LODGE_GOSSIP);
};
