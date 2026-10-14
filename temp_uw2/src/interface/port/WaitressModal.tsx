import { useState } from 'react';
import state from '../../state/state';
import { getWaitressForPort } from '../../data/waitressData';
import {
  getWaitressFavor,
  tellStoryToWaitress,
  giveGoldTipToWaitress,
  giveItemGiftToWaitress,
  askWaitressForMarketIntel,
  askWaitressForPirateIntel,
  WaitressActionResult,
} from '../../state/actionsWaitress';
import { itemData, itemCategories } from '../../data/itemData';

interface Props {
  portId: string;
  onClose: () => void;
}

export default function WaitressModal({ portId, onClose }: Props) {
  const waitress = getWaitressForPort(portId);
  const [favor, setFavor] = useState<number>(getWaitressFavor(portId));
  const [dialogue, setDialogue] = useState<string>(waitress.greeting);
  const [intelBox, setIntelBox] = useState<{
    type: 'market' | 'pirate';
    title: string;
    body: string;
  } | null>(null);
  const [showItemPicker, setShowItemPicker] = useState<boolean>(false);

  const getAffectionTitle = (val: number) => {
    if (val >= 90) return { title: 'Eternal Beloved ❤️‍🔥', color: 'text-rose-400' };
    if (val >= 70) return { title: 'Infatuated Admirer 💖', color: 'text-pink-400' };
    if (val >= 40) return { title: 'Fond Confidante 💕', color: 'text-amber-300' };
    if (val >= 20) return { title: 'Warm Companion 🌸', color: 'text-yellow-200' };
    return { title: 'Curious Stranger 🤍', color: 'text-gray-300' };
  };

  const handleResult = (res: WaitressActionResult) => {
    setDialogue(res.message);
    setFavor(res.currentFavor);
    if (res.intel) {
      setIntelBox(res.intel);
    } else {
      setIntelBox(null);
    }
  };

  const currentAffection = getAffectionTitle(favor);
  const playerItems = state.items || [];

  return (
    <div className="absolute top-[120px] left-[420px] w-[580px] bg-[#1a140f] border-2 border-[#947449] p-5 text-[#f1e3cb] font-serif shadow-2xl z-30 rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#6d5130] pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌹</span>
          <div>
            <h2 className="text-base font-bold text-yellow-300 tracking-wide font-sans">
              {waitress.name} <span className="text-xs font-normal text-amber-200">({waitress.portName} Tavern)</span>
            </h2>
            <p className="text-[11px] text-gray-400 italic">{waitress.personality}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-2.5 py-1 bg-red-950 border border-red-700 text-red-200 text-xs rounded hover:bg-red-900 cursor-pointer transition font-sans"
        >
          ✕ Farewell
        </button>
      </div>

      {/* Favor / Romance Meter */}
      <div className="bg-[#241a12] p-3 rounded border border-[#5a4025] mb-4">
        <div className="flex justify-between items-center text-xs mb-1.5 font-sans">
          <span className="flex items-center gap-1.5 font-semibold text-amber-100">
            <span>Affection Level:</span>
            <span className={currentAffection.color}>{currentAffection.title}</span>
          </span>
          <span className="font-bold text-yellow-400">{favor} / 100 Favor</span>
        </div>
        <div className="w-full bg-[#120d09] h-3.5 rounded-full overflow-hidden border border-[#523b24]">
          <div
            className="h-full bg-gradient-to-r from-yellow-700 via-pink-600 to-rose-500 transition-all duration-500 ease-out flex items-center justify-end pr-1 text-[9px] font-bold text-white"
            style={{ width: `${Math.max(4, favor)}%` }}
          >
            {favor >= 15 ? '❤️' : ''}
          </div>
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-sans">
          <span>0 (Stranger)</span>
          <span className={favor >= 40 ? 'text-amber-300 font-bold' : ''}>40 (Trade Secrets 🔓)</span>
          <span className={favor >= 80 ? 'text-rose-400 font-bold' : ''}>80 (Pirate Intel 🔓)</span>
          <span>100 (Max)</span>
        </div>
      </div>

      {/* Main Dialogue Box */}
      <div className="bg-[#2a1e14] border border-[#785934] p-3.5 rounded-md min-h-[90px] mb-4 text-xs leading-relaxed text-[#f7ecd9] italic shadow-inner">
        {dialogue}
      </div>

      {/* Unlocked Intel Parchment */}
      {intelBox && (
        <div className={`p-3 rounded border mb-4 text-xs font-mono shadow-md ${
          intelBox.type === 'market'
            ? 'bg-[#1b281b] border-green-700 text-green-200'
            : 'bg-[#291818] border-red-700 text-red-200'
        }`}>
          <div className="flex items-center gap-1.5 font-bold mb-1 uppercase tracking-wider text-sm border-b border-current pb-1">
            <span>{intelBox.type === 'market' ? '📜 Arbitrage Secret' : '☠️ Pirate Hunt Intelligence'}</span>
            <span>- {intelBox.title}</span>
          </div>
          <div className="whitespace-pre-line text-xs leading-snug">
            {intelBox.body}
          </div>
        </div>
      )}

      {/* Item Picker Drawer */}
      {showItemPicker && (
        <div className="bg-[#1c130c] border border-[#856138] p-3 rounded mb-4 max-h-[140px] overflow-y-auto">
          <div className="flex justify-between items-center text-xs font-bold text-yellow-300 mb-2 border-b border-[#5a4025] pb-1 font-sans">
            <span>Select a Gift from Your Cargo:</span>
            <span className="text-[11px] text-gray-400 font-normal">
              Favorite: <strong className="text-pink-300">{waitress.favoriteGiftCategory}</strong>
            </span>
          </div>
          {playerItems.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-2">You possess no items or treasures to gift!</p>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {playerItems.map((id, index) => {
                const item = itemData[id];
                if (!item) return null;
                const catName = itemCategories[item.categoryId] || 'Item';
                const isFav = catName === waitress.favoriteGiftCategory;

                return (
                  <button
                    key={`${id}-${index}`}
                    onClick={() => {
                      const res = giveItemGiftToWaitress(portId, id);
                      handleResult(res);
                      setShowItemPicker(false);
                    }}
                    className={`text-left p-1.5 rounded border text-[11px] flex justify-between items-center transition ${
                      isFav
                        ? 'bg-pink-950/60 border-pink-500 hover:bg-pink-900 text-pink-200'
                        : 'bg-[#2d1f14] border-[#6b4c2b] hover:bg-[#3d2a1b] text-amber-100'
                    }`}
                  >
                    <span className="truncate">{item.name}</span>
                    <span className="text-[10px] opacity-75">{isFav ? '★ Loved' : catName}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 font-sans text-xs">
        {/* Storytelling */}
        <button
          onClick={() => {
            setShowItemPicker(false);
            const res = tellStoryToWaitress(portId);
            handleResult(res);
          }}
          className="p-2.5 rounded font-bold bg-[#382618] border border-[#8a6538] text-yellow-200 hover:bg-[#4d3421] hover:text-white transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>📖 Tell Sea Stories</span>
        </button>

        {/* Gift Options */}
        <div className="flex gap-1.5">
          <button
            onClick={() => {
              setShowItemPicker(false);
              const res = giveGoldTipToWaitress(portId, 500);
              handleResult(res);
            }}
            className="flex-1 p-2.5 rounded font-bold bg-amber-950 border border-amber-700 text-amber-200 hover:bg-amber-900 hover:text-white transition cursor-pointer flex items-center justify-center gap-1 text-[11px]"
          >
            <span>🪙 Tip 500 G</span>
          </button>
          <button
            onClick={() => setShowItemPicker(!showItemPicker)}
            className="flex-1 p-2.5 rounded font-bold bg-pink-950 border border-pink-700 text-pink-200 hover:bg-pink-900 hover:text-white transition cursor-pointer flex items-center justify-center gap-1 text-[11px]"
          >
            <span>🎁 Gift Item</span>
          </button>
        </div>

        {/* Trade Secret (40+) */}
        <button
          onClick={() => {
            setShowItemPicker(false);
            const res = askWaitressForMarketIntel(portId);
            handleResult(res);
          }}
          className={`p-2.5 rounded font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
            favor >= 40
              ? 'bg-emerald-950 border-emerald-600 text-emerald-200 hover:bg-emerald-900'
              : 'bg-[#221c17] border-[#443527] text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>{favor >= 40 ? '🔓' : '🔒'} Trade Secret (40+)</span>
        </button>

        {/* Pirate Fleet Intel (80+) */}
        <button
          onClick={() => {
            setShowItemPicker(false);
            const res = askWaitressForPirateIntel(portId);
            handleResult(res);
          }}
          className={`p-2.5 rounded font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
            favor >= 80
              ? 'bg-rose-950 border-rose-600 text-rose-200 hover:bg-rose-900'
              : 'bg-[#221c17] border-[#443527] text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>{favor >= 80 ? '🔓' : '🔒'} Pirate Intel (80+)</span>
        </button>
      </div>
    </div>
  );
}
