import { useEffect } from 'react';
import { Discovery } from '../../data/discoveryData';
import logger from '../../logger';

interface Props {
  discovery: Discovery;
  onClose: () => void;
}

export default function DiscoveryModal({ discovery, onClose }: Props) {
  useEffect(() => {
    logger.info('DiscoveryModal', `Opened Discovery Modal: ${discovery.name} (${discovery.id})`, {
      rank: discovery.rank,
      category: discovery.category,
      fameReward: discovery.fameReward,
      goldValue: discovery.goldValue,
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        logger.info('DiscoveryModal', `Key [${e.key}] pressed in Discovery Modal for ${discovery.name}`);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      logger.info('DiscoveryModal', `Closed Discovery Modal: ${discovery.name}`);
    };
  }, [discovery, onClose]);

  const getRankBadge = (rank: string) => {
    switch (rank) {
      case '☆':
        return 'bg-purple-950 border-purple-500 text-purple-200';
      case 'A':
        return 'bg-amber-950 border-amber-500 text-yellow-200';
      case 'B':
        return 'bg-blue-950 border-blue-500 text-blue-200';
      default:
        return 'bg-gray-800 border-gray-600 text-gray-300';
    }
  };

  return (
    <div
      className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 pointer-events-auto font-sans select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          logger.info('DiscoveryModal', `Backdrop clicked, closing Discovery Modal for ${discovery.name}`);
          onClose();
        }
      }}
    >
      <div className="max-w-lg w-full bg-[#1c140d] border-2 border-[#b89558] rounded-2xl shadow-[0_0_50px_rgba(234,179,8,0.3)] overflow-hidden text-[#ede0cb] text-center p-6">
        {/* Animated Icon */}
        <div className="text-6xl mb-3 animate-bounce">{discovery.icon}</div>

        <div className="flex justify-center items-center gap-2 mb-2">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${getRankBadge(discovery.rank)}`}>
            Rank {discovery.rank} {discovery.category.replace('_', ' ')}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-950 border border-green-600 text-green-300">
            Adventure Fame +{discovery.fameReward}
          </span>
        </div>

        <h2 className="text-2xl font-bold text-yellow-300 font-serif mb-2 tracking-wide">
          {discovery.name}
        </h2>

        <div className="bg-[#281b11] border border-[#6b4c27] p-4 rounded-xl text-xs leading-relaxed italic text-[#f7ead6] mb-4 shadow-inner text-left">
          <p className="mb-2 font-serif">{discovery.lore}</p>
          <div className="border-t border-[#4a341a] pt-2 text-[11px] text-amber-200/90 font-sans">
            <strong>Historical Significance:</strong> {discovery.historicalSignificance}
          </div>
        </div>

        <div className="bg-[#140e09] border border-[#44301c] p-3 rounded-lg text-xs font-mono text-gray-300 mb-5 flex justify-between items-center">
          <span>Collector Cash Bounty:</span>
          <strong className="text-yellow-400 font-bold">~{discovery.goldValue} Gold (at Guild)</strong>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-yellow-700 to-amber-600 hover:from-yellow-600 hover:to-amber-500 text-white font-bold rounded-xl transition-all shadow-lg cursor-pointer uppercase text-xs tracking-wider"
        >
          Record in Royal Logbook
        </button>
      </div>
    </div>
  );
}
