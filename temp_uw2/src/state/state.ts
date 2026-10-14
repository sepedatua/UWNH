import { SAVED_STATE_KEY, START_TIME_PASSED } from '../constants';
import { Provisions, fleets, Fleets } from '../game/world/fleets';
import type { Port } from '../game/port/port';
import type { World } from '../game/world/world';
import type { QuestId } from '../interface/quest/questData';
import { ItemId } from '../data/itemData';

export type Stage = 'world' | 'port' | 'building';

export type Velocity = {
  direction: number;
  speed: number;
};

export type ProvisionsType = {
  [key in Provisions]: number;
};

type UsedShipsAtPort = { [key: string]: UsedShips };
export type UsedShips = { [key: string]: string };

export type Role =
  | number
  | 'firstMate'
  | 'bookKeeper'
  | 'chiefNavigator'
  | 'lookout'
  | null;

type Mate = {
  sailorId: string;
  role: Role;
};

export interface State {
  portId: string | null;
  buildingId: string | null;
  timePassed: number;
  world: World;
  fleets: Fleets;
  seaArea: number | undefined;
  wind: Velocity;
  current: Velocity;
  playerFleet: Velocity;
  port: Port;
  dayAtSea: number;
  gold: number;
  quests: QuestId[];
  usedShipsAtPort: UsedShipsAtPort;
  savings: number;
  debt: number;
  items: ItemId[];
  mates: Mate[];
  gameMode: 'sp_scenario' | 'sp_endless' | 'mp_endless';
  protagonistId: string;
  protagonistName: string;
  nationality: string;
  fame: {
    adventure: number;
    trade: number;
    piracy: number;
  };
  isAlive: boolean;
  marketRates: Record<string, number>;
  portInvestments: Record<string, number>;
  morale: number;
  inCombat: boolean;
  combatEncounter: {
    enemyFleetName: string;
    enemyCommodoreName: string;
  } | null;
  waitressFavor: Record<string, number>;
  nobilityRank: number;
  taxPermit: boolean;
  royalMission: any;
  discoveries: string[];
  reportedDiscoveries: string[];
  cartographyContract: boolean;
  scenarioChapter: number;
  completedObjectives: string[];
  exploredSectors?: string;
  reportedSectors?: number;
  seaWeather?: 'clear' | 'fog' | 'storm';
  autopilotCourse?: {
    targetPortId: string;
    portName: string;
    enterPortOnArrival: boolean;
    active: boolean;
    totalDistanceLeagues: number;
    estimatedDays: number;
  } | null;
}


const savedState = JSON.parse(
  window.localStorage.getItem(SAVED_STATE_KEY) || '{}',
) as Partial<State>;

const state = {
  portId: '1',
  buildingId: null,
  timePassed: START_TIME_PASSED,
  fleets,
  dayAtSea: 0,
  gold: 0,
  quests: [] as QuestId[],
  usedShipsAtPort: {},
  savings: 0,
  debt: 0,
  items: [],
  mates: [
    {
      sailorId: '1',
      role: null,
    },
  ] as Mate[],
  gameMode: 'sp_scenario' as const,
  protagonistId: '1',
  protagonistName: 'João Franco',
  nationality: 'Portugal',
  fame: {
    adventure: 0,
    trade: 0,
    piracy: 0,
  },
  isAlive: true,
  marketRates: {},
  portInvestments: {},
  morale: 80,
  inCombat: false,
  combatEncounter: null,
  waitressFavor: {},
  nobilityRank: 0,
  taxPermit: false,
  royalMission: null,
  discoveries: [],
  reportedDiscoveries: [],
  cartographyContract: false,
  scenarioChapter: 1,
  completedObjectives: [],
  autopilotCourse: null,
  ...savedState,
} as State;


export default state;
