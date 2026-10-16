import { ReactNode, useState } from 'react';
import useBuilding from './hooks/useBuilding';
import { VendorMessageBoxType } from '../quest/getMessageBoxes';
import BuildingMenu from '../common/BuildingMenu';
import BuildingWrapper from './BuildingWrapper';
import state from '../../state/state';
import { getGold, getMates } from '../../state/selectors';
import { updateGeneral } from '../../state/actionsPort';
import { waitresses } from '../../data/waitressData';

const fortuneOptions = ['Life', 'Career', 'Love', 'Mates'] as const;
type FortuneOptions = (typeof fortuneOptions)[number];

const CONSULTATION_FEE = 100;

export default function FortuneTeller() {
  const { selectOption, back, reset, state: buildingState } =
    useBuilding<FortuneOptions>();

  const { option } = buildingState;
  const [readingResult, setReadingResult] = useState<string | null>(null);

  const gold = getGold();
  const mates = getMates();
  const portId = state.portId || '1';
  const localWaitress = Object.values(waitresses).find((w) => w.portId === portId);

  let vendorMessage: VendorMessageBoxType = {
    body: 'The fortune teller gazes into her mystical crystal ball: “Welcome, voyager of destiny. For 100 gold coins, the constellations shall unveil your hidden path. What would you divine?”',
  };

  const deductFee = (): boolean => {
    if (gold < CONSULTATION_FEE) {
      setReadingResult(
        'The fortune teller shakes her head gently: “The spirits do not speak for free. An offering of 100 gold coins is required to part the veil of time. Return when your purse has filled, traveler.”',
      );
      return false;
    }
    state.gold -= CONSULTATION_FEE;
    updateGeneral();
    return true;
  };

  const handleSelectOption = (chosen: FortuneOptions) => {
    if (chosen === 'Mates') {
      selectOption(chosen);
      return;
    }

    if (!deductFee()) {
      selectOption(chosen);
      return;
    }

    if (chosen === 'Life') {
      const luck = state.luck ?? 80;
      let text = '';
      if (luck >= 90) {
        text =
          'The crystal ball erupts in celestial golden radiance! ✨\n\n“The sea gods themselves favor your helm, Captain! Miraculous fortune guides your every tack. Disasters shall part before you, and divine relics await your compass.” (Luck: Blessed / Miraculous)';
      } else if (luck >= 70) {
        text =
          'A warm, soothing emerald light glows brightly inside the sphere. 🌟\n\n“The winds blow fair and true! Fortune smiles upon your fleet. Trust your sailor instincts when navigating dangerous shoals.” (Luck: High / Favorable)';
      } else if (luck >= 45) {
        text =
          'A calm azure mist drifts gently across the polished glass. 🌊\n\n“Your destiny is steady and balanced. Neither great blessings nor dark curses shadow your wake. Vigilance and sharp navigation will keep you safe.” (Luck: Normal / Average)';
      } else if (luck >= 25) {
        text =
          'Ominous gray vapors swirl heavily through the crystal ball. ⚠️\n\n“Dark clouds gather on the horizon of your voyages! Perils and sudden gales stalk your fleet. Seek the grace of the Church or Mosque to lift this omen.” (Luck: Low / Troubled)';
      } else {
        text =
          'The crystal turns pitch black, cold as an ocean grave! 💀\n\n“A dreadful curse shadows your footsteps! Turn back from perilous waters lest the abyss swallow your fleet! Make generous donations at the Church to atone and restore your fortune!” (Luck: Disastrous / Cursed)';
      }
      setReadingResult(text);
      selectOption(chosen);
    } else if (chosen === 'Career') {
      const fame = state.fame || { adventure: 0, trade: 0, piracy: 0 };
      const totalFame = fame.adventure + fame.trade + fame.piracy;
      const rank = state.nobilityRank || 0;

      const rankTitles = [
        'Commoner / Sea Dog',
        'Page',
        'Squire',
        'Knight',
        'Baronet',
        'Baron',
        'Viscount',
        'Count',
        'Marquis',
        'Duke',
      ];
      const rankThresholds = [
        500, 1500, 3000, 6000, 10000, 15000, 22000, 30000, 40000,
      ];

      const currentTitle = rankTitles[rank] || 'Captain';
      const nextThreshold = rank < 9 ? rankThresholds[rank] : null;

      let guidance = '';
      if (nextThreshold && totalFame >= nextThreshold) {
        guidance = `👑 The Crown card illuminates the center! Your fame (${totalFame.toLocaleString()} pts) has reached the royal court. Seek audience with your Monarch at the Palace to receive a promotion in Nobility!`;
      } else if (rank >= 9) {
        guidance = `⭐ The Emperor card shines supreme! You hold the highest title of Duke. Your maritime legends are sung in ports across the globe.`;
      } else if (fame.adventure >= fame.trade && fame.adventure >= fame.piracy) {
        guidance = `🧭 The Star points to uncharted horizons. Chart unknown coastlines and submit discoveries to collectors to elevate your standing to the next rank (Need: ${nextThreshold?.toLocaleString()} total fame).`;
      } else if (fame.trade >= fame.piracy) {
        guidance = `💰 The Coin card glows bright. Expand your cargo holds, corner spice monopolies, and invest heavily in port economies to earn the Crown’s favor.`;
      } else {
        guidance = `⚔️ The Blade card glints with steel. Victorious naval battles, corsair skirmishes, and privateering prizes will carve your legend across the seas.`;
      }

      setReadingResult(
        `The tarot cards reveal your path:\n\n“Current Rank: ${currentTitle}. Fame standings — Adventure: ${fame.adventure.toLocaleString()}, Trade: ${fame.trade.toLocaleString()}, Piracy: ${fame.piracy.toLocaleString()}.\n\n${guidance}”`,
      );
      selectOption(chosen);
    } else if (chosen === 'Love') {
      if (localWaitress) {
        const favor = state.waitressFavor?.[portId] || 0;
        let note = '';
        if (favor >= 80) {
          note = `“In the local tavern, ${localWaitress.name} holds profound love for you! She is ready to whisper the rarest commodity trade secrets and roaming pirate coordinates into your ear.”`;
        } else if (favor >= 40) {
          note = `“The Lovers card reveals tender warmth! ${localWaitress.name} admires your bold voyages. Present her with gifts of ${localWaitress.favoriteGiftCategory} to completely win her heart.”`;
        } else {
          note = `“${localWaitress.name} finds you an intriguing traveler, but her heart remains reserved. Visit her at the pub, treat the tavern patrons, and offer ${localWaitress.favoriteGiftCategory} gifts.”`;
        }
        setReadingResult(
          `The cards of romance turn over:\n\n“Local Maiden: ${localWaitress.name} of ${localWaitress.portName}.\nFavor: ${favor}/100.\n${note}”`,
        );
      } else {
        // Find highest favor waitress
        const allFavors = Object.entries(state.waitressFavor || {});
        if (allFavors.length > 0) {
          allFavors.sort((a, b) => b[1] - a[1]);
          const [topPortId, topVal] = allFavors[0];
          const topWaitress = Object.values(waitresses).find(
            (w) => w.portId === topPortId,
          );
          if (topWaitress) {
            setReadingResult(
              `The crystal reveals longing thoughts across distant seas:\n\n“In ${topWaitress.portName}, ${topWaitress.name} gazes out to sea longing for your flagship’s return (Favor: ${topVal}/100). Keep true to your vows, Captain!”`,
            );
          } else {
            setReadingResult(
              `The crystal reveals no maiden in this port. Visit taverns in famous hubs like Lisbon (Carlotta), Seville (Monica), or Amsterdam (Nicole) to seek companionship.`,
            );
          }
        } else {
          setReadingResult(
            `The crystal reflects solitary waters: “No tavern maiden has yet captured your heart. Visit the pubs in bustling capitals like Lisbon, Seville, or Istanbul to share tales with the waitresses.”`,
          );
        }
      }
      selectOption(chosen);
    }
  };

  if (readingResult) {
    vendorMessage = {
      body: readingResult,
      acknowledge: () => {
        setReadingResult(null);
        reset();
      },
    };
  }

  const menu = (
    <BuildingMenu
      options={fortuneOptions.map((s) => ({
        label: s,
        value: s,
      }))}
      onSelect={(s) => handleSelectOption(s)}
      onCancel={back}
      hidden={option !== null}
    />
  );

  let children: ReactNode = null;

  if (option === 'Mates' && !readingResult) {
    vendorMessage = {
      body: 'The fortune teller holds a silver tarot card: “Whose destiny and loyalty do you wish to gaze upon? Select a member of your fleet.”',
      acknowledge: undefined,
    };

    children = (
      <div className="absolute top-[160px] left-[660px] bg-[#2a1a0f]/95 border-2 border-[#c5a059] p-4 rounded text-[#e6d5ac] shadow-2xl z-20 w-[240px]">
        <div className="text-sm font-bold border-b border-[#c5a059] pb-1 mb-2 text-[#f3e5ab] text-center">
          Fleet Officers
        </div>
        <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
          {mates.map((mate) => (
            <button
              key={mate.sailorId}
              type="button"
              className="w-full text-left px-2 py-1 text-xs rounded hover:bg-[#c5a059] hover:text-[#1a0f05] transition-colors border border-transparent hover:border-[#ffe8a8] flex justify-between items-center"
              onClick={() => {
                if (!deductFee()) {
                  return;
                }
                const morale = state.morale || 80;
                const stats = mate.stats;
                const bestStat = Object.entries(stats).reduce((a, b) =>
                  b[1] > a[1] ? b : a,
                );

                const loyaltyRating = Math.min(
                  100,
                  Math.round(morale * 0.7 + stats.leadership * 0.3),
                );
                let loyaltyText = '';
                if (loyaltyRating >= 90) {
                  loyaltyText = 'Unshakable devotion. Prepared to die for you.';
                } else if (loyaltyRating >= 70) {
                  loyaltyText = 'Faithful and dependable in stormy waters.';
                } else if (loyaltyRating >= 50) {
                  loyaltyText = 'Content with his pay and current standing.';
                } else {
                  loyaltyText =
                    'Restless and wavering. Risk of desertion if gold runs dry.';
                }

                setReadingResult(
                  `The crystal reflects the true spirit of ${mate.name}:\n\n“Role: ${mate.role ?? 'Officer'}. Greatest Virtue: ${bestStat[0].toUpperCase()} (${bestStat[1]} pts).\nLoyalty: ${loyaltyRating}% — ${loyaltyText}\n\nUnder your leadership, ${mate.name}’s star shines steadfast.”`,
                );
              }}
            >
              <span className="truncate">{mate.name}</span>
              <span className="text-[10px] text-[#c5a059] ml-1">
                {mate.role ?? 'Mate'}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="mt-3 w-full py-1 text-xs bg-[#5a3a20] hover:bg-[#7a4e2a] text-[#f3e5ab] rounded border border-[#8a5d35] text-center"
          onClick={() => {
            reset();
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <BuildingWrapper
      buildingId="12"
      vendorMessageBox={vendorMessage}
      menu={menu}
    >
      {children}
    </BuildingWrapper>
  );
}
