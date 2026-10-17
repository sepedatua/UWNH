import { useState, useMemo, useCallback, useEffect } from 'react';
import state from '../../state/state';
import { getPlayerFleet, getAvailableSpace } from '../../state/selectorsFleet';
import {
  checkCoastStatus,
  conductShoreExpedition,
  stowForagedProvisions,
  getShoreRepairStatus,
  repairShipOnShore,
  repairEntireFleetOnShore,
  ExpeditionRawResult,
  FIELD_REPAIR_CEILING_RATIO,
} from '../../game/world/coastalForageEngine';
import soundManager from '../sound/soundManager';
import updateInterface from '../../state/updateInterface';
import { generateId } from '../../utils';
import logger from '../../logger';

interface Props {
  coords: { x: number; y: number };
  onClose: () => void;
}

export default function CoastalAnchorageModal({ coords, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'forage' | 'repair'>('forage');
  const [coastStatus, setCoastStatus] = useState(() => checkCoastStatus(coords));
  const [repairStatus, setRepairStatus] = useState(() => getShoreRepairStatus());
  const [expeditionResult, setExpeditionResult] = useState<ExpeditionRawResult | null>(null);
  const [isForaging, setIsForaging] = useState(false);
  const [repairMessage, setRepairMessage] = useState<string | null>(null);

  useEffect(() => {
    logger.info('CoastalAnchorage', `Opened Coastal Anchorage at (${Math.round(coords.x)}, ${Math.round(coords.y)})`, {
      canForage: coastStatus.canForage,
      isDepleted: coastStatus.isDepleted,
      dayAtSea: state.dayAtSea,
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        logger.info('CoastalAnchorage', '[Escape] pressed in Coastal Anchorage modal');
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      logger.info('CoastalAnchorage', 'Closed Coastal Anchorage modal');
    };
  }, [coords, onClose, coastStatus]);

  // Allocation selections when landing party returns
  const [waterAlloc, setWaterAlloc] = useState<number>(0);
  const [foodAlloc, setFoodAlloc] = useState<number>(0);
  const [lumberAlloc, setLumberAlloc] = useState<number>(0);
  const [stowedSuccess, setStowedSuccess] = useState<boolean>(false);

  // Total free cargo hold space across player fleet
  const totalFreeCargoSpace = useMemo(() => {
    const fleet = getPlayerFleet();
    let total = 0;
    for (let i = 0; i < fleet.length; i += 1) {
      total += Math.max(0, getAvailableSpace(i));
    }
    return total;
  }, [stowedSuccess, repairStatus]);

  const totalSelectedAlloc = waterAlloc + foodAlloc + lumberAlloc;
  const remainingFreeSpace = Math.max(0, totalFreeCargoSpace - totalSelectedAlloc);

  // Initialize allocation sliders when expedition returns
  const handleLaunchExpedition = useCallback(() => {
    setIsForaging(true);
    soundManager.playSfx('shipBell');

    setTimeout(() => {
      const res = conductShoreExpedition();
      setExpeditionResult(res);
      setIsForaging(false);

      // Auto-default allocations to fit available cargo space
      const maxWater = Math.min(res.waterFound, totalFreeCargoSpace);
      let rem = totalFreeCargoSpace - maxWater;
      const maxFood = Math.min(res.foodFound, rem);
      rem -= maxFood;
      const maxLumber = Math.min(res.lumberFound, rem);

      setWaterAlloc(maxWater);
      setFoodAlloc(maxFood);
      setLumberAlloc(maxLumber);

      updateInterface.seaAlert?.({
        id: generateId(),
        type: 'info',
        text: `🌲 Landing party returned after 6 hours! ${res.eventDescription} Choose how many provisions to stow aboard.`,
        timestamp: Date.now(),
      });
    }, 400);
  }, [totalFreeCargoSpace]);

  // Preset Allocation Helpers
  const handlePresetSplit = useCallback(() => {
    if (!expeditionResult) return;
    const { waterFound, foodFound, lumberFound } = expeditionResult;
    const capacity = totalFreeCargoSpace;
    const equalShare = Math.floor(capacity / 3);

    const w = Math.min(waterFound, equalShare);
    const f = Math.min(foodFound, equalShare);
    const l = Math.min(lumberFound, equalShare);
    let extra = capacity - (w + f + l);

    let finalW = w;
    let finalF = f;
    let finalL = l;

    if (extra > 0 && finalW < waterFound) {
      const take = Math.min(extra, waterFound - finalW);
      finalW += take;
      extra -= take;
    }
    if (extra > 0 && finalF < foodFound) {
      const take = Math.min(extra, foodFound - finalF);
      finalF += take;
      extra -= take;
    }
    if (extra > 0 && finalL < lumberFound) {
      const take = Math.min(extra, lumberFound - finalL);
      finalL += take;
      extra -= take;
    }

    setWaterAlloc(finalW);
    setFoodAlloc(finalF);
    setLumberAlloc(finalL);
  }, [expeditionResult, totalFreeCargoSpace]);

  const handlePresetMaxWater = useCallback(() => {
    if (!expeditionResult) return;
    const { waterFound, foodFound, lumberFound } = expeditionResult;
    let rem = totalFreeCargoSpace;
    const w = Math.min(waterFound, rem);
    rem -= w;
    const f = Math.min(foodFound, rem);
    rem -= f;
    const l = Math.min(lumberFound, rem);
    setWaterAlloc(w);
    setFoodAlloc(f);
    setLumberAlloc(l);
  }, [expeditionResult, totalFreeCargoSpace]);

  const handlePresetMaxFood = useCallback(() => {
    if (!expeditionResult) return;
    const { waterFound, foodFound, lumberFound } = expeditionResult;
    let rem = totalFreeCargoSpace;
    const f = Math.min(foodFound, rem);
    rem -= f;
    const w = Math.min(waterFound, rem);
    rem -= w;
    const l = Math.min(lumberFound, rem);
    setWaterAlloc(w);
    setFoodAlloc(f);
    setLumberAlloc(l);
  }, [expeditionResult, totalFreeCargoSpace]);

  // Final confirmation to stow into holds
  const handleConfirmStow = useCallback(() => {
    if (!expeditionResult) return;
    const res = stowForagedProvisions(
      { water: waterAlloc, food: foodAlloc, lumber: lumberAlloc },
      coords,
    );
    soundManager.playSfx('shipBell');
    setStowedSuccess(true);
    setCoastStatus(checkCoastStatus(coords));
    setRepairStatus(getShoreRepairStatus());

    updateInterface.seaAlert?.({
      id: generateId(),
      type: 'info',
      text: `📦 Provisions safely stowed (+${res.stowedWater} Water, +${res.stowedFood} Food, +${res.stowedLumber} Lumber). Remainder left on shore.`,
      timestamp: Date.now(),
    });
  }, [expeditionResult, waterAlloc, foodAlloc, lumberAlloc, coords]);

  // Single Ship Field Repair
  const handleRepairShip = useCallback((shipIndex: number) => {
    const res = repairShipOnShore(shipIndex);
    soundManager.playSfx('shipBell');
    setRepairMessage(res.message);
    setRepairStatus(getShoreRepairStatus());
  }, []);

  // Fleet Field Repair
  const handleRepairEntireFleet = useCallback(() => {
    const res = repairEntireFleetOnShore();
    soundManager.playSfx('shipBell');
    setRepairMessage(res.message);
    setRepairStatus(getShoreRepairStatus());
  }, []);

  const totalCrew = getPlayerFleet().reduce((sum, s) => sum + (s.crew || 0), 0);

  return (
    <div
      className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 pointer-events-auto font-sans select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          logger.info('CoastalAnchorage', 'Backdrop clicked, closing Coastal Anchorage modal');
          onClose();
        }
      }}
    >
      <div className="max-w-2xl w-full bg-[#1c140d] border-2 border-[#b89558] rounded-2xl shadow-[0_0_50px_rgba(234,179,8,0.35)] overflow-hidden text-[#ede0cb] p-6 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#5c4021] pb-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚓</span>
            <div>
              <h2 className="text-xl font-bold text-yellow-300 font-serif tracking-wide">
                Coastal Haven & Shore Anchorage
              </h2>
              <div className="text-xs text-amber-200/80 font-mono">
                Untamed Coastline | Grid X: {Math.round(coords.x)}, Y: {Math.round(coords.y)} | Day {state.dayAtSea}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-2xl leading-none cursor-pointer p-1"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-[#3b2915] pb-3 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('forage')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'forage'
                ? 'bg-amber-700/80 text-yellow-100 border border-amber-400 shadow'
                : 'bg-neutral-900/60 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <span>🌲</span>
            <span>Shore Expedition & Foraging</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('repair')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'repair'
                ? 'bg-amber-700/80 text-yellow-100 border border-amber-400 shadow'
                : 'bg-neutral-900/60 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <span>🔨</span>
            <span>Hull Careening & Repair (80% Cap)</span>
          </button>
        </div>

        {/* TAB 1: SHORE EXPEDITION & FORAGING */}
        {activeTab === 'forage' && (
          <div className="flex-1 overflow-y-auto pr-1">
            {/* Case 1: Coast Depleted */}
            {coastStatus.isDepleted && !expeditionResult && (
              <div className="bg-[#24170d] border border-red-800/80 rounded-xl p-5 text-center mb-4">
                <div className="text-4xl mb-2">⚠️</div>
                <h3 className="text-base font-bold text-red-300 font-serif mb-1">
                  Coastline Depleted of Easily Accessible Resources
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed max-w-md mx-auto mb-3">
                  Your scouts report that freshwater springs, game, and timber within this 4-tile coastal radius have already been harvested. Sail to unexplored shores to gather fresh provisions again.
                </p>
                <div className="text-xs font-mono text-yellow-400/90 bg-black/40 py-2 px-3 rounded border border-amber-900/40 inline-block">
                  🔨 Field careening and hull repairs are still available under the Repair tab!
                </div>
              </div>
            )}

            {/* Case 2: Fresh Coast, Ready for Expedition */}
            {!coastStatus.isDepleted && !expeditionResult && (
              <div className="bg-[#24170d] border border-[#5a3e1f] rounded-xl p-5 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🌿</span>
                  <div>
                    <h3 className="text-sm font-bold text-yellow-200 uppercase tracking-wider">
                      Organize Shore Landing Expedition
                    </h3>
                    <div className="text-xs text-neutral-400">
                      Send armed longboats ashore to replenish fresh water, hunt game, and collect timber.
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-black/40 p-3 rounded-lg border border-[#442e18] text-center text-xs font-mono mb-4">
                  <div>
                    <div className="text-neutral-400 text-[10px]">CREW READY</div>
                    <div className="text-yellow-300 text-sm font-bold">{totalCrew} Sailors</div>
                  </div>
                  <div>
                    <div className="text-neutral-400 text-[10px]">TIME REQUIRED</div>
                    <div className="text-sky-300 text-sm font-bold">6 Hours</div>
                  </div>
                  <div>
                    <div className="text-neutral-400 text-[10px]">DEPLETION ZONE</div>
                    <div className="text-amber-300 text-sm font-bold">4-Tile Radius</div>
                  </div>
                </div>

                <div className="text-xs text-[#d1c2ab] leading-relaxed mb-4 bg-[#1b120a] p-3 rounded border border-[#3b2713]">
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong className="text-sky-300">Fresh Water:</strong> Abundant streams & spring cascades along wild coasts.</li>
                    <li><strong className="text-amber-300">Food & Lumber:</strong> Small quantities of wild fruits, coastal game, and sound timber.</li>
                    <li><strong className="text-emerald-300">Crew Morale:</strong> Stepping on solid ground lifts spirits (+3 Morale).</li>
                    <li><strong className="text-yellow-300">Low Cargo Choice:</strong> You will decide exactly which gathered resources to stow aboard!</li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={handleLaunchExpedition}
                  disabled={isForaging || totalCrew < 5}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  {isForaging ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Landing Party Exploring Coastline (6 Hours)...</span>
                    </>
                  ) : (
                    <>
                      <span>🌲</span>
                      <span>Launch Shore Landing Party (6 Hours)</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Case 3: Expedition Complete, Allocation Modal Active */}
            {expeditionResult && !stowedSuccess && (
              <div className="bg-[#24170d] border border-[#6b4c27] rounded-xl p-5 mb-4">
                <div className="flex items-center justify-between border-b border-[#442e18] pb-3 mb-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                      ★ Landing Party Returned Safely!
                    </span>
                    <div className="text-sm font-serif italic text-yellow-100">
                      {expeditionResult.eventDescription}
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs text-neutral-400">
                    <div>6 Hours Elapsed</div>
                    <div className="text-emerald-400 font-bold">+3 Morale</div>
                  </div>
                </div>

                {/* Cargo Capacity Meter */}
                <div className="bg-black/50 p-3 rounded-lg border border-[#442e18] mb-4">
                  <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                    <span className="text-neutral-300">Fleet Free Cargo Hold Space:</span>
                    <strong className="text-yellow-300">{totalFreeCargoSpace} Barrels Free</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-neutral-400">Total Selected to Stow:</span>
                    <span className={`font-bold ${totalSelectedAlloc > totalFreeCargoSpace ? 'text-red-400' : 'text-emerald-400'}`}>
                      {totalSelectedAlloc} / {totalFreeCargoSpace} Units
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-2 mt-2 overflow-hidden border border-neutral-700">
                    <div
                      className={`h-full transition-all ${totalSelectedAlloc > totalFreeCargoSpace ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, (totalSelectedAlloc / (totalFreeCargoSpace || 1)) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Resource Sliders / Steppers */}
                <div className="space-y-3 mb-4">
                  {/* WATER */}
                  <div className="bg-[#191009] p-3 rounded-lg border border-[#3d2915] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 w-44">
                      <span className="text-2xl">💧</span>
                      <div>
                        <div className="text-xs font-bold text-sky-200">Fresh Water</div>
                        <div className="text-[10px] text-neutral-400 font-mono">Found: {expeditionResult.waterFound} Barrels</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setWaterAlloc((prev) => Math.max(0, prev - 1))}
                        disabled={waterAlloc <= 0}
                        className="w-7 h-7 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 rounded text-sm font-bold border border-neutral-700 cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max={expeditionResult.waterFound}
                        value={waterAlloc}
                        onChange={(e) => {
                          const v = Math.max(0, Math.min(expeditionResult.waterFound, Number(e.target.value) || 0));
                          setWaterAlloc(v);
                        }}
                        className="w-16 text-center bg-black/60 border border-neutral-700 rounded py-1 text-sm font-mono text-yellow-300 font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (totalSelectedAlloc < totalFreeCargoSpace && waterAlloc < expeditionResult.waterFound) {
                            setWaterAlloc((prev) => prev + 1);
                          }
                        }}
                        disabled={waterAlloc >= expeditionResult.waterFound || totalSelectedAlloc >= totalFreeCargoSpace}
                        className="w-7 h-7 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 rounded text-sm font-bold border border-neutral-700 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* FOOD */}
                  <div className="bg-[#191009] p-3 rounded-lg border border-[#3d2915] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 w-44">
                      <span className="text-2xl">🍞</span>
                      <div>
                        <div className="text-xs font-bold text-amber-200">Foraged Food</div>
                        <div className="text-[10px] text-neutral-400 font-mono">Found: {expeditionResult.foodFound} Barrels</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFoodAlloc((prev) => Math.max(0, prev - 1))}
                        disabled={foodAlloc <= 0}
                        className="w-7 h-7 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 rounded text-sm font-bold border border-neutral-700 cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max={expeditionResult.foodFound}
                        value={foodAlloc}
                        onChange={(e) => {
                          const v = Math.max(0, Math.min(expeditionResult.foodFound, Number(e.target.value) || 0));
                          setFoodAlloc(v);
                        }}
                        className="w-16 text-center bg-black/60 border border-neutral-700 rounded py-1 text-sm font-mono text-yellow-300 font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (totalSelectedAlloc < totalFreeCargoSpace && foodAlloc < expeditionResult.foodFound) {
                            setFoodAlloc((prev) => prev + 1);
                          }
                        }}
                        disabled={foodAlloc >= expeditionResult.foodFound || totalSelectedAlloc >= totalFreeCargoSpace}
                        className="w-7 h-7 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 rounded text-sm font-bold border border-neutral-700 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* LUMBER */}
                  <div className="bg-[#191009] p-3 rounded-lg border border-[#3d2915] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 w-44">
                      <span className="text-2xl">🪵</span>
                      <div>
                        <div className="text-xs font-bold text-orange-200">Felled Lumber</div>
                        <div className="text-[10px] text-neutral-400 font-mono">Found: {expeditionResult.lumberFound} Units</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLumberAlloc((prev) => Math.max(0, prev - 1))}
                        disabled={lumberAlloc <= 0}
                        className="w-7 h-7 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 rounded text-sm font-bold border border-neutral-700 cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max={expeditionResult.lumberFound}
                        value={lumberAlloc}
                        onChange={(e) => {
                          const v = Math.max(0, Math.min(expeditionResult.lumberFound, Number(e.target.value) || 0));
                          setLumberAlloc(v);
                        }}
                        className="w-16 text-center bg-black/60 border border-neutral-700 rounded py-1 text-sm font-mono text-yellow-300 font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (totalSelectedAlloc < totalFreeCargoSpace && lumberAlloc < expeditionResult.lumberFound) {
                            setLumberAlloc((prev) => prev + 1);
                          }
                        }}
                        disabled={lumberAlloc >= expeditionResult.lumberFound || totalSelectedAlloc >= totalFreeCargoSpace}
                        className="w-7 h-7 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 rounded text-sm font-bold border border-neutral-700 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center justify-between gap-2 mb-4 text-xs">
                  <span className="text-neutral-400 font-mono text-[11px]">Quick Allocation:</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handlePresetSplit}
                      className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-yellow-200 rounded border border-neutral-700 cursor-pointer"
                    >
                      ⚖️ Equal Split
                    </button>
                    <button
                      type="button"
                      onClick={handlePresetMaxWater}
                      className="px-2.5 py-1 bg-sky-950 hover:bg-sky-900 text-sky-200 rounded border border-sky-800 cursor-pointer"
                    >
                      💧 Max Water
                    </button>
                    <button
                      type="button"
                      onClick={handlePresetMaxFood}
                      className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 text-yellow-200 rounded border border-amber-800 cursor-pointer"
                    >
                      🍞 Max Food
                    </button>
                  </div>
                </div>

                {/* Stow Action Button */}
                <button
                  type="button"
                  onClick={handleConfirmStow}
                  disabled={totalSelectedAlloc > totalFreeCargoSpace}
                  className="w-full py-3 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer"
                >
                  📦 Stow Selected Provisions in Ship Holds (Leave Rest on Shore)
                </button>
              </div>
            )}

            {/* Case 4: Stowed Success Feedback */}
            {stowedSuccess && (
              <div className="bg-[#172417] border border-emerald-600 rounded-xl p-5 text-center mb-4">
                <div className="text-4xl mb-2">🎉</div>
                <h3 className="text-base font-bold text-emerald-300 font-serif mb-1">
                  Provisions Safely Stowed Aboard!
                </h3>
                <p className="text-xs text-neutral-300 mb-3">
                  Your crew has stowed the selected provisions into your vessels. Unselected supplies were left behind on the shore, and this coastal sector is now marked as harvested.
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('repair')}
                    className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-yellow-100 rounded-lg text-xs font-bold border border-amber-600 cursor-pointer"
                  >
                    🔨 Check Hull Careening & Repairs
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold border border-neutral-600 cursor-pointer"
                  >
                    Set Sail
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: HULL CAREENING & REPAIRS (80% FIELD CEILING) */}
        {activeTab === 'repair' && (
          <div className="flex-1 overflow-y-auto pr-1">
            {/* Status & Ceiling Banner */}
            <div className="bg-[#24170d] border border-[#5a3e1f] rounded-xl p-4 mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-yellow-200 uppercase tracking-wider">
                  Field Careening Rules (80% Ceiling)
                </div>
                <div className="text-[11px] text-neutral-300 mt-0.5">
                  1 Lumber restores 5 Durability points up to 80% maximum hull integrity. Drydocks required for 100%.
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-[10px] text-neutral-400">CARGO LUMBER</div>
                <div className="text-lg font-bold text-amber-300">{repairStatus.totalCargoLumber} Units</div>
              </div>
            </div>

            {repairMessage && (
              <div className="bg-amber-950/80 border border-amber-500/80 text-yellow-200 text-xs p-3 rounded-lg mb-3">
                {repairMessage}
              </div>
            )}

            {/* Ship List */}
            <div className="space-y-2 mb-4">
              {repairStatus.ships.map((ship) => {
                const isAtCeiling = ship.repairableDamage <= 0;
                const canAfford = repairStatus.totalCargoLumber >= ship.lumberCost;

                return (
                  <div
                    key={`${ship.shipIndex}-${ship.name}`}
                    className="bg-[#191009] p-3 rounded-xl border border-[#3d2915] flex items-center justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">⛵</span>
                        <span className="text-xs font-bold text-white">{ship.name}</span>
                        {isAtCeiling ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300">
                            At 80% Field Ceiling
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 border border-red-700 text-red-300 font-mono">
                            -{ship.repairableDamage} Durability
                          </span>
                        )}
                      </div>

                      {/* Durability Bar */}
                      <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400">
                        <div className="w-32 bg-neutral-800 rounded-full h-1.5 overflow-hidden border border-neutral-700">
                          <div
                            className={`h-full ${ship.currentDurability >= ship.fieldCeiling ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${Math.min(100, (ship.currentDurability / ship.maxDurability) * 100)}%` }}
                          />
                        </div>
                        <span>
                          {ship.currentDurability} / {ship.maxDurability} (Cap: {ship.fieldCeiling})
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div>
                      {isAtCeiling ? (
                        <div className="text-[11px] text-neutral-500 font-mono">Pristine Field State</div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRepairShip(ship.shipIndex)}
                          disabled={!canAfford}
                          className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-bold rounded-lg border border-amber-500 shadow cursor-pointer transition-all"
                        >
                          🔨 Patch (+{ship.repairableDamage} pts, {ship.lumberCost} 🪵)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Repair All Fleet Button */}
            {repairStatus.totalRepairableDamage > 0 && (
              <button
                type="button"
                onClick={handleRepairEntireFleet}
                disabled={repairStatus.totalCargoLumber < repairStatus.totalLumberNeeded}
                className="w-full py-3 bg-gradient-to-r from-yellow-700 to-amber-600 hover:from-yellow-600 hover:to-amber-500 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer"
              >
                🔨 Patch Entire Fleet (+{repairStatus.totalRepairableDamage} Durability, Cost: {repairStatus.totalLumberNeeded} Lumber)
              </button>
            )}

            {repairStatus.totalRepairableDamage <= 0 && (
              <div className="text-center text-xs text-emerald-400 font-mono bg-black/40 py-3 rounded border border-emerald-900/60">
                ✓ All fleet hulls are at or above the 80% field careening limit!
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-[#442e18] pt-3 mt-3 flex justify-between items-center text-xs font-mono text-neutral-400">
          <div>Press [Esc] or Click Close to resume sailing</div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs font-bold border border-neutral-600 cursor-pointer"
          >
            Close Haven
          </button>
        </div>

      </div>
    </div>
  );
}
