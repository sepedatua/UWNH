import { beforeEach, describe, expect, it } from 'vitest';
import state from './state';
import { remodelShip, repairFleet, getFleetDamageStatus } from './actionsShipyard';
import { shipData } from '../data/shipData';

describe('actionsShipyard - Remodel & Repair Engine', () => {
  beforeEach(() => {
    state.gold = 5000;
    state.fleets = {
      '1': {
        position: { x: 840, y: 358 },
        ships: [
          {
            id: '1', // Balsa (capacity: 50, minCrew: 5, maxCrew: 20, maxGuns: 4)
            name: 'São Gabriel',
            durability: 35,
            crew: 15,
            cargo: [],
          },
          {
            id: '2', // Hansa Cog (capacity: 120, minCrew: 10, maxCrew: 40, maxGuns: 10)
            name: 'Santa Clara',
            durability: 45,
            crew: 25,
            cargo: [],
          },
        ],
      },
    };
  });

  describe('remodelShip & Ship Rechristening', () => {
    it('successfully renames a vessel when remodeled with a new name', () => {
      const res = remodelShip(0, 18, 4, 'Esperança');

      expect(res.success).toBe(true);
      expect(state.fleets['1'].ships[0].name).toBe('Esperança');
      expect(state.fleets['1'].ships[0].maxCrew).toBe(18);
      expect(state.fleets['1'].ships[0].maxGuns).toBe(4);
      expect(state.gold).toBe(4800); // 5000 - 200
      expect(res.message).toContain('Esperança');
      expect(res.message).toContain('rechristened');
    });

    it('keeps existing name when newName is omitted or whitespace', () => {
      const res = remodelShip(1, 15, 8, '   ');

      expect(res.success).toBe(true);
      expect(state.fleets['1'].ships[1].name).toBe('Santa Clara');
      expect(state.fleets['1'].ships[1].maxCrew).toBe(15);
      expect(state.fleets['1'].ships[1].maxGuns).toBe(8);
      expect(res.message).toContain('Santa Clara');
      expect(res.message).not.toContain('rechristened');
    });

    it('trims leading and trailing whitespace from the ship name', () => {
      const res = remodelShip(0, 10, 2, '   Black Pearl   ');

      expect(res.success).toBe(true);
      expect(state.fleets['1'].ships[0].name).toBe('Black Pearl');
    });

    it('rejects remodeling if player has less than 200 gold', () => {
      state.gold = 100;
      const res = remodelShip(0, 15, 2, 'Brave Heart');

      expect(res.success).toBe(false);
      expect(res.message).toContain('lack the funds');
      expect(state.fleets['1'].ships[0].name).toBe('São Gabriel'); // Unchanged
    });

    it('rejects remodeling if crew quarters exceed maximum allowed for the ship template', () => {
      const template = shipData['1'];
      const res = remodelShip(0, template.maximumCrew + 10, 0, 'Giant Balsa');

      expect(res.success).toBe(false);
      expect(res.message).toContain('Crew quarters must be between');
      expect(state.fleets['1'].ships[0].name).toBe('São Gabriel');
    });

    it('rejects remodeling if gun ports exceed maximum allowed for the ship template', () => {
      const template = shipData['1'];
      const res = remodelShip(0, template.minimumCrew, template.maximumGuns + 5, 'War Balsa');

      expect(res.success).toBe(false);
      expect(res.message).toContain('Gun ports must be between');
      expect(state.fleets['1'].ships[0].name).toBe('São Gabriel');
    });

    it('rejects remodeling if combined crew and guns exceed total ship capacity', () => {
      const origCapacity = shipData['1'].capacity;
      try {
        shipData['1'].capacity = 25; // Force capacity lower than maxCrew (20) + maxGuns (10)
        const res = remodelShip(0, 20, 8, 'Overloaded Vessel');

        expect(res.success).toBe(false);
        expect(res.message).toContain('Total crew and guns cannot exceed');
      } finally {
        shipData['1'].capacity = origCapacity;
      }
    });
  });
});
