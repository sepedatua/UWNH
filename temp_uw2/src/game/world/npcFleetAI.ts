import type { Position, Direction } from '../../types';
import state from '../../state/state';
import autopilotManager from './autopilotManager';
import { getPortData } from '../port/portUtils';
import type { NpcFleetInstance } from './npcFleetManager';

export const PURSUIT_RADIUS = 18; // Tiles within which pirates notice and chase player
export const PURSUIT_ABORT_RADIUS = 28; // Distance at which pirates give up pursuit

export class NpcFleetAI {
  /**
   * Computes the next compass heading for an NPC fleet based on its role and state machine.
   */
  public updateAndGetHeading(fleet: NpcFleetInstance, playerPos: Position): Direction {
    // 1. Calculate distance to player with cylindrical map wrap
    let dxToPlayer = playerPos.x - fleet.position.x;
    if (dxToPlayer > 1080) dxToPlayer -= 2160;
    if (dxToPlayer < -1080) dxToPlayer += 2160;
    const dyToPlayer = playerPos.y - fleet.position.y;
    const distToPlayer = Math.hypot(dxToPlayer, dyToPlayer);

    const playerAtSea = state.portId === null;

    // 2. State Machine Transitions
    if (fleet.hostile && playerAtSea) {
      if (distToPlayer <= PURSUIT_RADIUS) {
        fleet.aiState = 'pursuing';
      } else if (distToPlayer > PURSUIT_ABORT_RADIUS) {
        fleet.aiState = 'patrolling';
      }
    } else if (fleet.archetype === 'merchant') {
      fleet.aiState = 'trading';
    } else {
      fleet.aiState = 'patrolling';
    }

    // 3. Behavior Execution
    switch (fleet.aiState) {
      case 'pursuing': {
        // Aggressively steer toward player's current location
        const heading = autopilotManager.vectorToDirection(dxToPlayer, dyToPlayer);
        fleet.heading = heading;
        return heading;
      }

      case 'trading':
      case 'patrolling':
      default: {
        return this.navigateTradeRoute(fleet);
      }
    }
  }

  /**
   * Guides merchant and patrol fleets along their assigned regional trade route waypoints.
   */
  private navigateTradeRoute(fleet: NpcFleetInstance): Direction {
    // Ensure destination port is set
    const targetPortId = fleet.tradeRoute[fleet.currentRouteTargetIndex || 0];
    const destPort = getPortData(targetPortId);

    if (!destPort || !destPort.position) {
      // Fallback: continue in current heading or wander
      return fleet.heading || 'e';
    }

    // Check if fleet arrived near destination port (< 3.0 tiles)
    let dxPort = destPort.position.x - fleet.position.x;
    if (dxPort > 1080) dxPort -= 2160;
    if (dxPort < -1080) dxPort += 2160;
    const dyPort = destPort.position.y - fleet.position.y;
    const distToPort = Math.hypot(dxPort, dyPort);

    if (distToPort <= 3.5) {
      // Reached port! Simulate trading: swap route direction (e.g. Malacca -> Sunda -> Malacca)
      fleet.currentRouteTargetIndex = fleet.currentRouteTargetIndex === 0 ? 1 : 0;
      fleet.waypoints = [];
      fleet.currentWaypointIndex = 0;

      // Re-resolve next destination
      const nextPortId = fleet.tradeRoute[fleet.currentRouteTargetIndex];
      const nextPort = getPortData(nextPortId);
      if (nextPort && nextPort.position) {
        const path = autopilotManager.findPath(fleet.position, nextPort.position, false);
        if (path && path.length >= 2) {
          fleet.waypoints = path;
          fleet.currentWaypointIndex = 1;
        }
      }
    }

    // If no active waypoints, plot route using macro-grid pathfinder
    if (!fleet.waypoints || fleet.waypoints.length === 0 || fleet.currentWaypointIndex === undefined) {
      const path = autopilotManager.findPath(fleet.position, destPort.position, false);
      if (path && path.length >= 2) {
        fleet.waypoints = path;
        fleet.currentWaypointIndex = 1;
      } else {
        // Direct heading if corridor path cannot be resolved
        const directHeading = autopilotManager.vectorToDirection(dxPort, dyPort);
        fleet.heading = directHeading;
        return directHeading;
      }
    }

    // Follow plotted waypoints
    if (fleet.waypoints && fleet.currentWaypointIndex < fleet.waypoints.length) {
      const targetWp = fleet.waypoints[fleet.currentWaypointIndex];

      let dxWp = targetWp.x - fleet.position.x;
      if (dxWp > 1080) dxWp -= 2160;
      if (dxWp < -1080) dxWp += 2160;
      const dyWp = targetWp.y - fleet.position.y;
      const distToWp = Math.hypot(dxWp, dyWp);

      // Advance waypoint if close
      if (distToWp < 2.5) {
        fleet.currentWaypointIndex++;
        if (fleet.currentWaypointIndex >= fleet.waypoints.length) {
          // Reached final waypoint of current leg
          return fleet.heading;
        }
      }

      const nextTarget = fleet.waypoints[fleet.currentWaypointIndex] || targetWp;
      let dxNext = nextTarget.x - fleet.position.x;
      if (dxNext > 1080) dxNext -= 2160;
      if (dxNext < -1080) dxNext += 2160;
      const dyNext = nextTarget.y - fleet.position.y;

      const heading = autopilotManager.vectorToDirection(dxNext, dyNext);
      fleet.heading = heading;
      return heading;
    }

    return fleet.heading || 's';
  }
}

export const npcFleetAI = new NpcFleetAI();
export default npcFleetAI;
