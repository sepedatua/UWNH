import { useState, useCallback } from 'react';

import Assets from '../../assets';
import type { ProvisionsType } from '../../state/state';
import state from '../../state/state';
import { classNames } from '../interfaceUtils';
import updateInterface from '../../state/updateInterface';
import { getPlayerFleet } from '../../state/selectorsFleet';

const provisionClass = 'flex items-center py-1.5';
const quantityClass = 'flex-1 text-right text-xl font-mono';

interface Props {
  hidden: boolean;
}

export default function Provisions({ hidden }: Props) {
  const [provisions, setProvisions] = useState<ProvisionsType>({
    water: 0,
    food: 0,
    lumber: 0,
    shot: 0,
  });
  const [rationRate, setRationRate] = useState<number>(state.rationRate ?? 100);

  updateInterface.provisions = (p) => {
    setProvisions(p);
  };

  const handleRationChange = useCallback((newRate: number) => {
    const clamped = Math.max(20, Math.min(100, Math.round(newRate / 10) * 10));
    state.rationRate = clamped;
    setRationRate(clamped);
  }, []);

  const { water, food, lumber, shot } = provisions;

  // Calculate live days remaining based on active crew and selected ration
  let totalCrew = 0;
  const ships = getPlayerFleet();
  for (const s of ships) totalCrew += s.crew || 0;

  const dailyRationPerCrew = 0.1 * (rationRate / 100);
  const dailyFleetBurn = totalCrew * dailyRationPerCrew;
  const waterDays = dailyFleetBurn > 0 ? Math.floor(water / dailyFleetBurn) : 999;
  const foodDays = dailyFleetBurn > 0 ? Math.floor(food / dailyFleetBurn) : 999;

  const getRationBadge = () => {
    if (rationRate >= 100) {
      return { label: '100% Standard', color: 'text-emerald-400', penalty: 'Stable Morale' };
    }
    if (rationRate >= 80) {
      return { label: `${rationRate}% Light`, color: 'text-yellow-300', penalty: '-1 Morale / day' };
    }
    if (rationRate >= 60) {
      return { label: `${rationRate}% Half`, color: 'text-amber-400', penalty: '-2 Morale / day' };
    }
    if (rationRate >= 40) {
      return { label: `${rationRate}% Lean`, color: 'text-orange-400', penalty: '-5 Morale / day' };
    }
    return { label: `${rationRate}% Emergency`, color: 'text-red-400', penalty: '-10 Morale / day' };
  };

  const badge = getRationBadge();

  return (
    <div className={classNames('mt-12 select-none', hidden ? 'hidden' : '')}>
      <div className="text-xs uppercase tracking-wider text-neutral-400 font-bold mb-2">Provisions</div>
      <div className={provisionClass}>
        <img
          src={Assets.images('worldWater').toDataURL()}
          alt="Water"
          className="w-7 h-12 object-contain"
        />
        <div className={quantityClass}>{water}</div>
      </div>
      <div className={provisionClass}>
        <img
          src={Assets.images('worldFood').toDataURL()}
          alt="food"
          className="w-7 h-12 object-contain"
        />
        <div className={quantityClass}>{food}</div>
      </div>
      <div className={provisionClass}>
        <img
          src={Assets.images('worldLumber').toDataURL()}
          alt="Lumber"
          className="w-7 h-12 object-contain"
        />
        <div className={quantityClass}>{lumber}</div>
      </div>
      <div className={provisionClass}>
        <img
          src={Assets.images('worldShot').toDataURL()}
          alt="Shot"
          className="w-7 h-12 object-contain"
        />
        <div className={quantityClass}>{shot}</div>
      </div>

      {/* Interactive Rations Adjustment Widget */}
      <div className="mt-4 pt-3 border-t border-neutral-700/60 font-sans">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-neutral-400 font-semibold">Rations:</span>
          <span className={classNames('font-mono font-bold text-xs', badge.color)}>
            {badge.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mt-1">
          <button
            type="button"
            onClick={() => handleRationChange(rationRate - 10)}
            disabled={rationRate <= 20}
            className="w-6 h-6 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 disabled:opacity-40 disabled:hover:bg-neutral-800 text-white rounded text-xs font-bold transition-colors cursor-pointer border border-neutral-600"
            title="Decrease Rations (Save provisions, reduce morale)"
          >
            -
          </button>

          <input
            type="range"
            min="20"
            max="100"
            step="10"
            value={rationRate}
            onChange={(e) => handleRationChange(Number(e.target.value))}
            className="flex-1 h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            title={`Set Daily Rations: ${rationRate}%`}
          />

          <button
            type="button"
            onClick={() => handleRationChange(rationRate + 10)}
            disabled={rationRate >= 100}
            className="w-6 h-6 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 disabled:opacity-40 disabled:hover:bg-neutral-800 text-white rounded text-xs font-bold transition-colors cursor-pointer border border-neutral-600"
            title="Increase Rations (Full health, standard consumption)"
          >
            +
          </button>
        </div>

        {/* Live Days Preview */}
        <div className="mt-2 text-[11px] font-mono text-neutral-300 flex justify-between bg-black/40 px-2 py-1 rounded border border-neutral-800">
          <span title="Days of Water Remaining">💧 ~{waterDays >= 999 ? '∞' : waterDays}d</span>
          <span className="text-neutral-600">|</span>
          <span title="Days of Food Remaining">🍞 ~{foodDays >= 999 ? '∞' : foodDays}d</span>
        </div>

        {/* Morale Advisory */}
        {rationRate < 100 && (
          <div className="mt-1 text-[10px] text-amber-300 font-mono text-right animate-pulse">
            ⚠️ {badge.penalty}
          </div>
        )}
      </div>
    </div>
  );
}
