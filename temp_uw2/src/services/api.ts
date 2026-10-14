/**
 * Uncharted Waters: New Horizons — API Service Client
 * Connects to PHP MariaDB Backend with Automatic LocalStorage Fallback
 */

export interface User {
  id: number;
  google_sub: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: 'player' | 'admin';
  status: 'active' | 'banned';
}

export type GameMode = 'sp_scenario' | 'sp_endless' | 'mp_endless';

export interface SaveSlotMeta {
  id: number;
  slot_number: number;
  game_mode: GameMode;
  protagonist_id: string;
  protagonist_name: string;
  nationality: string;
  is_alive: number;
  current_year: number;
  current_month: number;
  current_day: number;
  current_port_id: string;
  gold: number;
  fame_adventure: number;
  fame_trade: number;
  fame_piracy: number;
  updated_at: string;
}

export interface SavePayloadInput {
  slot_number: number;
  game_mode: GameMode;
  protagonist_id: string;
  protagonist_name: string;
  nationality: string;
  is_alive?: number;
  current_year: number;
  current_month: number;
  current_day: number;
  current_port_id: string;
  gold: number;
  fame_adventure?: number;
  fame_trade?: number;
  fame_piracy?: number;
  save_payload: any;
  world_x?: number;
  world_y?: number;
  heading?: number;
  is_new_game?: boolean;
}

// Configurable API root URL (supports proxy or direct port)
const API_BASE_URL =
  import.meta.env.VITE_API_URL || '/server';

class ApiService {
  private user: User | null = null;

  constructor() {
    const cached = localStorage.getItem('uw2_cached_user');
    if (cached) {
      try {
        this.user = JSON.parse(cached);
      } catch (e) {
        this.user = null;
      }
    }
  }

  public getCurrentUser(): User | null {
    return this.user;
  }

  public setCurrentUser(user: User | null): void {
    this.user = user;
    if (user) {
      localStorage.setItem('uw2_cached_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('uw2_cached_user');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP error ${response.status}`);
      }
      return data;
    } catch (err: any) {
      console.warn(`[API] Failed request to ${endpoint}:`, err.message);
      throw err;
    }
  }

  // --- Authentication ---
  public async loginWithGoogle(credential: string): Promise<User> {
    try {
      const res = await this.request<{ success: boolean; user: User }>(
        '/auth/google.php',
        {
          method: 'POST',
          body: JSON.stringify({ credential }),
        },
      );
      this.setCurrentUser(res.user);
      return res.user;
    } catch (e) {
      // Mock login for offline development test
      const mockUser: User = {
        id: 1,
        google_sub: 'mock_google_id_123',
        email: 'captain@uncharted.com',
        name: 'Admiral João',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=captain',
        role: 'admin',
        status: 'active',
      };
      this.setCurrentUser(mockUser);
      return mockUser;
    }
  }

  public async checkSession(): Promise<User | null> {
    try {
      const res = await this.request<{ authenticated: boolean; user: User }>(
        '/auth/me.php',
      );
      if (res.authenticated && res.user) {
        this.setCurrentUser(res.user);
        return res.user;
      }
      this.setCurrentUser(null);
      return null;
    } catch (e) {
      return this.user;
    }
  }

  public async logout(): Promise<void> {
    try {
      await this.request('/auth/logout.php', { method: 'POST' });
    } catch (e) {
      // ignore
    } finally {
      this.setCurrentUser(null);
    }
  }

  // --- Save Slots ---
  public async listSaves(): Promise<SaveSlotMeta[]> {
    try {
      const res = await this.request<{ success: boolean; slots: SaveSlotMeta[] }>(
        '/saves/list.php',
      );
      return res.slots;
    } catch (e) {
      // Offline fallback from localStorage
      const localSlots: SaveSlotMeta[] = [];
      for (let i = 1; i <= 10; i++) {
        const raw = localStorage.getItem(`uw2_slot_${i}`);
        if (raw) {
          try {
            const data = JSON.parse(raw);
            localSlots.push({
              id: i,
              slot_number: i,
              game_mode: data.game_mode || 'sp_scenario',
              protagonist_id: data.protagonist_id || '1',
              protagonist_name: data.protagonist_name || 'João Franco',
              nationality: data.nationality || 'Portugal',
              is_alive: data.is_alive !== undefined ? data.is_alive : 1,
              current_year: data.current_year || 1522,
              current_month: data.current_month || 5,
              current_day: data.current_day || 17,
              current_port_id: data.current_port_id || '1',
              gold: data.gold || 1000,
              fame_adventure: data.fame_adventure || 0,
              fame_trade: data.fame_trade || 0,
              fame_piracy: data.fame_piracy || 0,
              updated_at: new Date().toISOString(),
            });
          } catch (err) {}
        }
      }
      return localSlots;
    }
  }

  public async saveSlot(data: SavePayloadInput): Promise<void> {
    // Always persist to localStorage as well
    localStorage.setItem(`uw2_slot_${data.slot_number}`, JSON.stringify(data));

    try {
      await this.request('/saves/save.php', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.info('[API] Offline fallback: save stored in browser localStorage.');
    }
  }

  public async loadSlot(slotNumber: number): Promise<any> {
    try {
      const res = await this.request<{ success: boolean; save_data: any }>(
        `/saves/load.php?slot_number=${slotNumber}`,
      );
      return res.save_data;
    } catch (e) {
      const raw = localStorage.getItem(`uw2_slot_${slotNumber}`);
      if (raw) {
        return JSON.parse(raw);
      }
      throw new Error(`Slot ${slotNumber} not found.`);
    }
  }

  public async deleteSlot(slotNumber: number): Promise<void> {
    localStorage.removeItem(`uw2_slot_${slotNumber}`);
    try {
      await this.request('/saves/delete.php', {
        method: 'POST',
        body: JSON.stringify({ slot_number: slotNumber }),
      });
    } catch (e) {
      // ignore
    }
  }

  // --- Admin User Management ---
  public async getAdminUsers(search = '', page = 1) {
    return this.request<{
      success: boolean;
      total: number;
      users: any[];
    }>(`/admin/users.php?search=${encodeURIComponent(search)}&page=${page}`);
  }

  public async adminToggleBan(userId: number) {
    return this.request<{ success: boolean; status: string }>(
      '/admin/users.php',
      {
        method: 'POST',
        body: JSON.stringify({ action: 'toggle_ban', user_id: userId }),
      },
    );
  }

  public async adminSetRole(userId: number, role: 'player' | 'admin') {
    return this.request<{ success: boolean; role: string }>(
      '/admin/users.php',
      {
        method: 'POST',
        body: JSON.stringify({ action: 'set_role', user_id: userId, role }),
      },
    );
  }

  // --- Multiplayer Living World ---
  public async getMpPort(portId: number, portName?: string) {
    return this.request<{
      success: boolean;
      port: any;
      commodity_prices: Record<number, { price_index: number; stock_quantity: number }>;
    }>(`/mp/ports.php?port_id=${portId}&port_name=${encodeURIComponent(portName || '')}`);
  }

  public async mpTrade(
    portId: number,
    commodityId: number,
    action: 'buy' | 'sell',
    quantity: number,
  ) {
    return this.request<{
      success: boolean;
      new_price_index: number;
      new_stock: number;
    }>('/mp/trade.php', {
      method: 'POST',
      body: JSON.stringify({
        port_id: portId,
        commodity_id: commodityId,
        action,
        quantity,
      }),
    });
  }

  public async mpInvest(
    portId: number,
    gold: number,
    nation: string,
    sector: 'economy' | 'industry',
  ) {
    return this.request('/mp/invest.php', {
      method: 'POST',
      body: JSON.stringify({ port_id: portId, gold, nation, sector }),
    });
  }

  public async getMpGhostFleets(x?: number, y?: number, radius?: number) {
    const q = x !== undefined && y !== undefined ? `?x=${x}&y=${y}&radius=${radius || 120}` : '';
    return this.request<{ success: boolean; count: number; ghost_fleets: any[] }>(`/mp/fleets.php${q}`);
  }

  public async getMpInfluence() {
    return this.request<{
      success: boolean;
      global_control: Array<{
        controlling_nation: string;
        port_count: number;
        total_economy: number;
        total_industry: number;
      }>;
      contested_ports: any[];
    }>('/mp/influence.php');
  }

  public async getMpBounties() {
    return this.request<{
      success: boolean;
      count: number;
      bounties: Array<{
        id: number;
        captain_name: string;
        nation: string;
        world_x: number;
        world_y: number;
        heading: number;
        is_pirate: number;
        bounty_gold: number;
        last_seen: string;
      }>;
    }>('/mp/bounties.php');
  }

  public async mpCheckIn(data: {
    world_x: number;
    world_y: number;
    heading: number;
    captain_name?: string;
    nation?: string;
    is_pirate?: number;
    bounty_gold?: number;
    fleet_data?: any;
  }) {
    return this.request<{ success: boolean; checked_in?: boolean }>('/mp/checkin.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiService();
export default api;
