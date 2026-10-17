import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import Assets from '../../assets';
import { getPortData, portAdjacentAt, resetPortCache } from './portUtils';
import { positionAdjacentToPort } from '../../state/selectors';

// Load worldTilemap binary so unit tests have full accurate geographical landmasses
try {
  const tilemapPath = path.resolve(__dirname, '../../data/assets/worldTilemap.wasm');
  if (fs.existsSync(tilemapPath)) {
    const tilemapBuf = fs.readFileSync(tilemapPath);
    (Assets as any).data = (id: string) => {
      if (id === 'worldTilemap') return new Uint8Array(tilemapBuf);
      return null;
    };
  }
} catch (e) {}

describe('Montevideo & Supply Port Integrity - Collision Prevention with Extensible Ports', () => {
  beforeEach(() => {
    resetPortCache();
  });

  it('correctly resolves Montevideo (port 129) as a South American supply port', () => {
    const montevideo = getPortData('129');
    expect(montevideo).toBeDefined();
    expect(montevideo.name).toBe('Montevideo');
    expect(montevideo.isSupplyPort).toBe(true);
    expect(montevideo.position).toEqual({ x: 516, y: 906 });
    expect(montevideo.tileset).toBe(3);
    // Supply havens have only Harbor building (id 4)
    expect(montevideo.buildings).toEqual({ '4': { x: 62, y: 54 } });
  });

  it('correctly resolves Forel (port 130) as a subarctic supply port', () => {
    const forel = getPortData('130');
    expect(forel).toBeDefined();
    expect(forel.name).toBe('Forel');
    expect(forel.isSupplyPort).toBe(true);
    expect(forel.position).toEqual({ x: 660, y: 190 });
  });

  it('correctly resolves Singapore as custom port 131 without colliding with Montevideo', () => {
    const singapore = getPortData('131');
    expect(singapore).toBeDefined();
    expect(singapore.name).toBe('Singapore');
    expect(singapore.isSupplyPort).toBe(false);
    expect(singapore.position).toEqual({ x: 1540, y: 590 });
    expect(singapore.regionId).toBe('7'); // India/SE Asia
  });

  it('detects proximity docking for Montevideo at South American coordinates', () => {
    const dockedPortId = portAdjacentAt({ x: 516, y: 907 });
    expect(dockedPortId).toBe('129');
  });

  it('calculates departure position adjacent to Montevideo in South America, not Singapore', () => {
    const departure = positionAdjacentToPort('129');
    expect(departure).toBeDefined();
    // Departure should be right next to (516, 906), distance <= 3
    const dx = Math.abs(departure.x - 516);
    const dy = Math.abs(departure.y - 906);
    expect(dx).toBeLessThanOrEqual(3);
    expect(dy).toBeLessThanOrEqual(3);

    // Departure must NOT be in Singapore (x: 1540, y: 590)
    expect(Math.hypot(departure.x - 1540, departure.y - 590)).toBeGreaterThan(1000);
  });
});
