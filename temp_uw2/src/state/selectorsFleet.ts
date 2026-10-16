import state from './state';
import { shipData } from '../data/shipData';

export const getPlayerFleet = () => state.fleets['1'].ships;

export const getPlayerFleetShip = (shipNumber: number) =>
  state.fleets['1'].ships[shipNumber];

export const getAvailableSpace = (shipNumber: number) => {
  const ship = state.fleets['1'].ships[shipNumber];
  const { capacity, minimumCrew } = shipData[ship.id];

  const cargo = ship.cargo.reduce((p, c) => p + c.quantity, 0);
  const availableSpace = capacity - minimumCrew;

  return availableSpace - cargo;
};

export const getLoadPercent = (shipNumber: number) => {
  const ship = state.fleets['1'].ships[shipNumber];
  const { capacity, minimumCrew } = shipData[ship.id];

  const cargo = ship.cargo.reduce((p, c) => p + c.quantity, 0);

  return ((cargo + minimumCrew) / capacity) * 100;
};

export const hasCrewAssigned = () =>
  state.fleets['1'].ships.every((ship) => ship.crew > 0);

export const getDaysProvisionsWillLast = () => {
  let totalCrew = 0;
  let totalWater = 0;
  let totalFood = 0;

  getPlayerFleet().forEach((ship) => {
    totalCrew += ship.crew;
    totalWater +=
      ship.cargo.find((items) => items.type === 'water')?.quantity || 0;
    totalFood +=
      ship.cargo.find((items) => items.type === 'food')?.quantity || 0;
  });

  if (totalCrew <= 0) return 999;
  const rationMultiplier = Math.max(0.1, (state.rationRate ?? 100) / 100);
  const dailyBurnPerCrew = 0.1 * rationMultiplier;
  const dailyFleetBurn = totalCrew * dailyBurnPerCrew;

  if (dailyFleetBurn <= 0) return 999;
  return Math.floor(Math.min(totalWater, totalFood) / dailyFleetBurn);
};

export const getCrewNeeded = () => {
  let count = 0;

  getPlayerFleet().forEach((ship) => {
    count += shipData[ship.id].minimumCrew - ship.crew;
  });

  return count;
};
