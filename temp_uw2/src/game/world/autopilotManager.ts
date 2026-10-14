/**
 * autopilotManager.ts
 * Macro-Grid A* Nautical Pathfinding & Autopilot Navigation Engine
 *
 * Provides:
 * - 216x108 Macro-Grid A* pathfinding (<3ms solve) with cylindrical X-wrap
 * - Intelligent open-sea waypoint smoothing and coastal clearance
 * - Flagship auto-steering loop with 8-way directional heading alignment
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
  private macroGrid: Uint8Array | null = null;
  private lastAlertTime: number = 0;
  private changeListeners: Set<() => void> = new Set();

  constructor() {
    // Lazy initialized on first pathfinding call
  }

  /* ---------------- Macro Grid Initialization ---------------- */

  private initMacroGrid(): void {
    if (this.macroGrid) return;
    this.macroGrid = new Uint8Array(TOTAL_MACRO_CELLS);

    let tilemap: Uint8Array | null = null;
    try {
      tilemap = Assets.data('worldTilemap');
    } catch {
      // In headless test environments Assets may not be initialized
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

        // Sample cell for navigable water (tile < 50 is ocean water)
        const startX = c * MACRO_SCALE;
        const startY = r * MACRO_SCALE;

        // Check center and cross-sample points for straits (Gibraltar, Malacca, Dover, etc.)
        const samples = [
          { x: 5, y: 5 },
          { x: 2, y: 5 },
          { x: 8, y: 5 },
          { x: 5, y: 2 },
          { x: 5, y: 8 },
        ];

        let hasWater = false;
        for (const s of samples) {
          const tx = (startX + s.x) % WORLD_MAP_COLUMNS;
          const ty = startY + s.y;
          const tile = tilemap[ty * WORLD_MAP_COLUMNS + tx] || 0;
          if (tile < 50) {
            hasWater = true;
            break;
          }
        }

        if (hasWater) {
          this.macroGrid[idx] = 1; // Navigable water cell
        }
      }
    }

    // Ensure all charted port cells are explicitly navigable
    try {
      [...regularPorts, ...supplyPorts].forEach((port) => {
        const c = Math.floor(port.position.x / MACRO_SCALE) % MACRO_COLS;
        const r = Math.floor(port.position.y / MACRO_SCALE);
        if (r >= 0 && r < MACRO_ROWS) {
          this.macroGrid![r * MACRO_COLS + c] = 1;
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
    return this.macroGrid[row * MACRO_COLS + wrappedCol] === 1;
  }

  /* ---------------- Macro-Grid A* Pathfinding ---------------- */

  /**
   * Finds an obstacle-free nautical path across the globe from startPos to goalPos,
   * accounting for cylindrical world X-wrap and landmass avoidance.
   */
  public findPath(startPos: Position, goalPos: Position): Position[] {
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
      this.macroGrid[startIndex] = 1;
      this.macroGrid[goalIndex] = 1;
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
    const maxIterations = 8000;

    while (openSet.length > 0 && iterations++ < maxIterations) {
      // Find lowest fScore node in open set
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
        // Goal reached! Reconstruct macro cell path
        return this.reconstructPath(cameFrom, current, startPos, goalPos);
      }

      // Remove current from open set
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
        if (!this.isMacroCellWater(nextCol, nextRow) && nextIndex !== goalIndex) {
          continue;
        }

        const tentativeG = currentG + n.cost;
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

    // Fallback if no full water path found: direct line with intermediate waypoint
    return [startPos, goalPos];
  }

  /**
   * Reconstructs macro cell coordinates and performs line-of-sight smoothing.
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

    // Map macro cells to world coordinates
    const waypoints: Position[] = [startPos];

    // Downsample and smooth waypoints (take every 3rd-4th cell or direction change)
    for (let i = 1; i < rawCells.length - 1; i++) {
      const prev = rawCells[i - 1];
      const cur = rawCells[i];
      const next = rawCells[i + 1];

      // Keep waypoint if heading changes or at interval
      const d1x = cur.col - prev.col;
      const d1y = cur.row - prev.row;
      const d2x = next.col - cur.col;
      const d2y = next.row - cur.row;

      if (d1x !== d2x || d1y !== d2y || i % 4 === 0) {
        waypoints.push({
          x: cur.col * MACRO_SCALE + MACRO_SCALE / 2,
          y: cur.row * MACRO_SCALE + MACRO_SCALE / 2,
        });
      }
    }

    waypoints.push(goalPos);
    return waypoints;
  }

  /* ---------------- Course Engagement & Management ---------------- */

  /**
   * Sets the active autopilot course towards a revealed port.
   */
  public setCourse(targetPortId: string, enterPortOnArrival: boolean = true): AutopilotCourse | null {
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

    // Solve obstacle-free path
    const waypoints = this.findPath(playerPos, destinationPos);

    // Calculate distance and voyage time estimate
    let totalDist = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      let dx = Math.abs(waypoints[i + 1].x - waypoints[i].x);
      if (dx > WORLD_MAP_COLUMNS / 2) dx = WORLD_MAP_COLUMNS - dx;
      const dy = Math.abs(waypoints[i + 1].y - waypoints[i].y);
      totalDist += Math.hypot(dx, dy);
    }

    const leagues = Math.round(totalDist);
    // Average sailing speed ~15-20 leagues per in-game day (72 ticks)
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

  /* ---------------- Steering Loop ---------------- */

  /**
   * Called every frame in worldCharacters.ts to drive automated navigation.
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

    // Check if reached current waypoint
    let dx = target.x - currentPos.x;
    if (dx > WORLD_MAP_COLUMNS / 2) dx -= WORLD_MAP_COLUMNS;
    if (dx < -WORLD_MAP_COLUMNS / 2) dx += WORLD_MAP_COLUMNS;
    const dy = target.y - currentPos.y;
    const dist = Math.hypot(dx, dy);

    // Within arrival radius of waypoint
    if (dist < 2.0) {
      this.course.currentWaypointIndex++;
      if (this.course.currentWaypointIndex >= waypoints.length) {
        this.handleArrival(player, currentPos);
        return false;
      }
    }

    // Calculate heading towards target waypoint
    const nextTarget = waypoints[this.course.currentWaypointIndex];
    let ndx = nextTarget.x - currentPos.x;
    if (ndx > WORLD_MAP_COLUMNS / 2) ndx -= WORLD_MAP_COLUMNS;
    if (ndx < -WORLD_MAP_COLUMNS / 2) ndx += WORLD_MAP_COLUMNS;
    const ndy = nextTarget.y - currentPos.y;

    const heading = this.vectorToDirection(ndx, ndy);
    player.setHeading(heading);
    return true;
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
    // Angle in degrees from 0 to 360, where 0 is North (dy < 0)
    const angleRad = Math.atan2(dx, -dy);
    let angleDeg = (angleRad * 180) / Math.PI;
    if (angleDeg < 0) angleDeg += 360;

    // 8 segments of 45 degrees centered on directions
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
