import Input from '../../input';
import type { Position } from '../../types';
import { Map } from '../../map';
import createWorldPlayer from './worldPlayer';
import createWorldNpc, { WorldNpc } from './worldNpc';
import state from '../../state/state';
import type { Ship } from './fleets';
import { hasOars } from './worldUtils';
import { dock } from '../../state/actionsWorld';
import { getNearbyPort } from '../port/portUtils';
import updateInterface from '../../state/updateInterface';
import autopilotManager from './autopilotManager';

const FRAMES_PER_SHIP = 8;
const SHIP_VARIANTS = 2;

export const getStartFrame = (flagship: Ship, isPlayer = false) => {
  const startFrame = hasOars(flagship.id) ? 0 : FRAMES_PER_SHIP;

  return isPlayer ? startFrame : startFrame + FRAMES_PER_SHIP * SHIP_VARIANTS;
};

const createWorldCharacters = (map: Map) => {
  const playerFleet = state.fleets[1];

  if (!playerFleet.position) {
    throw Error('Player fleet has no position');
  }

  const player = createWorldPlayer(
    playerFleet.position,
    getStartFrame(playerFleet.ships[0], true),
    'n',
  );

  const npcs: WorldNpc[] = [];

  for (let id = 2; id <= Object.keys(state.fleets).length; id += 1) {
    const { position, ships } = state.fleets[id];

    if (!position) {
      throw Error('NPC fleet has no position');
    }

    npcs.push(createWorldNpc(position, getStartFrame(ships[0]), 'n', true));
  }

  const collision = (position: Position) => map.collisionAt(position);

  return {
    update: () => {
      player.update();

      const currentPos = player.position();
      const nearbyPort = getNearbyPort(currentPos);
      updateInterface.nearbyPort?.(nearbyPort);
      updateInterface.coordinates?.(currentPos);

      // Synchronize live flagship position in global state
      const playerFleetState = state.fleets[1] || state.fleets['1'];
      if (playerFleetState) {
        playerFleetState.position = currentPos;
      }

      if (Input.getPressedE()) {
        if (autopilotManager.isActive()) {
          autopilotManager.cancelCourse('Autopilot Disengaged: Manual docking initiated.');
        }
        const docked = dock(currentPos);
        if (docked) {
          player.setHeading('');
          return;
        }
      }

      const direction = Input.getDirection({ includeOrdinal: true });

      // If manual direction input is detected, cancel autopilot and follow manual controls
      if (direction) {
        if (autopilotManager.isActive()) {
          autopilotManager.cancelCourse('Autopilot Disengaged: Manual steering initiated.');
        }
        player.setHeading(direction);
      } else if (autopilotManager.isActive()) {
        // Autopilot steers the ship along plotted waypoints
        autopilotManager.updateSteering(player);
      }

      player.updateSpeed();

      const heading = player.heading();

      if (heading) {
        player.move(heading, collision);
      }

      npcs.forEach((npc) => {
        npc.update();

        if (!npc.shouldMove()) {
          return;
        }

        npc.move();

        // if (collision(npc)) {
        //   npc.undoMove();
        // }
      });
    },
    player: () => player,
    npcs: () => npcs,
  };
};

export type WorldCharacters = ReturnType<typeof createWorldCharacters>;

export default createWorldCharacters;
