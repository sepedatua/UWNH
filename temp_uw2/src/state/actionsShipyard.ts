import state from './state';
import api from '../services/api';
import { shipData } from '../data/shipData';
import { updateGeneral } from './actionsPort';
import { getPlayerFleet, getPlayerFleetShip } from './selectorsFleet';
import { getPortData } from '../game/port/portUtils';

export const REPAIR_COST_PER_POINT = 12;

export interface FleetDamageStatus {
  totalDamage: number;
  totalRepairCost: number;
  damagedShips: {
    shipIndex: number;
    name: string;
    currentDurability: number;
    maxDurability: number;
    cost: number;
  }[];
}

/**
 * Check damage across all ships in player fleet
 */
export const getFleetDamageStatus = (): FleetDamageStatus => {
  const fleet = getPlayerFleet();
  const damagedShips: FleetDamageStatus['damagedShips'] = [];
  let totalDamage = 0;
  let totalRepairCost = 0;

  fleet.forEach((ship, index) => {
    const template = shipData[ship.id];
    if (!template) return;

    const maxDur = template.durability;
    const currentDur = ship.durability ?? maxDur;
    const damage = Math.max(0, maxDur - currentDur);

    if (damage > 0) {
      const cost = damage * REPAIR_COST_PER_POINT;
      totalDamage += damage;
      totalRepairCost += cost;
      damagedShips.push({
        shipIndex: index,
        name: ship.name,
        currentDurability: currentDur,
        maxDurability: maxDur,
        cost,
      });
    }
  });

  return {
    totalDamage,
    totalRepairCost,
    damagedShips,
  };
};

/**
 * Repair all damaged ships in the fleet
 */
export const repairFleet = (): { success: boolean; message: string } => {
  const status = getFleetDamageStatus();

  if (status.totalRepairCost === 0) {
    return { success: false, message: 'All ships in your fleet are already in pristine condition!' };
  }

  if (state.gold < status.totalRepairCost) {
    return {
      success: false,
      message: `You need ${status.totalRepairCost} gold to complete repairs, but only have ${state.gold} gold.`,
    };
  }

  state.gold -= status.totalRepairCost;

  const fleet = getPlayerFleet();
  fleet.forEach((ship) => {
    const template = shipData[ship.id];
    if (template) {
      ship.durability = template.durability;
    }
  });

  updateGeneral();

  return {
    success: true,
    message: `All ships fully repaired and caulked for ${status.totalRepairCost} gold pieces!`,
  };
};

/**
 * Remodel a ship: reallocate capacity between Crew Quarters, Gun Ports, and Cargo Hold
 */
export const remodelShip = (
  shipIndex: number,
  newCrewQuarters: number,
  newGuns: number,
): { success: boolean; message: string } => {
  const REMODEL_FEE = 200;
  if (state.gold < REMODEL_FEE) {
    return { success: false, message: `Remodeling costs ${REMODEL_FEE} gold. You lack the funds.` };
  }

  const ship = getPlayerFleetShip(shipIndex);
  if (!ship) {
    return { success: false, message: 'Ship not found.' };
  }

  const template = shipData[ship.id];
  const { capacity, minimumCrew, maximumCrew, maximumGuns } = template;

  if (newCrewQuarters < minimumCrew || newCrewQuarters > maximumCrew) {
    return { success: false, message: `Crew quarters must be between ${minimumCrew} and ${maximumCrew}.` };
  }

  if (newGuns < 0 || newGuns > maximumGuns) {
    return { success: false, message: `Gun ports must be between 0 and ${maximumGuns}.` };
  }

  if (newCrewQuarters + newGuns >= capacity) {
    return { success: false, message: 'Total crew and guns cannot exceed ship capacity.' };
  }

  state.gold -= REMODEL_FEE;

  // Apply customizations
  ship.maxCrew = newCrewQuarters;
  ship.maxGuns = newGuns;
  ship.crew = Math.min(ship.crew, newCrewQuarters);

  updateGeneral();

  const newCargoHold = capacity - newCrewQuarters - newGuns;

  return {
    success: true,
    message: `${ship.name} successfully remodeled! Cargo hold adjusted to ${newCargoHold} crates.`,
  };
};

/**
 * Invest in the shipyard / local industrial sector
 */
export const investInShipyard = async (
  amount: number,
): Promise<{ success: boolean; message: string; industryGain: number }> => {
  if (state.gold < amount) {
    return { success: false, message: 'You do not have enough gold to invest.', industryGain: 0 };
  }

  if (amount <= 0) {
    return { success: false, message: 'Please specify a valid investment amount.', industryGain: 0 };
  }

  state.gold -= amount;

  const portId = state.portId || '1';
  const industryGain = Math.max(1, Math.floor(amount / 100));

  // Store local industry bonus in portInvestments
  const investKey = `ind_${portId}`;
  state.portInvestments[investKey] = (state.portInvestments[investKey] || 0) + industryGain;

  // Clear cached used ships so newly unlocked models generate!
  delete state.usedShipsAtPort[portId];

  // In Multiplayer mode, sync with backend
  if (state.gameMode === 'mp_endless') {
    try {
      await api.mpInvest(Number(portId), amount, state.nationality, 'industry');
    } catch (e) {
      console.warn('[MP] Industry invest sync fallback:', e);
    }
  }

  updateGeneral();

  return {
    success: true,
    message: `You invested ${amount} gold! Local shipyard industry expanded by +${industryGain} points.`,
    industryGain,
  };
};

/**
 * Get current effective industry value of a port
 */
export const getPortIndustryValue = (portId?: string): number => {
  const targetPortId = portId || state.portId || '1';
  const port = getPortData(targetPortId);
  const bonus = state.portInvestments[`ind_${targetPortId}`] || 0;

  const baseIndustry = port.isSupplyPort ? 100 : port.industry;
  return Math.min(1000, baseIndustry + bonus);
};
