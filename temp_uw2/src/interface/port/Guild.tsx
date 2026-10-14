import { useState, useEffect, ReactNode } from 'react';
import useBuilding from './hooks/useBuilding';
import BuildingWrapper from './BuildingWrapper';
import BuildingMenu from '../common/BuildingMenu';
import state from '../../state/state';
import api from '../../services/api';
import {
  reportDiscoveriesToCollector,
  signCartographyContract,
  reportChartedMapTiles,
  CollectorReportResult,
} from '../../game/discovery/discoveryEngine';
import { monarchs } from '../../data/palaceData';
import { discoveries } from '../../data/discoveryData';
import explorationManager, {
  REGIONAL_CHARTS,
  RegionalChartKey,
} from '../../game/world/explorationManager';
import soundManager from '../sound/soundManager';

const guildOptions = ['Job Assignment', 'Country Info'] as const;
type GuildOptions = (typeof guildOptions)[number];

export default function Guild() {
  const { selectOption, back, reset, state: buildingState } =
    useBuilding<GuildOptions>();
  const { option } = buildingState;

  const [activeTab, setActiveTab] = useState<'collector' | 'cartography' | 'bounties'>('collector');
  const [reportResult, setReportResult] = useState<CollectorReportResult | null>(null);
  const [cartoMessage, setCartoMessage] = useState<string | null>(null);
  const [bounties, setBounties] = useState<any[]>([]);
  const [loadingBounties, setLoadingBounties] = useState<boolean>(false);
  const [influenceData, setInfluenceData] = useState<any[]>([]);
  const [contestedPorts, setContestedPorts] = useState<any[]>([]);

  useEffect(() => {
    if (option === 'Job Assignment' && activeTab === 'bounties') {
      setLoadingBounties(true);
      api.getMpBounties()
        .then((res) => {
          if (res.success && Array.isArray(res.bounties)) {
            setBounties(res.bounties);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingBounties(false));
    }
  }, [option, activeTab]);

  useEffect(() => {
    if (option === 'Country Info') {
      api.getMpInfluence()
        .then((res) => {
          if (res.success) {
            setInfluenceData(res.global_control || []);
            setContestedPorts(res.contested_ports || []);
          }
        })
        .catch(() => {});
    }
  }, [option]);

  const menu = (
    <BuildingMenu
      options={guildOptions.map((opt) => ({
        label: opt,
        value: opt,
        disabled: false,
      }))}
      onSelect={(opt) => {
        setActiveTab('collector');
        setReportResult(null);
        setCartoMessage(null);
        selectOption(opt);
      }}
      onCancel={() => back()}
      hidden={option !== null}
    />
  );

  let children: ReactNode = null;

  if (option === 'Job Assignment') {
    const playerDiscoveries = state.discoveries || [];
    const reportedDiscoveries = state.reportedDiscoveries || [];
    const unreportedCount = playerDiscoveries.filter((d) => !reportedDiscoveries.includes(d)).length;

    children = (
      <div className="absolute top-[120px] left-[420px] w-[620px] bg-[#1a1510] border-2 border-[#8c6f4b] p-5 text-[#f1e3cb] font-serif shadow-2xl z-30 rounded-lg">
        <div className="flex justify-between items-center border-b border-[#634b30] pb-2 mb-3 font-sans">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <h3 className="text-sm font-bold text-yellow-300">Guildmaster’s Contracts & Admiralty Board</h3>
          </div>
          <button
            onClick={reset}
            className="px-2 py-0.5 bg-red-950 border border-red-700 text-red-200 text-xs rounded hover:bg-red-900 cursor-pointer"
          >
            ✕ Back
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 mb-4 font-sans text-xs">
          <button
            onClick={() => {
              setActiveTab('collector');
              setCartoMessage(null);
            }}
            className={`flex-1 p-2 rounded font-bold border transition ${
              activeTab === 'collector'
                ? 'bg-amber-900 border-yellow-400 text-white'
                : 'bg-[#291e14] border-[#5e4325] text-amber-200 hover:bg-[#382a1d]'
            }`}
          >
            🏛️ Antiquities ({unreportedCount})
          </button>
          <button
            onClick={() => {
              setActiveTab('cartography');
              setReportResult(null);
            }}
            className={`flex-1 p-2 rounded font-bold border transition ${
              activeTab === 'cartography'
                ? 'bg-sky-950 border-sky-400 text-white'
                : 'bg-[#291e14] border-[#5e4325] text-sky-200 hover:bg-[#382a1d]'
            }`}
          >
            🗺️ Cartography Atlas
          </button>
          <button
            onClick={() => setActiveTab('bounties')}
            className={`flex-1 p-2 rounded font-bold border transition ${
              activeTab === 'bounties'
                ? 'bg-red-950 border-red-400 text-white'
                : 'bg-[#291e14] border-[#5e4325] text-red-200 hover:bg-[#382a1d]'
            }`}
          >
            ☠️ Wanted Bounties
          </button>
        </div>

        {/* 1. Collector Section */}
        {activeTab === 'collector' && (
          <div className="bg-[#241a12] p-4 rounded border border-[#523b24] mb-3">
            <h4 className="text-xs font-bold text-yellow-300 font-sans uppercase tracking-wider mb-2">
              Royal Antiquities Collector
            </h4>
            <p className="text-xs text-gray-300 italic mb-3">
              The Royal Academy purchases documented scrolls, rubbings, and specimens of ancient ruins, legendary monsters, and natural wonders!
            </p>

            <div className="bg-[#19120c] p-2.5 rounded border border-[#3d2b1b] text-xs font-sans mb-3 grid grid-cols-2 gap-2">
              <div>Total Discovered Landmarks: <strong className="text-yellow-300">{playerDiscoveries.length}</strong> / {discoveries.length}</div>
              <div>Pending Guild Submission: <strong className="text-amber-400">{unreportedCount}</strong></div>
            </div>

            <div className="text-center font-sans">
              <button
                onClick={() => {
                  const res = reportDiscoveriesToCollector();
                  setReportResult(res);
                }}
                disabled={unreportedCount === 0}
                className={`px-5 py-2 rounded font-bold text-xs uppercase cursor-pointer border ${
                  unreportedCount > 0
                    ? 'bg-yellow-800 border-yellow-500 text-yellow-100 hover:bg-yellow-700 shadow-md'
                    : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'
                }`}
              >
                📜 Submit Discoveries for Cash Bounty & Fame
              </button>
            </div>

            {reportResult && (
              <div className="mt-3 bg-[#172517] border border-green-700 p-3 rounded text-xs text-green-200 font-mono">
                {reportResult.unreportedCount > 0 ? (
                  <div>
                    <div className="font-bold text-green-300 mb-1">
                      🎉 Bounty Paid: +{reportResult.totalGoldEarned} Gold | Adventure Fame +{reportResult.totalFameEarned}!
                    </div>
                    <div>Submitted {reportResult.unreportedCount} legendary discoveries to the Royal Society archive.</div>
                  </div>
                ) : (
                  <div>No new discoveries pending submission. Explore the world coordinates to uncover more ruins and wonders!</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2. Cartography Section */}
        {activeTab === 'cartography' && (
          <div className="bg-[#241a12] p-4 rounded border border-[#523b24] mb-3">
            <h4 className="text-xs font-bold text-sky-300 font-sans uppercase tracking-wider mb-2 flex justify-between items-center">
              <span>Grand Cartography & Coastal Mapping</span>
              <span className="text-yellow-300 font-mono text-[11px]">
                🗺️ {explorationManager.getExplorationProgress().percentage}% Charted ({explorationManager.getExplorationProgress().exploredSectors} / 5,832 Sectors)
              </span>
            </h4>
            <p className="text-xs text-gray-300 italic mb-3">
              Contract with the Guild to chart unexplored coastlines, shoals, and open ocean currents.
            </p>

            <div className="bg-[#19120c] p-2.5 rounded border border-[#3d2b1b] text-xs font-sans mb-3">
              <div>
                Cartography Charter Status:{' '}
                <strong className={state.cartographyContract ? 'text-green-400' : 'text-amber-500'}>
                  {state.cartographyContract ? 'Active Guild Cartographer' : 'No Contract Signed'}
                </strong>
              </div>
            </div>

            <div className="flex gap-2 justify-center font-sans mb-3">
              {!state.cartographyContract ? (
                <button
                  onClick={() => {
                    const res = signCartographyContract();
                    setCartoMessage(res.message);
                  }}
                  className="px-5 py-2 rounded font-bold text-xs uppercase cursor-pointer bg-sky-900 border border-sky-500 text-sky-100 hover:bg-sky-800"
                >
                  🗺️ Sign Cartography Charter
                </button>
              ) : (
                <button
                  onClick={() => {
                    const res = explorationManager.submitCartographyAtlas();
                    if (res.newlyReported > 0) {
                      state.gold += res.goldEarned;
                      state.fame.adventure = (state.fame.adventure || 0) + res.fameEarned;
                      soundManager.playSfx('coin');
                      setCartoMessage(
                        `📜 Cartography Atlas Received!\n\nNewly Charted Sectors: +${res.newlyReported}\nGold Bounty Paid: +${res.goldEarned.toLocaleString()} G\nAdventure Fame Awarded: +${res.fameEarned}`,
                      );
                    } else {
                      setCartoMessage('No newly charted sectors since your last submission. Sail further into Terra Incognita!');
                    }
                  }}
                  className="px-5 py-2 rounded font-bold text-xs uppercase cursor-pointer bg-emerald-900 border border-emerald-500 text-emerald-100 hover:bg-emerald-800"
                >
                  🧭 Submit Voyage Log & Charted Sectors
                </button>
              )}
            </div>

            {/* Regional Charts Store */}
            <div className="mt-3 pt-3 border-t border-[#523b24]">
              <div className="text-[11px] font-bold text-amber-300 uppercase mb-2">
                Cartographer's Sea Charts for Sale
              </div>
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                {(Object.keys(REGIONAL_CHARTS) as RegionalChartKey[]).map((key) => {
                  const chart = REGIONAL_CHARTS[key];
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between p-2 rounded bg-[#19120c] border border-[#3d2b1b] text-xs"
                    >
                      <div>
                        <div className="font-bold text-amber-200">{chart.name}</div>
                        <div className="text-[10px] text-gray-400">{chart.description}</div>
                      </div>
                      <button
                        onClick={() => {
                          if (state.gold < chart.price) {
                            setCartoMessage(`Not enough gold! This chart costs ${chart.price.toLocaleString()} G.`);
                            return;
                          }
                          state.gold -= chart.price;
                          const revealed = explorationManager.unlockRegionalChart(key);
                          soundManager.playSfx('coin');
                          setCartoMessage(
                            `🗺️ Acquired ${chart.name}!\n\nRevealed ${revealed} new nautical sectors across the region. View them on your World Atlas [M]!`,
                          );
                        }}
                        className="px-3 py-1 bg-amber-900 hover:bg-amber-800 text-yellow-200 border border-amber-600 rounded font-bold text-[11px] transition-colors whitespace-nowrap ml-2"
                      >
                        {chart.price.toLocaleString()} G
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {cartoMessage && (
              <div className="mt-3 bg-[#19222b] border border-sky-700 p-3 rounded text-xs text-sky-200 whitespace-pre-line font-mono">
                {cartoMessage}
              </div>
            )}
          </div>
        )}

        {/* 3. Wanted Pirate Bounties (Task 7.5) */}
        {activeTab === 'bounties' && (
          <div className="bg-[#241a12] p-4 rounded border border-[#523b24] mb-3">
            <h4 className="text-xs font-bold text-red-300 font-sans uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>☠️ Admiralty Wanted Board — Most Wanted Corsairs</span>
              <span className="text-[10px] text-gray-400 lowercase font-mono">live server bounties</span>
            </h4>
            <p className="text-xs text-gray-300 italic mb-3">
              Hunt down notorious pirate commanders and hostile player ghost fleets across the high seas to claim their bounties!
            </p>

            {loadingBounties ? (
              <div className="text-xs text-gray-400 py-4 text-center">Reading Admiralty notices...</div>
            ) : bounties.length === 0 ? (
              <div className="text-xs text-gray-400 py-3 text-center">No active bounties posted. Shipping lanes are currently pacified.</div>
            ) : (
              <div className="max-h-[170px] overflow-y-auto space-y-2 pr-1 font-sans">
                {bounties.map((b) => (
                  <div key={b.id} className="bg-[#1b110b] border border-red-800/80 p-2.5 rounded flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-red-300 flex items-center gap-1.5">
                        <span>☠️</span>
                        <span>{b.captain_name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-red-950 border border-red-700 text-red-200 rounded">
                          {b.nation}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5 font-mono">
                        Last Sighted: Sector X: {b.world_x}, Y: {b.world_y}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-yellow-300 font-mono text-sm">
                        {b.bounty_gold.toLocaleString()} G
                      </div>
                      <div className="text-[10px] text-amber-400 uppercase font-bold">Reward</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (option === 'Country Info') {
    const nationList = Object.values(monarchs);

    children = (
      <div className="absolute top-[100px] left-[380px] w-[680px] bg-[#1a1510] border-2 border-[#8c6f4b] p-5 text-[#f1e3cb] font-serif shadow-2xl z-30 rounded-lg">
        <div className="flex justify-between items-center border-b border-[#634b30] pb-2 mb-3 font-sans">
          <span className="font-bold text-yellow-300 text-sm flex items-center gap-2">
            <span>🌐</span>
            <span>Great Seafaring Powers & Global Port Influence</span>
          </span>
          <button
            onClick={reset}
            className="px-2 py-0.5 bg-red-950 border border-red-700 text-red-200 text-xs rounded hover:bg-red-900 cursor-pointer"
          >
            ✕ Back
          </button>
        </div>

        {/* Multiplayer Port Influence Leaderboard (Task 7.2) */}
        {influenceData.length > 0 && (
          <div className="bg-[#241a12] p-3 rounded border border-amber-700/80 mb-3 font-sans">
            <h4 className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1.5">
              Multiplayer World Influence & Port Control
            </h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {influenceData.slice(0, 6).map((inf) => (
                <div key={inf.controlling_nation} className="bg-[#19110a] p-2 rounded border border-[#44301d]">
                  <div className="font-bold text-yellow-200 flex justify-between">
                    <span>{inf.controlling_nation}</span>
                    <span className="text-yellow-400">{inf.port_count} Ports</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Wealth: {Number(inf.total_economy || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monarch List */}
        <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2 font-sans text-xs">
          {nationList.map((m) => (
            <div key={m.nation} className="bg-[#241a12] p-2.5 rounded border border-[#523b24] flex justify-between items-center">
              <div>
                <div className="font-bold text-yellow-300 text-sm flex items-center gap-1.5">
                  <span>{m.nation}</span>
                  {m.nation === state.nationality && (
                    <span className="px-1.5 py-0.5 bg-green-950 border border-green-600 text-green-300 text-[10px] rounded uppercase font-mono">
                      Your Homeland
                    </span>
                  )}
                </div>
                <div className="text-gray-300 text-xs mt-0.5">{m.title}</div>
                <div className="text-[11px] text-amber-200/80 mt-1 italic font-serif">“{m.greeting}”</div>
              </div>
              <div className="text-right text-[11px] text-gray-400 font-mono">
                <div>Chamberlain: {m.courtChamberlain}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-right font-sans mt-3 border-t border-[#634b30] pt-2">
          <button
            onClick={reset}
            className="px-4 py-1 rounded font-bold text-xs uppercase bg-[#382618] border border-[#8a6538] text-yellow-200 hover:bg-[#4d3421]"
          >
            Leave Guild
          </button>
        </div>
      </div>
    );
  }

  return (
    <BuildingWrapper
      buildingId="7"
      vendorMessageBox={
        option === null
          ? {
              body: 'Welcome to the Maritime Guild! We coordinate Royal Academy discovery bounties, cartography charters, and imperial intelligence.',
            }
          : null
      }
      menu={menu}
    >
      {children}
    </BuildingWrapper>
  );
}
