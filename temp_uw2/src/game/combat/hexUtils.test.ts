import { describe, expect, test } from 'vitest';
import {
  calculateCannonballArcPosition,
  getBroadsideHexes,
  getHexWindDelta,
  HEX_DIRECTIONS,
  hexDistance,
  hexEquals,
  hexesInRange,
  hexNeighbor,
  hexToPixel,
  pixelToHex,
  pixelToStaggered,
  staggeredBroadsideHexes,
  staggeredDistance,
  staggeredNeighbor,
  staggeredToPixel,
} from './hexUtils';

describe('hexUtils', () => {
  test('hexEquals evaluates identical coordinates', () => {
    expect(hexEquals({ q: 2, r: 3 }, { q: 2, r: 3 })).toBe(true);
    expect(hexEquals({ q: 2, r: 3 }, { q: 2, r: 4 })).toBe(false);
  });

  test('hexDistance calculates correct axial Manhattan/Chebyshev distance', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(0);
    expect(hexDistance({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(1);
    expect(hexDistance({ q: 0, r: 0 }, { q: 2, r: 1 })).toBe(3);
    expect(hexDistance({ q: 1, r: 2 }, { q: 4, r: -1 })).toBe(3);
  });

  test('hexNeighbor finds adjacent hex along 6 directions', () => {
    const center = { q: 2, r: 2 };
    for (let i = 0; i < 6; i += 1) {
      const neighbor = hexNeighbor(center, i);
      expect(hexDistance(center, neighbor)).toBe(1);
    }
  });

  test('hexToPixel and pixelToHex round-trip smoothly', () => {
    const originalHex = { q: 3, r: 4 };
    const radius = 30;
    const origin = { x: 50, y: 50 };
    const pixel = hexToPixel(originalHex, radius, origin);
    const roundTrip = pixelToHex(pixel, radius, origin);
    expect(roundTrip).toEqual(originalHex);
  });

  test('hexesInRange produces the exact formula count: 1 + 3 * N * (N + 1)', () => {
    const center = { q: 0, r: 0 };
    expect(hexesInRange(center, 0).length).toBe(1);
    expect(hexesInRange(center, 1).length).toBe(7);  // 1 + 6
    expect(hexesInRange(center, 2).length).toBe(19); // 1 + 6 + 12
    expect(hexesInRange(center, 3).length).toBe(37); // 1 + 6 + 12 + 18
  });

  test('getBroadsideHexes calculates port and starboard conical firing arcs', () => {
    const shipHex = { q: 3, r: 3 };
    const heading = 1; // Facing East
    const { port, starboard } = getBroadsideHexes(shipHex, heading, 2);

    expect(port.length).toBeGreaterThan(0);
    expect(starboard.length).toBeGreaterThan(0);

    // No broadside hex should equal ship's own coordinate
    expect(port.some((h) => hexEquals(h, shipHex))).toBe(false);
    expect(starboard.some((h) => hexEquals(h, shipHex))).toBe(false);
  });

  test('getHexWindDelta returns relative angle difference between 0 and 3', () => {
    expect(getHexWindDelta(0, 0)).toBe(0); // Same direction
    expect(getHexWindDelta(0, 3)).toBe(3); // Direct headwind
    expect(getHexWindDelta(1, 4)).toBe(3);
    expect(getHexWindDelta(0, 5)).toBe(1); // Adjacent wrap
  });

  /* Milestone 14: Koei 52x48 Staggered Column Hex Geometry Tests */
  test('staggeredNeighbor finds correct 6 directional neighbors on even and odd columns', () => {
    const evenCol = { q: 10, r: 10 };
    // North
    expect(staggeredNeighbor(evenCol, 0)).toEqual({ q: 10, r: 9 });
    // South
    expect(staggeredNeighbor(evenCol, 3)).toEqual({ q: 10, r: 11 });
    // NE (even col has r - 1)
    expect(staggeredNeighbor(evenCol, 1)).toEqual({ q: 11, r: 9 });

    const oddCol = { q: 11, r: 10 };
    // North
    expect(staggeredNeighbor(oddCol, 0)).toEqual({ q: 11, r: 9 });
    // NE (odd col shifted down, so NE is at same row r)
    expect(staggeredNeighbor(oddCol, 1)).toEqual({ q: 12, r: 10 });
    // SE (odd col SE is r + 1)
    expect(staggeredNeighbor(oddCol, 2)).toEqual({ q: 12, r: 11 });
  });

  test('staggeredDistance accurately computes cube-distance on staggered grid', () => {
    expect(staggeredDistance({ q: 10, r: 10 }, { q: 10, r: 10 })).toBe(0);
    // Adjacent neighbor distance is exactly 1
    const neighbor = staggeredNeighbor({ q: 10, r: 10 }, 1);
    expect(staggeredDistance({ q: 10, r: 10 }, neighbor)).toBe(1);

    // Multi-step distance
    expect(staggeredDistance({ q: 0, r: 0 }, { q: 0, r: 5 })).toBe(5);
  });

  test('staggeredToPixel and pixelToStaggered convert coordinates with half-tile odd shift', () => {
    const hex = { q: 5, r: 8 }; // odd column
    const pixel = staggeredToPixel(hex.q, hex.r, 0, 0, 32);
    expect(pixel.x).toBe(5 * 32);
    expect(pixel.y).toBe(8 * 32 + 16); // +16px half-tile vertical shift

    const reconverted = pixelToStaggered({ x: pixel.x + 10, y: pixel.y + 10 }, 0, 0, 32);
    expect(reconverted).toEqual(hex);
  });

  test('staggeredBroadsideHexes traces port and starboard firing lines', () => {
    const center = { q: 20, r: 20 };
    const { port, starboard } = staggeredBroadsideHexes(center, 0, 3); // Facing North

    // Facing North (0): Port is NW (5) and SW (4) side, Starboard is NE (1) and SE (2) side
    expect(port.length).toBe(6); // 2 dirs * 3 range
    expect(starboard.length).toBe(6);
    expect(port.some((h) => h.q === center.q && h.r === center.r)).toBe(false);
  });

  test('calculateCannonballArcPosition computes parabolic vertical lift at midpoint', () => {
    const from = { x: 100, y: 100 };
    const to = { x: 300, y: 100 };

    // At progress t = 0: exactly at origin
    const start = calculateCannonballArcPosition(from, to, 0);
    expect(start.x).toBe(100);
    expect(start.y).toBe(100);

    // At progress t = 1: exactly at destination
    const end = calculateCannonballArcPosition(from, to, 1);
    expect(end.x).toBe(300);
    expect(end.y).toBe(100);

    // At progress t = 0.5: apex with negative Y (lifted upwards)
    const mid = calculateCannonballArcPosition(from, to, 0.5);
    expect(mid.x).toBe(200);
    expect(mid.y).toBeLessThan(100); // Lifted vertically by arc
  });
});
