import state from './state';
import { shipData } from '../data/shipData';
import { COMMODITIES, Commodity, calculateBuyPrice, calculateSellPrice } from '../data/commodityData';
import { getPortData } from '../game/port/portUtils';
import { getPlayerFleet } from './selectorsFleet';

export interface FleetCargoItem {
  id: string;
  name: string;
  icon: string;
  category: string;
  quantity: number;
}

/**
 * Total hold capacity across all player ships (excluding minimum crew quarters)
 */
export const getTotalFleetCapacity = (): number => {
  const ships = getPlayerFleet();
  if (!ships || ships.length === 0) return 0;

  return ships.reduce((acc, ship) => {
    const data = shipData[ship.id];
    if (!data) return acc;
    return acc + Math.max(0, data.capacity - data.minimumCrew);
  }, 0);
};

/**
 * Total cargo used across all player ships (provisions + commodities)
 */
export const getTotalFleetCargoLoad = (): number => {
  const ships = getPlayerFleet();
  if (!ships || ships.length === 0) return 0;

  return ships.reduce((acc, ship) => {
    return acc + (ship.cargo || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, 0);
};

/**
 * Free cargo hold space available for new goods or provisions
 */
export const getAvailableFleetSpace = (): number => {
  return Math.max(0, getTotalFleetCapacity() - getTotalFleetCargoLoad());
};

/**
 * Summarize all non-provision commodities stored in the fleet hold
 */
export const getFleetCommoditiesSummary = (): FleetCargoItem[] => {
  const ships = getPlayerFleet();
  if (!ships) return [];

  const totals: Record<string, number> = {};
  const PROVISION_KEYS = ['water', 'food', 'lumber', 'shot'];

  ships.forEach((ship) => {
    (ship.cargo || []).forEach((item) => {
      if (!item || !item.type) return;
      if (PROVISION_KEYS.includes(item.type)) return;

      // Extract commodity ID (supports either '1' or 'commodity_1')
      const commId = item.type.replace('commodity_', '');
      totals[commId] = (totals[commId] || 0) + item.quantity;
    });
  });

  return Object.entries(totals)
    .filter(([_, qty]) => qty > 0)
    .map(([id, quantity]) => {
      const meta = COMMODITIES.find((c) => c.id === id);
      return {
        id,
        name: meta?.name || `Goods #${id}`,
        icon: meta?.icon || '📦',
        category: meta?.category || 'General',
        quantity,
      };
    });
};

/**
 * Get current port's market rate percentage (50% - 150%)
 */
export const getPortMarketRate = (portId?: string): number => {
  const targetPortId = portId || state.portId || '1';
  return state.marketRates[targetPortId] || 100;
};

/**
 * Get commodities produced and available for purchase at the given port
 */
export const getPortAvailableCommodities = (portId?: string): { commodity: Commodity; buyPrice: number }[] => {
  const targetPortId = portId || state.portId || '1';
  const port = getPortData(targetPortId);
  const rate = getPortMarketRate(targetPortId);

  // Find commodities that list this port as origin
  let localGoods = COMMODITIES.filter((c) => c.originPorts.includes(targetPortId));

  // If smaller port has no direct mapping, offer 2 regional fallback goods
  if (localGoods.length === 0 && !port.isSupplyPort) {
    localGoods = COMMODITIES.filter((c) => c.originRegions.includes(port.regionId)).slice(0, 2);
  }

  // Fallback to basic goods if none matched
  if (localGoods.length === 0) {
    localGoods = [COMMODITIES[0], COMMODITIES[1]]; // Rock Salt, Olive Oil
  }

  return localGoods.map((commodity) => ({
    commodity,
    buyPrice: calculateBuyPrice(commodity, rate),
  }));
};

/**
 * Get the current economy value of a port including player investments
 */
export const getPortEconomyValue = (portId?: string): number => {
  const targetPortId = portId || state.portId || '1';
  const port = getPortData(targetPortId);
  const investmentBonus = state.portInvestments[targetPortId] || 0;

  const baseEconomy = port.isSupplyPort ? 100 : port.economy;
  return Math.min(1000, baseEconomy + investmentBonus);
};
