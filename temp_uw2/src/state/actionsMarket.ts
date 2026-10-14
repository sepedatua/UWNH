import state from './state';
import api from '../services/api';
import { Commodity } from '../data/commodityData';
import { updateGeneral } from './actionsPort';
import { getPlayerFleet, getAvailableSpace } from './selectorsFleet';
import { getAvailableFleetSpace, getPortMarketRate } from './selectorsMarket';
import soundManager from '../interface/sound/soundManager';

/**
 * Buy a commodity and load into player fleet holds.
 */
export const buyCommodity = async (
  commodity: Commodity,
  quantity: number,
  unitPrice: number,
): Promise<{ success: boolean; message: string }> => {
  const totalCost = quantity * unitPrice;

  if (state.gold < totalCost) {
    return { success: false, message: 'You do not have enough gold.' };
  }

  const freeSpace = getAvailableFleetSpace();
  if (freeSpace < quantity) {
    return {
      success: false,
      message: `Not enough hold space! You only have room for ${freeSpace} crates.`,
    };
  }

  // Deduct gold
  state.gold -= totalCost;

  // Distribute cargo into ship holds
  let remainingToLoad = quantity;
  const ships = getPlayerFleet();
  const cargoTypeKey = `commodity_${commodity.id}`;

  for (let i = 0; i < ships.length; i += 1) {
    if (remainingToLoad <= 0) break;

    const ship = ships[i];
    ship.cargo = ship.cargo || [];

    const shipAvailable = getAvailableSpace(i);
    if (shipAvailable <= 0) continue;

    const toAllocate = Math.min(remainingToLoad, shipAvailable);

    const existingCargoIndex = ship.cargo.findIndex(
      (c) => c.type === cargoTypeKey || c.type === commodity.id,
    );

    if (existingCargoIndex >= 0) {
      ship.cargo[existingCargoIndex].quantity += toAllocate;
    } else {
      ship.cargo.push({
        type: cargoTypeKey,
        quantity: toAllocate,
      });
    }

    remainingToLoad -= toAllocate;
  }

  const portId = state.portId || '1';

  // Shift local market rate upward due to increased demand
  const currentRate = getPortMarketRate(portId);
  const rateShift = Math.max(1, Math.floor(quantity / 10));
  state.marketRates[portId] = Math.min(150, currentRate + rateShift);

  // Grant Trade Fame
  const fameGain = Math.max(1, Math.floor(totalCost / 500));
  state.fame.trade = (state.fame.trade || 0) + fameGain;

  // In Multiplayer mode, sync atomically with shared global economy
  if (state.gameMode === 'mp_endless') {
    try {
      await api.mpTrade(Number(portId), Number(commodity.id), 'buy', quantity);
    } catch (e) {
      console.warn('[MP] Trade sync fallback:', e);
    }
  }

  updateGeneral();
  soundManager.playSfx('coin');

  return {
    success: true,
    message: `Purchased ${quantity} crates of ${commodity.name} for ${totalCost} gold!`,
  };
};

/**
 * Sell a commodity from player fleet holds.
 */
export const sellCommodity = async (
  commodityId: string,
  commodityName: string,
  quantity: number,
  unitSellPrice: number,
): Promise<{ success: boolean; message: string }> => {
  const ships = getPlayerFleet();
  const cargoTypeKey = `commodity_${commodityId}`;

  // Verify total quantity available in fleet
  let availableInHold = 0;
  ships.forEach((s) => {
    (s.cargo || []).forEach((c) => {
      if (c.type === cargoTypeKey || c.type === commodityId) {
        availableInHold += c.quantity;
      }
    });
  });

  if (availableInHold < quantity) {
    return {
      success: false,
      message: `You only have ${availableInHold} crates to sell.`,
    };
  }

  // Remove quantity from ships
  let remainingToRemove = quantity;
  for (let i = 0; i < ships.length; i += 1) {
    if (remainingToRemove <= 0) break;

    const ship = ships[i];
    if (!ship.cargo) continue;

    for (let j = 0; j < ship.cargo.length; j += 1) {
      const item = ship.cargo[j];
      if (item.type === cargoTypeKey || item.type === commodityId) {
        const toDeduct = Math.min(remainingToRemove, item.quantity);
        item.quantity -= toDeduct;
        remainingToRemove -= toDeduct;

        if (item.quantity <= 0) {
          ship.cargo.splice(j, 1);
          j -= 1;
        }

        if (remainingToRemove <= 0) break;
      }
    }
  }

  const totalRevenue = quantity * unitSellPrice;
  state.gold += totalRevenue;

  const portId = state.portId || '1';

  // Shift local market rate downward due to supply influx
  const currentRate = getPortMarketRate(portId);
  const rateShift = Math.max(1, Math.floor(quantity / 10));
  state.marketRates[portId] = Math.max(50, currentRate - rateShift);

  // Grant Trade Fame for successful mercantile sales
  const fameGain = Math.max(2, Math.floor(totalRevenue / 300));
  state.fame.trade = (state.fame.trade || 0) + fameGain;

  // In Multiplayer mode, sync atomically with shared global economy
  if (state.gameMode === 'mp_endless') {
    try {
      await api.mpTrade(Number(portId), Number(commodityId), 'sell', quantity);
    } catch (e) {
      console.warn('[MP] Trade sync fallback:', e);
    }
  }

  updateGeneral();
  soundManager.playSfx('coin');

  return {
    success: true,
    message: `Sold ${quantity} crates of ${commodityName} for ${totalRevenue} gold!`,
  };
};

/**
 * Invest gold into the local port's market/economy.
 */
export const investInMarket = async (
  goldAmount: number,
): Promise<{ success: boolean; message: string; economyGain: number }> => {
  if (state.gold < goldAmount) {
    return { success: false, message: 'You do not have enough gold to invest.', economyGain: 0 };
  }

  if (goldAmount <= 0) {
    return { success: false, message: 'Please specify a valid investment amount.', economyGain: 0 };
  }

  state.gold -= goldAmount;

  // Calculate economic prosperity points gained
  const portId = state.portId || '1';
  const economyGain = Math.max(1, Math.floor(goldAmount / 100));
  state.portInvestments[portId] = (state.portInvestments[portId] || 0) + economyGain;

  // Grant Trade Fame for royal mercantile contribution
  const fameGain = Math.max(1, Math.floor(goldAmount / 200));
  state.fame.trade = (state.fame.trade || 0) + fameGain;

  // In Multiplayer mode, sync with MySQL port economy and national allegiance
  if (state.gameMode === 'mp_endless') {
    try {
      await api.mpInvest(Number(portId), goldAmount, state.nationality, 'economy');
    } catch (e) {
      console.warn('[MP] Invest sync fallback:', e);
    }
  }

  updateGeneral();

  return {
    success: true,
    message: `You invested ${goldAmount} gold! Port economy increased by +${economyGain} points.`,
    economyGain,
  };
};
