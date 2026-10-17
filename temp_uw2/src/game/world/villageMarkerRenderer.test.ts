import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderVillageMarkers } from './villageMarkerRenderer';
import state from '../../state/state';
import { villages } from '../../data/villageData';

describe('villageMarkerRenderer: 16-Bit Flashing Green Square on Sea Canvas', () => {
  let mockContext: any;

  beforeEach(() => {
    state.discoveredVillages = [];
    mockContext = {
      save: vi.fn(),
      restore: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 60 })),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: '',
      textBaseline: '',
      shadowColor: '',
      shadowBlur: 0,
    };
  });

  it('renders green square for sighted village within active line-of-sight and camera view', () => {
    const vStonehenge = villages[0]; // x: 890, y: 265
    const playerPos = { x: 890, y: 260 }; // 5 tiles away (within 14-tile sight)
    const camera = { x: 880, y: 250, width: 40, height: 25 };

    renderVillageMarkers(
      mockContext as unknown as CanvasRenderingContext2D,
      camera,
      playerPos,
      14,
      1280,
      800,
    );

    // Context should save and restore
    expect(mockContext.save).toHaveBeenCalled();
    expect(mockContext.restore).toHaveBeenCalled();

    // fillRect should be called for the green tile wash, corners, and emblem
    expect(mockContext.fillRect).toHaveBeenCalled();
    expect(mockContext.strokeRect).toHaveBeenCalled();
    expect(mockContext.fillText).toHaveBeenCalledWith(
      expect.stringContaining('⛺'),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('renders green square for already discovered village even when outside active sight radius', () => {
    const vStonehenge = villages[0];
    state.discoveredVillages = [vStonehenge.id]; // Charted village

    const distantPlayer = { x: 890, y: 320 }; // 55 tiles away (outside 14-tile sight)
    const camera = { x: 880, y: 250, width: 40, height: 25 }; // But in camera view

    renderVillageMarkers(
      mockContext as unknown as CanvasRenderingContext2D,
      camera,
      distantPlayer,
      14,
      1280,
      800,
    );

    expect(mockContext.fillRect).toHaveBeenCalled();
    expect(mockContext.fillText).toHaveBeenCalledWith('⛺', expect.any(Number), expect.any(Number));
  });

  it('culls and skips unrevealed uncharted villages outside line-of-sight', () => {
    state.discoveredVillages = []; // Stonehenge not yet discovered
    const distantPlayer = { x: 890, y: 400 }; // Far away
    const camera = { x: 880, y: 250, width: 40, height: 25 };

    renderVillageMarkers(
      mockContext as unknown as CanvasRenderingContext2D,
      camera,
      distantPlayer,
      14,
      1280,
      800,
    );

    // Stonehenge is unrevealed and outside sight, so fillRect for tiles should not render for it
    expect(mockContext.fillText).not.toHaveBeenCalled();
  });
});
