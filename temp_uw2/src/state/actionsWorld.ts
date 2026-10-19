import state from './state';
import { getPortData, portAdjacentAt, getClosestRegularPort } from '../game/port/portUtils';
import createPort from '../game/port/port';
import npcFleetManager from '../game/world/npcFleetManager';
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
import logger from '../logger';

export const dock = (position: Position) => {
  const portId = portAdjacentAt(position);

  if (!portId) {
    logger.warn('Navigation', `Dock attempt failed: no port adjacent to position (${position.x}, ${position.y})`);
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
  logger.info('Navigation', `Docking into harbor: ${portData.name} (Port ${portId}) from (${position.x}, ${position.y})`);

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
    } catch (err: any) {
      logger.error('Navigation', `Error calculating departure tile for port ${currentPortId}: ${err?.message}`, err);
      if (!playerFleet.position) {
        playerFleet.position = { x: 840, y: 359 };
      }
    }
  }

  logger.info('Navigation', `Setting sail from port ${currentPortId}. Departure coordinates: (${playerFleet?.position?.x}, ${playerFleet?.position?.y})`);

  state.portId = null;
  state.buildingId = null;
  (state as any).port = null;
  (state as any).world = null; // Forces fresh world creation at the newly computed coordinates

  updateWorldStatus();

  Input.reset();

  updateGeneral();
  updateProvisions();
};

/**
 * Instantly docks player fleet safely into a target port (used for rescue after shipwreck/defeat)
 */
export const dockToPort = (portId: string) => {
  const portData = getPortData(portId);
  const playerFleet = state.fleets[1] || state.fleets['1'];

  if (autopilotManager.isActive()) {
    autopilotManager.cancelCourse('Autopilot Disengaged: Docked in harbor.');
  }

  if (playerFleet && portData.position) {
    playerFleet.position = { ...portData.position };
  }

  (state as any).world = null;
  state.port = createPort(portId);
  state.portId = portId;
  state.buildingId = null;

  Input.reset();
  updateGeneral();

  state.dayAtSea = 0;
  updateInterface.dayAtSea?.(state.dayAtSea);
  updateInterface.nearbyPort?.(null);
  soundManager.playSfx('bell');
};

export const triggerCombat = (
  enemyFleetName = 'Barbary Corsair Fleet',
  enemyCommodoreName = 'Khayr ad-Din Barbarossa',
  enemyFleetId?: string,
) => {
  state.inCombat = true;
  state.combatEncounter = { enemyFleetName, enemyCommodoreName, enemyFleetId };
  updateInterface.combat?.(true, state.combatEncounter);
};

export const endCombat = (
  victory: boolean,
  outcome: 'victory' | 'defeat' | 'escaped' = victory ? 'victory' : 'defeat',
) => {
  const encounter = state.combatEncounter;
  state.inCombat = false;
  state.combatEncounter = null;
  updateInterface.combat?.(false, null);

  // Set 10-second post-combat ambush immunity cooldown
  state.combatCooldownUntil = Date.now() + 10000;

  if (outcome === 'victory') {
    // 1. Victory: permanently despawn defeated enemy fleet so it never re-triggers
    npcFleetManager.despawnEncounterFleet(encounter?.enemyFleetId, encounter?.enemyFleetName);

    updateInterface.seaAlert?.({
      id: generateId(),
      type: 'info',
      text: '⚔️ Returned to open sea victorious! Enemy fleet routed and plundered.',
      timestamp: Date.now(),
    });
    updateGeneral();
  } else if (outcome === 'escaped') {
    // 2. Escaped / Disengaged: push hostile fleet back and reset to patrol
    npcFleetManager.pushAwayFleet(encounter?.enemyFleetId, 18);
    state.combatCooldownUntil = Date.now() + 15000;

    updateInterface.seaAlert?.({
      id: generateId(),
      type: 'info',
      text: '💨 Disengaged from combat! Slid away beyond the enemy’s visual horizon.',
      timestamp: Date.now(),
    });
    updateGeneral();
  } else {
    // 3. Defeat: Flagship sunk / fleet routed
    npcFleetManager.despawnEncounterFleet(encounter?.enemyFleetId, encounter?.enemyFleetName);

    if (state.gameMode === 'sp_scenario') {
      const playerFleet = state.fleets[1] || state.fleets['1'];
      const playerPos = playerFleet?.position || { x: 840, y: 358 };
      const nearest = getClosestRegularPort(playerPos);

      // Penalties: 50% gold lost, cargo lost on flagship, morale drop
      const goldLost = Math.floor(state.gold / 2);
      state.gold = Math.max(0, state.gold - goldLost);
      state.morale = Math.max(30, state.morale - 40);

      // Ensure player has a seaworthy vessel
      if (playerFleet) {
        if (!playerFleet.ships || playerFleet.ships.length === 0) {
          playerFleet.ships = [
            {
              id: '1',
              name: 'Salvaged Flagship',
              durability: 15,
              crew: 10,
              cargo: [
                { type: 'food', quantity: 10 },
                { type: 'water', quantity: 10 },
              ],
            },
          ];
        } else {
          const flagship = playerFleet.ships[0];
          flagship.durability = Math.max(15, flagship.durability);
          flagship.crew = Math.max(10, flagship.crew);
          flagship.cargo = [
            { type: 'food', quantity: 10 },
            { type: 'water', quantity: 10 },
          ];
        }
      }

      // Tow into port safely
      dockToPort(nearest.id);

      updateInterface.seaAlert?.({
        id: generateId(),
        type: 'warning',
        text: `⚓ Rescued from shipwreck! Passing fishermen towed your battered vessel to ${nearest.name}. ${goldLost > 0 ? `${goldLost} Gold and your` : 'Your'} cargo were lost to the corsairs.`,
        timestamp: Date.now(),
      });
    } else {
      // Permadeath mode
      state.isAlive = false;
      updateGeneral();
    }
  }
};

