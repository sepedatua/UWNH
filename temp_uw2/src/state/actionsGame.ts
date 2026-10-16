import state from './state';
import updateInterface from './updateInterface';
import soundManager from '../interface/sound/soundManager';
import PercentNextMove from '../percentNextMove';

/**
 * Toggles global pause state across sailing and port views.
 */
export const togglePause = (): boolean => {
  return setPaused(!state.isPaused);
};

/**
 * Sets explicit pause state.
 * When paused:
 * - Freezes sailing progression & ocean time ticks (zero food/water consumed).
 * - Halts port town NPC steps and walking time advancement.
 * - Ducks music volume to ~35% with acoustic low-pass filter and ambient wave swell.
 * When resumed:
 * - Resets PercentNextMove delta-timer to avoid frame jumps.
 * - Restores audio volume and filter smoothly.
 */
export const setPaused = (paused: boolean): boolean => {
  if (state.isPaused === paused) {
    return state.isPaused;
  }

  state.isPaused = paused;
  updateInterface.isPaused?.(paused);

  if (paused) {
    soundManager.setPausedAudio(true);
  } else {
    PercentNextMove.reset();
    soundManager.setPausedAudio(false);
  }

  return state.isPaused;
};

export const getIsPaused = (): boolean => {
  return state.isPaused;
};
