import portsConfig from '../../data/ports.json';
import { Position } from '../../types';
import { BuildingLocations, regularPorts, supplyPorts } from '../../data/portData';
import { PortData } from './portUtils';
import { MarketId, RegionId } from '../../data/portExtraData';
import { IndustryId } from '../../data/portShipyardData';
import { logger } from '../../logger';

export type ArchetypeId =
  | 'mediterranean'
  | 'north_europe'
  | 'islamic'
  | 'supply'
  | 'east_asian'
  | 'new_world';

export interface ArchetypeDefinition {
  name: string;
  tileset: number;
  templateTilemap: number;
  buildings: BuildingLocations;
}

export interface CustomPortDefinition {
  id: string;
  name: string;
  position: Position;
  economy: number;
  industry: number;
  allegiances?: number[];
  regionId: string;
  archetype: ArchetypeId;
  isSupplyPort?: boolean;
  marketId?: string;
  industryId?: string;
  itemShop?: {
    regular: string[];
    secret?: string;
  };
  buildings?: BuildingLocations;
  tileset?: number;
  tilemap?: number;
}

class PortRegistry {
  private archetypes: Record<string, ArchetypeDefinition> = {};
  private customPorts: Map<string, CustomPortDefinition> = new Map();

  constructor() {
    this.loadFromConfig(portsConfig);
  }

  public loadFromConfig(config: any) {
    if (config?.archetypes) {
      this.archetypes = { ...config.archetypes };
    }
    if (Array.isArray(config?.customPorts)) {
      config.customPorts.forEach((p: CustomPortDefinition) => {
        this.registerCustomPort(p);
      });
    }
  }

  public registerCustomPort(port: CustomPortDefinition): void {
    const builtinTotal = regularPorts.length + supplyPorts.length;
    const portNum = Number(port.id);
    if (!isNaN(portNum) && portNum >= 1 && portNum <= builtinTotal) {
      logger.warn(
        'PortRegistry',
        `Custom port ID conflict! Port '${port.name}' (ID: ${port.id}) overlaps with built-in port (1-${builtinTotal}). Custom ports must use ID ${builtinTotal + 1} or higher.`,
      );
    }
    this.customPorts.set(port.id, port);
  }

  public isCustomPort(id: string): boolean {
    return this.customPorts.has(id);
  }

  public getCustomPort(id: string): CustomPortDefinition | undefined {
    return this.customPorts.get(id);
  }

  public getAllCustomPorts(): CustomPortDefinition[] {
    return Array.from(this.customPorts.values());
  }

  public getArchetype(archetypeId: string): ArchetypeDefinition | undefined {
    return this.archetypes[archetypeId];
  }

  /**
   * Procedural Layout Mapping: Builds full PortData for a custom port by
   * combining custom parameters with archetype template defaults.
   */
  public buildPortData(id: string): PortData | null {
    const custom = this.customPorts.get(id);
    if (!custom) {
      return null;
    }

    const archetype = this.archetypes[custom.archetype] || this.archetypes.supply;
    const isSupply = custom.isSupplyPort ?? (custom.archetype === 'supply');

    const buildings: BuildingLocations =
      custom.buildings || archetype?.buildings || { '4': { x: 62, y: 54 } };
    const tileset = custom.tileset ?? archetype?.tileset ?? 3;
    const tilemap = custom.tilemap ?? archetype?.templateTilemap ?? 100;

    if (isSupply) {
      return {
        id: custom.id,
        name: custom.name,
        position: { ...custom.position },
        buildings,
        tileset: 3,
        isSupplyPort: true,
        tilemap,
      } as PortData;
    }

    return {
      id: custom.id,
      name: custom.name,
      position: { ...custom.position },
      economy: custom.economy,
      industry: custom.industry,
      allegiances: custom.allegiances || [0, 0, 0, 0, 0, 0],
      regionId: (custom.regionId || '1') as RegionId,
      itemShop: custom.itemShop,
      marketId: (custom.marketId || '1') as MarketId,
      industryId: (custom.industryId || '1') as IndustryId,
      buildings,
      tileset,
      isSupplyPort: false,
      tilemap,
    } as PortData;
  }
}

export const portRegistry = new PortRegistry();
export default portRegistry;
