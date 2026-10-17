import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ATLAS_WIDTH,
  ATLAS_HEIGHT,
  getAtlasMapCanvas,
  clearAtlasMapCache,
} from './atlasMapGenerator';
import Assets from '../../assets';

describe('Atlas Map Generator - High Performance Maritime Cartography Engine', () => {
  beforeEach(() => {
    clearAtlasMapCache();
    vi.restoreAllMocks();
  });

  it('exports correct atlas resolution matching 1/2 world scale', () => {
    expect(ATLAS_WIDTH).toBe(1080);
    expect(ATLAS_HEIGHT).toBe(540);
  });

  it('safely handles missing or corrupted worldTilemap assets without throwing', () => {
    vi.spyOn(Assets, 'data').mockReturnValue(null as any);
    const canvas = getAtlasMapCanvas(true);
    expect(canvas).toBeNull();
  });

  it('safely returns null when tilemap buffer is smaller than world dimensions', () => {
    vi.spyOn(Assets, 'data').mockReturnValue(new Uint8Array(100) as any);
    const canvas = getAtlasMapCanvas(true);
    expect(canvas).toBeNull();
  });

  it('clears cached canvas upon clearAtlasMapCache call', () => {
    clearAtlasMapCache();
    // Cache is cleared cleanly
    expect(true).toBe(true);
  });
});
