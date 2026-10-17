/**
 * lookoutEngine.ts
 * Crow's Nest Lookout Horizon Detection & Proximity Engine
 *
 * Implements authentic Koei Uncharted Waters: New Horizons lookout mechanics:
 * - Proximity detection for hidden villages, supply ports, and towns based on
 *   active line-of-sight radius (Lookout duty % + Officer stats + Telescope item).
 * - First-time horizon sighting alerts with ship bell chime and direction bearings.
 * - +50 Adventure Fame for discovering uncharted villages and +30 Fame for supply havens.
 * - Landing proximity detection for initiating shore party exploration.
 */

import state from '../../state/state';
import { Position } from '../../types';
import { WORLD_MAP_COLUMNS } from '../../constants';
import { calculateSightRadius } from '../world/fogOfWarRenderer';
import { villages, Village } from '../../data/villageData';
import { supplyPorts, SupplyPortBase } from '../../data/portData';
import { recordVillageDiscovery, recordSupplyPortDiscovery } from '../../state/actionsCrew';

export type CompassBearing = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export interface LookoutDiscoveryEvent {
  type: 'village' | 'supplyPort';
  id: string;
  name: string;
  bearing: CompassBearing;
  distanceTiles: number;
  fameAwarded: number;
  message: string;
}

export interface LookoutSightingsResult {
  sightRadiusTiles: number;
  newDiscoveries: LookoutDiscoveryEvent[];
  sightedVillages: Village[];
  nearbyLandingVillage: Village | null;
  sightedSupplyPorts: { id: string; name: string; position: Position }[];
}

/**
 * Calculates 8-directional compass bearing from delta coordinates.
 */
export const calculateCompassBearing = (dx: number, dy: number): CompassBearing => {
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  // -180 to 180 degrees. East is 0, South is 90, West is 180/-180, North is -90
  if (angle >= -22.5 && angle < 22.5) return 'E';
  if (angle >= 22.5 && angle < 67.5) return 'SE';
  if (angle >= 67.5 && angle < 112.5) return 'S';
  if (angle >= 112.5 && angle < 157.5) return 'SW';
  if (angle >= 157.5 || angle < -157.5) return 'W';
  if (angle >= -157.5 && angle < -112.5) return 'NW';
  if (angle >= -112.5 && angle < -67.5) return 'N';
  return 'NE';
};

/**
 * Calculates wrapped Euclidean delta and distance between two world points.
 */
export const getWrappedDistance = (
  from: Position,
  to: Position,
): { dx: number; dy: number; dist: number } => {
  let dx = to.x - from.x;
  if (dx > WORLD_MAP_COLUMNS / 2) dx -= WORLD_MAP_COLUMNS;
  if (dx < -WORLD_MAP_COLUMNS / 2) dx += WORLD_MAP_COLUMNS;

  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);

  return { dx, dy, dist };
};

export const LANDING_PROXIMITY_TILES = 4.0; // Distance to anchor and send landing party ashore

/**
 * Evaluates all world settlements and supply havens against the fleet's active Lookout horizon.
 */
export const checkLookoutSightings = (
  playerPos: Position,
): LookoutSightingsResult => {
  const sight = calculateSightRadius();
  const sightRadiusTiles = sight.finalRadiusTiles;

  const newDiscoveries: LookoutDiscoveryEvent[] = [];
  const sightedVillages: Village[] = [];
  let nearbyLandingVillage: Village | null = null;
  let minLandingDist = Infinity;

  // 1. Evaluate All 98 Historical Indigenous Villages
  for (const vil of villages) {
    const { dx, dy, dist } = getWrappedDistance(playerPos, vil.position);

    if (dist <= sightRadiusTiles) {
      sightedVillages.push(vil);

      // Check for first-time discovery event
      const isAlreadyKnown = (state.discoveredVillages || []).includes(vil.id);
      if (!isAlreadyKnown) {
        const { isNewDiscovery, fameAwarded } = recordVillageDiscovery(vil.id);
        if (isNewDiscovery) {
          const bearing = calculateCompassBearing(dx, dy);
          newDiscoveries.push({
            type: 'village',
            id: vil.id,
            name: vil.name,
            bearing,
            distanceTiles: Math.round(dist * 10) / 10,
            fameAwarded,
            message: `★ Uncharted Village Discovered! Lookouts report ${vil.name} bearing ${bearing}! (+${fameAwarded} Adventure Fame)`,
          });
        }
      }
    }

    // Check if player is close enough to shore to launch landing party (<= 4 tiles)
    if (dist <= LANDING_PROXIMITY_TILES && dist < minLandingDist) {
      minLandingDist = dist;
      nearbyLandingVillage = vil;
    }
  }

  // 2. Evaluate All 30 Supply Ports
  const sightedSupplyPorts: { id: string; name: string; position: Position }[] = [];

  supplyPorts.forEach((sp, idx) => {
    const portId = String(101 + idx); // Supply ports are numbered 101-130
    const { dx, dy, dist } = getWrappedDistance(playerPos, sp.position);

    if (dist <= sightRadiusTiles) {
      sightedSupplyPorts.push({
        id: portId,
        name: sp.name,
        position: sp.position,
      });

      // Check for first-time discovery
      const isAlreadyKnown = (state.discoveredSupplyPorts || []).includes(portId);
      if (!isAlreadyKnown) {
        const { isNewDiscovery, fameAwarded } = recordSupplyPortDiscovery(portId);
        if (isNewDiscovery) {
          const bearing = calculateCompassBearing(dx, dy);
          newDiscoveries.push({
            type: 'supplyPort',
            id: portId,
            name: sp.name,
            bearing,
            distanceTiles: Math.round(dist * 10) / 10,
            fameAwarded,
            message: `🔭 Lookouts report: Supply Haven sighted bearing ${bearing}! (${sp.name}) (+${fameAwarded} Adventure Fame)`,
          });
        }
      }
    }
  });

  return {
    sightRadiusTiles,
    newDiscoveries,
    sightedVillages,
    nearbyLandingVillage,
    sightedSupplyPorts,
  };
};
