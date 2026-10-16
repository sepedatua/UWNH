import state from '../../state/state';
import type { Position, Direction } from '../../types';
import type { Ship } from './fleets';
import {
  REGIONAL_BASINS,
  getBasinForCoordinates,
  RegionalBasin,
  NpcFleetTemplate,
} from '../../data/npcFleetData';
import { getPortData } from '../port/portUtils';
import Assets from '../../assets';

export interface NpcFleetInstance {
  id: string; // Key in state.fleets (e.g. '2', '3', '4')
  templateId: string;
  name: string;
  captainName: string;
  nation: string;
  archetype: 'merchant' | 'pirate' | 'patrol';
  flagshipId: string;
  position: Position;
  heading: Direction;
  ships: Ship[];
  tradeRoute: [string, string];
  currentRouteTargetIndex: 0 | 1;
  dialogRumor: string;
  bountyGold?: number;
  hostile: boolean;
  spawnBasin: RegionalBasin;
  aiState?: 'trading' | 'patrolling' | 'pursuing';
  waypoints?: Position[];
  currentWaypointIndex?: number;
}

const MIN_ACTIVE_FLEETS = 4;
const MAX_ACTIVE_FLEETS = 7;
const DESPAWN_DISTANCE = 350; // Despawn if fleet drifts > 350 tiles from player

export class NpcFleetManager {
  private activeFleets: Map<string, NpcFleetInstance> = new Map();
  private nextFleetId = 2; // '1' is reserved for player
  private lastBasin: RegionalBasin | null = null;

  public getActiveFleets(): NpcFleetInstance[] {
    return Array.from(this.activeFleets.values());
  }

  public getFleetById(id: string): NpcFleetInstance | undefined {
    return this.activeFleets.get(id);
  }

  public getNearbyFleets(pos: Position, radiusTiles: number = 30): NpcFleetInstance[] {
    const nearby: NpcFleetInstance[] = [];
    for (const fleet of this.activeFleets.values()) {
      let dx = Math.abs(pos.x - fleet.position.x);
      if (dx > 1080) dx = 2160 - dx;
      const dy = Math.abs(pos.y - fleet.position.y);
      if (Math.hypot(dx, dy) <= radiusTiles) {
        nearby.push(fleet);
      }
    }
    return nearby;
  }

  /**
   * Initializes or updates regional marine traffic around the player's coordinates.
   */
  public update(playerPos: Position): void {
    const currentBasin = getBasinForCoordinates(playerPos.x, playerPos.y);

    // 1. Recycle/despawn fleets that are too far from the player
    this.cullDistantFleets(playerPos);

    // 2. If basin changed or active count fell below threshold, spawn new regional fleets
    if (this.lastBasin !== currentBasin || this.activeFleets.size < MIN_ACTIVE_FLEETS) {
      this.populateBasin(currentBasin, playerPos);
      this.lastBasin = currentBasin;
    }

    // 3. Keep state.fleets continuously synchronized
    this.syncToGlobalState();
  }

  /**
   * Spawns authentic regional fleets for the given maritime basin.
   */
  public populateBasin(basin: RegionalBasin, playerPos: Position): void {
    const regionDef = REGIONAL_BASINS[basin] || REGIONAL_BASINS.oceanic;
    const templates = regionDef.fleetTemplates;
    if (!templates || templates.length === 0) return;

    let targetCount = Math.min(MAX_ACTIVE_FLEETS, Math.max(MIN_ACTIVE_FLEETS, templates.length));

    // Do not spawn beyond MAX_ACTIVE_FLEETS
    while (this.activeFleets.size < targetCount) {
      // Pick template
      const template = templates[(this.activeFleets.size) % templates.length];
      const spawnPos = this.findWaterSpawnPosition(template, playerPos);
      if (!spawnPos) break; // Could not find clear water

      const fleetId = String(this.nextFleetId++);
      const instance = this.createInstance(fleetId, template, spawnPos, basin);
      this.activeFleets.set(fleetId, instance);
    }

    this.syncToGlobalState();
  }

  /**
   * Synchronizes active NPC fleets into state.fleets so all subsystems can read them.
   */
  public syncToGlobalState(): void {
    // Retain fleet '1' (player)
    const playerFleet = state.fleets['1'] || state.fleets[1];

    // Remove any old NPC fleet keys in state.fleets that are no longer active
    for (const key of Object.keys(state.fleets)) {
      if (key !== '1' && !this.activeFleets.has(key)) {
        delete state.fleets[key];
      }
    }

    // Add or update active NPC fleets
    for (const [id, fleet] of this.activeFleets) {
      state.fleets[id] = {
        position: { x: fleet.position.x, y: fleet.position.y },
        ships: fleet.ships,
        // Custom metadata attached for HUD, hail dialogs, and combat
        ...({
          id,
          name: fleet.name,
          captainName: fleet.captainName,
          nation: fleet.nation,
          archetype: fleet.archetype,
          dialogRumor: fleet.dialogRumor,
          bountyGold: fleet.bountyGold,
          hostile: fleet.hostile,
        } as any),
      };
    }

    if (playerFleet) {
      state.fleets['1'] = playerFleet;
    }
  }

  /**
   * Despawns fleets that have sailed beyond the active despawn threshold.
   */
  private cullDistantFleets(playerPos: Position): void {
    for (const [id, fleet] of this.activeFleets) {
      let dx = Math.abs(playerPos.x - fleet.position.x);
      if (dx > 1080) dx = 2160 - dx;
      const dy = Math.abs(playerPos.y - fleet.position.y);
      const dist = Math.hypot(dx, dy);

      if (dist > DESPAWN_DISTANCE) {
        this.activeFleets.delete(id);
        delete state.fleets[id];
      }
    }
  }

  /**
   * Instantiates an active fleet from a regional template.
   */
  private createInstance(
    id: string,
    template: NpcFleetTemplate,
    position: Position,
    basin: RegionalBasin,
  ): NpcFleetInstance {
    const ships: Ship[] = template.ships.map((s) => ({
      id: s.shipTypeId,
      name: s.name,
      crew: s.crew,
      durability: s.durability,
      cargo: [...s.cargo],
    }));

    const directions: Direction[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
    const randomHeading = directions[Math.floor(Math.random() * directions.length)];

    return {
      id,
      templateId: template.templateId,
      name: template.name,
      captainName: template.captainName,
      nation: template.nation,
      archetype: template.archetype,
      flagshipId: template.flagshipId,
      position,
      heading: randomHeading,
      ships,
      tradeRoute: [...template.tradeRoute],
      currentRouteTargetIndex: 0,
      dialogRumor: template.dialogRumor,
      bountyGold: template.bountyGold,
      hostile: template.hostile,
      spawnBasin: basin,
    };
  }

  /**
   * Finds a safe 2x2 water spawn coordinate in the vicinity of playerPos (or near route origin).
   */
  private findWaterSpawnPosition(template: NpcFleetTemplate, playerPos: Position): Position | null {
    // 1. Try spawning along the fleet's assigned trade route
    try {
      const portId = template.tradeRoute[0];
      const port = getPortData(portId);
      if (port && port.position) {
        const portPos = port.position;
        // Search a ring around port 8..25 tiles away in open water
        for (let attempt = 0; attempt < 12; attempt++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 10 + Math.random() * 20;
          const testX = ((Math.round(portPos.x + Math.cos(angle) * dist) % 2160) + 2160) % 2160;
          const testY = Math.max(10, Math.min(1070, Math.round(portPos.y + Math.sin(angle) * dist)));
          if (this.isWater2x2(testX, testY)) {
            return { x: testX, y: testY };
          }
        }
      }
    } catch {}

    // 2. Try spawning in an oceanic ring around the player (radius 25..80 tiles)
    for (let attempt = 0; attempt < 24; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 50;
      const testX = ((Math.round(playerPos.x + Math.cos(angle) * dist) % 2160) + 2160) % 2160;
      const testY = Math.max(10, Math.min(1070, Math.round(playerPos.y + Math.sin(angle) * dist)));
      if (this.isWater2x2(testX, testY)) {
        return { x: testX, y: testY };
      }
    }

    return null;
  }

  /**
   * Validates that all 4 tiles of a 2x2 ship footprint are navigable ocean (tile < 50).
   */
  public isWater2x2(x: number, y: number): boolean {
    let tilemap: Uint8Array | null = null;
    try {
      tilemap = Assets.data('worldTilemap');
    } catch {
      tilemap = null;
    }

    if (!tilemap || tilemap.length < 2160 * 1080) {
      // In mock/test environments without full tilemap, avoid extreme polar rows
      return y >= 20 && y <= 1060;
    }

    for (let sy = 0; sy < 2; sy++) {
      for (let sx = 0; sx < 2; sx++) {
        const tx = ((Math.floor(x + sx) % 2160) + 2160) % 2160;
        const ty = Math.floor(y + sy);
        if (ty < 0 || ty >= 1080) return false;
        if (tilemap[ty * 2160 + tx] >= 50) return false; // Land
      }
    }
    return true;
  }

  /**
   * Resets active fleets back to single-player baseline (only fleet '1' remains).
   */
  public reset(): void {
    this.activeFleets.clear();
    this.nextFleetId = 2;
    this.lastBasin = null;
    this.lastSpawnCheckPos = null;

    // Purge non-player fleets from state
    for (const key of Object.keys(state.fleets)) {
      if (key !== '1') {
        delete state.fleets[key];
      }
    }
  }
}

export const npcFleetManager = new NpcFleetManager();
export default npcFleetManager;
