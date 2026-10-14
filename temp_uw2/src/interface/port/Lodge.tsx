import React, { ReactNode, useState } from 'react';
import useBuilding from './hooks/useBuilding';
import { VendorMessageBoxType } from '../quest/getMessageBoxes';
import BuildingMenu from '../common/BuildingMenu';
import BuildingWrapper from './BuildingWrapper';
import { checkIn } from '../../state/actionsPort';
import { restUntilNight, getLodgeGossip } from '../../state/actionsLodge';
import state from '../../state/state';
import { getPortData, getRegionOrIfSupplyPort } from '../../game/port/portUtils';
import { getPortEconomyValue, getPortMarketRate } from '../../state/selectorsMarket';
import { getPortIndustryValue } from '../../state/actionsShipyard';

const lodgeOptions = [
  'Check In (Morning)',
  'Rest Until Night',
  'Port Info',
  'Gossip',
] as const;
type LodgeOptions = (typeof lodgeOptions)[number];

export default function Lodge() {
  const { selectOption, back, reset, state: buildingState } =
    useBuilding<LodgeOptions>();

  const { option } = buildingState;
  const portId = state.portId || '1';
  const port = getPortData(portId);
  const economy = getPortEconomyValue(portId);
  const industry = getPortIndustryValue(portId);
  const marketRate = getPortMarketRate(portId);

  const [gossipText, setGossipText] = useState<string | null>(null);

  let vendorMessage: VendorMessageBoxType = {
    body: 'Welcome to the Harbor Lodge. You must be weary from the sea. Please make yourself at home!',
  };

  if (gossipText) {
    vendorMessage = {
      body: gossipText,
      acknowledge: () => {
        setGossipText(null);
        reset();
      },
    };
  }

  const menu = (
    <BuildingMenu
      options={lodgeOptions.map((s) => ({
        label: s,
        value: s,
      }))}
      onSelect={(s) => {
        setGossipText(null);
        if (s === 'Check In (Morning)') {
          checkIn();
        } else if (s === 'Rest Until Night') {
          restUntilNight();
        } else if (s === 'Gossip') {
          setGossipText(`The innkeeper leans in: “${getLodgeGossip()}”`);
        } else {
          selectOption(s);
        }
      }}
      onCancel={back}
      hidden={option !== null}
    />
  );

  let children: ReactNode = null;

  // PORT INFO MODAL
  if (option === 'Port Info') {
    children = (
      <div className="absolute top-[160px] left-[500px] w-[500px] bg-[#1c1814] border-2 border-[#8c6f4b] p-5 text-[#e6d5b8] font-mono shadow-2xl z-30 rounded">
        <div className="flex justify-between items-center border-b border-[#8c6f4b] pb-2 mb-3">
          <span className="font-bold text-yellow-300 text-sm">
            📜 {port.name} Port Ledger
          </span>
          <button
            onClick={reset}
            className="px-2 py-0.5 bg-red-950 border border-red-700 text-red-200 text-xs rounded hover:bg-red-900 cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        <div className="space-y-3 text-xs mb-4">
          <div className="bg-[#2b2219] p-3 rounded border border-[#523e28] grid grid-cols-2 gap-2">
            <div>Region: <span className="font-bold text-yellow-300">{getRegionOrIfSupplyPort(portId)}</span></div>
            <div>Controlling Nation: <span className="font-bold text-blue-300">{state.nationality}</span></div>
            <div>World Coordinates: <span className="font-bold text-yellow-300">[{port.position.x}, {port.position.y}]</span></div>
            <div>Port Class: <span className="font-bold text-yellow-300">{port.isSupplyPort ? 'Supply Outpost' : 'Trading Hub'}</span></div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-[#261f17] p-2 rounded border border-[#3d2e1e]">
              <div className="text-gray-400 text-[10px]">ECONOMY SCALE</div>
              <div className="font-bold text-yellow-300 text-sm">{economy} / 1000</div>
            </div>
            <div className="bg-[#261f17] p-2 rounded border border-[#3d2e1e]">
              <div className="text-gray-400 text-[10px]">INDUSTRY SCALE</div>
              <div className="font-bold text-yellow-300 text-sm">{industry} / 1000</div>
            </div>
            <div className="bg-[#261f17] p-2 rounded border border-[#3d2e1e]">
              <div className="text-gray-400 text-[10px]">PRICE INDEX</div>
              <div className="font-bold text-emerald-400 text-sm">{marketRate}%</div>
            </div>
          </div>

          <p className="text-gray-400 italic text-[11px] bg-[#211a14] p-2.5 rounded border border-[#3a2c1d]">
            Invest capital at the Market to boost Commercial Economy and unlock greater specialty goods stock.
            Invest at the Shipyard to expand Industrial Drydocks and unlock advanced ship construction!
          </p>
        </div>

        <div className="text-right border-t border-[#8c6f4b] pt-3">
          <button
            onClick={reset}
            className="px-4 py-1.5 bg-[#3d2e1e] hover:bg-[#523e28] text-yellow-200 border border-[#8c6f4b] rounded text-xs font-bold"
          >
            ← Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <BuildingWrapper
      buildingId="5"
      vendorMessageBox={vendorMessage}
      menu={menu}
    >
      {children}
    </BuildingWrapper>
  );
}
