import { useEffect, useRef, useState } from 'react';
import {
  CombatState,
  FleetPlan,
} from '../../game/combat/combatTypes';
import {
  boardShip,
  canBoardShip,
  canFireCannonsAt,
  canMoveToHex,
  checkCombatEnd,
  commissionPrizeShip,
  createCombatEngagement,
  endActiveShipTurn,
  finalizeCombatResults,
  fireBroadside,
  fleeShip,
  getPlayerTotalShot,
  moveShip,
  rotateShip,
  scuttlePrizeShip,
  setConsortOrder,
  setFleetPlan,
} from '../../game/combat/combatActions';
import {
  BATTLE_GRID_HEIGHT,
  BATTLE_GRID_WIDTH,
  BATTLE_VIEWPORT_COLS,
  BATTLE_VIEWPORT_ROWS,
  calculateCannonballArcPosition,
  hexEquals,
  HexCoord,
  KOEI_HEADING_NAMES,
  pixelToStaggered,
  staggeredBroadsideHexes,
  staggeredHexesInRange,
} from '../../game/combat/hexUtils';
import SwordDuelModal from './SwordDuelModal';
import soundManager from '../sound/soundManager';
import state from '../../state/state';

interface Props {
  onCombatConcluded: (victory: boolean, outcome?: 'victory' | 'defeat' | 'escaped') => void;
  enemyFleetName?: string;
  enemyCommodoreName?: string;
  enemyFleetId?: string;
}

const TILE_PX = 60; // 60px display scale for 13x12 main viewport

export default function BattleArena({
  onCombatConcluded,
  enemyFleetName = 'Barbary Corsair Fleet',
  enemyCommodoreName = 'Khayr ad-Din Barbarossa',
  enemyFleetId: _enemyFleetId,
}: Props) {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const miniMapCanvasRef = useRef<HTMLCanvasElement>(null);

  const [combatState, setCombatState] = useState<CombatState>(() => {
    soundManager.setBattlePhase('battle');
    return createCombatEngagement(enemyFleetName, enemyCommodoreName);
  });

  const [selectedHex, setSelectedHex] = useState<HexCoord | null>(null);
  const [targetShipId, setTargetShipId] = useState<string | null>(null);
  const [showPlanMenu, setShowPlanMenu] = useState(false);
  const [showOrderMenu, setShowOrderMenu] = useState(false);
  const [selectedConsortId, setSelectedConsortId] = useState<string | null>(null);
  const [, setRerender] = useState(0);

  const triggerUpdate = () => {
    setCombatState({ ...combatState });
    setRerender((r) => r + 1);
  };

  const activeShip = combatState.ships.find((s) => s.id === combatState.activeShipId);
  const playerFlagship = combatState.ships.find((s) => s.team === 'player' && s.isFlagship) || combatState.ships[0];
  const totalPlayerShot = getPlayerTotalShot();

  // -------------------------------------------------------------
  // Main Viewport Canvas Drawing Loop
  // -------------------------------------------------------------
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { viewCol, viewRow } = combatState.viewport;

      // 1. Deep Ocean Background & Wave Caustics
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#0a233f');
      bgGrad.addColorStop(0.5, '#07182c');
      bgGrad.addColorStop(1, '#05111f');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle retro wave ripples
      const time = Date.now() * 0.002;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
      ctx.lineWidth = 1;
      for (let y = 10; y < canvas.height; y += 24) {
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 30) {
          const waveY = y + Math.sin(x * 0.04 + time) * 3;
          if (x === 0) ctx.moveTo(x, waveY);
          else ctx.lineTo(x, waveY);
        }
        ctx.stroke();
      }

      // 2. Compute reachable & broadside hexes for active ship
      const reachableHexes =
        activeShip && !activeShip.hasActed && activeShip.team === 'player'
          ? staggeredHexesInRange(activeShip.hex, activeShip.movementPoints, combatState.boardWidth, combatState.boardHeight).filter(
              (h) => canMoveToHex(activeShip, h, combatState).valid,
            )
          : [];

      const broadsideHexes =
        activeShip && !activeShip.hasActed
          ? (() => {
              const { port, starboard } = staggeredBroadsideHexes(
                activeShip.hex,
                activeShip.heading,
                3,
                combatState.boardWidth,
                combatState.boardHeight,
              );
              return [...port, ...starboard];
            })()
          : [];

      // 3. Render Staggered Column Hex Grid in Viewport (13 cols x 12 rows)
      for (let c = 0; c <= BATTLE_VIEWPORT_COLS + 1; c += 1) {
        for (let r = 0; r <= BATTLE_VIEWPORT_ROWS + 1; r += 1) {
          const gridCol = viewCol + c;
          const gridRow = viewRow + r;
          if (gridCol < 0 || gridCol >= combatState.boardWidth || gridRow < 0 || gridRow >= combatState.boardHeight) {
            continue;
          }

          const isOdd = Math.abs(gridCol) % 2 === 1;
          const px = c * TILE_PX;
          const py = r * TILE_PX + (isOdd ? TILE_PX / 2 : 0);

          const hexCoord = { q: gridCol, r: gridRow };
          const isSelected = selectedHex && hexEquals(selectedHex, hexCoord);
          const isReachable = reachableHexes.some((h) => hexEquals(h, hexCoord));
          const isBroadside = broadsideHexes.some((h) => hexEquals(h, hexCoord));

          // Draw Staggered Hex Tile Outline
          ctx.beginPath();
          const rH = TILE_PX * 0.52;
          for (let i = 0; i < 6; i += 1) {
            const angle = (Math.PI / 180) * (60 * i);
            const vx = px + TILE_PX / 2 + rH * Math.cos(angle);
            const vy = py + TILE_PX / 2 + rH * Math.sin(angle);
            if (i === 0) ctx.moveTo(vx, vy);
            else ctx.lineTo(vx, vy);
          }
          ctx.closePath();

          if (isSelected) {
            ctx.fillStyle = 'rgba(250, 204, 21, 0.4)';
            ctx.fill();
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 2.5;
            ctx.stroke();
          } else if (isReachable) {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else if (isBroadside) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(248, 113, 113, 0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
          } else {
            ctx.strokeStyle = 'rgba(30, 64, 100, 0.35)';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // 4. Render Ships
      combatState.ships.forEach((ship) => {
        if (ship.hasFled) return;

        const relCol = ship.hex.q - viewCol;
        const relRow = ship.hex.r - viewRow;
        if (relCol < -1 || relCol > BATTLE_VIEWPORT_COLS + 1 || relRow < -1 || relRow > BATTLE_VIEWPORT_ROWS + 1) {
          return; // Outside camera
        }

        const isOdd = Math.abs(ship.hex.q) % 2 === 1;
        const centerX = relCol * TILE_PX + TILE_PX / 2;
        const centerY = relRow * TILE_PX + (isOdd ? TILE_PX / 2 : 0) + TILE_PX / 2;

        if (ship.isSunk) {
          // Render sunken wreck hulk
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.fillStyle = 'rgba(100, 116, 139, 0.6)';
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText('⚓', 0, 0);
          ctx.font = '9px monospace';
          ctx.fillText('SUNK', 0, 15);
          ctx.restore();
          return;
        }

        ctx.save();
        ctx.translate(centerX, centerY);

        // Active ship pulsing aura
        if (activeShip && activeShip.id === ship.id) {
          const pulse = 22 + Math.sin(Date.now() * 0.006) * 3;
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, pulse, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Target ship crosshair
        if (targetShipId === ship.id) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 24, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-28, 0);
          ctx.lineTo(28, 0);
          ctx.moveTo(0, -28);
          ctx.lineTo(0, 28);
          ctx.stroke();
        }

        // Heading angles (6 headings): 0: N (-90°), 1: NE (-30°), 2: SE (30°), 3: S (90°), 4: SW (150°), 5: NW (210°)
        const headingAngles = [-Math.PI / 2, -Math.PI / 6, Math.PI / 6, Math.PI / 2, (5 * Math.PI) / 6, (-5 * Math.PI) / 6];
        const rot = headingAngles[ship.heading] ?? 0;
        ctx.rotate(rot);

        // Stern wake trail
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(-28, -6);
        ctx.lineTo(-28, 6);
        ctx.closePath();
        ctx.fill();

        // Ship Hull
        const isPlayer = ship.team === 'player';
        ctx.fillStyle = isPlayer ? '#78350f' : '#3f1a1a'; // Oak vs Corsair Dark Timber
        ctx.strokeStyle = isPlayer ? '#fbbf24' : '#ef4444';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.moveTo(18, 0); // Bow
        ctx.quadraticCurveTo(8, -10, -14, -8);
        ctx.lineTo(-14, 8);
        ctx.quadraticCurveTo(8, 10, 18, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Deck Masts & Sails
        ctx.fillStyle = isPlayer ? '#fef3c7' : '#fca5a5';
        ctx.fillRect(-6, -7, 3, 14); // Main sail
        ctx.fillRect(6, -5, 2.5, 10); // Fore sail
        ctx.fillStyle = isPlayer ? '#3b82f6' : '#b91c1c';
        ctx.fillRect(-12, -2, 4, 4); // Pennant

        ctx.restore();

        // Name & Health Tag
        ctx.save();
        ctx.translate(centerX, centerY - 24);
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = isPlayer ? '#93c5fd' : '#fca5a5';
        ctx.fillText(`${ship.isFlagship ? '★ ' : ''}${ship.name}`, 0, -4);

        // Mini HP Bar
        const hpRatio = Math.max(0, Math.min(1, ship.durability / ship.maxDurability));
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-18, 0, 36, 4);
        ctx.fillStyle = hpRatio > 0.5 ? '#10b981' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
        ctx.fillRect(-18, 0, 36 * hpRatio, 4);

        // Mini Crew text
        ctx.font = '9px monospace';
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(`👥 ${ship.crew}`, 0, 12);
        ctx.restore();
      });

      // 5. Parabolic Cannonball Flight Animation
      if (combatState.cannonballFlight) {
        const flight = combatState.cannonballFlight;
        flight.progress = Math.min(1, flight.progress + 0.05);

        const pos = calculateCannonballArcPosition(flight.fromPixel, flight.toPixel, flight.progress);
        const scrX = pos.x - viewCol * TILE_PX;
        const scrY = pos.y - viewRow * TILE_PX;

        // Cannonball Shadow
        const groundY = flight.fromPixel.y + (flight.toPixel.y - flight.fromPixel.y) * flight.progress - viewRow * TILE_PX;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(scrX, groundY, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Flying Cannonball
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(scrX, scrY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (flight.progress >= 1) {
          combatState.cannonballFlight = null;
        }
      }

      // 6. Floating Damage Texts
      const now = Date.now();
      combatState.floatingDamages = combatState.floatingDamages.filter((fd) => now - fd.createdAt < 2200);
      combatState.floatingDamages.forEach((fd) => {
        const elapsed = now - fd.createdAt;
        const alpha = Math.max(0, 1 - elapsed / 2200);
        const floatY = (elapsed / 2200) * 26;

        const isOdd = Math.abs(fd.hex.q) % 2 === 1;
        const scrX = (fd.hex.q - viewCol) * TILE_PX + TILE_PX / 2;
        const scrY = (fd.hex.r - viewRow) * TILE_PX + (isOdd ? TILE_PX / 2 : 0) - floatY;

        ctx.save();
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText(fd.text, scrX, scrY);
        ctx.restore();
      });

      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, [combatState, activeShip, targetShipId, selectedHex]);

  // -------------------------------------------------------------
  // Minimap Canvas Drawing (Entire 52x48 Battlefield)
  // -------------------------------------------------------------
  useEffect(() => {
    const canvas = miniMapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#061320';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cellW = canvas.width / BATTLE_GRID_WIDTH;
    const cellH = canvas.height / BATTLE_GRID_HEIGHT;

    // Grid border
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Ships
    combatState.ships.forEach((ship) => {
      if (ship.hasFled) return;
      const x = ship.hex.q * cellW;
      const y = ship.hex.r * cellH;

      if (ship.isSunk) {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
        return;
      }

      if (ship.team === 'player') {
        ctx.fillStyle = ship.isFlagship ? '#38bdf8' : '#60a5fa';
        ctx.fillRect(x - 2.5, y - 2.5, 5, 5);
      } else {
        ctx.fillStyle = ship.isFlagship ? '#ef4444' : '#f87171';
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
    });

    // Viewport Camera Wireframe Box (13x12 tiles)
    const { viewCol, viewRow } = combatState.viewport;
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(
      viewCol * cellW,
      viewRow * cellH,
      BATTLE_VIEWPORT_COLS * cellW,
      BATTLE_VIEWPORT_ROWS * cellH,
    );
  }, [combatState]);

  // -------------------------------------------------------------
  // Click Handlers
  // -------------------------------------------------------------
  const handleMainCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const clickedHex = pixelToStaggered(
      { x: clickX, y: clickY },
      combatState.viewport.viewCol,
      combatState.viewport.viewRow,
      TILE_PX,
    );

    // Check if clicked an enemy ship (set as cannon/boarding target)
    const clickedEnemy = combatState.ships.find(
      (s) => s.team === 'enemy' && !s.isSunk && !s.isSurrendered && !s.hasFled && hexEquals(s.hex, clickedHex),
    );
    if (clickedEnemy) {
      setTargetShipId(clickedEnemy.id);
      setSelectedHex(null);
      triggerUpdate();
      return;
    }

    // Check if clicked an ally ship (inspect or select for order)
    const clickedAlly = combatState.ships.find(
      (s) => s.team === 'player' && !s.isSunk && !s.isSurrendered && !s.hasFled && hexEquals(s.hex, clickedHex),
    );
    if (clickedAlly && !clickedAlly.isFlagship) {
      setSelectedConsortId(clickedAlly.id);
    }

    setSelectedHex(clickedHex);
  };

  const handleMiniMapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const col = Math.floor((clickX / rect.width) * BATTLE_GRID_WIDTH);
    const row = Math.floor((clickY / rect.height) * BATTLE_GRID_HEIGHT);

    combatState.viewport.viewCol = Math.max(0, Math.min(BATTLE_GRID_WIDTH - BATTLE_VIEWPORT_COLS, col - 6));
    combatState.viewport.viewRow = Math.max(0, Math.min(BATTLE_GRID_HEIGHT - BATTLE_VIEWPORT_ROWS, row - 6));
    triggerUpdate();
  };

  // Actions
  const handleMove = () => {
    if (!activeShip || !selectedHex) return;
    const moved = moveShip(activeShip.id, selectedHex, combatState);
    if (moved) {
      setSelectedHex(null);
      triggerUpdate();
    }
  };

  const handleRotate = (clockwise: boolean) => {
    if (!activeShip) return;
    rotateShip(activeShip.id, clockwise, combatState);
    triggerUpdate();
  };

  const handleFire = () => {
    if (!activeShip || !targetShipId) return;
    const fired = fireBroadside(activeShip.id, targetShipId, combatState);
    if (fired) {
      triggerUpdate();
    }
  };

  const handleBoard = () => {
    if (!activeShip || !targetShipId) return;
    boardShip(activeShip.id, targetShipId, combatState);
    triggerUpdate();
  };

  const handleEndTurn = () => {
    endActiveShipTurn(combatState);
    setSelectedHex(null);
    setTargetShipId(null);
    triggerUpdate();
  };

  const handleFlee = () => {
    if (!activeShip) return;
    fleeShip(activeShip.id, combatState);
    triggerUpdate();
  };

  const handleDuelConcluded = (winner: 'player' | 'enemy') => {
    if (winner === 'player') {
      combatState.ships.filter((s) => s.team === 'enemy').forEach((s) => {
        s.isSurrendered = true;
      });
      combatState.duelState = null;
      checkCombatEnd(combatState);
    } else {
      combatState.phase = 'defeat';
      combatState.duelState = null;
    }
    triggerUpdate();
  };

  const handleApplyFleetPlan = (plan: FleetPlan) => {
    setFleetPlan(plan, combatState);
    setShowPlanMenu(false);
    triggerUpdate();
  };

  const handleApplyConsortOrder = (consortId: string, tactic: 'cannon' | 'board' | 'escape' | 'auto') => {
    setConsortOrder(consortId, { targetShipId, tactic }, combatState);
    setShowOrderMenu(false);
    triggerUpdate();
  };

  const handleCommissionPrize = (prizeId: string, mateSailorId: string) => {
    commissionPrizeShip(prizeId, mateSailorId, combatState);
    triggerUpdate();
  };

  const handleScuttlePrize = (prizeId: string) => {
    scuttlePrizeShip(prizeId, combatState);
    triggerUpdate();
  };

  const handleFinishBattle = (
    victory: boolean,
    outcome: 'victory' | 'defeat' | 'escaped' = victory ? 'victory' : 'defeat',
  ) => {
    finalizeCombatResults(victory, combatState);
    onCombatConcluded(victory, outcome);
  };

  const selectedTarget = combatState.ships.find((s) => s.id === targetShipId);
  const canFire = activeShip && selectedTarget ? canFireCannonsAt(activeShip, selectedTarget).canFire : false;
  const canBoard = activeShip && selectedTarget ? canBoardShip(activeShip, selectedTarget) : false;
  const canMoveSelected = activeShip && selectedHex ? canMoveToHex(activeShip, selectedHex, combatState).valid : false;
  const isBoundaryHex = activeShip ? activeShip.hex.q <= 1 || activeShip.hex.q >= combatState.boardWidth - 2 || activeShip.hex.r <= 1 || activeShip.hex.r >= combatState.boardHeight - 2 : false;

  const availableMates = (state.mates || []).filter((m) => m.role === null);

  return (
    <div className="relative w-[1280px] h-[800px] bg-slate-950 flex flex-col select-none font-sans overflow-hidden text-neutral-100">
      {/* 1. Authentic Tactical Header Bar */}
      <div className="px-5 py-2 bg-neutral-900 border-b border-amber-900/40 flex justify-between items-center text-xs">
        <div className="flex items-center gap-3">
          <span className="text-lg">⚔️</span>
          <span className="font-bold tracking-widest text-amber-400 uppercase font-serif text-sm">
            Koei Naval Battlefield • Round {combatState.round}
          </span>
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
            combatState.phase === 'player_turn'
              ? 'bg-blue-900/70 text-blue-300 border border-blue-600'
              : 'bg-red-900/70 text-red-300 border border-red-600'
          }`}>
            {combatState.phase === 'player_turn' ? 'FLAGSHIP ORDERS' : 'ENEMY FLEET MANEUVERING...'}
          </span>
          <span className="text-neutral-400">
            Ammunition: <strong className="text-yellow-400 font-mono">{totalPlayerShot} Shot</strong>
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <span>Fleet Directive: <strong className="text-amber-300 uppercase">{combatState.fleetPlan.replace('_', ' ')}</strong></span>
          <span>Grid: <strong className="text-neutral-300">52 × 48 Hexes</strong></span>
        </div>
      </div>

      {/* 2. Main Dual-Viewport Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main 13x12 Tactical Viewport Canvas */}
        <div className="flex-1 relative bg-slate-950 flex items-center justify-center p-2">
          <canvas
            ref={mainCanvasRef}
            width={780}
            height={720}
            onClick={handleMainCanvasClick}
            className="rounded-lg border-2 border-amber-950/70 shadow-2xl cursor-crosshair"
          />
        </div>

        {/* Right Tactical Sidebar (440px) */}
        <div className="w-[450px] bg-neutral-900/95 border-l border-amber-900/40 flex flex-col p-3 space-y-2.5 overflow-y-auto text-xs">
          {/* Battlefield Minimap */}
          <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 shadow-inner">
            <div className="flex justify-between items-center mb-1 text-[11px] text-neutral-400 font-semibold">
              <span>BATTLEFIELD RADAR (52 × 48)</span>
              <span className="font-mono text-amber-400">
                Cam: ({combatState.viewport.viewCol}, {combatState.viewport.viewRow})
              </span>
            </div>
            <canvas
              ref={miniMapCanvasRef}
              width={420}
              height={180}
              onClick={handleMiniMapClick}
              className="w-full rounded border border-neutral-800 cursor-pointer"
            />
          </div>

          {/* Wind & Weather Rose */}
          <div className="p-2.5 bg-neutral-950/90 rounded-lg border border-neutral-800 flex justify-between items-center font-mono">
            <div>
              <span className="text-neutral-400 text-[11px] block">WIND BEARING</span>
              <span className="text-amber-300 font-bold text-sm">
                🧭 {KOEI_HEADING_NAMES[combatState.wind.direction]} ({combatState.wind.speed} Knots)
              </span>
            </div>
            <div className="text-right">
              <span className="text-neutral-400 text-[11px] block">TACTICAL HEADING</span>
              <span className="text-lime-400 font-bold text-sm">
                {activeShip ? KOEI_HEADING_NAMES[activeShip.heading] : 'N/A'}
              </span>
            </div>
          </div>

          {/* Active Ship Status Card */}
          {activeShip && (
            <div className="p-3 bg-neutral-950 rounded-lg border border-amber-900/50 shadow">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-bold text-sm text-yellow-400">
                    {activeShip.isFlagship ? '★ ' : ''}{activeShip.name}
                  </span>
                  <div className="text-[11px] text-neutral-400">
                    Capt: {activeShip.captainName} • Lvl {activeShip.battleLevel}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  activeShip.team === 'player' ? 'bg-blue-900/60 text-blue-300' : 'bg-red-900/60 text-red-300'
                }`}>
                  {activeShip.team.toUpperCase()}
                </span>
              </div>

              {/* Gauges */}
              <div className="space-y-1.5 font-mono text-[11px]">
                <div>
                  <div className="flex justify-between text-neutral-300">
                    <span>Durability (Hull):</span>
                    <span className="text-amber-400 font-bold">
                      {activeShip.durability} / {activeShip.maxDurability}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-0.5">
                    <div
                      className="h-full bg-amber-500"
                      style={{ width: `${(activeShip.durability / activeShip.maxDurability) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-neutral-300">
                  <span>Crew Complement:</span>
                  <span className="text-emerald-400 font-bold">{activeShip.crew} / {activeShip.maxCrew}</span>
                </div>

                <div className="flex justify-between text-neutral-300">
                  <span>Artillery:</span>
                  <span className="text-yellow-400 font-bold">
                    {activeShip.guns} Guns ({activeShip.cannonType})
                  </span>
                </div>

                <div className="flex justify-between text-neutral-300">
                  <span>Movement Points (MP):</span>
                  <span className="text-blue-400 font-bold">{activeShip.movementPoints} MP</span>
                </div>

                {activeShip.riggingHealth && activeShip.riggingHealth < 100 && (
                  <div className="text-red-400 text-[10px]">
                    ⚠️ Rigging Damage: {activeShip.riggingHealth}% (-1 MP Penalty)
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Command Controls */}
          {activeShip && activeShip.team === 'player' && combatState.phase === 'player_turn' && !activeShip.hasActed && (
            <div className="space-y-1.5 pt-1">
              <div className="grid grid-cols-2 gap-1.5 font-bold text-xs">
                <button
                  type="button"
                  onClick={handleMove}
                  disabled={!canMoveSelected}
                  className={`py-2 px-3 rounded border text-center transition-all ${
                    canMoveSelected
                      ? 'bg-emerald-700 hover:bg-emerald-600 border-emerald-500 text-white cursor-pointer shadow'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  🧭 Maneuver ({selectedHex ? `(${selectedHex.q}, ${selectedHex.r})` : 'Select Hex'})
                </button>

                <button
                  type="button"
                  onClick={handleFire}
                  disabled={!canFire || totalPlayerShot <= 0}
                  className={`py-2 px-3 rounded border text-center transition-all ${
                    canFire && totalPlayerShot > 0
                      ? 'bg-amber-600 hover:bg-amber-500 border-amber-400 text-white cursor-pointer shadow animate-pulse'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  💥 Broadside Fire
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5 font-bold text-xs">
                <button
                  type="button"
                  onClick={handleBoard}
                  disabled={!canBoard}
                  className={`py-2 px-3 rounded border text-center transition-all ${
                    canBoard
                      ? 'bg-red-700 hover:bg-red-600 border-red-500 text-white cursor-pointer shadow animate-pulse'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  ⚔️ Board & Duel
                </button>

                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleRotate(false)}
                    disabled={activeShip.movementPoints < 1}
                    className="flex-1 py-2 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-amber-200 cursor-pointer"
                    title="Rotate Port"
                  >
                    ↺ Port
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRotate(true)}
                    disabled={activeShip.movementPoints < 1}
                    className="flex-1 py-2 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-amber-200 cursor-pointer"
                    title="Rotate Starboard"
                  >
                    Starboard ↻
                  </button>
                </div>
              </div>

              {/* Flagship Tactics: Plan & Order Menus */}
              {activeShip.isFlagship && (
                <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setShowPlanMenu(!showPlanMenu)}
                    className="py-1.5 px-2 rounded bg-amber-950/70 hover:bg-amber-900 border border-amber-700 text-amber-300 cursor-pointer"
                  >
                    🚩 Flagship Plan (全体方針)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOrderMenu(!showOrderMenu)}
                    className="py-1.5 px-2 rounded bg-amber-950/70 hover:bg-amber-900 border border-amber-700 text-amber-300 cursor-pointer"
                  >
                    🎯 Consort Order (個別指示)
                  </button>
                </div>
              )}

              {/* Plan Drawer */}
              {showPlanMenu && (
                <div className="p-2.5 rounded bg-neutral-950 border border-amber-800/80 space-y-1.5">
                  <div className="text-[11px] font-bold text-amber-300">Set Fleet Strategy Directive:</div>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => handleApplyFleetPlan('attack')}
                      className="py-1 px-1.5 rounded bg-neutral-800 hover:bg-amber-900 border border-neutral-700 text-[10px] text-amber-200"
                    >
                      ⚔️ Attack & Chase
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyFleetPlan('defend_flagship')}
                      className="py-1 px-1.5 rounded bg-neutral-800 hover:bg-amber-900 border border-neutral-700 text-[10px] text-amber-200"
                    >
                      🛡️ Defend Flagship
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyFleetPlan('flee')}
                      className="py-1 px-1.5 rounded bg-neutral-800 hover:bg-amber-900 border border-neutral-700 text-[10px] text-amber-200"
                    >
                      💨 All Disengage
                    </button>
                  </div>
                </div>
              )}

              {/* Order Drawer */}
              {showOrderMenu && (
                <div className="p-2.5 rounded bg-neutral-950 border border-amber-800/80 space-y-2">
                  <div className="text-[11px] font-bold text-amber-300">Issue Specific Consort Directive:</div>
                  <select
                    value={selectedConsortId || ''}
                    onChange={(e) => setSelectedConsortId(e.target.value)}
                    className="w-full bg-neutral-800 text-amber-100 rounded px-2 py-1 text-xs border border-neutral-700"
                  >
                    <option value="">-- Choose Consort Ship --</option>
                    {combatState.ships
                      .filter((s) => s.team === 'player' && !s.isFlagship && !s.isSunk)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (Capt: {s.captainName})
                        </option>
                      ))}
                  </select>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      disabled={!selectedConsortId}
                      onClick={() => handleApplyConsortOrder(selectedConsortId!, 'cannon')}
                      className="py-1 px-1.5 rounded bg-neutral-800 hover:bg-amber-900 border border-neutral-700 text-[10px] text-amber-200 disabled:opacity-50"
                    >
                      💥 Fire Broadside
                    </button>
                    <button
                      type="button"
                      disabled={!selectedConsortId}
                      onClick={() => handleApplyConsortOrder(selectedConsortId!, 'board')}
                      className="py-1 px-1.5 rounded bg-neutral-800 hover:bg-amber-900 border border-neutral-700 text-[10px] text-amber-200 disabled:opacity-50"
                    >
                      ⚔️ Rush & Board
                    </button>
                    <button
                      type="button"
                      disabled={!selectedConsortId}
                      onClick={() => handleApplyConsortOrder(selectedConsortId!, 'escape')}
                      className="py-1 px-1.5 rounded bg-neutral-800 hover:bg-amber-900 border border-neutral-700 text-[10px] text-amber-200 disabled:opacity-50"
                    >
                      💨 Flee Field
                    </button>
                  </div>
                </div>
              )}

              {/* Turn Completion & Perimeter Flee */}
              <div className="flex gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={handleEndTurn}
                  className="flex-1 py-2 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 font-bold cursor-pointer text-xs"
                >
                  ⏸️ Stand Fast / End Turn
                </button>
                {isBoundaryHex && (
                  <button
                    type="button"
                    onClick={handleFlee}
                    className="py-2 px-3 rounded bg-red-950 hover:bg-red-900 border border-red-700 text-red-200 font-bold cursor-pointer text-xs"
                  >
                    💨 Flee Battle
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 16-Bit Parchment Battle Log */}
          <div className="flex-1 min-h-[140px] bg-neutral-950 rounded-lg border border-neutral-800 p-2.5 overflow-y-auto font-mono text-[11px] text-neutral-300 space-y-1">
            {combatState.log.map((entry, idx) => (
              <div
                key={idx}
                className={idx === 0 ? 'text-yellow-300 font-bold' : 'text-neutral-400'}
              >
                {entry}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. 1v1 Sword Duel Modal */}
      {combatState.phase === 'duel' && combatState.duelState && (
        <SwordDuelModal
          duelState={combatState.duelState}
          onDuelConcluded={handleDuelConcluded}
        />
      )}

      {/* 4. Authentic Post-Battle Prize Ship Capture Modal */}
      {combatState.phase === 'prize_capture' && combatState.spoils && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 select-none font-sans">
          <div className="max-w-2xl w-full bg-neutral-900 border-2 border-yellow-500 rounded-2xl p-6 text-center shadow-[0_0_60px_rgba(234,179,8,0.4)] flex flex-col max-h-[90vh]">
            <div className="text-4xl mb-2">🏆</div>
            <h2 className="text-2xl font-extrabold text-yellow-400 uppercase tracking-widest font-serif mb-1">
              Naval Victory — Prize Vessel Capture
            </h2>
            <p className="text-neutral-300 text-xs mb-4">
              The enemy fleet has struck their colors! Inspect captured vessels, commission hulls, or salvage cargo.
            </p>

            {/* Captured Prize Ships Roster */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 text-left">
              {combatState.spoils.capturedPrizeShips && combatState.spoils.capturedPrizeShips.length > 0 ? (
                combatState.spoils.capturedPrizeShips.map((prize) => (
                  <div
                    key={prize.id}
                    className={`p-3 rounded-xl border text-xs flex justify-between items-center ${
                      prize.assignedMateId
                        ? 'bg-blue-950/40 border-blue-500/70 text-blue-200'
                        : prize.isScuttled
                        ? 'bg-neutral-950/50 border-neutral-800 text-neutral-500 line-through'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-yellow-400">{prize.name}</div>
                      <div className="text-neutral-400 text-[11px] font-mono">
                        Hull: {prize.durability}/{prize.maxDurability} • Guns: {prize.guns} • Surviving Sailors: {prize.survivingCrew}
                      </div>
                      <div className="text-[10px] text-amber-300/80 mt-0.5">
                        Cargo: {prize.cargo.map((c) => `${c.quantity} ${c.type}`).join(', ')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!prize.assignedMateId && !prize.isScuttled && (
                        <>
                          {availableMates.length > 0 && playerFlagship && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) handleCommissionPrize(prize.id, e.target.value);
                              }}
                              defaultValue=""
                              className="bg-neutral-800 text-amber-200 text-xs px-2 py-1.5 rounded border border-neutral-700"
                            >
                              <option value="" disabled>🚩 Assign Mate...</option>
                              {availableMates.map((m) => (
                                <option key={m.sailorId} value={m.sailorId}>
                                  Mate {m.sailorId}
                                </option>
                              ))}
                            </select>
                          )}
                          <button
                            type="button"
                            onClick={() => handleScuttlePrize(prize.id)}
                            className="py-1.5 px-3 rounded bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs"
                          >
                            ⚓ Loot & Scuttle
                          </button>
                        </>
                      )}
                      {prize.assignedMateId && (
                        <span className="text-blue-400 font-bold text-xs">✓ Commissioned to Fleet</span>
                      )}
                      {prize.isScuttled && (
                        <span className="text-neutral-500 text-xs">✓ Cargo Salvaged</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-neutral-400 text-xs italic">
                  All enemy vessels were sunk during broadside exchanges.
                </div>
              )}
            </div>

            {/* Plunder Overview Card */}
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-xs font-mono mb-4 text-left grid grid-cols-3 gap-2">
              <div>
                <span className="text-neutral-400 block text-[10px]">GOLD PLUNDER:</span>
                <span className="text-yellow-400 font-bold text-sm">+{combatState.spoils.gold} Gold</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px]">PIRACY FAME:</span>
                <span className="text-blue-400 font-bold text-sm">+{combatState.spoils.fame} Fame</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px]">FLEET MORALE:</span>
                <span className="text-emerald-400 font-bold text-sm">100% Victorious</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleFinishBattle(true, 'victory')}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold rounded-xl transition-all cursor-pointer shadow text-sm tracking-wider uppercase"
            >
              Claim All Spoils & Return to High Seas
            </button>
          </div>
        </div>
      )}

      {/* 5. Defeat Modal */}
      {combatState.phase === 'defeat' && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 select-none font-sans">
          <div className="max-w-md w-full bg-neutral-900 border-2 border-red-600 rounded-2xl p-6 text-center shadow-[0_0_50px_rgba(220,38,38,0.5)]">
            <div className="text-5xl mb-3">☠️</div>
            <h2 className="text-2xl font-extrabold text-red-500 uppercase tracking-widest font-serif mb-1">
              Fleet Defeated & Sunk
            </h2>
            <p className="text-neutral-300 text-xs mb-6">
              Your flagship was overpowered by hostile gunfire. The fleet has scattered across the ocean.
            </p>
            <button
              type="button"
              onClick={() => handleFinishBattle(false, 'defeat')}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all cursor-pointer shadow"
            >
              Acknowledge Defeat
            </button>
          </div>
        </div>
      )}

      {/* 6. Disengaged & Escaped Modal */}
      {combatState.phase === 'escaped' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 select-none font-sans">
          <div className="max-w-md w-full bg-neutral-900 border-2 border-sky-500 rounded-2xl p-6 text-center shadow-[0_0_50px_rgba(14,165,233,0.4)]">
            <div className="text-5xl mb-3">💨</div>
            <h2 className="text-2xl font-extrabold text-sky-400 uppercase tracking-widest font-serif mb-1">
              Disengaged & Escaped
            </h2>
            <p className="text-neutral-300 text-xs mb-6">
              Your flagship reached the outer boundary and slipped away beyond the horizon. The hostile raiders have lost your trail.
            </p>
            <button
              type="button"
              onClick={() => handleFinishBattle(false, 'escaped')}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-all cursor-pointer shadow text-sm tracking-wide font-sans uppercase"
            >
              Return to High Seas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
