import Assets from '../../assets';
import { WORLD_MAP_COLUMNS, WORLD_MAP_ROWS } from '../../constants';
import { portAdjacentAt } from '../port/portUtils';
import state from '../../state/state';
import { getPlayerFleet, getAvailableSpace } from '../../state/selectorsFleet';
import { shipData } from '../../data/shipData';
import { processDailySurvival } from './voyageSurvival';
import updateInterface from '../../state/updateInterface';
import { updateProvisions } from '../../state/actionsWorld';

export const FIELD_REPAIR_CEILING_RATIO = 0.8; // 80% field repair ceiling
export const DURABILITY_PER_LUMBER = 5;        // 1 Lumber restores 5 durability points
export const DEPLETION_RADIUS_TILES = 4.0;     // 4-tile radius for one-time shore gathering
export const EXPEDITION_HOURS = 6;             // 6 hours elapsed time per shore expedition

export interface CoastStatus {
  isNearCoast: boolean;
  isPort: boolean;
  isDepleted: boolean;
  canForage: boolean;
  canRepair: boolean;
  reason?: string;
}

export interface ExpeditionRawResult {
  waterFound: number;
  foodFound: number;
  lumberFound: number;
  crewCount: number;
  hoursElapsed: number;
  eventDescription: string;
}

export interface ShipShoreRepairInfo {
  shipIndex: number;
  name: string;
  currentDurability: number;
  maxDurability: number;
  fieldCeiling: number;
  repairableDamage: number;
  lumberCost: number;
}

export interface ShoreRepairStatus {
  totalCargoLumber: number;
  totalRepairableDamage: number;
  totalLumberNeeded: number;
  ships: ShipShoreRepairInfo[];
}

/**
 * Read tile index at given coordinate with X cylindrical wrapping
 */
export const getTileAt = (x: number, y: number): number => {
  try {
    const tilemap = Assets.data('worldTilemap');
    if (!tilemap || tilemap.length < WORLD_MAP_COLUMNS * WORLD_MAP_ROWS) {
      return 0;
    }
    const wrappedX = ((Math.floor(x) % WORLD_MAP_COLUMNS) + WORLD_MAP_COLUMNS) % WORLD_MAP_COLUMNS;
    const clampedY = Math.max(0, Math.min(WORLD_MAP_ROWS - 1, Math.floor(y)));
    return tilemap[clampedY * WORLD_MAP_COLUMNS + wrappedX];
  } catch {
    return 0;
  }
};

/**
 * Checks if current coordinate is immediately adjacent to non-port land
 */
export const isNearCoastline = (pos: { x: number; y: number }): boolean => {
  const offsets = [
    { dx: 0, dy: -1 }, { dx: 1, dy: -1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 },
    { dx: 0, dy: 1 }, { dx: -1, dy: 1 }, { dx: -1, dy: 0 }, { dx: -1, dy: -1 },
    { dx: 0, dy: -2 }, { dx: 2, dy: 0 }, { dx: 0, dy: 2 }, { dx: -2, dy: 0 },
  ];

  for (const { dx, dy } of offsets) {
    const tile = getTileAt(pos.x + dx, pos.y + dy);
    if (tile >= 50) return true; // Land/Coast tile
  }
  return false;
};

/**
 * Checks if this coordinate is within the 4-tile depletion zone of a previously foraged spot
 */
export const isLocationDepleted = (pos: { x: number; y: number }): boolean => {
  const foraged = state.foragedLocations || [];
  for (const loc of foraged) {
    let dx = Math.abs(pos.x - loc.x);
    if (dx > WORLD_MAP_COLUMNS / 2) dx = WORLD_MAP_COLUMNS - dx;
    const dy = Math.abs(pos.y - loc.y);
    const dist = Math.hypot(dx, dy);
    if (dist <= DEPLETION_RADIUS_TILES) return true;
  }
  return false;
};

/**
 * Evaluates coastal status for Anchorage actions
 */
export const checkCoastStatus = (pos: { x: number; y: number }): CoastStatus => {
  if (state.portId !== null) {
    return {
      isNearCoast: false,
      isPort: true,
      isDepleted: false,
      canForage: false,
      canRepair: false,
      reason: 'Docked in harbor. Use harbor facilities.',
    };
  }

  const isPort = portAdjacentAt(pos) !== null;
  if (isPort) {
    return {
      isNearCoast: true,
      isPort: true,
      isDepleted: false,
      canForage: false,
      canRepair: false,
      reason: 'Harbor entrance sighted. Enter harbor to resupply.',
    };
  }

  const nearCoast = isNearCoastline(pos);
  if (!nearCoast) {
    return {
      isNearCoast: false,
      isPort: false,
      isDepleted: false,
      canForage: false,
      canRepair: false,
      reason: 'Open ocean. Must be adjacent to coastlines to drop anchor for shore party.',
    };
  }

  const depleted = isLocationDepleted(pos);
  const totalCrew = getPlayerFleet().reduce((sum, s) => sum + (s.crew || 0), 0);

  if (totalCrew < 5) {
    return {
      isNearCoast: true,
      isPort: false,
      isDepleted: depleted,
      canForage: false,
      canRepair: false,
      reason: 'Need at least 5 sailors in fleet to mount a shore expedition.',
    };
  }

  return {
    isNearCoast: true,
    isPort: false,
    isDepleted: depleted,
    canForage: !depleted,
    canRepair: true,
    reason: depleted
      ? 'Coastline exhausted (already foraged within 4 tiles). Field repairs are still possible!'
      : undefined,
  };
};

/**
 * Conducts the 6-hour shore expedition and rolls raw gathered resources
 */
export const conductShoreExpedition = (): ExpeditionRawResult => {
  const fleet = getPlayerFleet();
  const totalCrew = fleet.reduce((sum, s) => sum + (s.crew || 0), 0);
  const partySize = Math.max(5, Math.min(totalCrew, 50));

  // Yield math:
  // Water: Abundant freshwater streams / cascades
  const baseWater = 10 + Math.floor(partySize * 0.6) + Math.floor(Math.random() * 15 + 5);
  // Food: Small quantity of wild berries, coconuts, beach fishing
  const baseFood = 1 + Math.floor(partySize * 0.12) + Math.floor(Math.random() * 3 + 1);
  // Lumber: Small quantity of fallen timber / driftwood
  const baseLumber = 1 + Math.floor(partySize * 0.08) + Math.floor(Math.random() * 2);

  // Flavor event roll
  const roll = Math.random();
  let eventDescription = 'Landing party surveyed freshwater creeks and coastal thickets.';
  let waterMultiplier = 1.0;
  let foodMultiplier = 1.0;
  let lumberMultiplier = 1.0;

  if (roll < 0.12) {
    eventDescription = '🌊 Pure Mountain Waterfall Discovered! Casks filled with crystal-clear spring water.';
    waterMultiplier = 1.5;
  } else if (roll < 0.24) {
    eventDescription = '🌴 Bountiful Coastal Palm Grove! Sailors harvested sweet coconuts and fresh beach crabs.';
    foodMultiplier = 1.5;
  } else if (roll < 0.36) {
    eventDescription = '🌲 Fallen Cedar Ridge! Sound timber salvaged for shipwright repairs.';
    lumberMultiplier = 1.5;
  }

  const waterFound = Math.round(baseWater * waterMultiplier);
  const foodFound = Math.round(baseFood * foodMultiplier);
  const lumberFound = Math.round(baseLumber * lumberMultiplier);

  // Advance time by 6 hours (360 minutes)
  const oldDay = Math.floor(state.timePassed / 1440);
  state.timePassed += 360;
  const newDay = Math.floor(state.timePassed / 1440);

  if (newDay > oldDay) {
    state.dayAtSea = (state.dayAtSea || 0) + (newDay - oldDay);
    processDailySurvival();
    updateInterface.dayAtSea?.(state.dayAtSea);
  }

  updateInterface.general?.({
    portId: state.portId,
    buildingId: state.buildingId,
    timePassed: state.timePassed,
    gold: state.gold,
  });

  // Morale boost from stepping on solid ground & drinking cold spring water
  state.morale = Math.min(100, (state.morale ?? 80) + 3);

  return {
    waterFound,
    foodFound,
    lumberFound,
    crewCount: partySize,
    hoursElapsed: EXPEDITION_HOURS,
    eventDescription,
  };
};

/**
 * Distributes player-confirmed resources into fleet holds and records 4-tile depletion
 */
export const stowForagedProvisions = (
  selected: { water: number; food: number; lumber: number },
  pos: { x: number; y: number },
): { success: boolean; stowedWater: number; stowedFood: number; stowedLumber: number; message: string } => {
  const ships = getPlayerFleet();
  let waterRemaining = Math.max(0, selected.water || 0);
  let foodRemaining = Math.max(0, selected.food || 0);
  let lumberRemaining = Math.max(0, selected.lumber || 0);

  const initialWater = waterRemaining;
  const initialFood = foodRemaining;
  const initialLumber = lumberRemaining;

  const distribute = (type: 'water' | 'food' | 'lumber', amount: number) => {
    let left = amount;
    for (let i = 0; i < ships.length; i += 1) {
      if (left <= 0) break;
      const space = getAvailableSpace(i);
      if (space <= 0) continue;

      const take = Math.min(left, space);
      const ship = ships[i];
      ship.cargo = ship.cargo || [];

      const existing = ship.cargo.find((c) => c && c.type === type);
      if (existing) {
        existing.quantity += take;
      } else {
        ship.cargo.push({ type, quantity: take });
      }
      left -= take;
    }
    return amount - left;
  };

  const stowedWater = distribute('water', waterRemaining);
  const stowedFood = distribute('food', foodRemaining);
  const stowedLumber = distribute('lumber', lumberRemaining);

  // Record 4-tile depletion zone
  state.foragedLocations = state.foragedLocations || [];
  state.foragedLocations.push({
    x: Math.round(pos.x),
    y: Math.round(pos.y),
    day: state.dayAtSea || 0,
  });

  updateProvisions();

  return {
    success: true,
    stowedWater,
    stowedFood,
    stowedLumber,
    message: `Provisions safely stowed in fleet holds (+${stowedWater} Water, +${stowedFood} Food, +${stowedLumber} Lumber). Remainder left on shore.`,
  };
};

/**
 * Calculates current fleet hull condition and shore repair options under 80% ceiling
 */
export const getShoreRepairStatus = (): ShoreRepairStatus => {
  const fleet = getPlayerFleet();
  let totalCargoLumber = 0;

  for (const ship of fleet) {
    for (const c of ship.cargo || []) {
      if (c?.type === 'lumber') totalCargoLumber += c.quantity || 0;
    }
  }

  const ships: ShipShoreRepairInfo[] = [];
  let totalRepairableDamage = 0;
  let totalLumberNeeded = 0;

  fleet.forEach((ship, index) => {
    const template = shipData[ship.id];
    const maxDur = template?.durability || 30;
    const fieldCeiling = Math.floor(maxDur * FIELD_REPAIR_CEILING_RATIO); // 80% ceiling
    const currentDur = ship.durability ?? maxDur;
    const repairableDamage = Math.max(0, fieldCeiling - currentDur);
    const lumberCost = Math.ceil(repairableDamage / DURABILITY_PER_LUMBER);

    totalRepairableDamage += repairableDamage;
    totalLumberNeeded += lumberCost;

    ships.push({
      shipIndex: index,
      name: ship.name,
      currentDurability: currentDur,
      maxDurability: maxDur,
      fieldCeiling,
      repairableDamage,
      lumberCost,
    });
  });

  return {
    totalCargoLumber,
    totalRepairableDamage,
    totalLumberNeeded,
    ships,
  };
};

/**
 * Deducts lumber from fleet holds
 */
const deductLumberFromFleet = (lumberAmount: number): boolean => {
  const fleet = getPlayerFleet();
  let needed = lumberAmount;

  for (const ship of fleet) {
    if (needed <= 0) break;
    const lumberCargo = (ship.cargo || []).find((c) => c && c.type === 'lumber');
    if (lumberCargo && lumberCargo.quantity > 0) {
      const take = Math.min(lumberCargo.quantity, needed);
      lumberCargo.quantity -= take;
      needed -= take;
    }
  }

  updateProvisions();
  return needed <= 0;
};

/**
 * Performs light shore repair on a single ship up to the 80% field ceiling
 */
export const repairShipOnShore = (
  shipIndex: number,
): { success: boolean; message: string; repairedPoints: number } => {
  const status = getShoreRepairStatus();
  const target = status.ships[shipIndex];

  if (!target) {
    return { success: false, message: 'Ship not found in fleet.', repairedPoints: 0 };
  }

  if (target.repairableDamage <= 0) {
    return {
      success: false,
      message: `${target.name} is already at or above the 80% field repair ceiling (${target.currentDurability}/${target.fieldCeiling}). Drydock required for 100%.`,
      repairedPoints: 0,
    };
  }

  if (status.totalCargoLumber < target.lumberCost) {
    return {
      success: false,
      message: `Need ${target.lumberCost} lumber to patch ${target.name}, but only have ${status.totalCargoLumber} in cargo holds.`,
      repairedPoints: 0,
    };
  }

  deductLumberFromFleet(target.lumberCost);

  const ship = getPlayerFleet()[shipIndex];
  ship.durability = target.fieldCeiling;

  return {
    success: true,
    message: `${target.name} patched with ${target.lumberCost} lumber! Durability restored to ${target.fieldCeiling} (${Math.round(FIELD_REPAIR_CEILING_RATIO * 100)}% field ceiling).`,
    repairedPoints: target.repairableDamage,
  };
};

/**
 * Performs light shore repair on all damaged ships in the fleet up to the 80% field ceiling
 */
export const repairEntireFleetOnShore = (): {
  success: boolean;
  message: string;
  totalLumberUsed: number;
  totalPointsRestored: number;
} => {
  const status = getShoreRepairStatus();

  if (status.totalRepairableDamage <= 0) {
    return {
      success: false,
      message: 'All vessels in the fleet are already at or above the 80% field repair ceiling! Visit a port shipyard for 100% overhaul.',
      totalLumberUsed: 0,
      totalPointsRestored: 0,
    };
  }

  if (status.totalCargoLumber < status.totalLumberNeeded) {
    return {
      success: false,
      message: `Fleet repairs require ${status.totalLumberNeeded} lumber, but you only have ${status.totalCargoLumber} in storage. Repair ships individually or gather more lumber.`,
      totalLumberUsed: 0,
      totalPointsRestored: 0,
    };
  }

  deductLumberFromFleet(status.totalLumberNeeded);

  const fleet = getPlayerFleet();
  status.ships.forEach((info) => {
    if (info.repairableDamage > 0) {
      fleet[info.shipIndex].durability = info.fieldCeiling;
    }
  });

  return {
    success: true,
    message: `All ships caulked and patched! Restored ${status.totalRepairableDamage} hull points using ${status.totalLumberNeeded} lumber (80% field ceiling reached).`,
    totalLumberUsed: status.totalLumberNeeded,
    totalPointsRestored: status.totalRepairableDamage,
  };
};
