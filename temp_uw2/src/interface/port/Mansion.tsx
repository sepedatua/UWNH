import { ReactNode, useState } from 'react';
import useBuilding from './hooks/useBuilding';
import { VendorMessageBoxType } from '../quest/getMessageBoxes';
import BuildingMenu from '../common/BuildingMenu';
import BuildingWrapper from './BuildingWrapper';
import state from '../../state/state';
import { getCaptain, getGold } from '../../state/selectors';
import { updateGeneral } from '../../state/actionsPort';
import { getPortData } from '../../game/port/portUtils';
import { getMansionData } from '../../data/mansionData';
import {
  reportChartedMapTiles,
  reportDiscoveriesToCollector,
  signCartographyContract,
} from '../../game/discovery/discoveryEngine';

const mansionOptions = [
  'Meet Resident',
  'Learn Skill',
  'Expedition Contract',
] as const;
type MansionOptions = (typeof mansionOptions)[number];

export default function Mansion() {
  const { selectOption, back, reset, state: buildingState } =
    useBuilding<MansionOptions>();

  const { option } = buildingState;
  const [dialogText, setDialogText] = useState<string | null>(null);

  const portId = state.portId || '1';
  const port = getPortData(portId);
  const mansion = getMansionData(portId, port.name);
  const gold = getGold();
  const captain = getCaptain(0);

  let vendorMessage: VendorMessageBoxType = {
    body: `You enter the grand foyer of ${mansion.estateName}. An attendant announces your presence to ${mansion.residentName}, ${mansion.title}.`,
  };

  const handleSelectOption = (chosen: MansionOptions) => {
    setDialogText(null);

    if (chosen === 'Meet Resident') {
      const rumor = mansion.explorationRumor
        ? `\n\nExploration Rumor:\n${mansion.explorationRumor}`
        : '';
      setDialogText(`${mansion.greeting}${rumor}`);
      selectOption(chosen);
    } else if (chosen === 'Learn Skill') {
      if (!mansion.teachSkill) {
        setDialogText(
          `The resident shakes his head: “There is no master tutor currently teaching maritime sciences at our estate.”`,
        );
      } else if (captain.skills?.includes(mansion.teachSkill)) {
        setDialogText(
          `${mansion.residentName} smiles with approval: “You have already mastered the art of ${mansion.teachSkill}, Captain! Apply your knowledge wisely across the seas.”`,
        );
      } else {
        // Prepare skill tuition prompt
        selectOption(chosen);
        return;
      }
      selectOption(chosen);
    } else if (chosen === 'Expedition Contract') {
      selectOption(chosen);
    }
  };

  if (dialogText) {
    vendorMessage = {
      body: dialogText,
      acknowledge: () => {
        setDialogText(null);
        reset();
      },
    };
  }

  const menu = (
    <BuildingMenu
      options={mansionOptions.map((s) => ({
        label: s,
        value: s,
      }))}
      onSelect={(s) => handleSelectOption(s)}
      onCancel={back}
      hidden={option !== null}
    />
  );

  let children: ReactNode = null;

  // Learn Skill Prompt
  if (option === 'Learn Skill' && !dialogText && mansion.teachSkill) {
    const cost = mansion.skillCost || 3000;
    const reqs = mansion.skillReqs || 'Standard Knowledge';

    vendorMessage = {
      body: `${mansion.residentName} reviews your maritime logbook: “I can tutor you in the discipline of ${mansion.teachSkill}. Tuition fee is ${cost.toLocaleString()} gold coins. Prerequisites: ${reqs}. Would you like to commence study?”`,
      acknowledge: undefined,
    };

    children = (
      <div className="absolute top-[170px] left-[660px] bg-[#2a1a0f]/95 border-2 border-[#c5a059] p-4 rounded text-[#e6d5ac] shadow-2xl z-20 w-[240px]">
        <div className="text-sm font-bold border-b border-[#c5a059] pb-1 mb-2 text-[#f3e5ab] text-center">
          {mansion.teachSkill} Tutor
        </div>
        <div className="text-xs space-y-1.5 mb-3 text-[#d2be92]">
          <div>Tuition: <span className="text-[#ffe8a8] font-bold">{cost.toLocaleString()} G</span></div>
          <div>Requires: <span className="text-[#ffe8a8]">{reqs}</span></div>
          <div>Your Gold: <span className="text-[#ffe8a8]">{gold.toLocaleString()} G</span></div>
        </div>
        <div className="space-y-2">
          <button
            type="button"
            className="w-full py-1.5 text-xs bg-[#c5a059] hover:bg-[#ffe8a8] text-[#1a0f05] font-bold rounded shadow transition-colors"
            onClick={() => {
              if (gold < cost) {
                setDialogText(
                  `“You do not have enough coin for the academy tuition. Return when you have gathered ${cost.toLocaleString()} gold coins.”`,
                );
                return;
              }

              const qualifies = mansion.checkPrereqs
                ? mansion.checkPrereqs(captain.stats, captain.battleLevel)
                : true;

              if (!qualifies) {
                setDialogText(
                  `“Your attributes do not yet meet the rigorous demands of ${mansion.teachSkill} (${reqs}). Season your nautical experience and return when your mind is ready!”`,
                );
                return;
              }

              // Deduct gold & award skill
              state.gold -= cost;
              if (!state.mates[0].skills) {
                state.mates[0].skills = [];
              }
              if (!state.mates[0].skills.includes(mansion.teachSkill!)) {
                state.mates[0].skills.push(mansion.teachSkill!);
              }
              updateGeneral();

              setDialogText(
                `🎉 Success! ${mansion.residentName} presents your certification:\n\n“Splendid work, Captain! You have officially mastered the discipline of ${mansion.teachSkill}. Your fleet navigation shall prosper!”`,
              );
            }}
          >
            Pay & Learn Skill
          </button>
          <button
            type="button"
            className="w-full py-1 text-xs bg-[#5a3a20] hover:bg-[#7a4e2a] text-[#f3e5ab] rounded border border-[#8a5d35] text-center"
            onClick={() => reset()}
          >
            Leave
          </button>
        </div>
      </div>
    );
  }

  // Expedition Contract Submenu
  if (option === 'Expedition Contract' && !dialogText) {
    const hasCartography = state.cartographyContract;
    const unreportedCount = (state.discoveries || []).filter(
      (id) => !(state.reportedDiscoveries || []).includes(id),
    ).length;

    vendorMessage = {
      body: `${mansion.residentName} unfolds parchment charters across the mahogany desk: “Our estate sponsors daring navigators who push past the edge of the world map. What business brings you to our expedition desk?”`,
      acknowledge: undefined,
    };

    children = (
      <div className="absolute top-[150px] left-[640px] bg-[#2a1a0f]/95 border-2 border-[#c5a059] p-4 rounded text-[#e6d5ac] shadow-2xl z-20 w-[270px]">
        <div className="text-sm font-bold border-b border-[#c5a059] pb-1 mb-2 text-[#f3e5ab] text-center">
          Expedition Sponsorship
        </div>
        <div className="text-xs space-y-1 mb-3 text-[#d2be92]">
          <div>
            Cartography Charter:{' '}
            <span className={hasCartography ? 'text-emerald-400 font-bold' : 'text-amber-300'}>
              {hasCartography ? 'Active (Chartered)' : 'Unsigned'}
            </span>
          </div>
          <div>
            Unreported Discoveries:{' '}
            <span className="text-[#ffe8a8] font-bold">{unreportedCount}</span>
          </div>
        </div>

        <div className="space-y-2">
          {mansion.isCartographer && !hasCartography && (
            <button
              type="button"
              className="w-full py-1.5 text-xs bg-[#c5a059] hover:bg-[#ffe8a8] text-[#1a0f05] font-bold rounded shadow transition-colors text-left px-2"
              onClick={() => {
                const res = signCartographyContract();
                setDialogText(res.message);
              }}
            >
              📜 Sign Cartography Charter
            </button>
          )}

          {mansion.isCartographer && hasCartography && (
            <button
              type="button"
              className="w-full py-1.5 text-xs bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded shadow transition-colors text-left px-2"
              onClick={() => {
                const res = reportChartedMapTiles();
                if (res.success) {
                  setDialogText(
                    `🗺️ ${res.message}\n\nGold Earned: +${res.goldEarned.toLocaleString()} G | Adventure Fame: +${res.fameEarned.toLocaleString()} pts!`,
                  );
                } else {
                  setDialogText(res.message);
                }
              }}
            >
              🧭 Submit Coastal Charts & Logs
            </button>
          )}

          {mansion.isCollector && (
            <button
              type="button"
              className="w-full py-1.5 text-xs bg-amber-700 hover:bg-amber-600 text-white font-bold rounded shadow transition-colors text-left px-2"
              onClick={() => {
                const res = reportDiscoveriesToCollector();
                if (res.unreportedCount > 0) {
                  setDialogText(
                    `🏛️ ${mansion.residentName} is spellbound by your discoveries!\n\nSubmitted: ${res.unreportedCount} discovery reports.\nGold Reward: +${res.totalGoldEarned.toLocaleString()} G\nAdventure Fame: +${res.totalFameEarned.toLocaleString()} pts!`,
                  );
                } else {
                  setDialogText(
                    `“You currently have no new unrecorded discoveries to submit. Travel to distant shores, uncover ancient ruins or rare beasts, and bring your findings back to our estate!”`,
                  );
                }
              }}
            >
              🏺 Report Discoveries ({unreportedCount})
            </button>
          )}

          {!mansion.isCartographer && !mansion.isCollector && (
            <div className="text-xs text-stone-400 italic py-1">
              This estate does not handle public charter contracts.
            </div>
          )}

          <button
            type="button"
            className="w-full py-1 text-xs bg-[#5a3a20] hover:bg-[#7a4e2a] text-[#f3e5ab] rounded border border-[#8a5d35] text-center"
            onClick={() => reset()}
          >
            Leave
          </button>
        </div>
      </div>
    );
  }

  return (
    <BuildingWrapper
      buildingId="8"
      vendorMessageBox={vendorMessage}
      menu={menu}
    >
      {children}
    </BuildingWrapper>
  );
}
