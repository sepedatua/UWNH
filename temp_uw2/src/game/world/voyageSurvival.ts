import state from '../../state/state';
import updateInterface, { SeaAlert } from '../../state/updateInterface';
import { generateId } from '../../utils';

export interface SurvivalTickResult {
  waterConsumed: number;
  foodConsumed: number;
  waterShortage: boolean;
  foodShortage: boolean;
  moraleChange: number;
  casualties: number;
  scurvy: boolean;
  limeJuiceUsed?: boolean;
  allCrewLost: boolean;
  alert: SeaAlert | null;
}

export const processDailySurvival = (): SurvivalTickResult => {
  const playerFleet = state.fleets[1] || state.fleets['1'];
  if (!playerFleet || !playerFleet.ships || !playerFleet.ships.length) {
    return {
      waterConsumed: 0,
      foodConsumed: 0,
      waterShortage: false,
      foodShortage: false,
      moraleChange: 0,
      casualties: 0,
      scurvy: false,
      limeJuiceUsed: false,
      allCrewLost: false,
      alert: null,
    };
  }

  // 1. Calculate total crew headcount
  let totalCrew = 0;
  for (const ship of playerFleet.ships) {
    totalCrew += ship.crew || 0;
  }

  if (totalCrew <= 0) {
    state.isAlive = false;
    const alert: SeaAlert = {
      id: generateId(),
      type: 'danger',
      text: '☠️ Ghost ship! All hands have been lost at sea.',
      timestamp: Date.now(),
    };
    updateInterface.seaAlert?.(alert);
    return {
      waterConsumed: 0,
      foodConsumed: 0,
      waterShortage: true,
      foodShortage: true,
      moraleChange: 0,
      casualties: 0,
      scurvy: false,
      limeJuiceUsed: false,
      allCrewLost: true,
      alert,
    };
  }

  // 2. Daily ration requirements (Precision Fractional Accumulator + Rations Adjustment)
  const rationRate = Math.max(20, Math.min(100, state.rationRate ?? 100));
  const dailyRationFactor = rationRate / 100;

  // Koei baseline: 0.1 barrels of Water & 0.1 barrels of Food per crew member per day at 100% rations
  const dailyWaterExact = (totalCrew / 10) * dailyRationFactor;
  const dailyFoodExact = (totalCrew / 10) * dailyRationFactor;

  state.waterAccumulator = (state.waterAccumulator || 0) + dailyWaterExact;
  state.foodAccumulator = (state.foodAccumulator || 0) + dailyFoodExact;

  const waterNeeded = Math.floor(state.waterAccumulator);
  const foodNeeded = Math.floor(state.foodAccumulator);

  // 3. Deduct water from ship holds
  let remainingWaterNeeded = waterNeeded;
  let waterConsumed = 0;
  for (const ship of playerFleet.ships) {
    const waterCargo = (ship.cargo || []).find((c) => c && c.type === 'water');
    if (waterCargo && waterCargo.quantity > 0) {
      const take = Math.min(waterCargo.quantity, remainingWaterNeeded);
      waterCargo.quantity -= take;
      remainingWaterNeeded -= take;
      waterConsumed += take;
      if (remainingWaterNeeded <= 0) break;
    }
  }
  state.waterAccumulator = Math.max(0, state.waterAccumulator - waterConsumed);

  // 4. Deduct food from ship holds
  let remainingFoodNeeded = foodNeeded;
  let foodConsumed = 0;
  for (const ship of playerFleet.ships) {
    const foodCargo = (ship.cargo || []).find((c) => c && c.type === 'food');
    if (foodCargo && foodCargo.quantity > 0) {
      const take = Math.min(foodCargo.quantity, remainingFoodNeeded);
      foodCargo.quantity -= take;
      remainingFoodNeeded -= take;
      foodConsumed += take;
      if (remainingFoodNeeded <= 0) break;
    }
  }
  state.foodAccumulator = Math.max(0, state.foodAccumulator - foodConsumed);

  // 5. Calculate remaining supplies across fleet
  let remainingTotalWater = 0;
  let remainingTotalFood = 0;
  for (const ship of playerFleet.ships) {
    for (const c of ship.cargo || []) {
      if (c?.type === 'water') remainingTotalWater += c.quantity || 0;
      if (c?.type === 'food') remainingTotalFood += c.quantity || 0;
    }
  }

  // 6. Evaluate shortages, morale penalties, and casualties
  const waterShortage = remainingWaterNeeded > 0 || (remainingTotalWater === 0 && totalCrew > 0);
  const foodShortage = remainingFoodNeeded > 0 || (remainingTotalFood === 0 && totalCrew > 0);
  let moralePenalty = 0;
  let casualties = 0;

  if (waterShortage) {
    moralePenalty += 20;
    const thirstCasualties = Math.max(1, Math.ceil(totalCrew * 0.08));
    casualties += thirstCasualties;
    state.waterAccumulator = 0;
  }

  if (foodShortage) {
    moralePenalty += 15;
    const hungerCasualties = Math.max(1, Math.ceil(totalCrew * 0.05));
    casualties += hungerCasualties;
    state.foodAccumulator = 0;
  }

  // Morale penalty for reduced rations
  if (rationRate < 100 && !waterShortage && !foodShortage) {
    if (rationRate <= 20) {
      moralePenalty += 10;
    } else if (rationRate <= 40) {
      moralePenalty += 5;
    } else if (rationRate <= 60) {
      moralePenalty += 2;
    } else if (rationRate <= 80) {
      moralePenalty += 1;
    }
  }

  // Scurvy check if voyage exceeds 50 consecutive days at sea without port calls
  let scurvy = false;
  let limeJuiceUsed = false;
  if (state.dayAtSea >= 50 && !waterShortage && !foodShortage) {
    if (Math.random() < 0.25) {
      const limeIndex = (state.items || []).indexOf('44');
      if (limeIndex >= 0) {
        state.items.splice(limeIndex, 1);
        limeJuiceUsed = true;
      } else {
        scurvy = true;
        moralePenalty += 8;
        const scurvyCasualties = Math.max(1, Math.ceil(totalCrew * 0.03));
        casualties += scurvyCasualties;
      }
    }
  }

  // 7. Apply crew casualties across ships
  if (casualties > 0) {
    let remainingCasualties = casualties;
    for (const ship of playerFleet.ships) {
      if (ship.crew > 0) {
        const loss = Math.min(ship.crew, remainingCasualties);
        ship.crew -= loss;
        remainingCasualties -= loss;
        if (remainingCasualties <= 0) break;
      }
    }
  }

  // 8. Apply morale penalties
  state.morale = Math.max(0, (state.morale ?? 80) - moralePenalty);

  // 9. Check if entire crew perished
  let currentTotalCrew = 0;
  for (const ship of playerFleet.ships) {
    currentTotalCrew += ship.crew || 0;
  }
  const allCrewLost = currentTotalCrew <= 0;
  if (allCrewLost) {
    state.isAlive = false;
  }

  // 10. Generate appropriate alert for HUD
  let alert: SeaAlert | null = null;
  if (allCrewLost) {
    alert = {
      id: generateId(),
      type: 'danger',
      text: '☠️ ALL HANDS PERISHED! Thirst and starvation claimed the entire crew. Ghost ship drifting.',
      timestamp: Date.now(),
    };
  } else if (waterShortage && foodShortage) {
    alert = {
      id: generateId(),
      type: 'danger',
      text: `🚨 DEHYDRATION & STARVATION! Morale collapsed to ${state.morale}%. ${casualties} sailors died today!`,
      timestamp: Date.now(),
    };
  } else if (waterShortage) {
    alert = {
      id: generateId(),
      type: 'danger',
      text: `🚨 DEHYDRATION CRISIS! Water barrels empty! Morale fell to ${state.morale}%. ${casualties} sailors perished!`,
      timestamp: Date.now(),
    };
  } else if (foodShortage) {
    alert = {
      id: generateId(),
      type: 'danger',
      text: `🚨 STARVATION CRISIS! Food exhausted! Morale fell to ${state.morale}%. ${casualties} sailors died!`,
      timestamp: Date.now(),
    };
  } else if (limeJuiceUsed) {
    alert = {
      id: generateId(),
      type: 'info',
      text: '🍋 SCURVY AVERTED! Ship surgeon administered Lime Juice from your inventory, protecting the crew!',
      timestamp: Date.now(),
    };
  } else if (scurvy) {
    alert = {
      id: generateId(),
      type: 'warning',
      text: `🍋 SCURVY OUTBREAK! Protracted voyage (>50 days) has weakened the crew (-8 Morale, ${casualties} casualties). Procure Lime Juice or make port!`,
      timestamp: Date.now(),
    };
  } else if (remainingTotalWater <= (waterNeeded || 1) * 3 && remainingTotalWater > 0) {
    const dailyWaterBurnRate = totalCrew * 0.1 * dailyRationFactor;
    alert = {
      id: generateId(),
      type: 'warning',
      text: `⚠️ LOW WATER: Only ${remainingTotalWater} barrels remaining (${Math.floor(remainingTotalWater / (dailyWaterBurnRate || 1))} days left)!`,
      timestamp: Date.now(),
    };
  } else if (remainingTotalFood <= (foodNeeded || 1) * 3 && remainingTotalFood > 0) {
    const dailyFoodBurnRate = totalCrew * 0.1 * dailyRationFactor;
    alert = {
      id: generateId(),
      type: 'warning',
      text: `⚠️ LOW FOOD: Only ${remainingTotalFood} barrels remaining (${Math.floor(remainingTotalFood / (dailyFoodBurnRate || 1))} days left)!`,
      timestamp: Date.now(),
    };
  } else if (state.dayAtSea % 5 === 0 || state.dayAtSea === 1) {
    alert = {
      id: generateId(),
      type: 'info',
      text: `🗓️ Day ${state.dayAtSea} at sea: Rations consumed (-${waterConsumed} Water, -${foodConsumed} Food${rationRate < 100 ? ` at ${rationRate}% rations` : ''}). Morale: ${state.morale}%.`,
      timestamp: Date.now(),
    };
  }

  if (alert) {
    updateInterface.seaAlert?.(alert);
  }

  return {
    waterConsumed,
    foodConsumed,
    waterShortage,
    foodShortage,
    moraleChange: -moralePenalty,
    casualties,
    scurvy,
    limeJuiceUsed,
    allCrewLost,
    alert,
  };
};
