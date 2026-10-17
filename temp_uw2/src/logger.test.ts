import { describe, it, expect, beforeEach, vi } from 'vitest';
import logger from './logger';
import state from './state/state';

describe('GameLogger: Enterprise Diagnostic Logging & Crash System', () => {
  beforeEach(() => {
    logger.clearLogs();
    state.portId = '1';
    state.buildingId = null;
    state.fleets = {
      '1': {
        position: { x: 840, y: 358 },
        ships: [],
      },
    } as any;
  });

  it('records info, warn, and error log entries with structured fields', () => {
    logger.info('TestCategory', 'Informational message', { extra: 'data' });
    logger.warn('TestCategory', 'Warning message');
    logger.error('TestCategory', 'Error occurred', new Error('Test failure'));

    const logs = logger.getRecentLogs();
    expect(logs.length).toBe(3);

    expect(logs[0].level).toBe('INFO');
    expect(logs[0].category).toBe('TestCategory');
    expect(logs[0].message).toBe('Informational message');
    expect(logs[0].details).toEqual({ extra: 'data' });

    expect(logs[1].level).toBe('WARN');
    expect(logs[1].stateSnapshot).toBeDefined();
    expect(logs[1].stateSnapshot?.portId).toBe('1');

    expect(logs[2].level).toBe('ERROR');
    expect(logs[2].details?.message).toBe('Test failure');
    expect(logs[2].stateSnapshot?.pos).toEqual({ x: 840, y: 358 });
  });

  it('throttles rapid duplicate error logs within 3-second window', () => {
    const errorMsg = 'Repeated render loop glitch';
    // Log 10 identical errors rapidly (simulating 60fps render loop failure)
    for (let i = 0; i < 10; i++) {
      logger.error('GameLoop', errorMsg);
    }

    const logs = logger.getRecentLogs();
    // Only the first one should be recorded immediately, suppressing 9 spam entries
    expect(logs.length).toBe(1);
    expect(logs[0].message).toBe(errorMsg);
  });

  it('detects prolonged render freeze via checkBlackScreen', () => {
    logger.recordFrameRender();
    expect(logger.checkBlackScreen()).toBe(false);

    // Simulate 4 seconds elapsed without canvas frame
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 4000);

    const isBlackScreen = logger.checkBlackScreen();
    expect(isBlackScreen).toBe(true);

    const logs = logger.getRecentLogs();
    const fatalEntry = logs.find((l) => l.category === 'BlackScreen');
    expect(fatalEntry).toBeDefined();
    expect(fatalEntry?.level).toBe('FATAL');
    expect(fatalEntry?.message).toContain('BLACK SCREEN DETECTED');

    vi.restoreAllMocks();
  });
});
