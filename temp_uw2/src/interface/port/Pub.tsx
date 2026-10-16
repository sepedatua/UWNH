import React, { ReactNode, useState } from 'react';
import useBuilding from './hooks/useBuilding';
import {
  CharacterMessageBoxType,
  VendorMessageBoxType,
} from '../quest/getMessageBoxes';
import BuildingMenu from '../common/BuildingMenu';
import BuildingWrapper from './BuildingWrapper';
import { getFirstMateId, getGold, isLisbon } from '../../state/selectors';
import { getCrewNeeded, getPlayerFleet } from '../../state/selectorsFleet';
import { CREW_COST, recruitCrew } from '../../state/actionsPort';
import state from '../../state/state';
import {
  dismissCrew,
  treatPatrons,
  playDiceGame,
  getTotalDismissibleCrew,
  getTotalCurrentCrew,
  DiceGameResult,
} from '../../state/actionsPub';
import WaitressModal from './WaitressModal';

const pubOptions = [
  'Recruit Crew',
  'Dismiss Crew',
  'Treat',
  'Gamble',
  'Waitress',
] as const;
type PubOptions = (typeof pubOptions)[number];

export default function Pub() {
  const { selectOption, next, back, reset, state: buildingState } =
    useBuilding<PubOptions>();

  const { option, step } = buildingState;

  // Sub-action states
  const [dismissAmount, setDismissAmount] = useState<number>(5);
  const [selectedWager, setSelectedWager] = useState<number>(50);
  const [diceResult, setDiceResult] = useState<DiceGameResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  let vendorMessage: VendorMessageBoxType = {
    body: 'Hey sailor, you’ll like our wine! What can we get for you and your crew?',
  };

  // Carlotta greets in Lisbon if no specific vendor message
  if (isLisbon() && !statusMessage) {
    vendorMessage = null;
  }

  if (statusMessage) {
    vendorMessage = {
      body: statusMessage,
      acknowledge: () => setStatusMessage(null),
    };
  }

  let characterMessage: CharacterMessageBoxType = null;

  const menu: ReactNode = (
    <BuildingMenu
      options={pubOptions.map((s) => ({
        label: s,
        value: s,
        disabled: !getPlayerFleet().length,
      }))}
      onSelect={(s) => {
        setStatusMessage(null);
        setDiceResult(null);
        selectOption(s);
      }}
      onCancel={back}
      hidden={option !== null || step === -1}
    />
  );

  let children: ReactNode = null;

  // 1. RECRUIT CREW
  if (option === 'Recruit Crew') {
    vendorMessage = null;

    const gold = getGold();
    const crewNeeded = getCrewNeeded();

    if (step === 0) {
      if (!crewNeeded) {
        characterMessage = {
          body: 'We have enough men to man our ships, Captain.',
          characterId: getFirstMateId(),
          acknowledge: back,
        };
      } else if (gold < CREW_COST) {
        characterMessage = {
          body: 'We don’t have enough gold to hire hands.',
          characterId: getFirstMateId(),
          acknowledge: back,
        };
      } else {
        characterMessage = {
          body: 'Shall we recruit some men for our crew?',
          characterId: getFirstMateId(),
          confirm: {
            yes: next,
            no: back,
          },
        };
      }
    }

    if (step === 1) {
      characterMessage = {
        body: 'Hey! Do any of you tough sailors want to join our crew?',
        characterId: '1',
        acknowledge: next,
      };
    }

    if (step === 2) {
      let count = 0;

      if (crewNeeded * CREW_COST > gold) {
        count = Math.floor(gold / CREW_COST);
      } else {
        count = crewNeeded;
      }

      characterMessage = {
        body: `We’ve gathered ${count} brave sailors willing to sign on with us.`,
        characterId: getFirstMateId(),
        acknowledge: () => {
          recruitCrew(count);
          back(3);
        },
      };
    }
  }

  // 2. DISMISS CREW
  if (option === 'Dismiss Crew') {
    const dismissible = getTotalDismissibleCrew();
    const currentCrew = getTotalCurrentCrew();

    if (dismissible <= 0) {
      vendorMessage = {
        body: 'You cannot dismiss any crew right now; your fleet is at minimum safe staffing levels!',
        acknowledge: back,
      };
    } else {
      vendorMessage = null;
      children = (
        <div className="absolute top-[180px] left-[520px] w-[460px] bg-[#1c1814] border-2 border-[#8c6f4b] p-5 text-[#e6d5b8] font-mono shadow-2xl z-30 rounded">
          <div className="flex justify-between items-center border-b border-[#8c6f4b] pb-2 mb-3">
            <span className="font-bold text-yellow-300 text-sm">⚓ Dismiss Fleet Crew</span>
            <button
              onClick={reset}
              className="px-2 py-0.5 bg-red-950 border border-red-700 text-red-200 text-xs rounded hover:bg-red-900 cursor-pointer"
            >
              ✕ Cancel
            </button>
          </div>

          <p className="text-xs text-gray-300 mb-3">
            Dismissing surplus sailors cuts your fleet&apos;s daily water and food consumption,
            freeing up cargo space for valuable commodities.
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs bg-[#2b2219] p-3 rounded mb-4 border border-[#523e28]">
            <div>Total Crew: <span className="font-bold text-yellow-300">{currentCrew}</span></div>
            <div>Eligible for Dismissal: <span className="font-bold text-yellow-300">{dismissible}</span></div>
          </div>

          <label className="text-xs block mb-1 text-yellow-200">Sailors to Dismiss:</label>
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setDismissAmount(Math.max(1, dismissAmount - 5))}
              className="px-2 py-1 bg-[#3d2e1e] border border-[#8c6f4b] text-xs rounded hover:bg-[#523e28]"
            >
              -5
            </button>
            <input
              type="number"
              min="1"
              max={dismissible}
              value={dismissAmount}
              onChange={(e) =>
                setDismissAmount(Math.max(1, Math.min(dismissible, Number(e.target.value) || 1)))
              }
              className="w-20 bg-black border border-[#8c6f4b] text-center text-yellow-300 font-bold py-1 text-sm rounded"
            />
            <button
              onClick={() => setDismissAmount(Math.min(dismissible, dismissAmount + 5))}
              className="px-2 py-1 bg-[#3d2e1e] border border-[#8c6f4b] text-xs rounded hover:bg-[#523e28]"
            >
              +5
            </button>
            <button
              onClick={() => setDismissAmount(dismissible)}
              className="px-2 py-1 bg-yellow-950 border border-yellow-700 text-yellow-300 text-xs font-bold rounded hover:bg-yellow-900"
            >
              MAX
            </button>
          </div>

          <div className="text-right border-t border-[#8c6f4b] pt-3">
            <button
              onClick={() => {
                const res = dismissCrew(dismissAmount);
                setStatusMessage(res.message);
                reset();
              }}
              className="px-4 py-1.5 rounded font-bold text-xs uppercase cursor-pointer bg-red-900 border border-red-500 text-red-200 hover:bg-red-800"
            >
              Confirm Dismissal
            </button>
          </div>
        </div>
      );
    }
  }

  // 3. TREAT
  if (option === 'Treat') {
    vendorMessage = {
      body: 'Will you buy a round of rum for the whole tavern for 20 gold pieces? The crew’s spirits will soar!',
      confirm: {
        yes: () => {
          const res = treatPatrons();
          if (res.success) {
            setStatusMessage(`${res.message} An old salted navigator whispers: ${res.rumor}`);
          } else {
            setStatusMessage(res.message);
          }
          reset();
        },
        no: reset,
      },
    };
  }

  // 4. GAMBLE (SAILOR DICE MINIGAME)
  if (option === 'Gamble') {
    vendorMessage = null;
    const diceIcons = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

    children = (
      <div className="absolute top-[160px] left-[500px] w-[500px] bg-[#1c1814] border-2 border-[#8c6f4b] p-5 text-[#e6d5b8] font-mono shadow-2xl z-30 rounded">
        <div className="flex justify-between items-center border-b border-[#8c6f4b] pb-2 mb-3">
          <span className="font-bold text-yellow-300 text-sm">🎲 Sailor’s Dice (High-Low)</span>
          <button
            onClick={reset}
            className="px-2 py-0.5 bg-red-950 border border-red-700 text-red-200 text-xs rounded hover:bg-red-900 cursor-pointer"
          >
            ✕ Leave Table
          </button>
        </div>

        <p className="text-xs text-gray-300 mb-3">
          Wager your gold against the local tavern gambler. Roll two six-sided dice — highest total
          takes the pot!
        </p>

        {/* Wager Selection */}
        <div className="flex justify-between items-center bg-[#2b2219] p-3 rounded mb-3 border border-[#523e28] text-xs">
          <span>Your Gold: <strong className="text-yellow-300">{state.gold} G</strong></span>
          <div className="flex gap-1.5">
            {[10, 50, 100, 500].map((w) => (
              <button
                key={w}
                onClick={() => setSelectedWager(w)}
                className={`px-2.5 py-1 rounded text-xs font-bold border ${
                  selectedWager === w
                    ? 'bg-yellow-700 border-yellow-300 text-white'
                    : 'bg-[#3d2e1e] border-[#8c6f4b] text-yellow-200 hover:bg-[#523e28]'
                }`}
              >
                {w} G
              </button>
            ))}
          </div>
        </div>

        {/* Dice Arena */}
        {diceResult ? (
          <div className="bg-[#241a12] p-4 rounded border border-[#6b4f2c] mb-3 text-center">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="p-2 bg-[#1b1510] rounded border border-[#443220]">
                <div className="text-[10px] text-gray-400 uppercase">Your Roll</div>
                <div className="text-3xl tracking-widest my-1 text-yellow-300">
                  {diceIcons[diceResult.playerDice[0] - 1]} {diceIcons[diceResult.playerDice[1] - 1]}
                </div>
                <div className="text-sm font-bold text-yellow-200">Total: {diceResult.playerTotal}</div>
              </div>
              <div className="p-2 bg-[#1b1510] rounded border border-[#443220]">
                <div className="text-[10px] text-gray-400 uppercase">Gambler&apos;s Roll</div>
                <div className="text-3xl tracking-widest my-1 text-red-300">
                  {diceIcons[diceResult.gamblerDice[0] - 1]} {diceIcons[diceResult.gamblerDice[1] - 1]}
                </div>
                <div className="text-sm font-bold text-red-200">Total: {diceResult.gamblerTotal}</div>
              </div>
            </div>

            <div
              className={`text-sm font-bold py-1.5 rounded uppercase tracking-wider ${
                diceResult.outcome === 'win'
                  ? 'bg-green-950 text-green-300 border border-green-600'
                  : diceResult.outcome === 'lose'
                  ? 'bg-red-950 text-red-300 border border-red-600'
                  : 'bg-amber-950 text-yellow-300 border border-yellow-600'
              }`}
            >
              {diceResult.outcome === 'win'
                ? `🎉 Victory! You won +${diceResult.payout} Gold!`
                : diceResult.outcome === 'lose'
                ? `💀 Defeat! Lost -${Math.abs(diceResult.payout)} Gold!`
                : '🤝 Even match! Bets returned.'}
            </div>
          </div>
        ) : (
          <div className="bg-[#241a12] p-6 rounded border border-dashed border-[#523e28] text-center text-xs text-gray-400 mb-3">
            Place your bet and roll the bones!
          </div>
        )}

        <div className="text-center">
          <button
            onClick={() => {
              if (state.gold < selectedWager) {
                setStatusMessage('You do not have enough gold for that wager!');
                return;
              }
              const result = playDiceGame(selectedWager);
              setDiceResult(result);
            }}
            disabled={state.gold < selectedWager}
            className={`px-6 py-2 rounded font-bold text-xs uppercase cursor-pointer border ${
              state.gold >= selectedWager
                ? 'bg-yellow-800 border-yellow-500 text-yellow-100 hover:bg-yellow-700'
                : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'
            }`}
          >
            🎲 Roll The Dice ({selectedWager} Gold)
          </button>
        </div>
      </div>
    );
  }

  // 5. WAITRESS
  if (option === 'Waitress') {
    vendorMessage = null;
    children = (
      <WaitressModal
        portId={state.portId || '1'}
        onClose={reset}
      />
    );
  }

  return (
    <BuildingWrapper
      buildingId="2"
      vendorMessageBox={vendorMessage}
      characterMessageBox={characterMessage}
      menu={menu}
    >
      {children}
    </BuildingWrapper>
  );
}
