import {
  CardinalDirection,
  Direction,
  directionToChanges,
  Position,
} from '../../types';
import getShipSpeed from './shipSpeed';
import state, { Velocity } from '../../state/state';
import { directionMap } from '../../input';
import updateInterface from '../../state/updateInterface';
import { calculateDestination } from './worldUtils';
import { getXWrapAround } from './sharedUtils';
import { getCaptain } from '../../state/selectors';
import getSailor from '../../data/sailorData';

const createWorldPlayer = (
  startPosition: Position,
  startFrame: number,
  startDirection: CardinalDirection,
) => {
  let position = startPosition;
  let destination: Position | undefined;

  let { frameOffset } = directionToChanges[startDirection];
  let frameAlternate = 0;

  let heading: Direction | '' = '';
  let speed = 0;

  let lastHeading: Direction | '' = '';
  let lastWind: Velocity = {
    direction: 0,
    speed: 0,
  };
  let lastCurrent: Velocity = {
    direction: 0,
    speed: 0,
  };

  updateInterface.playerFleetDirection?.(directionMap[heading]);

  const windUnchanged = (wind: Velocity) =>
    wind?.direction === lastWind.direction && wind?.speed === lastWind.speed;

  const currentUnchanged = (current: Velocity) =>
    current?.direction === lastCurrent.direction &&
    current?.speed === lastCurrent.speed;

  const animate = () => {
    frameAlternate = frameAlternate === 0 ? 1 : 0;
  };

  return {
    move: (
      direction: Direction,
      collisionAt: (position: Position) => boolean,
    ) => {
      animate();

      const {
        xDelta,
        yDelta,
        frameOffset: newFrameOffset,
      } = directionToChanges[direction];
      frameOffset = newFrameOffset;

      const isDiagonal = Math.abs(xDelta) > 0 && Math.abs(yDelta) > 0;
      const multiplier = speed / 40 / (isDiagonal ? Math.SQRT2 : 1);

      if (!isDiagonal) {
        destination = calculateDestination(
          position,
          xDelta,
          yDelta,
          multiplier,
          collisionAt,
        );

        return;
      }

      const firstDestination = calculateDestination(
        position,
        xDelta,
        0,
        multiplier,
        collisionAt,
      );

      destination = calculateDestination(
        firstDestination,
        0,
        yDelta,
        multiplier,
        collisionAt,
      );
    },
    update: () => {
      if (destination) {
        position = {
          x: getXWrapAround(destination.x),
          y: destination.y,
        };
      }
    },
    position: (percentNextMove = 0) => {
      if (!destination) {
        return position;
      }

      return {
        x: getXWrapAround(
          position.x + (destination.x - position.x) * percentNextMove,
        ),
        y: position.y + (destination.y - position.y) * percentNextMove,
      };
    },
    destination: () => destination,
    setHeading: (newHeading: Direction | '') => {
      if (newHeading === heading) {
        return;
      }

      heading = newHeading;

      updateInterface.playerFleetDirection?.(directionMap[heading]);
    },
    heading: () => heading,
    updateSpeed: () => {
      if (
        heading === lastHeading &&
        windUnchanged(state.wind) &&
        currentUnchanged(state.current)
      ) {
        return;
      }

      const playerFleet = state.fleets[1] || state.fleets['1'];
      const ship = playerFleet?.ships?.[0];

      let captain = null;
      try {
        captain = getCaptain(0);
      } catch {
        try {
          captain = getSailor(state.protagonistId || '1');
        } catch {
          captain = null;
        }
      }

      speed = heading
        ? getShipSpeed(
            ship || ({ id: '1' } as any),
            captain as any,
            directionMap[heading],
            state.wind,
            state.current,
          )
        : 0;


      lastHeading = heading;
      lastWind = state.wind;
      lastCurrent = state.current || { direction: 0, speed: 0 };
      updateInterface.playerFleetSpeed?.(speed);
    },

    frame: () => startFrame + frameOffset + frameAlternate,
    width: 2,
    height: 2,
  };
};

export type WorldPlayer = ReturnType<typeof createWorldPlayer>;

export default createWorldPlayer;
