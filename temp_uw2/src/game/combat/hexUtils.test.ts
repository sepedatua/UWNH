import { describe, expect, test } from 'vitest';
import {
  getBroadsideHexes,
  getHexWindDelta,
  HEX_DIRECTIONS,
  hexDistance,
  hexEquals,
  hexesInRange,
  hexNeighbor,
  hexToPixel,
  pixelToHex,
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
});
