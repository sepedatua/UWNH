import { useEffect, useRef, useState } from 'react';
import {
  CombatShip,
  CombatState,
} from '../../game/combat/combatTypes';
import {
  boardShip,
  canBoardShip,
  canFireCannonsAt,
  canMoveToHex,
  createCombatEngagement,
  endActiveShipTurn,
  fireBroadside,
  moveShip,
  rotateShip,
} from '../../game/combat/combatActions';
import {
  getBroadsideHexes,
  hexDistance,
  hexEquals,
  hexesInRange,
  hexToPixel,
  pixelToHex,
} from '../../game/combat/hexUtils';
import SwordDuelModal from './SwordDuelModal';

interface Props {
  onCombatConcluded: (victory: boolean) => void;
  enemyFleetName?: string;
  enemyCommodoreName?: string;
}

export default function BattleArena({
  onCombatConcluded,
  enemyFleetName = 'Barbary Corsair Fleet',
  enemyCommodoreName = 'Khayr ad-Din Barbarossa',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [combatState, setCombatState] = useState<CombatState>(() =>
    createCombatEngagement(enemyFleetName, enemyCommodoreName),
  );
  const [selectedHex, setSelectedHex] = useState<{ q: number; r: number } | null>(null);
  const [targetShipId, setTargetShipId] = useState<string | null>(null);
  const [, setRerender] = useState(0);

  const HEX_RADIUS = 36;
  const ORIGIN = { x: 70, y: 70 };

  const activeShip = combatState.ships.find((s) => s.id === combatState.activeShipId);

  // Rerender trigger helper
  const triggerUpdate = () => {
    setCombatState({ ...combatState });
    setRerender((r) => r + 1);
  };

  // Canvas Drawing Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Clear background
    ctx.fillStyle = '#0f172a'; // Deep oceanic slate
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle water gradient & grid
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0c2340');
    gradient.addColorStop(1, '#071526');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Hex Grid
    const reachableHexes = activeShip && !activeShip.hasActed
      ? hexesInRange(activeShip.hex, activeShip.movementPoints).filter(
          (h) => canMoveToHex(activeShip, h, combatState).valid,
        )
      : [];

    const broadsideHexes = activeShip && !activeShip.hasActed
      ? (() => {
          const { port, starboard } = getBroadsideHexes(
            activeShip.hex,
            activeShip.heading,
            2,
          );
          return [...port, ...starboard];
        })()
      : [];

    for (let q = 0; q < combatState.boardWidth; q += 1) {
      for (let r = 0; r < combatState.boardHeight; r += 1) {
        const hex = { q, r };
        const center = hexToPixel(hex, HEX_RADIUS, ORIGIN);

        // Path for hex
        ctx.beginPath();
        for (let i = 0; i < 6; i += 1) {
          const angle = (Math.PI / 180) * (60 * i - 30);
          const x = center.x + HEX_RADIUS * Math.cos(angle);
          const y = center.y + HEX_RADIUS * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();

        // Highlight hex logic
        const isReachable = reachableHexes.some((h) => hexEquals(h, hex));
        const isBroadside = broadsideHexes.some((h) => hexEquals(h, hex));
        const isSelected = selectedHex && hexEquals(selectedHex, hex);

        if (isSelected) {
          ctx.fillStyle = 'rgba(234, 179, 8, 0.35)'; // Yellow selected
        } else if (isReachable) {
          ctx.fillStyle = 'rgba(34, 197, 94, 0.2)'; // Green reachable
        } else if (isBroadside) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'; // Red broadside arc
        } else {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
        }
        ctx.fill();

        ctx.strokeStyle = isSelected
          ? '#eab308'
          : isReachable
            ? 'rgba(34, 197, 94, 0.6)'
            : isBroadside
              ? 'rgba(239, 68, 68, 0.5)'
              : 'rgba(51, 65, 85, 0.5)';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();

        // Optional tiny coordinate label
        ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${q},${r}`, center.x, center.y + HEX_RADIUS - 6);
      }
    }

    // 3. Draw Ships on Hexes
    combatState.ships.forEach((ship) => {
      if (ship.isSunk) {
        // Draw sunken wreck icon
        const center = hexToPixel(ship.hex, HEX_RADIUS, ORIGIN);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚓', center.x, center.y);
        return;
      }

      const center = hexToPixel(ship.hex, HEX_RADIUS, ORIGIN);
      const isCurrentActive = activeShip?.id === ship.id;
      const isTarget = targetShipId === ship.id;

      // Active ship halo
      if (isCurrentActive) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, HEX_RADIUS * 0.9, 0, Math.PI * 2);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Target ship halo
      if (isTarget) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, HEX_RADIUS * 0.9, 0, Math.PI * 2);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Ship Icon & Rotation
      ctx.save();
      ctx.translate(center.x, center.y);
      // Rotate ship according to heading (0..5 => 60 deg each)
      const rotationAngle = (Math.PI / 3) * ship.heading;
      ctx.rotate(rotationAngle);

      // Ship Body
      ctx.fillStyle = ship.team === 'player' ? '#2563eb' : '#dc2626';
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Ship Bow pointer (Triangle pointing East/0 rad)
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(10, -5);
      ctx.lineTo(10, 5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Flagship badge
      if (ship.isFlagship) {
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('👑', center.x, center.y - 14);
      }

      // Health bar above ship
      const barWidth = 32;
      const barHeight = 4;
      const healthRatio = Math.max(0, ship.durability / ship.maxDurability);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(center.x - barWidth / 2, center.y - 24, barWidth, barHeight);
      ctx.fillStyle = healthRatio > 0.5 ? '#22c55e' : healthRatio > 0.25 ? '#eab308' : '#ef4444';
      ctx.fillRect(center.x - barWidth / 2, center.y - 24, barWidth * healthRatio, barHeight);

      // Ship Name & Crew label
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${ship.name.slice(0, 10)} (${ship.crew})`, center.x, center.y + 24);
    });
  }, [combatState, selectedHex, targetShipId, activeShip]);

  // Click on Canvas Hex
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !activeShip || activeShip.hasActed) return;

    const rect = canvas.getBoundingClientRect();
    const pixelX = e.clientX - rect.left;
    const pixelY = e.clientY - rect.top;

    const clickedHex = pixelToHex({ x: pixelX, y: pixelY }, HEX_RADIUS, ORIGIN);

    // Check if clicked an enemy ship
    const clickedShip = combatState.ships.find(
      (s) => !s.isSunk && !s.isSurrendered && hexEquals(s.hex, clickedHex),
    );

    if (clickedShip) {
      if (clickedShip.team === 'enemy') {
        setTargetShipId(clickedShip.id);
        setSelectedHex(clickedHex);
      }
      return;
    }

    // Otherwise treat as movement destination
    setSelectedHex(clickedHex);
  };

  // Action: Move
  const handleMove = () => {
    if (!activeShip || !selectedHex) return;
    const moved = moveShip(activeShip.id, selectedHex, combatState);
    if (moved) {
      setSelectedHex(null);
      triggerUpdate();
    }
  };

  // Action: Rotate
  const handleRotate = (clockwise: boolean) => {
    if (!activeShip) return;
    rotateShip(activeShip.id, clockwise, combatState);
    triggerUpdate();
  };

  // Action: Broadside Cannon Fire
  const handleFire = () => {
    if (!activeShip || !targetShipId) return;
    const fired = fireBroadside(activeShip.id, targetShipId, combatState);
    if (fired) {
      triggerUpdate();
    }
  };

  // Action: Boarding Melee Clash
  const handleBoard = () => {
    if (!activeShip || !targetShipId) return;
    const { duelTriggered } = boardShip(activeShip.id, targetShipId, combatState);
    triggerUpdate();
  };

  // Action: End Turn
  const handleEndTurn = () => {
    endActiveShipTurn(combatState);
    setSelectedHex(null);
    setTargetShipId(null);
    triggerUpdate();
  };

  // 1v1 Captain Duel Concluded
  const handleDuelConcluded = (winner: 'player' | 'enemy') => {
    if (winner === 'player') {
      // Defeating enemy commodore awards total victory
      const enemyFlagship = combatState.ships.find((s) => s.team === 'enemy' && s.isFlagship);
      if (enemyFlagship) enemyFlagship.isSurrendered = true;
      combatState.ships.filter((s) => s.team === 'enemy').forEach((s) => {
        s.isSurrendered = true;
      });
      combatState.phase = 'victory';
      combatState.duelState = null;
    } else {
      combatState.phase = 'defeat';
      combatState.duelState = null;
    }
    triggerUpdate();
  };

  const selectedTarget = combatState.ships.find((s) => s.id === targetShipId);
  const canFire = activeShip && selectedTarget ? canFireCannonsAt(activeShip, selectedTarget).canFire : false;
  const canBoard = activeShip && selectedTarget ? canBoardShip(activeShip, selectedTarget) : false;
  const canMoveSelected = activeShip && selectedHex ? canMoveToHex(activeShip, selectedHex, combatState).valid : false;

  return (
    <div className="relative w-[1280px] h-[800px] bg-slate-950 flex flex-col select-none font-sans overflow-hidden">
      {/* 1. Tactical Header Bar */}
      <div className="px-6 py-2.5 bg-neutral-900 border-b border-neutral-800 flex justify-between items-center text-white">
        <div className="flex items-center gap-4">
          <span className="text-xl">⚔️</span>
          <span className="font-bold text-sm tracking-widest text-yellow-400 uppercase">
            Tactical Naval Arena • Round {combatState.round}
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700">
            {combatState.phase === 'player_turn' ? 'YOUR FLEET COMMAND' : 'ENEMY SHIPS ACTING...'}
          </span>
        </div>

        {/* Wind Vane Compass */}
        <div className="flex items-center gap-3 text-xs font-mono text-neutral-300">
          <span>Wind Direction: <strong className="text-yellow-400">{['NE', 'E', 'SE', 'SW', 'W', 'NW'][combatState.wind.direction]}</strong></span>
          <span>Speed: <strong className="text-yellow-400">{combatState.wind.speed} Knots</strong></span>
        </div>
      </div>

      {/* 2. Main Arena & Hex Canvas */}
      <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1000}
          height={580}
          onClick={handleCanvasClick}
          className="rounded-xl border border-slate-800/80 shadow-2xl cursor-crosshair"
        />

        {/* Right Tactical Log Box */}
        <div className="absolute right-4 top-4 bottom-4 w-60 bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 flex flex-col shadow-xl text-xs font-mono">
          <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 border-b border-neutral-800 pb-1">
            Battle Chronicle
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 text-neutral-300">
            {combatState.log.map((entry, idx) => (
              <div
                key={idx}
                className={idx === 0 ? 'text-yellow-300 font-bold' : 'text-neutral-400 text-[11px]'}
              >
                {entry}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Tactical Command Footer */}
      <div className="px-6 py-3 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between text-white">
        {/* Active Ship Card */}
        {activeShip ? (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-900/40 border border-blue-500/60 flex items-center justify-center text-2xl">
              ⛵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{activeShip.name}</span>
                {activeShip.isFlagship && <span className="text-xs text-yellow-400">👑 Flagship</span>}
                <span className="text-xs text-neutral-400 font-mono">Captain: {activeShip.captainName}</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-neutral-300 mt-1">
                <span>Durability: <strong className="text-emerald-400">{activeShip.durability}/{activeShip.maxDurability}</strong></span>
                <span>Crew: <strong className="text-blue-400">{activeShip.crew}</strong></span>
                <span>Guns: <strong className="text-yellow-400">{activeShip.guns} ({activeShip.cannonType})</strong></span>
                <span>MP: <strong className="text-purple-400">{activeShip.movementPoints}</strong></span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-neutral-400 font-mono">No active flagship</div>
        )}

        {/* Tactical Actions Bar */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canMoveSelected}
            onClick={handleMove}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              canMoveSelected
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
            }`}
          >
            Maneuver to Hex
          </button>

          <button
            type="button"
            disabled={!activeShip || activeShip.movementPoints < 1}
            onClick={() => handleRotate(false)}
            className="px-2.5 py-2 rounded-lg text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 cursor-pointer"
            title="Rotate Port (-60°)"
          >
            ↺ Turn Port
          </button>

          <button
            type="button"
            disabled={!activeShip || activeShip.movementPoints < 1}
            onClick={() => handleRotate(true)}
            className="px-2.5 py-2 rounded-lg text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 cursor-pointer"
            title="Rotate Starboard (+60°)"
          >
            ↻ Turn Starboard
          </button>

          <button
            type="button"
            disabled={!canFire}
            onClick={handleFire}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              canFire
                ? 'bg-red-600 hover:bg-red-500 text-white cursor-pointer animate-pulse shadow'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
            }`}
          >
            💥 Fire Broadside
          </button>

          <button
            type="button"
            disabled={!canBoard}
            onClick={handleBoard}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              canBoard
                ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer animate-bounce shadow'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
            }`}
          >
            ⚔️ Board Ship
          </button>

          <button
            type="button"
            onClick={handleEndTurn}
            className="ml-2 px-4 py-2 rounded-lg text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-yellow-300 border border-neutral-700 cursor-pointer"
          >
            Wait / End Turn
          </button>
        </div>
      </div>

      {/* 4. 1v1 Captain Sword Duel Modal Overlay */}
      {combatState.phase === 'duel' && combatState.duelState && (
        <SwordDuelModal
          duelState={combatState.duelState}
          onDuelConcluded={handleDuelConcluded}
        />
      )}

      {/* 5. Victory Screen Overlay */}
      {combatState.phase === 'victory' && combatState.spoils && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-40">
          <div className="max-w-md w-full bg-neutral-900 border-2 border-yellow-500 rounded-2xl p-6 text-center shadow-[0_0_50px_rgba(234,179,8,0.4)]">
            <div className="text-5xl mb-3">🏆</div>
            <h2 className="text-2xl font-extrabold text-yellow-400 uppercase tracking-widest mb-1">
              Decisive Naval Victory!
            </h2>
            <p className="text-neutral-300 text-xs mb-4">
              The enemy fleet has been shattered and their flagship captured!
            </p>

            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-left text-xs space-y-1.5 font-mono mb-6 text-neutral-300">
              <div className="flex justify-between">
                <span>Plunder Gold:</span>
                <span className="text-yellow-400 font-bold">+{combatState.spoils.gold} Gold</span>
              </div>
              <div className="flex justify-between">
                <span>Battle Fame:</span>
                <span className="text-blue-400 font-bold">+{combatState.spoils.fame} Fame</span>
              </div>
              <div className="flex justify-between">
                <span>Fleet Morale:</span>
                <span className="text-emerald-400 font-bold">Max (100%)</span>
              </div>
              <div className="flex justify-between">
                <span>Captured Vessel:</span>
                <span className="text-white font-bold">{combatState.spoils.capturedShipName}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onCombatConcluded(true)}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold rounded-xl transition-all cursor-pointer shadow"
            >
              Claim Spoils & Return to Sea
            </button>
          </div>
        </div>
      )}

      {/* 6. Defeat Screen Overlay */}
      {combatState.phase === 'defeat' && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 z-40">
          <div className="max-w-md w-full bg-neutral-900 border-2 border-red-600 rounded-2xl p-6 text-center shadow-[0_0_50px_rgba(220,38,38,0.5)]">
            <div className="text-5xl mb-3">☠️</div>
            <h2 className="text-2xl font-extrabold text-red-500 uppercase tracking-widest mb-1">
              Fleet Defeated & Sunk
            </h2>
            <p className="text-neutral-300 text-xs mb-6">
              Your flagship was overpowered and sunk by enemy cannon broadsides.
            </p>
            <button
              type="button"
              onClick={() => onCombatConcluded(false)}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all cursor-pointer"
            >
              Acknowledge Defeat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
