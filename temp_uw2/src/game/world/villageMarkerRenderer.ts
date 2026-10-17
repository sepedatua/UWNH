/**
 * villageMarkerRenderer.ts
 * Authentic 16-Bit SNES/Genesis Flashing Green Square & Settlement Canvas Renderer
 *
 * Renders the iconic pulsating retro green marker at coastal village coordinates
 * on the high seas viewport when sighted by the Crow's Nest Lookout or charted.
 */

import { Position } from '../../types';
import { TILE_SIZE, WORLD_MAP_COLUMNS } from '../../constants';
import { villages, Village } from '../../data/villageData';
import { isVillageDiscovered } from '../../state/actionsCrew';
import { getFromToAccountingForWrapAround } from './sharedUtils';

export const renderVillageMarkers = (
  ctx: CanvasRenderingContext2D,
  camera: Position & { width: number; height: number },
  playerPos: Position,
  sightRadiusTiles: number,
  canvasWidth: number,
  canvasHeight: number,
): void => {
  const now = Date.now();
  // Fast 16-bit retro oscillation: ~3 Hz pulse cycle matching SNES/Genesis
  const pulse = 0.5 + 0.5 * Math.sin(now / 160);
  const isHighFlash = Math.floor(now / 220) % 2 === 0;

  ctx.save();

  for (const vil of villages) {
    // 1. Calculate distance from player with cylindrical X-wrap
    let dx = vil.position.x - playerPos.x;
    if (dx > WORLD_MAP_COLUMNS / 2) dx -= WORLD_MAP_COLUMNS;
    if (dx < -WORLD_MAP_COLUMNS / 2) dx += WORLD_MAP_COLUMNS;
    const dy = vil.position.y - playerPos.y;
    const dist = Math.hypot(dx, dy);

    // Visible if currently within active line of sight, or already discovered
    const isDiscovered = isVillageDiscovered(vil.id);
    const isWithinSight = dist <= sightRadiusTiles;

    if (!isDiscovered && !isWithinSight) {
      continue; // Remains completely hidden under unexplored terrain
    }

    // 2. Calculate Screen Coordinates relative to Camera
    const screenX = Math.floor(
      getFromToAccountingForWrapAround(camera.x, vil.position.x) * TILE_SIZE,
    );
    const screenY = Math.floor((vil.position.y - camera.y) * TILE_SIZE);

    // Cull markers outside camera viewport
    if (
      screenX < -TILE_SIZE ||
      screenX > canvasWidth + TILE_SIZE ||
      screenY < -TILE_SIZE ||
      screenY > canvasHeight + TILE_SIZE
    ) {
      continue;
    }

    // 3. Draw Authentic 16-Bit Pulsing Green Square (SNES / Genesis Style)
    // Dynamic green intensity
    const greenAlpha = 0.35 + pulse * 0.45;
    const borderAlpha = 0.7 + pulse * 0.3;

    // A. Translucent green tile wash
    ctx.fillStyle = `rgba(34, 197, 94, ${greenAlpha.toFixed(2)})`;
    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

    // B. High-contrast 16-bit stepped border
    ctx.strokeStyle = isHighFlash ? '#4ade80' : '#15803d';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX + 1, screenY + 1, TILE_SIZE - 2, TILE_SIZE - 2);

    // C. Glowing corner accents (retro crosshair effect)
    ctx.fillStyle = isHighFlash ? '#ffffff' : '#86efac';
    const cornerSize = 4;
    // Top-left
    ctx.fillRect(screenX, screenY, cornerSize, cornerSize);
    // Top-right
    ctx.fillRect(screenX + TILE_SIZE - cornerSize, screenY, cornerSize, cornerSize);
    // Bottom-left
    ctx.fillRect(screenX, screenY + TILE_SIZE - cornerSize, cornerSize, cornerSize);
    // Bottom-right
    ctx.fillRect(
      screenX + TILE_SIZE - cornerSize,
      screenY + TILE_SIZE - cornerSize,
      cornerSize,
      cornerSize,
    );

    // D. Center Settlement Emblem
    const centerX = screenX + TILE_SIZE / 2;
    const centerY = screenY + TILE_SIZE / 2;

    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText('⛺', centerX, centerY);
    ctx.shadowBlur = 0;

    // E. Proximity Label: Display name banner when player is within 7 tiles
    if (dist <= 7.0) {
      ctx.font = 'bold 11px monospace';
      const labelText = vil.name;
      const textMetrics = ctx.measureText(labelText);
      const labelWidth = textMetrics.width + 12;
      const labelHeight = 16;
      const labelX = centerX - labelWidth / 2;
      const labelY = screenY - 14;

      // Vintage parchment bubble
      ctx.fillStyle = 'rgba(28, 20, 14, 0.9)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
      ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);

      ctx.fillStyle = '#fef3c7';
      ctx.fillText(labelText, centerX, labelY + labelHeight / 2 + 1);
    }
  }

  ctx.restore();
};
