import state from './state';
import { getPlayerFleet } from './selectorsFleet';
import { shipData } from '../data/shipData';

export interface CrewAssignment {
  navigation: number; // Percentage (0-100)
  lookout: number;    // Percentage (0-100)
  combat: number;     // Percentage (0-100)
}

export const CREW_PRESETS: Record<string, { label: string; desc: string; assignment: CrewAssignment }> = {
  voyage: {
    label: '⛵ Swift Voyage',
    desc: 'High navigation for swift ocean transit across charted waters (80% Nav / 20% Lookout / 0% Combat).',
    assignment: { navigation: 80, lookout: 20, combat: 0 },
  },
  exploration: {
    label: '🔭 Uncharted Exploration',
    desc: 'Deep crow’s nest watch for spotting hidden villages and uncharted havens (50% Nav / 40% Lookout / 10% Combat).',
    assignment: { navigation: 50, lookout: 40, combat: 10 },
  },
  combat: {
    label: '⚔️ Battle Stations',
    desc: 'Full gun crews and boarding parties ready for naval combat and privateering (40% Nav / 10% Lookout / 50% Combat).',
    assignment: { navigation: 40, lookout: 10, combat: 50 },
  },
  balanced: {
    label: '⚖️ Balanced Fleet',
    desc: 'Traditional Koei Age of Exploration standard duty distribution (60% Nav / 20% Lookout / 20% Combat).',
    assignment: { navigation: 60, lookout: 20, combat: 20 },
  },
};

export const getCrewAssignment = (): CrewAssignment => {
  return (
    state.crewAssignment || {
      navigation: 70,
      lookout: 20,
      combat: 10,
    }
  );
};

export const setCrewAssignment = (
  assignment: CrewAssignment,
): { success: boolean; assignment: CrewAssignment; message: string } => {
  let nav = Math.max(0, Math.min(100, Math.round(assignment.navigation)));
  let look = Math.max(0, Math.min(100, Math.round(assignment.lookout)));
  let com = Math.max(0, Math.min(100, Math.round(assignment.combat)));

  const total = nav + look + com;
  if (total === 0) {
    nav = 70;
    look = 20;
    com = 10;
  } else if (total !== 100) {
    // Rebalance proportionally to sum to 100
    nav = Math.round((nav / total) * 100);
    look = Math.round((look / total) * 100);
    com = 100 - nav - look;
    if (com < 0) {
      nav += com;
      com = 0;
    }
  }

  const normalized: CrewAssignment = {
    navigation: nav,
    lookout: look,
    combat: com,
  };

  state.crewAssignment = normalized;

  return {
    success: true,
    assignment: normalized,
    message: `Crew duties reassigned: ${nav}% Navigation, ${look}% Lookout, ${com}% Combat.`,
  };
};

export const applyCrewPreset = (
  presetKey: 'voyage' | 'exploration' | 'combat' | 'balanced',
) => {
  const preset = CREW_PRESETS[presetKey];
  if (!preset) return getCrewAssignment();
  return setCrewAssignment(preset.assignment);
};

export interface FlagshipCrewDutyStats {
  totalCrew: number;
  minimumCrew: number;
  navCrew: number;
  lookoutCrew: number;
  combatCrew: number;
  isNavDeficient: boolean;
  navFactor: number;
  lookoutSightMultiplier: number;
}

export const getFlagshipCrewDutyStats = (): FlagshipCrewDutyStats => {
  const fleet = getPlayerFleet();
  const flagship = fleet[0];
  const totalCrew = flagship?.crew || 0;
  const shipTemplate = flagship ? shipData[flagship.id] : null;
  const minimumCrew = shipTemplate?.minimumCrew || 5;

  const assignment = getCrewAssignment();
  const navCrew = Math.round((totalCrew * assignment.navigation) / 100);
  const lookoutCrew = Math.round((totalCrew * assignment.lookout) / 100);
  const combatCrew = Math.max(0, totalCrew - navCrew - lookoutCrew);

  const navFactor = Math.min(1.0, navCrew / minimumCrew);
  const isNavDeficient = navCrew < minimumCrew;

  // Lookout % scaling: 20% is baseline 1.0x. 0% is 0.5x. 40% is 1.5x.
  const lookoutSightMultiplier = Math.max(0.4, 0.5 + (assignment.lookout / 20) * 0.5);

  return {
    totalCrew,
    minimumCrew,
    navCrew,
    lookoutCrew,
    combatCrew,
    isNavDeficient,
    navFactor,
    lookoutSightMultiplier,
  };
};

export const recordVillageDiscovery = (
  villageId: string,
): { isNewDiscovery: boolean; fameAwarded: number } => {
  if (!state.discoveredVillages) {
    state.discoveredVillages = [];
  }

  if (state.discoveredVillages.includes(villageId)) {
    return { isNewDiscovery: false, fameAwarded: 0 };
  }

  state.discoveredVillages.push(villageId);

  // Authentic Koei UW2 award: +50 Adventure Fame
  if (!state.fame) {
    state.fame = { adventure: 0, trade: 0, piracy: 0 };
  }
  state.fame.adventure = (state.fame.adventure || 0) + 50;

  return { isNewDiscovery: true, fameAwarded: 50 };
};

export const isVillageDiscovered = (villageId: string): boolean => {
  return (state.discoveredVillages || []).includes(villageId);
};

export const recordSupplyPortDiscovery = (
  portId: string,
): { isNewDiscovery: boolean; fameAwarded: number } => {
  if (!state.discoveredSupplyPorts) {
    state.discoveredSupplyPorts = [];
  }

  if (state.discoveredSupplyPorts.includes(portId)) {
    return { isNewDiscovery: false, fameAwarded: 0 };
  }

  state.discoveredSupplyPorts.push(portId);

  // Authentic Koei UW2 award: +30 Adventure Fame for charting supply ports
  if (!state.fame) {
    state.fame = { adventure: 0, trade: 0, piracy: 0 };
  }
  state.fame.adventure = (state.fame.adventure || 0) + 30;

  return { isNewDiscovery: true, fameAwarded: 30 };
};

export const isSupplyPortDiscovered = (portId: string): boolean => {
  return (state.discoveredSupplyPorts || []).includes(portId);
};
