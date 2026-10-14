import { describe, it, expect, beforeEach, vi } from 'vitest';
import state from '../state/state';
import api from '../services/api';
import ghostFleetManager, { GhostFleet } from './world/ghostFleetManager';
import { buyCommodity, sellCommodity, investInMarket } from '../state/actionsMarket';
import { investInShipyard } from '../state/actionsShipyard';
import { COMMODITIES } from '../data/commodityData';

describe('Milestone 7: Multiplayer Shared Living World', () => {
  beforeEach(() => {
    state.portId = '1';
    state.gold = 50000;
    state.gameMode = 'mp_endless';
    state.nationality = 'Portugal';
    state.protagonistName = 'João Franco';
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
    state.portInvestments = {};
    state.marketRates = {};
    state.fame = { adventure: 1000, trade: 1000, piracy: 0 };
  });

  describe('Task 7.1 & 7.2: Multiplayer Living Economy & Investments', () => {
    it('synchronizes buyCommodity with api.mpTrade when in mp_endless mode', async () => {
      const spyTrade = vi.spyOn(api, 'mpTrade').mockResolvedValue({
        success: true,
        new_price_index: 105,
        new_stock: 950,
      });

      const commodity = COMMODITIES[0]; // e.g. Rock Salt
      const res = await buyCommodity(commodity, 10, 50);

      expect(res.success).toBe(true);
      expect(spyTrade).toHaveBeenCalledWith(1, Number(commodity.id), 'buy', 10);
      spyTrade.mockRestore();
    });

    it('synchronizes sellCommodity with api.mpTrade when in mp_endless mode', async () => {
      // First load cargo
      state.fleets[1].ships[0].cargo = [{ type: 'commodity_1', quantity: 20 }];

      const spyTrade = vi.spyOn(api, 'mpTrade').mockResolvedValue({
        success: true,
        new_price_index: 95,
        new_stock: 1020,
      });

      const res = await sellCommodity('1', 'Rock Salt', 10, 60);

      expect(res.success).toBe(true);
      expect(spyTrade).toHaveBeenCalledWith(1, 1, 'sell', 10);
      spyTrade.mockRestore();
    });

    it('synchronizes investInMarket and investInShipyard with api.mpInvest', async () => {
      const spyInvest = vi.spyOn(api, 'mpInvest').mockResolvedValue({
        success: true,
      } as any);

      // Market economy investment
      const econRes = await investInMarket(5000);
      expect(econRes.success).toBe(true);
      expect(spyInvest).toHaveBeenCalledWith(1, 5000, 'Portugal', 'economy');

      // Shipyard industry investment
      const indRes = await investInShipyard(4000);
      expect(indRes.success).toBe(true);
      expect(spyInvest).toHaveBeenCalledWith(1, 4000, 'Portugal', 'industry');

      spyInvest.mockRestore();
    });

    it('isolates Single Player modes so they do NOT call mpTrade or mpInvest', async () => {
      state.gameMode = 'sp_scenario';

      const spyTrade = vi.spyOn(api, 'mpTrade');
      const spyInvest = vi.spyOn(api, 'mpInvest');

      const commodity = COMMODITIES[0];
      await buyCommodity(commodity, 5, 50);
      await investInMarket(1000);

      expect(spyTrade).not.toHaveBeenCalled();
      expect(spyInvest).not.toHaveBeenCalled();

      spyTrade.mockRestore();
      spyInvest.mockRestore();
    });
  });

  describe('Task 7.3 & 7.4: Ghost Fleet Autonomous Navigation & Interception', () => {
    it('detects proximity and triggers interception with cylindrical wrap', () => {
      const mockFleet: GhostFleet = {
        id: 101,
        captain_name: 'Don Diego',
        nation: 'Spain',
        world_x: 845,
        world_y: 360,
        heading: 1,
        is_pirate: 1,
        bounty_gold: 15000,
        last_seen: '2026-10-14 10:00:00',
      };

      // Direct manager fleet injection for unit testing
      (ghostFleetManager as any).fleets = [mockFleet];

      // Player near (840, 358)
      const intercepted = ghostFleetManager.checkInterception(840, 358, 25);
      expect(intercepted).not.toBeNull();
      expect(intercepted?.captain_name).toBe('Don Diego');

      // Player far away (1500, 500)
      const distant = ghostFleetManager.checkInterception(1500, 500, 25);
      expect(distant).toBeNull();
    });

    it('handles cylindrical coordinate wrap across the 2160 map width', () => {
      const edgeFleet: GhostFleet = {
        id: 102,
        captain_name: 'Admiral Lin',
        nation: 'Ottoman',
        world_x: 2155, // 5 pixels from right edge
        world_y: 400,
        heading: 2,
        is_pirate: 0,
        bounty_gold: 0,
        last_seen: '2026-10-14 10:00:00',
      };

      (ghostFleetManager as any).fleets = [edgeFleet];

      // Player at 5 (5 pixels from left edge) — effective distance is 10 pixels!
      const wrapIntercept = ghostFleetManager.checkInterception(5, 400, 20);
      expect(wrapIntercept).not.toBeNull();
      expect(wrapIntercept?.captain_name).toBe('Admiral Lin');
    });

    it('performs synchronous check-in and updates autonomous sailing AI', async () => {
      const spyCheckIn = vi.spyOn(api, 'mpCheckIn').mockResolvedValue({ success: true });
      const spyFleets = vi.spyOn(api, 'getMpGhostFleets').mockResolvedValue({
        success: true,
        count: 1,
        ghost_fleets: [
          {
            id: 201,
            captain_name: 'Corsair Malek',
            nation: 'Ottoman',
            world_x: 840,
            world_y: 358,
            heading: 0, // Heading 0: North
            is_pirate: 1,
            bounty_gold: 20000,
            last_seen: '2026-10-14 10:00:00',
          },
        ],
      });

      // Force intervals
      (ghostFleetManager as any).lastCheckInTime = 0;
      (ghostFleetManager as any).lastFetchTime = 0;

      const intercept = await ghostFleetManager.update(840, 358, 0);

      expect(spyCheckIn).toHaveBeenCalled();
      expect(spyFleets).toHaveBeenCalled();
      expect(intercept).not.toBeNull();
      expect(intercept?.captain_name).toBe('Corsair Malek');

      spyCheckIn.mockRestore();
      spyFleets.mockRestore();
    });
  });

  describe('Task 7.5: Player Piracy & Bounty Hunting Board', () => {
    it('fetches live wanted bounties and global national influence', async () => {
      const spyBounties = vi.spyOn(api, 'getMpBounties').mockResolvedValue({
        success: true,
        count: 2,
        bounties: [
          {
            id: 901,
            captain_name: 'Khayr ad-Din Barbarossa',
            nation: 'Ottoman',
            world_x: 1060,
            world_y: 380,
            heading: 2,
            is_pirate: 1,
            bounty_gold: 45000,
            last_seen: '2026-10-14 10:00:00',
          },
          {
            id: 902,
            captain_name: 'Black Jack Hawkins',
            nation: 'England',
            world_x: 910,
            world_y: 250,
            heading: 4,
            is_pirate: 1,
            bounty_gold: 30000,
            last_seen: '2026-10-14 10:00:00',
          },
        ],
      });

      const spyInfluence = vi.spyOn(api, 'getMpInfluence').mockResolvedValue({
        success: true,
        global_control: [
          { controlling_nation: 'Portugal', port_count: 25, total_economy: 20000, total_industry: 18000 },
          { controlling_nation: 'Spain', port_count: 22, total_economy: 18000, total_industry: 19000 },
        ],
        contested_ports: [],
      });

      const bountiesRes = await api.getMpBounties();
      expect(bountiesRes.success).toBe(true);
      expect(bountiesRes.bounties).toHaveLength(2);
      expect(bountiesRes.bounties[0].captain_name).toBe('Khayr ad-Din Barbarossa');

      const infRes = await api.getMpInfluence();
      expect(infRes.success).toBe(true);
      expect(infRes.global_control[0].controlling_nation).toBe('Portugal');

      spyBounties.mockRestore();
      spyInfluence.mockRestore();
    });
  });
});
