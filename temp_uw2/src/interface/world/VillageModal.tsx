import { useState, useMemo, useCallback } from 'react';
import { Village } from '../../data/villageData';
import { Discovery, getDiscoveryById } from '../../data/discoveryData';
import {
  getVillageFriendship,
  isVillagePlundered,
  isDiscoveryFound,
  getAvailableLuxuryGifts,
  conductVillageSearch,
  conductVillageFeast,
  conductVillagePlunder,
  conductVillageWait,
  VillageActionResult,
} from '../../game/discovery/villageEngine';
import DiscoveryModal from './DiscoveryModal';
import { getPlayerFleet } from '../../state/selectorsFleet';
import state from '../../state/state';

interface Props {
  village: Village;
  onClose: () => void;
}

export default function VillageModal({ village, onClose }: Props) {
  const [friendship, setFriendship] = useState<number>(() => getVillageFriendship(village.id));
  const [isPlundered, setIsPlundered] = useState<boolean>(() => isVillagePlundered(village.id));
  const [activeDiscovery, setActiveDiscovery] = useState<Discovery | null>(null);
  const [actionLog, setActionLog] = useState<string>(
    `You have landed your party near ${village.name}. The native inhabitants observe your fleet with cautious curiosity.`
  );
  const [showGiftSelector, setShowGiftSelector] = useState<boolean>(false);
  const [showPlunderConfirm, setShowPlunderConfirm] = useState<boolean>(false);

  const discovery = useMemo(() => getDiscoveryById(village.discoveryId), [village.discoveryId]);
  const isFound = useMemo(() => (discovery ? isDiscoveryFound(discovery.id) : false), [discovery]);

  const fleet = getPlayerFleet();
  const flagship = fleet[0];
  const foodCount = flagship?.cargo.find((c) => c.type === 'food')?.quantity || 0;
  const waterCount = flagship?.cargo.find((c) => c.type === 'water')?.quantity || 0;
  const luxuryGifts = useMemo(() => getAvailableLuxuryGifts(), [friendship, isPlundered]);

  // Handle Search
  const handleSearch = useCallback(() => {
    const res = conductVillageSearch(village);
    setActionLog(res.message);
    if (res.success && res.discovery) {
      setActiveDiscovery(res.discovery);
    }
  }, [village]);

  // Handle Feast
  const handleFeast = useCallback(
    (giftType: 'food' | 'water' | 'cargo', cargoType?: string) => {
      const res = conductVillageFeast(village, giftType, cargoType);
      setActionLog(res.message);
      if (res.newFriendship !== undefined) {
        setFriendship(res.newFriendship);
      }
      setShowGiftSelector(false);
    },
    [village]
  );

  // Handle Plunder
  const handlePlunder = useCallback(() => {
    const res = conductVillagePlunder(village);
    setActionLog(res.message);
    setFriendship(0);
    setIsPlundered(true);
    setShowPlunderConfirm(false);
  }, [village]);

  // Handle Wait
  const handleWait = useCallback(() => {
    const res = conductVillageWait(village);
    setActionLog(res.message);
  }, [village]);

  // Theme styling
  const getThemeBackground = () => {
    switch (village.theme) {
      case 'african_savannah':
        return 'from-amber-950/95 via-yellow-950/90 to-neutral-950/95 border-amber-600/60';
      case 'amazon_rainforest':
        return 'from-emerald-950/95 via-teal-950/90 to-neutral-950/95 border-emerald-600/60';
      case 'native_american':
        return 'from-orange-950/95 via-stone-900/90 to-neutral-950/95 border-orange-600/60';
      case 'oceanic_polynesian':
        return 'from-cyan-950/95 via-blue-950/90 to-neutral-950/95 border-cyan-600/60';
      case 'asian_bamboo':
        return 'from-lime-950/95 via-stone-900/90 to-neutral-950/95 border-lime-600/60';
      case 'arctic_tundra':
        return 'from-sky-950/95 via-slate-900/90 to-neutral-950/95 border-sky-400/60';
      default:
        return 'from-stone-950/95 via-neutral-900/90 to-black/95 border-stone-500/60';
    }
  };

  const getFriendshipBadge = () => {
    if (friendship >= 100) return { label: 'Revered Brotherhood', color: 'bg-cyan-500/30 text-cyan-300 border-cyan-400' };
    if (friendship >= 75) return { label: 'Friendly & Welcoming', color: 'bg-emerald-500/30 text-emerald-300 border-emerald-400' };
    if (friendship >= 50) return { label: 'Neutral & Peaceful', color: 'bg-yellow-500/30 text-yellow-300 border-yellow-400' };
    if (friendship >= 25) return { label: 'Wary & Distrustful', color: 'bg-orange-500/30 text-orange-300 border-orange-400' };
    return { label: 'Hostile / Enraged', color: 'bg-red-500/30 text-red-300 border-red-500' };
  };

  const badge = getFriendshipBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans">
      <div
        className={`relative w-full max-w-3xl rounded-2xl border-2 p-6 shadow-2xl bg-gradient-to-b ${getThemeBackground()} text-neutral-100 flex flex-col gap-5`}
      >
        {/* Header Bar */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-4">
            <span className="text-4xl">⛺</span>
            <div>
              <div className="text-xs uppercase tracking-widest text-amber-400 font-bold">
                {village.region} • Indigenous Settlement
              </div>
              <h2 className="text-2xl font-black tracking-wide text-white drop-shadow">
                {village.name}
              </h2>
              <div className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                <span>Coordinates: {village.coordinatesNav}</span>
                <span>•</span>
                <span>Flagship Crew: {flagship?.crew || 0}</span>
                <span>•</span>
                <span>Gold: {state.gold.toLocaleString()} G</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 text-neutral-300 text-sm font-semibold transition-colors"
          >
            ✕ Leave Village
          </button>
        </div>

        {/* Plunder Alert if previously raided */}
        {isPlundered && (
          <div className="px-4 py-2 rounded-lg bg-red-950/80 border border-red-500/60 text-red-200 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>
              <strong>RAIDED SETTLEMENT:</strong> Your landing party plundered this village. The survivors glare from the shadows with bitter hatred.
            </span>
          </div>
        )}

        {/* Hospitality Meter & Discovery Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hospitality Meter */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Hospitality / Friendship
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${badge.color}`}>
                {badge.label}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-neutral-900 rounded-full h-4 overflow-hidden border border-white/10 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  friendship >= 100
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-300'
                    : friendship >= 50
                    ? 'bg-gradient-to-r from-amber-500 to-emerald-400'
                    : 'bg-gradient-to-r from-red-600 to-orange-500'
                }`}
                style={{ width: `${friendship}%` }}
              />
            </div>
            <div className="text-[11px] text-neutral-400 mt-2 flex justify-between">
              <span>Hostile (0%)</span>
              <span className="font-mono font-bold text-white">{friendship}%</span>
              <span>Revered (100%)</span>
            </div>
          </div>

          {/* Local Discovery Status */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">
              Regional Discovery Status
            </div>
            {discovery ? (
              <div className="flex items-center gap-3">
                <span className="text-3xl">{discovery.icon}</span>
                <div>
                  <div className="text-sm font-bold text-white">
                    {isFound ? discovery.name : 'Unknown Ancient Landmark'}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {isFound ? (
                      <span className="text-emerald-400 font-semibold">
                        ✓ Discovered & Logged (Rank {discovery.rank})
                      </span>
                    ) : (
                      <span className="text-amber-300">
                        Undiscovered • Difficulty {discovery.difficulty || 40}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-neutral-400">No known discoveries at these coordinates.</div>
            )}
            <div className="text-[11px] text-neutral-400 mt-2">
              {friendship >= 100
                ? '★ Tribal Elders will directly guide your search party!'
                : 'Offer feasts or trade cargo to earn guidance and avoid ambushes.'}
            </div>
          </div>
        </div>

        {/* Narrative Dialogue / Event Log */}
        <div className="p-4 rounded-xl bg-black/50 border border-amber-500/20 text-neutral-200 text-sm leading-relaxed min-h-[90px] whitespace-pre-line shadow-inner">
          {actionLog}
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* 1. Search */}
          <button
            type="button"
            onClick={handleSearch}
            disabled={isFound}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-sm font-bold transition-all shadow-md ${
              isFound
                ? 'bg-neutral-800/50 border-neutral-700 text-neutral-500 cursor-not-allowed'
                : 'bg-emerald-900/80 hover:bg-emerald-800 border-emerald-500 text-emerald-100 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <span className="text-xl mb-1">🔍</span>
            <span>{isFound ? 'Already Found' : 'Search Area'}</span>
            <span className="text-[10px] text-emerald-300/80 font-normal mt-0.5">Explore terrain</span>
          </button>

          {/* 2. Feast / Entertain */}
          <button
            type="button"
            onClick={() => setShowGiftSelector((prev) => !prev)}
            className="flex flex-col items-center justify-center p-3 rounded-xl border bg-amber-900/80 hover:bg-amber-800 border-amber-500 text-amber-100 hover:scale-[1.02] active:scale-[0.98] text-sm font-bold transition-all shadow-md"
          >
            <span className="text-xl mb-1">🍖</span>
            <span>Feast & Entertain</span>
            <span className="text-[10px] text-amber-300/80 font-normal mt-0.5">Offer gifts / food</span>
          </button>

          {/* 3. Plunder */}
          <button
            type="button"
            onClick={() => setShowPlunderConfirm(true)}
            className="flex flex-col items-center justify-center p-3 rounded-xl border bg-red-950/80 hover:bg-red-900 border-red-600 text-red-200 hover:scale-[1.02] active:scale-[0.98] text-sm font-bold transition-all shadow-md"
          >
            <span className="text-xl mb-1">⚔️</span>
            <span>Plunder Village</span>
            <span className="text-[10px] text-red-300/80 font-normal mt-0.5">Raid for supplies</span>
          </button>

          {/* 4. Rest & Wait */}
          <button
            type="button"
            onClick={handleWait}
            className="flex flex-col items-center justify-center p-3 rounded-xl border bg-neutral-900/80 hover:bg-neutral-800 border-neutral-600 text-neutral-200 hover:scale-[1.02] active:scale-[0.98] text-sm font-bold transition-all shadow-md"
          >
            <span className="text-xl mb-1">⏳</span>
            <span>Rest & Wait</span>
            <span className="text-[10px] text-neutral-400 font-normal mt-0.5">Pass 1 Day</span>
          </button>
        </div>

        {/* Gift Selector Modal / Drawer */}
        {showGiftSelector && (
          <div className="p-4 rounded-xl bg-neutral-900/95 border-2 border-amber-500/80 shadow-2xl flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="text-sm font-bold text-amber-300">
                Choose Offerings for the Village Tribe:
              </span>
              <button
                type="button"
                onClick={() => setShowGiftSelector(false)}
                className="text-xs text-neutral-400 hover:text-white"
              >
                ✕ Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Food */}
              <button
                type="button"
                onClick={() => handleFeast('food')}
                disabled={foodCount < 10}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between ${
                  foodCount >= 10
                    ? 'bg-neutral-800 hover:bg-neutral-700 border-white/20'
                    : 'bg-neutral-900 border-neutral-800 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="text-xs font-bold text-white">🍖 10 Barrels Food</div>
                <div className="text-[11px] text-neutral-400 mt-1">Available: {foodCount}</div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-1">+15% ~ +25% Friendship</div>
              </button>

              {/* Water */}
              <button
                type="button"
                onClick={() => handleFeast('water')}
                disabled={waterCount < 10}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between ${
                  waterCount >= 10
                    ? 'bg-neutral-800 hover:bg-neutral-700 border-white/20'
                    : 'bg-neutral-900 border-neutral-800 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="text-xs font-bold text-white">💧 10 Casks Water</div>
                <div className="text-[11px] text-neutral-400 mt-1">Available: {waterCount}</div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-1">+12% ~ +20% Friendship</div>
              </button>

              {/* Luxury Goods */}
              {luxuryGifts.length > 0 ? (
                luxuryGifts.map((lux) => (
                  <button
                    key={lux.type}
                    type="button"
                    onClick={() => handleFeast('cargo', lux.type)}
                    className="p-3 rounded-lg border bg-amber-950/40 hover:bg-amber-900/50 border-amber-500/50 text-left flex flex-col justify-between"
                  >
                    <div className="text-xs font-bold text-amber-200">✨ 1 Crate {lux.name}</div>
                    <div className="text-[11px] text-neutral-300 mt-1">In Hold: {lux.quantity}</div>
                    <div className="text-[10px] text-cyan-300 font-bold mt-1">★ +35% ~ +50% Friendship!</div>
                  </button>
                ))
              ) : (
                <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/50 text-neutral-500 text-xs flex items-center justify-center">
                  No luxury commodities in cargo hold
                </div>
              )}
            </div>
          </div>
        )}

        {/* Plunder Confirmation Modal */}
        {showPlunderConfirm && (
          <div className="p-4 rounded-xl bg-red-950/95 border-2 border-red-500 shadow-2xl flex flex-col gap-3">
            <div className="text-sm font-bold text-red-200 flex items-center gap-2">
              <span>⚠️</span>
              <span>WARNING: Launch an armed attack on {village.name}?</span>
            </div>
            <div className="text-xs text-red-300/90 leading-relaxed">
              Raid the settlement for rations and gold coins. Defending warriors will resist fiercely, causing sailor casualties. Friendship will plunge to 0%, your officers will lose loyalty, and crew morale will drop (-15 Morale, +120 Piracy Fame).
            </div>
            <div className="flex justify-end gap-3 mt-1">
              <button
                type="button"
                onClick={() => setShowPlunderConfirm(false)}
                className="px-4 py-1.5 rounded-lg border border-white/20 text-xs font-semibold hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePlunder}
                className="px-4 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold text-xs border border-red-400 shadow"
              >
                ⚔️ Order the Attack!
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Discovery Modal if an item is unearthed */}
      {activeDiscovery && (
        <DiscoveryModal
          discovery={activeDiscovery}
          onClose={() => setActiveDiscovery(null)}
        />
      )}
    </div>
  );
}
