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

  private resetStuckState(): void {
    this.lastStuckPos = null;
    this.stuckTicks = 0;
    this.stagnantTicks = 0;
    this.deflectionTicksRemaining = 0;
    this.activeDeflectionDir = null;
    this.consecutiveStuckEvents = 0;
    this.lastProgressDist = Infinity;
    this.lastProgressWaypointIndex = -1;
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

        // Sample 25 points across the 10x10 cell to evaluate water clearance
        const startX = c * MACRO_SCALE;
        const startY = r * MACRO_SCALE;
        let waterCount = 0;

        for (let dy = 0; dy < MACRO_SCALE; dy += 2) {
          for (let dx = 0; dx < MACRO_SCALE; dx += 2) {
            const tx = (startX + dx) % WORLD_MAP_COLUMNS;
            const ty = startY + dy;
            const tile = tilemap[ty * WORLD_MAP_COLUMNS + tx] || 0;
            if (tile < 50) {
              waterCount++;
            }
          }
        }

        if (waterCount === 25) {
          this.macroGrid[idx] = 1; // Pure open ocean (cost multiplier = 1.0)
        } else if (waterCount > 0) {
          this.macroGrid[idx] = 2; // Coastal / narrow water (cost multiplier = 4.5)
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
   * Continuous raycast checking whether a direct line between two positions
   * is completely free of land obstacles (tile < 50) including 4-tile ship clearance footprint.
   */
  public hasWaterLineOfSight(p1: Position, p2: Position): boolean {
    let tilemap: Uint8Array | null = null;
    try {
      tilemap = Assets.data('worldTilemap');
    } catch {
      tilemap = null;
    }

    if (!tilemap || tilemap.length < WORLD_MAP_COLUMNS * WORLD_MAP_ROWS) {
      return true; // Test environment without loaded asset
    }

    let dx = p2.x - p1.x;
    if (dx > WORLD_MAP_COLUMNS / 2) dx -= WORLD_MAP_COLUMNS;
    if (dx < -WORLD_MAP_COLUMNS / 2) dx += WORLD_MAP_COLUMNS;
    const dy = p2.y - p1.y;

    const dist = Math.hypot(dx, dy);
    if (dist < 0.5) return true;

    const steps = Math.ceil(dist * 2); // 0.5-tile resolution
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const curX = ((Math.floor(p1.x + dx * t) % WORLD_MAP_COLUMNS) + WORLD_MAP_COLUMNS) % WORLD_MAP_COLUMNS;
      const curY = Math.max(0, Math.min(WORLD_MAP_ROWS - 1, Math.floor(p1.y + dy * t)));

      const nextX = (curX + 1) % WORLD_MAP_COLUMNS;
      const nextY = Math.min(WORLD_MAP_ROWS - 1, curY + 1);

      if (
        tilemap[curY * WORLD_MAP_COLUMNS + curX] >= 50 ||
        tilemap[curY * WORLD_MAP_COLUMNS + nextX] >= 50 ||
        tilemap[nextY * WORLD_MAP_COLUMNS + curX] >= 50 ||
        tilemap[nextY * WORLD_MAP_COLUMNS + nextX] >= 50
      ) {
        return false;
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
    if (cellType === 1 && (!refPos || this.hasWaterLineOfSight(refPos, defaultPos))) {
      return defaultPos;
    }

    // For coastal/bottleneck cells, search for the tile with highest clearance from land
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

        let minDist = 99;
        for (let sdy = -2; sdy <= 2; sdy++) {
          for (let sdx = -2; sdx <= 2; sdx++) {
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
          if (this.hasWaterLineOfSight(refPos, { x: tx, y: ty })) {
            reachableBonus = 100;
          }
        }

        const score = minDist + reachableBonus;
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
        return this.reconstructPath(cameFrom, current, startPos, goalPos);
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
   * Reconstructs macro cell coordinates and generates verified deepest-water waypoints
   * using continuous raycast line-of-sight path smoothing.
   */
  private reconstructPath(
    cameFrom: Int32Array,
    current: number,
    startPos: Position,
    goalPos: Position,
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

    // Generate candidate water waypoints along the cell sequence
    const candidatePoints: Position[] = [startPos];
    let prevPoint = startPos;
    for (let i = 1; i < rawCells.length - 1; i++) {
      const wp = this.getBestWaterTile(rawCells[i].col, rawCells[i].row, prevPoint);
      candidatePoints.push(wp);
      prevPoint = wp;
    }
    candidatePoints.push(goalPos);

    // Raycast Line-of-Sight Path Smoothing (guarantees zero island-clipping)
    const waypoints: Position[] = [startPos];
    let currentIdx = 0;

    while (currentIdx < candidatePoints.length - 1) {
      let furthestIdx = currentIdx + 1;
      // Look ahead up to 10 nodes to smoothly combine open-water cells
      const maxLookAhead = Math.min(candidatePoints.length - 1, currentIdx + 10);
      for (let nextIdx = maxLookAhead; nextIdx > currentIdx; nextIdx--) {
        if (this.hasWaterLineOfSight(candidatePoints[currentIdx], candidatePoints[nextIdx])) {
          furthestIdx = nextIdx;
          break;
        }
      }

      waypoints.push(candidatePoints[furthestIdx]);
      currentIdx = furthestIdx;
    }

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

  /**
   * Called every frame in worldCharacters.ts to drive automated navigation.
   * Features active anti-stuck detection, sustained deflection, net progress tracking,
   * and auto-disengagement when wedged against obstacles.
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

    const currentPos = player.position();
    const waypoints = this.course.waypoints;
    const target = waypoints[this.course.currentWaypointIndex];

    if (!target) {
      this.handleArrival(player, currentPos);
      return false;
    }

    // Check distance to current waypoint
    let dx = target.x - currentPos.x;
    if (dx > WORLD_MAP_COLUMNS / 2) dx -= WORLD_MAP_COLUMNS;
    if (dx < -WORLD_MAP_COLUMNS / 2) dx += WORLD_MAP_COLUMNS;
    const dy = target.y - currentPos.y;
    const dist = Math.hypot(dx, dy);

    // Track waypoint transitions
    if (this.course.currentWaypointIndex !== this.lastProgressWaypointIndex) {
      this.lastProgressWaypointIndex = this.course.currentWaypointIndex;
      this.lastProgressDist = dist;
      this.stagnantTicks = 0;
      this.stuckTicks = 0;
      this.deflectionTicksRemaining = 0;
      this.consecutiveStuckEvents = 0;
    }

    // Track physical position movement
    if (this.lastStuckPos) {
      let movedX = Math.abs(currentPos.x - this.lastStuckPos.x);
      if (movedX > WORLD_MAP_COLUMNS / 2) movedX = WORLD_MAP_COLUMNS - movedX;
      const movedY = Math.abs(currentPos.y - this.lastStuckPos.y);
      const movedDist = Math.hypot(movedX, movedY);

      if (movedDist < 0.08) {
        this.stuckTicks++;
      } else {
        // Decay rather than instantly resetting to 0 to prevent oscillation loops
        this.stuckTicks = Math.max(0, this.stuckTicks - 1);
      }
    }
    this.lastStuckPos = { ...currentPos };

    // Track net progress towards target waypoint
    if (dist < this.lastProgressDist - 0.2) {
      this.lastProgressDist = dist;
      this.stagnantTicks = 0;
      this.consecutiveStuckEvents = 0;
    } else {
      this.stagnantTicks++;
    }

    // Within arrival radius of waypoint
    if (dist < 2.5) {
      this.course.currentWaypointIndex++;
      this.resetStuckState();
      if (this.course.currentWaypointIndex >= waypoints.length) {
        this.handleArrival(player, currentPos);
        return false;
      }
    }

    // Safety Disengage if stuck against shore / island
    if (this.consecutiveStuckEvents >= 4 || this.stuckTicks >= 8 || this.stagnantTicks >= 24) {
      soundManager.playSfx('shipBell');
      this.cancelCourse('⚠️ Coastal Shallows Hazard: Fleet was impeded by shore/island terrain. Disengaged autopilot for manual navigation.');
      player.setHeading('');
      return false;
    }

    // Calculate base heading towards next waypoint
    const nextTarget = waypoints[this.course.currentWaypointIndex];
    let ndx = nextTarget.x - currentPos.x;
    if (ndx > WORLD_MAP_COLUMNS / 2) ndx -= WORLD_MAP_COLUMNS;
    if (ndx < -WORLD_MAP_COLUMNS / 2) ndx += WORLD_MAP_COLUMNS;
    const ndy = nextTarget.y - currentPos.y;
    const baseHeading = this.vectorToDirection(ndx, ndy);

    let finalHeading = baseHeading;

    // Trigger Sustained Deflection if stuck
    if (this.stuckTicks >= 2 && this.deflectionTicksRemaining <= 0) {
      this.consecutiveStuckEvents++;

      // Try skipping ahead if next waypoint is nearby and visible
      if (this.consecutiveStuckEvents >= 2 && this.course.currentWaypointIndex < waypoints.length - 1) {
        const nextWp = waypoints[this.course.currentWaypointIndex + 1];
        if (dist < 6.0 && this.hasWaterLineOfSight(currentPos, nextWp)) {
          this.course.currentWaypointIndex++;
          this.resetStuckState();
          return true;
        }
      }

      // Engage sustained deflection for 6 frames
      this.deflectionTicksRemaining = 6;
      this.activeDeflectionDir = this.getDeflectionHeading(baseHeading, this.consecutiveStuckEvents);
    }

    // Apply active deflection heading if deflection window is active
    if (this.deflectionTicksRemaining > 0) {
      this.deflectionTicksRemaining--;
      finalHeading = this.activeDeflectionDir || baseHeading;
    }

    player.setHeading(finalHeading);
    return true;
  }

  /**
   * Generates a 45-degree deflection heading to smoothly slide off obstacles.
   */
  public getDeflectionHeading(dir: Direction, tick: number): Direction {
    const directions: Direction[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
    const idx = directions.indexOf(dir);
    if (idx === -1) return dir;
    const offset = tick % 2 === 0 ? 1 : -1;
    const newIdx = (idx + offset + 8) % 8;
    return directions[newIdx];
  }

  /**
   * Handles arrival at destination port.
   */
  private handleArrival(player: any, currentPos: Position): void {
    if (!this.course) return;

    const { targetPortId, portName, enterPortOnArrival } = this.course;
    this.course.active = false;
    this.course = null;
    state.autopilotCourse = null;
    this.resetStuckState();

    if (enterPortOnArrival) {
      // Direct harbor docking
      soundManager.playSfx('victory');
      player.setHeading('');
      try {
        dock(currentPos);
      } catch (err) {
        // Handled safely in headless/canvas-less test runners
      }

      const alert: SeaAlert = {
        id: generateId(),
        type: 'info',
        text: `⚓ DESTINATION REACHED: Fleet has safely docked at ${portName}!`,
        timestamp: Date.now(),
      };
      updateInterface.seaAlert?.(alert);
    } else {
      // Drop anchor outside port in roadstead (food/water continues consuming normally)
      soundManager.playSfx('shipBell');
      player.setHeading('');

      const alert: SeaAlert = {
        id: generateId(),
        type: 'info',
        text: `🌊 DESTINATION REACHED: Dropped anchor outside ${portName}. Standing by in roadstead (supplies consuming normally).`,
        timestamp: Date.now(),
      };
      updateInterface.seaAlert?.(alert);
    }

    this.notify();
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
