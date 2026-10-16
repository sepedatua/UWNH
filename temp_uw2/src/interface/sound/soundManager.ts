/**
 * SoundManager: Web Audio API Sound Effects Engine & Soundtrack Controller
 * Features:
 * - Authentic procedural Web Audio SFX (Cannon, Coins, Ship Bell, Sword Clash, Waves, Fanfare)
 * - Yoko Kanno soundtrack streaming with track metadata
 * - Dual Soundtrack Modes: 'orchestrated' (CD Quality) vs 'fm_synth' (16-Bit Retro FM Emulation)
 * - Independent Master, Music, and SFX volume controls with LocalStorage persistence
 */

export type SoundtrackMode = 'orchestrated' | 'fm_synth';
export type SfxType = 'cannon' | 'coin' | 'bell' | 'sword' | 'waves' | 'fanfare' | 'click';

export interface TrackMetadata {
  id: string;
  title: string;
  composer: string;
  description: string;
}

export const TRACK_METADATA: Record<string, TrackMetadata> = {
  mastInTheMist: {
    id: 'mastInTheMist',
    title: 'Mast in the Mist',
    composer: 'Yoko Kanno',
    description: 'European Ports & Waters',
  },
  themeOfJoao: {
    id: 'themeOfJoao',
    title: 'Theme of João',
    composer: 'Yoko Kanno',
    description: 'High Seas Voyage & Open Ocean',
  },
  fiddlersGreen: {
    id: 'fiddlersGreen',
    title: "Fiddler's Green",
    composer: 'Yoko Kanno',
    description: 'Tavern Merrymaking & Sailor Dice',
  },
  royalPalace: {
    id: 'royalPalace',
    title: 'Royal Palace',
    composer: 'Yoko Kanno',
    description: 'Imperial Audience & Grand Chapels',
  },
  supplyPort: {
    id: 'supplyPort',
    title: 'Supply Port',
    composer: 'Yoko Kanno',
    description: 'Frontier Outposts & Edge of the World',
  },
  emptyEyes: {
    id: 'emptyEyes',
    title: 'Empty Eyes',
    composer: 'Yoko Kanno',
    description: 'Americas & African Coastlines',
  },
  theMahout: {
    id: 'theMahout',
    title: 'The Mahout',
    composer: 'Yoko Kanno',
    description: 'India & Arabian Sea Trading',
  },
  landOfLuxury: {
    id: 'landOfLuxury',
    title: 'Land of Luxury',
    composer: 'Yoko Kanno',
    description: 'East Asia, Spice Islands & China Seas',
  },
  moslemDance: {
    id: 'moslemDance',
    title: 'Moslem Dance',
    composer: 'Yoko Kanno',
    description: 'Ottoman Empire & Middle East Bazaars',
  },
};

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private musicAudio: HTMLAudioElement | null = null;
  private mediaSourceNode: MediaElementAudioSourceNode | null = null;
  private fmFilterNode: BiquadFilterNode | null = null;
  private musicGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;

  private masterVolume = 0.8;
  private musicVolume = 0.7;
  private sfxVolume = 0.9;
  private isMuted = false;
  private mode: SoundtrackMode = 'orchestrated';
  private currentTrackKey = 'themeOfJoao';

  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadSettings();
  }

  private initAudio() {
    if (this.audioCtx) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioCtx = new AudioContextClass();

      // Master Gain
      this.masterGainNode = this.audioCtx.createGain();
      this.masterGainNode.gain.value = this.isMuted ? 0 : this.masterVolume;
      this.masterGainNode.connect(this.audioCtx.destination);

      // SFX Gain
      this.sfxGainNode = this.audioCtx.createGain();
      this.sfxGainNode.gain.value = this.sfxVolume;
      this.sfxGainNode.connect(this.masterGainNode);

      // Music Gain & FM Synth Filter
      this.musicGainNode = this.audioCtx.createGain();
      this.musicGainNode.gain.value = this.musicVolume;

      this.fmFilterNode = this.audioCtx.createBiquadFilter();
      this.fmFilterNode.type = 'lowpass';
      this.fmFilterNode.frequency.value = this.mode === 'fm_synth' ? 3600 : 20000;
      this.fmFilterNode.Q.value = this.mode === 'fm_synth' ? 2.5 : 0.7;

      this.musicGainNode.connect(this.fmFilterNode);
      this.fmFilterNode.connect(this.masterGainNode);
    } catch (e) {
      console.warn('Web Audio API could not be initialized:', e);
    }
  }

  public attachAudioElement(audio: HTMLAudioElement) {
    this.musicAudio = audio;
    this.initAudio();

    if (this.audioCtx && !this.mediaSourceNode && this.musicAudio && this.musicGainNode) {
      try {
        this.mediaSourceNode = this.audioCtx.createMediaElementSource(this.musicAudio);
        this.mediaSourceNode.connect(this.musicGainNode);
      } catch (e) {
        // May already be connected or CORS restricted in certain environments
      }
    }
  }

  public ensureContextRunning() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      void this.audioCtx.resume();
    }
  }

  /* ---------------- Procedural Sound Effects ---------------- */

  public playSfx(type: SfxType) {
    this.initAudio();
    this.ensureContextRunning();
    if (!this.audioCtx || !this.sfxGainNode || this.isMuted) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    switch (type) {
      case 'cannon':
        this.synthCannon(ctx, now);
        break;
      case 'coin':
        this.synthCoin(ctx, now);
        break;
      case 'bell':
        this.synthBell(ctx, now);
        break;
      case 'sword':
        this.synthSword(ctx, now);
        break;
      case 'waves':
        this.synthWaves(ctx, now);
        break;
      case 'fanfare':
        this.synthFanfare(ctx, now);
        break;
      case 'click':
        this.synthClick(ctx, now);
        break;
    }
  }

  private synthCannon(ctx: AudioContext, now: number) {
    // 1. Sub-bass boom
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
    oscGain.gain.setValueAtTime(0.9, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGainNode!);
    osc.start(now);
    osc.stop(now + 0.5);

    // 2. White noise explosion blast
    const bufferSize = Math.floor(ctx.sampleRate * 0.5);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + 0.5);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(1.0, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGainNode!);
    whiteNoise.start(now);
    whiteNoise.stop(now + 0.5);
  }

  private synthCoin(ctx: AudioContext, now: number) {
    // Two high bright chimes (B5 -> E6)
    const tones = [987.77, 1318.51];
    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * 0.08;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
      osc.connect(gain);
      gain.connect(this.sfxGainNode!);
      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  }

  private synthBell(ctx: AudioContext, now: number) {
    // Harmonic ship bell (880 Hz + 1764 Hz overtone)
    [880, 1764, 2640].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      const amp = 0.5 / (i + 1);
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(this.sfxGainNode!);
      osc.start(now);
      osc.stop(now + 1.2);
    });
  }

  private synthSword(ctx: AudioContext, now: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.15);
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(gain);
    gain.connect(this.sfxGainNode!);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  private synthWaves(ctx: AudioContext, now: number) {
    const bufferSize = Math.floor(ctx.sampleRate * 1.5);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02; // Brown noise approximation
      lastOut = output[i];
    }

    const brownNoise = ctx.createBufferSource();
    brownNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.linearRampToValueAtTime(600, now + 0.7);
    filter.frequency.linearRampToValueAtTime(250, now + 1.5);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.7);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

    brownNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGainNode!);
    brownNoise.start(now);
    brownNoise.stop(now + 1.5);
  }

  private synthFanfare(ctx: AudioContext, now: number) {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.14;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain);
      gain.connect(this.sfxGainNode!);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  private synthClick(ctx: AudioContext, now: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.sfxGainNode!);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  /* ---------------- Music Controls & Settings ---------------- */

  public setSoundtrackMode(mode: SoundtrackMode) {
    this.mode = mode;
    this.initAudio();
    if (this.fmFilterNode) {
      if (mode === 'fm_synth') {
        this.fmFilterNode.frequency.value = 3400;
        this.fmFilterNode.Q.value = 2.8;
      } else {
        this.fmFilterNode.frequency.value = 20000;
        this.fmFilterNode.Q.value = 0.7;
      }
    }
    this.saveSettings();
    this.notify();
  }

  public getSoundtrackMode(): SoundtrackMode {
    return this.mode;
  }

  public setMasterVolume(v: number) {
    this.masterVolume = Math.max(0, Math.min(1, v));
    this.initAudio();
    if (this.masterGainNode && !this.isMuted) {
      this.masterGainNode.gain.value = this.masterVolume;
    }
    this.saveSettings();
    this.notify();
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public setMusicVolume(v: number) {
    this.musicVolume = Math.max(0, Math.min(1, v));
    this.initAudio();
    if (this.musicGainNode) {
      this.musicGainNode.gain.value = this.musicVolume;
    }
    if (this.musicAudio) {
      this.musicAudio.volume = this.musicVolume;
    }
    this.saveSettings();
    this.notify();
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public setSfxVolume(v: number) {
    this.sfxVolume = Math.max(0, Math.min(1, v));
    this.initAudio();
    if (this.sfxGainNode) {
      this.sfxGainNode.gain.value = this.sfxVolume;
    }
    this.saveSettings();
    this.notify();
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    this.initAudio();
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = muted ? 0 : this.masterVolume;
    }
    if (this.musicAudio) {
      this.musicAudio.muted = muted;
    }
    this.saveSettings();
    this.notify();
  }

  public toggleMute() {
    this.setMuted(!this.isMuted);
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setCurrentTrackKey(key: string) {
    this.currentTrackKey = key;
    this.notify();
  }

  public getCurrentTrack(): TrackMetadata {
    return (
      TRACK_METADATA[this.currentTrackKey] || {
        id: this.currentTrackKey,
        title: 'Theme of João',
        composer: 'Yoko Kanno',
        description: 'Voyage on the High Seas',
      }
    );
  }

  private isAudioPaused = false;

  public setPausedAudio(isPaused: boolean) {
    this.isAudioPaused = isPaused;
    this.initAudio();
    this.ensureContextRunning();

    if (this.audioCtx && this.musicGainNode) {
      const now = this.audioCtx.currentTime;
      this.musicGainNode.gain.cancelScheduledValues(now);
      this.musicGainNode.gain.setValueAtTime(this.musicGainNode.gain.value, now);

      if (isPaused) {
        this.musicGainNode.gain.linearRampToValueAtTime(this.musicVolume * 0.35, now + 0.3);

        if (this.fmFilterNode) {
          this.fmFilterNode.frequency.cancelScheduledValues(now);
          this.fmFilterNode.frequency.setValueAtTime(this.fmFilterNode.frequency.value, now);
          this.fmFilterNode.frequency.linearRampToValueAtTime(1200, now + 0.3);
        }

        this.synthWaves(this.audioCtx, now);
      } else {
        this.musicGainNode.gain.linearRampToValueAtTime(this.musicVolume, now + 0.3);

        if (this.fmFilterNode) {
          this.fmFilterNode.frequency.cancelScheduledValues(now);
          this.fmFilterNode.frequency.setValueAtTime(this.fmFilterNode.frequency.value, now);
          this.fmFilterNode.frequency.linearRampToValueAtTime(
            this.mode === 'fm_synth' ? 3400 : 20000,
            now + 0.3,
          );
        }

        this.playSfx('click');
      }
    }

    if (this.musicAudio) {
      this.musicAudio.volume = isPaused ? this.musicVolume * 0.35 : this.musicVolume;
    }
  }

  public getIsAudioPaused(): boolean {
    return this.isAudioPaused;
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  private saveSettings() {
    try {
      localStorage.setItem(
        'uw2_audio_settings',
        JSON.stringify({
          masterVolume: this.masterVolume,
          musicVolume: this.musicVolume,
          sfxVolume: this.sfxVolume,
          isMuted: this.isMuted,
          mode: this.mode,
        }),
      );
    } catch (e) {
      // LocalStorage might be disabled
    }
  }

  private loadSettings() {
    try {
      const data = localStorage.getItem('uw2_audio_settings');
      if (data) {
        const parsed = JSON.parse(data);
        if (typeof parsed.masterVolume === 'number') this.masterVolume = parsed.masterVolume;
        if (typeof parsed.musicVolume === 'number') this.musicVolume = parsed.musicVolume;
        if (typeof parsed.sfxVolume === 'number') this.sfxVolume = parsed.sfxVolume;
        if (typeof parsed.isMuted === 'boolean') this.isMuted = parsed.isMuted;
        if (parsed.mode === 'orchestrated' || parsed.mode === 'fm_synth') this.mode = parsed.mode;
      }
    } catch (e) {
      // ignore
    }
  }
}

export const soundManager = new SoundManager();
export default soundManager;
