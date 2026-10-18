/* eslint-disable jsx-a11y-x/click-events-have-key-events */
/* eslint-disable jsx-a11y-x/no-static-element-interactions */

import { useEffect, useRef, useState } from 'react';
import {
  SpeakerXMarkIcon,
  SpeakerWaveIcon,
  MusicalNoteIcon,
  Cog6ToothIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';

import { getRegionOrIfSupplyPort } from '../../game/port/portUtils';
import soundManager, { SfxType } from './soundManager';

import mastInTheMist from './assets/mast-in-the-mist.ogg';
import themeOfJoao from './assets/theme-of-joão.ogg';
import fiddlersGreen from './assets/fiddlers-green.ogg';
import royalPalace from './assets/royal-palace.ogg';
import supplyPort from './assets/supply-port.ogg';
import emptyEyes from './assets/empty-eyes.ogg';
import theMahout from './assets/the-mahout.ogg';
import landOfLuxury from './assets/land-of-luxury.ogg';
import moslemDance from './assets/moslem-dance.ogg';
import windAhead from './assets/wind-ahead.ogg';
import theChase from './assets/the-chase.ogg';
import capturingEnemiesShips from './assets/capturing-enemies-ships.ogg';
import victoryInANavalBattle from './assets/victory-in-a-naval-battle.ogg';
import defeatedGameOver from './assets/defeated-game-over.ogg';

const getAudioElement = () => {
  const audio = new Audio();
  audio.loop = true;
  audio.autoplay = true;
  return audio;
};

const getTrackInfo = ({
  portId,
  buildingId,
  inCombat,
}: Props): { src: string; key: string } => {
  const battlePhase = soundManager.getBattlePhase();

  if (inCombat || battlePhase !== null) {
    if (battlePhase === 'prize') {
      return { src: capturingEnemiesShips, key: 'capturingEnemiesShips' };
    }
    if (battlePhase === 'victory') {
      return { src: victoryInANavalBattle, key: 'victoryInANavalBattle' };
    }
    if (battlePhase === 'defeat') {
      return { src: defeatedGameOver, key: 'defeatedGameOver' };
    }
    if (battlePhase === 'theChase') {
      return { src: theChase, key: 'theChase' };
    }
    return { src: windAhead, key: 'windAhead' };
  }

  if (portId === null) {
    return { src: themeOfJoao, key: 'themeOfJoao' };
  }

  if (buildingId === '2') {
    return { src: fiddlersGreen, key: 'fiddlersGreen' };
  }

  if (buildingId === '6') {
    return { src: royalPalace, key: 'royalPalace' };
  }

  const region = getRegionOrIfSupplyPort(portId);

  if (region === 'Supply port') {
    return { src: supplyPort, key: 'supplyPort' };
  }

  if (['Ottoman Empire', 'Middle East'].includes(region)) {
    return { src: moslemDance, key: 'moslemDance' };
  }

  if (
    [
      'North Africa',
      'East Africa',
      'West Africa',
      'Central America',
      'South America',
    ].includes(region)
  ) {
    return { src: emptyEyes, key: 'emptyEyes' };
  }

  if (['India'].includes(region)) {
    return { src: theMahout, key: 'theMahout' };
  }

  if (['Southeast Asia', 'Far East'].includes(region)) {
    return { src: landOfLuxury, key: 'landOfLuxury' };
  }

  return { src: mastInTheMist, key: 'mastInTheMist' };
};

interface Props {
  portId: string | null;
  buildingId: string | null;
  inCombat?: boolean;
}

export default function Sound({ portId, buildingId, inCombat }: Props) {
  const audioRef = useRef(getAudioElement());
  const trackRef = useRef<string | null>(null);

  const [hasPlayed, setHasPlayed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [, setTick] = useState(0);

  const isMuted = soundManager.getIsMuted();
  const masterVol = soundManager.getMasterVolume();
  const musicVol = soundManager.getMusicVolume();
  const sfxVol = soundManager.getSfxVolume();
  const mode = soundManager.getSoundtrackMode();
  const trackMeta = soundManager.getCurrentTrack();

  const triggerAutoplay = () => {
    soundManager.ensureContextRunning();
    void audioRef.current.play();
    setHasPlayed(true);
  };

  useEffect(() => {
    soundManager.attachAudioElement(audioRef.current);
    const unsub = soundManager.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  useEffect(() => {
    const { src, key } = getTrackInfo({
      portId,
      buildingId,
      inCombat,
    });

    soundManager.setCurrentTrackKey(key);

    if (trackRef.current !== src) {
      trackRef.current = src;
      audioRef.current.src = src;
      if (hasPlayed && !soundManager.getIsMuted()) {
        void audioRef.current.play();
      }
    }
  }, [portId, buildingId, inCombat, hasPlayed]);

  useEffect(() => {
    if (hasPlayed) {
      return undefined;
    }

    window.addEventListener('click', triggerAutoplay);
    window.addEventListener('keydown', triggerAutoplay);

    return () => {
      window.removeEventListener('click', triggerAutoplay);
      window.removeEventListener('keydown', triggerAutoplay);
    };
  }, [hasPlayed]);

  useEffect(() => {
    audioRef.current.muted = isMuted;
    audioRef.current.volume = musicVol * masterVol;
  }, [isMuted, musicVol, masterVol]);

  const testSfx = (type: SfxType) => {
    soundManager.playSfx(type);
  };

  return (
    <div className="relative inline-block align-bottom select-none">
      {/* Mini Controls */}
      <div className="flex items-center space-x-1">
        <button
          type="button"
          aria-label="Sound Settings"
          title="Audio Settings & Soundtrack Mode"
          className="p-1.5 rounded hover:bg-neutral-800 text-amber-300 transition-colors"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Cog6ToothIcon className="h-6 w-6" />
        </button>

        <button
          type="button"
          aria-label="Toggle Sound Mute"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          className="p-1.5 rounded hover:bg-neutral-800 transition-colors"
          onClick={() => soundManager.toggleMute()}
        >
          {!isMuted ? (
            <SpeakerWaveIcon className="h-7 w-7 text-lime-400" />
          ) : (
            <SpeakerXMarkIcon className="h-7 w-7 text-red-500" />
          )}
        </button>
      </div>

      {/* Retro Parchment Audio Panel Popover */}
      {showSettings && (
        <div className="absolute bottom-12 right-0 z-50 w-80 p-4 rounded-lg border-2 border-amber-800/80 bg-neutral-900/95 text-amber-100 shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-amber-800/50">
            <div className="flex items-center space-x-2">
              <MusicalNoteIcon className="h-5 w-5 text-amber-400" />
              <span className="font-serif font-bold text-base text-amber-200">
                Audio & Soundtrack
              </span>
            </div>
            <button
              type="button"
              className="text-amber-400 hover:text-amber-100 p-0.5"
              onClick={() => setShowSettings(false)}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Now Playing */}
          <div className="mb-3 p-2 rounded bg-amber-950/40 border border-amber-800/40 text-xs">
            <div className="text-amber-400 font-semibold truncate">
              {trackMeta.title}
            </div>
            <div className="text-neutral-400 text-[10px]">
              Composer: {trackMeta.composer}
            </div>
            <div className="text-amber-200/70 text-[10px] italic">
              {trackMeta.description}
            </div>
          </div>

          {/* Soundtrack Mode Switcher */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-amber-300 mb-1 flex justify-between">
              <span>Soundtrack Emulation</span>
              <span className="text-[10px] text-amber-400 font-normal">
                {mode === 'orchestrated' ? 'CD Orchestral' : '16-Bit FM Synth'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                className={`py-1 px-2 rounded border text-center transition-colors ${
                  mode === 'orchestrated'
                    ? 'bg-amber-600/40 border-amber-400 text-amber-100 font-semibold'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-amber-200'
                }`}
                onClick={() => soundManager.setSoundtrackMode('orchestrated')}
              >
                CD Master
              </button>
              <button
                type="button"
                className={`py-1 px-2 rounded border text-center transition-colors ${
                  mode === 'fm_synth'
                    ? 'bg-amber-600/40 border-amber-400 text-amber-100 font-semibold'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-amber-200'
                }`}
                onClick={() => soundManager.setSoundtrackMode('fm_synth')}
              >
                16-Bit FM Synth
              </button>
            </div>
          </div>

          {/* Volume Sliders */}
          <div className="space-y-2 mb-3 text-xs">
            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-neutral-300">Master Volume</span>
                <span className="text-amber-400">{Math.round(masterVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={masterVol}
                onChange={(e) => soundManager.setMasterVolume(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-neutral-300">Music</span>
                <span className="text-amber-400">{Math.round(musicVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={musicVol}
                onChange={(e) => soundManager.setMusicVolume(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-neutral-300">SFX</span>
                <span className="text-amber-400">{Math.round(sfxVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={sfxVol}
                onChange={(e) => soundManager.setSfxVolume(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Web Audio SFX Test Palette */}
          <div>
            <div className="text-[11px] font-semibold text-amber-300/90 mb-1">
              Synthesized Sound Effects
            </div>
            <div className="grid grid-cols-3 gap-1 text-[11px]">
              <button
                type="button"
                className="py-1 px-1.5 rounded bg-neutral-800 hover:bg-amber-900/60 border border-neutral-700 text-amber-200"
                onClick={() => testSfx('cannon')}
              >
                💥 Cannon
              </button>
              <button
                type="button"
                className="py-1 px-1.5 rounded bg-neutral-800 hover:bg-amber-900/60 border border-neutral-700 text-amber-200"
                onClick={() => testSfx('coin')}
              >
                💰 Gold
              </button>
              <button
                type="button"
                className="py-1 px-1.5 rounded bg-neutral-800 hover:bg-amber-900/60 border border-neutral-700 text-amber-200"
                onClick={() => testSfx('bell')}
              >
                🔔 Bell
              </button>
              <button
                type="button"
                className="py-1 px-1.5 rounded bg-neutral-800 hover:bg-amber-900/60 border border-neutral-700 text-amber-200"
                onClick={() => testSfx('sword')}
              >
                ⚔️ Clash
              </button>
              <button
                type="button"
                className="py-1 px-1.5 rounded bg-neutral-800 hover:bg-amber-900/60 border border-neutral-700 text-amber-200"
                onClick={() => testSfx('waves')}
              >
                🌊 Ocean
              </button>
              <button
                type="button"
                className="py-1 px-1.5 rounded bg-neutral-800 hover:bg-amber-900/60 border border-neutral-700 text-amber-200"
                onClick={() => testSfx('fanfare')}
              >
                🎺 Fanfare
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
