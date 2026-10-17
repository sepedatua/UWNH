import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import VillageModal from './VillageModal';
import { getVillageById } from '../../data/villageData';
import state from '../../state/state';
import logger from '../../logger';

describe('VillageModal Component & Archaeopteryx Settlement Responsiveness', () => {
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    state.discoveries = [];
    state.villageFriendship = {};
    state.plunderedVillages = [];
    state.gold = 10000;
    state.fleets = {
      '1': {
        name: 'Player Fleet',
        ships: [
          {
            name: 'Victoria',
            shipType: 'carrack',
            crew: 45,
            cargo: [
              { type: 'food', quantity: 50 },
              { type: 'water', quantity: 50 },
            ],
          } as any,
        ],
      } as any,
    };
    logger.clearLogs();
  });

  afterEach(() => {
    if (root && container) {
      act(() => {
        root?.unmount();
      });
      container.remove();
    }
    container = null;
    root = null;
  });

  it('renders Archaeopteryx Settlement with pointer-events-auto and active buttons', () => {
    const village = getVillageById('vil_53_archaeopteryx');
    expect(village).toBeDefined();
    expect(village?.name).toBe('Archaeopteryx Settlement');

    const onClose = vi.fn();

    act(() => {
      root?.render(<VillageModal village={village!} onClose={onClose} />);
    });

    // Check modal root element has pointer-events-auto
    const modalRoot = container?.querySelector('.pointer-events-auto');
    expect(modalRoot).not.toBeNull();
    expect(modalRoot?.className).toContain('pointer-events-auto');

    // Check title is rendered
    expect(container?.textContent).toContain('Archaeopteryx Settlement');

    // Check that logger recorded opening event
    const logs = logger.getRecentLogs();
    const openLog = logs.find((l) => l.category === 'VillageModal' && l.message.includes('Opened Settlement Modal'));
    expect(openLog).toBeDefined();
    expect(openLog?.details.villageId).toBe('vil_53_archaeopteryx');

    // Find and click "Leave Village" button
    const leaveBtn = Array.from(container?.querySelectorAll('button') || []).find((b) =>
      b.textContent?.includes('Leave Village')
    );
    expect(leaveBtn).toBeDefined();

    act(() => {
      leaveBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onClose).toHaveBeenCalledTimes(1);

    // Verify closing log was emitted
    const closeClickLog = logger.getRecentLogs().find((l) => l.message.includes('Leave Village button clicked'));
    expect(closeClickLog).toBeDefined();
  });

  it('dismisses modal on Escape key press', () => {
    const village = getVillageById('vil_53_archaeopteryx')!;
    const onClose = vi.fn();

    act(() => {
      root?.render(<VillageModal village={village} onClose={onClose} />);
    });

    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(onClose).toHaveBeenCalledTimes(1);

    const escapeLog = logger.getRecentLogs().find((l) => l.message.includes('[Escape] triggered'));
    expect(escapeLog).toBeDefined();
  });

  it('dismisses modal on backdrop click', () => {
    const village = getVillageById('vil_53_archaeopteryx')!;
    const onClose = vi.fn();

    act(() => {
      root?.render(<VillageModal village={village} onClose={onClose} />);
    });

    const modalRoot = container?.querySelector('.pointer-events-auto') as HTMLDivElement;
    expect(modalRoot).toBeDefined();

    act(() => {
      modalRoot.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onClose).toHaveBeenCalledTimes(1);

    const backdropLog = logger.getRecentLogs().find((l) => l.message.includes('Backdrop clicked'));
    expect(backdropLog).toBeDefined();
  });
});
