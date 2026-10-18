import { useState, useMemo } from 'react';
import Assets from '../assets';
import { shipData } from '../data/shipData';
import { getPlayerFleet } from '../state/selectorsFleet';
import { getMates, getRoleDisplay } from '../state/selectors';
import { assignMateRole, unassignMateRole } from '../game/port/tavernMates';
import MessageBox from './common/MessageBox';
import {
  getCrewAssignment,
  setCrewAssignment,
  applyCrewPreset,
  getFlagshipCrewDutyStats,
  CREW_PRESETS,
  CrewAssignment,
} from '../state/actionsCrew';
import { calculateSightRadius } from '../game/world/fogOfWarRenderer';
import soundManager from './sound/soundManager';

export default function Fleet() {
  const [tick, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState<'crew' | 'ships'>('crew');
  const [assignment, setAssignment] = useState<CrewAssignment>(() => getCrewAssignment());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [appointingShipIdx, setAppointingShipIdx] = useState<number | null>(null);

  const fleet = getPlayerFleet();
  const mates = useMemo(() => getMates(), [tick, activeTab]);
  const flagship = fleet[0];
  const flagshipData = flagship ? shipData[flagship.id] : null;

  const dutyStats = useMemo(() => getFlagshipCrewDutyStats(), [assignment]);
  const sightBreakdown = useMemo(() => calculateSightRadius(), [assignment]);

  // Handle dynamic 3-way slider balancing maintaining exactly 100%
  const handleSliderChange = (changed: 'navigation' | 'lookout' | 'combat', rawVal: number) => {
    const val = Math.max(0, Math.min(100, Math.round(rawVal)));
    const others = (['navigation', 'lookout', 'combat'] as const).filter((k) => k !== changed);
    const remaining = 100 - val;

    const currentOtherSum = assignment[others[0]] + assignment[others[1]];
    let newOther1 = 0;
    let newOther2 = 0;

    if (currentOtherSum === 0) {
      newOther1 = Math.floor(remaining / 2);
      newOther2 = remaining - newOther1;
    } else {
      newOther1 = Math.round((assignment[others[0]] / currentOtherSum) * remaining);
      newOther2 = remaining - newOther1;
    }

    const updated: CrewAssignment = {
      [changed]: val,
      [others[0]]: newOther1,
      [others[1]]: newOther2,
    } as unknown as CrewAssignment;

    setAssignment(updated);
    setCrewAssignment(updated);
  };

  const handleApplyPreset = (key: 'voyage' | 'exploration' | 'combat' | 'balanced') => {
    const res = applyCrewPreset(key);
    const newAssignment = 'assignment' in res ? res.assignment : (res as CrewAssignment);
    setAssignment(newAssignment);
    soundManager.playSfx('shipBell');
    setToastMessage(`Applied preset: ${CREW_PRESETS[key].label}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <MessageBox>
      <div className="w-[1160px] h-[600px] flex flex-col font-mono text-black select-none p-2">
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-[#8c6f4b] pb-2 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚓</span>
            <div>
              <div className="text-xl font-bold tracking-wide text-[#2b1810]">
                FLEET & CREW DUTY ROSTER
              </div>
              <div className="text-xs text-neutral-600">
                Flagship: <strong className="text-amber-900">{flagship?.name || 'Vessel'}</strong> (
                {flagshipData?.name}) • Total Fleet: {fleet.length} {fleet.length === 1 ? 'Ship' : 'Ships'}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('crew')}
              className={`px-4 py-1.5 rounded text-xs font-bold transition-all cursor-pointer border ${
                activeTab === 'crew'
                  ? 'bg-amber-800 text-amber-100 border-amber-950 shadow'
                  : 'bg-[#e4d1bd] text-neutral-800 border-neutral-400 hover:bg-[#d8c2aa]'
              }`}
            >
              👥 Assign Crew Duties (Lookout / Nav / Combat)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ships')}
              className={`px-4 py-1.5 rounded text-xs font-bold transition-all cursor-pointer border ${
                activeTab === 'ships'
                  ? 'bg-amber-800 text-amber-100 border-amber-950 shadow'
                  : 'bg-[#e4d1bd] text-neutral-800 border-neutral-400 hover:bg-[#d8c2aa]'
              }`}
            >
              ⛵ Fleet Vessels ({fleet.length})
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-amber-200 border border-amber-600 text-amber-900 text-xs px-3 py-1 rounded mb-2 font-bold animate-fadeIn">
            {toastMessage}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'crew' ? (
          <div className="flex-1 flex gap-6 overflow-hidden">
            {/* Left Column: Sliders & Allocation */}
            <div className="flex-1 flex flex-col justify-between bg-[#ece0d1] border border-[#b89b7b] rounded-lg p-5 shadow-inner">
              <div>
                <div className="text-sm font-bold text-amber-950 mb-1 flex items-center gap-2">
                  <span>🧭</span>
                  <span>Flagship Duty Allocation (Must Total 100%)</span>
                </div>
                <div className="text-[11px] text-neutral-600 mb-4 leading-relaxed">
                  Allocate your sailors’ duties on the flagship. Navigation powers sail velocity;
                  Lookout expands your crow’s nest horizon for discovering hidden villages and supply
                  ports; Combat readies your cannons and boarding crew for battle.
                </div>

                {/* 1. Navigation Slider */}
                <div className="mb-4 bg-[#f8f1e7] p-3 rounded border border-[#d6c4b0]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-blue-950 flex items-center gap-1.5">
                      <span>⛵</span>
                      <span>Navigation (Sailing Velocity & Tacking)</span>
                    </span>
                    <span className="font-bold text-sm text-blue-900 bg-blue-100 px-2 py-0.5 rounded border border-blue-300">
                      {assignment.navigation}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={assignment.navigation}
                    onChange={(e) => handleSliderChange('navigation', Number(e.target.value))}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-800"
                  />
                  <div className="flex justify-between items-center mt-2 text-[11px]">
                    <span className="text-neutral-700 font-semibold">
                      Sailors Manned: <strong>{dutyStats.navCrew}</strong> / {dutyStats.totalCrew} (Min Req: {dutyStats.minimumCrew})
                    </span>
                    {dutyStats.isNavDeficient ? (
                      <span className="text-red-700 font-bold bg-red-100 px-2 py-0.5 rounded border border-red-300">
                        ⚠️ Understaffed ({Math.round(dutyStats.navFactor * 100)}% Speed)
                      </span>
                    ) : (
                      <span className="text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                        ✅ Full Propulsion (100% Speed)
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Lookout Slider */}
                <div className="mb-4 bg-[#f8f1e7] p-3 rounded border border-[#d6c4b0]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                      <span>🔭</span>
                      <span>Lookout (Horizon & Settlement Detection)</span>
                    </span>
                    <span className="font-bold text-sm text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      {assignment.lookout}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={assignment.lookout}
                    onChange={(e) => handleSliderChange('lookout', Number(e.target.value))}
                    className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-800"
                  />
                  <div className="flex justify-between items-center mt-2 text-[11px]">
                    <span className="text-neutral-700 font-semibold">
                      Watch Sailors: <strong>{dutyStats.lookoutCrew}</strong> in Crow’s Nest
                    </span>
                    <span className="text-emerald-900 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      Horizon: {sightBreakdown.finalRadiusTiles} Tiles (
                      {sightBreakdown.crewLookoutFactor >= 1.0 ? '+' : ''}
                      {Math.round((sightBreakdown.crewLookoutFactor - 1) * 100)}% Duty)
                    </span>
                  </div>
                </div>

                {/* 3. Combat Slider */}
                <div className="mb-4 bg-[#f8f1e7] p-3 rounded border border-[#d6c4b0]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-red-950 flex items-center gap-1.5">
                      <span>⚔️</span>
                      <span>Combat (Cannons & Boarding Marines)</span>
                    </span>
                    <span className="font-bold text-sm text-red-900 bg-red-100 px-2 py-0.5 rounded border border-red-300">
                      {assignment.combat}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={assignment.combat}
                    onChange={(e) => handleSliderChange('combat', Number(e.target.value))}
                    className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-800"
                  />
                  <div className="flex justify-between items-center mt-2 text-[11px]">
                    <span className="text-neutral-700 font-semibold">
                      Marines on Deck: <strong>{dutyStats.combatCrew}</strong> armed sailors
                    </span>
                    <span className="text-red-900 font-bold bg-red-100 px-2 py-0.5 rounded border border-red-300">
                      Battle Stations: {assignment.combat}% Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* Duty Presets */}
              <div>
                <div className="text-[11px] font-bold text-amber-900 mb-2">
                  Classic Age of Exploration Duty Presets:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(CREW_PRESETS) as Array<keyof typeof CREW_PRESETS>).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleApplyPreset(key as any)}
                      className="px-3 py-1.5 bg-[#fbf5ee] hover:bg-[#ebdcc9] text-left border border-[#8c6f4b] rounded text-xs font-bold text-[#2a170a] transition-all cursor-pointer shadow-sm hover:scale-[1.01]"
                    >
                      <div>{CREW_PRESETS[key].label}</div>
                      <div className="text-[9px] text-neutral-500 font-normal">
                        {CREW_PRESETS[key].assignment.navigation}% Nav •{' '}
                        {CREW_PRESETS[key].assignment.lookout}% Look •{' '}
                        {CREW_PRESETS[key].assignment.combat}% Combat
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Active Lookout & Navigation Intelligence */}
            <div className="w-80 flex flex-col justify-between bg-[#dfcfbd] border border-[#b89b7b] rounded-lg p-4 text-xs">
              <div>
                <div className="font-bold text-amber-950 text-sm border-b border-[#a88a6b] pb-1.5 mb-3 flex items-center gap-2">
                  <span>🔭</span>
                  <span>Lookout Intelligence</span>
                </div>

                {/* Sighting Modifiers List */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between bg-[#ece0d1] p-2 rounded border border-[#c4ab91]">
                    <span className="text-neutral-700">Base Sight Radius:</span>
                    <span className="font-bold text-neutral-900">{sightBreakdown.baseTiles} Tiles</span>
                  </div>
                  <div className="flex justify-between bg-[#ece0d1] p-2 rounded border border-[#c4ab91]">
                    <span className="text-neutral-700">Crew Lookout Duty:</span>
                    <span className="font-bold text-emerald-800">
                      {sightBreakdown.crewLookoutFactor >= 1.0 ? '+' : ''}
                      {Math.round((sightBreakdown.crewLookoutFactor - 1) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between bg-[#ece0d1] p-2 rounded border border-[#c4ab91]">
                    <span className="text-neutral-700">Lookout Officer Bonus:</span>
                    <span className="font-bold text-blue-800">
                      {sightBreakdown.lookoutBonus > 0
                        ? `+${Math.round(sightBreakdown.lookoutBonus * 100)}%`
                        : 'None (Assign in Mates)'}
                    </span>
                  </div>
                  <div className="flex justify-between bg-[#ece0d1] p-2 rounded border border-[#c4ab91]">
                    <span className="text-neutral-700">Brass Telescope:</span>
                    <span className="font-bold text-amber-800">
                      {sightBreakdown.telescopeBonus > 0 ? '+30% (Equipped)' : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between bg-[#ece0d1] p-2 rounded border border-[#c4ab91]">
                    <span className="text-neutral-700">Day / Night Factor:</span>
                    <span className="font-bold text-neutral-900">
                      {Math.round(sightBreakdown.timeOfDayFactor * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between bg-[#291e13] text-amber-100 p-2.5 rounded border border-amber-600 shadow">
                    <span className="font-bold">Total Detection Horizon:</span>
                    <span className="font-bold text-yellow-300 text-sm">
                      ~{sightBreakdown.finalRadiusTiles} Tiles
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-neutral-700 leading-relaxed bg-[#f2e7db] p-2.5 rounded border border-[#c4ab91]">
                  <strong>💡 Koei Explorer Tip:</strong> A high Lookout ratio combined with an Intuitive
                  Crow’s Nest Officer will trigger the ship’s bell and reveal pulsing green village markers
                  and uncharted supply havens from over 25 tiles away!
                </div>
              </div>

              {/* Flagship Card Footer */}
              <div className="bg-[#ece0d1] p-2.5 rounded border border-[#c4ab91] flex items-center gap-3">
                {flagship && (
                  <img
                    src={Assets.ships(flagship.id)}
                    alt=""
                    className="w-16 h-12 object-contain"
                  />
                )}
                <div className="text-[11px]">
                  <div className="font-bold text-neutral-900">{flagship?.name || 'Flagship'}</div>
                  <div className="text-neutral-600">
                    Crew: {flagship?.crew || 0} Sailors • Morale: {dutyStats.totalCrew > 0 ? 'High' : 'Zero'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Tab 2: Fleet Vessels Overview */
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              {fleet.map((ship, idx) => {
                const data = shipData[ship.id];
                const isFlagship = idx === 0;
                const captain = isFlagship
                  ? mates[0]
                  : mates.find((m) => m.role === idx);

                return (
                  <div
                    key={ship.name + idx}
                    className="flex bg-[#ece0d1] border border-[#b89b7b] rounded-lg p-3 gap-4 shadow-sm items-center"
                  >
                    <div className="w-24 h-20 flex-shrink-0 bg-[#3b5368] rounded border border-[#233543] flex items-center justify-center p-1">
                      <img
                        src={Assets.ships(ship.id)}
                        alt=""
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-[#2a170a]">
                          {isFlagship ? '👑 ' : ''}
                          {ship.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#dfcfbd] border border-[#9b8267]">
                          {data?.name}
                        </span>
                      </div>

                      {/* Captain Badge & Action */}
                      {isFlagship ? (
                        <div className="text-amber-900 text-[11px] font-bold flex items-center gap-1">
                          <span>👑 Commodore: {captain?.name || 'Flagship Commander'}</span>
                        </div>
                      ) : captain ? (
                        <div className="flex items-center justify-between bg-[#dfcfbd] px-2 py-1 rounded border border-[#b89b7b]">
                          <div>
                            <div className="font-bold text-[11px] text-[#2a170a]">
                              ⚔️ Captain: {captain.name}
                            </div>
                            <div className="text-[10px] text-neutral-600">
                              Nav Lv {captain.navigationLevel} • Battle Lv {captain.battleLevel}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAppointingShipIdx(idx)}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#e8dac9] hover:bg-[#d6c1aa] text-neutral-800 border border-[#8c6f4b] cursor-pointer shadow-2xs"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-red-50 px-2 py-1 rounded border border-red-300">
                          <div className="text-red-800 font-bold text-[10px]">
                            ⚠️ No Captain Appointed!
                          </div>
                          <button
                            type="button"
                            onClick={() => setAppointingShipIdx(idx)}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-800 hover:bg-amber-900 text-amber-100 border border-amber-950 cursor-pointer shadow-xs"
                          >
                            + Appoint
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] text-neutral-600">
                        <div>
                          Crew: <strong className="text-black">{ship.crew}</strong>/{(ship as any).maxCrew || data?.capacity}
                        </div>
                        <div>
                          Min: <strong className="text-black">{data?.minimumCrew}</strong>
                        </div>
                        <div>
                          Cargo: <strong className="text-black">{data?.capacity - (ship.crew || 0)}</strong>
                        </div>
                        <div>
                          Tacking: <strong className="text-black">{data?.tacking}</strong>
                        </div>
                        <div>
                          Power: <strong className="text-black">{data?.power}</strong>
                        </div>
                        <div>
                          Rig: <strong className="text-black">{data?.sailType === 1 ? 'Lateen' : 'Square'}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Consort Captain Appointment Modal */}
        {appointingShipIdx !== null && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="w-[520px] max-h-[480px] bg-[#f4ebe1] border-2 border-[#8c6f4b] rounded-xl shadow-2xl flex flex-col overflow-hidden font-mono text-black">
              <div className="bg-[#e2d0bd] border-b border-[#bfa384] px-4 py-2.5 flex justify-between items-center">
                <div className="font-bold text-sm text-[#2c1708] flex items-center gap-2">
                  <span>⚔️</span>
                  <span>
                    Appoint Captain: {fleet[appointingShipIdx]?.name} (Ship #{appointingShipIdx + 1})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAppointingShipIdx(null)}
                  className="text-neutral-600 hover:text-black font-bold px-2 py-0.5 rounded cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-2 text-xs flex-1">
                <div className="text-[11px] text-neutral-600 mb-2">
                  Select an officer from your roster to command this vessel in tactical naval combat:
                </div>

                {mates.slice(1).map((mate) => {
                  const isCurrentCaptain = mate.role === appointingShipIdx;
                  const currentRoleDisplay = getRoleDisplay(mate.role);

                  return (
                    <div
                      key={mate.sailorId}
                      className={`p-2.5 rounded border flex items-center justify-between gap-3 ${
                        isCurrentCaptain
                          ? 'bg-amber-800 text-amber-100 border-amber-950'
                          : 'bg-[#faf3eb] border-[#caa98a]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={Assets.characters(mate.sailorId)}
                          alt=""
                          className="w-10 h-12 object-cover rounded border border-[#8c6f4b] bg-[#dfcfbd]"
                        />
                        <div>
                          <div className="font-bold text-sm">{mate.name}</div>
                          <div className="text-[10px] text-neutral-600">
                            Nav Lv {mate.navigationLevel} • Battle Lv {mate.battleLevel} • Ldr {mate.stats.leadership}
                          </div>
                          <div className="text-[10px] text-amber-900 font-semibold mt-0.5">
                            {currentRoleDisplay || 'Reserve Navigator'}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isCurrentCaptain ? (
                          <button
                            type="button"
                            onClick={() => {
                              unassignMateRole(mate.sailorId);
                              setAppointingShipIdx(null);
                              setTick((t) => t + 1);
                            }}
                            className="px-2.5 py-1 rounded text-xs font-bold bg-neutral-900 text-neutral-200 border border-neutral-700 cursor-pointer hover:bg-black"
                          >
                            Relieve
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              assignMateRole(mate.sailorId, appointingShipIdx);
                              setAppointingShipIdx(null);
                              setTick((t) => t + 1);
                              soundManager.playSfx('shipBell');
                            }}
                            className="px-3 py-1 rounded text-xs font-bold bg-amber-800 hover:bg-amber-900 text-amber-100 border border-amber-950 cursor-pointer shadow-sm"
                          >
                            Appoint
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {mates.length <= 1 && (
                  <div className="text-center py-6 text-neutral-500 italic">
                    You have no other navigators in your fleet! Visit local taverns to recruit able officers.
                  </div>
                )}
              </div>

              <div className="bg-[#e2d0bd] border-t border-[#bfa384] px-4 py-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setAppointingShipIdx(null)}
                  className="px-4 py-1.5 bg-[#d4c1ab] hover:bg-[#c5b098] border border-[#8c6f4b] rounded text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MessageBox>
  );
}
