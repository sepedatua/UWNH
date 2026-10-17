import { shipData, shipWindFactorMap } from '../../data/shipData';
import { getHeadingWindDelta, hasOars } from './worldUtils';
import type { Velocity } from '../../state/state';
import type { Ship } from './fleets';
import { Sailor } from '../../data/sailorData';

/*
  In contrast to the original game, we do not round down during each step of
  the calculation.

  An oversight in the game is that your ship will continue moving faster as
  the headwind gets stronger. Also, if wind speed is 0, wind direction still
  matters when calculating the speed of a ship with oars.

  Consider imposing a heavier penalty sailing into the wind, if the gameplay
  doesn’t get tedious.

  It’s also worth looking into requiring higher sailor stats to handle
  end-game ships so mid-tier ships have their uses outside exploration.
 */
export const getCurrentEffect = (heading: number, current?: Velocity) => {
  if (!current || !current.speed) {
    return 0;
  }
  const directionDelta = getHeadingWindDelta(heading, current.direction);
  const factor =
    directionDelta === 0
      ? 1
      : directionDelta === 1
        ? 0.7
        : directionDelta === 2
          ? 0
          : directionDelta === 3
            ? -0.7
            : -1;

  return current.speed * factor * 0.8;
};

const getShipSpeed = (
  ship: Pick<Ship, 'id' | 'crew' | 'cargo'>,
  sailor: Pick<Sailor, 'navigationLevel' | 'stats'>,
  heading: number,
  wind: Velocity,
  current?: Velocity,
  navCrewRatio: number = 1.0,
) => {
  const { power, tacking, sailType, minimumCrew, capacity } = shipData[ship.id];
  const directionDelta = getHeadingWindDelta(heading, wind.direction);
  const shipWindFactor = shipWindFactorMap[sailType][directionDelta];

  /*
   TODO if wind speed = 0 as a mechanic is introduced,
    ships with oars should count as having 2 wind speed
   */
  const windSpeed = hasOars(ship.id) ? Math.max(3, wind.speed) : wind.speed;

  const propulsionFactor = (power * shipWindFactor * windSpeed) / 150;

  const { crew } = ship;

  // Active navigation duty allocation (from crew duty ratio, default 1.0)
  const navCrew = crew * navCrewRatio;
  const navigationCrewFactor = Math.min(1, navCrew / minimumCrew);

  const capacityUsed =
    ship.cargo.reduce((total, { quantity }) => total + quantity, 0) + crew;
  const cargoFactor = Math.min(1.5, 1.8 - capacityUsed / capacity);

  const navigationLevelFactor = (10 + sailor.navigationLevel) / 10;

  const isHeadwindOrSideHeadWind = directionDelta >= 3;
  const tackingFactor = isHeadwindOrSideHeadWind ? tacking / 100 : 1;

  const baseSpeed = Math.min(
    30,
    propulsionFactor *
      navigationCrewFactor *
      cargoFactor *
      navigationLevelFactor,
  );

  const windPropelledSpeed =
    (baseSpeed * tackingFactor * sailor.stats.seamanship) / 75;

  if (!current || !current.speed) {
    return windPropelledSpeed;
  }

  const currentEffect = getCurrentEffect(heading, current);
  return Math.min(40, Math.max(1, windPropelledSpeed + currentEffect));
};

export default getShipSpeed;

