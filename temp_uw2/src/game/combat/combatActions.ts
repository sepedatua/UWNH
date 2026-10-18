import {
  CANNON_DATA,
  CannonType,
  CapturedPrizeShip,
  CombatShip,
  CombatSpoils,
  CombatState,
  ConsortOrder,
  FleetPlan,
  FloatingDamage,
} from './combatTypes';
import {
  BATTLE_GRID_HEIGHT,
  BATTLE_GRID_WIDTH,
  BATTLE_TILE_SIZE,
  BATTLE_VIEWPORT_COLS,
  BATTLE_VIEWPORT_ROWS,
  calculateCannonballArcPosition,
  getBroadsideHexes,
  getHexWindDelta,
  hexDistance,
  HexCoord,
  hexEquals,
  staggeredBroadsideHexes,
  staggeredDistance,
  staggeredHexesInRange,
  staggeredNeighbor,
  staggeredToPixel,
} from './hexUtils';
import { checkDuelChallengeSuccess, createDuelState, getPlayerDuelEquipment } from './duelEngine';
import { generateId, random } from '../../utils';
import state from '../../state/state';
import { shipData } from '../../data/shipData';
import { getCaptain } from '../../state/selectors';
import soundManager from '../../interface/sound/soundManager';
import { updateProvisions } from '../../state/actionsWorld';

/**
 * Returns total shot ammunition units carried across player fleet cargo
 */
export const getPlayerTotalShot = (): number => {
  const playerFleet = state.fleets[1] || state.fleets['1'];
  if (!playerFleet?.ships) return 0;
  let total = 0;
  playerFleet.ships.forEach((ship) => {
    (ship.cargo || []).forEach((c) => {
      if (c && c.type === 'shot') total += c.quantity || 0;
    });
  });
  return total;
};

/**
 * Consumes 1 unit of shot ammunition when player fires broadsides.
 * Returns false if out of ammunition.
 */
export const deductPlayerShot = (amount = 1): boolean => {
  const playerFleet = state.fleets[1] || state.fleets['1'];
  if (!playerFleet?.ships?.length) return true;

  const total = getPlayerTotalShot();
  const hasAnyCargo = playerFleet.ships.some((s) => s.cargo && s.cargo.length > 0);
  if (total <= 0) {
    if (hasAnyCargo) return false;
    return true; // Fallback in unit test environments without cargo initialization
  }

  let remaining = amount;
  for (const ship of playerFleet.ships) {
    if (!ship.cargo) continue;
    for (const c of ship.cargo) {
      if (c && c.type === 'shot' && c.quantity > 0) {
        const take = Math.min(c.quantity, remaining);
        c.quantity -= take;
        remaining -= take;
        if (remaining <= 0) break;
      }
    }
    if (remaining <= 0) break;
  }

  updateProvisions();
  return true;
};

/**
 * Synchronizes battle damage and casualties back into player fleet state
 */
export const syncCombatResultsToGameState = (combatState: CombatState): void => {
  const playerFleet = state.fleets[1] || state.fleets['1'];
  if (!playerFleet?.ships) return;

  const playerCombatShips = combatState.ships.filter((s) => s.team === 'player');
  const survivingShips: typeof playerFleet.ships = [];

  playerCombatShips.forEach((cShip, idx) => {
    const existing = playerFleet.ships[idx];
    if (!existing) return;

    if (cShip.isSunk) {
      // Sunk ship is removed from the active fleet roster
      const mate = state.mates.find((m) => m.role === idx);
      if (mate) mate.role = null;
      return;
    }

    existing.durability = Math.max(1, cShip.durability);
    existing.crew = Math.max(1, cShip.crew);
    survivingShips.push(existing);
  });

  if (survivingShips.length > 0) {
    playerFleet.ships = survivingShips;
  }
};

/**
 * Initializes an authentic Koei 52x48 tactical naval engagement
 */
export const createCombatEngagement = (
  enemyFleetName = 'Barbary Corsair Fleet',
  enemyCommodoreName = 'Khayr ad-Din Barbarossa',
  enemyShipCount = 3,
): CombatState => {
  const playerFleet = state.fleets[1] || state.fleets['1'];
  const playerShips = playerFleet?.ships || [];

  const combatShips: CombatShip[] = [];

  // 1. Setup Player Fleet (West side: cols 14-18, rows 20-28)
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

    const col = idx === 0 ? 16 : 14 - Math.floor((idx - 1) / 2) * 2;
    const row = idx === 0 ? 24 : 24 + ((idx % 2 === 1 ? 1 : -1) * Math.ceil(idx / 2) * 2);

    combatShips.push({
      id: `player_ship_${idx}`,
      shipTypeId: ship.id,
      name: ship.name || sData.name,
      team: 'player',
      isFlagship: idx === 0,
      captainName: captain.name,
      battleLevel: captain.battleLevel || 8,
      swordsmanship: captain.stats?.swordsmanship || 75,
      gunnery: captain.skills?.gunnery ? 85 : 50,
      durability: ship.durability || sData.durability,
      maxDurability: sData.durability,
      crew: ship.crew || sData.usedCrew,
      maxCrew: sData.maximumCrew,
      morale: state.morale || 80,
      guns: sData.usedGuns,
      maxGuns: sData.maximumGuns,
      cannonType: (sData as any).cannonType || 'Normal',
      mobility: Math.max(3, Math.round(sData.power / 20)),
      sailType: sData.sailType,
      tacking: sData.tacking,
      power: sData.power,
      hex: { q: Math.max(2, Math.min(BATTLE_GRID_WIDTH - 3, col)), r: Math.max(2, Math.min(BATTLE_GRID_HEIGHT - 3, row)) },
      heading: 2, // Facing SE towards enemy
      movementPoints: Math.max(3, Math.round(sData.power / 20)),
      hasActed: false,
      isSunk: false,
      isSurrendered: false,
      riggingHealth: 100,
      dismountedGuns: 0,
      order: { targetShipId: null, tactic: 'auto' },
    });
  });

  // Fallback for minimalist setups
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
      hex: { q: 16, r: 24 },
      heading: 2,
      movementPoints: 5,
      hasActed: false,
      isSunk: false,
      isSurrendered: false,
      riggingHealth: 100,
      dismountedGuns: 0,
      order: { targetShipId: null, tactic: 'auto' },
    });
  }

  // 2. Setup Enemy Fleet (East side: cols 34-38, rows 20-28)
  const enemyShipTypes = ['2', '6', '19', '8']; // Hansa Cog, Nao, Galley, Brigantine
  for (let i = 0; i < enemyShipCount; i += 1) {
    const typeId = enemyShipTypes[i % enemyShipTypes.length];
    const sData = shipData[typeId] || shipData['2'];

    const col = i === 0 ? 36 : 38 + Math.floor((i - 1) / 2) * 2;
    const row = i === 0 ? 24 : 24 + ((i % 2 === 1 ? 1 : -1) * Math.ceil(i / 2) * 2);

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
      hex: { q: Math.max(2, Math.min(BATTLE_GRID_WIDTH - 3, col)), r: Math.max(2, Math.min(BATTLE_GRID_HEIGHT - 3, row)) },
      heading: 5, // Facing NW towards player
      movementPoints: Math.max(3, Math.round(sData.power / 22)),
      hasActed: false,
      isSunk: false,
      isSurrendered: false,
      riggingHealth: 100,
      dismountedGuns: 0,
    });
  }

  const pFlagship = combatShips.find((s) => s.isFlagship && s.team === 'player') || combatShips[0];

  return {
    isActive: true,
    round: 1,
    wind: {
      direction: state.wind?.direction ? Math.floor(state.wind.direction * (6 / 8)) : 1,
      speed: state.wind?.speed || 4,
    },
    ships: combatShips,
    activeShipId: pFlagship.id,
    phase: 'player_turn',
    log: [
      `Encounter! Engaging ${enemyFleetName} commanded by ${enemyCommodoreName}!`,
      'Form up tactical battle lines! Man the cannons!',
    ],
    duelState: null,
    floatingDamages: [],
    spoils: null,
    boardWidth: BATTLE_GRID_WIDTH,
    boardHeight: BATTLE_GRID_HEIGHT,
    fleetPlan: 'attack',
    viewport: {
      viewCol: Math.max(0, Math.min(BATTLE_GRID_WIDTH - BATTLE_VIEWPORT_COLS, pFlagship.hex.q - 6)),
      viewRow: Math.max(0, Math.min(BATTLE_GRID_HEIGHT - BATTLE_VIEWPORT_ROWS, pFlagship.hex.r - 5)),
    },
  };
};

/**
 * Checks if a ship can move to target hex on the staggered grid
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
    (s) => !s.isSunk && !s.isSurrendered && !s.hasFled && hexEquals(s.hex, targetHex),
  );
  if (occupied) {
    return { valid: false, mpCost: 0, reason: 'Hex is occupied by another vessel' };
  }

  // 3. Distance & MP calculation with wind factor
  const dist = staggeredDistance(ship.hex, targetHex);
  if (dist === 0) {
    return { valid: false, mpCost: 0, reason: 'Already at target hex' };
  }

  // Headwind penalty
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
  if (!ship || ship.hasActed || ship.isSunk || ship.isSurrendered) return false;

  const check = canMoveToHex(ship, targetHex, combatState);
  if (!check.valid) return false;

  // Determine new heading on the 6 headings (0: N, 1: NE, 2: SE, 3: S, 4: SW, 5: NW)
  const dq = targetHex.q - ship.hex.q;
  const dr = targetHex.r - ship.hex.r;

  if (dq === 0 && dr < 0) ship.heading = 0; // N
  else if (dq > 0 && dr <= 0) ship.heading = 1; // NE
  else if (dq > 0 && dr >= 0) ship.heading = 2; // SE
  else if (dq === 0 && dr > 0) ship.heading = 3; // S
  else if (dq < 0 && dr >= 0) ship.heading = 4; // SW
  else if (dq < 0 && dr <= 0) ship.heading = 5; // NW

  ship.hex = targetHex;
  ship.movementPoints -= check.mpCost;
  combatState.log.unshift(`${ship.name} maneuvers to (${targetHex.q}, ${targetHex.r}) [-${check.mpCost} MP].`);

  // Center viewport on active ship if it's the player flagship
  if (ship.isFlagship && ship.team === 'player') {
    combatState.viewport.viewCol = Math.max(
      0,
      Math.min(combatState.boardWidth - BATTLE_VIEWPORT_COLS, ship.hex.q - 6),
    );
    combatState.viewport.viewRow = Math.max(
      0,
      Math.min(combatState.boardHeight - BATTLE_VIEWPORT_ROWS, ship.hex.r - 5),
    );
  }

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
  if (attacker.team === target.team || target.isSunk || target.isSurrendered || target.hasFled) {
    return { canFire: false, distance: 0, arc: 'none' };
  }

  const cannonStats = CANNON_DATA[attacker.cannonType] || CANNON_DATA.Normal;
  const dist = staggeredDistance(attacker.hex, target.hex);
  if (dist > cannonStats.range || dist < 1) {
    return { canFire: false, distance: dist, arc: 'none' };
  }

  const { port, starboard } = staggeredBroadsideHexes(
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
 * Executes broadside cannon barrage against target ship with authentic ammunition consumption and subsystem damage
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

  // Check and deduct Shot ammunition if player firing
  if (attacker.team === 'player') {
    const hasAmmo = deductPlayerShot(1);
    if (!hasAmmo) {
      combatState.log.unshift(`⚠️ Out of ammunition! Cannot fire cannons without Shot!`);
      return false;
    }
  }

  soundManager.playSfx('cannon');

  // Trigger parabolic cannonball flight animation
  const fromPixel = staggeredToPixel(attacker.hex.q, attacker.hex.r);
  const toPixel = staggeredToPixel(target.hex.q, target.hex.r);
  combatState.cannonballFlight = {
    id: generateId(),
    fromHex: attacker.hex,
    toHex: target.hex,
    fromPixel,
    toPixel,
    progress: 0,
    damageText: '',
  };

  const cannonStats = CANNON_DATA[attacker.cannonType] || CANNON_DATA.Normal;
  const hitChance = cannonStats.accuracy - (distance - 1) * 10 + (attacker.gunnery * 0.2);
  const hitRoll = Math.random() * 100;

  if (hitRoll > hitChance) {
    combatState.log.unshift(`💥 ${attacker.name} fires a ${arc} broadside at ${target.name}, but cannonballs splash harmlessly!`);
    attacker.hasActed = true;
    attacker.movementPoints = 0;
    return true;
  }

  // Authentic Damage Model:
  // Base damage scales with guns, cannon power, and gunnery skill (+35% if skilled)
  const gunneryMultiplier = attacker.gunnery >= 75 ? 1.35 : 1.0;
  const baseDamage = ((attacker.guns * cannonStats.power) / 10) * gunneryMultiplier;
  const distMultiplier = distance === 1 ? 1.25 : distance === 2 ? 1.0 : distance === 3 ? 0.8 : 0.65;
  const rawHullDamage = Math.max(3, Math.round(baseDamage * distMultiplier));
  const crewLoss = Math.max(1, Math.round(target.crew * (0.05 + cannonStats.power / 600)));

  target.durability = Math.max(0, target.durability - rawHullDamage);
  target.crew = Math.max(0, target.crew - crewLoss);

  // Subsystem damage: critical mast damage or gun dismount roll
  let subsystemText = '';
  const critRoll = Math.random() * 100;
  if (critRoll < 15) {
    // Critical hit to rigging / masts
    target.riggingHealth = Math.max(20, (target.riggingHealth ?? 100) - 35);
    target.movementPoints = Math.max(1, target.movementPoints - 1);
    subsystemText = ' 💥 Rigging shattered (-1 MP)!';
  } else if (critRoll < 25 && target.guns > 0) {
    // Critical hit dismounts cannons
    target.guns = Math.max(0, target.guns - 1);
    target.dismountedGuns = (target.dismountedGuns ?? 0) + 1;
    subsystemText = ' 💥 Gun dismounted (-1 Gun)!';
  }

  combatState.floatingDamages.push({
    id: generateId(),
    hex: target.hex,
    text: `-${rawHullDamage} Hull, -${crewLoss} Crew${subsystemText}`,
    color: '#ef4444',
    createdAt: Date.now(),
  });

  combatState.log.unshift(
    `🔥 Broadside Hit! ${attacker.name} blasts ${target.name} for ${rawHullDamage} hull damage and ${crewLoss} casualties!${subsystemText}`,
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
  if (attacker.team === target.team || target.isSunk || target.isSurrendered || target.hasFled) {
    return false;
  }
  return staggeredDistance(attacker.hex, target.hex) === 1;
};

/**
 * Executes boarding melee clash or triggers 1v1 captain sword duel using authentic Koei challenge formulas
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

  soundManager.playSfx('boarding');

  // If both ships are flagships: Evaluate Authentic Koei Duel Challenge Formula!
  if (attacker.isFlagship && target.isFlagship) {
    const playerLuck = (state as any).luck ?? 50;
    const challengeSuccess = checkDuelChallengeSuccess(attacker.crew, playerLuck, target.crew);

    if (challengeSuccess) {
      combatState.duelState = createDuelState(
        attacker.captainName,
        attacker.swordsmanship,
        attacker.battleLevel,
        undefined,
        undefined,
        target.captainName,
        target.swordsmanship,
        target.battleLevel,
        34,
        22,
      );
      combatState.phase = 'duel';
      combatState.log.unshift(
        `⚔️ CHALLENGE ACCEPTED! ${attacker.captainName} cuts through the enemy ranks to duel ${target.captainName}!`,
      );
      return { duelTriggered: true };
    } else {
      combatState.log.unshift(
        `⚠️ The enemy crew forms a defensive wall and blocks your challenge to their captain! Resolving as intense deck melee!`,
      );
    }
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
 * Flagship Plan Directive (全体方針)
 */
export const setFleetPlan = (plan: FleetPlan, combatState: CombatState): void => {
  combatState.fleetPlan = plan;
  const planTitles: Record<FleetPlan, string> = {
    attack: 'All ships: Aggressive Attack & Chase!',
    defend_flagship: 'All ships: Screen and Defend the Flagship!',
    flee: 'All ships: Disengage and Escape the Battle Arena!',
  };
  combatState.log.unshift(`🚩 Flagship Signal: "${planTitles[plan]}"`);
};

/**
 * Flagship Consort Order (個別指示)
 */
export const setConsortOrder = (
  consortId: string,
  order: ConsortOrder,
  combatState: CombatState,
): void => {
  const consort = combatState.ships.find((s) => s.id === consortId);
  if (!consort) return;

  consort.order = order;
  const target = combatState.ships.find((s) => s.id === order.targetShipId);
  const targetName = target ? target.name : 'nearest enemy';
  combatState.log.unshift(`🚩 Order dispatched to ${consort.name}: [${order.tactic.toUpperCase()}] targeting ${targetName}.`);
};

/**
 * Autonomous AI execution for player-owned consort vessels (ships 2-10)
 */
export const executeConsortAITurn = (
  consort: CombatShip,
  combatState: CombatState,
): void => {
  if (consort.hasActed || consort.isSunk || consort.isSurrendered || consort.hasFled) return;

  const enemyShips = combatState.ships.filter((s) => s.team === 'enemy' && !s.isSunk && !s.isSurrendered && !s.hasFled);
  if (!enemyShips.length) {
    consort.hasActed = true;
    return;
  }

  // 1. If ordered to flee or fleet plan is flee: steer towards perimeter
  if (combatState.fleetPlan === 'flee' || consort.order?.tactic === 'escape') {
    if (consort.hex.q <= 1 || consort.hex.q >= combatState.boardWidth - 2 || consort.hex.r <= 1 || consort.hex.r >= combatState.boardHeight - 2) {
      fleeShip(consort.id, combatState);
      return;
    }
    // Step towards closest border
    const stepQ = consort.hex.q < combatState.boardWidth / 2 ? -1 : 1;
    const nextHex = { q: consort.hex.q + stepQ, r: consort.hex.r };
    if (canMoveToHex(consort, nextHex, combatState).valid) {
      moveShip(consort.id, nextHex, combatState);
    }
    consort.hasActed = true;
    return;
  }

  // 2. Select target based on assigned order or closest enemy
  let target = enemyShips.find((e) => e.id === consort.order?.targetShipId) || enemyShips[0];
  let minD = 999;
  enemyShips.forEach((e) => {
    const d = staggeredDistance(consort.hex, e.hex);
    if (d < minD) {
      minD = d;
      if (!consort.order?.targetShipId) target = e;
    }
  });

  // 3. Check boarding
  if (canBoardShip(consort, target)) {
    boardShip(consort.id, target.id, combatState);
    return;
  }

  // 4. Check firing broadside
  const fireCheck = canFireCannonsAt(consort, target);
  if (fireCheck.canFire) {
    fireBroadside(consort.id, target.id, combatState);
    return;
  }

  // 5. Maneuver towards target
  if (consort.movementPoints > 0) {
    const stepQ = target.hex.q > consort.hex.q ? 1 : target.hex.q < consort.hex.q ? -1 : 0;
    const stepR = target.hex.r > consort.hex.r ? 1 : target.hex.r < consort.hex.r ? -1 : 0;
    const nextHex = { q: consort.hex.q + stepQ, r: consort.hex.r + stepR };

    if (canMoveToHex(consort, nextHex, combatState).valid) {
      moveShip(consort.id, nextHex, combatState);
    }

    if (canFireCannonsAt(consort, target).canFire) {
      fireBroadside(consort.id, target.id, combatState);
      return;
    }
  }

  consort.hasActed = true;
};

/**
 * Intelligent AI behavior for enemy fleet
 */
export const executeEnemyAITurn = (combatState: CombatState): void => {
  combatState.phase = 'enemy_turn';
  const enemyShips = combatState.ships.filter(
    (s) => s.team === 'enemy' && !s.isSunk && !s.isSurrendered && !s.hasFled,
  );
  const playerShips = combatState.ships.filter(
    (s) => s.team === 'player' && !s.isSunk && !s.isSurrendered && !s.hasFled,
  );

  if (!playerShips.length) return;

  enemyShips.forEach((enemy) => {
    // 1. Find nearest player target (prioritizing player flagship)
    let target = playerShips.find((p) => p.isFlagship) || playerShips[0];
    let minDistance = 999;
    playerShips.forEach((p) => {
      const d = staggeredDistance(enemy.hex, p.hex);
      if (d < minDistance) {
        minDistance = d;
        target = p;
      }
    });

    // 2. Check boarding
    if (canBoardShip(enemy, target)) {
      boardShip(enemy.id, target.id, combatState);
      return;
    }

    // 3. Check broadside
    const fireCheck = canFireCannonsAt(enemy, target);
    if (fireCheck.canFire) {
      fireBroadside(enemy.id, target.id, combatState);
      return;
    }

    // 4. Move towards target
    if (enemy.movementPoints > 0) {
      const stepQ = target.hex.q > enemy.hex.q ? 1 : target.hex.q < enemy.hex.q ? -1 : 0;
      const stepR = target.hex.r > enemy.hex.r ? 1 : target.hex.r < enemy.hex.r ? -1 : 0;
      const nextHex = { q: enemy.hex.q + stepQ, r: enemy.hex.r + stepR };

      if (canMoveToHex(enemy, nextHex, combatState).valid) {
        moveShip(enemy.id, nextHex, combatState);
      }

      if (canFireCannonsAt(enemy, target).canFire) {
        fireBroadside(enemy.id, target.id, combatState);
      }
    }
  });

  // End of Round: Reset MP and restore actions
  combatState.round += 1;
  combatState.ships.forEach((s) => {
    s.hasActed = false;
    // Account for rigging damage
    const riggingPenalty = (s.riggingHealth ?? 100) < 60 ? 1 : 0;
    s.movementPoints = Math.max(1, s.mobility - riggingPenalty);
  });

  // Center on player flagship
  const playerFlagship = combatState.ships.find((s) => s.team === 'player' && s.isFlagship && !s.isSunk);
  if (playerFlagship) {
    combatState.activeShipId = playerFlagship.id;
    combatState.viewport.viewCol = Math.max(
      0,
      Math.min(combatState.boardWidth - BATTLE_VIEWPORT_COLS, playerFlagship.hex.q - 6),
    );
    combatState.viewport.viewRow = Math.max(
      0,
      Math.min(combatState.boardHeight - BATTLE_VIEWPORT_ROWS, playerFlagship.hex.r - 5),
    );
  }

  combatState.phase = 'player_turn';
  combatState.log.unshift(`--- Round ${combatState.round} Begins ---`);
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
    (s) => s.team === 'player' && !s.isSunk && !s.isSurrendered && !s.hasFled && !s.hasActed,
  );

  if (nextPlayerShip) {
    combatState.activeShipId = nextPlayerShip.id;
    // If not flagship and has an order/plan, can execute autonomous turn
    if (!nextPlayerShip.isFlagship && combatState.fleetPlan !== 'attack') {
      executeConsortAITurn(nextPlayerShip, combatState);
    }
    return;
  }

  // All player ships have acted: Execute Enemy AI Turn!
  executeEnemyAITurn(combatState);
};

/**
 * Evaluates victory and defeat conditions, transitioning into Prize Capture Screen
 */
export const checkCombatEnd = (combatState: CombatState): void => {
  const playerShipsAlive = combatState.ships.filter(
    (s) => s.team === 'player' && !s.isSunk && !s.isSurrendered && !s.hasFled,
  );
  const enemyShipsAlive = combatState.ships.filter(
    (s) => s.team === 'enemy' && !s.isSunk && !s.isSurrendered && !s.hasFled,
  );

  const playerFlagshipAlive = playerShipsAlive.some((s) => s.isFlagship);
  const enemyFlagshipAlive = enemyShipsAlive.some((s) => s.isFlagship);

  if (!enemyShipsAlive.length || !enemyFlagshipAlive) {
    // VICTORY! Enter Prize Capture Phase with authentic BGM
    soundManager.setBattlePhase('prize');
    combatState.phase = 'prize_capture';

    const goldPlunder = random(4000, 10000);
    const fameGain = 300;

    // Identify captured enemy ships (surrendered or unsunk vessels)
    const prizeShips: CapturedPrizeShip[] = combatState.ships
      .filter((s) => s.team === 'enemy' && !s.isSunk && !s.hasFled)
      .map((s) => ({
        id: s.id,
        shipTypeId: s.shipTypeId,
        name: s.name,
        durability: Math.max(5, s.durability),
        maxDurability: s.maxDurability,
        guns: s.guns,
        survivingCrew: Math.max(5, Math.round(s.crew * 0.6)),
        cargo: [
          { type: 'Silver', quantity: random(10, 25) },
          { type: 'food', quantity: random(15, 35) },
          { type: 'water', quantity: random(15, 35) },
          { type: 'shot', quantity: random(10, 20) },
        ],
        assignedMateId: null,
        isScuttled: false,
      }));

    combatState.spoils = {
      gold: goldPlunder,
      fame: fameGain,
      commodities: [
        { type: 'Silver', quantity: 25 },
        { type: 'Spices', quantity: 15 },
      ],
      capturedShipName: prizeShips[0]?.name || 'Corsair War Galley',
      capturedPrizeShips: prizeShips,
    };

    combatState.log.unshift(
      `🏆 DECISIVE VICTORY! The enemy fleet has surrendered! Inspect prize vessels and claim spoils!`,
    );
    return;
  }

  if (!playerShipsAlive.length || !playerFlagshipAlive) {
    // DEFEAT!
    soundManager.setBattlePhase('defeat');
    combatState.phase = 'defeat';
    if (state.gameMode !== 'sp_scenario') {
      state.isAlive = false;
    }
    combatState.log.unshift('☠️ DEFEAT! Flagship destroyed! The fleet has been routed!');
  }
};

/**
 * Allows a ship to flee the combat arena if at the battlefield perimeter (within 2 tiles of any edge)
 */
export const fleeShip = (shipId: string, combatState: CombatState): boolean => {
  const ship = combatState.ships.find((s) => s.id === shipId);
  if (!ship || ship.hasActed || ship.isSunk) return false;

  const atPerimeter =
    ship.hex.q <= 2 ||
    ship.hex.q >= combatState.boardWidth - 3 ||
    ship.hex.r <= 2 ||
    ship.hex.r >= combatState.boardHeight - 3;

  if (!atPerimeter) {
    combatState.log.unshift(`⚠️ ${ship.name} cannot flee! Must reach the outer battlefield border first!`);
    return false;
  }

  ship.hasFled = true;
  ship.hasActed = true;
  ship.movementPoints = 0;
  combatState.log.unshift(`💨 ${ship.name} has disengaged and escaped beyond the horizon!`);

  checkCombatEnd(combatState);
  return true;
};

/**
 * Commissions a captured prize ship into player fleet under command of an available mate
 */
export const commissionPrizeShip = (
  prizeId: string,
  mateSailorId: string,
  combatState: CombatState,
): boolean => {
  const playerFleet = state.fleets[1] || state.fleets['1'];
  if (!playerFleet || playerFleet.ships.length >= 10) return false;

  const prize = combatState.spoils?.capturedPrizeShips?.find((p) => p.id === prizeId);
  if (!prize || prize.isScuttled || prize.assignedMateId) return false;

  const mate = state.mates.find((m) => m.sailorId === mateSailorId);
  if (!mate || mate.role !== null) return false;

  const newIndex = playerFleet.ships.length;
  playerFleet.ships.push({
    id: prize.shipTypeId,
    name: prize.name,
    crew: prize.survivingCrew,
    durability: prize.durability,
    cargo: [...prize.cargo],
  });

  mate.role = newIndex;
  prize.assignedMateId = mateSailorId;

  soundManager.playSfx('fanfare');
  combatState.log.unshift(`🚩 Commissioned ${prize.name}! Assigned Mate ${mate.sailorId} as captain.`);
  return true;
};

/**
 * Scuttles a captured prize vessel after salvaging all supplies and recruiting crew
 */
export const scuttlePrizeShip = (
  prizeId: string,
  combatState: CombatState,
): boolean => {
  const prize = combatState.spoils?.capturedPrizeShips?.find((p) => p.id === prizeId);
  if (!prize || prize.isScuttled || prize.assignedMateId) return false;

  prize.isScuttled = true;
  const playerFleet = state.fleets[1] || state.fleets['1'];
  const flagship = playerFleet?.ships[0];

  if (flagship) {
    flagship.crew = Math.min(flagship.crew + prize.survivingCrew, 300);
    prize.cargo.forEach((item) => {
      flagship.cargo = flagship.cargo || [];
      const match = flagship.cargo.find((c) => c.type === item.type);
      if (match) match.quantity += item.quantity;
      else flagship.cargo.push({ ...item });
    });
  }

  updateProvisions();
  soundManager.playSfx('coin');
  combatState.log.unshift(
    `⚓ Scuttled ${prize.name} after looting all provisions and recruiting ${prize.survivingCrew} crew.`,
  );
  return true;
};

/**
 * Finalizes spoils, writes back persistent damage, and cleanly concludes naval combat
 */
export const finalizeCombatResults = (
  victory: boolean,
  combatState: CombatState,
): void => {
  if (victory && combatState.spoils) {
    state.gold += combatState.spoils.gold;
    state.fame.piracy += combatState.spoils.fame;
    state.morale = 100;

    // Transfer spoils commodities to hold
    const playerFleet = state.fleets[1] || state.fleets['1'];
    const flagship = playerFleet?.ships[0];
    if (flagship) {
      combatState.spoils.commodities.forEach((com) => {
        flagship.cargo = flagship.cargo || [];
        const match = flagship.cargo.find((c) => c.type === com.type);
        if (match) match.quantity += com.quantity;
        else flagship.cargo.push({ ...com });
      });
    }
  }

  // Two-way persistence writeback
  syncCombatResultsToGameState(combatState);
  soundManager.setBattlePhase(null);
};
