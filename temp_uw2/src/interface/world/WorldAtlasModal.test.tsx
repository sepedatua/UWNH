import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import WorldAtlasModal from './WorldAtlasModal';
import state from '../../state/state';
import explorationManager from '../../game/world/explorationManager';

describe('WorldAtlasModal: 4-Pillar Cartographic Label & Zoom Engine', () => {
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    explorationManager.reset();
    state.discoveries = ['disc_1_rosetta'];
    state.discoveredVillages = ['vil_1'];
    state.gold = 10000;
    state.portId = null; // Sailing at sea
    state.fleets = {
      '1': {
        position: { x: 840, y: 358 },
        ships: [{ id: '1', name: 'Victoria', crew: 45, cargo: [] } as any],
      } as any,
    };

    // Canvas 2D context mock
    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      translate: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      drawImage: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      strokeText: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 25 }),
      setLineDash: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockCtx as any);
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
    vi.restoreAllMocks();
  });

  it('renders the Imperial Maritime Atlas modal with title and cartographic toolbars', () => {
    act(() => {
      root?.render(<WorldAtlasModal isOpen={true} onClose={() => {}} />);
    });

    expect(container?.textContent).toContain('CHARTA UNIVERSALIS');
    expect(container?.textContent).toContain('IMPERIAL MARITIME ATLAS');
    expect(container?.textContent).toContain('Coastlines & Land');
    expect(container?.textContent).toContain('Full Globe');
    expect(container?.textContent).toContain('Ports');
    expect(container?.textContent).toContain('Discoveries');
    expect(container?.textContent).toContain('Labels (ON)');
  });

  it('toggles Labels (ON) to Labels (OFF) when the toolbar toggle is clicked', () => {
    act(() => {
      root?.render(<WorldAtlasModal isOpen={true} onClose={() => {}} />);
    });

    const labelsBtn = Array.from(container?.querySelectorAll('button') || []).find((b) =>
      b.textContent?.includes('Labels'),
    );
    expect(labelsBtn).toBeDefined();
    expect(labelsBtn?.textContent).toContain('Labels (ON)');

    act(() => {
      labelsBtn?.click();
    });

    expect(labelsBtn?.textContent).toContain('Labels (OFF)');

    act(() => {
      labelsBtn?.click();
    });

    expect(labelsBtn?.textContent).toContain('Labels (ON)');
  });

  it('updates zoom percentage when clicking zoom in (+), zoom out (-), and reset (100%)', () => {
    act(() => {
      root?.render(<WorldAtlasModal isOpen={true} onClose={() => {}} />);
    });

    const zoomInBtn = Array.from(container?.querySelectorAll('button') || []).find(
      (b) => b.getAttribute('title') === 'Zoom In (+)',
    );
    const zoomOutBtn = Array.from(container?.querySelectorAll('button') || []).find(
      (b) => b.getAttribute('title') === 'Zoom Out (-)',
    );
    const resetZoomBtn = Array.from(container?.querySelectorAll('button') || []).find((b) =>
      b.textContent?.includes('100%'),
    );

    expect(container?.textContent).toContain('100%');

    // Zoom in (+0.5 -> 150%)
    act(() => {
      zoomInBtn?.click();
    });
    expect(container?.textContent).toContain('150%');

    // Zoom in again (+0.5 -> 200%)
    act(() => {
      zoomInBtn?.click();
    });
    expect(container?.textContent).toContain('200%');

    // Zoom out (-0.5 -> 150%)
    act(() => {
      zoomOutBtn?.click();
    });
    expect(container?.textContent).toContain('150%');

    // Reset zoom (-> 100%)
    act(() => {
      resetZoomBtn?.click();
    });
    expect(container?.textContent).toContain('100%');
  });

  it('centers on the flagship when clicking the Ship button', () => {
    act(() => {
      root?.render(<WorldAtlasModal isOpen={true} onClose={() => {}} />);
    });

    const shipBtn = Array.from(container?.querySelectorAll('button') || []).find(
      (b) => b.getAttribute('title')?.includes('Center & Zoom on Flagship'),
    );
    expect(shipBtn).toBeDefined();

    act(() => {
      shipBtn?.click();
    });

    // Centers and zooms to 250%
    expect(container?.textContent).toContain('250%');
  });

  it('calls onClose when clicking the close button or pressing Escape', () => {
    const handleClose = vi.fn();

    act(() => {
      root?.render(<WorldAtlasModal isOpen={true} onClose={handleClose} />);
    });

    const closeBtn = Array.from(container?.querySelectorAll('button') || []).find((b) =>
      b.textContent?.includes('Close Atlas'),
    );
    expect(closeBtn).toBeDefined();

    act(() => {
      closeBtn?.click();
    });
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Escape key
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
