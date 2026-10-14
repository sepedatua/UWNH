/**
 * explorationManager.ts
 * Sector Cartography & Exploration Bitmask Engine
 *
 * Divides the 2160x1080 Uncharted Waters world into authentic 20x20 tile nautical sectors (108 x 54 = 5,832 sectors).
 * Tracks charted vs uncharted sectors, handles sight radius reveals, regional chart purchases,
 * and cartography guild bounty reporting.
 */

import { WORLD_MAP_COLUMNS, WORLD_MAP_ROWS } from '../../constants';

export const SECTOR_SIZE = 20; // 20x20 tiles per sector (chunky retro feel)
export const SECTORS_X = Math.floor(WORLD_MAP_COLUMNS / SECTOR_SIZE); // 2160 / 20 = 108
export const SECTORS_Y = Math.floor(WORLD_MAP_ROWS / SECTOR_SIZE); // 1080 / 20 = 54
export const TOTAL_SECTORS = SECTORS_X * SECTORS_Y; // 5,832 sectors

export type RegionalChartKey =
  | 'mediterranean'
  | 'north_europe'
  | 'caribbean'
  | 'indian_ocean'
  | 'far_east';

export interface RegionalChart {
  key: RegionalChartKey;
  name: string;
  price: number;
  description: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export const REGIONAL_CHARTS: Record<RegionalChartKey, RegionalChart> = {
  mediterranean: {
    key: 'mediterranean',
    name: 'Mediterranean & Iberian Sea Chart',
    price: 3000,
    description: 'Detailed nautical charts of Portugal, Spain, Italy, and the Barbary Coast.',
    minX: 800,
    maxX: 1120,
    minY: 320,
    maxY: 440,
  },
  north_europe: {
    key: 'north_europe',
    name: 'North & Baltic Seas Chart',
    price: 3500,
    description: 'Hydrographic soundings of England, the Netherlands, and Scandinavian fjords.',
    minX: 800,
    maxX: 1080,
    minY: 160,
    maxY: 320,
  },
  caribbean: {
    key: 'caribbean',
    name: 'West Indies & Caribbean Chart',
    price: 8000,
    description: 'Spanish colonial charts of the Antilles, Bahamas, and Spanish Main.',
    minX: 360,
    maxX: 560,
    minY: 400,
    maxY: 540,
  },
  indian_ocean: {
    key: 'indian_ocean',
    name: 'Indian Ocean & Arabian Sea Chart',
    price: 12000,
    description: 'Portuguese trade routes around Africa, the Red Sea, and the Malabar coast.',
    minX: 1060,
    maxX: 1460,
    minY: 460,
    maxY: 800,
  },
  far_east: {
    key: 'far_east',
    name: 'Spice Islands & China Seas Chart',
    price: 18000,
    description: 'Rare charts of the Malacca Strait, Moluccas, Ming dynasty, and Zipangu.',
    minX: 1440,
    maxX: 1760,
    minY: 340,
    maxY: 640,
  },
};

export const TOTAL_TILES = WORLD_MAP_COLUMNS * WORLD_MAP_ROWS; // 2,332,800 world tiles

class ExplorationManager {
  private explored: Uint8Array = new Uint8Array(Math.ceil(TOTAL_SECTORS / 8));
  private tileExplored: Uint8Array = new Uint8Array(Math.ceil(TOTAL_TILES / 8));
  private reportedCount: number = 0;
  private changeListeners: Set<() => void> = new Set();

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.explored.fill(0);
    this.tileExplored.fill(0);
    this.reportedCount = 0;
    this.notify();
  }

  public getSectorCoordinates(sectorIndex: number): { x: number; y: number } {
    const y = Math.floor(sectorIndex / SECTORS_X);
    const x = sectorIndex % SECTORS_X;
    return { x, y };
  }

  public getSectorIndex(sectorX: number, sectorY: number): number {
    const wrappedX = ((sectorX % SECTORS_X) + SECTORS_X) % SECTORS_X;
    const clampedY = Math.max(0, Math.min(SECTORS_Y - 1, sectorY));
    return clampedY * SECTORS_X + wrappedX;
  }

  public isSectorExplored(sectorX: number, sectorY: number): boolean {
    const idx = this.getSectorIndex(sectorX, sectorY);
    const byteIndex = Math.floor(idx / 8);
    const bitOffset = idx % 8;
    return (this.explored[byteIndex] & (1 << bitOffset)) !== 0;
  }

  public isPositionExplored(worldX: number, worldY: number): boolean {
    const sectorX = Math.floor(worldX / SECTOR_SIZE);
    const sectorY = Math.floor(worldY / SECTOR_SIZE);
    return this.isSectorExplored(sectorX, sectorY);
  }

  public isTileExplored(worldX: number, worldY: number): boolean {
    const wrappedX = ((Math.floor(worldX) % WORLD_MAP_COLUMNS) + WORLD_MAP_COLUMNS) % WORLD_MAP_COLUMNS;
    const clampedY = Math.max(0, Math.min(WORLD_MAP_ROWS - 1, Math.floor(worldY)));
    const idx = clampedY * WORLD_MAP_COLUMNS + wrappedX;
    return (this.tileExplored[idx >> 3] & (1 << (idx & 7))) !== 0;
  }

  public markTileExplored(worldX: number, worldY: number): boolean {
    const wrappedX = ((Math.floor(worldX) % WORLD_MAP_COLUMNS) + WORLD_MAP_COLUMNS) % WORLD_MAP_COLUMNS;
    const clampedY = Math.max(0, Math.min(WORLD_MAP_ROWS - 1, Math.floor(worldY)));
    const idx = clampedY * WORLD_MAP_COLUMNS + wrappedX;
    const byte = idx >> 3;
    const mask = 1 << (idx & 7);
    if ((this.tileExplored[byte] & mask) !== 0) {
      return false; // already explored
    }
    this.tileExplored[byte] |= mask;
    return true;
  }

  public markSectorExplored(sectorX: number, sectorY: number): boolean {
    const idx = this.getSectorIndex(sectorX, sectorY);
    const byteIndex = Math.floor(idx / 8);
    const bitOffset = idx % 8;

    const mask = 1 << bitOffset;
    if ((this.explored[byteIndex] & mask) !== 0) {
      return false; // already explored
    }

    this.explored[byteIndex] |= mask;
    return true;
  }

  /**
   * Reveals all sectors and individual 32x32 tiles within line of sight of the player's flagship.
   * Handles cylindrical X-wrap.
   */
  public revealAroundPosition(worldX: number, worldY: number, sightRadiusTiles: number): number {
    let newlyExplored = 0;

    // 1. Reveal individual 32x32 world tiles within Euclidean sight radius
    const radiusInt = Math.ceil(sightRadiusTiles);
    const r2 = sightRadiusTiles * sightRadiusTiles;
    const roundedX = Math.round(worldX);
    const roundedY = Math.round(worldY);

    for (let dy = -radiusInt; dy <= radiusInt; dy++) {
      const ty = roundedY + dy;
      if (ty < 0 || ty >= WORLD_MAP_ROWS) continue;
      for (let dx = -radiusInt; dx <= radiusInt; dx++) {
        if (dx * dx + dy * dy <= r2) {
          const tx = ((roundedX + dx) % WORLD_MAP_COLUMNS + WORLD_MAP_COLUMNS) % WORLD_MAP_COLUMNS;
          this.markTileExplored(tx, ty);
        }
      }
    }

    // 2. Reveal macro sectors for World Atlas & Guild cartography
    const centerSectorX = Math.floor(worldX / SECTOR_SIZE);
    const centerSectorY = Math.floor(worldY / SECTOR_SIZE);
    const sectorRadius = Math.ceil(sightRadiusTiles / SECTOR_SIZE) + 1;

    for (let dy = -sectorRadius; dy <= sectorRadius; dy++) {
      const sy = centerSectorY + dy;
      if (sy < 0 || sy >= SECTORS_Y) continue;

      for (let dx = -sectorRadius; dx <= sectorRadius; dx++) {
        const sx = centerSectorX + dx;

        // Check if sector boundary is within sight radius
        const sectorWorldCenterX = sx * SECTOR_SIZE + SECTOR_SIZE / 2;
        const sectorWorldCenterY = sy * SECTOR_SIZE + SECTOR_SIZE / 2;

        let deltaX = Math.abs(sectorWorldCenterX - worldX);
        if (deltaX > WORLD_MAP_COLUMNS / 2) {
          deltaX = WORLD_MAP_COLUMNS - deltaX;
        }
        const deltaY = Math.abs(sectorWorldCenterY - worldY);

        const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        // Slightly generous check to ensure satisfying sector reveal
        if (dist <= sightRadiusTiles + SECTOR_SIZE * 0.75) {
          if (this.markSectorExplored(sx, sy)) {
            newlyExplored++;
          }
        }
      }
    }

    if (newlyExplored > 0) {
      this.notify();
    }
    return newlyExplored;
  }

  /**
   * Unlocks all sectors and world tiles inside a regional chart bounding box.
   */
  public unlockRegionalChart(chartKey: RegionalChartKey): number {
    const chart = REGIONAL_CHARTS[chartKey];
    if (!chart) return 0;

    // Reveal individual 32x32 tiles in chart
    for (let y = chart.minY; y <= chart.maxY; y++) {
      for (let x = chart.minX; x <= chart.maxX; x++) {
        this.markTileExplored(x, y);
      }
    }

    const minSecX = Math.floor(chart.minX / SECTOR_SIZE);
    const maxSecX = Math.floor(chart.maxX / SECTOR_SIZE);
    const minSecY = Math.floor(chart.minY / SECTOR_SIZE);
    const maxSecY = Math.floor(chart.maxY / SECTOR_SIZE);

    let count = 0;
    for (let sy = minSecY; sy <= maxSecY; sy++) {
      for (let sx = minSecX; sx <= maxSecX; sx++) {
        if (this.markSectorExplored(sx, sy)) {
          count++;
        }
      }
    }

    if (count > 0) {
      this.notify();
    }
    return count;
  }

  public getExploredCount(): number {
    let count = 0;
    for (let i = 0; i < this.explored.length; i++) {
      let b = this.explored[i];
      while (b > 0) {
        count += b & 1;
        b >>= 1;
      }
    }
    return count;
  }

  public getExplorationProgress(): {
    totalSectors: number;
    exploredSectors: number;
    percentage: number;
  } {
    const explored = this.getExploredCount();
    const percentage = parseFloat(((explored / TOTAL_SECTORS) * 100).toFixed(1));
    return {
      totalSectors: TOTAL_SECTORS,
      exploredSectors: explored,
      percentage,
    };
  }

  /**
   * Submits newly charted sectors to the Cartography Guild.
   */
  public submitCartographyAtlas(): {
    newlyReported: number;
    goldEarned: number;
    fameEarned: number;
  } {
    const current = this.getExploredCount();
    const newlyReported = Math.max(0, current - this.reportedCount);

    if (newlyReported <= 0) {
      return { newlyReported: 0, goldEarned: 0, fameEarned: 0 };
    }

    const goldEarned = newlyReported * 25; // 25 gold per 20x20 nautical sector
    const fameEarned = Math.max(1, Math.floor(newlyReported * 6)); // 6 Adventure Fame per sector
    this.reportedCount = current;

    this.notify();
    return { newlyReported, goldEarned, fameEarned };
  }

  public getReportedCount(): number {
    return this.reportedCount;
  }

  public setReportedCount(count: number): void {
    this.reportedCount = count;
  }

  /* ---------------- Serialization / Persistence ---------------- */

  public exportBase64(): string {
    let binary = '';
    const bytes = this.explored;
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  public importBase64(base64: string): boolean {
    try {
      const binary = atob(base64);
      const len = Math.min(binary.length, this.explored.length);
      for (let i = 0; i < len; i++) {
        this.explored[i] = binary.charCodeAt(i);
      }
      this.syncTilesFromSectors();
      this.notify();
      return true;
    } catch (e) {
      console.warn('Failed to import exploration base64:', e);
      return false;
    }
  }

  /**
   * Automatically synchronizes world tile visibility from explored sectors.
   * Ensures previously saved or unlocked sectors are fully revealed on the sailing screen.
   */
  public syncTilesFromSectors(): void {
    for (let sy = 0; sy < SECTORS_Y; sy++) {
      for (let sx = 0; sx < SECTORS_X; sx++) {
        if (this.isSectorExplored(sx, sy)) {
          const startX = sx * SECTOR_SIZE;
          const startY = sy * SECTOR_SIZE;
          for (let dy = 0; dy < SECTOR_SIZE; dy++) {
            const ty = startY + dy;
            if (ty >= WORLD_MAP_ROWS) continue;
            for (let dx = 0; dx < SECTOR_SIZE; dx++) {
              const tx = (startX + dx) % WORLD_MAP_COLUMNS;
              this.markTileExplored(tx, ty);
            }
          }
        }
      }
    }
  }

  public subscribe(cb: () => void): () => void {
    this.changeListeners.add(cb);
    return () => this.changeListeners.delete(cb);
  }

  private notify(): void {
    this.changeListeners.forEach((cb) => cb());
  }
}

export const explorationManager = new ExplorationManager();
export default explorationManager;
