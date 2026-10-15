import state from './state';
import { getPortData, portAdjacentAt } from '../game/port/portUtils';
import createPort from '../game/port/port';
import Input from '../input';
import updateInterface from './updateInterface';
import { updateGeneral } from './actionsPort';
import { generateId } from '../utils';
import { processDailySurvival } from '../game/world/voyageSurvival';
import {
  getCurrent,
  getIsSummer,
  getSeaArea,
  getWind,
} from '../game/world/windCurrent';
import { START_DATE } from '../constants';
import {
  getTimeOfDay,
  positionAdjacentToPort,
  shouldUpdateWorldStatus,
} from './selectors';
import { Position } from '../types';
import soundManager from '../interface/sound/soundManager';
import seaWeather from '../game/world/seaWeather';
import { calculateSightRadius } from '../game/world/fogOfWarRenderer';
import explorationManager from '../game/world/explorationManager';
import autopilotManager from '../game/world/autopilotManager';


export const dock = (position: Position) => {
  const portId = portAdjacentAt(position);

  if (!portId) {
    updateInterface.seaAlert?.({
      id: generateId(),
      type: 'warning',
      text: 'No port or harbor nearby to dock.',
      timestamp: Date.now(),
    });
    return false;
  }

  // Save docked fleet position
  const playerFleet = state.fleets[1] || state.fleets['1'];

  if (autopilotManager.isActive()) {
    autopilotManager.cancelCourse('Autopilot Disengaged: Docked safely in harbor.');
  }

  if (playerFleet) {
    playerFleet.position = position;
  }

  const portData = getPortData(portId);

  (state as any).world = null;
  state.port = createPort(portId);
  state.portId = portId;

  Input.reset();

  updateGeneral();

  state.dayAtSea = 0;
  updateInterface.dayAtSea?.(state.dayAtSea);
  updateInterface.nearbyPort?.(null);

  updateInterface.seaAlert?.({
    id: generateId(),
    type: 'info',
    text: `Docked safely at ${portData.name}.`,
    timestamp: Date.now(),
  });

  soundManager.playSfx('bell');

  return true;
};


export const updateProvisions = () => {
  const provisions = {
    water: 0,
    food: 0,
    lumber: 0,
    shot: 0,
  };

  const playerFleet = state.fleets[1] || state.fleets['1'];

  if (playerFleet && playerFleet.ships) {
    playerFleet.ships.forEach((ship) => {
      (ship.cargo || []).forEach((item) => {
        if (item && item.type in provisions) {
          provisions[item.type as keyof typeof provisions] += item.quantity || 0;
        }
      });
    });
  }

  updateInterface.provisions?.(provisions);
};

export const updateWorldStatus = () => {
  const playerFleet = state.fleets['1'] || state.fleets[1];
  const position = playerFleet?.position;

  if (!position) {
    console.warn('Player fleet position not set in updateWorldStatus, defaulting to port adjacent');
    return;
  }

  const seaArea = getSeaArea(position);

  const wind = getWind(seaArea, getIsSummer(START_DATE, state.timePassed));
  const current = getCurrent(seaArea);

  state.wind = wind;
  state.current = current;

  updateInterface.indicators?.({
    wind,
    current,
  });
};

export const worldTimeTick = () => {
  state.timePassed += 20;

  const playerFleet = state.fleets['1'] || state.fleets[1];
  if (playerFleet?.position) {
    seaWeather.tick(playerFleet.position.x, playerFleet.position.y);
    const sight = calculateSightRadius();
    explorationManager.revealAroundPosition(
      playerFleet.position.x,
      playerFleet.position.y,
      sight.finalRadiusTiles,
    );
  }

  if (shouldUpdateWorldStatus()) {
    updateWorldStatus();
  }

  if (getTimeOfDay() === 0) {
    state.dayAtSea += 1;
    updateInterface.dayAtSea?.(state.dayAtSea);

    processDailySurvival();
    updateProvisions();
    updateGeneral();
  }
};


/*
  While fleets under normal circumstances always have a position even when
  docked, there are two exceptions:
    - The player at the start of the game
    - NPC sailors who have respawned
 */
export const setDockedFleetPositions = () => {
  const playerFleet = state.fleets[1] || state.fleets['1'];

  if (playerFleet && !playerFleet.position) {
    const portId = state.portId || '1';
    try {
      playerFleet.position = positionAdjacentToPort(portId);
    } catch (e) {
      console.error('Failed to set adjacent port position:', e);
    }
  }
};

export const setSail = () => {
  const currentPortId = state.portId || '1';
  const playerFleet = state.fleets[1] || state.fleets['1'];

  if (autopilotManager.isActive()) {
    autopilotManager.cancelCourse('Autopilot Disengaged: Set sail on manual helm.');
  }

  // Always compute valid oceanic departure tile right outside the port
  if (playerFleet) {
    try {
      playerFleet.position = positionAdjacentToPort(currentPortId);
      if (playerFleet.position) {
        const sight = calculateSightRadius();
        explorationManager.revealAroundPosition(
          playerFleet.position.x,
          playerFleet.position.y,
          sight.finalRadiusTiles,
        );
      }
    } catch (err) {
      console.error('Error calculating adjacent sea coordinate:', err);
    }
  }

  state.portId = null;
  state.buildingId = null;
  (state as any).port = null;
  (state as any).world = null; // Forces fresh world creation at the newly computed coordinates

  updateWorldStatus();

  Input.reset();

  updateGeneral();
  updateProvisions();
};

export const triggerCombat = (
  enemyFleetName = 'Barbary Corsair Fleet',
  enemyCommodoreName = 'Khayr ad-Din Barbarossa',
) => {
  state.inCombat = true;
  state.combatEncounter = { enemyFleetName, enemyCommodoreName };
  updateInterface.combat?.(true, state.combatEncounter);
};

export const endCombat = (victory: boolean) => {
  state.inCombat = false;
  state.combatEncounter = null;
  updateInterface.combat?.(false, null);
  updateGeneral();
  if (victory) {
    updateInterface.seaAlert?.({
      id: generateId(),
      type: 'info',
      text: '⚔️ Returned to open sea victorious! Enemy fleet routed and plundered.',
      timestamp: Date.now(),
    });
  }
};

