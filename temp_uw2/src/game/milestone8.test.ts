import { describe, it, expect, beforeEach, vi } from 'vitest';
import portRegistry from './port/portRegistry';
import { getPortData, portAdjacentAt, resetPortCache } from './port/portUtils';
import soundManager from '../interface/sound/soundManager';
import state from '../state/state';
import { buyCommodity, sellCommodity } from '../state/actionsMarket';
import { COMMODITIES } from '../data/commodityData';

describe('Milestone 8: Port Extensibility & Audio Pipeline Engine', () => {
  beforeEach(() => {
    resetPortCache();
    state.portId = '131';
    state.gold = 50000;
    state.gameMode = 'sp_endless';
    state.fleets = {
      1: {
        ships: [
          {
            id: '1',
            type: 'Caravel',
            name: 'Santa Maria',
            cargo: [],
            crew: 50,
            guns: 10,
            condition: 100,
            capacity: { crew: 60, guns: 16, cargo: 120 },
          },
        ],
      },
    } as any;
    state.marketRates = {};
    state.fame = { adventure: 1000, trade: 1000, piracy: 0 };
  });

  describe('Task 8.1: Port Extensibility System (ports.json & Procedural Mapping)', () => {
    it('loads custom ports from ports.json into portRegistry', () => {
      const customPorts = portRegistry.getAllCustomPorts();
      expect(customPorts.length).toBeGreaterThanOrEqual(5);

      const ids = customPorts.map((p) => p.id);
      expect(ids).toContain('131'); // Singapore
      expect(ids).toContain('132'); // Honolulu
      expect(ids).toContain('133'); // Galapagos
      expect(ids).toContain('134'); // Cape Verde
      expect(ids).toContain('135'); // Sydney
    });

    it('procedurally maps archetype layouts to custom port 131 (Singapore)', () => {
      const singapore = portRegistry.buildPortData('131');
      expect(singapore).toBeDefined();
      expect(singapore?.name).toBe('Singapore');
      expect(singapore?.isSupplyPort).toBe(false);
      // East Asian archetype layout mapping
      expect(singapore?.tileset).toBe(4);
      expect(singapore?.tilemap).toBe(98);
      expect(singapore?.buildings['1']).toBeDefined(); // Market
      expect(singapore?.buildings['2']).toBeDefined(); // Pub
      expect(singapore?.buildings['3']).toBeDefined(); // Shipyard
      expect(singapore?.buildings['4']).toBeDefined(); // Harbor
    });

    it('resolves custom ports through getPortData()', () => {
      const port131 = getPortData('131');
      expect(port131.name).toBe('Singapore');
      expect(port131.economy).toBe(750);
      expect(port131.industry).toBe(700);

      const port133 = getPortData('133');
      expect(port133.name).toBe('Galapagos');
      expect(port133.isSupplyPort).toBe(true);
    });

    it('preserves canonical Montevideo (port 129) and Forel (port 130) as supply ports without custom port collision', () => {
      const montevideo = getPortData('129');
      expect(montevideo.name).toBe('Montevideo');
      expect(montevideo.isSupplyPort).toBe(true);
      expect(montevideo.position).toEqual({ x: 516, y: 906 });
      expect(montevideo.tileset).toBe(3);

      const forel = getPortData('130');
      expect(forel.name).toBe('Forel');
      expect(forel.isSupplyPort).toBe(true);
      expect(forel.position).toEqual({ x: 660, y: 190 });

      // Proximity docking for Montevideo
      const docked = portAdjacentAt({ x: 516, y: 907 });
      expect(docked).toBe('129');
    });

    it('detects proximity docking for custom ports in portAdjacentAt()', () => {
      // Singapore is at x: 1540, y: 590
      const nearby = portAdjacentAt({ x: 1540, y: 591 });
      expect(nearby).toBe('131');

      // Honolulu is at x: 120, y: 460
      const honolulu = portAdjacentAt({ x: 121, y: 460 });
      expect(honolulu).toBe('132');
    });

    it('allows dynamic registration of new ports at runtime', () => {
      portRegistry.registerCustomPort({
        id: '150',
        name: 'Batavia',
        position: { x: 1510, y: 640 },
        economy: 800,
        industry: 750,
        regionId: '7',
        archetype: 'east_asian',
      });
      resetPortCache();

      const batavia = getPortData('150');
      expect(batavia.name).toBe('Batavia');
      expect(batavia.economy).toBe(800);
      expect(portAdjacentAt({ x: 1510, y: 640 })).toBe('150');
    });
  });

  describe('Task 8.3: Audio Pipeline (Yoko Kanno Soundtrack & Procedural Web Audio SFX)', () => {
    it('manages Master, Music, and SFX volume levels with 0..1 clamping', () => {
      soundManager.setMasterVolume(0.85);
      expect(soundManager.getMasterVolume()).toBe(0.85);

      soundManager.setMasterVolume(1.5);
      expect(soundManager.getMasterVolume()).toBe(1.0);

      soundManager.setMasterVolume(-0.5);
      expect(soundManager.getMasterVolume()).toBe(0.0);

      soundManager.setMusicVolume(0.65);
      expect(soundManager.getMusicVolume()).toBe(0.65);

      soundManager.setSfxVolume(0.9);
      expect(soundManager.getSfxVolume()).toBe(0.9);
    });

    it('toggles mute correctly', () => {
      soundManager.setMuted(false);
      expect(soundManager.getIsMuted()).toBe(false);

      soundManager.toggleMute();
      expect(soundManager.getIsMuted()).toBe(true);

      soundManager.toggleMute();
      expect(soundManager.getIsMuted()).toBe(false);
    });

    it('switches soundtrack emulation modes between orchestrated and fm_synth', () => {
      soundManager.setSoundtrackMode('fm_synth');
      expect(soundManager.getSoundtrackMode()).toBe('fm_synth');

      soundManager.setSoundtrackMode('orchestrated');
      expect(soundManager.getSoundtrackMode()).toBe('orchestrated');
    });

    it('retrieves track metadata for Yoko Kanno compositions', () => {
      soundManager.setCurrentTrackKey('themeOfJoao');
      const track = soundManager.getCurrentTrack();
      expect(track.title).toBe('Theme of João');
      expect(track.composer).toBe('Yoko Kanno');
    });

    it('synthesizes procedural SFX (cannon, coin, bell, sword, waves, fanfare) without error', () => {
      expect(() => {
        soundManager.playSfx('cannon');
        soundManager.playSfx('coin');
        soundManager.playSfx('bell');
        soundManager.playSfx('sword');
        soundManager.playSfx('waves');
        soundManager.playSfx('fanfare');
        soundManager.playSfx('click');
      }).not.toThrow();
    });
  });

  describe('Commerce Integration in Extensible Custom Ports', () => {
    it('executes commodity buying and selling in custom port 131 with coin SFX trigger', async () => {
      const spySfx = vi.spyOn(soundManager, 'playSfx');

      const commodity = COMMODITIES[0];
      const buyRes = await buyCommodity(commodity, 10, 50);
      expect(buyRes.success).toBe(true);
      expect(spySfx).toHaveBeenCalledWith('coin');

      const sellRes = await sellCommodity('1', 'Rock Salt', 5, 55);
      expect(sellRes.success).toBe(true);
      expect(spySfx).toHaveBeenCalledWith('coin');

      spySfx.mockRestore();
    });
  });
});
