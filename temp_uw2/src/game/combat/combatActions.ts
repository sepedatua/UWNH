import {
  CANNON_DATA,
  CannonType,
  CombatShip,
  CombatSpoils,
  CombatState,
  FloatingDamage,
} from './combatTypes';
import {
  getBroadsideHexes,
  getHexWindDelta,
  hexDistance,
  HexCoord,
  hexEquals,
} from './hexUtils';
import { createDuelState } from './duelEngine';
import { generateId, random } from '../../utils';
import state from '../../state/state';
import { shipData } from '../../data/shipData';
import { getCaptain } from '../../state/selectors';
import soundManager from '../../interface/sound/soundManager';

/**
 * Initializes a full tactical naval engagement
 */
export const createCombatEngagement = (
  enemyFleetName = 'Barbary Corsair Fleet',
  enemyCommodoreName = 'Khayr ad-Din Barbarossa',
  enemyShipCount = 3,
): CombatState => {
  const playerFleet = state.fleets[1] || state.fleets['1'];
  const playerShips = playerFleet?.ships || [];

  const combatShips: CombatShip[] = [];

  // 1. Setup Player Ships (Left side of tactical hex board)
  playerShips.forEach((ship, idx) => {
    const sData = shipData[ship.id] || shipData['1'];
    let captain;
    try {
      captain = getCaptain(idx);
    } catch {
      captain = {
        name: idx === 0 ? state.protagonistName || 'João Franco' : `Officer ${idx}`,
        battleLevel: 8,
        stats: { swordsmanship: 75 },
        skills: { gunnery: true },
      };
    }

    combatShips.push({
      id: `player_ship_${idx}`,
      shipTypeId: ship.id,
      name: ship.name || sData.name,
      team: 'player',
      isFlagship: idx === 0,
      captainName: captain.name,
      battleLevel: captain.battleLevel || 5,
      swordsmanship: captain.stats?.swordsmanship || 70,
      gunnery: captain.skills?.gunnery ? 85 : 50,
      durability: ship.durability || sData.durability,
      maxDurability: sData.durability,
      crew: ship.crew || sData.usedCrew,
      maxCrew: sData.maximumCrew,
      morale: state.morale || 80,
      guns: sData.usedGuns,
      maxGuns: sData.maximumGuns,
      cannonType: 'Normal',
      mobility: Math.max(3, Math.round(sData.power / 20)),
      sailType: sData.sailType,
      tacking: sData.tacking,
      power: sData.power,
      hex: { q: 1 + Math.floor(idx / 3), r: 2 + (idx % 3) * 2 },
      heading: 1, // Facing East (toward enemy)
      movementPoints: Math.max(3, Math.round(sData.power / 20)),
      hasActed: false,
      isSunk: false,
      isSurrendered: false,
    });
  });

  // Fallback if player had no ships configured
  if (!combatShips.length) {
    const sData = shipData['1'];
    combatShips.push({
      id: 'player_ship_0',
      shipTypeId: '1',
      name: 'Flagship São Gabriel',
      team: 'player',
      isFlagship: true,
      captainName: state.protagonistName || 'João Franco',
      battleLevel: 10,
      swordsmanship: 80,
      gunnery: 75,
      durability: 35,
      maxDurability: 35,
      crew: 25,
      maxCrew: 30,
      morale: state.morale || 80,
      guns: 10,
      maxGuns: 10,
      cannonType: 'Normal',
      mobility: 5,
      sailType: 1,
      tacking: 70,
      power: 80,
      hex: { q: 1, r: 3 },
      heading: 1,
      movementPoints: 5,
      hasActed: false,
      isSunk: false,
      isSurrendered: false,
    });
  }

  // 2. Setup Enemy Ships (Right side of tactical hex board)
  const enemyShipTypes = ['2', '6', '19', '8']; // Hansa Cog, Nao, Galley, Brigantine
  for (let i = 0; i < enemyShipCount; i += 1) {
    const typeId = enemyShipTypes[i % enemyShipTypes.length];
    const sData = shipData[typeId] || shipData['2'];

    combatShips.push({
      id: `enemy_ship_${i}`,
      shipTypeId: typeId,
      name: i === 0 ? `${enemyFleetName} Flagship` : `Corsair Raider ${i}`,
      team: 'enemy',
      isFlagship: i === 0,
      captainName: i === 0 ? enemyCommodoreName : `Corsair Lieutenant ${i}`,
      battleLevel: i === 0 ? 12 : 7,
      swordsmanship: i === 0 ? 82 : 65,
      gunnery: i === 0 ? 70 : 55,
      durability: sData.durability,
      maxDurability: sData.durability,
      crew: sData.usedCrew,
      maxCrew: sData.maximumCrew,
      morale: 85,
      guns: sData.usedGuns,
      maxGuns: sData.maximumGuns,
      cannonType: i === 0 ? 'Culverin' : 'Normal',
      mobility: Math.max(3, Math.round(sData.power / 22)),
      sailType: sData.sailType,
      tacking: sData.tacking,
      power: sData.power,
      hex: { q: 8 - Math.floor(i / 2), r: 2 + (i % 2) * 3 },
      heading: 4, // Facing West (toward player)
      movementPoints: Math.max(3, Math.round(sData.power / 22)),
      hasActed: false,
      isSunk: false,
      isSurrendered: false,
    });
  }

  return {
    isActive: true,
    round: 1,
    wind: {
      direction: state.wind?.direction ? Math.floor(state.wind.direction * (6 / 8)) : 1,
      speed: state.wind?.speed || 4,
    },
    ships: combatShips,
    activeShipId: combatShips.find((s) => s.team === 'player')?.id || null,
    phase: 'player_turn',
    log: [
      `Encounter! Engaging ${enemyFleetName} commanded by ${enemyCommodoreName}!`,
      'Form up tactical battle lines! Man the cannons!',
    ],
    duelState: null,
    floatingDamages: [],
    spoils: null,
    boardWidth: 10,
    boardHeight: 8,
  };
};

/**
 * Checks if a ship can move to a target hex
 */
export const canMoveToHex = (
  ship: CombatShip,
  targetHex: HexCoord,
  combatState: CombatState,
): { valid: boolean; mpCost: number; reason?: string } => {
  // 1. Boundary check
  if (
    targetHex.q < 0 ||
    targetHex.q >= combatState.boardWidth ||
    targetHex.r < 0 ||
    targetHex.r >= combatState.boardHeight
  ) {
    return { valid: false, mpCost: 0, reason: 'Beyond battle area boundaries' };
  }

  // 2. Obstacle / Ship Collision check
  const occupied = combatState.ships.some(
    (s) => !s.isSunk && !s.isSurrendered && hexEquals(s.hex, targetHex),
  );
  if (occupied) {
    return { valid: false, mpCost: 0, reason: 'Hex is occupied by another vessel' };
  }

  // 3. Distance & MP calculation with wind factor
  const dist = hexDistance(ship.hex, targetHex);
  if (dist === 0) {
    return { valid: false, mpCost: 0, reason: 'Already at target hex' };
  }

  // Moving into headwind costs extra MP
  const windDelta = getHexWindDelta(ship.heading, combatState.wind.direction);
  const headwindPenalty = windDelta >= 2 && ship.sailType === 1 ? 1 : 0;
  const mpCost = dist + headwindPenalty;

  if (ship.movementPoints < mpCost) {
    return { valid: false, mpCost, reason: `Not enough MP (Requires ${mpCost}, have ${ship.movementPoints})` };
  }

  return { valid: true, mpCost };
};

/**
 * Moves a ship to target hex and updates its facing
 */
export const moveShip = (
  shipId: string,
  targetHex: HexCoord,
  combatState: CombatState,
): boolean => {
  const ship = combatState.ships.find((s) => s.id === shipId);
  if (!ship || ship.hasActed || ship.isSunk) return false;

  const check = canMoveToHex(ship, targetHex, combatState);
  if (!check.valid) return false;

  // Determine new heading based on movement vector
  const dq = targetHex.q - ship.hex.q;
  const dr = targetHex.r - ship.hex.r;
  if (dq > 0 && dr <= 0) ship.heading = 0; // NE
  else if (dq > 0 && dr >= 0) ship.heading = 1; // E
  else if (dq === 0 && dr > 0) ship.heading = 2; // SE
  else if (dq < 0 && dr > 0) ship.heading = 3; // SW
  else if (dq < 0 && dr <= 0) ship.heading = 4; // W
  else if (dq === 0 && dr < 0) ship.heading = 5; // NW

  ship.hex = targetHex;
  ship.movementPoints -= check.mpCost;
  combatState.log.unshift(`${ship.name} maneuvers to (${targetHex.q}, ${targetHex.r}) [-${check.mpCost} MP].`);
  return true;
};

/**
 * Rotates a ship in place (60 degrees)
 */
export const rotateShip = (
  shipId: string,
  clockwise: boolean,
  combatState: CombatState,
): boolean => {
  const ship = combatState.ships.find((s) => s.id === shipId);
  if (!ship || ship.movementPoints < 1) return false;

  ship.heading = clockwise
    ? (ship.heading + 1) % 6
    : (ship.heading + 5) % 6;
  ship.movementPoints -= 1;
  combatState.log.unshift(`${ship.name} turns ship heading [-1 MP].`);
  return true;
};

/**
 * Checks if a target ship is within broadside cannon firing arc
 */
export const canFireCannonsAt = (
  attacker: CombatShip,
  target: CombatShip,
): { canFire: boolean; distance: number; arc: 'port' | 'starboard' | 'none' } => {
  if (attacker.team === target.team || target.isSunk || target.isSurrendered) {
    return { canFire: false, distance: 0, arc: 'none' };
  }

  const cannonStats = CANNON_DATA[attacker.cannonType];
  const dist = hexDistance(attacker.hex, target.hex);
  if (dist > cannonStats.range || dist < 1) {
    return { canFire: false, distance: dist, arc: 'none' };
  }

  const { port, starboard } = getBroadsideHexes(
    attacker.hex,
    attacker.heading,
    cannonStats.range,
  );

  const inPort = port.some((h) => hexEquals(h, target.hex));
  if (inPort) return { canFire: true, distance: dist, arc: 'port' };

  const inStarboard = starboard.some((h) => hexEquals(h, target.hex));
  if (inStarboard) return { canFire: true, distance: dist, arc: 'starboard' };

  return { canFire: false, distance: dist, arc: 'none' };
};

/**
 * Executes broadside cannon barrage against target ship
 */
export const fireBroadside = (
  attackerId: string,
  targetId: string,
  combatState: CombatState,
): boolean => {
  const attacker = combatState.ships.find((s) => s.id === attackerId);
  const target = combatState.ships.find((s) => s.id === targetId);
  if (!attacker || !target || attacker.hasActed || attacker.isSunk) return false;

  const { canFire, distance, arc } = canFireCannonsAt(attacker, target);
  if (!canFire) return false;

  soundManager.playSfx('cannon');

  const cannonStats = CANNON_DATA[attacker.cannonType];
  const hitChance = cannonStats.accuracy - (distance - 1) * 12 + (attacker.gunnery * 0.2);
  const hitRoll = Math.random() * 100;

  if (hitRoll > hitChance) {
    combatState.log.unshift(`💥 ${attacker.name} fires a ${arc} broadside at ${target.name}, but cannonballs splash harmlessly!`);
    attacker.hasActed = true;
    attacker.movementPoints = 0;
    return true;
  }

  // Damage Calculation
  const baseDamage = (attacker.guns * cannonStats.power * (1 + attacker.gunnery / 100)) / 12;
  const distMultiplier = distance === 1 ? 1.3 : distance === 2 ? 1.0 : 0.75;
  const rawHullDamage = Math.max(3, Math.round(baseDamage * distMultiplier));
  const crewLoss = Math.max(1, Math.round(target.crew * (0.04 + (cannonStats.power / 500))));

  target.durability = Math.max(0, target.durability - rawHullDamage);
  target.crew = Math.max(0, target.crew - crewLoss);

  combatState.floatingDamages.push({
    id: generateId(),
    hex: target.hex,
    text: `-${rawHullDamage} Hull, -${crewLoss} Crew`,
    color: '#ef4444',
    createdAt: Date.now(),
  });

  combatState.log.unshift(
    `🔥 Broadside Hit! ${attacker.name} blasts ${target.name} for ${rawHullDamage} hull damage and ${crewLoss} casualties!`,
  );

  if (target.durability <= 0) {
    target.isSunk = true;
    combatState.log.unshift(`⚓ Sunk! The ${target.name} succumbs to catastrophic hull breach and slips beneath the waves!`);
  }

  attacker.hasActed = true;
  attacker.movementPoints = 0;
  checkCombatEnd(combatState);
  return true;
};

/**
 * Checks if boarding melee action is valid (adjacent hex)
 */
export const canBoardShip = (
  attacker: CombatShip,
  target: CombatShip,
): boolean => {
  if (attacker.team === target.team || target.isSunk || target.isSurrendered) {
    return false;
  }
  return hexDistance(attacker.hex, target.hex) === 1;
};

/**
 * Executes boarding melee clash or triggers 1v1 captain sword duel
 */
export const boardShip = (
  attackerId: string,
  targetId: string,
  combatState: CombatState,
): { duelTriggered: boolean } => {
  const attacker = combatState.ships.find((s) => s.id === attackerId);
  const target = combatState.ships.find((s) => s.id === targetId);
  if (!attacker || !target || attacker.hasActed) {
    return { duelTriggered: false };
  }

  if (!canBoardShip(attacker, target)) {
    return { duelTriggered: false };
  }

  // If both ships are flagships: Trigger 1v1 Sword Duel Invitation!
  if (attacker.isFlagship && target.isFlagship) {
    combatState.duelState = createDuelState(
      attacker.captainName,
      attacker.swordsmanship,
      attacker.battleLevel,
      35,
      20,
      target.captainName,
      target.swordsmanship,
      target.battleLevel,
      32,
      18,
    );
    combatState.phase = 'duel';
    combatState.log.unshift(`⚔️ FLAGSHIP BOARDING! ${attacker.captainName} and ${target.captainName} lock blades in a 1v1 Captain Duel!`);
    return { duelTriggered: true };
  }

  // Melee Crew Clash
  const attackerProwess = attacker.crew * (attacker.battleLevel + 10) * (attacker.morale / 100);
  const targetProwess = target.crew * (target.battleLevel + 10) * (target.morale / 100);

  const targetLoss = Math.max(2, Math.round((attackerProwess / 40) + random(1, 4)));
  const attackerLoss = Math.max(1, Math.round((targetProwess / 55) + random(0, 2)));

  target.crew = Math.max(0, target.crew - targetLoss);
  attacker.crew = Math.max(0, attacker.crew - attackerLoss);

  combatState.log.unshift(
    `⚔️ Boarding Melee! ${attacker.name} clashes with ${target.name}! Inflicted ${targetLoss} casualties (lost ${attackerLoss} sailors).`,
  );

  if (target.crew <= 0) {
    target.isSurrendered = true;
    combatState.log.unshift(`🏳️ Captured! ${target.name}'s crew has been overwhelmed and surrendered!`);
  }

  attacker.hasActed = true;
  attacker.movementPoints = 0;
  checkCombatEnd(combatState);
  return { duelTriggered: false };
};

/**
 * Evaluates victory and defeat conditions
 */
export const checkCombatEnd = (combatState: CombatState): void => {
  const playerShipsAlive = combatState.ships.filter(
    (s) => s.team === 'player' && !s.isSunk && !s.isSurrendered,
  );
  const enemyShipsAlive = combatState.ships.filter(
    (s) => s.team === 'enemy' && !s.isSunk && !s.isSurrendered,
  );

  const playerFlagshipAlive = playerShipsAlive.some((s) => s.isFlagship);
  const enemyFlagshipAlive = enemyShipsAlive.some((s) => s.isFlagship);

  if (!enemyShipsAlive.length || !enemyFlagshipAlive) {
    // VICTORY!
    combatState.phase = 'victory';
    const goldPlunder = random(3500, 8500);
    const fameGain = 250;
    combatState.spoils = {
      gold: goldPlunder,
      fame: fameGain,
      commodities: [
        { type: 'Silver', quantity: 20 },
        { type: 'Spices', quantity: 15 },
      ],
      capturedShipName: 'Corsair War Galley',
    };

    // Apply spoils to game state
    state.gold += goldPlunder;
    state.fame.piracy += fameGain;
    state.morale = 100; // Victorious crew morale maxed

    combatState.log.unshift(`🏆 DECISIVE VICTORY! Plundered ${goldPlunder} Gold and gained +${fameGain} Battle Fame!`);
    return;
  }

  if (!playerShipsAlive.length || !playerFlagshipAlive) {
    // DEFEAT!
    combatState.phase = 'defeat';
    if (state.gameMode !== 'sp_scenario') {
      state.isAlive = false; // Permadeath triggered
    }
    combatState.log.unshift('☠️ DEFEAT! Flagship destroyed! The fleet has been routed!');
  }
};

/**
 * Concludes active ship's turn and advances turn queue
 */
export const endActiveShipTurn = (combatState: CombatState): void => {
  const currentShip = combatState.ships.find((s) => s.id === combatState.activeShipId);
  if (currentShip) {
    currentShip.hasActed = true;
    currentShip.movementPoints = 0;
  }

  // Find next player ship that hasn't acted
  const nextPlayerShip = combatState.ships.find(
    (s) => s.team === 'player' && !s.isSunk && !s.isSurrendered && !s.hasActed,
  );

  if (nextPlayerShip) {
    combatState.activeShipId = nextPlayerShip.id;
    return;
  }

  // All player ships have acted: Execute Enemy AI Turn!
  executeEnemyAITurn(combatState);
};

/**
 * Intelligent AI behavior for enemy fleet
 */
export const executeEnemyAITurn = (combatState: CombatState): void => {
  combatState.phase = 'enemy_turn';
  const enemyShips = combatState.ships.filter(
    (s) => s.team === 'enemy' && !s.isSunk && !s.isSurrendered,
  );
  const playerShips = combatState.ships.filter(
    (s) => s.team === 'player' && !s.isSunk && !s.isSurrendered,
  );

  if (!playerShips.length) return;

  enemyShips.forEach((enemy) => {
    // 1. Find nearest player target
    let nearestPlayer = playerShips[0];
    let minDistance = 999;
    playerShips.forEach((p) => {
      const d = hexDistance(enemy.hex, p.hex);
      if (d < minDistance) {
        minDistance = d;
        nearestPlayer = p;
      }
    });

    // 2. Check if can board
    if (canBoardShip(enemy, nearestPlayer)) {
      boardShip(enemy.id, nearestPlayer.id, combatState);
      return;
    }

    // 3. Check if can fire broadside
    const fireCheck = canFireCannonsAt(enemy, nearestPlayer);
    if (fireCheck.canFire) {
      fireBroadside(enemy.id, nearestPlayer.id, combatState);
      return;
    }

    // 4. Move towards nearest player ship
    if (enemy.movementPoints > 0) {
      const stepQ = nearestPlayer.hex.q > enemy.hex.q ? 1 : nearestPlayer.hex.q < enemy.hex.q ? -1 : 0;
      const stepR = nearestPlayer.hex.r > enemy.hex.r ? 1 : nearestPlayer.hex.r < enemy.hex.r ? -1 : 0;
      const nextHex = { q: enemy.hex.q + stepQ, r: enemy.hex.r + stepR };

      if (canMoveToHex(enemy, nextHex, combatState).valid) {
        moveShip(enemy.id, nextHex, combatState);
      }

      // Check broadside after movement
      if (canFireCannonsAt(enemy, nearestPlayer).canFire) {
        fireBroadside(enemy.id, nearestPlayer.id, combatState);
      }
    }
  });

  // End of Round: Reset MP and restore actions
  combatState.round += 1;
  combatState.ships.forEach((s) => {
    s.hasActed = false;
    s.movementPoints = s.mobility;
  });

  // Pick first alive player ship
  const firstPlayerShip = combatState.ships.find(
    (s) => s.team === 'player' && !s.isSunk && !s.isSurrendered,
  );
  combatState.activeShipId = firstPlayerShip ? firstPlayerShip.id : null;
  combatState.phase = 'player_turn';
  combatState.log.unshift(`--- Round ${combatState.round} Begins ---`);
};
