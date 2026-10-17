/**
 * logger.ts
 * Enterprise Game Engine Logger & Crash Diagnostic System
 *
 * Captures, throttles, and persists runtime logs, state transitions, canvas errors,
 * and black-screen diagnostics to a physical log file (`game_debug.log`) via Vite middleware
 * and localStorage ring buffer.
 */

import state from './state/state';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  details?: any;
  stateSnapshot?: Record<string, any> | null;
}

const STORAGE_KEY = 'uw2_recent_logs';
const MAX_LOCAL_LOGS = 300;
const THROTTLE_MS = 3000;

class GameLogger {
  private inMemoryLogs: LogEntry[] = [];
  private errorThrottler = new Map<string, { count: number; lastSent: number }>();
  private lastRenderTimestamp = Date.now();
  private blackScreenAlertSent = false;
  private isBrowser = typeof window !== 'undefined';

  constructor() {
    if (this.isBrowser) {
      this.setupGlobalHandlers();
      this.exposeDebugGlobals();
    }
  }

  private getSafeStateSnapshot(): Record<string, any> | null {
    try {
      if (!state) return null;
      const playerFleet = state.fleets?.[1] || state.fleets?.['1'];
      return {
        portId: state.portId,
        buildingId: state.buildingId,
        pos: playerFleet?.position ? { x: Math.round(playerFleet.position.x), y: Math.round(playerFleet.position.y) } : null,
        dayAtSea: state.dayAtSea,
        inCombat: state.inCombat,
        isPaused: state.isPaused,
        autopilot: state.autopilotCourse?.active
          ? { target: state.autopilotCourse.portName, days: state.autopilotCourse.estimatedDays }
          : null,
      };
    } catch {
      return null;
    }
  }

  private formatConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp.slice(11, 23)}] [${entry.category}]`;
    switch (entry.level) {
      case 'DEBUG':
        console.debug(`%c${prefix} ${entry.message}`, 'color: #94a3b8', entry.details ?? '');
        break;
      case 'INFO':
        console.log(`%c${prefix} ${entry.message}`, 'color: #38bdf8', entry.details ?? '');
        break;
      case 'WARN':
        console.warn(`%c${prefix} ⚠️ ${entry.message}`, 'color: #f59e0b; font-weight: bold', entry.details ?? '', entry.stateSnapshot ?? '');
        break;
      case 'ERROR':
      case 'FATAL':
        console.error(`%c${prefix} 🛑 ${entry.message}`, 'color: #ef4444; font-weight: bold', entry.details ?? '', entry.stateSnapshot ?? '');
        break;
    }
  }

  private sendToLogFile(entry: LogEntry): void {
    if (!this.isBrowser) return;

    try {
      void fetch('/api/game-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
        keepalive: true,
      }).catch(() => {
        // Fallback or offline without throwing
      });
    } catch {
      // Ignore network transport failures
    }
  }

  private saveToLocalStorage(): void {
    if (!this.isBrowser) return;
    try {
      const recent = this.inMemoryLogs.slice(-MAX_LOCAL_LOGS);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
    } catch {
      // Ignore localStorage quotas
    }
  }

  public log(level: LogLevel, category: string, message: string, details?: any): void {
    const now = Date.now();
    const key = `${level}:${category}:${message}`;

    // Throttle identical error spam (e.g. 60fps render errors)
    if (level === 'ERROR' || level === 'FATAL') {
      const existing = this.errorThrottler.get(key);
      if (existing) {
        existing.count++;
        if (now - existing.lastSent < THROTTLE_MS) {
          return; // Suppress repeated spam
        }
        // Send batch report
        message = `${message} (Repeated ${existing.count} times in last ${Math.round((now - existing.lastSent) / 1000)}s)`;
        existing.count = 0;
        existing.lastSent = now;
      } else {
        this.errorThrottler.set(key, { count: 0, lastSent: now });
      }
    }

    const stateSnapshot = level === 'WARN' || level === 'ERROR' || level === 'FATAL'
      ? this.getSafeStateSnapshot()
      : null;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      details: details instanceof Error ? { message: details.message, stack: details.stack } : details,
      stateSnapshot,
    };

    this.inMemoryLogs.push(entry);
    if (this.inMemoryLogs.length > MAX_LOCAL_LOGS * 2) {
      this.inMemoryLogs = this.inMemoryLogs.slice(-MAX_LOCAL_LOGS);
    }

    this.formatConsole(entry);
    this.sendToLogFile(entry);
    this.saveToLocalStorage();
  }

  public debug(category: string, message: string, details?: any): void {
    this.log('DEBUG', category, message, details);
  }

  public info(category: string, message: string, details?: any): void {
    this.log('INFO', category, message, details);
  }

  public warn(category: string, message: string, details?: any): void {
    this.log('WARN', category, message, details);
  }

  public error(category: string, message: string, details?: any): void {
    this.log('ERROR', category, message, details);
  }

  public fatal(category: string, message: string, details?: any): void {
    this.log('FATAL', category, message, details);
  }

  /**
   * Health Monitor: Called on each successful canvas draw frame.
   */
  public recordFrameRender(): void {
    this.lastRenderTimestamp = Date.now();
    if (this.blackScreenAlertSent) {
      this.info('HealthMonitor', 'Canvas rendering recovered from previous stoppage.');
      this.blackScreenAlertSent = false;
    }
  }

  /**
   * Checks if the game loop has stopped drawing for an abnormal period (>3.5s).
   */
  public checkBlackScreen(): boolean {
    if (!this.isBrowser) return false;
    // Don't report black screen if user paused the game or is in a building/modal
    if (state.isPaused || state.buildingId !== null) return false;

    const elapsed = Date.now() - this.lastRenderTimestamp;
    if (elapsed > 3500 && !this.blackScreenAlertSent) {
      this.blackScreenAlertSent = true;
      this.fatal(
        'BlackScreen',
        `BLACK SCREEN DETECTED: Canvas rendering has ceased for ${(elapsed / 1000).toFixed(1)}s!`,
        {
          elapsedMs: elapsed,
          canvasInDOM: !!document.getElementById('camera'),
          portId: state.portId,
          buildingId: state.buildingId,
        },
      );
      return true;
    }
    return false;
  }

  public getRecentLogs(): LogEntry[] {
    return [...this.inMemoryLogs];
  }

  public clearLogs(): void {
    this.inMemoryLogs = [];
    if (this.isBrowser) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  private setupGlobalHandlers(): void {
    window.addEventListener('error', (event) => {
      this.fatal('GlobalWindow', `Uncaught Exception: ${event.message}`, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      this.fatal(
        'UnhandledPromise',
        `Unhandled Promise Rejection: ${reason?.message || String(reason)}`,
        {
          stack: reason?.stack || 'No stack trace available',
        },
      );
    });
  }

  private exposeDebugGlobals(): void {
    (window as any).__uw2Logs = {
      get: () => this.getRecentLogs(),
      clear: () => this.clearLogs(),
      download: () => {
        const text = this.inMemoryLogs
          .map((l) => `[${l.timestamp}] [${l.level}] [${l.category}] ${l.message} ${l.details ? JSON.stringify(l.details) : ''}`)
          .join('\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `game_debug_${Date.now()}.log`;
        a.click();
        URL.revokeObjectURL(url);
      },
    };
  }
}

export const logger = new GameLogger();
export default logger;
