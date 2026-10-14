/**
 * Hexagonal Grid Utility functions for Tactical Naval Battles
 * Uses axial coordinates (q, r) with pointy-topped hexagons.
 */

export interface HexCoord {
  q: number;
  r: number;
}

export interface PixelCoord {
  x: number;
  y: number;
}

// 6 Axial directions for Pointy-Topped Hexagons:
// 0: NE, 1: E, 2: SE, 3: SW, 4: W, 5: NW
export const HEX_DIRECTIONS: HexCoord[] = [
  { q: 1, r: -1 }, // 0: NE
  { q: 1, r: 0 },  // 1: E
  { q: 0, r: 1 },  // 2: SE
  { q: -1, r: 1 }, // 3: SW
  { q: -1, r: 0 }, // 4: W
  { q: 0, r: -1 }, // 5: NW
];

export const DIRECTION_NAMES = ['NE', 'E', 'SE', 'SW', 'W', 'NW'] as const;

export const hexEquals = (a: HexCoord, b: HexCoord): boolean =>
  a.q === b.q && a.r === b.r;

export const hexAdd = (a: HexCoord, b: HexCoord): HexCoord => ({
  q: a.q + b.q,
  r: a.r + b.r,
});

export const hexNeighbor = (hex: HexCoord, directionIndex: number): HexCoord => {
  const dir = HEX_DIRECTIONS[(directionIndex % 6 + 6) % 6];
  return hexAdd(hex, dir);
};

export const hexDistance = (a: HexCoord, b: HexCoord): number =>
  (Math.abs(a.q - b.q) +
    Math.abs(a.q + a.r - b.q - b.r) +
    Math.abs(a.r - b.r)) /
  2;

/**
 * Converts axial hex (q, r) to 2D pixel coordinates (x, y)
 * radius: distance from center to vertex
 */
export const hexToPixel = (
  hex: HexCoord,
  radius: number,
  origin: PixelCoord = { x: 0, y: 0 },
): PixelCoord => {
  const x = radius * (Math.sqrt(3) * hex.q + (Math.sqrt(3) / 2) * hex.r);
  const y = radius * ((3 / 2) * hex.r);
  return {
    x: x + origin.x,
    y: y + origin.y,
  };
};

/**
 * Converts 2D pixel coordinates to fractional/rounded axial hex (q, r)
 */
export const pixelToHex = (
  pixel: PixelCoord,
  radius: number,
  origin: PixelCoord = { x: 0, y: 0 },
): HexCoord => {
  const ptX = pixel.x - origin.x;
  const ptY = pixel.y - origin.y;

  const q = ((Math.sqrt(3) / 3) * ptX - (1 / 3) * ptY) / radius;
  const r = ((2 / 3) * ptY) / radius;

  // Axial rounding algorithm
  const s = -q - r;
  let roundQ = Math.round(q);
  let roundR = Math.round(r);
  const roundS = Math.round(s);

  const qDiff = Math.abs(roundQ - q);
  const rDiff = Math.abs(roundR - r);
  const sDiff = Math.abs(roundS - s);

  if (qDiff > rDiff && qDiff > sDiff) {
    roundQ = -roundR - roundS;
  } else if (rDiff > sDiff) {
    roundR = -roundQ - roundS;
  }

  return { q: roundQ, r: roundR };
};

/**
 * Returns all hexes within a given radius
 */
export const hexesInRange = (center: HexCoord, range: number): HexCoord[] => {
  const results: HexCoord[] = [];
  for (let q = -range; q <= range; q += 1) {
    const rMin = Math.max(-range, -q - range);
    const rMax = Math.min(range, -q + range);
    for (let r = rMin; r <= rMax; r += 1) {
      results.push({ q: center.q + q, r: center.r + r });
    }
  }
  return results;
};

/**
 * Returns broadside firing arcs (port / left and starboard / right) for a ship
 * A ship facing heading `dir` (0..5):
 * Port side: heading - 2 (or -1 and -2)
 * Starboard side: heading + 2 (or +1 and +2)
 */
export const getBroadsideHexes = (
  shipHex: HexCoord,
  heading: number,
  range: number,
): { port: HexCoord[]; starboard: HexCoord[] } => {
  const portDirs = [(heading + 4) % 6, (heading + 5) % 6];
  const starboardDirs = [(heading + 1) % 6, (heading + 2) % 6];

  const getArc = (dirs: number[]): HexCoord[] => {
    const hexes: HexCoord[] = [];
    dirs.forEach((dir) => {
      const offset = HEX_DIRECTIONS[dir];
      for (let dist = 1; dist <= range; dist += 1) {
        hexes.push({
          q: shipHex.q + offset.q * dist,
          r: shipHex.r + offset.r * dist,
        });
      }
    });
    return hexes;
  };

  return {
    port: getArc(portDirs),
    starboard: getArc(starboardDirs),
  };
};


/**
 * Determines relative angle between ship heading and wind direction
 */
export const getHexWindDelta = (heading: number, windDir: number): number => {
  const delta = Math.abs(heading - windDir);
  return delta > 3 ? 6 - delta : delta;
};
