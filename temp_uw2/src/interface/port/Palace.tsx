import { useState, ReactNode } from 'react';
import useBuilding from './hooks/useBuilding';
import BuildingWrapper from './BuildingWrapper';
import BuildingMenu from '../common/BuildingMenu';
import state from '../../state/state';
import {
  checkPalaceGuard,
  meetRuler,
  requestRoyalMission,
  abandonRoyalMission,
  requestRoyalAid,
  defectNationality,
  getCurrentNobilityRank,
  getNextNobilityRank,
  getTotalFame,
} from '../../state/actionsPalace';
import { getMonarchForNation } from '../../data/palaceData';

const palaceOptions = [
  'Meet Ruler',
  'Royal Mission',
  'Gold',
  'Ship',
  'Defect',
] as const;
type PalaceOptions = (typeof palaceOptions)[number];

export default function Palace() {
  const { selectOption, back, reset, state: buildingState } =
    useBuilding<PalaceOptions>();
  const { option } = buildingState;

  const [dialogue, setDialogue] = useState<string | null>(null);

  const guardCheck = checkPalaceGuard();
  const monarch = getMonarchForNation(state.nationality);
  const currentRank = getCurrentNobilityRank();
  const totalFame = getTotalFame();

  // If guard turns the player away
  if (!guardCheck.allowed) {
    return (
      <BuildingWrapper
        buildingId="6"
        vendorMessageBox={{
          body: guardCheck.message,
          acknowledge: () => back(),
        }}
        menu={
          <BuildingMenu
            options={[{ label: 'Withdraw', value: 'Withdraw' }]}
            onSelect={() => back()}
            onCancel={() => back()}
          />
        }
      />
    );
  }

  const menu = (
    <BuildingMenu
      options={palaceOptions.map((opt) => ({
        label: opt,
        value: opt,
        disabled: false,
      }))}
      onSelect={(opt) => {
        setDialogue(null);
        selectOption(opt);
      }}
      onCancel={() => back()}
      hidden={option !== null}
    />
  );

  let children: React.ReactNode = null;

  // Active dialogue or modal overlay
  if (option === 'Meet Ruler') {
    const res = meetRuler();
    children = (
      <div className="absolute top-[140px] left-[480px] w-[520px] bg-[#1a140d] border-2 border-[#b89558] p-5 text-[#f3e7d3] font-serif shadow-2xl z-30 rounded-lg">
        <div className="flex justify-between items-center border-b border-[#7d5f30] pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👑</span>
            <div>
              <h3 className="text-sm font-bold text-yellow-300 font-sans">{monarch.title}</h3>
              <p className="text-[11px] text-gray-400 font-sans">{monarch.name} of {monarch.nation}</p>
            </div>
          </div>
          <button
            onClick={reset}
            className="px-2.5 py-1 bg-[#3a291a] border border-[#8a6538] text-yellow-200 text-xs rounded hover:bg-[#523b24] cursor-pointer font-sans"
          >
            Leave Presence
          </button>
        </div>

        <div className="bg-[#261b11] p-4 rounded border border-[#6b4c27] text-xs leading-relaxed italic mb-4 whitespace-pre-line shadow-inner text-[#fcedd7]">
          {dialogue || res.message}
        </div>

        {/* Nobility Stats Card */}
        <div className="bg-[#1b120a] p-3 rounded border border-[#52391b] grid grid-cols-2 gap-2 text-xs font-sans mb-3">
          <div>
            <span className="text-gray-400">Current Rank:</span>{' '}
            <strong className="text-yellow-300 font-bold">{currentRank.title} (Rank {currentRank.rank})</strong>
          </div>
          <div>
            <span className="text-gray-400">Total Fame:</span>{' '}
            <strong className="text-amber-200">{totalFame} pts</strong>
          </div>
          <div>
            <span className="text-gray-400">Tax Exemption:</span>{' '}
            <strong className={state.taxPermit ? 'text-green-400' : 'text-amber-500'}>
              {state.taxPermit ? 'Permit Granted (0% Tax)' : 'Unlicensed (20% Tax)'}
            </strong>
          </div>
          <div>
            <span className="text-gray-400">Privileges:</span>{' '}
            <span className="text-[11px] text-gray-300">{currentRank.perks}</span>
          </div>
        </div>

        <div className="text-center font-sans">
          <button
            onClick={reset}
            className="px-6 py-1.5 rounded font-bold text-xs uppercase cursor-pointer bg-yellow-800 border border-yellow-500 text-yellow-100 hover:bg-yellow-700"
          >
            Bow and Step Back
          </button>
        </div>
      </div>
    );
  }

  if (option === 'Royal Mission') {
    const hasMission = Boolean(state.royalMission);
    const mission = state.royalMission;

    children = (
      <div className="absolute top-[140px] left-[460px] w-[560px] bg-[#1a140d] border-2 border-[#b89558] p-5 text-[#f3e7d3] font-serif shadow-2xl z-30 rounded-lg">
        <div className="flex justify-between items-center border-b border-[#7d5f30] pb-2 mb-3 font-sans">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <h3 className="text-sm font-bold text-yellow-300">Royal Commission & Bounties</h3>
          </div>
          <button
            onClick={reset}
            className="px-2 py-0.5 bg-red-950 border border-red-700 text-red-200 text-xs rounded hover:bg-red-900 cursor-pointer"
          >
            ✕ Back
          </button>
        </div>

        {hasMission && mission ? (
          <div>
            <div className="bg-[#291b10] p-4 rounded border border-amber-600 mb-3 shadow-md">
              <div className="text-xs font-bold text-yellow-300 uppercase tracking-wide border-b border-[#634524] pb-1.5 mb-2 font-sans flex justify-between">
                <span>{mission.title}</span>
                <span className="text-amber-400">{mission.daysRemaining} Days Left</span>
              </div>
              <p className="text-xs leading-relaxed italic text-[#f7ead5] mb-3">{mission.description}</p>
              <div className="grid grid-cols-2 gap-2 text-xs font-sans bg-[#1b120a] p-2.5 rounded border border-[#4d3419]">
                <div>Royal Bounty: <strong className="text-yellow-300">{mission.rewardGold} Gold</strong></div>
                <div>Title Reward: <strong className="text-yellow-300">+{mission.rewardRankIncrement} Nobility Rank</strong></div>
                <div>Target: <strong className="text-amber-200">{mission.targetName}</strong></div>
                <div>Status: <strong className="text-emerald-400 uppercase">{mission.status}</strong></div>
              </div>
            </div>

            <div className="flex justify-between items-center font-sans">
              <button
                onClick={() => {
                  const res = abandonRoyalMission();
                  setDialogue(res.message);
                }}
                className="px-3 py-1.5 rounded font-bold text-xs uppercase bg-red-950 border border-red-700 text-red-300 hover:bg-red-900 cursor-pointer"
              >
                ⚠️ Renounce Mission (Halves Fame!)
              </button>
              <button
                onClick={reset}
                className="px-4 py-1.5 rounded font-bold text-xs uppercase bg-[#3d2c1c] border border-[#856138] text-yellow-200 hover:bg-[#523b26]"
              >
                Depart on Assignment
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs text-gray-300 mb-4 font-sans leading-relaxed">
              His Majesty bestows honorable assignments upon trusted commanders. Completing royal commissions elevates your Nobility Rank and yields royal bounties!
            </p>
            <div className="text-center font-sans">
              <button
                onClick={() => {
                  const res = requestRoyalMission();
                  setDialogue(res.message);
                }}
                className="px-6 py-2.5 rounded font-bold text-xs uppercase cursor-pointer bg-yellow-800 border border-yellow-500 text-yellow-100 hover:bg-yellow-700 shadow-lg"
              >
                📜 Petition Crown for a Royal Mission
              </button>
            </div>
          </div>
        )}

        {dialogue && (
          <div className="mt-3 bg-[#24170d] p-3 rounded border border-amber-800 text-xs text-amber-200 italic whitespace-pre-line">
            {dialogue}
          </div>
        )}
      </div>
    );
  }

  if (option === 'Gold' || option === 'Ship') {
    const res = requestRoyalAid(option === 'Gold' ? 'gold' : 'ship');
    children = (
      <div className="absolute top-[160px] left-[500px] w-[500px] bg-[#1a140d] border-2 border-[#b89558] p-5 text-[#f3e7d3] font-serif shadow-2xl z-30 rounded-lg">
        <div className="flex justify-between items-center border-b border-[#7d5f30] pb-2 mb-3 font-sans">
          <span className="font-bold text-yellow-300 text-sm">🏛️ Royal Navy Admiralty Aid</span>
          <button
            onClick={reset}
            className="px-2 py-0.5 bg-red-950 border border-red-700 text-red-200 text-xs rounded hover:bg-red-900 cursor-pointer"
          >
            ✕ Close
          </button>
        </div>
        <div className="bg-[#24170d] p-4 rounded border border-[#634524] text-xs leading-relaxed italic mb-4 text-[#f7ead5]">
          {res.message}
        </div>
        <div className="text-center font-sans">
          <button
            onClick={reset}
            className="px-4 py-1.5 rounded font-bold text-xs uppercase bg-[#3d2c1c] border border-[#856138] text-yellow-200 hover:bg-[#523b26]"
          >
            Understood
          </button>
        </div>
      </div>
    );
  }

  if (option === 'Defect') {
    const rivalNations = ['Portugal', 'Spain', 'England', 'Netherlands', 'Ottoman Empire', 'Italy'].filter(
      (n) => n !== state.nationality,
    );

    children = (
      <div className="absolute top-[140px] left-[480px] w-[520px] bg-[#1c120c] border-2 border-red-700 p-5 text-[#f5e4cb] font-serif shadow-2xl z-30 rounded-lg">
        <div className="flex justify-between items-center border-b border-red-800 pb-2 mb-3 font-sans">
          <span className="font-bold text-red-300 text-sm flex items-center gap-1.5">
            <span>⚔️</span>
            <span>Renounce Allegiance & Defect</span>
          </span>
          <button
            onClick={reset}
            className="px-2 py-0.5 bg-gray-800 border border-gray-600 text-gray-300 text-xs rounded hover:bg-gray-700 cursor-pointer"
          >
            ✕ Cancel
          </button>
        </div>

        <p className="text-xs text-amber-200 mb-3 font-sans leading-relaxed">
          <strong>Warning:</strong> Defecting to another sovereign will revoke your nobility ranks, confiscate your Tax Exemption Permit, and halve your accumulated Fame across all categories.
        </p>

        <div className="grid grid-cols-2 gap-2 mb-4 font-sans text-xs">
          {rivalNations.map((nation) => (
            <button
              key={nation}
              onClick={() => {
                const res = defectNationality(nation);
                setDialogue(res.message);
              }}
              className="p-2.5 rounded font-bold bg-[#381f1f] border border-red-800 text-red-200 hover:bg-red-900 transition text-left flex items-center justify-between"
            >
              <span>{nation}</span>
              <span className="text-[10px] text-yellow-400">Swear Fealty →</span>
            </button>
          ))}
        </div>

        {dialogue && (
          <div className="bg-[#2d1414] p-3 rounded border border-red-600 text-xs text-red-200 italic mb-3">
            {dialogue}
          </div>
        )}

        <div className="text-right font-sans">
          <button
            onClick={reset}
            className="px-4 py-1.5 rounded font-bold text-xs uppercase bg-gray-800 border border-gray-600 text-gray-200 hover:bg-gray-700"
          >
            Leave Council
          </button>
        </div>
      </div>
    );
  }

  return (
    <BuildingWrapper
      buildingId="6"
      vendorMessageBox={
        option === null
          ? {
              body: `${monarch.greeting} The court of ${monarch.nation} is in session. What brings you before the throne?`,
            }
          : null
      }
      menu={menu}
    >
      {children}
    </BuildingWrapper>
  );
}
