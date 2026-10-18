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

/* =========================================================================
 * Authentic Koei 52x48 Staggered Column Hex Grid Engine (大航海時代II 準拠)
 * =========================================================================
 * Map Size: 52 columns x 48 rows
 * Viewport: 13 columns x 12 rows (416 x 384 px virtual, centered on active ship)
 * Tiles: 32 x 32 px, odd columns shifted vertically down by 16 px (half tile)
 * 6 Headings: 0: N, 1: NE, 2: SE, 3: S, 4: SW, 5: NW (60° steps)
 */

export const BATTLE_GRID_WIDTH = 52;
export const BATTLE_GRID_HEIGHT = 48;
export const BATTLE_VIEWPORT_COLS = 13;
export const BATTLE_VIEWPORT_ROWS = 12;
export const BATTLE_TILE_SIZE = 32;

export const KOEI_HEADING_NAMES = ['N', 'NE', 'SE', 'S', 'SW', 'NW'] as const;

/**
 * Returns neighbor coordinate on the 52x48 staggered column grid.
 * Odd columns (q % 2 !== 0) are shifted down by half a tile.
 */
export const staggeredNeighbor = (hex: HexCoord, dir: number): HexCoord => {
  const d = ((dir % 6) + 6) % 6;
  const isOdd = Math.abs(hex.q) % 2 === 1;

  switch (d) {
    case 0: // N
      return { q: hex.q, r: hex.r - 1 };
    case 1: // NE
      return { q: hex.q + 1, r: isOdd ? hex.r : hex.r - 1 };
    case 2: // SE
      return { q: hex.q + 1, r: isOdd ? hex.r + 1 : hex.r };
    case 3: // S
      return { q: hex.q, r: hex.r + 1 };
    case 4: // SW
      return { q: hex.q - 1, r: isOdd ? hex.r + 1 : hex.r };
    case 5: // NW
      return { q: hex.q - 1, r: isOdd ? hex.r : hex.r - 1 };
    default:
      return hex;
  }
};

/**
 * Exact distance between two coordinates on the staggered column grid
 * using cube coordinates mapping.
 */
export const staggeredDistance = (a: HexCoord, b: HexCoord): number => {
  const aX = a.q;
  const aZ = a.r - Math.floor(a.q / 2);
  const aY = -aX - aZ;

  const bX = b.q;
  const bZ = b.r - Math.floor(b.q / 2);
  const bY = -bX - bZ;

  return (Math.abs(aX - bX) + Math.abs(aY - bY) + Math.abs(aZ - bZ)) / 2;
};

/**
 * Converts staggered column (col, row) to canvas pixel coordinates relative to the viewport.
 */
export const staggeredToPixel = (
  col: number,
  row: number,
  viewCol = 0,
  viewRow = 0,
  tileSize = BATTLE_TILE_SIZE,
): PixelCoord => {
  const isOdd = Math.abs(col) % 2 === 1;
  const x = (col - viewCol) * tileSize;
  const y = (row - viewRow) * tileSize + (isOdd ? tileSize / 2 : 0);
  return { x, y };
};

/**
 * Converts screen pixel coordinates within the viewport back to staggered grid hex (col, row).
 */
export const pixelToStaggered = (
  pixel: PixelCoord,
  viewCol = 0,
  viewRow = 0,
  tileSize = BATTLE_TILE_SIZE,
): HexCoord => {
  const col = Math.floor(pixel.x / tileSize) + viewCol;
  const isOdd = Math.abs(col) % 2 === 1;
  const yOffset = isOdd ? tileSize / 2 : 0;
  const row = Math.floor((pixel.y - yOffset) / tileSize) + viewRow;
  return { q: col, r: row };
};

/**
 * Calculates port (left) and starboard (right) broadside firing lines for a ship
 * on the authentic staggered grid.
 * For heading H (0..5):
 * Port broadside fires along (H + 4) % 6 and (H + 5) % 6.
 * Starboard broadside fires along (H + 1) % 6 and (H + 2) % 6.
 */
export const staggeredBroadsideHexes = (
  shipHex: HexCoord,
  heading: number,
  range: number,
  maxCols = BATTLE_GRID_WIDTH,
  maxRows = BATTLE_GRID_HEIGHT,
): { port: HexCoord[]; starboard: HexCoord[] } => {
  const portDirs = [(heading + 4) % 6, (heading + 5) % 6];
  const starboardDirs = [(heading + 1) % 6, (heading + 2) % 6];

  const traceArc = (dirs: number[]): HexCoord[] => {
    const list: HexCoord[] = [];
    dirs.forEach((dir) => {
      let curr = shipHex;
      for (let dist = 1; dist <= range; dist += 1) {
        curr = staggeredNeighbor(curr, dir);
        if (curr.q >= 0 && curr.q < maxCols && curr.r >= 0 && curr.r < maxRows) {
          list.push(curr);
        }
      }
    });
    return list;
  };

  return {
    port: traceArc(portDirs),
    starboard: traceArc(starboardDirs),
  };
};

/**
 * Computes all valid reachable hexes within movement points on the staggered grid.
 */
export const staggeredHexesInRange = (
  center: HexCoord,
  range: number,
  maxCols = BATTLE_GRID_WIDTH,
  maxRows = BATTLE_GRID_HEIGHT,
): HexCoord[] => {
  const visited = new Map<string, number>();
  const queue: Array<{ hex: HexCoord; dist: number }> = [{ hex: center, dist: 0 }];
  visited.set(`${center.q},${center.r}`, 0);

  const results: HexCoord[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    results.push(current.hex);

    if (current.dist < range) {
      for (let d = 0; d < 6; d += 1) {
        const next = staggeredNeighbor(current.hex, d);
        if (next.q >= 0 && next.q < maxCols && next.r >= 0 && next.r < maxRows) {
          const key = `${next.q},${next.r}`;
          if (!visited.has(key)) {
            visited.set(key, current.dist + 1);
            queue.push({ hex: next, dist: current.dist + 1 });
          }
        }
      }
    }
  }

  return results;
};

/**
 * Calculates authentic Koei parabolic cannonball flight coordinates.
 * Lift & fall formulas: lift = 28800 / d, fall = 57600 / d^2
 * In 2D rendering: horizontal linear interpolation + vertical parabolic lift arc.
 */
export const calculateCannonballArcPosition = (
  from: PixelCoord,
  to: PixelCoord,
  progress: number, // 0.0 to 1.0
): PixelCoord => {
  const p = Math.max(0, Math.min(1, progress));
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Parabolic vertical lift height: peak is proportional to distance (max 65px)
  const peakHeight = Math.min(65, Math.max(18, dist * 0.22));
  const arcY = 4 * peakHeight * p * (1 - p);

  return {
    x: from.x + dx * p,
    y: from.y + dy * p - arcY,
  };
};
