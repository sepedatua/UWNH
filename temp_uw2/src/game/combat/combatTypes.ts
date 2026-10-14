import { HexCoord } from './hexUtils';

export type CannonType = 'Normal' | 'Culverin' | 'Carronade';

export interface CannonStats {
  name: CannonType;
  range: number;
  power: number;
  accuracy: number;
  description: string;
}

export const CANNON_DATA: Record<CannonType, CannonStats> = {
  Normal: {
    name: 'Normal',
    range: 2,
    power: 24,
    accuracy: 80,
    description: 'Standard naval cannons with balanced range and punch.',
  },
  Culverin: {
    name: 'Culverin',
    range: 3,
    power: 18,
    accuracy: 90,
    description: 'Long-barrel chasers capable of striking from 3 hexes away.',
  },
  Carronade: {
    name: 'Carronade',
    range: 2,
    power: 38,
    accuracy: 75,
    description: 'Short-range heavy smashers that deliver devastating hull trauma.',
  },
};

export interface CombatShip {
  id: string;
  shipTypeId: string;
  name: string;
  team: 'player' | 'enemy';
  isFlagship: boolean;
  captainName: string;
  battleLevel: number;
  swordsmanship: number;
  gunnery: number;
  durability: number;
  maxDurability: number;
  crew: number;
  maxCrew: number;
  morale: number;
  guns: number;
  maxGuns: number;
  cannonType: CannonType;
  mobility: number;
  sailType: number;
  tacking: number;
  power: number;
  hex: HexCoord;
  heading: number; // 0..5 (NE, E, SE, SW, W, NW)
  movementPoints: number;
  hasActed: boolean;
  isSunk: boolean;
  isSurrendered: boolean;
}

export type AttackerStance = 'thrust' | 'slash' | 'strike';
export type DefenderStance = 'parry' | 'dodge' | 'block';

export interface DuelFighter {
  name: string;
  avatarId: string;
  weaponName: string;
  weaponPower: number;
  weaponCategory: 'Straight Sword' | 'Fencing Sword' | 'Curved Sword' | 'Heavy Sword';
  armorName: string;
  armorDefense: number;
  swordsmanship: number;
  battleLevel: number;
  health: number;
  maxHealth: number;
}

export interface DuelState {
  isActive: boolean;
  playerFighter: DuelFighter;
  enemyFighter: DuelFighter;
  balanceMeter: number; // 0 to 200, 100 is dead center. 200 = player wins, 0 = enemy wins
  round: number;
  log: string[];
  winner: 'player' | 'enemy' | null;
}

export interface FloatingDamage {
  id: string;
  hex: HexCoord;
  text: string;
  color: string;
  createdAt: number;
}

export interface CombatSpoils {
  gold: number;
  fame: number;
  commodities: Array<{ type: string; quantity: number }>;
  capturedShipName?: string;
}

export interface CombatState {
  isActive: boolean;
  round: number;
  wind: {
    direction: number; // 0..5 on hex grid
    speed: number;
  };
  ships: CombatShip[];
  activeShipId: string | null;
  phase: 'player_turn' | 'enemy_turn' | 'firing_animation' | 'duel' | 'victory' | 'defeat';
  log: string[];
  duelState: DuelState | null;
  floatingDamages: FloatingDamage[];
  spoils: CombatSpoils | null;
  boardWidth: number;
  boardHeight: number;
}
