import { useState } from 'react';
import state from '../../state/state';
import {
  getCurrentCampaign,
  getCurrentChapter,
  isCurrentChapterComplete,
  completeCurrentChapter,
} from '../../game/scenario/scenarioEngine';

interface Props {
  onClose: () => void;
}

export default function ScenarioJournalModal({ onClose }: Props) {
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const campaign = getCurrentCampaign();
  const chapter = getCurrentChapter();
  const allComplete = isCurrentChapterComplete();

  const handleClaim = () => {
    const res = completeCurrentChapter();
    setResultMessage(res.message);
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 pointer-events-auto font-sans">
      <div className="max-w-2xl w-full bg-[#18120c] border-2 border-[#8c6f4b] rounded-xl shadow-2xl overflow-hidden text-[#ede0cb]">
        {/* Header */}
        <div className="bg-[#241a12] border-b border-[#63482a] p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📜</span>
            <div>
              <div className="text-xs uppercase font-bold text-yellow-400 tracking-wider">
                Logbook & Quest Journal • {state.gameMode === 'sp_scenario' ? 'Campaign Scenario' : 'Endless Voyage'}
              </div>
              <h2 className="text-lg font-bold text-white font-serif">
                {campaign.protagonistName}: {campaign.campaignTitle}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-950 border border-red-700 text-red-200 text-xs rounded hover:bg-red-900 cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[500px] overflow-y-auto space-y-5">
          {/* Chapter Banner */}
          <div className="bg-[#2b1e13] border border-[#7a5732] rounded-lg p-4 shadow-inner">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-yellow-300 uppercase tracking-widest font-mono">
                Chapter {chapter.chapter}
              </span>
              <span className="text-[11px] px-2 py-0.5 bg-yellow-950 text-yellow-300 rounded border border-yellow-700/80">
                Reward: {chapter.rewardDescription}
              </span>
            </div>
            <h3 className="text-base font-bold text-amber-100 font-serif mb-2">
              {chapter.title}
            </h3>
            <p className="text-xs text-[#ddcfb9] leading-relaxed italic font-serif">
              {chapter.synopsis}
            </p>
          </div>

          {/* Objectives List */}
          <div>
            <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <span>🎯</span>
              <span>Active Chapter Objectives</span>
            </h4>
            <div className="space-y-2">
              {chapter.objectives.map((obj) => {
                const complete = obj.isComplete();
                const curVal = obj.currentValue ? obj.currentValue() : null;

                return (
                  <div
                    key={obj.id}
                    className={`p-3 rounded-lg border flex items-center justify-between text-xs transition ${
                      complete
                        ? 'bg-[#152416] border-green-600/70 text-green-200'
                        : 'bg-[#221810] border-[#4a3522] text-amber-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-base font-bold ${complete ? 'text-green-400' : 'text-gray-500'}`}>
                        {complete ? '✓' : '○'}
                      </span>
                      <div>
                        <div className={`font-medium ${complete ? 'line-through opacity-80' : ''}`}>
                          {obj.description}
                        </div>
                        {curVal !== null && (
                          <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                            Progress: <strong className={complete ? 'text-green-300' : 'text-yellow-300'}>{curVal}</strong> / {obj.targetValue}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      {complete ? (
                        <span className="px-2 py-0.5 bg-green-950 border border-green-600 text-green-300 text-[10px] rounded uppercase font-bold">
                          Fulfilled
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-950 border border-amber-700 text-amber-300 text-[10px] rounded uppercase font-bold">
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* First Mate Strategic Advice */}
          <div className="bg-[#1c140d] border border-[#523b24] p-3.5 rounded-lg flex items-start gap-3">
            <span className="text-2xl">🧭</span>
            <div>
              <div className="text-xs font-bold text-yellow-300 uppercase tracking-wide">
                First Mate’s Log & Clue
              </div>
              <p className="text-xs text-gray-300 leading-relaxed mt-1 italic">
                “{chapter.hint}”
              </p>
            </div>
          </div>

          {/* Result Alert Toast */}
          {resultMessage && (
            <div className="bg-[#1a2d1a] border border-green-500 p-4 rounded-lg text-xs text-green-200 whitespace-pre-line font-mono shadow-lg">
              {resultMessage}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#241a12] border-t border-[#63482a] p-4 flex justify-between items-center">
          <div className="text-xs text-gray-400">
            {allComplete ? (
              <span className="text-green-400 font-bold">★ All objectives fulfilled! Ready to advance story.</span>
            ) : (
              <span>Complete all objectives to claim chapter rewards and unlock the next saga.</span>
            )}
          </div>
          <div className="flex gap-2">
            {allComplete && (
              <button
                onClick={handleClaim}
                className="px-5 py-2 bg-gradient-to-r from-yellow-700 to-amber-600 hover:from-yellow-600 hover:to-amber-500 text-white font-bold text-xs uppercase rounded-lg border border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.5)] cursor-pointer transition animate-pulse"
              >
                🏆 Claim Rewards & Advance Chapter
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#3a281a] hover:bg-[#4d3623] border border-[#78542f] text-yellow-200 font-bold text-xs uppercase rounded-lg cursor-pointer"
            >
              Back to Helm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
