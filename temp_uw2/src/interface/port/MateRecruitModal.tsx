import { useState } from 'react';
import Assets from '../../assets';
import characterData from '../../data/characterData';
import { sailorSkills } from '../../data/sailorData';
import ProgressBar from '../common/ProgressBar';
import { classNames } from '../interfaceUtils';
import state from '../../state/state';
import {
  canRecruitTavernMate,
  recruitTavernMate,
  TavernMate,
} from '../../game/port/tavernMates';
import { Sailor } from '../../data/sailorData';
import { treatPatrons } from '../../state/actionsPub';

interface Props {
  mate: TavernMate & { sailor: Sailor };
  onClose: () => void;
  onRecruited: () => void;
}

export default function MateRecruitModal({ mate, onClose, onRecruited }: Props) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [currentGold, setCurrentGold] = useState<number>(state.gold);
  const [currentMorale, setCurrentMorale] = useState<number>(state.morale || 80);

  const charMeta = characterData[mate.sailorId] || {
    name: mate.name,
    color: 'text-amber-900',
  };

  const { stats, skills, navigationLevel, battleLevel, age } = mate.sailor;
  const check = canRecruitTavernMate(mate);
  const canRecruit = check.canRecruit && currentGold >= mate.signingBonus;

  const handleHire = () => {
    const res = recruitTavernMate(mate);
    if (res.success) {
      setIsSuccess(true);
      setFeedback(res.message);
      setCurrentGold(state.gold);
      setTimeout(() => {
        onRecruited();
      }, 1500);
    } else {
      setIsSuccess(false);
      setFeedback(res.message);
    }
  };

  const handleTreat = () => {
    const res = treatPatrons();
    if (res.success) {
      setCurrentGold(state.gold);
      setCurrentMorale(res.morale);
      setFeedback(
        `You buy a round of wine for the house! The tavern cheers and ${mate.name} smiles warmly at your generosity.`
      );
    } else {
      setFeedback(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs select-none">
      <div className="relative w-[880px] max-w-full bg-[#f4e4ce] border-4 border-[#3e2714] rounded-lg shadow-2xl p-6 font-mono text-[#241308]">
        {/* Header Bar */}
        <div className="flex justify-between items-center border-b-2 border-[#8c6f4b] pb-2 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📜</span>
            <div className="text-xl font-bold tracking-wider text-[#2e190e]">
              NAVIGATOR DOSSIER & APPRAISAL
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="bg-[#dfceba] px-3 py-1 rounded border border-[#9b8064]">
              💰 Treasury: <strong>{currentGold}</strong> Gold
            </span>
            <span className="bg-[#dfceba] px-3 py-1 rounded border border-[#9b8064]">
              🍺 Morale: <strong>{currentMorale}</strong>%
            </span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column: Portrait & Identity */}
          <div className="col-span-4 flex flex-col items-center bg-[#ebd8c1] p-4 rounded border border-[#ba9d7e] shadow-inner text-center">
            <div className="w-28 h-36 bg-[#2a1a10] border-2 border-[#694827] rounded overflow-hidden shadow flex items-center justify-center mb-3">
              <img
                src={Assets.characters(mate.sailorId)}
                alt={mate.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div className={classNames('text-xl font-bold', charMeta.color)}>
              {mate.name}
            </div>
            <div className="text-xs text-neutral-600 mt-0.5">
              Age {age} • Wanderer
            </div>
            <div className="mt-4 w-full bg-[#dfceba] p-2 rounded border border-[#9c8266] text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-700">Signing Fee:</span>
                <strong className="text-amber-900">{mate.signingBonus} Gold</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-700">Monthly Wage:</span>
                <strong className="text-neutral-900">{mate.monthlyWage} Gold</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-700">Req. Fame:</span>
                <strong className="text-neutral-900">{mate.requiredFame} pts</strong>
              </div>
            </div>

            {/* Quote Bubble */}
            <div className="mt-3 text-[11px] italic text-[#3a2012] bg-[#fdf8f2] p-2.5 rounded border border-[#caa887] text-left leading-relaxed">
              {mate.introQuote}
            </div>
          </div>

          {/* Right Column: Levels, Stats & Skills */}
          <div className="col-span-8 flex flex-col justify-between">
            <div>
              {/* Level Badges */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#e4cfb7] p-2.5 rounded border border-[#a6896c] flex justify-between items-center">
                  <span className="text-xs font-bold text-neutral-800">🧭 Navigation Level</span>
                  <span className="text-base font-bold text-blue-900">{navigationLevel}</span>
                </div>
                <div className="bg-[#e4cfb7] p-2.5 rounded border border-[#a6896c] flex justify-between items-center">
                  <span className="text-xs font-bold text-neutral-800">⚔️ Battle Level</span>
                  <span className="text-base font-bold text-red-900">{battleLevel}</span>
                </div>
              </div>

              {/* Core Stats Progress Bars */}
              <div className="bg-[#f0dfcc] p-3 rounded border border-[#ba9d7e] mb-4">
                <div className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Abilities & Talents
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {Object.entries(stats)
                    .filter(([key]) => key !== 'luck')
                    .map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="capitalize w-24 text-neutral-800">{key}:</span>
                        <div className="flex-1 mx-2">
                          <ProgressBar percent={val} />
                        </div>
                        <span className="font-bold text-right w-8">{val}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Special Skills Badges */}
              <div className="bg-[#f0dfcc] p-3 rounded border border-[#ba9d7e]">
                <div className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Naval Qualifications & Proficiencies
                </div>
                <div className="flex flex-wrap gap-2">
                  {sailorSkills.map((sk) => {
                    const hasSkill = skills.includes(sk);
                    return (
                      <span
                        key={sk}
                        className={`px-2.5 py-1 rounded text-xs font-bold border ${
                          hasSkill
                            ? 'bg-amber-900 text-amber-100 border-amber-950 shadow-xs'
                            : 'bg-neutral-300 text-neutral-500 border-neutral-400 line-through opacity-60'
                        }`}
                      >
                        {sk}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Feedback / Status Alert */}
            {feedback && (
              <div
                className={`mt-3 p-2.5 rounded text-xs border font-sans font-bold leading-relaxed ${
                  isSuccess
                    ? 'bg-emerald-900 border-emerald-500 text-emerald-100'
                    : 'bg-amber-950 border-amber-600 text-amber-200'
                }`}
              >
                {feedback}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex justify-between items-center mt-5 pt-3 border-t-2 border-[#8c6f4b]">
          <button
            type="button"
            onClick={handleTreat}
            className="px-4 py-2 rounded text-xs font-bold bg-[#e0cdb5] hover:bg-[#d4be9f] text-neutral-800 border border-[#8a6e4d] cursor-pointer shadow-xs transition-colors"
          >
            🍺 Treat Tavern to Wine (20 Gold)
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-xs font-bold bg-[#8c251d] hover:bg-[#731f18] text-white border border-[#52130e] cursor-pointer shadow-xs transition-colors"
            >
              Politely Leave
            </button>
            <button
              type="button"
              disabled={!canRecruit || isSuccess}
              onClick={handleHire}
              className={`px-5 py-2 rounded text-xs font-bold border cursor-pointer shadow transition-all ${
                canRecruit && !isSuccess
                  ? 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border-emerald-950'
                  : 'bg-neutral-400 text-neutral-600 border-neutral-500 cursor-not-allowed opacity-70'
              }`}
            >
              {isSuccess
                ? '✅ Commissioned!'
                : `✍️ Hire Navigator (${mate.signingBonus} Gold)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
