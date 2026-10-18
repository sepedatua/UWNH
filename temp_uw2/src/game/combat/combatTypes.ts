import { HexCoord, PixelCoord } from './hexUtils';

export type CannonType =
  | 'Normal'
  | 'Culverin'
  | 'Carronade'
  | 'Pedrero'
  | 'Saker'
  | 'Demi-Culverin'
  | 'Cannon';

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
    range: 3,
    power: 24,
    accuracy: 80,
    description: 'Standard naval cannons with balanced range and punch.',
  },
  Pedrero: {
    name: 'Pedrero',
    range: 2,
    power: 26,
    accuracy: 75,
    description: 'Short-range stone-thrower cannon with heavy close impact.',
  },
  Saker: {
    name: 'Saker',
    range: 3,
    power: 28,
    accuracy: 80,
    description: 'Reliable medium-caliber naval artillery.',
  },
  'Demi-Culverin': {
    name: 'Demi-Culverin',
    range: 4,
    power: 24,
    accuracy: 85,
    description: 'Long-barrel chaser gun capable of hitting from 4 hexes away.',
  },
  Culverin: {
    name: 'Culverin',
    range: 5,
    power: 22,
    accuracy: 90,
    description: 'Max-range long gun capable of precision bombardment from 5 hexes.',
  },
  Cannon: {
    name: 'Cannon',
    range: 3,
    power: 36,
    accuracy: 80,
    description: 'Heavy battle line artillery that punches deep into enemy hulls.',
  },
  Carronade: {
    name: 'Carronade',
    range: 2,
    power: 45,
    accuracy: 75,
    description: 'Short-range heavy smasher delivering devastating hull trauma.',
  },
};

export type ConsortTactic = 'auto' | 'cannon' | 'board' | 'escape';

export interface ConsortOrder {
  targetShipId: string | null;
  tactic: ConsortTactic;
}

export type FleetPlan = 'attack' | 'defend_flagship' | 'flee';

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
  heading: number; // 0..5 (0: N, 1: NE, 2: SE, 3: S, 4: SW, 5: NW)
  movementPoints: number;
  hasActed: boolean;
  isSunk: boolean;
  isSurrendered: boolean;
  hasFled?: boolean; // perimeter escape
  riggingHealth?: number; // 0..100%, if damaged reduces mobility
  dismountedGuns?: number; // guns lost to critical hits
  order?: ConsortOrder;
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

export interface CapturedPrizeShip {
  id: string;
  shipTypeId: string;
  name: string;
  durability: number;
  maxDurability: number;
  guns: number;
  survivingCrew: number;
  cargo: Array<{ type: string; quantity: number }>;
  assignedMateId: string | null;
  isScuttled: boolean;
}

export interface CombatSpoils {
  gold: number;
  fame: number;
  commodities: Array<{ type: string; quantity: number }>;
  capturedShipName?: string;
  capturedPrizeShips?: CapturedPrizeShip[];
}

export interface CannonballAnimation {
  id: string;
  fromHex: HexCoord;
  toHex: HexCoord;
  fromPixel: PixelCoord;
  toPixel: PixelCoord;
  progress: number;
  damageText: string;
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
  phase:
    | 'player_turn'
    | 'enemy_turn'
    | 'firing_animation'
    | 'duel'
    | 'prize_capture'
    | 'victory'
    | 'defeat';
  log: string[];
  duelState: DuelState | null;
  floatingDamages: FloatingDamage[];
  spoils: CombatSpoils | null;
  boardWidth: number;
  boardHeight: number;
  fleetPlan: FleetPlan;
  viewport: {
    viewCol: number;
    viewRow: number;
  };
  cannonballFlight?: CannonballAnimation | null;
  selectedConsortId?: string | null;
}
