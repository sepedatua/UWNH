import React, { useState, useEffect } from 'react';
import api, { SaveSlotMeta, GameMode } from '../services/api';
import state from '../state/state';
import { updateGeneral } from '../state/actionsPort';
import { setDockedFleetPositions } from '../state/actionsWorld';
import { positionAdjacentToPort } from '../state/selectors';
import { PrologueData } from './ScenarioPrologueModal';
import {
  PROTAGONISTS,
  HOME_PORTS_BY_NATION,
  AMBITIONS,
  NATIONS,
  ProtagonistConfig,
} from '../data/protagonistData';
import explorationManager from '../game/world/explorationManager';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGameLoaded?: () => void;
  onStartPrologue?: (data: PrologueData) => void;
}

export type { ProtagonistConfig };

export default function SaveLoadModal({
  isOpen,
  onClose,
  onGameLoaded,
  onStartPrologue,
}: Props) {
  const [slots, setSlots] = useState<SaveSlotMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // New Game Form State
  const [newMode, setNewMode] = useState<GameMode>('sp_scenario');
  const [newProtagonistId, setNewProtagonistId] = useState('1');
  const [customName, setCustomName] = useState('Captain Francis');
  const [customNation, setCustomNation] = useState('Portugal');
  const [selectedAmbition, setSelectedAmbition] = useState('merchant');

  useEffect(() => {
    if (isOpen) {
      loadSlots();
    }
  }, [isOpen]);

  const loadSlots = async () => {
    setLoading(true);
    try {
      const data = await api.listSaves();
      setSlots(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToSlot = async (slotNumber: number) => {
    try {
      setLoading(true);
      const activeSlot = slots.find((s) => s.slot_number === slotNumber);
      const mode = activeSlot ? activeSlot.game_mode : 'sp_scenario';
      const name = activeSlot ? activeSlot.protagonist_name : 'João Franco';
      const pId = activeSlot ? activeSlot.protagonist_id : '1';
      const nation = activeSlot ? activeSlot.nationality : 'Portugal';

      await api.saveSlot({
        slot_number: slotNumber,
        game_mode: mode,
        protagonist_id: pId,
        protagonist_name: name,
        nationality: nation,
        is_alive: 1,
        current_year: 1522,
        current_month: 5,
        current_day: 17,
        current_port_id: state.portId || '1',
        gold: state.gold,
        fame_adventure: 100,
        fame_trade: 200,
        fame_piracy: 0,
        save_payload: {
          portId: state.portId,
          gold: state.gold,
          savings: state.savings,
          debt: state.debt,
          items: state.items,
          mates: state.mates,
          fleets: state.fleets,
          quests: state.quests || [],
          scenarioChapter: state.scenarioChapter || 1,
          completedObjectives: state.completedObjectives || [],
          discoveries: state.discoveries || [],
          reportedDiscoveries: state.reportedDiscoveries || [],
          portInvestments: state.portInvestments || {},
          marketRates: state.marketRates || {},
          waitressFavor: state.waitressFavor || {},
          taxPermit: state.taxPermit || false,
          cartographyContract: state.cartographyContract || false,
          nobilityRank: state.nobilityRank || 0,
          morale: state.morale !== undefined ? state.morale : 80,
          timePassed: state.timePassed,
          dayAtSea: state.dayAtSea,
          exploredSectors: explorationManager.exportBase64(),
          reportedSectors: explorationManager.getReportedCount(),
        },
      });
      await loadSlots();
      alert(`Game saved successfully to Slot ${slotNumber}!`);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSlot = async (slotNumber: number) => {
    const slot = slots.find((s) => s.slot_number === slotNumber);
    if (!slot) return;

    if (slot.is_alive === 0) {
      alert('This Captain has perished in Endless Mode (Permadeath). This save cannot be resumed.');
      return;
    }

    try {
      setLoading(true);
      const data = await api.loadSlot(slotNumber);
      const payload = data.save_payload || data;

      // Restore game state
      if (payload.gold !== undefined) state.gold = payload.gold;
      if (payload.savings !== undefined) state.savings = payload.savings;
      if (payload.debt !== undefined) state.debt = payload.debt;

      if (payload.items) {
        // Sanitize / deduplicate unique quest items (Aqua Tiara '53' and Rapier '4')
        const uniqueItems: any[] = [];
        const seenSingleItems = new Set<string>(['4', '53']);
        for (const it of payload.items) {
          if (seenSingleItems.has(it)) {
            if (!uniqueItems.includes(it)) {
              uniqueItems.push(it);
            }
          } else {
            uniqueItems.push(it);
          }
        }
        state.items = uniqueItems;
      }

      if (payload.mates) {
        // Sanitize / deduplicate mates by sailorId
        const seenSailors = new Set<string>();
        state.mates = payload.mates.filter((m: any) => {
          if (!m || !m.sailorId) return false;
          if (seenSailors.has(m.sailorId)) return false;
          seenSailors.add(m.sailorId);
          return true;
        });
      }

      if (payload.fleets) {
        state.fleets = payload.fleets;
        // Sanitize duplicate Hermes II ships if any
        if (state.fleets['1']?.ships) {
          const ships = state.fleets['1'].ships;
          let hermesSeen = false;
          state.fleets['1'].ships = ships.filter((s) => {
            if (s.name === 'Hermes II' && s.id === '6') {
              if (hermesSeen) return false;
              hermesSeen = true;
            }
            return true;
          });
        }
      }

      if (payload.quests && Array.isArray(payload.quests)) {
        state.quests = [...payload.quests];
      } else {
        // Migration: If loading an older save that didn't persist quests,
        // but the captain already has Hermes II or Rocco+Enrico, mark prologue completed!
        if (
          slot.protagonist_id === '1' &&
          (state.mates.some((m) => m.sailorId === '32') ||
            state.fleets['1']?.ships?.some((s) => s.name === 'Hermes II'))
        ) {
          state.quests = [
            'houseBeforeQuest',
            'shipyardAfterQuest',
            'churchAfterQuest',
            'churchAfterEnrico',
            'pubAfterQuest',
            'houseAfterQuestAndPub',
            'itemShopAfterQuest',
            'harborFinal',
          ];
        } else {
          state.quests = [];
        }
      }

      if (payload.scenarioChapter !== undefined) state.scenarioChapter = payload.scenarioChapter;
      if (payload.completedObjectives) state.completedObjectives = payload.completedObjectives;
      if (payload.discoveries) state.discoveries = payload.discoveries;
      if (payload.reportedDiscoveries) state.reportedDiscoveries = payload.reportedDiscoveries;
      if (payload.portInvestments) state.portInvestments = payload.portInvestments;
      if (payload.marketRates) state.marketRates = payload.marketRates;
      if (payload.waitressFavor) state.waitressFavor = payload.waitressFavor;
      if (payload.taxPermit !== undefined) state.taxPermit = payload.taxPermit;
      if (payload.cartographyContract !== undefined) state.cartographyContract = payload.cartographyContract;
      if (payload.nobilityRank !== undefined) state.nobilityRank = payload.nobilityRank;
      if (payload.morale !== undefined) state.morale = payload.morale;
      if (payload.timePassed !== undefined) state.timePassed = payload.timePassed;
      if (payload.dayAtSea !== undefined) state.dayAtSea = payload.dayAtSea;

      if (payload.exploredSectors) {
        explorationManager.importBase64(payload.exploredSectors);
      }
      if (payload.reportedSectors !== undefined) {
        explorationManager.setReportedCount(payload.reportedSectors);
      }
      
      const targetPortId = payload.portId || slot.current_port_id || '1';
      state.portId = targetPortId;
      state.buildingId = null;

      if (!state.fleets['1']) {
        state.fleets['1'] = { position: undefined, ships: [] };
      }
      try {
        state.fleets['1'].position = positionAdjacentToPort(targetPortId);
      } catch (e) {
        console.error('Failed to set fleet position for port:', e);
      }
      setDockedFleetPositions();

      // Sync active game mode and captain identity
      state.gameMode = slot.game_mode;
      state.protagonistId = slot.protagonist_id;
      state.protagonistName = slot.protagonist_name;
      state.nationality = slot.nationality;
      state.isAlive = slot.is_alive === 1;
      state.fame = {
        adventure: slot.fame_adventure || 0,
        trade: slot.fame_trade || 0,
        piracy: slot.fame_piracy || 0,
      };

      // Force recreation of port graphics for new home port
      (state as any).port = null;
      (state as any).world = null;
      updateGeneral();

      alert(`Loaded Slot ${slotNumber}: ${slot.protagonist_name} in ${slot.nationality} (${slot.game_mode.toUpperCase()})`);
      onClose();
      if (onGameLoaded) onGameLoaded();
    } catch (err: any) {
      alert(`Load failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewGame = async () => {
    if (selectedSlot === null) return;

    const isCustom = newProtagonistId === 'custom';
    const chosenProtagonist = PROTAGONISTS.find((p) => p.id === newProtagonistId);

    const finalName = isCustom ? customName.trim() : chosenProtagonist?.name || 'Captain';
    const finalNation = isCustom ? customNation : chosenProtagonist?.nation || 'Portugal';
    
    // Determine accurate home port
    const homePort = isCustom
      ? HOME_PORTS_BY_NATION[finalNation] || { id: '1', name: 'Lisbon' }
      : { id: chosenProtagonist!.homePortId, name: chosenProtagonist!.homePortName };

    // Career ambition adjustments for Endless mode
    const chosenAmbition = AMBITIONS.find((a) => a.id === selectedAmbition) || AMBITIONS[0];

    const isScenarioJoao = newMode === 'sp_scenario' && newProtagonistId === '1';

    const startingGold = isCustom 
      ? chosenAmbition.gold 
      : isScenarioJoao
      ? 0
      : (newMode === 'sp_scenario' ? chosenProtagonist!.startingGold : Math.max(1000, chosenProtagonist!.startingGold));
    const startingDebt = (newMode === 'sp_scenario' && chosenProtagonist?.id === '5') ? 10000 : 0;
    
    const starterCargo = [
      { type: 'water' as const, quantity: 20 },
      { type: 'food' as const, quantity: 20 },
    ];

    const startingShip = isCustom
      ? { ...chosenAmbition.ship, name: `${finalName}'s Pride`, cargo: starterCargo }
      : { ...chosenProtagonist!.startingShip, cargo: starterCargo };

    // In João Franco's canonical scenario, he begins at home in Lisbon with no ship and no first mate.
    // Rocco and the Hermes II are provided during the Lisbon prologue quests.
    const startingShips = isScenarioJoao ? [] : [startingShip];

    const startingMates = isCustom
      ? [{ sailorId: 'custom', role: null }]
      : isScenarioJoao
      ? [{ sailorId: '1', role: null }]
      : chosenProtagonist!.startingMates;

    try {
      setLoading(true);
      const startingPosition = positionAdjacentToPort(homePort.id);

      const savePayloadData = {
        portId: homePort.id,
        gold: startingGold,
        savings: 0,
        debt: startingDebt,
        items: [],
        mates: startingMates,
        fleets: {
          '1': {
            position: startingPosition,
            ships: startingShips,
          },
        },
        quests: [],
        scenarioChapter: 1,
        completedObjectives: [],
      };

      await api.saveSlot({
        slot_number: selectedSlot,
        game_mode: newMode,
        protagonist_id: newProtagonistId,
        protagonist_name: finalName,
        nationality: finalNation,
        is_alive: 1,
        current_year: 1522,
        current_month: 5,
        current_day: 17,
        current_port_id: homePort.id,
        gold: startingGold,
        save_payload: savePayloadData,
        is_new_game: true,
      });

      // Instantly apply state to active game
      state.portId = homePort.id;
      state.buildingId = null;
      state.gold = startingGold;
      state.savings = 0;
      state.debt = startingDebt;
      state.items = [];
      state.mates = startingMates as any;
      state.fleets = savePayloadData.fleets as any;
      state.quests = [];
      state.scenarioChapter = 1;
      state.completedObjectives = [];
      state.gameMode = newMode;
      state.protagonistId = newProtagonistId;
      state.protagonistName = finalName;
      state.nationality = finalNation;
      state.isAlive = true;
      state.fame = { adventure: 0, trade: 0, piracy: 0 };

      // Initialize exploration: reset world and reveal starting home waters
      explorationManager.reset();
      explorationManager.revealAroundPosition(startingPosition.x, startingPosition.y, 25);

      // Force game engine to re-draw port map at home port
      (state as any).port = null;
      (state as any).world = null;
      setDockedFleetPositions();
      updateGeneral();

      setIsCreatingNew(false);
      onClose();

      // Trigger prologue if scenario mode
      if (newMode === 'sp_scenario' && chosenProtagonist && onStartPrologue) {
        onStartPrologue({
          protagonistName: chosenProtagonist.name,
          protagonistId: chosenProtagonist.id,
          nationality: chosenProtagonist.nation,
          homePortName: chosenProtagonist.homePortName,
          shipName: isScenarioJoao ? 'Hermes II' : chosenProtagonist.startingShip.name,
          shipType: isScenarioJoao ? 'Latin' : (chosenProtagonist.startingShip.id === '14' ? 'Sloop' : chosenProtagonist.startingShip.id === '8' ? 'Brigantine' : chosenProtagonist.startingShip.id === '11' ? 'Galleon' : chosenProtagonist.startingShip.id === '4' ? 'Buss' : 'Dhow'),
          firstMateName: chosenProtagonist.startingMates[1] ? (chosenProtagonist.id === '1' ? 'Rocco Alemkel' : chosenProtagonist.id === '2' ? 'Andreas Baes' : chosenProtagonist.id === '3' ? 'Matthew Baker' : chosenProtagonist.id === '4' ? 'Hans Hucken' : chosenProtagonist.id === '5' ? 'Camilo Stefan' : 'Salim') : 'Chief Officer',
          title: chosenProtagonist.prologueTitle,
          story: chosenProtagonist.prologueStory,
          objective: isScenarioJoao
            ? 'Speak to your father Duke Leon Franco at your family estate to begin your voyage preparation.'
            : chosenProtagonist.objective,
        });
      } else {
        alert(`Maiden voyage commenced! Welcome to ${homePort.name}, Captain ${finalName}!`);
      }

      if (onGameLoaded) onGameLoaded();
    } catch (err: any) {
      alert(`Failed to start new voyage: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotNumber: number) => {
    if (!confirm(`Are you sure you want to clear Slot ${slotNumber}?`)) return;
    try {
      setLoading(true);
      await api.deleteSlot(slotNumber);
      await loadSlots();
    } catch (err: any) {
      alert(`Failed to clear slot: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono select-none">
      <div className="w-[880px] max-h-[92vh] bg-[#1e1b18] border-4 border-[#8c6f4b] rounded-lg shadow-2xl flex flex-col text-[#e6d5b8] overflow-hidden">
        {/* Header */}
        <div className="bg-[#2d2218] border-b-2 border-[#8c6f4b] p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📜</span>
            <h2 className="text-xl font-bold tracking-wider text-[#ffd700]">
              VOYAGE LOG & SAVE SLOTS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl font-bold px-2 py-1 bg-[#1e1b18] border border-[#8c6f4b] rounded cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {isCreatingNew ? (
            /* New Game Creation Modal Form */
            <div className="bg-[#26201a] border-2 border-[#b89569] p-5 rounded space-y-4">
              <h3 className="text-lg font-bold text-[#ffd700] border-b border-[#8c6f4b] pb-2 flex justify-between items-center">
                <span>CREATE NEW VOYAGE — SLOT {selectedSlot}</span>
                <span className="text-xs text-amber-300 font-normal">
                  Spawns at Authentic Home Port
                </span>
              </h3>

              {/* Game Mode Selection */}
              <div>
                <label className="block text-sm text-[#c4b39b] mb-1 font-bold">
                  Game Mode:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewMode('sp_scenario');
                      if (newProtagonistId === 'custom') setNewProtagonistId('1');
                    }}
                    className={`p-2 border rounded text-xs cursor-pointer ${
                      newMode === 'sp_scenario'
                        ? 'border-yellow-400 bg-[#3d2e1e] font-bold text-yellow-300'
                        : 'border-[#5a4837] bg-[#1c1713] text-gray-400'
                    }`}
                  >
                    📖 SP: Scenario
                    <div className="text-[10px] font-normal opacity-80 mt-1">
                      Canon Story • Isolated Economy
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewMode('sp_endless')}
                    className={`p-2 border rounded text-xs cursor-pointer ${
                      newMode === 'sp_endless'
                        ? 'border-yellow-400 bg-[#3d2e1e] font-bold text-yellow-300'
                        : 'border-[#5a4837] bg-[#1c1713] text-gray-400'
                    }`}
                  >
                    ⚔️ SP: Endless
                    <div className="text-[10px] font-normal opacity-80 mt-1">
                      Permadeath • Isolated Economy
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewMode('mp_endless');
                      setNewProtagonistId('custom');
                    }}
                    className={`p-2 border rounded text-xs cursor-pointer ${
                      newMode === 'mp_endless'
                        ? 'border-blue-400 bg-[#1e2a3d] font-bold text-blue-300'
                        : 'border-[#5a4837] bg-[#1c1713] text-gray-400'
                    }`}
                  >
                    🌐 MP: Endless
                    <div className="text-[10px] font-normal opacity-80 mt-1">
                      Shared Economy • Ghost Fleets
                    </div>
                  </button>
                </div>
              </div>

              {/* Protagonist Selector */}
              {newMode === 'sp_scenario' ? (
                <div>
                  <label className="block text-sm text-[#c4b39b] mb-1 font-bold">
                    Select Historical Protagonist & Home Port:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PROTAGONISTS.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setNewProtagonistId(p.id)}
                        className={`p-2.5 border rounded cursor-pointer transition-all ${
                          newProtagonistId === p.id
                            ? 'border-yellow-400 bg-[#3d2e1e]'
                            : 'border-[#5a4837] bg-[#1c1713] opacity-75 hover:opacity-100'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm text-yellow-200">
                            {p.name}
                          </span>
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#2b1f14] text-amber-300 border border-[#664b30]">
                            ⚓ {p.homePortName} ({p.nation})
                          </span>
                        </div>
                        <div className="text-[11px] text-[#c4b39b] line-clamp-1">
                          {p.desc}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          Ship: {p.startingShip.name} • Gold: {p.startingGold.toLocaleString()}
                          {p.startingDebt > 0 && ` • Debt: ${p.startingDebt.toLocaleString()}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Endless mode character builder */
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-[#c4b39b] mb-1">
                      Captain Archetype:
                    </label>
                    <select
                      value={newProtagonistId}
                      onChange={(e) => setNewProtagonistId(e.target.value)}
                      className="w-full bg-[#1c1713] border border-[#8c6f4b] p-2 rounded text-sm text-white"
                    >
                      <option value="custom">★ Custom Captain Creator</option>
                      {PROTAGONISTS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.homePortName}, {p.nation})
                        </option>
                      ))}
                    </select>
                  </div>

                  {newProtagonistId === 'custom' ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-[#c4b39b] mb-1 font-bold">
                            Captain Name:
                          </label>
                          <input
                            type="text"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            className="w-full bg-[#1c1713] border border-[#8c6f4b] p-2 rounded text-sm text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#c4b39b] mb-1 font-bold">
                            Homeland & Starting Port:
                          </label>
                          <select
                            value={customNation}
                            onChange={(e) => setCustomNation(e.target.value)}
                            className="w-full bg-[#1c1713] border border-[#8c6f4b] p-2 rounded text-sm text-white"
                          >
                            {NATIONS.map((n) => (
                              <option key={n} value={n}>
                                {n} (Spawns at: {HOME_PORTS_BY_NATION[n].name})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Career Ambition Selector */}
                      <div>
                        <label className="block text-xs text-[#c4b39b] mb-1 font-bold">
                          Starting Career Ambition:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {AMBITIONS.map((amb) => (
                            <div
                              key={amb.id}
                              onClick={() => setSelectedAmbition(amb.id)}
                              className={`p-2.5 border rounded cursor-pointer transition-all ${
                                selectedAmbition === amb.id
                                  ? 'border-yellow-400 bg-[#3d2e1e]'
                                  : 'border-[#5a4837] bg-[#1c1713] opacity-75 hover:opacity-100'
                              }`}
                            >
                              <div className="font-bold text-xs text-yellow-300 mb-0.5">
                                {amb.name}
                              </div>
                              <div className="text-[10px] text-[#c4b39b] leading-tight">
                                {amb.desc}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#2a1d12] border border-[#8c6f4b] p-3 rounded text-xs text-[#e6d5b8] space-y-1">
                      <div className="font-bold text-yellow-400">
                        ⚔️ Open World Sandbox Mode Active
                      </div>
                      <p className="text-[11px] leading-relaxed text-gray-300">
                        Playing as {PROTAGONISTS.find((p) => p.id === newProtagonistId)?.name} in <strong>Endless Mode</strong>. 
                        All linear scenario quest restrictions are disabled! You are free to trade, explore, raid, and invest across all 130 ports with <strong>Permadeath</strong> active!
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-[#8c6f4b]">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-4 py-2 border border-[#8c6f4b] rounded text-sm hover:bg-[#33261c] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStartNewGame}
                  className="px-6 py-2 bg-gradient-to-r from-[#8c6f4b] to-[#b38f62] hover:from-[#a6845a] hover:to-[#c79f6e] text-black font-extrabold rounded text-sm cursor-pointer shadow-md"
                >
                  ⚓ Embark on Voyage
                </button>
              </div>
            </div>
          ) : (
            /* Slots Grid (1 to 10) */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 10 }).map((_, idx) => {
                const slotNum = idx + 1;
                const slot = slots.find((s) => s.slot_number === slotNum);

                return (
                  <div
                    key={slotNum}
                    className={`p-3 border-2 rounded-lg flex flex-col justify-between transition-all ${
                      slot
                        ? slot.is_alive === 0
                          ? 'border-red-800 bg-[#2b1616]'
                          : 'border-[#8c6f4b] bg-[#26201a] hover:border-[#d4a373]'
                        : 'border-dashed border-[#5a4837] bg-[#1a1613]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-sm text-[#ffd700]">
                        SLOT #{slotNum}
                      </span>
                      {slot && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            slot.game_mode === 'mp_endless'
                              ? 'bg-blue-900 text-blue-200'
                              : slot.game_mode === 'sp_endless'
                              ? 'bg-purple-900 text-purple-200'
                              : 'bg-amber-900 text-amber-200'
                          }`}
                        >
                          {slot.game_mode.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    {slot ? (
                      <div className="space-y-1 mb-3">
                        <div className="text-base font-bold text-white flex items-center justify-between">
                          <span>{slot.protagonist_name}</span>
                          <span className="text-xs text-[#c4b39b]">
                            {slot.nationality}
                          </span>
                        </div>
                        <div className="text-xs text-[#a89680]">
                          Year: {slot.current_year} • Month: {slot.current_month} •
                          Gold: {slot.gold.toLocaleString()}
                        </div>
                        {slot.is_alive === 0 && (
                          <div className="text-xs font-bold text-red-400 mt-1">
                            ☠️ FALLEN AT SEA (PERMADEATH GAME OVER)
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-xs text-gray-500 italic">
                        Empty Slot — No Voyage Recorded
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-[#4a392b]">
                      {slot ? (
                        <>
                          {slot.is_alive !== 0 && (
                            <button
                              onClick={() => handleLoadSlot(slotNum)}
                              className="flex-1 py-1 bg-[#4a6b4a] hover:bg-[#5c8a5c] text-white text-xs font-bold rounded cursor-pointer"
                            >
                              Load
                            </button>
                          )}
                          <button
                            onClick={() => handleSaveToSlot(slotNum)}
                            className="flex-1 py-1 bg-[#3d4f6b] hover:bg-[#4d6487] text-white text-xs font-bold rounded cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => handleDeleteSlot(slotNum)}
                            className="px-2 py-1 bg-red-900/60 hover:bg-red-800 text-red-200 text-xs rounded cursor-pointer"
                            title="Clear Slot"
                          >
                            🗑️
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedSlot(slotNum);
                            setIsCreatingNew(true);
                          }}
                          className="w-full py-1.5 bg-[#8c6f4b] hover:bg-[#a6845a] text-black font-bold text-xs rounded cursor-pointer"
                        >
                          + New Voyage
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#2d2218] border-t-2 border-[#8c6f4b] p-3 flex justify-between items-center text-xs text-[#c4b39b]">
          <span>
            {api.getCurrentUser()
              ? `Cloud Saves active for: ${api.getCurrentUser()?.email}`
              : 'Local Offline Saves (Log in with Google for Cloud Saves)'}
          </span>
          <button
            onClick={loadSlots}
            className="hover:underline text-yellow-300 cursor-pointer"
          >
            ↻ Refresh Slots
          </button>
        </div>
      </div>
    </div>
  );
}
