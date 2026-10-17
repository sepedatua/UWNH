import { getPortData } from '../../../game/port/portUtils';
import { shipyardsToShips } from '../../../data/portShipyardData';
import { generateId, random, sample } from '../../../utils';
import { UsedShips } from '../../../state/state';

const generateUsedShips = (portId: string) => {
  const port = getPortData(portId);

  if (port.isSupplyPort) {
    throw Error('Supply port was provided');
  }

  const { industryId, industry } = port;
  const shipPool = shipyardsToShips[industryId] || shipyardsToShips['1'];

  let shipPoolMeetingRequirements = shipPool
    .filter(({ industryRequirement }) => industry >= industryRequirement)
    .map(({ shipId }) => shipId);

  // If port industry is lower than all shipyard requirements, fallback to the lowest tier ship
  if (shipPoolMeetingRequirements.length === 0) {
    shipPoolMeetingRequirements = shipPool.length > 0 ? [shipPool[0].shipId] : ['1'];
  }

  let amount = 2;

  if (industry > 800) {
    amount = random(2, 8);
  } else if (industry > 600) {
    amount = random(2, 6);
  } else if (industry > 400) {
    amount = random(2, 4);
  }

  const usedShips: UsedShips = {};

  for (let i = 0; i < amount; i += 1) {
    const pickedShip = sample(shipPoolMeetingRequirements) || shipPoolMeetingRequirements[0] || '1';
    usedShips[generateId()] = pickedShip;
  }

  return usedShips;
};

export default generateUsedShips;
