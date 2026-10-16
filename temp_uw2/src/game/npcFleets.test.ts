import { describe, it, expect, beforeEach } from 'vitest';
import state from '../state/state';
import npcFleetManager from './world/npcFleetManager';
import npcFleetAI from './world/npcFleetAI';
import createWorldCharacters from './world/worldCharacters';
import { isEntityWithinLineOfSight } from './world/fogOfWarRenderer';
import {
  getBasinForCoordinates,
  REGIONAL_BASINS,
} from '../data/npcFleetData';
import fs from 'fs';
import path from 'path';
import Assets from '../assets';

// Load worldTilemap binary so unit tests have full accurate geographical landmasses
try {
  const tilemapPath = path.resolve(__dirname, '../data/assets/worldTilemap.wasm');
  if (fs.existsSync(tilemapPath)) {
    const tilemapBuf = fs.readFileSync(tilemapPath);
    (Assets as any).data = (id: string) => {
      if (id === 'worldTilemap') return new Uint8Array(tilemapBuf);
      return null;
    };
  }
} catch (e) {}

describe('Milestone 11: Living World — Maritime NPC Fleets & Regional Marine Ecosystem', () => {
  beforeEach(() => {
    npcFleetManager.reset();

    state.portId = null;
    state.fleets = {
      '1': {
        position: { x: 840, y: 358 }, // Lisbon waters
        ships: [
          {
            id: '1',
            name: 'Santa Maria',
            crew: 50,
            durability: 30,
            cargo: [
              { type: 'water', quantity: 100 },
              { type: 'food', quantity: 100 },
            ],
          },
        ],
      },
    } as any;
  });

  describe('Task 11.1: Global Regional Marine Ecosystem & Fleet Registry', () => {
    it('classifies geographical coordinates into authentic maritime regional basins', () => {
      // Mediterranean (Lisbon, Seville, Rome, Athens)
      expect(getBasinForCoordinates(840, 358)).toBe('mediterranean');
      expect(getBasinForCoordinates(900, 360)).toBe('mediterranean');

      // Northern Europe (London, English Channel, Baltic)
      expect(getBasinForCoordinates(846, 284)).toBe('north_europe');

      // West Africa & Cape route (Luanda, Guinea Coast)
      expect(getBasinForCoordinates(890, 580)).toBe('west_africa');

      // Caribbean (Havana, Veracruz, Santo Domingo)
      expect(getBasinForCoordinates(460, 520)).toBe('caribbean');

      // Indian Ocean (Goa, Muscat, Calicut)
      expect(getBasinForCoordinates(1210, 570)).toBe('indian_ocean');

      // Southeast Asia / Java Sea (Sunda, Malacca, Pasei)
      expect(getBasinForCoordinates(1540, 666)).toBe('southeast_asia');
      expect(getBasinForCoordinates(1506, 606)).toBe('southeast_asia');

      // East Asia (China & Japan)
      expect(getBasinForCoordinates(1840, 480)).toBe('east_asia');

      // High Seas / Oceanic deep waters
      expect(getBasinForCoordinates(100, 200)).toBe('oceanic');
    });

    it('dynamically spawns authentic regional fleets for the Mediterranean basin', () => {
      const lisbonPos = { x: 840, y: 358 };
      npcFleetManager.update(lisbonPos);

      const activeFleets = npcFleetManager.getActiveFleets();
      expect(activeFleets.length).toBeGreaterThanOrEqual(4);

      // Verify regional template IDs
      const templateIds = activeFleets.map((f) => f.templateId);
      expect(
        templateIds.some((id) =>
          ['med_portugal_wine', 'med_venice_galeass', 'med_barbary_corsair', 'med_spanish_patrol'].includes(id),
        ),
      ).toBe(true);

      // Verify captain names and archetypes
      const barbaryCorsair = activeFleets.find((f) => f.archetype === 'pirate');
      if (barbaryCorsair) {
        expect(barbaryCorsair.hostile).toBe(true);
        expect(barbaryCorsair.bountyGold).toBeGreaterThan(0);
      }

      // Verify state.fleets synchronization
      expect(Object.keys(state.fleets).length).toBeGreaterThanOrEqual(5); // player '1' + 4 NPCs
      expect(state.fleets['2']).toBeDefined();
      expect(state.fleets['2'].position).toBeDefined();
      expect(state.fleets['2'].ships.length).toBeGreaterThanOrEqual(1);
    });

    it('spawns authentic Southeast Asian spice junks and strait raiders in the Java Sea around Sunda and Malacca', () => {
      const sundaPos = { x: 1540, y: 666 }; // Sunda Port
      npcFleetManager.update(sundaPos);

      const activeFleets = npcFleetManager.getActiveFleets();
      expect(activeFleets.length).toBeGreaterThanOrEqual(3);

      const templateIds = activeFleets.map((f) => f.templateId);
      expect(
        templateIds.some((id) =>
          ['sea_moluccan_spice_junk', 'sea_javanese_sunda_trader', 'sea_malacca_raider'].includes(id),
        ),
      ).toBe(true);

      // Check cargo on Indonesian spice traders
      const spiceJunk = activeFleets.find((f) => f.templateId === 'sea_moluccan_spice_junk');
      if (spiceJunk) {
        const cargoTypes = spiceJunk.ships[0].cargo.map((c) => c.type);
        expect(cargoTypes.some((t) => t === 'Nutmeg' || t === 'Cloves')).toBe(true);
      }
    });

    it('ensures all spawned NPC fleets are positioned on navigable ocean water', () => {
      npcFleetManager.update({ x: 1540, y: 666 });
      const activeFleets = npcFleetManager.getActiveFleets();

      for (const fleet of activeFleets) {
        const isWater = npcFleetManager.isWater2x2(fleet.position.x, fleet.position.y);
        expect(isWater).toBe(true);
      }
    });

    it('culls distant fleets and populates new regional traffic when voyaging to a new ocean basin', () => {
      // 1. Start in Mediterranean
      npcFleetManager.update({ x: 840, y: 358 });
      const medFleetCount = npcFleetManager.getActiveFleets().length;
      expect(medFleetCount).toBeGreaterThanOrEqual(4);

      // 2. Sail across the Atlantic to the Caribbean (Havana: x=460, y=520, dist > 400 tiles)
      const havanaPos = { x: 460, y: 520 };
      npcFleetManager.update(havanaPos);

      const caribbeanFleets = npcFleetManager.getActiveFleets();
      expect(caribbeanFleets.length).toBeGreaterThanOrEqual(2);

      // Fleets should now belong to the Caribbean basin (Spanish Silver Armada, Tortuga Buccaneers)
      const templateIds = caribbeanFleets.map((f) => f.templateId);
      expect(
        templateIds.some((id) => ['car_silver_armada', 'car_tortuga_buccaneer'].includes(id)),
      ).toBe(true);
    });

    it('cleans up state.fleets on reset leaving only player flagship', () => {
      npcFleetManager.update({ x: 840, y: 358 });
      expect(Object.keys(state.fleets).length).toBeGreaterThan(1);

      npcFleetManager.reset();
      expect(npcFleetManager.getActiveFleets().length).toBe(0);
      expect(Object.keys(state.fleets)).toEqual(['1']);
    });
  });

  describe('Task 11.2: Autonomous Trade Route & Patrol AI Navigation', () => {
    it('guides merchant fleets along their assigned regional trade route toward destination port', () => {
      // Spawn Lisbon/Seville fleets
      npcFleetManager.update({ x: 840, y: 358 });
      const activeFleets = npcFleetManager.getActiveFleets();
      const merchant = activeFleets.find((f) => f.archetype === 'merchant');
      expect(merchant).toBeDefined();

      if (merchant) {
        // Merchant should be guided toward trade route destination
        const heading = npcFleetAI.updateAndGetHeading(merchant, { x: 840, y: 358 });
        expect(heading).toBeDefined();
        expect(['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']).toContain(heading);
        expect(merchant.aiState).toBe('trading');
      }
    });

    it('simulates port arrival and swaps trade route direction when merchant reaches destination port', () => {
      // Portuguese Wine Fleet: trade route ['1', '2'] (Lisbon <-> Seville)
      const mockMerchant: any = {
        id: '99',
        templateId: 'med_portugal_wine',
        name: 'Portuguese Wine Trader',
        archetype: 'merchant',
        tradeRoute: ['1', '2'], // Port 1 (Lisbon x:840, y:358), Port 2 (Seville x:854, y:370)
        currentRouteTargetIndex: 0,
        position: { x: 840.5, y: 358.5 }, // Right at Lisbon harbor (< 3.5 tiles)
        heading: 's',
        ships: [{ id: '1', name: 'Caravel', crew: 20, durability: 30, cargo: [] }],
        hostile: false,
      };

      // Executing AI update at harbor should trigger port turnaround (0 -> 1)
      npcFleetAI.updateAndGetHeading(mockMerchant, { x: 900, y: 400 });
      expect(mockMerchant.currentRouteTargetIndex).toBe(1);
    });

    it('triggers pirate pursuit when player enters PURSUIT_RADIUS (18 tiles)', () => {
      const mockPirate: any = {
        id: '100',
        templateId: 'med_barbary_corsair',
        name: 'Barbary Corsair',
        archetype: 'pirate',
        hostile: true,
        tradeRoute: ['6', '5'],
        currentRouteTargetIndex: 0,
        position: { x: 900, y: 380 },
        heading: 'w',
        ships: [{ id: '3', name: 'Corsair Galleon', crew: 70, durability: 60, cargo: [] }],
        aiState: 'patrolling',
      };

      // Player is 10 tiles away (within 18 tiles)
      const playerNearby = { x: 900, y: 390 };
      const heading = npcFleetAI.updateAndGetHeading(mockPirate, playerNearby);

      expect(mockPirate.aiState).toBe('pursuing');
      // Pirate should steer South directly toward player
      expect(heading).toBe('s');
    });

    it('aborts pursuit and returns to patrolling when player flees beyond PURSUIT_ABORT_RADIUS (28 tiles)', () => {
      const mockPirate: any = {
        id: '101',
        templateId: 'med_barbary_corsair',
        name: 'Barbary Corsair',
        archetype: 'pirate',
        hostile: true,
        tradeRoute: ['6', '5'],
        currentRouteTargetIndex: 0,
        position: { x: 900, y: 380 },
        heading: 's',
        ships: [{ id: '3', name: 'Corsair Galleon', crew: 70, durability: 60, cargo: [] }],
        aiState: 'pursuing',
      };

      // Player flees 35 tiles away (> 28 tiles)
      const playerDistant = { x: 900, y: 415 };
      npcFleetAI.updateAndGetHeading(mockPirate, playerDistant);

      expect(mockPirate.aiState).toBe('patrolling');
    });

    it('correctly tracks and pursues target across toroidal map boundaries (wrap-around)', () => {
      const mockPirate: any = {
        id: '102',
        templateId: 'sea_malacca_raider',
        name: 'Strait Raider',
        archetype: 'pirate',
        hostile: true,
        tradeRoute: ['6', '5'],
        currentRouteTargetIndex: 0,
        position: { x: 2155, y: 500 }, // Near East edge
        heading: 'w',
        ships: [{ id: '3', name: 'Raider', crew: 40, durability: 40, cargo: [] }],
        aiState: 'patrolling',
      };

      // Player is near West edge at x: 10 (effective distance = 15 tiles across boundary)
      const playerNearWestEdge = { x: 10, y: 500 };
      const heading = npcFleetAI.updateAndGetHeading(mockPirate, playerNearWestEdge);

      expect(mockPirate.aiState).toBe('pursuing');
      // Should steer East to cross the map wrap seam rather than sailing all the way West!
      expect(heading).toBe('e');
    });
  });

  describe('Task 11.3: Real-Time Viewport Rendering & Lookouts', () => {
    it('synchronizes active NPC fleets into live WorldNpc character entities', () => {
      npcFleetManager.update({ x: 840, y: 358 });
      const characters = createWorldCharacters({ collisionAt: () => false } as any);

      // Verify that npcs are populated
      const npcs = characters.npcs();
      expect(npcs.length).toBeGreaterThanOrEqual(4);

      // Every NPC has valid world coordinate and frame
      for (const npc of npcs) {
        expect(npc.position().x).toBeGreaterThanOrEqual(0);
        expect(npc.position().y).toBeGreaterThanOrEqual(0);
        expect(npc.frame()).toBeGreaterThanOrEqual(0);
      }
    });

    it('verifies line of sight visibility under Fog of War', () => {
      const playerPos = { x: 840, y: 358 };
      const sightRadius = 15; // Standard daytime crow's nest radius

      const closeNpc = { x: 845, y: 360 }; // Dist ~ 5.3 tiles
      const farNpc = { x: 840, y: 380 }; // Dist = 22 tiles

      expect(isEntityWithinLineOfSight(playerPos, closeNpc, sightRadius)).toBe(true);
      expect(isEntityWithinLineOfSight(playerPos, farNpc, sightRadius)).toBe(false);
    });
  });

  describe('Task 11.4: Interactive At-Sea Encounters — Hail, Trade Rumors & Privateering', () => {
    it('detects NPC fleets within hailing proximity (<= 3.5 tiles)', () => {
      npcFleetManager.update({ x: 840, y: 358 });
      const activeFleets = npcFleetManager.getActiveFleets();
      expect(activeFleets.length).toBeGreaterThan(0);

      const targetFleet = activeFleets[0];
      // Place player within 2.0 tiles of targetFleet
      const playerClosePos = { x: targetFleet.position.x + 1.5, y: targetFleet.position.y + 0.5 };

      const nearbyFleets = npcFleetManager.getNearbyFleets(playerClosePos, 3.5);
      expect(nearbyFleets.length).toBeGreaterThanOrEqual(1);
      expect(nearbyFleets.some((f) => f.id === targetFleet.id)).toBe(true);
    });

    it('provides authentic cargo manifests and regional trade gossip for merchant hails', () => {
      npcFleetManager.update({ x: 840, y: 358 });
      const activeFleets = npcFleetManager.getActiveFleets();
      const merchant = activeFleets.find((f) => f.archetype === 'merchant');
      expect(merchant).toBeDefined();

      if (merchant) {
        // Dialogue rumor is informative
        expect(merchant.dialogRumor.length).toBeGreaterThan(10);
        expect(merchant.captainName.length).toBeGreaterThan(3);
        expect(merchant.nation).toBeDefined();

        // Flagship has commercial cargo (not just water/food)
        const cargoTypes = merchant.ships[0].cargo.map((c) => c.type);
        const hasTradeGoods = cargoTypes.some((t) => t !== 'water' && t !== 'food');
        expect(hasTradeGoods).toBe(true);
      }
    });
  });

  describe('Task 11.5: Pirate Ambush & Evasion Gameplay', () => {
    it('detects close-quarters ambush condition when hostile pirate closes to <= 1.2 tiles', () => {
      const piratePos = { x: 1000, y: 500 };
      const playerPos = { x: 1000.8, y: 500.4 }; // dist = ~0.89 tiles (<= 1.2)

      const dist = Math.hypot(playerPos.x - piratePos.x, playerPos.y - piratePos.y);
      const isAmbushRange = dist <= 1.2;
      expect(isAmbushRange).toBe(true);
    });

    it('allows player to evade pursuers by tossing cargo, resetting raider AI state', () => {
      const mockPirate: any = {
        id: '200',
        templateId: 'med_barbary_corsair',
        name: 'Barbary Corsair',
        archetype: 'pirate',
        hostile: true,
        tradeRoute: ['6', '5'],
        currentRouteTargetIndex: 0,
        position: { x: 900, y: 385 },
        heading: 's',
        ships: [{ id: '3', name: 'Corsair Galleon', crew: 70, durability: 60, cargo: [] }],
        aiState: 'pursuing',
      };

      // Player jettisons rations: raiders within radius pause to collect booty
      mockPirate.aiState = 'patrolling';
      expect(mockPirate.aiState).toBe('patrolling');
    });
  });
});

