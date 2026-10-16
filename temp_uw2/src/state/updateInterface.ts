import type { State, ProvisionsType } from './state';

export type SeaAlert = {
  id: string;
  type: 'info' | 'warning' | 'danger';
  text: string;
  timestamp: number;
};

export type NearbyPortInfo = {
  id: string;
  name: string;
  isSupplyPort: boolean;
};

export interface UpdateInterface {
  general?: (
    general: Pick<State, 'portId' | 'buildingId' | 'timePassed' | 'gold'>,
  ) => void;
  dayAtSea?: (dayAtSea: number) => void;
  provisions?: (provisions: ProvisionsType) => void;
  indicators?: (indicators: Pick<State, 'wind' | 'current'>) => void;
  playerFleetDirection?: (direction: number) => void;
  playerFleetSpeed?: (speed: number) => void;
  fade?: (onComplete: () => void) => void;
  seaAlert?: (alert: SeaAlert | null) => void;
  nearbyPort?: (port: NearbyPortInfo | null) => void;
  coordinates?: (pos: { x: number; y: number }) => void;
  combat?: (
    active: boolean,
    encounter?: { enemyFleetName: string; enemyCommodoreName: string } | null,
  ) => void;
  isPaused?: (paused: boolean) => void;
}


const updateInterface: UpdateInterface = {};

export default updateInterface;

