import state from '../../state/state';
import api from '../../services/api';

export interface GhostFleet {
  id: number;
  captain_name: string;
  nation: string;
  world_x: number;
  world_y: number;
  heading: number;
  is_pirate: number;
  bounty_gold: number;
  last_seen: string;
  fleet_data?: {
    shipType?: string;
    crew?: number;
    guns?: number;
  };
}

class GhostFleetManager {
  private fleets: GhostFleet[] = [];
  private lastFetchTime = 0;
  private lastCheckInTime = 0;
  private fetchIntervalMs = 15000; // Poll every 15 seconds (REST HTTP, strictly no WebSockets)
  private checkInIntervalMs = 30000; // Sync check-in every 30 seconds

  public getNearbyGhostFleets(): GhostFleet[] {
    return this.fleets;
  }

  public async update(playerX: number, playerY: number, playerHeading: number = 0): Promise<GhostFleet | null> {
    if (state.gameMode !== 'mp_endless') {
      return null;
    }

    const now = Date.now();

    // 1. Periodic synchronous location check-in (Task 7.3)
    if (now - this.lastCheckInTime >= this.checkInIntervalMs) {
      this.lastCheckInTime = now;
      try {
        const isPirate = (state.fame?.piracy || 0) > 5000 ? 1 : 0;
        const bountyGold = isPirate ? (state.fame?.piracy || 0) * 2 : 0;

        await api.mpCheckIn({
          world_x: Math.round(playerX),
          world_y: Math.round(playerY),
          heading: playerHeading,
          captain_name: state.protagonistName || 'Captain',
          nation: state.nationality || 'Portugal',
          is_pirate: isPirate,
          bounty_gold: bountyGold,
          fleet_data: {
            shipType: 'Caravel',
            crew: 60,
            guns: 14,
          },
        });
      } catch (e) {
        // Fallback silently if offline or unauthenticated guest
      }
    }

    // 2. Periodic poll for ghost fleets in current ocean sector (Task 7.3 & 7.4)
    if (now - this.lastFetchTime >= this.fetchIntervalMs) {
      this.lastFetchTime = now;
      try {
        const res = await api.getMpGhostFleets(Math.round(playerX), Math.round(playerY), 150);
        if (res.success && Array.isArray(res.ghost_fleets)) {
          this.fleets = res.ghost_fleets;
        }
      } catch (e) {
        // Keep existing cached fleets on network hiccup
      }
    }

    // 3. Autonomous sailing AI: smooth forward simulation between poll ticks
    for (const fleet of this.fleets) {
      // Step slightly forward along heading vector
      const angle = (fleet.heading * 60) * (Math.PI / 180);
      const speed = 0.08;
      fleet.world_x = (fleet.world_x + Math.sin(angle) * speed + 2160) % 2160;
      fleet.world_y = Math.max(20, Math.min(1060, fleet.world_y - Math.cos(angle) * speed));
    }

    // 4. Interception proximity detection (Task 7.4)
    return this.checkInterception(playerX, playerY);
  }

  public checkInterception(playerX: number, playerY: number, interceptRadius: number = 25): GhostFleet | null {
    for (const fleet of this.fleets) {
      let dx = Math.abs(playerX - fleet.world_x);
      if (dx > 1080) {
        dx = 2160 - dx; // cylindrical map wrap
      }
      const dy = Math.abs(playerY - fleet.world_y);
      const dist = Math.hypot(dx, dy);

      if (dist <= interceptRadius) {
        return fleet;
      }
    }
    return null;
  }
}

export const ghostFleetManager = new GhostFleetManager();
export default ghostFleetManager;
