import React, { useState } from 'react';
import useBuilding from '../hooks/useBuilding';
import { VendorMessageBoxType } from '../../quest/getMessageBoxes';
import BuildingMenu from '../../common/BuildingMenu';
import BuildingWrapper from '../BuildingWrapper';
import state from '../../../state/state';
import { getPortData } from '../../../game/port/portUtils';
import { COMMODITIES, Commodity, calculateSellPrice } from '../../../data/commodityData';
import {
  getAvailableFleetSpace,
  getTotalFleetCapacity,
  getTotalFleetCargoLoad,
  getFleetCommoditiesSummary,
  getPortAvailableCommodities,
  getPortMarketRate,
  getPortEconomyValue,
  FleetCargoItem,
} from '../../../state/selectorsMarket';
import { buyCommodity, sellCommodity, investInMarket } from '../../../state/actionsMarket';

const marketOptions = ['Buy Goods', 'Sell Goods', 'Invest', 'Market Rate'] as const;
type MarketOption = (typeof marketOptions)[number];

export default function Market() {
  const { selectOption, back, reset, state: buildingState } =
    useBuilding<MarketOption>(true);

  const { option } = buildingState;
  const portId = state.portId || '1';
  const portData = getPortData(portId);
  const currentRate = getPortMarketRate(portId);
  const economyValue = getPortEconomyValue(portId);

  // Sub-screen states
  const [selectedCommodity, setSelectedCommodity] = useState<Commodity | null>(null);
  const [selectedSellItem, setSelectedSellItem] = useState<FleetCargoItem | null>(null);
  const [tradeQuantity, setTradeQuantity] = useState<number>(1);
  const [investAmount, setInvestAmount] = useState<number>(500);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Capacity stats
  const freeSpace = getAvailableFleetSpace();
  const totalLoad = getTotalFleetCargoLoad();
  const totalCapacity = getTotalFleetCapacity();

  // Vendor dialog text
  let vendorMessage: VendorMessageBoxType = {
    body: `Welcome to ${portData.name} Market! We have finest goods of the region. How may I serve you today, Captain?`,
  };

  if (statusMessage) {
    vendorMessage = {
      body: statusMessage,
      acknowledge: () => setStatusMessage(null),
    };
  }

  // --- Handlers ---
  const handleBuyConfirm = async () => {
    if (!selectedCommodity) return;
    const available = getPortAvailableCommodities(portId);
    const itemInfo = available.find((a) => a.commodity.id === selectedCommodity.id);
    const unitPrice = itemInfo?.buyPrice || selectedCommodity.basePrice;

    const res = await buyCommodity(selectedCommodity, tradeQuantity, unitPrice);
    setStatusMessage(res.message);
    setSelectedCommodity(null);
    setTradeQuantity(1);
  };

  const handleSellConfirm = async () => {
    if (!selectedSellItem) return;
    const commMeta = COMMODITIES.find((c) => c.id === selectedSellItem.id);
    const unitSellPrice = commMeta
      ? calculateSellPrice(commMeta, portData.regionId, currentRate)
      : 50;

    const res = await sellCommodity(
      selectedSellItem.id,
      selectedSellItem.name,
      tradeQuantity,
      unitSellPrice,
    );
    setStatusMessage(res.message);
    setSelectedSellItem(null);
    setTradeQuantity(1);
  };

  const handleInvestConfirm = async () => {
    const res = await investInMarket(investAmount);
    setStatusMessage(res.message);
  };

  // --- Render Sub-screens ---

  // 1. BUY GOODS VIEW
  const renderBuyGoods = () => {
    const availableGoods = getPortAvailableCommodities(portId);

    if (selectedCommodity) {
      const itemInfo = availableGoods.find((a) => a.commodity.id === selectedCommodity.id);
      const unitPrice = itemInfo?.buyPrice || selectedCommodity.basePrice;
      const maxAffordable = Math.floor(state.gold / unitPrice);
      const maxCanBuy = Math.max(1, Math.min(freeSpace, maxAffordable));
      const totalCost = tradeQuantity * unitPrice;

      return (
        <div className="absolute top-[160px] left-[520px] w-[500px] bg-[#1c1814] border-2 border-[#8c6f4b] p-4 text-[#e6d5b8] font-mono shadow-2xl z-30 rounded">
          <div className="flex justify-between items-center border-b border-[#8c6f4b] pb-2 mb-3">
            <span className="font-bold text-yellow-300 text-sm flex items-center gap-2">
              <span>{selectedCommodity.icon}</span>
              <span>Purchase {selectedCommodity.name}</span>
            </span>
            <button
              onClick={() => setSelectedCommodity(null)}
              className="px-2 py-0.5 bg-red-950 border border-red-700 text-red-200 text-xs rounded hover:bg-red-900 cursor-pointer"
            >
              ✕ Cancel
            </button>
          </div>

          <p className="text-xs text-gray-300 italic mb-3">{selectedCommodity.desc}</p>

          <div className="grid grid-cols-2 gap-2 text-xs bg-[#2b2219] p-3 rounded mb-3 border border-[#523e28]">
            <div>Unit Price: <span className="font-bold text-yellow-300">{unitPrice} gold</span></div>
            <div>Your Gold: <span className="font-bold text-yellow-300">{state.gold} gold</span></div>
            <div>Free Cargo Space: <span className="font-bold text-yellow-300">{freeSpace} crates</span></div>
            <div>Max Loadable: <span className="font-bold text-yellow-300">{maxCanBuy} crates</span></div>
          </div>

          {/* Quantity Controls */}
          <div className="mb-4">
            <label className="text-xs block mb-1 text-yellow-200">Select Quantity (crates):</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTradeQuantity(Math.max(1, tradeQuantity - 10))}
                className="px-2 py-1 bg-[#3d2e1e] border border-[#8c6f4b] text-xs rounded hover:bg-[#523e28]"
              >
                -10
              </button>
              <button
                onClick={() => setTradeQuantity(Math.max(1, tradeQuantity - 1))}
                className="px-2 py-1 bg-[#3d2e1e] border border-[#8c6f4b] text-xs rounded hover:bg-[#523e28]"
              >
                -1
              </button>
              <input
                type="number"
                min="1"
                max={maxCanBuy}
                value={tradeQuantity}
                onChange={(e) =>
                  setTradeQuantity(Math.max(1, Math.min(maxCanBuy, Number(e.target.value) || 1)))
                }
                className="w-20 bg-black border border-[#8c6f4b] text-center text-yellow-300 font-bold py-1 text-sm rounded"
              />
              <button
                onClick={() => setTradeQuantity(Math.min(maxCanBuy, tradeQuantity + 1))}
                className="px-2 py-1 bg-[#3d2e1e] border border-[#8c6f4b] text-xs rounded hover:bg-[#523e28]"
              >
                +1
              </button>
              <button
                onClick={() => setTradeQuantity(Math.min(maxCanBuy, tradeQuantity + 10))}
                className="px-2 py-1 bg-[#3d2e1e] border border-[#8c6f4b] text-xs rounded hover:bg-[#523e28]"
              >
                +10
              </button>
              <button
                onClick={() => setTradeQuantity(maxCanBuy)}
                className="px-2 py-1 bg-yellow-950 border border-yellow-700 text-yellow-300 text-xs font-bold rounded hover:bg-yellow-900"
              >
                MAX
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-[#8c6f4b] pt-3">
            <div className="text-xs">
              Total: <span className="font-bold text-yellow-300 text-sm">{totalCost} gold</span>
            </div>
            <button
              onClick={handleBuyConfirm}
              disabled={freeSpace <= 0 || state.gold < totalCost}
              className={`px-4 py-1.5 rounded font-bold text-xs uppercase cursor-pointer border ${
                freeSpace > 0 && state.gold >= totalCost
                  ? 'bg-green-900 border-green-500 text-green-200 hover:bg-green-800'
                  : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'
              }`}
            >
              Confirm Purchase
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="absolute top-[160px] left-[520px] w-[500px] bg-[#1c1814] border-2 border-[#8c6f4b] p-4 text-[#e6d5b8] font-mono shadow-2xl z-30 rounded">
        <div className="flex justify-between items-center border-b border-[#8c6f4b] pb-2 mb-3">
          <span className="font-bold text-yellow-300 text-sm">🛒 Local Commodities in Stock</span>
          <span className="text-xs text-yellow-200">
            Hold: {totalLoad}/{totalCapacity} ({freeSpace} free)
          </span>
        </div>

        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
          {availableGoods.map(({ commodity, buyPrice }) => (
            <div
              key={commodity.id}
              onClick={() => {
                setSelectedCommodity(commodity);
                setTradeQuantity(1);
              }}
              className="flex justify-between items-center p-2.5 bg-[#2b2219] hover:bg-[#3d2e1e] border border-[#523e28] hover:border-yellow-600 rounded cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{commodity.icon}</span>
                <div>
                  <div className="font-bold text-yellow-200 text-xs">{commodity.name}</div>
                  <div className="text-[10px] text-gray-400">{commodity.category} Specialty</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-yellow-300 text-xs">{buyPrice} Gold</div>
                <div className="text-[10px] text-green-400">In Stock</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 text-right">
          <button
            onClick={reset}
            className="px-3 py-1 bg-[#3d2e1e] hover:bg-[#523e28] text-xs font-bold border border-[#8c6f4b] rounded"
          >
            ← Back to Menu
          </button>
        </div>
      </div>
    );
  };

  // 2. SELL GOODS VIEW
  const renderSellGoods = () => {
    const fleetGoods = getFleetCommoditiesSummary();

    if (fleetGoods.length === 0) {
      return (
        <div className="absolute top-[160px] left-[520px] w-[480px] bg-[#1c1814] border-2 border-[#8c6f4b] p-5 text-[#e6d5b8] font-mono shadow-2xl z-30 rounded text-center">
          <div className="text-3xl mb-2">📦</div>
          <div className="text-sm font-bold text-yellow-300 mb-2">No Trade Goods in Hold</div>
          <p className="text-xs text-gray-400 mb-4">
            Your cargo holds currently only contain ship provisions (water & food). Buy goods from
            origin ports to trade across the sea!
          </p>
          <button
            onClick={reset}
            className="px-4 py-1.5 bg-[#3d2e1e] hover:bg-[#523e28] border border-[#8c6f4b] text-xs font-bold rounded cursor-pointer"
          >
            ← Back to Menu
          </button>
        </div>
      );
    }

    if (selectedSellItem) {
      const commMeta = COMMODITIES.find((c) => c.id === selectedSellItem.id);
      const unitSellPrice = commMeta
        ? calculateSellPrice(commMeta, portData.regionId, currentRate)
        : 50;
      const totalRevenue = tradeQuantity * unitSellPrice;
      const isArbitrageProfit = commMeta && !commMeta.originRegions.includes(portData.regionId);

      return (
        <div className="absolute top-[160px] left-[520px] w-[500px] bg-[#1c1814] border-2 border-[#8c6f4b] p-4 text-[#e6d5b8] font-mono shadow-2xl z-30 rounded">
          <div className="flex justify-between items-center border-b border-[#8c6f4b] pb-2 mb-3">
            <span className="font-bold text-yellow-300 text-sm flex items-center gap-2">
              <span>{selectedSellItem.icon}</span>
              <span>Sell {selectedSellItem.name}</span>
            </span>
            <button
              onClick={() => setSelectedSellItem(null)}
              className="px-2 py-0.5 bg-red-950 border border-red-700 text-red-200 text-xs rounded hover:bg-red-900 cursor-pointer"
            >
              ✕ Cancel
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs bg-[#2b2219] p-3 rounded mb-3 border border-[#523e28]">
            <div>Local Offer: <span className="font-bold text-yellow-300">{unitSellPrice} gold/crate</span></div>
            <div>In Hold: <span className="font-bold text-yellow-300">{selectedSellItem.quantity} crates</span></div>
            <div className="col-span-2">
              {isArbitrageProfit ? (
                <span className="text-emerald-400 font-bold">✨ High Demand: Foreign imported good!</span>
              ) : (
                <span className="text-gray-400">Local produce market rate</span>
              )}
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="mb-4">
            <label className="text-xs block mb-1 text-yellow-200">Select Quantity to Sell:</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTradeQuantity(Math.max(1, tradeQuantity - 10))}
                className="px-2 py-1 bg-[#3d2e1e] border border-[#8c6f4b] text-xs rounded hover:bg-[#523e28]"
              >
                -10
              </button>
              <button
                onClick={() => setTradeQuantity(Math.max(1, tradeQuantity - 1))}
                className="px-2 py-1 bg-[#3d2e1e] border border-[#8c6f4b] text-xs rounded hover:bg-[#523e28]"
              >
                -1
              </button>
              <input
                type="number"
                min="1"
                max={selectedSellItem.quantity}
                value={tradeQuantity}
                onChange={(e) =>
                  setTradeQuantity(
                    Math.max(1, Math.min(selectedSellItem.quantity, Number(e.target.value) || 1)),
                  )
                }
                className="w-20 bg-black border border-[#8c6f4b] text-center text-yellow-300 font-bold py-1 text-sm rounded"
              />
              <button
                onClick={() =>
                  setTradeQuantity(Math.min(selectedSellItem.quantity, tradeQuantity + 1))
                }
                className="px-2 py-1 bg-[#3d2e1e] border border-[#8c6f4b] text-xs rounded hover:bg-[#523e28]"
              >
                +1
              </button>
              <button
                onClick={() =>
                  setTradeQuantity(Math.min(selectedSellItem.quantity, tradeQuantity + 10))
                }
                className="px-2 py-1 bg-[#3d2e1e] border border-[#8c6f4b] text-xs rounded hover:bg-[#523e28]"
              >
                +10
              </button>
              <button
                onClick={() => setTradeQuantity(selectedSellItem.quantity)}
                className="px-2 py-1 bg-yellow-950 border border-yellow-700 text-yellow-300 text-xs font-bold rounded hover:bg-yellow-900"
              >
                ALL
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-[#8c6f4b] pt-3">
            <div className="text-xs">
              Revenue: <span className="font-bold text-yellow-300 text-sm">{totalRevenue} gold</span>
            </div>
            <button
              onClick={handleSellConfirm}
              className="px-4 py-1.5 rounded font-bold text-xs uppercase cursor-pointer bg-green-900 border border-green-500 text-green-200 hover:bg-green-800"
            >
              Confirm Sale
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="absolute top-[160px] left-[520px] w-[500px] bg-[#1c1814] border-2 border-[#8c6f4b] p-4 text-[#e6d5b8] font-mono shadow-2xl z-30 rounded">
        <div className="flex justify-between items-center border-b border-[#8c6f4b] pb-2 mb-3">
          <span className="font-bold text-yellow-300 text-sm">💰 Fleet Cargo Holds</span>
          <span className="text-xs text-yellow-200">Select goods to liquidate</span>
        </div>

        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
          {fleetGoods.map((item) => {
            const commMeta = COMMODITIES.find((c) => c.id === item.id);
            const unitSellPrice = commMeta
              ? calculateSellPrice(commMeta, portData.regionId, currentRate)
              : 50;
            const isImportProfit = commMeta && !commMeta.originRegions.includes(portData.regionId);

            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedSellItem(item);
                  setTradeQuantity(item.quantity);
                }}
                className="flex justify-between items-center p-2.5 bg-[#2b2219] hover:bg-[#3d2e1e] border border-[#523e28] hover:border-yellow-600 rounded cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <div className="font-bold text-yellow-200 text-xs">{item.name}</div>
                    <div className="text-[10px] text-gray-400">In Hold: {item.quantity} crates</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-300 text-xs">{unitSellPrice} Gold / crate</div>
                  {isImportProfit ? (
                    <div className="text-[10px] text-emerald-400 font-bold">✨ High Demand</div>
                  ) : (
                    <div className="text-[10px] text-gray-400">Local Market</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 text-right">
          <button
            onClick={reset}
            className="px-3 py-1 bg-[#3d2e1e] hover:bg-[#523e28] text-xs font-bold border border-[#8c6f4b] rounded"
          >
            ← Back to Menu
          </button>
        </div>
      </div>
    );
  };

  // 3. INVEST IN MARKET VIEW
  const renderInvest = () => {
    return (
      <div className="absolute top-[160px] left-[520px] w-[480px] bg-[#1c1814] border-2 border-[#8c6f4b] p-5 text-[#e6d5b8] font-mono shadow-2xl z-30 rounded">
        <div className="flex justify-between items-center border-b border-[#8c6f4b] pb-2 mb-3">
          <span className="font-bold text-yellow-300 text-sm">🏛️ Commercial Investment</span>
          <button
            onClick={reset}
            className="px-2 py-0.5 bg-red-950 border border-red-700 text-red-200 text-xs rounded hover:bg-red-900 cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        <div className="space-y-3 text-xs mb-4">
          <p className="text-gray-300">
            Investing capital into {portData.name} expands local workshops, increases market stock,
            unlocks rare specialty goods, and raises your nation&apos;s colonial influence!
          </p>

          <div className="bg-[#2b2219] p-3 rounded border border-[#523e28] grid grid-cols-2 gap-2">
            <div>Current Economy: <span className="font-bold text-yellow-300">{economyValue} / 1000</span></div>
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
            Effect: <span className="text-green-400 font-bold">+{Math.max(1, Math.floor(investAmount / 100))} Economy</span>
          </div>
          <button
            onClick={handleInvestConfirm}
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
  };

  // 4. MARKET RATE VIEW
  const renderMarketRate = () => {
    const availableGoods = getPortAvailableCommodities(portId);

    return (
      <div className="absolute top-[160px] left-[500px] w-[520px] bg-[#1c1814] border-2 border-[#8c6f4b] p-4 text-[#e6d5b8] font-mono shadow-2xl z-30 rounded">
        <div className="flex justify-between items-center border-b border-[#8c6f4b] pb-2 mb-3">
          <span className="font-bold text-yellow-300 text-sm">📈 {portData.name} Market Conditions</span>
          <button
            onClick={reset}
            className="px-2 py-0.5 bg-red-950 border border-red-700 text-red-200 text-xs rounded hover:bg-red-900 cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
          <div className="bg-[#2b2219] p-2 rounded border border-[#523e28]">
            <div className="text-gray-400 text-[10px]">PRICE INDEX</div>
            <div className="font-bold text-yellow-300 text-sm">{currentRate}%</div>
          </div>
          <div className="bg-[#2b2219] p-2 rounded border border-[#523e28]">
            <div className="text-gray-400 text-[10px]">ECONOMY SCALE</div>
            <div className="font-bold text-yellow-300 text-sm">{economyValue}</div>
          </div>
          <div className="bg-[#2b2219] p-2 rounded border border-[#523e28]">
            <div className="text-gray-400 text-[10px]">MARKET STATUS</div>
            <div className="font-bold text-emerald-400 text-sm">
              {currentRate > 110 ? 'High Demand' : currentRate < 90 ? 'Oversupplied' : 'Balanced'}
            </div>
          </div>
        </div>

        <div className="text-xs font-bold text-yellow-200 mb-1">Local Commodities & Benchmark Rates:</div>
        <div className="max-h-[200px] overflow-y-auto space-y-1.5 mb-3 pr-1 text-xs">
          {availableGoods.map(({ commodity, buyPrice }) => (
            <div
              key={commodity.id}
              className="flex justify-between items-center px-2 py-1.5 bg-[#261f17] border border-[#3d2e1e] rounded"
            >
              <div className="flex items-center gap-2">
                <span>{commodity.icon}</span>
                <span className="font-bold text-[#e6d5b8]">{commodity.name}</span>
                <span className="text-[10px] text-gray-400">({commodity.category})</span>
              </div>
              <div className="font-bold text-yellow-300">{buyPrice} Gold</div>
            </div>
          ))}
        </div>

        <div className="text-right">
          <button
            onClick={reset}
            className="px-3 py-1 bg-[#3d2e1e] hover:bg-[#523e28] text-xs font-bold border border-[#8c6f4b] rounded"
          >
            ← Back to Menu
          </button>
        </div>
      </div>
    );
  };

  // Main menu
  const menu = (
    <BuildingMenu
      options={marketOptions.map((s) => ({
        label: s,
        value: s,
      }))}
      onSelect={(s) => selectOption(s)}
      onCancel={back}
      hidden={option !== null}
    />
  );

  return (
    <BuildingWrapper
      buildingId="1"
      vendorMessageBox={option !== null && !statusMessage ? null : vendorMessage}
      menu={menu}
    >
      {option === 'Buy Goods' && renderBuyGoods()}
      {option === 'Sell Goods' && renderSellGoods()}
      {option === 'Invest' && renderInvest()}
      {option === 'Market Rate' && renderMarketRate()}
    </BuildingWrapper>
  );
}
