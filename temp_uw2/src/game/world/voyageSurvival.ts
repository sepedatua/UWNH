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
      allCrewLost: true,
      alert,
    };
  }

  // 2. Daily ration requirements (1 unit per 10 sailors)
  const waterNeeded = Math.ceil(totalCrew / 10);
  const foodNeeded = Math.ceil(totalCrew / 10);

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
  const waterShortage = remainingWaterNeeded > 0;
  const foodShortage = remainingFoodNeeded > 0;
  let moralePenalty = 0;
  let casualties = 0;

  if (waterShortage) {
    moralePenalty += 20;
    const thirstCasualties = Math.max(1, Math.ceil(totalCrew * 0.08));
    casualties += thirstCasualties;
  }

  if (foodShortage) {
    moralePenalty += 15;
    const hungerCasualties = Math.max(1, Math.ceil(totalCrew * 0.05));
    casualties += hungerCasualties;
  }

  // Scurvy check if voyage exceeds 30 consecutive days
  let scurvy = false;
  if (state.dayAtSea >= 30 && !waterShortage && !foodShortage) {
    if (Math.random() < 0.25) {
      scurvy = true;
      moralePenalty += 8;
      const scurvyCasualties = Math.max(1, Math.ceil(totalCrew * 0.03));
      casualties += scurvyCasualties;
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
  } else if (scurvy) {
    alert = {
      id: generateId(),
      type: 'warning',
      text: `🍋 SCURVY OUTBREAK! Protracted voyage has weakened the crew (-8 Morale, ${casualties} casualties).`,
      timestamp: Date.now(),
    };
  } else if (remainingTotalWater <= waterNeeded * 3 && remainingTotalWater > 0) {
    alert = {
      id: generateId(),
      type: 'warning',
      text: `⚠️ LOW WATER: Only ${remainingTotalWater} barrels remaining (${Math.floor(remainingTotalWater / (waterNeeded || 1))} days left)!`,
      timestamp: Date.now(),
    };
  } else if (remainingTotalFood <= foodNeeded * 3 && remainingTotalFood > 0) {
    alert = {
      id: generateId(),
      type: 'warning',
      text: `⚠️ LOW FOOD: Only ${remainingTotalFood} barrels remaining (${Math.floor(remainingTotalFood / (foodNeeded || 1))} days left)!`,
      timestamp: Date.now(),
    };
  } else if (state.dayAtSea % 5 === 0 || state.dayAtSea === 1) {
    alert = {
      id: generateId(),
      type: 'info',
      text: `🗓️ Day ${state.dayAtSea} at sea: Rations consumed (-${waterConsumed} Water, -${foodConsumed} Food). Morale: ${state.morale}%.`,
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
    allCrewLost,
    alert,
  };
};
