import { useState } from 'react';
import { AttackerStance, DuelState } from '../../game/combat/combatTypes';
import { executeDuelRound } from '../../game/combat/duelEngine';

interface Props {
  duelState: DuelState;
  onDuelConcluded: (winner: 'player' | 'enemy') => void;
}

export default function SwordDuelModal({ duelState, onDuelConcluded }: Props) {
  const [, setTick] = useState(0);
  const [lastRoundText, setLastRoundText] = useState<string | null>(null);

  const { playerFighter, enemyFighter, balanceMeter, log, winner } = duelState;

  const handleSelectStance = (stance: AttackerStance) => {
    if (winner) return;

    const result = executeDuelRound(duelState, stance);
    setLastRoundText(result.message);
    setTick((t) => t + 1);

    if (result.winner) {
      setTimeout(() => {
        onDuelConcluded(result.winner!);
      }, 1800);
    }
  };

  // Convert 0..200 balance meter to 0..100% percentage
  const balancePercent = Math.max(0, Math.min(100, (balanceMeter / 200) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none font-sans">
      <div className="max-w-3xl w-full bg-neutral-900 border-2 border-yellow-500/80 rounded-2xl shadow-[0_0_50px_rgba(234,179,8,0.3)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-3 bg-neutral-950 border-b border-yellow-600/40 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚔️</span>
            <span className="text-sm font-bold tracking-widest text-yellow-400 uppercase">
              1v1 Captain Sword Duel
            </span>
          </div>
          <div className="text-xs font-mono text-neutral-400">
            Round {duelState.round}
          </div>
        </div>

        {/* 0-200 Tug-of-War Balance Meter */}
        <div className="px-6 pt-5 pb-3 bg-neutral-950/70 border-b border-neutral-800">
          <div className="flex justify-between text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
            <span className="text-blue-400">Enemy Driven Back</span>
            <span className="text-yellow-400 font-mono">Balance: {balanceMeter} / 200</span>
            <span className="text-red-400">Captain Cornered</span>
          </div>
          <div className="w-full h-4 bg-neutral-800 rounded-full overflow-hidden p-0.5 border border-neutral-700 relative">
            <div
              className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-red-600 via-yellow-500 to-blue-500"
              style={{ width: `${balancePercent}%` }}
            />
            {/* Center Equilibrium Marker */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/70" />
          </div>
        </div>

        {/* Combatants Arena Deck */}
        <div className="p-6 grid grid-cols-2 gap-6 bg-gradient-to-b from-neutral-900 to-neutral-950">
          {/* Player Commodore */}
          <div className="p-4 rounded-xl bg-neutral-900/90 border border-blue-500/40 shadow-inner flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-blue-900/40 border border-blue-400 flex items-center justify-center text-2xl shadow">
                🤺
              </div>
              <div>
                <div className="text-xs text-blue-400 font-bold uppercase tracking-wider">
                  Commodore
                </div>
                <div className="text-lg font-bold text-white">
                  {playerFighter.name}
                </div>
              </div>
            </div>

            {/* Health Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-neutral-300 font-mono mb-1">
                <span>Stamina</span>
                <span>{playerFighter.health} / {playerFighter.maxHealth}</span>
              </div>
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${(playerFighter.health / playerFighter.maxHealth) * 100}%` }}
                />
              </div>
            </div>

            <div className="text-xs text-neutral-300 space-y-1 font-mono mt-auto">
              <div>Blade: <span className="text-yellow-300">{playerFighter.weaponName}</span></div>
              <div>Armor: <span className="text-neutral-400">{playerFighter.armorName}</span></div>
              <div>Swordsmanship: <span className="text-blue-400">{playerFighter.swordsmanship}</span></div>
            </div>
          </div>

          {/* Enemy Commodore */}
          <div className="p-4 rounded-xl bg-neutral-900/90 border border-red-500/40 shadow-inner flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-red-900/40 border border-red-400 flex items-center justify-center text-2xl shadow">
                🏴‍☠️
              </div>
              <div>
                <div className="text-xs text-red-400 font-bold uppercase tracking-wider">
                  Enemy Commodore
                </div>
                <div className="text-lg font-bold text-white">
                  {enemyFighter.name}
                </div>
              </div>
            </div>

            {/* Health Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-neutral-300 font-mono mb-1">
                <span>Stamina</span>
                <span>{enemyFighter.health} / {enemyFighter.maxHealth}</span>
              </div>
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{ width: `${(enemyFighter.health / enemyFighter.maxHealth) * 100}%` }}
                />
              </div>
            </div>

            <div className="text-xs text-neutral-300 space-y-1 font-mono mt-auto">
              <div>Blade: <span className="text-yellow-300">{enemyFighter.weaponName}</span></div>
              <div>Armor: <span className="text-neutral-400">{enemyFighter.armorName}</span></div>
              <div>Swordsmanship: <span className="text-red-400">{enemyFighter.swordsmanship}</span></div>
            </div>
          </div>
        </div>

        {/* Combat Exchange Feed */}
        <div className="px-6 py-3 bg-neutral-950/90 border-t border-b border-neutral-800 h-24 overflow-y-auto font-mono text-xs text-neutral-300 space-y-1">
          {log.map((entry, idx) => (
            <div
              key={idx}
              className={idx === 0 ? 'text-yellow-300 font-bold' : 'text-neutral-400'}
            >
              {entry}
            </div>
          ))}
        </div>

        {/* Interactive Stance Selection Bar */}
        <div className="p-6 bg-neutral-900">
          {winner ? (
            <div className="text-center py-2">
              <div className="text-2xl font-extrabold uppercase tracking-widest animate-pulse mb-1">
                {winner === 'player' ? (
                  <span className="text-emerald-400">🏆 DECISIVE DUEL VICTORY!</span>
                ) : (
                  <span className="text-red-500">☠️ CAPTAIN FELLED IN DUEL</span>
                )}
              </div>
              <div className="text-sm text-neutral-300">
                {winner === 'player'
                  ? 'The enemy flagship has struck its colors and surrendered!'
                  : 'Your flagship has been boarded and lost!'}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-xs text-neutral-400 font-bold uppercase tracking-wider mb-3 text-center">
                Select Your Attack Stance
              </div>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => handleSelectStance('thrust')}
                  className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 active:scale-95 border border-blue-500/50 rounded-xl text-left transition-all cursor-pointer group shadow"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🗡️</span>
                    <span className="font-bold text-sm text-white group-hover:text-blue-300">
                      THRUST
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 leading-tight">
                    Swift pierce. Beats Block, countered by Parry.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectStance('slash')}
                  className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 active:scale-95 border border-yellow-500/50 rounded-xl text-left transition-all cursor-pointer group shadow"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">⚔️</span>
                    <span className="font-bold text-sm text-white group-hover:text-yellow-300">
                      SLASH
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 leading-tight">
                    Sweeping cut. Beats Dodge, countered by Block.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectStance('strike')}
                  className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 active:scale-95 border border-red-500/50 rounded-xl text-left transition-all cursor-pointer group shadow"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🔨</span>
                    <span className="font-bold text-sm text-white group-hover:text-red-300">
                      STRIKE
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 leading-tight">
                    Heavy smash. Beats Parry, countered by Dodge.
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
