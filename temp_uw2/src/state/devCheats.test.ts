import { describe, it, expect, beforeEach, vi } from 'vitest';
import state from './state';
import updateInterface from './updateInterface';
import {
  injectGold,
  setGold,
  getGoldBalance,
  initDevCheats,
} from './devCheats';

describe('devCheats - Protagonist Gold Injection', () => {
  beforeEach(() => {
    state.gold = 1000;
    state.protagonistId = '1';
    state.protagonistName = 'João Franco';
    state.nationality = 'Portugal';
  });

  it('injects default 10,000 gold (1 ingot) when no argument is supplied', () => {
    const generalSpy = vi.fn();
    updateInterface.general = generalSpy;

    const newGold = injectGold();

    expect(newGold).toBe(11000);
    expect(state.gold).toBe(11000);
    expect(generalSpy).toHaveBeenCalledWith(
      expect.objectContaining({ gold: 11000 }),
    );
  });

  it('injects custom gold amount and updates interface', () => {
    const generalSpy = vi.fn();
    updateInterface.general = generalSpy;

    const newGold = injectGold(50000);

    expect(newGold).toBe(51000);
    expect(state.gold).toBe(51000);
    expect(generalSpy).toHaveBeenCalledWith(
      expect.objectContaining({ gold: 51000 }),
    );
  });

  it('allows subtracting gold with negative injection but clamps to 0', () => {
    injectGold(-500);
    expect(state.gold).toBe(500);

    injectGold(-2000);
    expect(state.gold).toBe(0);
  });

  it('handles invalid inputs gracefully without corrupting gold state', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = injectGold('invalid' as any);
    expect(result).toBe(1000);
    expect(state.gold).toBe(1000);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('sets exact gold amount via setGold', () => {
    const generalSpy = vi.fn();
    updateInterface.general = generalSpy;

    const result = setGold(250000);

    expect(result).toBe(250000);
    expect(state.gold).toBe(250000);
    expect(generalSpy).toHaveBeenCalledWith(
      expect.objectContaining({ gold: 250000 }),
    );
  });

  it('clamps setGold to 0 for negative values', () => {
    const result = setGold(-5000);

    expect(result).toBe(0);
    expect(state.gold).toBe(0);
  });

  it('returns current gold balance via getGoldBalance', () => {
    state.gold = 77777;
    expect(getGoldBalance()).toBe(77777);
  });

  it('registers console helper methods on global window and window.uw2 namespace', () => {
    initDevCheats();

    expect(typeof (window as any).injectGold).toBe('function');
    expect(typeof (window as any).setGold).toBe('function');
    expect(typeof (window as any).getGold).toBe('function');
    expect(typeof (window as any).uw2?.injectGold).toBe('function');
    expect((window as any).uw2?.state).toBe(state);

    // Call through window
    const newBal = (window as any).injectGold(20000);
    expect(newBal).toBe(21000);
    expect(state.gold).toBe(21000);
  });
});
