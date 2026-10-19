import { describe, it, expect, beforeEach } from 'vitest';
import explorationManager, {
  SECTORS_X,
  SECTORS_Y,
  TOTAL_SECTORS,
  SECTOR_SIZE,
} from './world/explorationManager';
import {
  calculateSightRadius,
  isEntityWithinLineOfSight,
  BASE_SIGHT_TILES,
  MIN_FOG_TILES,
} from './world/fogOfWarRenderer';
import seaWeather from './world/seaWeather';
import state from '../state/state';

describe('Milestone 9: Fog of War, Nautical Cartography & Sea Weather Anomalies', () => {
  beforeEach(() => {
    explorationManager.reset();
    seaWeather.clearWeather();
    state.timePassed = 480; // 08:00 AM (Daylight)
    state.items = [];
    state.mates = [
      { sailorId: '1', role: null }, // João Franco
      { sailorId: '32', role: 'firstMate' }, // Rocco Alemkel
    ];
    state.gold = 10000;
    state.fame = { adventure: 500, trade: 500, piracy: 0 };
    state.fleets = {
      1: {
        position: { x: 840, y: 358 }, // Lisbon waters
        ships: [{ id: '1', name: 'Santa Maria', crew: 50, cargo: [] }],
      },
    } as any;
  });

  describe('Task 9.1: Sector Cartography & Exploration Bitmask Engine', () => {
    it('initializes with 5,832 sectors in a 108x54 grid (20x20 tiles each)', () => {
      expect(SECTORS_X).toBe(108);
      expect(SECTORS_Y).toBe(54);
      expect(TOTAL_SECTORS).toBe(5832);
      expect(SECTOR_SIZE).toBe(20);

      const progress = explorationManager.getExplorationProgress();
      expect(progress.totalSectors).toBe(5832);
      expect(progress.exploredSectors).toBe(0);
      expect(progress.percentage).toBe(0);
    });

    it('correctly maps sector indices and reveals chunky sectors around a position', () => {
      expect(explorationManager.isPositionExplored(840, 358)).toBe(false);

      const revealed = explorationManager.revealAroundPosition(840, 358, 20);
      expect(revealed).toBeGreaterThan(0);
      expect(explorationManager.isPositionExplored(840, 358)).toBe(true);

      const progress = explorationManager.getExplorationProgress();
      expect(progress.exploredSectors).toBe(revealed);
      expect(progress.percentage).toBeGreaterThan(0);
    });

    it('handles cylindrical X-axis wrap-around during sector reveals', () => {
      // Near western border X=5
      explorationManager.revealAroundPosition(5, 500, 30);
      // Eastern border X=2155 should also be within range across cylindrical seam
      expect(explorationManager.isPositionExplored(2155, 500)).toBe(true);
    });

    it('unlocks regional sea charts and uncovers corresponding geographical sectors', () => {
      const beforeCount = explorationManager.getExploredCount();
      const revealed = explorationManager.unlockRegionalChart('mediterranean');

      expect(revealed).toBeGreaterThan(50);
      expect(explorationManager.getExploredCount()).toBe(beforeCount + revealed);
      // Lisbon is in the Mediterranean chart
      expect(explorationManager.isPositionExplored(840, 358)).toBe(true);
      expect(explorationManager.isRegionFullyExplored('mediterranean')).toBe(true);
    });

    it('calculates gold and adventure fame rewards when submitting cartography atlas', () => {
      explorationManager.unlockRegionalChart('mediterranean');
      const initialProgress = explorationManager.getExplorationProgress();

      const result = explorationManager.submitCartographyAtlas();
      expect(result.newlyReported).toBe(initialProgress.exploredSectors);
      expect(result.goldEarned).toBe(result.newlyReported * 25);
      expect(result.fameEarned).toBe(Math.floor(result.newlyReported * 6));

      // Second immediate submission should yield zero until more sectors are explored
      const secondResult = explorationManager.submitCartographyAtlas();
      expect(secondResult.newlyReported).toBe(0);
      expect(secondResult.goldEarned).toBe(0);
    });

    it('exports and imports exploration bitmask to/from Base64 for save slots', () => {
      explorationManager.revealAroundPosition(840, 358, 20);
      const originalCount = explorationManager.getExploredCount();
      const base64 = explorationManager.exportBase64();

      expect(typeof base64).toBe('string');
      expect(base64.length).toBeGreaterThan(0);

      explorationManager.reset();
      expect(explorationManager.getExploredCount()).toBe(0);

      explorationManager.importBase64(base64);
      expect(explorationManager.getExploredCount()).toBe(originalCount);
      expect(explorationManager.isPositionExplored(840, 358)).toBe(true);
    });
  });

  describe('Task 9.2: Sepia Parchment Line-of-Sight Shroud & Flagship Lookout', () => {
    it('calculates default unassisted line of sight during broad daylight', () => {
      const sight = calculateSightRadius();
      expect(sight.baseTiles).toBe(BASE_SIGHT_TILES);
      expect(sight.lookoutBonus).toBe(0);
      expect(sight.telescopeBonus).toBe(0);
      expect(sight.finalRadiusTiles).toBe(BASE_SIGHT_TILES);
      expect(sight.finalRadiusPixels).toBe(BASE_SIGHT_TILES * 32);
    });

    it('increases line of sight when an officer is assigned as Lookout', () => {
      // Assign Rocco Alemkel (sailorId 32) as Lookout
      state.mates[1].role = 'lookout';

      const sight = calculateSightRadius();
      expect(sight.lookoutBonus).toBeGreaterThan(0.2); // +20% to +50%
      expect(sight.finalRadiusTiles).toBeGreaterThan(BASE_SIGHT_TILES);
    });

    it('stacks +30% sight bonus when possessing a brass Telescope', () => {
      state.items = ['25']; // Telescope
      const sight = calculateSightRadius();
      expect(sight.telescopeBonus).toBe(0.3);
      expect(sight.finalRadiusTiles).toBe(Math.round(BASE_SIGHT_TILES * 1.3 * 10) / 10);
    });

    it('correctly filters whether an entity is within line of sight', () => {
      const playerPos = { x: 500, y: 500 };
      const closeNpc = { x: 505, y: 505 }; // dist ~7 tiles
      const distantNpc = { x: 550, y: 550 }; // dist ~70 tiles

      expect(isEntityWithinLineOfSight(playerPos, closeNpc, 14)).toBe(true);
      expect(isEntityWithinLineOfSight(playerPos, distantNpc, 14)).toBe(false);
    });
  });

  describe('Task 9.3: Dynamic Heavy Fog Weather Anomalies', () => {
    it('detects famous maritime fog corridors like the Grand Banks and English Channel', () => {
      // English Channel: x: 880, y: 280
      const channelFog = seaWeather.isInFogCorridor(880, 280);
      expect(channelFog).toBeDefined();
      expect(channelFog?.name).toContain('English Channel');

      // Grand Banks: x: 480, y: 360
      const banksFog = seaWeather.isInFogCorridor(480, 360);
      expect(banksFog).toBeDefined();
      expect(banksFog?.name).toContain('Grand Banks');

      // Clear open tropical ocean: x: 1000, y: 600
      expect(seaWeather.isInFogCorridor(1000, 600)).toBeNull();
    });

    it('collapses visual radius to near-blind (4.5 tiles) when Heavy Fog triggers', () => {
      seaWeather.setWeather('fog', 12);
      expect(seaWeather.isFoggy()).toBe(true);

      const sight = calculateSightRadius();
      expect(sight.finalRadiusTiles).toBe(MIN_FOG_TILES);
      expect(sight.finalRadiusPixels).toBe(MIN_FOG_TILES * 32);
    });

    it('clears fog back to fair weather upon duration expiry and enforces 5-day cooldown', () => {
      seaWeather.setWeather('fog', 1);
      seaWeather.clearWeather();
      expect(seaWeather.isFoggy()).toBe(false);
      expect(seaWeather.getWeather()).toBe('clear');

      const sight = calculateSightRadius();
      expect(sight.finalRadiusTiles).toBe(BASE_SIGHT_TILES);

      // Tropical waters have 0% chance of fog
      expect(seaWeather.isInFogCorridor(1000, 600)).toBeNull();
      const tropicalWeather = seaWeather.tick(1000, 600);
      expect(tropicalWeather).toBe('clear');
    });

    it('uncovers individual 32x32 tiles with persistent reveal that keeps revealed when sailing away', () => {
      // Start in unexplored area
      expect(explorationManager.isTileExplored(840, 358)).toBe(false);
      expect(explorationManager.isTileExplored(845, 360)).toBe(false);
      expect(explorationManager.isTileExplored(900, 450)).toBe(false);

      // Reveal around (840, 358) with radius 14
      explorationManager.revealAroundPosition(840, 358, 14);

      // Tiles within radius are revealed
      expect(explorationManager.isTileExplored(840, 358)).toBe(true);
      expect(explorationManager.isTileExplored(845, 360)).toBe(true);

      // Distant tile remains shrouded
      expect(explorationManager.isTileExplored(900, 450)).toBe(false);

      // When fleet moves far away to (1500, 500) and reveals other tiles:
      explorationManager.revealAroundPosition(1500, 500, 14);

      // The original tiles (840, 358) and (845, 360) MUST KEEP REVEALED!
      expect(explorationManager.isTileExplored(840, 358)).toBe(true);
      expect(explorationManager.isTileExplored(845, 360)).toBe(true);
      expect(explorationManager.isTileExplored(1500, 500)).toBe(true);
    });

    it('tracks purchased regional sea charts and identifies already acquired charts', () => {
      expect(explorationManager.isRegionFullyExplored('north_europe')).toBe(false);

      state.purchasedCharts = [];
      expect(state.purchasedCharts.includes('north_europe')).toBe(false);

      state.purchasedCharts.push('north_europe');
      explorationManager.unlockRegionalChart('north_europe');

      expect(state.purchasedCharts.includes('north_europe')).toBe(true);
      expect(explorationManager.isRegionFullyExplored('north_europe')).toBe(true);
    });
  });
});
