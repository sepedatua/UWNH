import { describe, it, expect, beforeEach } from 'vitest';
import state from '../../state/state';
import { villages, getVillageById, getNearbyVillage } from '../../data/villageData';
import { discoveries, getDiscoveryById } from '../../data/discoveryData';
import {
  getVillageFriendship,
  setVillageFriendship,
  isVillagePlundered,
  isDiscoveryFound,
  conductVillageSearch,
  conductVillageFeast,
  conductVillagePlunder,
  conductVillageWait,
  getAvailableLuxuryGifts,
} from './villageEngine';

describe('Village & Discoveries System (All 98 Koei Discoveries & Villages)', () => {
  beforeEach(() => {
    state.discoveries = [];
    state.villageFriendship = {};
    state.plunderedVillages = [];
    state.fame = { adventure: 100, trade: 100, piracy: 0 };
    state.gold = 5000;
    state.morale = 80;
    state.dayAtSea = 5;
    state.timePassed = 1000;
    state.fleets = {
      '1': {
        name: 'Flagship Fleet',
        ships: [
          {
            name: 'Hermes II',
            shipType: 'caravel_latina',
            capacity: 200,
            crew: 30,
            cargo: [
              { type: 'food', quantity: 50 },
              { type: 'water', quantity: 50 },
              { type: 'wine', quantity: 5 },
            ],
          } as any,
        ],
      } as any,
    };
  });

  it('contains exactly 98 authentic discoveries and 98 villages', () => {
    expect(discoveries).toHaveLength(98);
    expect(villages).toHaveLength(98);

    // Verify all villages link to a valid discovery
    for (const v of villages) {
      const disc = getDiscoveryById(v.discoveryId);
      expect(disc).toBeDefined();
      expect(disc?.numId).toBe(v.numId);
    }
  });

  it('detects nearby villages with cylindrical wrap tolerance', () => {
    const v1 = villages[0]; // Stonehenge
    const nearby = getNearbyVillage(v1.position.x + 2, v1.position.y - 1, 15);
    expect(nearby).not.toBeNull();
    expect(nearby?.id).toBe(v1.id);

    // Far coordinates return null
    const far = getNearbyVillage(v1.position.x + 500, v1.position.y, 15);
    expect(far).toBeNull();
  });

  it('tracks village friendship and clamps between 0 and 100', () => {
    const v1 = villages[0];
    const initial = getVillageFriendship(v1.id);
    expect(initial).toBe(v1.initialFriendship);

    setVillageFriendship(v1.id, 85);
    expect(getVillageFriendship(v1.id)).toBe(85);

    setVillageFriendship(v1.id, 150);
    expect(getVillageFriendship(v1.id)).toBe(100);

    setVillageFriendship(v1.id, -20);
    expect(getVillageFriendship(v1.id)).toBe(0);
  });

  it('searches village and unearths discovery with 100% friendship', () => {
    const v1 = villages[0];
    setVillageFriendship(v1.id, 100);

    const res = conductVillageSearch(v1);
    expect(res.success).toBe(true);
    expect(res.discovery).toBeDefined();
    expect(res.message).toContain('EUREKA!');
    expect(isDiscoveryFound(res.discovery!.id)).toBe(true);
    expect(state.discoveries).toContain(res.discovery!.id);
    expect(state.fame.adventure).toBeGreaterThan(100);

    // Searching again detects it is already logged
    const res2 = conductVillageSearch(v1);
    expect(res2.success).toBe(true);
    expect(res2.message).toContain('already been unearthed');
  });

  it('hosts feasts with food, water, and luxury goods (+35% to +50%)', () => {
    const v1 = villages[0];
    setVillageFriendship(v1.id, 20);

    // Feast with food
    const foodRes = conductVillageFeast(v1, 'food');
    expect(foodRes.success).toBe(true);
    expect(foodRes.friendshipDelta).toBeGreaterThanOrEqual(15);
    expect(state.fleets['1'].ships[0].cargo.find((c) => c.type === 'food')!.quantity).toBe(40);

    // Feast with luxury cargo (wine)
    const luxuries = getAvailableLuxuryGifts();
    expect(luxuries.some((l) => l.type === 'wine')).toBe(true);

    const cargoRes = conductVillageFeast(v1, 'cargo', 'wine');
    expect(cargoRes.success).toBe(true);
    expect(cargoRes.friendshipDelta).toBeGreaterThanOrEqual(35);
    expect(state.fleets['1'].ships[0].cargo.find((c) => c.type === 'wine')!.quantity).toBe(4);
  });

  it('executes plundering with instant narrative resolution, casualties, and penalties', () => {
    const v1 = villages[0];
    setVillageFriendship(v1.id, 50);

    const plunderRes = conductVillagePlunder(v1);
    expect(plunderRes.success).toBe(true);
    expect(plunderRes.foodGained).toBeGreaterThan(0);
    expect(plunderRes.waterGained).toBeGreaterThan(0);
    expect(plunderRes.goldGained).toBeGreaterThan(0);
    expect(plunderRes.crewLost).toBeGreaterThan(0);

    expect(getVillageFriendship(v1.id)).toBe(0);
    expect(isVillagePlundered(v1.id)).toBe(true);
    expect(state.plunderedVillages).toContain(v1.id);
    expect(state.morale).toBeLessThan(80);
    expect(state.fame.piracy).toBe(120);
    expect(plunderRes.message).toContain('RAID RESULT');
  });

  it('rests & waits, advancing time and consuming daily rations', () => {
    const v1 = villages[0];
    const initialDays = state.dayAtSea;
    const initialTime = state.timePassed;

    const waitRes = conductVillageWait(v1);
    expect(waitRes.success).toBe(true);
    expect(state.dayAtSea).toBe(initialDays + 1);
    expect(state.timePassed).toBe(initialTime + 1440);
    expect(waitRes.message).toContain('anchored peacefully');
  });
});
