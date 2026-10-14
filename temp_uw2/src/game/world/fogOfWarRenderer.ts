/**
 * fogOfWarRenderer.ts
 * Sepia Parchment Fog of War Shroud & Dynamic Line-of-Sight Engine
 *
 * Implements:
 * - Line-of-sight radius calculation (Base + Lookout role bonus + Telescope item + Day/Night - Heavy Fog)
 * - Authentic 16th-century sepia parchment / cloud mist outer shroud
 * - Rolling atmospheric mist particles during Heavy Fog weather anomalies
 * - Entity visibility filtering (concealing distant pirates, merchants, and ghost fleets)
 */

import state from '../../state/state';
import { getMates, getTimeOfDay } from '../../state/selectors';
import seaWeather from './seaWeather';
import { Position } from '../../types';
import { TILE_SIZE, WORLD_MAP_COLUMNS, WORLD_MAP_ROWS } from '../../constants';
import explorationManager from './explorationManager';

export interface SightRadiusBreakdown {
  baseTiles: number;
  lookoutBonus: number;
  telescopeBonus: number;
  timeOfDayFactor: number;
  weatherFactor: number;
  finalRadiusTiles: number;
  finalRadiusPixels: number;
}

export const BASE_SIGHT_TILES = 14; // Default unassisted line-of-sight (~448 pixels)
export const MIN_FOG_TILES = 4.5; // Dense fog blind lantern cone (~144 pixels)

/**
 * Calculates the fleet's active line-of-sight in world tiles and pixels.
 */
export const calculateSightRadius = (): SightRadiusBreakdown => {
  const baseTiles = BASE_SIGHT_TILES;

  // 1. Heavy Fog Override
  if (seaWeather.isFoggy()) {
    return {
      baseTiles,
      lookoutBonus: 0,
      telescopeBonus: 0,
      timeOfDayFactor: 1.0,
      weatherFactor: MIN_FOG_TILES / baseTiles,
      finalRadiusTiles: MIN_FOG_TILES,
      finalRadiusPixels: MIN_FOG_TILES * TILE_SIZE,
    };
  }

  // 2. Lookout Officer Bonus
  let lookoutBonus = 0;
  const mates = getMates();
  const lookoutMate = mates.find((m) => m.role === 'lookout');
  if (lookoutMate) {
    const intuition = lookoutMate.stats?.intuition || 60;
    const knowledge = lookoutMate.stats?.knowledge || 60;
    lookoutBonus = Math.min(0.5, ((intuition + knowledge) / 200) * 0.5); // +15% to +50%
  }

  // 3. Brass Telescope Bonus (+30%)
  const hasTelescope = (state.items || []).includes('25');
  const telescopeBonus = hasTelescope ? 0.3 : 0;

  // 4. Time of Day Lighting
  const time = getTimeOfDay();
  let timeOfDayFactor = 1.0;
  // Night hours (approx 20:00 to 06:00 = 1200 mins to 360 mins)
  if (time >= 1200 || time < 360) {
    timeOfDayFactor = lookoutMate ? 0.8 : 0.65;
  } else if ((time >= 360 && time < 480) || (time >= 1080 && time < 1200)) {
    timeOfDayFactor = 0.85; // Dawn / Dusk
  }

  // 5. Storm Weather Reduction
  const weatherFactor = seaWeather.isStormy() ? 0.65 : 1.0;

  const rawRadius = baseTiles * (1.0 + lookoutBonus + telescopeBonus) * timeOfDayFactor * weatherFactor;
  const finalRadiusTiles = Math.max(MIN_FOG_TILES, Math.round(rawRadius * 10) / 10);
  const finalRadiusPixels = finalRadiusTiles * TILE_SIZE;

  return {
    baseTiles,
    lookoutBonus,
    telescopeBonus,
    timeOfDayFactor,
    weatherFactor,
    finalRadiusTiles,
    finalRadiusPixels,
  };
};

/**
 * Checks whether an entity is within the fleet's line of sight,
 * correctly accounting for cylindrical world X-wrap.
 */
export const isEntityWithinLineOfSight = (
  playerPos: Position,
  targetPos: Position,
  sightRadiusTiles: number,
): boolean => {
  let deltaX = Math.abs(playerPos.x - targetPos.x);
  if (deltaX > WORLD_MAP_COLUMNS / 2) {
    deltaX = WORLD_MAP_COLUMNS - deltaX;
  }
  const deltaY = Math.abs(playerPos.y - targetPos.y);
  const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  return dist <= sightRadiusTiles;
};

/**
 * Renders the authentic retro 16-bit tile-aligned Fog of War shroud.
 * Covers uncharted 32x32 tiles with antique sepia parchment.
 * Explored tiles remain permanently revealed.
 */
export const renderFogOfWarTiles = (
  ctx: CanvasRenderingContext2D,
  camera: Position & { width: number; height: number },
  canvasWidth: number,
  canvasHeight: number,
): void => {
  const startCol = Math.floor(camera.x);
  const startRow = Math.floor(camera.y);
  const subTileOffsetX = Math.floor((camera.x % 1) * TILE_SIZE);
  const subTileOffsetY = Math.floor((camera.y % 1) * TILE_SIZE);

  const cols = Math.ceil(canvasWidth / TILE_SIZE) + 2;
  const rows = Math.ceil(canvasHeight / TILE_SIZE) + 2;

  ctx.save();

  for (let r = 0; r < rows; r++) {
    const worldY = startRow + r;
    const screenY = r * TILE_SIZE - subTileOffsetY;

    if (worldY < 0 || worldY >= WORLD_MAP_ROWS) {
      // Polar ice / world edge outside rows
      ctx.fillStyle = '#caa373';
      ctx.fillRect(0, screenY, canvasWidth, TILE_SIZE);
      continue;
    }

    for (let c = 0; c < cols; c++) {
      const worldX = ((startCol + c) % WORLD_MAP_COLUMNS + WORLD_MAP_COLUMNS) % WORLD_MAP_COLUMNS;
      const screenX = c * TILE_SIZE - subTileOffsetX;

      // Pure 16-bit retro staircase jagged edges matching shoreline tiles exactly!
      if (!explorationManager.isTileExplored(worldX, worldY)) {
        // Tile is uncharted: render vintage antique sepia parchment
        const checker = (worldX + worldY) % 2 === 0;
        ctx.fillStyle = checker ? '#c8a170' : '#caa373';
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // Subtle retro cartographic gridline/grain
        ctx.fillStyle = 'rgba(150, 115, 75, 0.15)';
        ctx.fillRect(screenX, screenY, TILE_SIZE, 1);
        ctx.fillRect(screenX, screenY, 1, TILE_SIZE);
      }
    }
  }

  ctx.restore();
};

/**
 * Renders rolling white mist particles during Heavy Fog anomalies.
 * Translucent overlay allowing charted waters to remain visible underneath.
 */
export const renderHeavyFogMistOverlay = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
): void => {
  if (!seaWeather.isFoggy()) return;

  const offset = seaWeather.getMistOffset();

  ctx.save();

  // Translucent rolling sea mist layer
  ctx.fillStyle = 'rgba(235, 230, 218, 0.38)';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Drifting horizontal cloud bands
  ctx.fillStyle = 'rgba(255, 255, 250, 0.32)';
  for (let y = 0; y < canvasHeight; y += 60) {
    const wave = Math.sin((y + offset * 1.5) * 0.04) * 45;
    ctx.beginPath();
    ctx.ellipse(
      ((canvasWidth / 2 + wave + offset * 2) % (canvasWidth + 200)) - 100,
      y,
      canvasWidth * 0.65,
      28,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  ctx.restore();
};

/**
 * Backward-compatible helper for full viewport shroud & mist.
 */
export const renderFogOfWarShroud = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  playerScreenPos: Position,
  radiusPixels: number,
): void => {
  if (seaWeather.isFoggy()) {
    renderHeavyFogMistOverlay(ctx, canvasWidth, canvasHeight);
  }
};
