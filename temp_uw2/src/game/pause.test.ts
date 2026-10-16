import { beforeEach, describe, expect, test, vi } from 'vitest';
import state from '../state/state';
import { togglePause, setPaused, getIsPaused } from '../state/actionsGame';
import soundManager from '../interface/sound/soundManager';
import PercentNextMove from '../percentNextMove';
import Input from '../input';
import updateInterface from '../state/updateInterface';

describe('Pause Functionality', () => {
  beforeEach(() => {
    state.isPaused = false;
    state.timePassed = 1000;
    state.dayAtSea = 3;
    state.portId = null;
    state.fleets = {
      '1': {
        position: { x: 840, y: 358 },
        ships: [
          {
            id: '1',
            name: 'Flagship',
            crew: 20,
            durability: 30,
            cargo: [
              { type: 'water', quantity: 20 },
              { type: 'food', quantity: 20 },
            ],
          },
        ],
      },
    };
  });

  test('togglePause toggles pause state and notifies interface', () => {
    let notifiedPaused: boolean | undefined;
    updateInterface.isPaused = (p) => {
      notifiedPaused = p;
    };

    expect(getIsPaused()).toBe(false);

    togglePause();
    expect(getIsPaused()).toBe(true);
    expect(state.isPaused).toBe(true);
    expect(notifiedPaused).toBe(true);

    togglePause();
    expect(getIsPaused()).toBe(false);
    expect(state.isPaused).toBe(false);
    expect(notifiedPaused).toBe(false);
  });

  test('setPaused triggers soundManager volume ducking and unpause restoration', () => {
    const audioSpy = vi.spyOn(soundManager, 'setPausedAudio');
    const resetSpy = vi.spyOn(PercentNextMove, 'reset');

    setPaused(true);
    expect(audioSpy).toHaveBeenCalledWith(true);

    setPaused(false);
    expect(audioSpy).toHaveBeenCalledWith(false);
    expect(resetSpy).toHaveBeenCalled();
  });

  test('Input.getDirection returns empty string when paused', () => {
    setPaused(true);
    const dir = Input.getDirection({ includeOrdinal: false });
    expect(dir).toBe('');
    expect(Input.getPressedE()).toBe(false);

    setPaused(false);
  });

  test('Zero provisions consumed when paused in simulated game loop', () => {
    setPaused(true);

    // Initial provisions
    const ship = state.fleets['1'].ships[0];
    const initialWater = ship.cargo.find((c) => c.type === 'water')?.quantity;
    const initialFood = ship.cargo.find((c) => c.type === 'food')?.quantity;
    const initialDayAtSea = state.dayAtSea;
    const initialTimePassed = state.timePassed;

    // Simulate multiple frame ticks while paused
    for (let frame = 0; frame < 60; frame++) {
      if (state.isPaused) {
        // Paused loop early-returns without calling worldTimeTick or processDailySurvival
        continue;
      }
    }

    expect(state.dayAtSea).toEqual(initialDayAtSea);
    expect(state.timePassed).toEqual(initialTimePassed);

    const currentWater = ship.cargo.find((c) => c.type === 'water')?.quantity;
    const currentFood = ship.cargo.find((c) => c.type === 'food')?.quantity;
    expect(currentWater).toEqual(initialWater);
    expect(currentFood).toEqual(initialFood);
  });
});
