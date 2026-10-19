import { useState, useEffect } from 'react';
import type { NpcFleetInstance } from '../../game/world/npcFleetManager';
import { triggerCombat } from '../../state/actionsWorld';
import soundManager from '../sound/soundManager';
import logger from '../../logger';

interface Props {
  fleet: NpcFleetInstance;
  onClose: () => void;
}

export default function AtSeaEncounterModal({ fleet, onClose }: Props) {
  const [gossipRevealed, setGossipRevealed] = useState(false);

  useEffect(() => {
    logger.info('AtSeaEncounter', `Opened Encounter with ${fleet.name} (${fleet.nation})`, {
      captain: fleet.captainName,
      ships: fleet.ships.length,
      hostile: fleet.hostile,
      archetype: fleet.archetype,
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        logger.info('AtSeaEncounter', `[Escape] pressed in Encounter modal for ${fleet.name}`);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      logger.info('AtSeaEncounter', `Closed Encounter modal with ${fleet.name}`);
    };
  }, [fleet, onClose]);

  const getNationFlag = (nation: string) => {
    switch (nation) {
      case 'Portugal': return '🇵🇹';
      case 'Spain': return '🇪🇸';
      case 'England': return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
      case 'Holland': return '🇳🇱';
      case 'Ottoman': return '🇹🇷';
      case 'Genoa': return '🇮🇹';
      case 'Ming': return '🐉';
      case 'Japan': return '🇯🇵';
      case 'Pirate': return '🏴‍☠️';
      default: return '⚓';
    }
  };

  const handleAttack = () => {
    logger.warn('AtSeaEncounter', `Capitain attacked fleet: ${fleet.name} commanded by ${fleet.captainName}`);
    soundManager.playSfx('shipBell');
    onClose();
    triggerCombat(fleet.name, fleet.captainName, fleet.id);
  };

  const flagship = fleet.ships[0];
  const cargoSummary = flagship?.cargo
    ? flagship.cargo
        .filter((c) => c.type !== 'water' && c.type !== 'food')
        .map((c) => `${c.quantity} ${c.type}`)
        .join(', ') || 'Provisions only'
    : 'None';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn pointer-events-auto select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          logger.info('AtSeaEncounter', `Backdrop clicked, disengaging from ${fleet.name}`);
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-lg bg-[#1a140e] border-2 border-[#b89758] rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.9)] text-[#e8dcc4] overflow-hidden font-serif">
        {/* Decorative Header Bar */}
        <div className="bg-gradient-to-r from-[#2d2013] via-[#4a3520] to-[#2d2013] border-b border-[#b89758]/50 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{fleet.hostile ? '🏴‍☠️' : '⛵'}</span>
            <div>
              <h2 className="text-base font-bold text-[#f5ecd5] tracking-wide">
                ENCOUNTER AT SEA
              </h2>
              <div className="text-[11px] text-[#b89758] flex items-center gap-1.5 font-sans">
                <span>{getNationFlag(fleet.nation)}</span>
                <span className="font-semibold">{fleet.nation}</span>
                <span>•</span>
                <span className="capitalize">{fleet.archetype} Fleet</span>
                {fleet.bountyGold && (
                  <span className="text-amber-400 font-bold ml-1">
                    💰 {fleet.bountyGold.toLocaleString()} Bounty
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              logger.info('AtSeaEncounter', `Close button clicked for ${fleet.name}`);
              onClose();
            }}
            className="text-neutral-400 hover:text-white text-lg p-1 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Captain & Flagship Header Card */}
          <div className="bg-[#120d09]/80 border border-[#b89758]/30 rounded-lg p-3 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#352516] border border-[#b89758] flex items-center justify-center text-2xl shadow-inner">
              {fleet.hostile ? '☠️' : '👨‍✈️'}
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-[#fce8b3]">
                {fleet.captainName}
              </div>
              <div className="text-xs text-[#a89880]">
                Commanding: <span className="text-[#e0d0b0] font-semibold">{fleet.name}</span>
              </div>
              <div className="text-[11px] text-[#8c7b64] mt-0.5 font-sans">
                {fleet.ships.length} {fleet.ships.length === 1 ? 'Vessel' : 'Vessels'} • {flagship?.name || 'Flagship'} ({flagship?.crew || 30} Crew)
              </div>
            </div>
          </div>

          {/* Captain Speech / Lore Bubble */}
          <div className="relative bg-[#261b12] border-l-4 border-[#b89758] rounded-r-lg p-4 shadow-md">
            <div className="text-xs italic text-[#e8dcc4] leading-relaxed">
              "{fleet.dialogRumor}"
            </div>
            {gossipRevealed && (
              <div className="mt-2.5 pt-2 border-t border-[#b89758]/20 text-[11px] text-amber-200/90 font-sans">
                💡 <strong>Captain's Trade Secret:</strong> <em>"Our cargo manifest lists {cargoSummary}. In foreign ports, such goods will double in gold value!"</em>
              </div>
            )}
          </div>

          {/* Cargo Manifest Preview */}
          <div className="bg-[#140e0a]/60 border border-[#b89758]/20 rounded-lg p-2.5 text-[11px] text-[#a89880] font-sans flex items-center justify-between">
            <span>📦 <strong>Cargo Observed:</strong></span>
            <span className="text-[#e0d0b0] font-medium truncate max-w-[260px]">{cargoSummary}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
            {!gossipRevealed && !fleet.hostile && (
              <button
                type="button"
                onClick={() => setGossipRevealed(true)}
                className="px-3.5 py-2 bg-[#2d2013] hover:bg-[#3d2b1a] border border-[#b89758]/60 text-xs font-semibold text-[#f5ecd5] rounded-lg cursor-pointer transition-all hover:scale-102 flex items-center gap-1.5"
              >
                <span>💡</span>
                <span>Inquire Trade Gossip</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAttack}
              className="px-4 py-2 bg-red-950/90 hover:bg-red-900 border border-red-500/80 text-xs font-bold text-red-200 rounded-lg cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.25)] transition-all hover:scale-102 flex items-center gap-1.5"
            >
              <span>⚔️</span>
              <span>{fleet.hostile ? 'Fight for Survival!' : 'Attack & Privateer'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#3a2818] hover:bg-[#4a3420] border border-[#b89758] text-xs font-bold text-[#fce8b3] rounded-lg cursor-pointer transition-all hover:scale-102"
            >
              {fleet.hostile ? 'Attempt to Disengage' : 'Fare Thee Well'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
