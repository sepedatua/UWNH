import React from 'react';

export interface PrologueData {
  protagonistName: string;
  protagonistId: string;
  nationality: string;
  homePortName: string;
  shipName: string;
  shipType: string;
  firstMateName: string;
  title: string;
  story: string;
  objective: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: PrologueData | null;
}

export default function ScenarioPrologueModal({
  isOpen,
  onClose,
  data,
}: Props) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 font-mono select-none">
      <div className="w-[780px] bg-[#1a1714] border-4 border-[#c49a45] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col text-[#f4eedb] overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#2d2218] via-[#4a3622] to-[#2d2218] border-b-2 border-[#c49a45] p-5 text-center relative">
          <div className="text-xs uppercase tracking-widest text-[#ffd700] mb-1 font-bold">
            Anno Domini 1522 • {data.homePortName}, {data.nationality}
          </div>
          <h1 className="text-2xl font-bold tracking-wider text-white drop-shadow">
            {data.title}
          </h1>
          <div className="text-xs text-[#d1b88e] mt-1">
            The Chronicle of {data.protagonistName}
          </div>
        </div>

        {/* Main Body */}
        <div className="p-6 space-y-6 bg-[#211c17] text-sm leading-relaxed">
          {/* Backstory Parchment Box */}
          <div className="bg-[#171310] border-2 border-[#8c6f4b] p-5 rounded-lg shadow-inner relative">
            <span className="text-3xl absolute -top-4 -left-2">📜</span>
            <p className="italic text-[#e8d7be] text-sm leading-loose pt-1">
              "{data.story}"
            </p>
          </div>

          {/* Starting Fleet Manifest */}
          <div className="grid grid-cols-3 gap-3 text-xs bg-[#1a1511] border border-[#6b5235] p-3 rounded">
            <div>
              <span className="text-gray-400 block">Flagship:</span>
              <span className="font-bold text-yellow-300">
                {data.shipName} ({data.shipType})
              </span>
            </div>
            <div>
              <span className="text-gray-400 block">First Mate:</span>
              <span className="font-bold text-yellow-300">
                {data.firstMateName}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block">Home Anchorage:</span>
              <span className="font-bold text-yellow-300">
                Port of {data.homePortName}
              </span>
            </div>
          </div>

          {/* Initial Mission Objective */}
          <div className="bg-[#2b1f14] border-l-4 border-yellow-500 p-3 rounded text-xs space-y-1">
            <div className="font-bold text-yellow-400 uppercase tracking-wider">
              ⚓ Maiden Voyage Objective:
            </div>
            <div className="text-gray-200">{data.objective}</div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="bg-[#171310] border-t-2 border-[#c49a45] p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-[#c49a45] to-[#e6b85c] hover:from-[#d4aa55] hover:to-[#f0c86e] text-black font-extrabold text-sm rounded shadow-lg tracking-wider cursor-pointer transform active:scale-95 transition-all"
          >
            ⚓ Set Sail on Maiden Voyage
          </button>
        </div>
      </div>
    </div>
  );
}
