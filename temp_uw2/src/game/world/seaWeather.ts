/**
 * seaWeather.ts
 * Dynamic Sea Weather & Heavy Fog Anomaly System
 *
 * Simulates localized maritime weather phenomena:
 * - Clear skies / fair winds
 * - Heavy Sea Fog / Dense Mist corridors (Grand Banks, English Channel, Cape Horn, Kuril Sea)
 * - Storms / Gales
 */

import state from '../../state/state';
import updateInterface, { SeaAlert } from '../../state/updateInterface';
import { generateId } from '../../utils';
import soundManager from '../../interface/sound/soundManager';

export type WeatherType = 'clear' | 'fog' | 'storm';

export interface FogCorridor {
  name: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  probability: number;
}

export const FOG_CORRIDORS: FogCorridor[] = [
  {
    name: 'Grand Banks of Newfoundland',
    minX: 430,
    maxX: 530,
    minY: 310,
    maxY: 410,
    probability: 0.03, // 3% per sea day in cold subarctic waters
  },
  {
    name: 'English Channel & North Sea',
    minX: 840,
    maxX: 940,
    minY: 230,
    maxY: 330,
    probability: 0.025,
  },
  {
    name: 'Cape Horn & Roaring Forties',
    minX: 440,
    maxX: 620,
    minY: 910,
    maxY: 1040,
    probability: 0.04,
  },
  {
    name: 'Kuril Sea & Okhotsk Mist',
    minX: 1680,
    maxX: 1820,
    minY: 210,
    maxY: 350,
    probability: 0.035,
  },
];

class SeaWeatherManager {
  private weather: WeatherType = 'clear';
  private durationTicks: number = 0;
  private cooldownTicks: number = 0; // 5-day cooldown after fog clears
  private mistOffset: number = 0;
  private lastAlertTime: number = 0;

  constructor() {
    this.weather = (state.seaWeather as WeatherType) || 'clear';
  }

  public getWeather(): WeatherType {
    return this.weather;
  }

  public setWeather(w: WeatherType, durationHours = 24): void {
    this.weather = w;
    state.seaWeather = w;
    this.durationTicks = durationHours * 3; // 3 ticks per hour (20 mins per tick)
  }

  public isFoggy(): boolean {
    return this.weather === 'fog';
  }

  public isStormy(): boolean {
    return this.weather === 'storm';
  }

  public getMistOffset(): number {
    return this.mistOffset;
  }

  public updateMistAnimation(): void {
    this.mistOffset = (this.mistOffset + 0.35) % 1000;
  }

  public isInFogCorridor(worldX: number, worldY: number): FogCorridor | null {
    for (const corridor of FOG_CORRIDORS) {
      if (
        worldX >= corridor.minX &&
        worldX <= corridor.maxX &&
        worldY >= corridor.minY &&
        worldY <= corridor.maxY
      ) {
        return corridor;
      }
    }
    return null;
  }

  /**
   * Called on every world time tick (every 20 in-game minutes)
   */
  public tick(worldX: number, worldY: number): WeatherType {
    this.updateMistAnimation();

    if (this.durationTicks > 0) {
      this.durationTicks--;
      if (this.durationTicks <= 0) {
        this.clearWeather();
      }
      return this.weather;
    }

    if (this.cooldownTicks > 0) {
      this.cooldownTicks--;
      return this.weather;
    }

    // Check if sailing through a notorious heavy fog corridor
    const corridor = this.isInFogCorridor(worldX, worldY);
    if (corridor) {
      // 72 ticks per day: probability / 72 per tick
      const perTickChance = corridor.probability / 72;
      if (Math.random() < perTickChance) {
        this.triggerHeavyFog(corridor.name);
        return this.weather;
      }
    }
    // Sunny waters (Mediterranean, Caribbean, Tropics) have 0% chance of heavy fog

    return this.weather;
  }

  public triggerHeavyFog(corridorName: string): void {
    this.weather = 'fog';
    state.seaWeather = 'fog';
    this.durationTicks = 24 + Math.floor(Math.random() * 36); // 8 to 20 hours

    soundManager.playSfx('waves');

    const now = Date.now();
    if (now - this.lastAlertTime > 20000) {
      this.lastAlertTime = now;
      const alert: SeaAlert = {
        id: generateId(),
        type: 'warning',
        text: `🌫️ HEAVY FOG: Dense sea mist has descended upon the fleet near ${corridorName}! Vision reduced to near-zero. Beware of reefs and pirate ambushes!`,
        timestamp: now,
      };
      updateInterface.seaAlert?.(alert);
    }
  }

  public clearWeather(): void {
    const wasFog = this.weather === 'fog';
    this.weather = 'clear';
    state.seaWeather = 'clear';
    this.durationTicks = 0;

    if (wasFog) {
      this.cooldownTicks = 360; // 5 in-game days cooldown (72 ticks/day)
      const alert: SeaAlert = {
        id: generateId(),
        type: 'info',
        text: '☀️ The dense sea mist has lifted! Sunshine returns to the open sea.',
        timestamp: Date.now(),
      };
      updateInterface.seaAlert?.(alert);
    }
  }
}

export const seaWeather = new SeaWeatherManager();
export default seaWeather;
