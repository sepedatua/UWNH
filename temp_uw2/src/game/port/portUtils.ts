import {
  RegularPort,
  SupplyPortBase,
  BuildingLocations,
  regularPorts,
  supplyPorts,
  SUPPLY_PORT_BUILDINGS,
  SUPPLY_PORT_TILESET,
} from '../../data/portData';
import { Position } from '../../types';
import { markets } from '../../data/portExtraData';
import { WORLD_MAP_COLUMNS } from '../../constants';

import portRegistry from './portRegistry';

export type PortData = (
  | (RegularPort & { isSupplyPort: false })
  | (SupplyPortBase & {
      buildings: BuildingLocations;
      tileset: 3;
      isSupplyPort: true;
    })
) & { id: string; tilemap: number };

export const getPortData = (id: string): PortData => {
  const number = Number(id) - 1;
  const builtinTotal = regularPorts.length + supplyPorts.length; // 130 ports (1..100 regular, 101..130 supply)

  // 1. Resolve Canonical Built-in Ports (1..130)
  if (!isNaN(number) && number >= 0 && number < builtinTotal) {
    const isSupplyPort = number >= regularPorts.length;

    if (!isSupplyPort) {
      return {
        ...regularPorts[number],
        id,
        isSupplyPort,
        tilemap: number,
      };
    }

    return {
      ...supplyPorts[number - regularPorts.length],
      buildings: SUPPLY_PORT_BUILDINGS,
      tileset: SUPPLY_PORT_TILESET,
      id,
      isSupplyPort,
      tilemap: regularPorts.length,
    };
  }

  // 2. Resolve Extensible Custom Ports (131+)
  if (portRegistry.isCustomPort(id)) {
    const customData = portRegistry.buildPortData(id);
    if (customData) {
      return customData;
    }
  }

  throw Error('Port does not exist!');
};

let portPositions: { id: string; position: Position }[] | null = null;

export const resetPortCache = () => {
  portPositions = null;
};

export const portAdjacentAt = ({ x, y }: Position) => {
  if (!portPositions) {
    portPositions = regularPorts
      .map(({ position }, i) => ({ id: String(i + 1), position }))
      .concat(
        supplyPorts.map(({ position }, i) => ({
          id: String(regularPorts.length + i + 1),
          position,
        })),
      )
      .concat(
        portRegistry.getAllCustomPorts().map((cp) => ({
          id: cp.id,
          position: cp.position,
        })),
      );
  }

  const match = portPositions.find(({ position }) => {
    let deltaX = Math.abs(position.x - x);
    if (deltaX > WORLD_MAP_COLUMNS / 2) {
      deltaX = WORLD_MAP_COLUMNS - deltaX;
    }
    const deltaY = Math.abs(position.y - y);

    if (deltaX > 2 || deltaY > 2) {
      return false;
    }

    return deltaX + deltaY <= 3;
  });

  return match ? match.id : null;
};

export const getNearbyPort = (
  position: Position,
): { id: string; name: string; isSupplyPort: boolean } | null => {
  const portId = portAdjacentAt(position);
  if (!portId) {
    return null;
  }
  const port = getPortData(portId);
  return {
    id: portId,
    name: port.name,
    isSupplyPort: port.isSupplyPort,
  };
};

export const getRegionOrIfSupplyPort = (portId: string) => {
  const port = getPortData(portId);

  if (!port.isSupplyPort) {
    const { marketId } = port;
    return markets[marketId];
  }

  return 'Supply port';
};

/**
 * Finds the closest regular port (with harbor, shipyard, tavern, etc.) to given coordinates
 * using cylindrical world map wrapping.
 */
export const getClosestRegularPort = (
  position: Position,
): { id: string; name: string; position: Position } => {
  let closestPort = regularPorts[0];
  let closestId = '1';
  let minDistance = Infinity;

  regularPorts.forEach((port, idx) => {
    let dx = Math.abs(port.position.x - position.x);
    if (dx > WORLD_MAP_COLUMNS / 2) {
      dx = WORLD_MAP_COLUMNS - dx;
    }
    const dy = Math.abs(port.position.y - position.y);
    const dist = Math.hypot(dx, dy);
    if (dist < minDistance) {
      minDistance = dist;
      closestPort = port;
      closestId = String(idx + 1);
    }
  });

  return {
    id: closestId,
    name: closestPort.name,
    position: closestPort.position,
  };
};

