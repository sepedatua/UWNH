import { useEffect, useState, useCallback, useRef } from 'react';
import state from '../../state/state';
import updateInterface, {
  NearbyPortInfo,
  SeaAlert,
} from '../../state/updateInterface';
import { dock, triggerCombat } from '../../state/actionsWorld';
import {
  checkExplorationAtPosition,
  exploreCurrentCoordinates,
} from '../../game/discovery/discoveryEngine';
import { Discovery } from '../../data/discoveryData';
import DiscoveryModal from './DiscoveryModal';
import ScenarioJournalModal from '../scenario/ScenarioJournalModal';
import ghostFleetManager, { GhostFleet } from '../../game/world/ghostFleetManager';
import explorationManager from '../../game/world/explorationManager';
import seaWeather from '../../game/world/seaWeather';
import { calculateSightRadius } from '../../game/world/fogOfWarRenderer';
import autopilotManager, { AutopilotCourse } from '../../game/world/autopilotManager';
import npcFleetManager, { NpcFleetInstance } from '../../game/world/npcFleetManager';
import AtSeaEncounterModal from './AtSeaEncounterModal';
import soundManager from '../sound/soundManager';
import { generateId } from '../../utils';
import CoastalAnchorageModal from './CoastalAnchorageModal';
import { checkCoastStatus, CoastStatus } from '../../game/world/coastalForageEngine';
import { Village } from '../../data/villageData';
import VillageModal from './VillageModal';
import { checkLookoutSightings } from '../../game/discovery/lookoutEngine';
import { getMates } from '../../state/selectors';
import logger from '../../logger';

export default function SailingHUD() {
  const [nearbyPort, setNearbyPort] = useState<NearbyPortInfo | null>(null);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const [activeAlert, setActiveAlert] = useState<SeaAlert | null>(null);
  const [isAlive, setIsAlive] = useState<boolean>(state.isAlive ?? true);
  const [activeDiscovery, setActiveDiscovery] = useState<Discovery | null>(null);
  const [discoveredLandmark, setDiscoveredLandmark] = useState<Discovery | null>(null);
  const [showJournal, setShowJournal] = useState<boolean>(false);
  const [interceptFleet, setInterceptFleet] = useState<GhostFleet | null>(null);
  const [ghostFleetCount, setGhostFleetCount] = useState<number>(0);
  const [autopilotCourse, setAutopilotCourse] = useState<AutopilotCourse | null>(autopilotManager.getCourse());
  const [closestNpcFleet, setClosestNpcFleet] = useState<NpcFleetInstance | null>(null);
  const [activeEncounterFleet, setActiveEncounterFleet] = useState<NpcFleetInstance | null>(null);
  const [isChasedByPirate, setIsChasedByPirate] = useState<boolean>(false);
  const [coastStatus, setCoastStatus] = useState<CoastStatus | null>(null);
  const [showAnchorageModal, setShowAnchorageModal] = useState<boolean>(false);
  const [nearbyVillage, setNearbyVillage] = useState<Village | null>(null);
  const [activeVillage, setActiveVillage] = useState<Village | null>(null);
  const [showVillageModal, setShowVillageModal] = useState<boolean>(false);
  const sightedFleetIdsRef = useRef<Set<string>>(new Set());
  const lastNearbyPortIdRef = useRef<string | null>(null);

  useEffect(() => {
    return autopilotManager.subscribe(() => {
      setAutopilotCourse(autopilotManager.getCourse());
    });
  }, []);

  const handleExplore = useCallback(() => {
    if (!coords) return;
    const res = exploreCurrentCoordinates(coords.x, coords.y);
    if (res.discovered && res.discovery) {
      setDiscoveredLandmark(res.discovery);
      setActiveDiscovery(null);
    }
  }, [coords]);

  const handleIntercept = useCallback(() => {
    if (!interceptFleet) return;
    triggerCombat(`${interceptFleet.captain_name}’s Fleet`, interceptFleet.captain_name);
  }, [interceptFleet]);

  const handleTossCargoToEvade = useCallback(() => {
    const playerFleet = state.fleets[1] || state.fleets['1'];
    if (!playerFleet || !playerFleet.ships[0]) return;
    const flagship = playerFleet.ships[0];
    const food = flagship.cargo.find((c) => c.type === 'food');
    const water = flagship.cargo.find((c) => c.type === 'water');

    if (food && food.quantity >= 10) {
      food.quantity -= 10;
    } else if (water && water.quantity >= 10) {
      water.quantity -= 10;
    }

    if (coords) {
      const chasers = npcFleetManager.getNearbyFleets(coords, 25);
      for (const f of chasers) {
        if (f.hostile) {
          f.aiState = 'patrolling';
        }
      }
    }
    setIsChasedByPirate(false);
    updateInterface.seaAlert?.({
      id: generateId(),
      type: 'info',
      text: '💨 Jettisoned rations! Pursuing raiders paused to scoop up the floating barrels, allowing your fleet to slip away.',
      timestamp: Date.now(),
    });
    soundManager.playSfx('shipBell');
  }, [coords]);

  const handleOpenVillage = useCallback((vil: Village) => {
    if (autopilotCourse?.active) {
      autopilotManager.cancelCourse('Sighted settlement. Anchoring for exploration.');
    }
    logger.info('SailingHUD', `Captain entering settlement modal: ${vil.name} (${vil.id})`);
    setActiveVillage(vil);
    setShowVillageModal(true);
  }, [autopilotCourse]);

  const handleCloseVillage = useCallback(() => {
    logger.info('SailingHUD', 'Closing VillageModal from SailingHUD');
    setShowVillageModal(false);
    setActiveVillage(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.key === 'f' || e.key === 'F') && activeDiscovery) {
        handleExplore();
      } else if ((e.key === 'v' || e.key === 'V') && nearbyVillage && !showVillageModal) {
        handleOpenVillage(nearbyVillage);
      } else if ((e.key === 'c' || e.key === 'C') && coastStatus?.isNearCoast && !showAnchorageModal) {
        if (autopilotCourse?.active) {
          autopilotManager.cancelCourse('Anchoring along coastline.');
        }
        logger.info('SailingHUD', 'Captain entering Coastal Anchorage via [C]');
        setShowAnchorageModal(true);
      } else if (e.key === 'j' || e.key === 'J') {
        setShowJournal((prev) => !prev);
      } else if ((e.key === 'h' || e.key === 'H') && closestNpcFleet) {
        setActiveEncounterFleet(closestNpcFleet);
      } else if ((e.key === 'a' || e.key === 'A') && closestNpcFleet) {
        triggerCombat(closestNpcFleet.name, closestNpcFleet.captainName);
      } else if ((e.key === 'i' || e.key === 'I') && interceptFleet) {
        handleIntercept();
      } else if (e.key === 'Escape') {
        if (showVillageModal) {
          handleCloseVillage();
        } else if (showAnchorageModal) {
          logger.info('SailingHUD', 'Closing Coastal Anchorage via [Escape]');
          setShowAnchorageModal(false);
        } else if (showJournal) {
          setShowJournal(false);
        } else if (activeEncounterFleet) {
          setActiveEncounterFleet(null);
        } else if (autopilotCourse?.active) {
          autopilotManager.cancelCourse('Autopilot Disengaged by Captain.');
        }
      } else if (e.key === ' ' && autopilotCourse?.active) {
        autopilotManager.cancelCourse('Autopilot Disengaged by Captain.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeDiscovery,
    coastStatus,
    interceptFleet,
    autopilotCourse,
    closestNpcFleet,
    nearbyVillage,
    showVillageModal,
    showAnchorageModal,
    showJournal,
    activeEncounterFleet,
    handleExplore,
    handleIntercept,
    handleOpenVillage,
    handleCloseVillage,
  ]);

  useEffect(() => {
    updateInterface.nearbyPort = (port) => {
      setNearbyPort(port);
      if (port && port.id !== lastNearbyPortIdRef.current) {
        lastNearbyPortIdRef.current = port.id;
        soundManager.playSfx('shipBell');
      } else if (!port) {
        lastNearbyPortIdRef.current = null;
      }
    };

    updateInterface.coordinates = (pos) => {
      setCoords(pos);
      if (state.isAlive !== undefined && state.isAlive !== isAlive) {
        setIsAlive(state.isAlive);
      }
      const nearby = checkExplorationAtPosition(pos.x, pos.y);
      setActiveDiscovery(nearby);

      // Crow's Nest Lookout Sightings (Villages, Supply Havens & Discovery Events)
      const sightings = checkLookoutSightings(pos);
      setNearbyVillage(sightings.nearbyLandingVillage);

      for (const discovery of sightings.newDiscoveries) {
        soundManager.playSfx('shipBell');
        updateInterface.seaAlert?.({
          id: generateId(),
          type: 'info',
          text: discovery.message,
          timestamp: Date.now(),
        });
      }

      const coast = checkCoastStatus(pos);
      setCoastStatus(coast.isNearCoast && !coast.isPort ? coast : null);

      // In MP Endless mode, update ghost fleet radar and check for interception
      if (state.gameMode === 'mp_endless') {
        ghostFleetManager.update(pos.x, pos.y).then((intercept) => {
          setInterceptFleet(intercept);
          setGhostFleetCount(ghostFleetManager.getNearbyGhostFleets().length);
        });
      }

      // 1. Proximity check for nearby NPC fleets (hail / attack range <= 3.5 tiles)
      const nearbyFleets = npcFleetManager.getNearbyFleets(pos, 3.5);
      const targetFleet = nearbyFleets.length > 0 ? nearbyFleets[0] : null;
      setClosestNpcFleet(targetFleet);

      // 2. Check if hostile pirate is actively pursuing in broader vicinity
      const broaderVicinity = npcFleetManager.getNearbyFleets(pos, 22);
      const chaser = broaderVicinity.find((f) => f.hostile && f.aiState === 'pursuing');
      setIsChasedByPirate(!!chaser);

      // 3. Lookout Horizon Sightings (within sight radius ~15 tiles)
      const sight = calculateSightRadius();
      for (const fleet of broaderVicinity) {
        let dx = Math.abs(pos.x - fleet.position.x);
        if (dx > 1080) dx = 2160 - dx;
        const dy = Math.abs(pos.y - fleet.position.y);
        const dist = Math.hypot(dx, dy);

        if (dist <= sight.finalRadiusTiles && !sightedFleetIdsRef.current.has(fleet.id)) {
          sightedFleetIdsRef.current.add(fleet.id);
          const bearing = autopilotManager.vectorToDirection(fleet.position.x - pos.x, fleet.position.y - pos.y);
          soundManager.playSfx('shipBell');
          updateInterface.seaAlert?.({
            id: generateId(),
            type: fleet.hostile ? 'warning' : 'info',
            text: fleet.hostile
              ? `⚠️ PIRATE SIGHTED: ${fleet.name} bearing ${bearing.toUpperCase()}! Weapons ready!`
              : `🔭 Lookouts report: Sail sighted to the ${bearing.toUpperCase()}! A ${fleet.nation} ${fleet.archetype} fleet.`,
            timestamp: Date.now(),
          });
        }
      }

      // 4. Pirate Ambush (Task 11.5): If hostile pirate closes to <= 1.2 tiles, trigger combat automatically!
      if (state.portId === null && !state.inCombat) {
        const ambusher = broaderVicinity.find(
          (f) =>
            f.hostile &&
            Math.hypot(Math.abs(pos.x - f.position.x), Math.abs(pos.y - f.position.y)) <= 1.2,
        );
        if (ambusher) {
          soundManager.playSfx('shipBell');
          triggerCombat(ambusher.name, ambusher.captainName);
        }
      }
    };

    updateInterface.seaAlert = (alert) => {
      setActiveAlert(alert);
      if (alert) {
        const timer = setTimeout(() => {
          setActiveAlert((prev) => (prev?.id === alert.id ? null : prev));
        }, 7000);
        return () => clearTimeout(timer);
      }
    };
  }, [isAlive]);

  const handleDockClick = () => {
    if (autopilotManager.isActive()) {
      autopilotManager.cancelCourse('Autopilot Disengaged: Manual docking initiated.');
    }
    const playerFleet = state.fleets[1] || state.fleets['1'];
    if (playerFleet?.position) {
      dock(playerFleet.position);
    }
  };

  // Convert map coordinates (0-2160, 0-1080) to realistic Latitude and Longitude
  const formatCoordinates = () => {
    if (!coords) return null;
    const x = Math.round(coords.x);
    const y = Math.round(coords.y);

    const lonTotal = Math.abs(x - 1080) / 6;
    const lonDeg = Math.floor(lonTotal);
    const lonMin = Math.round((lonTotal % 1) * 60);
    const lonDir = x >= 1080 ? 'E' : 'W';

    const latTotal = Math.abs(y - 540) / 6;
    const latDeg = Math.floor(latTotal);
    const latMin = Math.round((latTotal % 1) * 60);
    const latDir = y <= 540 ? 'N' : 'S';

    return {
      nav: `${latDeg}°${latMin.toString().padStart(2, '0')}' ${latDir}, ${lonDeg}°${lonMin.toString().padStart(2, '0')}' ${lonDir}`,
      grid: `X: ${x}, Y: ${y}`,
    };
  };

  const navCoords = formatCoordinates();

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden font-sans">
      {/* 0. Active Autopilot Navigation Banner */}
      {autopilotCourse?.active && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto z-40 animate-fadeIn">
          <div className="flex items-center space-x-3 bg-gradient-to-r from-[#291e13]/95 via-[#1a120b]/95 to-[#291e13]/95 border-2 border-amber-500 rounded-full px-5 py-2 shadow-[0_0_25px_rgba(245,158,11,0.5)] backdrop-blur-md text-amber-100 font-mono text-xs">
            <span className="text-base animate-pulse">🧭</span>
            <span>
              <strong className="text-yellow-300">AUTOPILOT:</strong> Sailing to{' '}
              <span className="text-white font-bold">{autopilotCourse.portName}</span>
            </span>
            <span className="text-neutral-500">|</span>
            <span className="text-amber-300">
              ~{autopilotCourse.totalDistanceLeagues} Leagues (~{autopilotCourse.estimatedDays} Days)
            </span>
            <span className="text-neutral-500">|</span>
            <span className="px-2 py-0.5 rounded-full bg-black/60 border border-amber-600/50 text-[10px] text-amber-300">
              {autopilotCourse.enterPortOnArrival ? '⚓ Auto-Dock' : '🌊 Roadstead Anchor'}
            </span>
            <button
              type="button"
              onClick={() => autopilotManager.cancelCourse('Autopilot Disengaged by Captain.')}
              className="ml-2 px-3 py-1 rounded-full bg-red-950 hover:bg-red-800 border border-red-500 text-red-200 text-[11px] font-bold transition-all shadow cursor-pointer hover:scale-105"
              title="Disengage Autopilot Helm (Space / Esc / WASD)"
            >
              ⏹️ Disengage Helm
            </button>
          </div>
        </div>
      )}

      {/* 1. Proximity Harbor Landing Banner */}
      {nearbyPort && (
        <div
          className={`absolute ${
            autopilotCourse?.active ? 'top-18' : 'top-5'
          } left-1/2 -translate-x-1/2 pointer-events-auto z-30 transition-all`}
        >
          <button
            type="button"
            onClick={handleDockClick}
            className="flex items-center gap-3 px-6 py-3 rounded-xl border-2 border-yellow-400/90 bg-neutral-900/95 shadow-[0_0_25px_rgba(234,179,8,0.5)] backdrop-blur-md hover:bg-neutral-800 transition-all cursor-pointer group animate-bounce"
          >
            <span className="text-2xl group-hover:scale-125 transition-transform">
              ⚓
            </span>
            <div className="text-left">
              <div className="text-xs uppercase font-semibold text-yellow-400 tracking-wider">
                {nearbyPort.isSupplyPort ? 'Supply Harbor Sighted' : 'Harbor Sighted'}
              </div>
              <div className="text-xl font-bold text-white group-hover:text-yellow-200 transition-colors">
                {nearbyPort.name}
              </div>
            </div>
            <div className="ml-3 px-3 py-1 bg-yellow-500/30 text-yellow-300 rounded-lg text-xs font-bold border border-yellow-400/50">
              Press [E] or Click to Enter
            </div>
          </button>
        </div>
      )}

      {/* 2. Proximity Indigenous Village Banner */}
      {nearbyVillage && !nearbyPort && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-auto">
          <button
            type="button"
            onClick={() => handleOpenVillage(nearbyVillage)}
            className="flex items-center gap-3 px-6 py-3 rounded-xl border-2 border-amber-500 bg-gradient-to-r from-amber-950/95 via-yellow-950/95 to-neutral-900/95 shadow-[0_0_30px_rgba(245,158,11,0.6)] backdrop-blur-md hover:scale-105 transition-all cursor-pointer animate-pulse"
          >
            <span className="text-3xl">⛺</span>
            <div className="text-left">
              <div className="text-xs uppercase font-bold text-amber-300 tracking-wider">
                ★ Indigenous Settlement Sighted!
              </div>
              <div className="text-lg font-bold text-white">
                {nearbyVillage.name}
              </div>
            </div>
            <div className="ml-3 px-3 py-1 bg-amber-500/30 text-yellow-300 rounded-lg text-xs font-bold border border-amber-400/60">
              Press [V] or Click to Enter
            </div>
          </button>
        </div>
      )}

      {/* 2.2 Proximity Landmark Exploration Banner */}
      {activeDiscovery && !nearbyVillage && !nearbyPort && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-auto">
          <button
            type="button"
            onClick={handleExplore}
            className="flex items-center gap-3 px-6 py-3 rounded-xl border-2 border-amber-400 bg-gradient-to-r from-yellow-950/95 via-amber-900/95 to-neutral-900/95 shadow-[0_0_30px_rgba(245,158,11,0.6)] backdrop-blur-md hover:scale-105 transition-all cursor-pointer animate-pulse"
          >
            <span className="text-3xl">{activeDiscovery.icon}</span>
            <div className="text-left">
              <div className="text-xs uppercase font-bold text-amber-300 tracking-wider">
                ★ Legendary Landmark Sighted!
              </div>
              <div className="text-lg font-bold text-white">
                {activeDiscovery.name}
              </div>
            </div>
            <div className="ml-3 px-3 py-1 bg-amber-500/30 text-yellow-300 rounded-lg text-xs font-bold border border-amber-400/60">
              Press [F] or Click to Explore
            </div>
          </button>
        </div>
      )}

      {/* 2.5 Proximity Coastal Anchorage / Shore Haven Banner */}
      {coastStatus?.isNearCoast && !nearbyPort && !activeDiscovery && !nearbyVillage && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-auto">
          <button
            type="button"
            onClick={() => setShowAnchorageModal(true)}
            className="flex items-center gap-3 px-6 py-3 rounded-xl border-2 border-emerald-400 bg-gradient-to-r from-emerald-950/95 via-teal-950/95 to-neutral-900/95 shadow-[0_0_30px_rgba(16,185,129,0.5)] backdrop-blur-md hover:scale-105 transition-all cursor-pointer animate-pulse"
          >
            <span className="text-3xl">{coastStatus.canForage ? '🌲' : '⚓'}</span>
            <div className="text-left">
              <div className="text-xs uppercase font-bold text-emerald-300 tracking-wider">
                {coastStatus.canForage ? '★ Untamed Coastline Sighted!' : '⚓ Coastal Anchorage (Depleted Shore)'}
              </div>
              <div className="text-lg font-bold text-white">
                {coastStatus.canForage ? 'Send Landing Party & Forage' : 'Field Careening & Hull Repair'}
              </div>
            </div>
            <div className="ml-3 px-3 py-1 bg-emerald-500/30 text-emerald-200 rounded-lg text-xs font-bold border border-emerald-400/60">
              Press [C] or Click
            </div>
          </button>
        </div>
      )}

      {/* 3. Proximity Ghost Fleet Interception Banner (Task 7.4) */}
      {interceptFleet && (
        <div className="absolute top-44 left-1/2 -translate-x-1/2 pointer-events-auto">
          <button
            type="button"
            onClick={handleIntercept}
            className="flex items-center gap-3 px-6 py-3 rounded-xl border-2 border-red-500 bg-gradient-to-r from-red-950/95 via-purple-950/95 to-neutral-900/95 shadow-[0_0_30px_rgba(239,68,68,0.7)] backdrop-blur-md hover:scale-105 transition-all cursor-pointer animate-bounce"
          >
            <span className="text-3xl">⚔️</span>
            <div className="text-left">
              <div className="text-xs uppercase font-bold text-red-300 tracking-wider flex items-center gap-2">
                <span>☠️ Player Ghost Fleet Interceptable!</span>
                <span className="px-1.5 py-0.2 bg-red-900 border border-red-600 text-[10px] text-white rounded">
                  {interceptFleet.nation}
                </span>
              </div>
              <div className="text-lg font-bold text-white">
                Captain {interceptFleet.captain_name}{' '}
                {interceptFleet.bounty_gold > 0 && (
                  <span className="text-yellow-300 font-mono text-sm">
                    ({interceptFleet.bounty_gold.toLocaleString()} G Bounty)
                  </span>
                )}
              </div>
            </div>
            <div className="ml-3 px-3 py-1 bg-red-500/30 text-red-200 rounded-lg text-xs font-bold border border-red-400/60">
              Press [I] or Click to Intercept
            </div>
          </button>
        </div>
      )}

      {/* 4. Floating Sea Event / Survival Toast */}
      {activeAlert && (
        <div
          className={`absolute ${
            nearbyPort
              ? autopilotCourse?.active
                ? 'top-38'
                : 'top-24'
              : autopilotCourse?.active
                ? 'top-18'
                : 'top-6'
          } left-1/2 -translate-x-1/2 pointer-events-auto max-w-xl w-full px-4 animate-fade-in z-50 transition-all`}
        >
          <div
            className={`flex items-start justify-between gap-3 p-4 rounded-xl shadow-2xl backdrop-blur-md border ${
              activeAlert.type === 'danger'
                ? 'bg-red-950/90 border-red-500 text-red-100'
                : activeAlert.type === 'warning'
                  ? 'bg-amber-950/90 border-amber-500 text-amber-100'
                  : 'bg-neutral-900/90 border-blue-500 text-blue-100'
            }`}
          >
            <div className="text-sm font-medium leading-relaxed">
              {activeAlert.text}
            </div>
            <button
              type="button"
              onClick={() => setActiveAlert(null)}
              className="text-neutral-400 hover:text-white text-lg leading-none cursor-pointer p-1"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 5. Navigation Coordinates & Position HUD (Bottom Left) */}
      {navCoords && (
        <div className="absolute bottom-5 left-5 pointer-events-auto bg-neutral-950/85 backdrop-blur-md border border-neutral-700/80 rounded-lg px-4 py-2.5 shadow-lg text-white">
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-0.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {(() => {
                const navMate = getMates().find((m) => m.role === 'chiefNavigator');
                return navMate ? `🧭 CHIEF NAVIGATOR: ${navMate.name}` : 'NAVIGATION SEXTANT';
              })()}
            </span>
          </div>
          <div className="text-base font-bold text-yellow-300 font-mono tracking-wide">
            {navCoords.nav}
          </div>
          <div className="text-[11px] text-neutral-400 font-mono flex flex-wrap gap-x-3 gap-y-1 mt-1">
            <span>Tile: {navCoords.grid}</span>
            <span>Morale: {state.morale ?? 80}%</span>
            <span className="text-yellow-300">
              🗺️ {explorationManager.getExplorationProgress().percentage}% Charted
            </span>
            {seaWeather.isFoggy() && (
              <span className="text-amber-300 font-bold animate-pulse">
                🌫️ Heavy Fog
              </span>
            )}
            {state.gameMode === 'mp_endless' && (
              <span className="text-sky-300 font-bold">
                🌐 {seaWeather.isFoggy() ? 'Radar Jammed' : `${ghostFleetCount} Fleets`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 6. Controls Quick Reference & Actions (Bottom Right) */}
      <div className="absolute bottom-5 right-5 pointer-events-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-world-atlas'))}
          className="px-3 py-2 bg-[#1e2a38]/90 hover:bg-[#2a3c50] border border-sky-600/80 rounded-lg text-xs font-bold text-sky-200 shadow-md flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
        >
          <span>🗺️</span>
          <span>Atlas [M]</span>
        </button>
        <button
          type="button"
          onClick={() => setShowJournal(true)}
          className="px-3 py-2 bg-amber-950/90 hover:bg-amber-900 border border-amber-600/80 rounded-lg text-xs font-bold text-yellow-200 shadow-md flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
        >
          <span>📖</span>
          <span>Journal [J]</span>
        </button>
        {closestNpcFleet && (
          <>
            <button
              type="button"
              onClick={() => setActiveEncounterFleet(closestNpcFleet)}
              className="px-3.5 py-2 bg-amber-900/90 hover:bg-amber-800 border border-yellow-500 rounded-lg text-xs font-bold text-yellow-100 shadow-[0_0_15px_rgba(234,179,8,0.4)] flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 animate-pulse"
            >
              <span>💬</span>
              <span>Hail {closestNpcFleet.name} [H]</span>
            </button>
            <button
              type="button"
              onClick={() => triggerCombat(closestNpcFleet.name, closestNpcFleet.captainName)}
              className="px-3 py-2 bg-red-950/90 hover:bg-red-900 border border-red-500 rounded-lg text-xs font-bold text-red-200 shadow-md flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
            >
              <span>⚔️</span>
              <span>Attack [A]</span>
            </button>
          </>
        )}

        {isChasedByPirate && (
          <button
            type="button"
            onClick={handleTossCargoToEvade}
            className="px-3 py-2 bg-purple-950/90 hover:bg-purple-900 border border-purple-500 rounded-lg text-xs font-bold text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 animate-bounce"
          >
            <span>💨</span>
            <span>Toss Cargo to Evade</span>
          </button>
        )}

        {coastStatus?.isNearCoast && (
          <button
            type="button"
            onClick={() => setShowAnchorageModal(true)}
            className="px-3.5 py-2 bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500 rounded-lg text-xs font-bold text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
            title="Shore Haven: Drop Anchor for Shore Expedition and Field Hull Repairs [C]"
          >
            <span>{coastStatus.canForage ? '🌲' : '⚓'}</span>
            <span>Shore Haven [C]</span>
          </button>
        )}

        <div className="bg-neutral-950/80 backdrop-blur-md border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-neutral-300">
          <div className="flex items-center gap-3">
            <span><strong className="text-yellow-400">WASD</strong> Steer</span>
            <span><strong className="text-yellow-400">E</strong> Dock</span>
            <span><strong className="text-yellow-400">F</strong> Explore</span>
            {coastStatus?.isNearCoast && (
              <span><strong className="text-emerald-400">C</strong> Shore Haven</span>
            )}
            <span><strong className="text-sky-400">M</strong> Atlas</span>
            {closestNpcFleet && (
              <span><strong className="text-yellow-400">H</strong> Hail</span>
            )}
            {state.gameMode === 'mp_endless' && (
              <span><strong className="text-red-400">I</strong> Intercept</span>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAnchorageModal && coords && (
        <CoastalAnchorageModal
          coords={coords}
          onClose={() => {
            setShowAnchorageModal(false);
            if (coords) {
              const c = checkCoastStatus(coords);
              setCoastStatus(c.isNearCoast && !c.isPort ? c : null);
            }
          }}
        />
      )}
      {discoveredLandmark && (
        <DiscoveryModal
          discovery={discoveredLandmark}
          onClose={() => setDiscoveredLandmark(null)}
        />
      )}

      {showJournal && (
        <ScenarioJournalModal onClose={() => setShowJournal(false)} />
      )}

      {activeEncounterFleet && (
        <AtSeaEncounterModal
          fleet={activeEncounterFleet}
          onClose={() => setActiveEncounterFleet(null)}
        />
      )}


      {/* 5. Permadeath / All Hands Perished Modal */}
      {!isAlive && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="max-w-md w-full bg-neutral-900 border-2 border-red-600 rounded-2xl p-8 text-center shadow-[0_0_50px_rgba(220,38,38,0.5)]">
            <div className="text-6xl mb-4">☠️</div>
            <h2 className="text-3xl font-extrabold text-red-500 mb-2 tracking-wide uppercase">
              All Hands Lost
            </h2>
            <p className="text-neutral-300 text-sm mb-6 leading-relaxed">
              Your entire crew has succumbed to the merciless ocean. Without sailors to man the rigging, your vessel drifts endlessly as a phantom derelict.
            </p>
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 mb-6 text-left text-xs font-mono text-neutral-400">
              <div>Voyage: {state.dayAtSea} Days at Sea</div>
              <div>Mode: {state.gameMode.toUpperCase()}</div>
              <div>Status: PERMANENTLY LOST</div>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors cursor-pointer"
            >
              Return to Main Menu
            </button>
          </div>
        </div>
      )}

      {showVillageModal && (activeVillage || nearbyVillage) && (
        <VillageModal
          village={activeVillage || nearbyVillage!}
          onClose={handleCloseVillage}
        />
      )}
    </div>
  );
}
