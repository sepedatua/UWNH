import React, { ReactNode, useState } from 'react';

import BuildingMenu from '../../common/BuildingMenu';
import {
  buyUsedShip,
  getAvailableSailorId,
  SELL_SHIP_MODIFIER,
  sellShipNumber,
} from '../../../state/actionsPort';
import ShipyardShipBox from './ShipyardShipBox';
import { shipData } from '../../../data/shipData';
import {
  getPlayerFleet,
  getPlayerFleetShip,
} from '../../../state/selectorsFleet';
import BuildingWrapper from '../BuildingWrapper';
import useBuilding from '../hooks/useBuilding';
import { VendorMessageBoxType } from '../../quest/getMessageBoxes';
import ShipyardShipInputName from './ShipyardShipInputName';
import { canAfford, getUsedShips } from '../../../state/selectors';
import state from '../../../state/state';
import {
  getFleetDamageStatus,
  repairFleet,
  remodelShip,
  investInShipyard,
  getPortIndustryValue,
} from '../../../state/actionsShipyard';
import { getPortData } from '../../../game/port/portUtils';

const shipyardOptions = [
  'Used Ship',
  'Repair',
  'Remodel',
  'Sell',
  'Invest',
] as const;
type ShipyardOptions = (typeof shipyardOptions)[number];

export default function Shipyard() {
  const { selectOption, back, next, reset, state: buildingState } =
    useBuilding<ShipyardOptions>();

  const [usedShipId, setUsedShipId] = useState<string>();
  const [selectedShipNumberToSell, setSelectedShipNumberToSell] = useState<number>();

  // Remodel state
  const [remodelShipIndex, setRemodelShipIndex] = useState<number | null>(null);
  const [newCrewQuarters, setNewCrewQuarters] = useState<number>(20);
  const [newGuns, setNewGuns] = useState<number>(10);

  // Invest state
  const [investAmount, setInvestAmount] = useState<number>(500);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const { option, step } = buildingState;
  const portId = state.portId || '1';
  const port = getPortData(portId);
  const industryValue = getPortIndustryValue(portId);

  let vendorMessage: VendorMessageBoxType = {
    body: 'What brings you to our shipyard, Captain? We build, repair, and refit the finest vessels on the sea.',
  };

  if (statusMessage) {
    vendorMessage = {
      body: statusMessage,
      acknowledge: () => setStatusMessage(null),
    };
  }

  const menu = (
    <BuildingMenu
      options={shipyardOptions.map((s) => ({
        label: s,
        value: s,
      }))}
      onSelect={(s) => {
        setStatusMessage(null);
        selectOption(s);
      }}
      onCancel={back}
      hidden={option !== null}
    />
  );

  let menu2: ReactNode;
  let children: ReactNode;

  // 1. USED SHIP
  if (option === 'Used Ship') {
    const usedShips = getUsedShips();

    menu2 = (
      <BuildingMenu
        title="Ship Model"
        options={Object.entries(usedShips).map(([id, sId]) => ({
          label: shipData[sId].name,
          value: id,
        }))}
        onSelect={(sId) => {
          setUsedShipId(sId);
          next();
        }}
        onCancel={back}
        level2
        hidden={step !== 0}
      />
    );

    if (usedShipId) {
      children = <ShipyardShipBox shipId={usedShips[usedShipId]} />;

      if (step === 1) {
        vendorMessage = {
          body: shipData[usedShips[usedShipId]].description,
          acknowledge: next,
        };
      }

      if (step === 2) {
        vendorMessage = {
          body: `I’d sell this ship for ${
            shipData[usedShips[usedShipId]].basePrice
          } gold pieces. What do ye say?`,
          confirm: {
            yes: next,
            no: () => {
              setUsedShipId(undefined);
              back(2);
            },
          },
        };
      }

      if (step === 3) {
        if (!canAfford(shipData[usedShips[usedShipId]].basePrice)) {
          vendorMessage = {
            body: 'I’m afraid you don’t have enough gold.',
            acknowledge: () => {
              setUsedShipId(undefined);
              back(3);
            },
          };
        } else if (!getAvailableSailorId()) {
          vendorMessage = {
            body: 'You don’t have an officer available to captain this ship.',
            acknowledge: () => {
              setUsedShipId(undefined);
              back(3);
            },
          };
        } else {
          vendorMessage = {
            body: 'All right, she’s yers! What shall we christen yer vessel?',
          };

          children = (
            <ShipyardShipInputName
              onSubmit={(usedShipName) => {
                buyUsedShip(usedShipId, usedShipName);
                setUsedShipId(undefined);
                back(3);
              }}
              onCancel={() => {
                setUsedShipId(undefined);
                back(3);
              }}
            />
          );
        }
      }
    }
  }

  // 2. REPAIR
  if (option === 'Repair') {
    const damageStatus = getFleetDamageStatus();

    if (damageStatus.totalRepairCost === 0) {
      vendorMessage = {
        body: 'Every vessel in yer fleet is in pristine condition, Captain! Not a single plank needs caulking.',
        acknowledge: back,
      };
    } else {
      vendorMessage = {
        body: `We surveyed yer fleet: ${damageStatus.damagedShips.length} ship(s) damaged (${damageStatus.totalDamage} hull points). Full repairs will cost ${damageStatus.totalRepairCost} gold pieces. Shall we begin work?`,
        confirm: {
          yes: () => {
            const res = repairFleet();
            setStatusMessage(res.message);
            reset();
          },
          no: back,
        },
      };

      children = (
        <div className="absolute top-[260px] left-[520px] w-[460px] bg-[#1c1814] border-2 border-[#8c6f4b] p-4 text-[#e6d5b8] font-mono shadow-2xl z-30 rounded">
          <div className="text-sm font-bold text-yellow-300 border-b border-[#8c6f4b] pb-2 mb-2">
            🔨 Damaged Ships in Fleet
          </div>
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto text-xs">
            {damageStatus.damagedShips.map((d) => (
              <div
                key={d.shipIndex}
                className="flex justify-between items-center bg-[#2b2219] p-2 rounded border border-[#523e28]"
              >
                <div>
                  <span className="font-bold text-yellow-200">{d.name}</span>
                  <div className="text-[10px] text-gray-400">
                    Durability: {d.currentDurability} / {d.maxDurability}
                  </div>
                </div>
                <div className="text-right font-bold text-red-300 text-xs">
                  {d.cost} Gold
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  }

  // 3. REMODEL
  if (option === 'Remodel') {
    const fleet = getPlayerFleet();

    if (remodelShipIndex === null) {
      menu2 = (
        <BuildingMenu
          title="Select Vessel"
          options={fleet.map((ship, idx) => ({
            label: ship.name,
            value: idx,
          }))}
          onSelect={(idx) => {
            setRemodelShipIndex(idx);
            const target = fleet[idx];
            const templ = shipData[target.id];
            setNewCrewQuarters(target.maxCrew || templ.usedCrew || templ.minimumCrew);
            setNewGuns(target.maxGuns || templ.usedGuns || 0);
          }}
          onCancel={back}
          level2
        />
      );

      vendorMessage = {
        body: 'Which ship in yer fleet would ye like to refit and remodel?',
      };
    } else {
      const ship = fleet[remodelShipIndex];
      const template = shipData[ship.id];
      const { capacity, minimumCrew, maximumCrew, maximumGuns } = template;
      const resultingCargoHold = capacity - newCrewQuarters - newGuns;

      children = (
        <div className="absolute top-[160px] left-[500px] w-[520px] bg-[#1c1814] border-2 border-[#8c6f4b] p-5 text-[#e6d5b8] font-mono shadow-2xl z-30 rounded">
          <div className="flex justify-between items-center border-b border-[#8c6f4b] pb-2 mb-3">
            <span className="font-bold text-yellow-300 text-sm">
              🛠️ Remodel Vessel: {ship.name} ({template.name})
            </span>
            <button
              onClick={() => setRemodelShipIndex(null)}
              className="px-2 py-0.5 bg-red-950 border border-red-700 text-red-200 text-xs rounded hover:bg-red-900 cursor-pointer"
            >
              ✕ Back
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
            <div className="bg-[#2b2219] p-2 rounded border border-[#523e28]">
              <div className="text-gray-400 text-[10px]">TOTAL CAPACITY</div>
              <div className="font-bold text-yellow-300 text-sm">{capacity}</div>
            </div>
            <div className="bg-[#2b2219] p-2 rounded border border-[#523e28]">
              <div className="text-gray-400 text-[10px]">ALLOCATED</div>
              <div className="font-bold text-blue-300 text-sm">{newCrewQuarters + newGuns}</div>
            </div>
            <div className="bg-[#2b2219] p-2 rounded border border-[#523e28]">
              <div className="text-gray-400 text-[10px]">CARGO HOLD</div>
              <div className={`font-bold text-sm ${resultingCargoHold < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {resultingCargoHold}
              </div>
            </div>
          </div>

          {/* Crew Quarters Control */}
          <div className="mb-3 bg-[#261f17] p-3 rounded border border-[#3d2e1e]">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-yellow-200">Crew Quarters (Sailors):</span>
              <span className="font-bold text-yellow-300">
                {newCrewQuarters} (Min {minimumCrew} - Max {maximumCrew})
              </span>
            </div>
            <input
              type="range"
              min={minimumCrew}
              max={maximumCrew}
              value={newCrewQuarters}
              onChange={(e) => setNewCrewQuarters(Number(e.target.value))}
              className="w-full accent-yellow-500 cursor-pointer"
            />
          </div>

          {/* Gun Ports Control */}
          <div className="mb-4 bg-[#261f17] p-3 rounded border border-[#3d2e1e]">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-yellow-200">Gun Ports (Cannons):</span>
              <span className="font-bold text-yellow-300">
                {newGuns} (Max {maximumGuns})
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={maximumGuns}
              value={newGuns}
              onChange={(e) => setNewGuns(Number(e.target.value))}
              className="w-full accent-red-500 cursor-pointer"
            />
          </div>

          <div className="flex justify-between items-center border-t border-[#8c6f4b] pt-3 text-xs">
            <div>
              Fee: <span className="font-bold text-yellow-300">200 Gold</span>
            </div>
            <button
              onClick={() => {
                const res = remodelShip(remodelShipIndex, newCrewQuarters, newGuns);
                setStatusMessage(res.message);
                setRemodelShipIndex(null);
                reset();
              }}
              disabled={resultingCargoHold < 0 || state.gold < 200}
              className={`px-4 py-1.5 rounded font-bold uppercase cursor-pointer border ${
                resultingCargoHold >= 0 && state.gold >= 200
                  ? 'bg-yellow-800 border-yellow-500 text-yellow-100 hover:bg-yellow-700'
                  : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'
              }`}
            >
              Confirm Remodel
            </button>
          </div>
        </div>
      );
    }
  }

  // 4. SELL
  if (option === 'Sell') {
    if (getPlayerFleet().length === 1) {
      if (step === 0) {
        vendorMessage = {
          body: 'Ye only have one ship! We cannot purchase yer flagship, Captain.',
          acknowledge: back,
        };
      }
    } else {
      menu2 = (
        <BuildingMenu
          title="Your Ships"
          options={getPlayerFleet().map((ship, i) => ({
            label: ship.name,
            value: i,
          }))}
          onSelect={(value) => {
            setSelectedShipNumberToSell(value);
            next();
          }}
          onCancel={back}
          level2
          hidden={step !== 0}
        />
      );

      if (step === 0) {
        vendorMessage = {
          body: 'Which vessel are ye willing to part with?',
        };
      }

      if (step === 1 && selectedShipNumberToSell !== undefined) {
        const ship = getPlayerFleetShip(selectedShipNumberToSell);

        vendorMessage = {
          body: `For this ship, I’ll give ye ${
            shipData[ship.id].basePrice * SELL_SHIP_MODIFIER
          } gold pieces. Deal?`,
          confirm: {
            yes: () => {
              sellShipNumber(selectedShipNumberToSell);
              setSelectedShipNumberToSell(undefined);
              back();
            },
            no: () => {
              setSelectedShipNumberToSell(undefined);
              back();
            },
          },
        };

        children = (
          <ShipyardShipBox shipId={ship.id} customShipName={ship.name} />
        );
      }
    }
  }

  // 5. INVEST
  if (option === 'Invest') {
    children = (
      <div className="absolute top-[160px] left-[520px] w-[480px] bg-[#1c1814] border-2 border-[#8c6f4b] p-5 text-[#e6d5b8] font-mono shadow-2xl z-30 rounded">
        <div className="flex justify-between items-center border-b border-[#8c6f4b] pb-2 mb-3">
          <span className="font-bold text-yellow-300 text-sm">⚓ Shipyard Industrial Investment</span>
          <button
            onClick={reset}
            className="px-2 py-0.5 bg-red-950 border border-red-700 text-red-200 text-xs rounded hover:bg-red-900 cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        <div className="space-y-3 text-xs mb-4">
          <p className="text-gray-300">
            Investing in {port.name}&apos;s shipyard expands local foundries and drydocks, unlocking
            formidable ship hulls like Galleons, Frigates, and War Galleons!
          </p>

          <div className="bg-[#2b2219] p-3 rounded border border-[#523e28] grid grid-cols-2 gap-2">
            <div>Current Industry: <span className="font-bold text-yellow-300">{industryValue} / 1000</span></div>
            <div>Your Gold: <span className="font-bold text-yellow-300">{state.gold} Gold</span></div>
            <div>Your Nation: <span className="font-bold text-blue-300">{state.nationality}</span></div>
            <div>Mode: <span className="font-bold text-yellow-300">{state.gameMode.toUpperCase()}</span></div>
          </div>

          <label className="block text-yellow-200">Select Investment Amount:</label>
          <div className="grid grid-cols-4 gap-2">
            {[500, 1000, 2500, 5000].map((amt) => (
              <button
                key={amt}
                onClick={() => setInvestAmount(amt)}
                className={`py-1.5 rounded text-xs font-bold border ${
                  investAmount === amt
                    ? 'bg-yellow-700 border-yellow-300 text-white'
                    : 'bg-[#3d2e1e] border-[#8c6f4b] text-yellow-200 hover:bg-[#523e28]'
                }`}
              >
                {amt} G
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-[#8c6f4b] pt-3">
          <div className="text-xs">
            Effect: <span className="text-green-400 font-bold">+{Math.max(1, Math.floor(investAmount / 100))} Industry</span>
          </div>
          <button
            onClick={async () => {
              const res = await investInShipyard(investAmount);
              setStatusMessage(res.message);
              reset();
            }}
            disabled={state.gold < investAmount}
            className={`px-4 py-1.5 rounded font-bold text-xs uppercase cursor-pointer border ${
              state.gold >= investAmount
                ? 'bg-yellow-800 border-yellow-500 text-yellow-100 hover:bg-yellow-700'
                : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'
            }`}
          >
            Invest Capital
          </button>
        </div>
      </div>
    );
  }

  return (
    <BuildingWrapper
      buildingId="3"
      vendorMessageBox={vendorMessage}
      menu={menu}
      menu2={menu2}
    >
      {children}
    </BuildingWrapper>
  );
}
