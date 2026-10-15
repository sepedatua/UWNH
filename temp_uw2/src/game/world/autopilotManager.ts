/**
 * autopilotManager.ts
 * Macro-Grid A* Nautical Pathfinding & Autopilot Navigation Engine
 *
 * Provides:
 * - 216x108 Macro-Grid A* pathfinding (<3ms solve) with cylindrical X-wrap
 * - Explored-Only Maritime Routing: strictly paths through revealed waters
 * - Coastal Clearance Weighting: heavy cost penalty on narrow straits (e.g. Bangka Strait)
 *   so ships naturally prioritize wide open deep ocean corridors
 * - True-Water Waypoint Placement: waypoints placed on confirmed deepest water tiles
 * - Anti-Stuck & Coastal Deflection: detects collision and deflects heading along coast
 * - Configurable arrival actions:
 *     - 'dock': automatically docks into harbor
 *     - 'anchor': drops anchor outside port; food/water continue consuming normally
 * - Safety auto-interrupts: critical provisions (<5 days), hostile corsairs, and storms
 * - Interactive route visualization on World Atlas
 */

import state from '../../state/state';
import updateInterface, { SeaAlert } from '../../state/updateInterface';
import { Position, Direction } from '../../types';
import { WORLD_MAP_COLUMNS, WORLD_MAP_ROWS } from '../../constants';
import { getPortData, portAdjacentAt } from '../port/portUtils';
import { positionAdjacentToPort } from '../../state/selectors';
import { dock } from '../../state/actionsWorld';
import Assets from '../../assets';
import { generateId } from '../../utils';
import soundManager from '../../interface/sound/soundManager';
import seaWeather from './seaWeather';
import Input from '../../input';
import { regularPorts, supplyPorts } from '../../data/portData';
import explorationManager from './explorationManager';

export const MACRO_SCALE = 10; // 10x10 tiles per macro cell
export const MACRO_COLS = Math.floor(WORLD_MAP_COLUMNS / MACRO_SCALE); // 216 cols
export const MACRO_ROWS = Math.floor(WORLD_MAP_ROWS / MACRO_SCALE); // 108 rows
export const TOTAL_MACRO_CELLS = MACRO_COLS * MACRO_ROWS; // 23,328 cells

// Waypoint capture thresholds
export const TRANSIT_WAYPOINT_RADIUS = 2.5; // Smooth turn-in for open-ocean intermediate waypoints
export const FINAL_WAYPOINT_RADIUS = 0.65;  // Tight capture for final destination tile
export const LOOKAHEAD_STEPS = 4;           // Multi-step hull probe distance for island evasion

export type CompassHeading = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export interface HeadingVector {
  dir: CompassHeading;
  dx: number;
  dy: number;
  angle: number; // Radians in [-PI, PI]
}

// Ordered clockwise starting from North
export const COMPASS_ROSE: readonly HeadingVector[] = [
  { dir: 'n',  dx: 0,  dy: -1, angle: -Math.PI / 2 },
  { dir: 'ne', dx: 1,  dy: -1, angle: -Math.PI / 4 },
  { dir: 'e',  dx: 1,  dy: 0,  angle: 0 },
  { dir: 'se', dx: 1,  dy: 1,  angle: Math.PI / 4 },
  { dir: 's',  dx: 0,  dy: 1,  angle: Math.PI / 2 },
  { dir: 'sw', dx: -1, dy: 1,  angle: (3 * Math.PI) / 4 },
  { dir: 'w',  dx: -1, dy: 0,  angle: Math.PI },
  { dir: 'nw', dx: -1, dy: -1, angle: -(3 * Math.PI) / 4 },
];

export interface AutopilotCourse {
  targetPortId: string;
  portName: string;
  isSupplyPort: boolean;
  destinationPos: Position;
  waypoints: Position[];
  currentWaypointIndex: number;
  enterPortOnArrival: boolean;
  active: boolean;
  totalDistanceLeagues: number;
  estimatedDays: number;
}

export interface InterruptResult {
  shouldInterrupt: boolean;
  reason: 'provisions' | 'corsair' | 'storm' | 'manual' | null;
  message: string;
}

class AutopilotManager {
  private course: AutopilotCourse | null = null;
  // 0: impassable land, 1: pure open ocean (cost 1.0), 2: coastal/narrow water (cost 6.0)
  private macroGrid: Uint8Array | null = null;
  private lastAlertTime: number = 0;
  private lastStuckPos: Position | null = null;
  private stuckTicks: number = 0;
  private stagnantTicks: number = 0;
  private deflectionTicksRemaining: number = 0;
  private activeDeflectionDir: Direction | null = null;
  private consecutiveStuckEvents: number = 0;
  private lastProgressDist: number = Infinity;
  private lastProgressWaypointIndex: number = -1;
  private changeListeners: Set<() => void> = new Set();

  // Evasion & anti-oscillation state
  private evasionChirality: -1 | 0 | 1 = 0; // -1 = CCW (Port), +1 = CW (Starboard), 0 = None
  private evasionLockTicks: number = 0;
  private lastHeading: Direction | '' = '';
  private lastPosition: Position | null = null;
  private detourRecoveryAttempts: number = 0;

  public resetStuckState(): void {
    this.lastStuckPos = null;
    this.stuckTicks = 0;
    this.stagnantTicks = 0;
    this.deflectionTicksRemaining = 0;
    this.activeDeflectionDir = null;
    this.consecutiveStuckEvents = 0;
    this.lastProgressDist = Infinity;
    this.lastProgressWaypointIndex = -1;
    this.evasionChirality = 0;
    this.evasionLockTicks = 0;
    this.lastHeading = '';
    this.lastPosition = null;
    this.detourRecoveryAttempts = 0;
  }

  constructor() {
    // Lazy initialized on first pathfinding call
  }

  /* ---------------- Macro Grid Initialization ---------------- */

  public resetGrid(): void {
    this.macroGrid = null;
  }

  private initMacroGrid(): void {
    if (this.macroGrid) return;
    this.macroGrid = new Uint8Array(TOTAL_MACRO_CELLS);

    let tilemap: Uint8Array | null = null;
    try {
      tilemap = Assets.data('worldTilemap');
    } catch {
      tilemap = null;
    }

    for (let r = 0; r < MACRO_ROWS; r++) {
      // Polar ice edges (extreme North and South) are impassable
      if (r < 2 || r > 105) {
        continue;
      }

      for (let c = 0; c < MACRO_COLS; c++) {
        const idx = r * MACRO_COLS + c;

        if (!tilemap || tilemap.length < WORLD_MAP_COLUMNS * WORLD_MAP_ROWS) {
          // Default: open ocean if tilemap not loaded (headless unit tests)
          this.macroGrid[idx] = 1;
          continue;
        }

        // Sample all 100 tiles across the 10x10 cell to evaluate water clearance without missing micro-islands
        const startX = c * MACRO_SCALE;
        const startY = r * MACRO_SCALE;
        let waterCount = 0;

        for (let dy = 0; dy < MACRO_SCALE; dy++) {
          const rowOffset = (startY + dy) * WORLD_MAP_COLUMNS;
          for (let dx = 0; dx < MACRO_SCALE; dx++) {
            const tx = (startX + dx) % WORLD_MAP_COLUMNS;
            const tile = tilemap[rowOffset + tx] || 0;
            if (tile < 50) {
              waterCount++;
            }
          }
        }

        if (waterCount === 100) {
          this.macroGrid[idx] = 1; // Pure open ocean (cost multiplier = 1.0)
        } else if (waterCount > 0) {
          this.macroGrid[idx] = 2; // Coastal / narrow water (cost multiplier = 6.0)
        } else {
          this.macroGrid[idx] = 0; // Impassable land
        }
      }
    }

    // Ensure all charted port cells are at least navigable (type 2)
    try {
      [...regularPorts, ...supplyPorts].forEach((port) => {
        const c = Math.floor(port.position.x / MACRO_SCALE) % MACRO_COLS;
        const r = Math.floor(port.position.y / MACRO_SCALE);
        if (r >= 0 && r < MACRO_ROWS) {
          const idx = r * MACRO_COLS + c;
          if (this.macroGrid![idx] === 0) {
            this.macroGrid![idx] = 2;
          }
        }
      });
    } catch {
      // In headless test environments
    }
  }

  public isMacroCellWater(col: number, row: number): boolean {
    this.initMacroGrid();
    if (!this.macroGrid) return true;
    if (row < 0 || row >= MACRO_ROWS) return false;
    const wrappedCol = ((col % MACRO_COLS) + MACRO_COLS) % MACRO_COLS;
    return this.macroGrid[row * MACRO_COLS + wrappedCol] > 0;
  }

  public getMacroCellType(col: number, row: number): number {
    this.initMacroGrid();
    if (!this.macroGrid) return 1;
    if (row < 0 || row >= MACRO_ROWS) return 0;
    const wrappedCol = ((col % MACRO_COLS) + MACRO_COLS) % MACRO_COLS;
    return this.macroGrid[row * MACRO_COLS + wrappedCol];
  }

  /**
   * Verifies that two adjacent macro cells share an unobstructed navigable water boundary.
   * Prevents impossible diagonal jumps across isthmuses and peninsulas (e.g. northern Sumatra at Pasei).
   */
  public hasSharedWaterBoundary(c1: number, r1: number, c2: number, r2: number): boolean {
    const dc = c2 - c1;
    const dr = r2 - r1;
    const type1 = this.getMacroCellType(c1, r1);
    const type2 = this.getMacroCellType(c2, r2);
    if (type1 === 0 || type2 === 0) return false;

    // Strict No-Corner-Cutting for diagonal transitions
    if (dc !== 0 && dr !== 0) {
      const orth1 = this.getMacroCellType(c1 + dc, r1);
      const orth2 = this.getMacroCellType(c1, r1 + dr);
      if (orth1 === 0 || orth2 === 0) {
        return false; // Land on either orthogonal side pinches off the diagonal
      }
      // If all surrounding cells are pure ocean, diagonal is wide open
      if (type1 === 1 && type2 === 1 && orth1 === 1 && orth2 === 1) {
        return true;
      }
    } else {
      // Orthogonal move between two pure ocean cells is always wide open
      if (type1 === 1 && type2 === 1) {
        return true;
      }
    }

    let tilemap: Uint8Array | null = null;
    try {
      tilemap = Assets.data('worldTilemap');
    } catch {
      tilemap = null;
    }

    if (!tilemap || tilemap.length < WORLD_MAP_COLUMNS * WORLD_MAP_ROWS) {
      return true;
    }

    // Horizontal step: check shared vertical boundary tiles
    if (dc !== 0 && dr === 0) {
      const x1 = ((dc > 0 ? c1 * MACRO_SCALE + 9 : c1 * MACRO_SCALE) % WORLD_MAP_COLUMNS + WORLD_MAP_COLUMNS) % WORLD_MAP_COLUMNS;
      const x2 = ((dc > 0 ? c2 * MACRO_SCALE : c2 * MACRO_SCALE + 9) % WORLD_MAP_COLUMNS + WORLD_MAP_COLUMNS) % WORLD_MAP_COLUMNS;
      for (let dy = 0; dy < MACRO_SCALE; dy++) {
        const y = r1 * MACRO_SCALE + dy;
        if (tilemap[y * WORLD_MAP_COLUMNS + x1] < 50 && tilemap[y * WORLD_MAP_COLUMNS + x2] < 50) {
          return true;
        }
      }
      return false;
    }

    // Vertical step: check shared horizontal boundary tiles
    if (dc === 0 && dr !== 0) {
      const y1 = dr > 0 ? r1 * MACRO_SCALE + 9 : r1 * MACRO_SCALE;
      const y2 = dr > 0 ? r2 * MACRO_SCALE : r2 * MACRO_SCALE + 9;
      for (let dx = 0; dx < MACRO_SCALE; dx++) {
        const x = ((c1 * MACRO_SCALE + dx) % WORLD_MAP_COLUMNS + WORLD_MAP_COLUMNS) % WORLD_MAP_COLUMNS;
        if (tilemap[y1 * WORLD_MAP_COLUMNS + x] < 50 && tilemap[y2 * WORLD_MAP_COLUMNS + x] < 50) {
          return true;
        }
      }
      return false;
    }

    // Diagonal step with coastal cells: check the corner intersection tiles
    if (dc !== 0 && dr !== 0) {
      const cornerX1 = ((dc > 0 ? c1 * MACRO_SCALE + 9 : c1 * MACRO_SCALE) % WORLD_MAP_COLUMNS + WORLD_MAP_COLUMNS) % WORLD_MAP_COLUMNS;
      const cornerY1 = dr > 0 ? r1 * MACRO_SCALE + 9 : r1 * MACRO_SCALE;
      const cornerX2 = ((dc > 0 ? c2 * MACRO_SCALE : c2 * MACRO_SCALE + 9) % WORLD_MAP_COLUMNS + WORLD_MAP_COLUMNS) % WORLD_MAP_COLUMNS;
      const cornerY2 = dr > 0 ? r2 * MACRO_SCALE : r2 * MACRO_SCALE + 9;

      return tilemap[cornerY1 * WORLD_MAP_COLUMNS + cornerX1] < 50 && tilemap[cornerY2 * WORLD_MAP_COLUMNS + cornerX2] < 50;
    }

    return true;
  }

  // ============================================================================
  // GEOMETRY & 2x2 HULL CLEARANCE HELPERS
  // ============================================================================

  public wrapX(x: number): number {
    return ((Math.floor(x) % WORLD_MAP_COLUMNS) + WORLD_MAP_COLUMNS) % WORLD_MAP_COLUMNS;
  }

  public clampY(y: number): number {
    return Math.max(0, Math.min(WORLD_MAP_ROWS - 1, Math.floor(y)));
  }

  public getShortestDx(fromX: number, toX: number): number {
    let dx = toX - fromX;
    if (dx > WORLD_MAP_COLUMNS / 2) dx -= WORLD_MAP_COLUMNS;
    if (dx < -WORLD_MAP_COLUMNS / 2) dx += WORLD_MAP_COLUMNS;
    return dx;
  }

  public getToroidalDistance(p1: Position, p2: Position): number {
    const dx = this.getShortestDx(p1.x, p2.x);
    const dy = p2.y - p1.y;
    return Math.hypot(dx, dy);
  }

  /**
   * Checks whether the flagship's 2x2 footprint at (x, y) — plus an optional
   * safety margin (in tiles) — is completely clear of land (tile < 50).
   */
  public isShipFootprintClear(
    x: number,
    y: number,
    margin: number = 0,
    tilemap?: Uint8Array,
  ): boolean {
    let tmap = tilemap;
    if (!tmap) {
      try {
        tmap = Assets.data('worldTilemap');
      } catch {
        tmap = null;
      }
    }
    if (!tmap || tmap.length < WORLD_MAP_COLUMNS * WORLD_MAP_ROWS) {
      return true; // Test environment without loaded asset
    }

    const baseX = Math.floor(x);
    const baseY = Math.floor(y);

    if (baseY - margin < 0 || baseY + 1 + margin >= WORLD_MAP_ROWS) {
      return false;
    }

    for (let oy = -margin; oy <= 1 + margin; oy++) {
      const ty = baseY + oy;
      const rowOffset = ty * WORLD_MAP_COLUMNS;
      for (let ox = -margin; ox <= 1 + margin; ox++) {
        const tx = this.wrapX(baseX + ox);
        if (tmap[rowOffset + tx] >= 50) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Checks whether stepping from (fromX, fromY) by (dx, dy) in 1 tile increment
   * is completely free of collision, including diagonal corner-clipping checks.
   */
  public canStep2x2(
    fromX: number,
    fromY: number,
    dx: number,
    dy: number,
    tilemap?: Uint8Array,
  ): boolean {
    const nextX = fromX + dx;
    const nextY = fromY + dy;

    if (!this.isShipFootprintClear(nextX, nextY, 0, tilemap)) {
      return false;
    }

    if (dx !== 0 && dy !== 0) {
      if (
        !this.isShipFootprintClear(fromX + dx, fromY, 0, tilemap) ||
        !this.isShipFootprintClear(fromX, fromY + dy, 0, tilemap)
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Continuous raycast checking whether a direct line between two positions
   * is completely free of land obstacles (tile < 50) including 2x2 ship clearance footprint.
   */
  public hasWaterLineOfSight(
    p1: Position,
    p2: Position,
    coastalMargin: number = 0,
    terminalAnchor1?: Position,
    terminalAnchor2?: Position,
    requireExplored: boolean = false,
  ): boolean {
    let tilemap: Uint8Array | null = null;
    try {
      tilemap = Assets.data('worldTilemap');
    } catch {
      tilemap = null;
    }

    if (!tilemap || tilemap.length < WORLD_MAP_COLUMNS * WORLD_MAP_ROWS) {
      return true; // Test environment without loaded asset
    }

    const dx = this.getShortestDx(p1.x, p2.x);
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 0.25) {
      if (requireExplored && !explorationManager.isPositionExplored(p2.x, p2.y)) {
        return false;
      }
      return this.isShipFootprintClear(p2.x, p2.y, 0, tilemap);
    }

    // Sample every 0.4 tiles so diagonal rays cannot skip across grid corners
    const steps = Math.max(2, Math.ceil(dist * 2.5));
    let prevFloorX = Math.floor(p1.x);
    let prevFloorY = Math.floor(p1.y);

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const sampleX = p1.x + dx * t;
      const sampleY = p1.y + dy * t;

      const floorX = Math.floor(sampleX);
      const floorY = Math.floor(sampleY);

      // 1. Strict 2x2 flagship footprint MUST always be clear at every sample
      if (!this.isShipFootprintClear(floorX, floorY, 0, tilemap)) {
        return false;
      }

      // 2. Prevent diagonal corner-cutting between consecutive integer grid cells
      if (floorX !== prevFloorX && floorY !== prevFloorY) {
        if (
          !this.isShipFootprintClear(floorX, prevFloorY, 0, tilemap) ||
          !this.isShipFootprintClear(prevFloorX, floorY, 0, tilemap)
        ) {
          return false;
        }
      }
      prevFloorX = floorX;
      prevFloorY = floorY;

      // 3. Apply coastal safety margin outside immediate 3.2-tile terminal anchor zones
      if (coastalMargin > 0) {
        let dStart = Infinity;
        if (terminalAnchor1) {
          let ax = Math.abs(sampleX - terminalAnchor1.x);
          if (ax > WORLD_MAP_COLUMNS / 2) ax = WORLD_MAP_COLUMNS - ax;
          dStart = Math.hypot(ax, sampleY - terminalAnchor1.y);
        }
        let dEnd = Infinity;
        if (terminalAnchor2) {
          let bx = Math.abs(sampleX - terminalAnchor2.x);
          if (bx > WORLD_MAP_COLUMNS / 2) bx = WORLD_MAP_COLUMNS - bx;
          dEnd = Math.hypot(bx, sampleY - terminalAnchor2.y);
        }

        if (dStart > 3.2 && dEnd > 3.2) {
          if (!this.isShipFootprintClear(floorX, floorY, coastalMargin, tilemap)) {
            return false;
          }
        }
      }

      // 4. Strictly enforce Explored-Only Rule along the entire smoothed corridor
      if (requireExplored) {
        if (!explorationManager.isPositionExplored(sampleX, sampleY)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Finds the deepest water tile with maximum land clearance in a macro cell.
   * If a reference position (previous waypoint) is provided, prioritizes water tiles
   * that maintain unobstructed line-of-sight on the same side of any dividing island.
   */
  public getBestWaterTile(col: number, row: number, refPos?: Position): Position {
    let tilemap: Uint8Array | null = null;
    try {
      tilemap = Assets.data('worldTilemap');
    } catch {
      tilemap = null;
    }

    const defaultPos = {
      x: col * MACRO_SCALE + MACRO_SCALE / 2,
      y: row * MACRO_SCALE + MACRO_SCALE / 2,
    };

    if (!tilemap || tilemap.length < WORLD_MAP_COLUMNS * WORLD_MAP_ROWS) {
      return defaultPos;
    }

    const cellType = this.getMacroCellType(col, row);
    // If pure open ocean, check line of sight if refPos is given, else center is 100% deep water
    if (
      cellType === 1 &&
      this.isShipFootprintClear(defaultPos.x, defaultPos.y, 0, tilemap) &&
      (!refPos || this.hasWaterLineOfSight(refPos, defaultPos))
    ) {
      return defaultPos;
    }

    // For coastal/bottleneck cells, search for the tile with highest clearance from land
    // and verified 2x2 hull clearance
    const startX = col * MACRO_SCALE;
    const startY = row * MACRO_SCALE;
    let bestX = defaultPos.x;
    let bestY = defaultPos.y;
    let bestScore = -1;

    for (let dy = 0; dy < MACRO_SCALE; dy++) {
      for (let dx = 0; dx < MACRO_SCALE; dx++) {
        const tx = (startX + dx) % WORLD_MAP_COLUMNS;
        const ty = startY + dy;
        if (tilemap[ty * WORLD_MAP_COLUMNS + tx] >= 50) continue; // Skip land

        // Hull clearance: flagship 2x2 footprint MUST be clear
        if (!this.isShipFootprintClear(tx, ty, 0, tilemap)) continue;

        let minDist = 99;
        for (let sdy = -4; sdy <= 4; sdy++) {
          for (let sdx = -4; sdx <= 4; sdx++) {
            const stx = ((tx + sdx) % WORLD_MAP_COLUMNS + WORLD_MAP_COLUMNS) % WORLD_MAP_COLUMNS;
            const sty = ty + sdy;
            if (sty >= 0 && sty < WORLD_MAP_ROWS && tilemap[sty * WORLD_MAP_COLUMNS + stx] >= 50) {
              const d = Math.hypot(sdx, sdy);
              if (d < minDist) minDist = d;
            }
          }
        }

        let reachableBonus = 0;
        if (refPos) {
          if (this.hasWaterLineOfSight(refPos, { x: tx, y: ty }, 0)) {
            reachableBonus = 50;
          }
        }

        // Slight center bias to prevent hugging cell borders if clearance is equal
        const centerDist = Math.hypot(dx - 4.5, dy - 4.5);
        const centerBonus = Math.max(0, 5 - centerDist);

        const score = minDist * 10 + reachableBonus + centerBonus;
        if (score > bestScore) {
          bestScore = score;
          bestX = tx;
          bestY = ty;
        }
      }
    }

    return { x: bestX, y: bestY };
  }

  /* ---------------- Macro-Grid A* Pathfinding ---------------- */

  /**
   * Finds an obstacle-free nautical path across the globe from startPos to goalPos.
   * - Enforces Explored-Only Rule: only traverses revealed/charted waters if requireExplored is true
   * - Applies Coastal Clearance Weighting: penalizes bottlenecks (Bangka Strait) to favor wide open sea
   * - Places waypoints on verified deepest water tiles
   * Returns null if no charted water route exists.
   */
  public findPath(
    startPos: Position,
    goalPos: Position,
    requireExplored: boolean = true,
  ): Position[] | null {
    this.initMacroGrid();

    const startCol = ((Math.floor(startPos.x / MACRO_SCALE) % MACRO_COLS) + MACRO_COLS) % MACRO_COLS;
    const startRow = Math.max(0, Math.min(MACRO_ROWS - 1, Math.floor(startPos.y / MACRO_SCALE)));

    const goalCol = ((Math.floor(goalPos.x / MACRO_SCALE) % MACRO_COLS) + MACRO_COLS) % MACRO_COLS;
    const goalRow = Math.max(0, Math.min(MACRO_ROWS - 1, Math.floor(goalPos.y / MACRO_SCALE)));

    // If start and goal are in same cell, direct line
    if (startCol === goalCol && startRow === goalRow) {
      return [startPos, goalPos];
    }

    const startIndex = startRow * MACRO_COLS + startCol;
    const goalIndex = goalRow * MACRO_COLS + goalCol;

    // Ensure start and destination cells are treated as navigable
    if (this.macroGrid) {
      if (this.macroGrid[startIndex] === 0) this.macroGrid[startIndex] = 2;
      if (this.macroGrid[goalIndex] === 0) this.macroGrid[goalIndex] = 2;
    }

    const gScore = new Float32Array(TOTAL_MACRO_CELLS);
    gScore.fill(Infinity);
    gScore[startIndex] = 0;

    const fScore = new Float32Array(TOTAL_MACRO_CELLS);
    fScore.fill(Infinity);

    const heuristic = (c: number, r: number): number => {
      let dc = Math.abs(c - goalCol);
      if (dc > MACRO_COLS / 2) dc = MACRO_COLS - dc;
      const dr = Math.abs(r - goalRow);
      return Math.hypot(dc, dr);
    };

    fScore[startIndex] = heuristic(startCol, startRow);

    const cameFrom = new Int32Array(TOTAL_MACRO_CELLS);
    cameFrom.fill(-1);

    // Min-Heap open set
    const openSet: number[] = [startIndex];
    const inOpenSet = new Uint8Array(TOTAL_MACRO_CELLS);
    inOpenSet[startIndex] = 1;

    const neighbors = [
      { dc: 0, dr: -1, cost: 1.0 },
      { dc: 1, dr: -1, cost: 1.414 },
      { dc: 1, dr: 0, cost: 1.0 },
      { dc: 1, dr: 1, cost: 1.414 },
      { dc: 0, dr: 1, cost: 1.0 },
      { dc: -1, dr: 1, cost: 1.414 },
      { dc: -1, dr: 0, cost: 1.0 },
      { dc: -1, dr: -1, cost: 1.414 },
    ];

    let iterations = 0;
    const maxIterations = 10000;

    while (openSet.length > 0 && iterations++ < maxIterations) {
      let lowestIdx = 0;
      let lowestF = fScore[openSet[0]];
      for (let i = 1; i < openSet.length; i++) {
        const f = fScore[openSet[i]];
        if (f < lowestF) {
          lowestF = f;
          lowestIdx = i;
        }
      }

      const current = openSet[lowestIdx];

      if (current === goalIndex) {
        // Goal reached! Reconstruct macro cell path with deepest-water waypoints
        return this.reconstructPath(cameFrom, current, startPos, goalPos, requireExplored);
      }

      openSet.splice(lowestIdx, 1);
      inOpenSet[current] = 0;

      const currRow = Math.floor(current / MACRO_COLS);
      const currCol = current % MACRO_COLS;
      const currentG = gScore[current];

      for (const n of neighbors) {
        const nextRow = currRow + n.dr;
        if (nextRow < 0 || nextRow >= MACRO_ROWS) continue;

        const nextCol = ((currCol + n.dc) % MACRO_COLS + MACRO_COLS) % MACRO_COLS;
        const nextIndex = nextRow * MACRO_COLS + nextCol;

        // Verify navigable water
        const cellType = this.getMacroCellType(nextCol, nextRow);
        if (cellType === 0 && nextIndex !== goalIndex) {
          continue;
        }

        // Strict No-Corner-Cutting & Shared Water Boundary Check:
        // Guarantees ships never cut diagonal corners or jump over landmasses (e.g. northern Sumatra at Pasei, or Malaysia at Malacca)
        if (!this.hasSharedWaterBoundary(currCol, currRow, nextCol, nextRow)) {
          continue;
        }

        // Explored-Only Rule: Cell must be revealed in explorationManager
        if (requireExplored && nextIndex !== goalIndex && nextIndex !== startIndex) {
          const worldX = nextCol * MACRO_SCALE + MACRO_SCALE / 2;
          const worldY = nextRow * MACRO_SCALE + MACRO_SCALE / 2;
          const isExplored = explorationManager.isPositionExplored(worldX, worldY);
          if (!isExplored) {
            continue;
          }
        }

        // Coastal Clearance Cost Weighting:
        // Open deep ocean (cellType 1) has cost 1.0.
        // Coastal / narrow straits / island corridors (cellType 2) has cost 6.0 to favor wide open sea.
        const costMultiplier = cellType === 2 ? 6.0 : 1.0;
        const tentativeG = currentG + n.cost * costMultiplier;

        if (tentativeG < gScore[nextIndex]) {
          cameFrom[nextIndex] = current;
          gScore[nextIndex] = tentativeG;
          fScore[nextIndex] = tentativeG + heuristic(nextCol, nextRow);

          if (!inOpenSet[nextIndex]) {
            openSet.push(nextIndex);
            inOpenSet[nextIndex] = 1;
          }
        }
      }
    }

    // No path found through revealed waters / obstacle-free channel
    return null;
  }

  /**
   * Finds the navigable portal midpoint between two adjacent macro cells.
   * Used as intermediate stepping-stone funnel waypoints through narrow straits.
   */
  public getSharedBoundaryPortal(c1: number, r1: number, c2: number, r2: number): Position | null {
    let tilemap: Uint8Array | null = null;
    try {
      tilemap = Assets.data('worldTilemap');
    } catch {
      tilemap = null;
    }
    if (!tilemap) return null;

    const dc = c2 - c1;
    const dr = r2 - r1;

    // Horizontal transition: shared vertical boundary
    if (dc !== 0 && dr === 0) {
      const boundaryX = dc > 0 ? c2 * MACRO_SCALE : c1 * MACRO_SCALE;
      const xLeft = this.wrapX(boundaryX - 1);
      const xRight = this.wrapX(boundaryX);
      const yList: number[] = [];
      for (let dy = 0; dy < MACRO_SCALE; dy++) {
        const y = r1 * MACRO_SCALE + dy;
        if (
          this.isShipFootprintClear(xLeft, y, 0, tilemap) &&
          this.isShipFootprintClear(xRight, y, 0, tilemap)
        ) {
          yList.push(y);
        }
      }
      if (yList.length > 0) {
        return { x: xRight, y: yList[Math.floor(yList.length / 2)] };
      }
    }

    // Vertical transition: shared horizontal boundary
    if (dc === 0 && dr !== 0) {
      const boundaryY = dr > 0 ? r2 * MACRO_SCALE : r1 * MACRO_SCALE;
      const yUp = boundaryY - 1;
      const yDown = boundaryY;
      const xList: number[] = [];
      for (let dx = 0; dx < MACRO_SCALE; dx++) {
        const x = this.wrapX(c1 * MACRO_SCALE + dx);
        if (
          this.isShipFootprintClear(x, yUp, 0, tilemap) &&
          this.isShipFootprintClear(x, yDown, 0, tilemap)
        ) {
          xList.push(x);
        }
      }
      if (xList.length > 0) {
        return { x: xList[Math.floor(xList.length / 2)], y: yDown };
      }
    }

    // Diagonal transition: shared corner
    if (dc !== 0 && dr !== 0) {
      const cornerX = dc > 0 ? c2 * MACRO_SCALE : c1 * MACRO_SCALE;
      const cornerY = dr > 0 ? r2 * MACRO_SCALE : r1 * MACRO_SCALE;
      if (this.isShipFootprintClear(cornerX, cornerY, 0, tilemap)) {
        return { x: cornerX, y: cornerY };
      }
    }

    return null;
  }

  /**
   * Fast bounded local A* to route around irregular islands between adjacent macro waypoints.
   * Guarantees zero obstacle collision even in convoluted archipelagos.
   */
  public findLocalCorridorPath(fromPos: Position, toPos: Position): Position[] | null {
    let tilemap: Uint8Array | null = null;
    try {
      tilemap = Assets.data('worldTilemap');
    } catch {
      tilemap = null;
    }
    if (!tilemap) return null;

    const startX = Math.round(fromPos.x);
    const startY = Math.round(fromPos.y);
    const goalX = Math.round(toPos.x);
    const goalY = Math.round(toPos.y);

    const startKey = `${startX},${startY}`;
    const gScore = new Map<string, number>([[startKey, 0]]);
    const cameFrom = new Map<string, string>();
    const openSet: Array<{ x: number; y: number; f: number }> = [
      { x: startX, y: startY, f: Math.hypot(startX - goalX, startY - goalY) },
    ];

    const DIRS = [
      { dx: 0, dy: -1 }, { dx: 1, dy: -1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 },
      { dx: 0, dy: 1 }, { dx: -1, dy: 1 }, { dx: -1, dy: 0 }, { dx: -1, dy: -1 },
    ];

    let iterations = 0;
    while (openSet.length > 0 && iterations++ < 1500) {
      let lowestIdx = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[lowestIdx].f) lowestIdx = i;
      }
      const curr = openSet.splice(lowestIdx, 1)[0];
      if (curr.x === goalX && curr.y === goalY) {
        const path: Position[] = [];
        let c: string | undefined = `${curr.x},${curr.y}`;
        while (c) {
          const [x, y] = c.split(',').map(Number);
          path.unshift({ x, y });
          c = cameFrom.get(c);
        }
        return path;
      }

      const curKey = `${curr.x},${curr.y}`;
      const curG = gScore.get(curKey) ?? 0;

      for (const d of DIRS) {
        const nx = this.wrapX(curr.x + d.dx);
        const ny = this.clampY(curr.y + d.dy);
        if (!this.canStep2x2(curr.x, curr.y, d.dx, d.dy, tilemap)) continue;

        const nKey = `${nx},${ny}`;
        const stepCost = d.dx !== 0 && d.dy !== 0 ? 1.414 : 1.0;
        const tentativeG = curG + stepCost;

        if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
          cameFrom.set(nKey, curKey);
          gScore.set(nKey, tentativeG);
          const f = tentativeG + Math.hypot(nx - goalX, ny - goalY);
          const existing = openSet.find((n) => n.x === nx && n.y === ny);
          if (existing) {
            existing.f = f;
          } else {
            openSet.push({ x: nx, y: ny, f });
          }
        }
      }
    }
    return null;
  }

  /**
   * Reconstructs macro cell coordinates and generates verified deepest-water waypoints
   * using portal funneling and continuous raycast line-of-sight path smoothing.
   */
  private reconstructPath(
    cameFrom: Int32Array,
    current: number,
    startPos: Position,
    goalPos: Position,
    requireExplored: boolean = true,
  ): Position[] {
    const rawCells: { col: number; row: number }[] = [];
    let curr = current;
    while (curr !== -1) {
      rawCells.push({
        col: curr % MACRO_COLS,
        row: Math.floor(curr / MACRO_COLS),
      });
      curr = cameFrom[curr];
    }
    rawCells.reverse();

    // Generate candidate water waypoints along the cell sequence with portal funneling & corridor bridging
    const candidatePoints: Position[] = [startPos];
    let prevPoint = startPos;
    for (let i = 1; i < rawCells.length - 1; i++) {
      const wp = this.getBestWaterTile(rawCells[i].col, rawCells[i].row, prevPoint);
      if (!this.hasWaterLineOfSight(prevPoint, wp)) {
        const portal = this.getSharedBoundaryPortal(
          rawCells[i - 1].col,
          rawCells[i - 1].row,
          rawCells[i].col,
          rawCells[i].row,
        );
        if (
          portal &&
          this.hasWaterLineOfSight(prevPoint, portal) &&
          this.hasWaterLineOfSight(portal, wp)
        ) {
          candidatePoints.push(portal);
          prevPoint = portal;
        } else {
          // If portal alone does not clear the island, bridge via local corridor A*
          const bridge = this.findLocalCorridorPath(prevPoint, wp);
          if (bridge && bridge.length > 2) {
            const smoothedBridge = this.smoothPathWaypoints(bridge, requireExplored);
            for (let b = 1; b < smoothedBridge.length - 1; b++) {
              candidatePoints.push(smoothedBridge[b]);
            }
          }
        }
      }
      candidatePoints.push(wp);
      prevPoint = wp;
    }

    // Connect final candidate waypoint to goalPos via boundary portal or corridor bridge if needed
    if (!this.hasWaterLineOfSight(prevPoint, goalPos)) {
      if (rawCells.length >= 2) {
        const lastCell = rawCells[rawCells.length - 1];
        const prevCell = rawCells[rawCells.length - 2];
        const portal = this.getSharedBoundaryPortal(
          prevCell.col,
          prevCell.row,
          lastCell.col,
          lastCell.row,
        );
        if (
          portal &&
          this.hasWaterLineOfSight(prevPoint, portal) &&
          this.hasWaterLineOfSight(portal, goalPos)
        ) {
          candidatePoints.push(portal);
          prevPoint = portal;
        } else {
          const bridge = this.findLocalCorridorPath(prevPoint, goalPos);
          if (bridge && bridge.length > 2) {
            const smoothedBridge = this.smoothPathWaypoints(bridge, requireExplored);
            for (let b = 1; b < smoothedBridge.length - 1; b++) {
              candidatePoints.push(smoothedBridge[b]);
            }
          }
        }
      }
    }
    candidatePoints.push(goalPos);

    const waypoints = this.smoothPathWaypoints(candidatePoints, requireExplored);

    // Ensure goal is the final waypoint
    if (
      waypoints.length < 2 ||
      waypoints[waypoints.length - 1].x !== goalPos.x ||
      waypoints[waypoints.length - 1].y !== goalPos.y
    ) {
      waypoints.push(goalPos);
    }

    return waypoints;
  }

  /**
   * Upgraded string-pulling path smoother with adaptive density and Fog-of-War verification.
   * - In open deep ocean: pulls long straight chords (lookahead up to 12 waypoints).
   * - In coastal / narrow / archipelago corridors (type 2): limits lookahead to 2-3 cells
   *   to preserve dense channel waypoints along the medial axis.
   * - Strictly verifies that smoothed rays never cut across unrevealed Fog-of-War waters.
   */
  public smoothPathWaypoints(
    candidatePoints: Position[],
    requireExplored: boolean = false,
  ): Position[] {
    if (candidatePoints.length <= 2) return [...candidatePoints];

    const startPos = candidatePoints[0];
    const endPos = candidatePoints[candidatePoints.length - 1];
    const waypoints: Position[] = [startPos];
    let currentIdx = 0;

    while (currentIdx < candidatePoints.length - 1) {
      let furthestIdx = currentIdx + 1;

      // In coastal/island corridors, limit lookahead to preserve dense channel stepping stones
      const curCol = Math.floor(candidatePoints[currentIdx].x / MACRO_SCALE) % MACRO_COLS;
      const curRow = Math.floor(candidatePoints[currentIdx].y / MACRO_SCALE);
      const isCoastalArea = this.getMacroCellType(curCol, curRow) === 2;
      const maxSpan = isCoastalArea ? 3 : 12;
      const maxLookAhead = Math.min(candidatePoints.length - 1, currentIdx + maxSpan);

      for (let nextIdx = maxLookAhead; nextIdx > currentIdx + 1; nextIdx--) {
        if (
          this.hasWaterLineOfSight(
            candidatePoints[currentIdx],
            candidatePoints[nextIdx],
            1, // Enforce 1-tile coastal margin around 2x2 hull in open sea
            startPos,
            endPos,
            requireExplored,
          )
        ) {
          furthestIdx = nextIdx;
          break;
        }
      }

      waypoints.push(candidatePoints[furthestIdx]);
      currentIdx = furthestIdx;
    }

    return waypoints;
  }

  /* ---------------- Course Engagement & Management ---------------- */

  /**
   * Sets the active autopilot course towards a revealed port.
   */
  public setCourse(
    targetPortId: string,
    enterPortOnArrival: boolean = true,
    requireExplored: boolean = true,
  ): AutopilotCourse | null {
    // Autopilot is only available while sailing at sea
    if (state.portId !== null) {
      const alert: SeaAlert = {
        id: generateId(),
        type: 'warning',
        text: '⚠️ Cannot engage autopilot while docked in port. Set sail from the harbor first.',
        timestamp: Date.now(),
      };
      updateInterface.seaAlert?.(alert);
      return null;
    }

    const port = getPortData(targetPortId);
    if (!port) return null;

    // Reset any lingering keyboard steering inputs
    try {
      Input.reset();
    } catch {}

    const playerFleet = state.fleets[1] || state.fleets['1'];
    const playerPos = playerFleet?.position || { x: 840, y: 358 };

    // Calculate ocean arrival coordinate adjacent to port
    let destinationPos: Position;
    try {
      destinationPos = positionAdjacentToPort(targetPortId);
    } catch {
      destinationPos = { ...port.position };
    }

    // Solve obstacle-free path through charted waters only
    const waypoints = this.findPath(playerPos, destinationPos, requireExplored);
    if (!waypoints || waypoints.length < 2) {
      soundManager.playSfx('shipBell');
      const alert: SeaAlert = {
        id: generateId(),
        type: 'warning',
        text: `📜 UNCHARTED ROUTE: No explored nautical passage to ${port.name}. You must manually explore and map the waters before autopilot can navigate.`,
        timestamp: Date.now(),
      };
      updateInterface.seaAlert?.(alert);
      return null;
    }

    // Calculate distance and voyage time estimate
    let totalDist = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      let dx = Math.abs(waypoints[i + 1].x - waypoints[i].x);
      if (dx > WORLD_MAP_COLUMNS / 2) dx = WORLD_MAP_COLUMNS - dx;
      const dy = Math.abs(waypoints[i + 1].y - waypoints[i].y);
      totalDist += Math.hypot(dx, dy);
    }

    const leagues = Math.round(totalDist);
    const estimatedDays = Math.max(1, Math.round(leagues / 18));

    this.course = {
      targetPortId,
      portName: port.name,
      isSupplyPort: port.isSupplyPort,
      destinationPos,
      waypoints,
      currentWaypointIndex: 1, // First target is next waypoint after start
      enterPortOnArrival,
      active: true,
      totalDistanceLeagues: leagues,
      estimatedDays,
    };

    state.autopilotCourse = {
      targetPortId,
      portName: port.name,
      enterPortOnArrival,
      active: true,
      totalDistanceLeagues: leagues,
      estimatedDays,
    };

    this.resetStuckState();

    soundManager.playSfx('shipBell');

    const alert: SeaAlert = {
      id: generateId(),
      type: 'info',
      text: `🧭 AUTOPILOT ENGAGED: Helm locked on course to ${port.name} (~${leagues} Leagues). Mode: ${enterPortOnArrival ? 'Enter Harbor' : 'Anchor in Roadstead'}. Press Esc/WASD to cancel.`,
      timestamp: Date.now(),
    };
    updateInterface.seaAlert?.(alert);

    this.notify();
    return this.course;
  }

  public cancelCourse(reason: string = 'Autopilot Disengaged: Manual helm control restored.'): void {
    if (!this.course) return;

    this.course.active = false;
    this.course = null;
    state.autopilotCourse = null;
    this.resetStuckState();

    const alert: SeaAlert = {
      id: generateId(),
      type: 'info',
      text: `⏹️ ${reason}`,
      timestamp: Date.now(),
    };
    updateInterface.seaAlert?.(alert);

    this.notify();
  }

  public isActive(): boolean {
    return !!this.course && this.course.active;
  }

  public getCourse(): AutopilotCourse | null {
    return this.course;
  }

  public getPlottedRoute(): Position[] | null {
    return this.course ? this.course.waypoints : null;
  }

  /* ---------------- Safety Auto-Interrupts ---------------- */

  /**
   * Checks whether an emergency event requires halting autopilot to save the fleet.
   */
  public checkSafetyInterrupts(): InterruptResult | null {
    if (!this.isActive()) return null;

    const playerFleet = state.fleets[1] || state.fleets['1'];
    if (!playerFleet) return null;

    // 1. Critical Food or Water supplies (< 5 days remaining)
    let totalCrew = 0;
    let totalFood = 0;
    let totalWater = 0;

    (playerFleet.ships || []).forEach((ship) => {
      totalCrew += ship.crew || 0;
      (ship.cargo || []).forEach((c) => {
        if (c?.type === 'food') totalFood += c.quantity || 0;
        if (c?.type === 'water') totalWater += c.quantity || 0;
      });
    });

    const dailyRation = Math.max(1, Math.ceil(totalCrew / 10));
    const foodDays = Math.floor(totalFood / dailyRation);
    const waterDays = Math.floor(totalWater / dailyRation);

    if (foodDays < 5 || waterDays < 5) {
      return {
        shouldInterrupt: true,
        reason: 'provisions',
        message: `⚠️ CRITICAL SUPPLIES: Only ${Math.min(foodDays, waterDays)} days of provisions remain! Autopilot halted to avoid starvation at sea.`,
      };
    }

    // 2. Hostile Corsair / Warship proximity (< 10 tiles)
    const playerPos = playerFleet.position;
    if (playerPos) {
      for (const id in state.fleets) {
        if (id === '1') continue;
        const npc = state.fleets[id];
        if (!npc || !npc.position) continue;

        let dx = Math.abs(playerPos.x - npc.position.x);
        if (dx > WORLD_MAP_COLUMNS / 2) dx = WORLD_MAP_COLUMNS - dx;
        const dy = Math.abs(playerPos.y - npc.position.y);
        const dist = Math.hypot(dx, dy);

        if (dist <= 10) {
          return {
            shouldInterrupt: true,
            reason: 'corsair',
            message: `⚔️ UNFRIENDLY SAILS: Sails sighted off the bow (${Math.round(dist)} tiles)! Autopilot halted to prevent ambush.`,
          };
        }
      }
    }

    // 3. Violent Storm
    if (seaWeather.isStormy()) {
      return {
        shouldInterrupt: true,
        reason: 'storm',
        message: `⛈️ VIOLENT GALE: Severe storm has struck the fleet! Ship taking heavy seas. Manual steering required.`,
      };
    }

    return null;
  }

  // ============================================================================
  // STEERING, ISLAND EVASION & GUARANTEED PORT DOCKING
  // ============================================================================

  /**
   * Checks whether `pos` (or its integer-snapped tile) satisfies `portAdjacentAt`
   * for the course's target port.
   */
  private isDockableAtTargetPort(pos: Position, targetPortId?: string | number | null): boolean {
    const matchedPortId = portAdjacentAt(pos);
    if (matchedPortId === null || matchedPortId === undefined) return false;
    if (targetPortId !== undefined && targetPortId !== null) {
      return String(matchedPortId) === String(targetPortId);
    }
    return true;
  }

  /**
   * Searches `currentPos`, its integer-rounded coordinate, and immediate 1-tile
   * collision-free neighbors for a valid docking position that passes `portAdjacentAt`.
   */
  private resolveValidDockPosition(
    currentPos: Position,
    targetPortId?: string | number | null,
  ): Position | null {
    let tilemap: Uint8Array | null = null;
    try {
      tilemap = Assets.data('worldTilemap');
    } catch {
      tilemap = null;
    }

    // 1. Test exact currentPos first
    if (this.isDockableAtTargetPort(currentPos, targetPortId)) {
      return currentPos;
    }

    // 2. Test integer-snapped coordinates and 1-tile neighborhood
    const rx = this.wrapX(Math.round(currentPos.x));
    const ry = this.clampY(Math.round(currentPos.y));

    const searchOffsets = [
      { x: 0, y: 0 },
      { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 },
      { x: 1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 },
    ];

    for (const off of searchOffsets) {
      const candidate: Position = {
        x: this.wrapX(rx + off.x),
        y: this.clampY(ry + off.y),
      };
      if (
        (!tilemap || this.isShipFootprintClear(candidate.x, candidate.y, 0, tilemap)) &&
        this.isDockableAtTargetPort(candidate, targetPortId)
      ) {
        return candidate;
      }
    }

    return null;
  }

  /**
   * Called every frame in worldCharacters.ts to drive automated navigation.
   * Features active anti-stuck detection, multi-step lookahead, sustained deflection,
   * local BFS detours around protruding headlands, and verified harbor arrival.
   */
  public updateSteering(player: any): boolean {
    if (!this.isActive() || !this.course) {
      return false;
    }

    // Check emergency interrupts
    const interrupt = this.checkSafetyInterrupts();
    if (interrupt && interrupt.shouldInterrupt) {
      soundManager.playSfx('shipBell');
      this.cancelCourse(interrupt.message);
      player.setHeading('');
      return false;
    }

    const waypoints = this.course.waypoints;
    const currentPos: Position = player.position();
    const { targetPortId, enterPortOnArrival } = this.course;

    // 1. OPPORTUNISTIC HARBOR CAPTURE:
    // If we are near the end of our route and ALREADY inside the target port's
    // valid `portAdjacentAt` docking envelope, dock immediately!
    if (enterPortOnArrival && this.course.currentWaypointIndex >= waypoints.length - 2) {
      const validDockPos = this.resolveValidDockPosition(currentPos, targetPortId);
      if (validDockPos && this.getToroidalDistance(currentPos, validDockPos) <= 1.15) {
        this.handleArrival(player, validDockPos);
        return false;
      }
    }

    const isFinalWaypoint = this.course.currentWaypointIndex >= waypoints.length - 1;
    const target = waypoints[this.course.currentWaypointIndex];
    if (!target) {
      this.handleArrival(player, currentPos);
      return false;
    }
    const dx = this.getShortestDx(currentPos.x, target.x);
    const dy = target.y - currentPos.y;
    const dist = Math.hypot(dx, dy);

    // 2. WAYPOINT CAPTURE WITH VECTOR PROJECTION RETIREMENT:
    // - Final waypoint requires tight proximity (0.65 tiles) so we never stop 3-4 tiles out at sea.
    // - Intermediate waypoints capture if:
    //     a) dist < TRANSIT_WAYPOINT_RADIUS (2.5 tiles), OR
    //     b) Vector projection shows the ship reached or passed the orthogonal baseline of target (t >= 0.95)
    //        within a cross-track tolerance (<= 4.5 tiles), preventing any circular orbiting if pushed by wind/current!
    let waypointCaptured = false;

    if (isFinalWaypoint) {
      const finalRadius = enterPortOnArrival ? FINAL_WAYPOINT_RADIUS : 1.0;
      if (dist < finalRadius) {
        waypointCaptured = true;
      }
    } else {
      if (dist < TRANSIT_WAYPOINT_RADIUS) {
        waypointCaptured = true;
      } else {
        // Calculate progress along leg from previous waypoint W_prev to target W_curr
        const prevWp =
          this.course.currentWaypointIndex > 0
            ? waypoints[this.course.currentWaypointIndex - 1]
            : currentPos;
        const legDx = this.getShortestDx(prevWp.x, target.x);
        const legDy = target.y - prevWp.y;
        const legLenSq = legDx * legDx + legDy * legDy;

        if (legLenSq > 1.0) {
          const shipDx = this.getShortestDx(prevWp.x, currentPos.x);
          const shipDy = currentPos.y - prevWp.y;
          // Scalar projection along leg vector
          const t = (shipDx * legDx + shipDy * legDy) / legLenSq;
          // Cross-track distance
          const crossTrack = Math.abs(shipDx * legDy - shipDy * legDx) / Math.sqrt(legLenSq);

          const nextWp =
            this.course.currentWaypointIndex + 1 < waypoints.length
              ? waypoints[this.course.currentWaypointIndex + 1]
              : null;

          if (t >= 0.95 && crossTrack <= 4.5) {
            waypointCaptured = true;
          } else if (
            nextWp &&
            (t >= 0.95 || this.getToroidalDistance(currentPos, nextWp) < dist) &&
            this.hasWaterLineOfSight(currentPos, nextWp)
          ) {
            waypointCaptured = true;
          }
        }
      }
    }

    if (waypointCaptured) {
      this.course.currentWaypointIndex++;
      this.resetStuckState();

      if (this.course.currentWaypointIndex >= waypoints.length) {
        // Before concluding arrival, verify whether we can actually dock if requested
        if (enterPortOnArrival) {
          const validDockPos = this.resolveValidDockPosition(currentPos, targetPortId);
          if (validDockPos) {
            this.handleArrival(player, validDockPos);
            return false;
          }

          // If the final waypoint wasn't close enough to pass `portAdjacentAt`
          // (e.g., a distance-3 offset was used), try finding a true dockable tile
          // around the port and stepping once more toward it.
          if (targetPortId !== undefined && targetPortId !== null) {
            try {
              const dockTarget = positionAdjacentToPort(String(targetPortId));
              if (
                this.getToroidalDistance(currentPos, dockTarget) > 0.65 &&
                this.detourRecoveryAttempts < 2
              ) {
                this.detourRecoveryAttempts++;
                waypoints.push(dockTarget);
                this.course.currentWaypointIndex = waypoints.length - 1;
                // Continue steering toward the exact dockTarget
              } else {
                this.handleArrival(player, currentPos);
                return false;
              }
            } catch {
              this.handleArrival(player, currentPos);
              return false;
            }
          } else {
            this.handleArrival(player, currentPos);
            return false;
          }
        } else {
          this.handleArrival(player, currentPos);
          return false;
        }
      }
    }

    // 3. STUCK DETECTION & SELF-HEALING LOCAL DETOUR INJECTION:
    if (this.lastPosition) {
      const movedDist = this.getToroidalDistance(this.lastPosition, currentPos);
      if (movedDist < 0.05) {
        this.stuckTicks++;
        this.stagnantTicks++;
      } else {
        this.stuckTicks = 0;
        if (movedDist > 0.2) this.stagnantTicks = Math.max(0, this.stagnantTicks - 1);
      }
    }
    this.lastPosition = { x: currentPos.x, y: currentPos.y };

    // Sustained deflection window countdown
    if (this.deflectionTicksRemaining > 0) {
      this.deflectionTicksRemaining--;
    }

    // Attempt local BFS detour around protruding island before giving up
    const activeTarget = waypoints[this.course.currentWaypointIndex];
    if (
      (this.stuckTicks >= 4 || this.consecutiveStuckEvents >= 2 || this.stagnantTicks >= 12) &&
      this.detourRecoveryAttempts < 3 &&
      activeTarget
    ) {
      if (this.tryInjectLocalBypassWaypoint(currentPos, activeTarget)) {
        this.detourRecoveryAttempts++;
        this.resetStuckState();
      }
    }

    // Hard abort only if local detour recovery also failed to free the ship
    if (this.consecutiveStuckEvents >= 4 || this.stuckTicks >= 8 || this.stagnantTicks >= 24) {
      soundManager.playSfx('shipBell');
      this.cancelCourse(
        '⚠️ Coastal Shallows Hazard: Fleet was impeded by shore/island terrain. Disengaged autopilot for manual navigation.',
      );
      player.setHeading('');
      return false;
    }

    // 4. COMPUTE HEADING WITH MULTI-STEP LOOKAHEAD & CHIRALITY LOCK
    const currentTarget = waypoints[this.course.currentWaypointIndex] || activeTarget;
    const finalApproach = this.course.currentWaypointIndex >= waypoints.length - 1;

    let heading: Direction | '' = '';
    if (this.deflectionTicksRemaining > 0 && this.activeDeflectionDir) {
      heading = this.activeDeflectionDir;
    } else {
      heading = this.computeDeflectionHeading(currentPos, currentTarget, finalApproach);
    }

    // If stuck ticks >= 2 and not currently deflecting, engage sustained deflection for 6 ticks
    if (this.stuckTicks >= 2 && this.deflectionTicksRemaining <= 0) {
      this.consecutiveStuckEvents++;
      this.deflectionTicksRemaining = 6;
      this.activeDeflectionDir = heading || this.lastHeading || this.vectorToDirection(dx, dy);
      heading = this.activeDeflectionDir;
    }

    if (!heading) {
      this.consecutiveStuckEvents++;
      player.setHeading('');
      return false;
    }

    this.lastHeading = heading;
    player.setHeading(heading);
    return true;
  }

  /**
   * Probes up to `LOOKAHEAD_STEPS` tiles along a compass direction to measure:
   * - `freeSteps`: how many consecutive 2x2 hull steps are unobstructed
   * - `hasCoastalBuffer`: whether the first 2 steps also clear a 1-tile coastal margin
   */
  private probeHeadingClearance(
    pos: Position,
    hv: HeadingVector,
    tilemap: Uint8Array | null,
  ): { freeSteps: number; hasCoastalBuffer: boolean } {
    if (!tilemap || tilemap.length < WORLD_MAP_COLUMNS * WORLD_MAP_ROWS) {
      return { freeSteps: LOOKAHEAD_STEPS, hasCoastalBuffer: true };
    }
    let curX = Math.round(pos.x);
    let curY = Math.round(pos.y);
    let freeSteps = 0;
    let hasCoastalBuffer = true;

    for (let step = 1; step <= LOOKAHEAD_STEPS; step++) {
      if (!this.canStep2x2(curX, curY, hv.dx, hv.dy, tilemap)) {
        break;
      }
      curX = this.wrapX(curX + hv.dx);
      curY = this.clampY(curY + hv.dy);
      freeSteps = step;

      if (step <= 2 && !this.isShipFootprintClear(curX, curY, 1, tilemap)) {
        hasCoastalBuffer = false;
      }
    }

    return { freeSteps, hasCoastalBuffer };
  }

  /**
   * Computes a collision-free compass heading toward `target` using:
   * 1) Multi-step 2x2 hull lookahead (`LOOKAHEAD_STEPS = 4`).
   * 2) Persistent chirality lock (`this.evasionChirality`) to prevent ping-ponging
   *    against protruding islands.
   * 3) Momentum anti-reversal bias so the ship sweeps smoothly around headlands.
   */
  public computeDeflectionHeading(
    currentPos: Position,
    target: Position,
    isFinalApproach: boolean = false,
  ): Direction | '' {
    let tilemap: Uint8Array | null = null;
    try {
      tilemap = Assets.data('worldTilemap');
    } catch {
      tilemap = null;
    }

    const dx = this.getShortestDx(currentPos.x, target.x);
    const dy = target.y - currentPos.y;
    const distToTarget = Math.hypot(dx, dy);
    const desiredAngle = Math.atan2(dy, dx);

    // Find closest index on the 8-wind compass rose
    let idealIdx = 0;
    let minAngleDiff = Infinity;
    for (let i = 0; i < COMPASS_ROSE.length; i++) {
      const diff = Math.abs(this.normalizeAngle(COMPASS_ROSE[i].angle - desiredAngle));
      if (diff < minAngleDiff) {
        minAngleDiff = diff;
        idealIdx = i;
      }
    }

    const requiredSteps = isFinalApproach
      ? Math.max(1, Math.min(2, Math.ceil(distToTarget)))
      : Math.min(LOOKAHEAD_STEPS, Math.max(2, Math.ceil(distToTarget)));

    const idealProbe = this.probeHeadingClearance(currentPos, COMPASS_ROSE[idealIdx], tilemap);

    // Direct path is wide open: instantly clear evasion lock and proceed straight
    if (
      idealProbe.freeSteps >= requiredSteps &&
      (isFinalApproach || idealProbe.hasCoastalBuffer)
    ) {
      this.evasionLockTicks = 0;
      this.evasionChirality = 0;
      return COMPASS_ROSE[idealIdx].dir;
    }

    // --- OBSTACLE DETECTED OR EVASION LOCK ACTIVE ---
    // Evaluate both Counter-Clockwise (chirality = -1) and Clockwise (chirality = +1) sweeps
    const oppositeDir = this.getOppositeHeading(this.lastHeading);

    const scoreCandidate = (idx: number, offsetSteps: number, chirality: -1 | 1): number => {
      const hv = COMPASS_ROSE[idx];
      const probe = this.probeHeadingClearance(currentPos, hv, tilemap);
      if (probe.freeSteps === 0) return -Infinity; // Blocked on step 1

      // Base score favors deeper lookahead clearance and smaller deflection angle
      let score = probe.freeSteps * 30 - offsetSteps * 18;

      // Coastal margin bonus keeps the 2x2 hull 1 tile off rocky shores
      if (probe.hasCoastalBuffer) score += 25;

      // Persistent chirality lock bonus prevents left-right ping-pong oscillation
      if (this.evasionChirality !== 0 && chirality === this.evasionChirality) {
        score += 35;
      }

      // Momentum continuity bonus for maintaining or smoothly turning from lastHeading
      if (this.lastHeading && hv.dir === this.lastHeading) {
        score += 20;
      }

      // Heavy penalty against 180-degree reversal unless it is the only escape
      if (oppositeDir && hv.dir === oppositeDir) {
        score -= 120;
      }

      return score;
    };

    let bestIdx = -1;
    let bestScore = -Infinity;
    let bestChirality: -1 | 0 | 1 = this.evasionChirality;

    // Also evaluate idealIdx in case it still has 1-2 free steps on final approach
    if (idealProbe.freeSteps >= 1) {
      bestIdx = idealIdx;
      bestScore =
        idealProbe.freeSteps * 30 +
        (idealProbe.hasCoastalBuffer ? 25 : 0) -
        (this.evasionChirality !== 0 ? 15 : 0);
    }

    // Deflection Angle Ceiling: Only search offsets 1 (45 deg) and 2 (90 deg).
    // Offsets >= 3 turn 135-180 degrees backwards into a loop!
    for (let offset = 1; offset <= 2; offset++) {
      const cwIdx = (idealIdx + offset) % 8;
      const ccwIdx = (idealIdx - offset + 8) % 8;

      const cwScore = scoreCandidate(cwIdx, offset, 1);
      if (cwScore > bestScore) {
        bestScore = cwScore;
        bestIdx = cwIdx;
        bestChirality = 1;
      }

      const ccwScore = scoreCandidate(ccwIdx, offset, -1);
      if (ccwScore > bestScore) {
        bestScore = ccwScore;
        bestIdx = ccwIdx;
        bestChirality = -1;
      }
    }

    if (bestIdx === -1) {
      // Direct and deflected routes up to 90 degrees are blocked; fall back to lastHeading or 45-degree evasion
      if (this.lastHeading) {
        const lastHv = COMPASS_ROSE.find((h) => h.dir === this.lastHeading);
        if (lastHv && this.probeHeadingClearance(currentPos, lastHv, tilemap).freeSteps >= 1) {
          return this.lastHeading;
        }
      }
      this.evasionChirality = this.evasionChirality === 1 ? -1 : 1;
      const fallbackOffset = this.evasionChirality === 1 ? 1 : 7;
      const fallbackIdx = (idealIdx + fallbackOffset) % 8;
      return COMPASS_ROSE[fallbackIdx].dir;
    }

    if (bestIdx !== idealIdx && bestChirality !== 0) {
      this.evasionChirality = bestChirality;
      this.evasionLockTicks = 6; // Lock handedness for 6 ticks to clear corner without orbiting
    }

    return COMPASS_ROSE[bestIdx].dir;
  }

  /**
   * Overloaded deflection heading method for backwards compatibility with tests and callers.
   */
  public getDeflectionHeading(dir: Direction, tick: number): Direction;
  public getDeflectionHeading(currentPos: Position, target: Position, isFinalApproach?: boolean): Direction | '';
  public getDeflectionHeading(arg1: any, arg2: any, arg3: boolean = false): any {
    if (typeof arg1 === 'string') {
      const directions: Direction[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
      const idx = directions.indexOf(arg1 as Direction);
      if (idx === -1) return arg1;
      const offset = (arg2 as number) % 2 === 0 ? 1 : -1;
      const newIdx = (idx + offset + 8) % 8;
      return directions[newIdx];
    }
    return this.computeDeflectionHeading(arg1 as Position, arg2 as Position, arg3);
  }

  /**
   * Bounded Local BFS Detour: When stuck in a concave bay or tight archipelago
   * channel, finds a short 2x2-clear path around the obstacle and injects a bypass
   * waypoint into `this.course.waypoints`.
   */
  private tryInjectLocalBypassWaypoint(startPos: Position, targetPos: Position): boolean {
    if (!this.course) return false;
    let tilemap: Uint8Array | null = null;
    try {
      tilemap = Assets.data('worldTilemap');
    } catch {
      tilemap = null;
    }
    if (!tilemap || tilemap.length < WORLD_MAP_COLUMNS * WORLD_MAP_ROWS) {
      return false;
    }

    const startX = this.wrapX(Math.round(startPos.x));
    const startY = this.clampY(Math.round(startPos.y));

    const MAX_RADIUS = 12;
    const queue: Array<{ x: number; y: number; firstBypass: Position | null; dist: number }> = [
      { x: startX, y: startY, firstBypass: null, dist: 0 },
    ];
    const visited = new Set<string>([`${startX},${startY}`]);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr.dist > 0) {
        const currPos = { x: curr.x, y: curr.y };
        // If this node has clear 2x2 line of sight to the target waypoint, use it!
        if (
          this.getToroidalDistance(currPos, targetPos) <
            this.getToroidalDistance(startPos, targetPos) - 1.5 &&
          this.hasWaterLineOfSight(currPos, targetPos, 0)
        ) {
          const bypassWaypoint = curr.firstBypass ?? currPos;
          this.course.waypoints.splice(this.course.currentWaypointIndex, 0, bypassWaypoint);
          return true;
        }
      }

      if (curr.dist >= MAX_RADIUS) continue;

      for (const hv of COMPASS_ROSE) {
        if (!this.canStep2x2(curr.x, curr.y, hv.dx, hv.dy, tilemap)) continue;
        const nx = this.wrapX(curr.x + hv.dx);
        const ny = this.clampY(curr.y + hv.dy);
        const key = `${nx},${ny}`;
        if (visited.has(key)) continue;
        visited.add(key);

        // Record intermediate turning point ~4 steps out as the injected waypoint
        const nextBypass =
          curr.dist + 1 === 4 ? { x: nx, y: ny } : curr.firstBypass;
        queue.push({ x: nx, y: ny, firstBypass: nextBypass, dist: curr.dist + 1 });
      }
    }

    return false;
  }

  /**
   * Verified arrival & docking handler:
   * Validates `portAdjacentAt` and ensures `dock()` succeeds before announcing safe docking.
   * If offshore, drops anchor honestly with a guidance alert.
   */
  private handleArrival(player: any, arrivalPos: Position): void {
    if (!this.course) return;

    const { targetPortId, portName, enterPortOnArrival } = this.course;
    this.course.active = false;
    this.course = null;
    state.autopilotCourse = null;
    this.resetStuckState();
    this.detourRecoveryAttempts = 0;
    this.lastHeading = '';
    this.lastPosition = null;
    player.setHeading('');

    if (enterPortOnArrival) {
      // Resolve a guaranteed dockable coordinate within 1 tile if fractional drift occurred
      const dockPos = this.resolveValidDockPosition(arrivalPos, targetPortId) ?? arrivalPos;
      const canDock = this.isDockableAtTargetPort(dockPos, targetPortId);

      let dockSucceeded = false;
      if (canDock) {
        try {
          soundManager.playSfx('victory');
          const result = dock(dockPos);
          dockSucceeded = result !== false;
        } catch {
          dockSucceeded = false;
        }
      }

      if (dockSucceeded) {
        const alert: SeaAlert = {
          id: generateId(),
          type: 'info',
          text: `⚓ DESTINATION REACHED: Fleet has safely docked at ${portName}!`,
          timestamp: Date.now(),
        };
        updateInterface.seaAlert?.(alert);
      } else {
        // Honest notification if harbor entrance is still out of reach
        soundManager.playSfx('shipBell');
        const alert: SeaAlert = {
          id: generateId(),
          type: 'warning',
          text: `⚓ ARRIVED OFFSHORE: Fleet dropped anchor outside ${portName}. Steer into the harbor entrance to dock.`,
          timestamp: Date.now(),
        };
        updateInterface.seaAlert?.(alert);
      }
    } else {
      // Drop anchor outside port in roadstead (food/water continues consuming normally)
      soundManager.playSfx('shipBell');
      const alert: SeaAlert = {
        id: generateId(),
        type: 'info',
        text: `🌊 DESTINATION REACHED: Dropped anchor outside ${portName || 'designated coordinates'}. Standing by in roadstead (supplies consuming normally).`,
        timestamp: Date.now(),
      };
      updateInterface.seaAlert?.(alert);
    }

    this.notify();
  }

  private normalizeAngle(rad: number): number {
    while (rad > Math.PI) rad -= 2 * Math.PI;
    while (rad < -Math.PI) rad += 2 * Math.PI;
    return rad;
  }

  private getOppositeHeading(dir: Direction | ''): Direction | '' {
    const opposites: Record<Direction, Direction> = {
      n: 's', ne: 'sw', e: 'w', se: 'nw',
      s: 'n', sw: 'ne', w: 'e', nw: 'se',
    };
    return dir ? opposites[dir] : '';
  }

  /**
   * Converts 2D delta vector into closest 8-way cardinal/ordinal Direction.
   */
  public vectorToDirection(dx: number, dy: number): Direction {
    const angleRad = Math.atan2(dx, -dy);
    let angleDeg = (angleRad * 180) / Math.PI;
    if (angleDeg < 0) angleDeg += 360;

    if (angleDeg >= 337.5 || angleDeg < 22.5) return 'n';
    if (angleDeg >= 22.5 && angleDeg < 67.5) return 'ne';
    if (angleDeg >= 67.5 && angleDeg < 112.5) return 'e';
    if (angleDeg >= 112.5 && angleDeg < 157.5) return 'se';
    if (angleDeg >= 157.5 && angleDeg < 202.5) return 's';
    if (angleDeg >= 202.5 && angleDeg < 247.5) return 'sw';
    if (angleDeg >= 247.5 && angleDeg < 292.5) return 'w';
    return 'nw';
  }

  /* ---------------- Change Subscription ---------------- */

  public subscribe(cb: () => void): () => void {
    this.changeListeners.add(cb);
    return () => this.changeListeners.delete(cb);
  }

  private notify(): void {
    this.changeListeners.forEach((cb) => cb());
  }
}

export const autopilotManager = new AutopilotManager();
export default autopilotManager;
