import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import state from '../../state/state';
import explorationManager, {
  SECTORS_X,
  SECTORS_Y,
  SECTOR_SIZE,
} from '../../game/world/explorationManager';
import { calculateSightRadius } from '../../game/world/fogOfWarRenderer';
import { regularPorts, supplyPorts } from '../../data/portData';
import { discoveries } from '../../data/discoveryData';
import { XMarkIcon, EyeIcon } from '@heroicons/react/24/solid';
import autopilotManager, { AutopilotCourse } from '../../game/world/autopilotManager';
import { positionAdjacentToPort } from '../../state/selectors';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function WorldAtlasModal({ isOpen, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showPorts, setShowPorts] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [hoverInfo, setHoverInfo] = useState<string | null>(null);
  const [hoveredPort, setHoveredPort] = useState<any | null>(null);
  const [selectedPortForCourse, setSelectedPortForCourse] = useState<any | null>(null);
  const [enterPortOnArrival, setEnterPortOnArrival] = useState<boolean>(true);
  const [activeCourse, setActiveCourse] = useState<AutopilotCourse | null>(autopilotManager.getCourse());
  const [, setTick] = useState(0);

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasDraggedRef = useRef<boolean>(false);

  const isDockedInPort = Boolean(state.portId);

  useEffect(() => {
    return autopilotManager.subscribe(() => {
      setActiveCourse(autopilotManager.getCourse());
      setTick((t) => t + 1);
    });
  }, []);

  const stats = useMemo(() => explorationManager.getExplorationProgress(), [isOpen]);
  const sightBreakdown = useMemo(() => calculateSightRadius(), [isOpen]);

  const playerFleet = state.fleets[1] || state.fleets['1'];
  const playerPos = playerFleet?.position || { x: 840, y: 358 };

  // Calculate destination coordinate and prospective charted route
  const destinationPos = useMemo(() => {
    if (!selectedPortForCourse) return null;
    try {
      return positionAdjacentToPort(selectedPortForCourse.id);
    } catch {
      return { ...selectedPortForCourse.position };
    }
  }, [selectedPortForCourse]);

  const courseRoute = useMemo(() => {
    if (!selectedPortForCourse || !destinationPos) return null;
    return autopilotManager.findPath(playerPos, destinationPos, true);
  }, [selectedPortForCourse, destinationPos, playerPos]);

  const isRouteCharted = Boolean(courseRoute && courseRoute.length >= 2);

  const routeDist = useMemo(() => {
    if (!courseRoute || courseRoute.length < 2) return null;
    let dist = 0;
    for (let i = 0; i < courseRoute.length - 1; i++) {
      let dx = Math.abs(courseRoute[i + 1].x - courseRoute[i].x);
      if (dx > 1080) dx = 2160 - dx;
      const dy = Math.abs(courseRoute[i + 1].y - courseRoute[i].y);
      dist += Math.hypot(dx, dy);
    }
    return Math.round(dist);
  }, [courseRoute]);

  // Helper: Clamp pan within canvas bounds
  const clampPan = useCallback((px: number, py: number, currentZoom: number) => {
    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 1080;
    const height = canvas ? canvas.height : 540;
    if (currentZoom <= 1.0) {
      return { x: 0, y: 0 };
    }
    const minX = width * (1 - currentZoom);
    const minY = height * (1 - currentZoom);
    return {
      x: Math.max(minX, Math.min(0, px)),
      y: Math.max(minY, Math.min(0, py)),
    };
  }, []);

  // Zoom Controls
  const handleZoomChange = (delta: number) => {
    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 1080;
    const height = canvas ? canvas.height : 540;
    const newZoom = Math.max(1.0, Math.min(4.0, Number((zoom + delta).toFixed(2))));
    if (newZoom === 1.0) {
      setZoom(1.0);
      setPanOffset({ x: 0, y: 0 });
      return;
    }
    const centerX = width / 2;
    const centerY = height / 2;
    const worldFractionX = (centerX - panOffset.x) / (width * zoom);
    const worldFractionY = (centerY - panOffset.y) / (height * zoom);
    const newPanX = centerX - worldFractionX * width * newZoom;
    const newPanY = centerY - worldFractionY * height * newZoom;
    setZoom(newZoom);
    setPanOffset(clampPan(newPanX, newPanY, newZoom));
  };

  const handleResetZoom = () => {
    setZoom(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleCenterFlagship = () => {
    const targetZoom = 2.5;
    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 1080;
    const height = canvas ? canvas.height : 540;
    const screenX = (playerPos.x / 2160) * width * targetZoom;
    const screenY = (playerPos.y / 1080) * height * targetZoom;
    const targetPanX = width / 2 - screenX;
    const targetPanY = height / 2 - screenY;
    setZoom(targetZoom);
    setPanOffset(clampPan(targetPanX, targetPanY, targetZoom));
  };

  // Re-render map when opened, zoom/pan changed, or options toggled
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.save();

    // 0. Base dark viewport fill
    ctx.fillStyle = '#14100c';
    ctx.fillRect(0, 0, width, height);

    // 1. Apply Zoom & Pan Transformation
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // 2. Antique Parchment Canvas Background
    ctx.fillStyle = '#caa979';
    ctx.fillRect(0, 0, width, height);

    // 3. Render 108x54 Chunky Nautical Sectors
    const sectorW = width / SECTORS_X;
    const sectorH = height / SECTORS_Y;

    for (let sy = 0; sy < SECTORS_Y; sy++) {
      for (let sx = 0; sx < SECTORS_X; sx++) {
        const isExplored = explorationManager.isSectorExplored(sx, sy);
        const px = sx * sectorW;
        const py = sy * sectorH;

        if (isExplored) {
          // Explored waters: deep oceanic blue
          ctx.fillStyle = '#1e3852';
          ctx.fillRect(px, py, sectorW, sectorH);

          // Subtle sector gridlines
          ctx.strokeStyle = '#2b4d6e';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px, py, sectorW, sectorH);
        } else {
          // Uncharted Terra Incognita: Antique Sepia Parchment
          const mottled = ((sx * 7 + sy * 13) % 5) * 3;
          ctx.fillStyle = `rgb(${198 - mottled}, ${170 - mottled}, ${128 - mottled})`;
          ctx.fillRect(px, py, sectorW, sectorH);

          // Faint vintage cartography stippling
          if ((sx + sy) % 9 === 0) {
            ctx.fillStyle = 'rgba(120, 95, 60, 0.15)';
            ctx.fillRect(px + 1, py + 1, sectorW - 2, sectorH - 2);
          }
        }
      }
    }

    // 4. Render Discovered Ports if toggled
    if (showPorts) {
      const allPorts = [
        ...regularPorts.map((p, i) => ({ ...p, id: String(i + 1), isSupply: false })),
        ...supplyPorts.map((p, i) => ({ ...p, id: String(101 + i), isSupply: true })),
      ];

      allPorts.forEach((port) => {
        const isExplored = explorationManager.isPositionExplored(
          port.position.x,
          port.position.y,
        );
        if (!isExplored) return; // Hidden in fog of war!

        const px = (port.position.x / 2160) * width;
        const py = (port.position.y / 1080) * height;

        ctx.fillStyle = port.isSupply ? '#10b981' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Level-of-Detail (LOD): Render port typography at regional zoom (>= 1.75x)
        if (zoom >= 1.75) {
          ctx.font = 'bold 8px Georgia, serif';
          ctx.fillStyle = port.isSupply ? '#a7f3d0' : '#fef08a';
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
          ctx.lineWidth = 2.0;
          ctx.strokeText(port.name, px + 4, py + 3);
          ctx.fillText(port.name, px + 4, py + 3);
        }
      });
    }

    // 5. Render Discovered Landmarks if toggled
    if (showLandmarks && state.discoveries) {
      discoveries.forEach((disc) => {
        if (!state.discoveries.includes(disc.id)) return;

        const px = (disc.position.x / 2160) * width;
        const py = (disc.position.y / 1080) * height;

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Level-of-Detail (LOD): Render landmark name at regional zoom (>= 1.75x)
        if (zoom >= 1.75) {
          ctx.font = 'bold 8px Georgia, serif';
          ctx.fillStyle = '#fca5a5';
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
          ctx.lineWidth = 2.0;
          ctx.strokeText(disc.name, px + 5, py + 3);
          ctx.fillText(disc.name, px + 5, py + 3);
        }
      });
    }

    // 6. Render Flagship Position & Visual Horizon
    const shipPx = (playerPos.x / 2160) * width;
    const shipPy = (playerPos.y / 1080) * height;

    // Sight radius circle on atlas
    const sightAtlasRadius = (sightBreakdown.finalRadiusTiles / 2160) * width;
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.7)';
    ctx.lineWidth = 1.5 / Math.sqrt(zoom);
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.arc(shipPx, shipPy, Math.max(8, sightAtlasRadius * 2.5), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Golden Ship Pin
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(shipPx, shipPy, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pulse ring
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.lineWidth = 2 / Math.sqrt(zoom);
    ctx.beginPath();
    ctx.arc(shipPx, shipPy, 8, 0, Math.PI * 2);
    ctx.stroke();

    // 7. Render Plotted Autopilot Route (Active or Selected Preview)
    const activeRoute = autopilotManager.getPlottedRoute();
    const routeToDraw = selectedPortForCourse && courseRoute ? courseRoute : activeRoute;
    const isPreview = Boolean(selectedPortForCourse && courseRoute);

    if (routeToDraw && routeToDraw.length > 1) {
      ctx.save();
      ctx.strokeStyle = isPreview ? '#38bdf8' : '#f59e0b';
      ctx.lineWidth = 2.0 / Math.sqrt(zoom);
      ctx.setLineDash([4, 4]);

      for (let i = 0; i < routeToDraw.length - 1; i++) {
        const p1 = routeToDraw[i];
        const p2 = routeToDraw[i + 1];

        // Cylindrical line drawing (skip if seam crossing)
        if (Math.abs(p1.x - p2.x) < 1080) {
          const x1 = (p1.x / 2160) * width;
          const y1 = (p1.y / 1080) * height;
          const x2 = (p2.x / 2160) * width;
          const y2 = (p2.y / 1080) * height;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        // Draw waypoint node
        const wpX = (p2.x / 2160) * width;
        const wpY = (p2.y / 1080) * height;
        ctx.fillStyle = isPreview ? '#7dd3fc' : '#fbbf24';
        ctx.beginPath();
        ctx.arc(wpX, wpY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }, [isOpen, showPorts, showLandmarks, playerPos, sightBreakdown, activeCourse, zoom, panOffset, selectedPortForCourse, courseRoute]);

  const findNearbyPortAtCoords = (worldX: number, worldY: number) => {
    const allPorts = [
      ...regularPorts.map((p, i) => ({ ...p, id: String(i + 1), isSupply: false })),
      ...supplyPorts.map((p, i) => ({ ...p, id: String(101 + i), isSupply: true })),
    ];

    return allPorts.find((port) => {
      if (!explorationManager.isPositionExplored(port.position.x, port.position.y)) {
        return false;
      }
      let dx = Math.abs(port.position.x - worldX);
      if (dx > 1080) dx = 2160 - dx;
      const dy = Math.abs(port.position.y - worldY);
      return Math.hypot(dx, dy) <= 28;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') {
        if (selectedPortForCourse) {
          setSelectedPortForCourse(null);
          return;
        }
        if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, selectedPortForCourse]);

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.25 : 0.8;
    const newZoom = Math.max(1.0, Math.min(4.0, Number((zoom * zoomFactor).toFixed(2))));
    if (newZoom === 1.0) {
      setZoom(1.0);
      setPanOffset({ x: 0, y: 0 });
      return;
    }

    const worldFractionX = (mx - panOffset.x) / (canvas.width * zoom);
    const worldFractionY = (my - panOffset.y) / (canvas.height * zoom);
    const newPanX = mx - worldFractionX * canvas.width * newZoom;
    const newPanY = my - worldFractionY * canvas.height * newZoom;
    setZoom(newZoom);
    setPanOffset(clampPan(newPanX, newPanY, newZoom));
  };

  // Mouse Drag to Pan
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDraggingRef.current && zoom > 1.0) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.hypot(dx, dy) > 4) {
        hasDraggedRef.current = true;
      }
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      setPanOffset((prev) => clampPan(prev.x + dx, prev.y + dy, zoom));
    }

    // Accurate coordinate transform taking zoom & pan into account
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rawWorldX = Math.round(((x - panOffset.x) / (canvas.width * zoom)) * 2160);
    const rawWorldY = Math.round(((y - panOffset.y) / (canvas.height * zoom)) * 1080);
    const worldX = ((rawWorldX % 2160) + 2160) % 2160;
    const worldY = Math.max(0, Math.min(1080, rawWorldY));

    const isExplored = explorationManager.isPositionExplored(worldX, worldY);
    const nearbyPort = findNearbyPortAtCoords(worldX, worldY);
    setHoveredPort(nearbyPort || null);

    if (nearbyPort) {
      setHoverInfo(
        `⚓ ${nearbyPort.name} (${nearbyPort.isSupply ? 'Supply Haven' : 'Trade Port'}) • [Click to Plot Autopilot Course]`,
      );
      return;
    }

    const latDeg = Math.abs(Math.round(((540 - worldY) / 540) * 80));
    const latHem = worldY <= 540 ? 'N' : 'S';
    const lonDeg = Math.abs(Math.round(((worldX - 1080) / 1080) * 180));
    const lonHem = worldX >= 1080 ? 'E' : 'W';

    setHoverInfo(
      `${latDeg}°${latHem}, ${lonDeg}°${lonHem} • Sector: (${Math.floor(worldX / SECTOR_SIZE)}, ${Math.floor(worldY / SECTOR_SIZE)}) • ${isExplored ? '🌊 Charted Waters' : '📜 Terra Incognita'}`,
    );
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
    setHoverInfo(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // If dragging across map, don't trigger click action
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rawWorldX = Math.round(((x - panOffset.x) / (canvas.width * zoom)) * 2160);
    const rawWorldY = Math.round(((y - panOffset.y) / (canvas.height * zoom)) * 1080);
    const worldX = ((rawWorldX % 2160) + 2160) % 2160;
    const worldY = Math.max(0, Math.min(1080, rawWorldY));

    const clickedPort = findNearbyPortAtCoords(worldX, worldY);
    if (clickedPort) {
      setSelectedPortForCourse(clickedPort);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none animate-fadeIn">
      <div className="relative w-[1140px] max-w-full bg-[#1b150e] border-4 border-[#8c6f4b] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#e6d5b8] font-mono">
        {/* Header */}
        <div className="bg-[#291e13] px-6 py-3 border-b-2 border-[#8c6f4b] flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🗺️</span>
            <div>
              <div className="font-serif font-bold text-lg text-amber-200 tracking-wider">
                CHARTA UNIVERSALIS • IMPERIAL MARITIME ATLAS
              </div>
              <div className="text-[11px] text-amber-400/80">
                Royal Cartographic Society • Year of Our Lord 1522
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Fleet Status Badge */}
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="text-neutral-400">Fleet Status:</span>
              <span
                className={`px-2 py-0.5 rounded font-bold uppercase border ${
                  isDockedInPort
                    ? 'bg-amber-950/80 border-amber-600/70 text-amber-300'
                    : 'bg-blue-950/80 border-blue-600/70 text-blue-300'
                }`}
              >
                {isDockedInPort ? '⚓ Docked in Harbor' : '🌊 Underway at Sea'}
              </span>
            </div>

            <div className="text-right text-xs">
              <span className="text-neutral-400">Explored: </span>
              <span className="text-yellow-300 font-bold">{stats.percentage}%</span>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded bg-[#3d2e1e] hover:bg-[#523e28] text-amber-300 transition-colors border border-[#8c6f4b]"
              title="Close Atlas (Esc)"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Active Course Banner if engaged */}
        {activeCourse && (
          <div className="bg-amber-950/90 border-b border-amber-600/60 px-6 py-2 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center space-x-2">
              <span className="text-base animate-pulse">🧭</span>
              <span>
                <strong>Active Autopilot Course:</strong> Sailing to{' '}
                <span className="text-yellow-300 font-bold">{activeCourse.portName}</span> (~{activeCourse.totalDistanceLeagues} Leagues, ~{activeCourse.estimatedDays} Days)
              </span>
              <span className="px-1.5 py-0.5 rounded bg-black/50 text-[10px] text-amber-300 border border-amber-600/40">
                {activeCourse.enterPortOnArrival ? '⚓ Auto-Dock' : '🌊 Roadstead Anchor'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => autopilotManager.cancelCourse('Autopilot cancelled by captain.')}
              className="px-2.5 py-0.5 rounded bg-red-950 hover:bg-red-900 border border-red-600 text-red-200 font-bold text-[11px] transition-colors cursor-pointer"
            >
              ⏹️ Disengage Helm
            </button>
          </div>
        )}

        {/* Map Viewport Area */}
        <div className="relative p-4 bg-[#14100c] flex flex-col items-center">
          <div className="relative border-2 border-[#6d5538] shadow-inner rounded overflow-hidden">
            {/* Canvas */}
            <canvas
              ref={canvasRef}
              width={1080}
              height={540}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onClick={handleClick}
              className={`block ${
                hoveredPort
                  ? 'cursor-pointer'
                  : zoom > 1.0
                  ? isDraggingRef.current
                    ? 'cursor-grabbing'
                    : 'cursor-grab'
                  : 'cursor-crosshair'
              }`}
            />

            {/* Floating Zoom & Pan Toolbar */}
            <div className="absolute top-3 right-3 flex items-center space-x-1.5 bg-[#1e150d]/90 backdrop-blur-md border border-[#8c6f4b]/80 rounded-lg p-1.5 shadow-xl z-10 text-xs select-none">
              <button
                type="button"
                onClick={() => handleZoomChange(-0.5)}
                disabled={zoom <= 1.0}
                className="w-7 h-7 flex items-center justify-center rounded bg-[#2e2014] hover:bg-[#422e1d] disabled:opacity-40 disabled:cursor-not-allowed text-amber-200 border border-[#8c6f4b]/50 font-bold text-sm transition-colors cursor-pointer"
                title="Zoom Out (-)"
              >
                −
              </button>

              <div className="px-2 py-0.5 min-w-[50px] text-center font-mono font-bold text-yellow-300 text-[11px] bg-black/60 rounded border border-amber-900/60">
                {Math.round(zoom * 100)}%
              </div>

              <button
                type="button"
                onClick={() => handleZoomChange(0.5)}
                disabled={zoom >= 4.0}
                className="w-7 h-7 flex items-center justify-center rounded bg-[#2e2014] hover:bg-[#422e1d] disabled:opacity-40 disabled:cursor-not-allowed text-amber-200 border border-[#8c6f4b]/50 font-bold text-sm transition-colors cursor-pointer"
                title="Zoom In (+)"
              >
                +
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                disabled={zoom === 1.0 && panOffset.x === 0 && panOffset.y === 0}
                className="px-2 h-7 flex items-center justify-center rounded bg-[#2e2014] hover:bg-[#422e1d] disabled:opacity-40 disabled:cursor-not-allowed text-amber-300 border border-[#8c6f4b]/50 text-[11px] font-bold transition-colors cursor-pointer"
                title="Reset View to 100% Full World"
              >
                ⟲ 100%
              </button>

              <button
                type="button"
                onClick={handleCenterFlagship}
                className="px-2 h-7 flex items-center justify-center rounded bg-amber-950/80 hover:bg-amber-900 text-yellow-300 border border-amber-600/60 text-[11px] font-bold transition-colors cursor-pointer flex items-center space-x-1"
                title="Center & Zoom on Flagship (2.5x)"
              >
                <span>🎯</span>
                <span>Ship</span>
              </button>
            </div>

            {/* Hover Coordinate / Port Tag */}
            {hoverInfo && (
              <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/85 border border-amber-600/70 rounded text-[11px] text-amber-200 font-mono shadow-md backdrop-blur-sm pointer-events-none">
                {hoverInfo}
              </div>
            )}

            {/* Zoom / Navigation Tip */}
            {zoom > 1.0 && (
              <div className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/75 border border-amber-800/60 rounded text-[10px] text-neutral-400 font-mono pointer-events-none">
                🖱️ Drag to pan • Scroll wheel to zoom
              </div>
            )}

            {/* Course Plotting Card Modal Overlay */}
            {selectedPortForCourse && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-20 animate-fadeIn">
                <div className="w-[450px] bg-[#291e13] border-2 border-amber-600 rounded-lg p-5 shadow-2xl text-amber-100 flex flex-col space-y-4">
                  <div className="flex justify-between items-center border-b border-amber-700/60 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">⚓</span>
                      <h3 className="font-serif font-bold text-base text-yellow-300 tracking-wide">
                        COURSE TO {selectedPortForCourse.name.toUpperCase()}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPortForCourse(null)}
                      className="text-amber-400 hover:text-white cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Warning if docked in harbor */}
                  {isDockedInPort && (
                    <div className="bg-amber-950/90 border border-amber-500/80 p-2.5 rounded text-xs text-amber-200 flex items-start space-x-2 shadow-inner">
                      <span className="text-base">⚠️</span>
                      <div>
                        <div className="font-bold text-yellow-300">Fleet is currently docked in port</div>
                        <div className="text-[10px] text-amber-200/80">
                          Autopilot can only be engaged while sailing at sea. Set sail from the harbor first.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Warning if uncharted waters block passage */}
                  {!isRouteCharted && !isDockedInPort && (
                    <div className="bg-amber-950/90 border border-amber-600/70 p-2.5 rounded text-xs text-amber-200 flex items-start space-x-2 shadow-inner">
                      <span className="text-base">📜</span>
                      <div>
                        <div className="font-bold text-yellow-300">Route Blocked by Uncharted Waters</div>
                        <div className="text-[10px] text-amber-200/80">
                          No charted sea passage connects your fleet to this port. You must explore the ocean manually (or acquire regional nautical charts) before autopilot can navigate.
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs space-y-2 bg-[#1b140c] p-3 rounded border border-amber-800/40">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Classification:</span>
                      <span className="font-semibold text-amber-200">
                        {selectedPortForCourse.isSupply ? 'Remote Supply Haven' : 'Chartered Trade Port'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Estimated Distance:</span>
                      <span className="font-semibold text-yellow-300">
                        {routeDist !== null
                          ? `~${routeDist} Nautical Leagues`
                          : '⚠️ Uncharted Passage'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Estimated Passage:</span>
                      <span className="font-semibold text-yellow-300">
                        {routeDist !== null
                          ? `~${Math.max(1, Math.round(routeDist / 18))} Sea Days`
                          : '⚠️ Uncharted Passage'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-amber-300 block">
                      ACTION UPON ARRIVAL AT DESTINATION:
                    </label>
                    <div className="space-y-1.5 text-xs">
                      <label className="flex items-start space-x-2.5 p-2 rounded bg-[#1e160e] border border-amber-800/50 hover:border-amber-500 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="arrivalMode"
                          checked={enterPortOnArrival}
                          onChange={() => setEnterPortOnArrival(true)}
                          className="mt-0.5 accent-amber-500 cursor-pointer"
                        />
                        <div>
                          <div className="font-bold text-amber-200">⚓ Enter Port Directly</div>
                          <div className="text-[10px] text-neutral-400">
                            Automatically docks into the harbor basin upon arrival.
                          </div>
                        </div>
                      </label>

                      <label className="flex items-start space-x-2.5 p-2 rounded bg-[#1e160e] border border-amber-800/50 hover:border-amber-500 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="arrivalMode"
                          checked={!enterPortOnArrival}
                          onChange={() => setEnterPortOnArrival(false)}
                          className="mt-0.5 accent-amber-500 cursor-pointer"
                        />
                        <div>
                          <div className="font-bold text-amber-200">🌊 Anchor in Roadstead (Remain in Ocean)</div>
                          <div className="text-[10px] text-neutral-400">
                            Halts ship in coastal waters outside port. Provisions continue consuming normally.
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-2 border-t border-amber-700/60">
                    <button
                      type="button"
                      onClick={() => setSelectedPortForCourse(null)}
                      className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isDockedInPort || !isRouteCharted}
                      onClick={() => {
                        if (isDockedInPort || !isRouteCharted) return;
                        autopilotManager.setCourse(selectedPortForCourse.id, enterPortOnArrival, true);
                        setSelectedPortForCourse(null);
                        onClose();
                      }}
                      className={`px-4 py-1.5 rounded font-bold text-xs shadow-lg transition-all ${
                        isDockedInPort || !isRouteCharted
                          ? 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed opacity-60'
                          : 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black cursor-pointer'
                      }`}
                    >
                      ⛵{' '}
                      {isDockedInPort
                        ? 'Autopilot Unavailable in Port'
                        : !isRouteCharted
                        ? 'Passage Uncharted'
                        : 'Engage Autopilot Course'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Controls & Cartographic Instruments */}
        <div className="bg-[#241a10] px-6 py-3 border-t-2 border-[#8c6f4b] flex justify-between items-center text-xs">
          {/* Left: Filter Toggles */}
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setShowPorts(!showPorts)}
              className={`px-2.5 py-1 rounded border flex items-center space-x-1.5 transition-colors ${
                showPorts
                  ? 'bg-amber-900/60 border-amber-500 text-yellow-200'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400'
              }`}
            >
              <span>⚓</span>
              <span>Discovered Ports</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLandmarks(!showLandmarks)}
              className={`px-2.5 py-1 rounded border flex items-center space-x-1.5 transition-colors ${
                showLandmarks
                  ? 'bg-amber-900/60 border-amber-500 text-yellow-200'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400'
              }`}
            >
              <span>🏛️</span>
              <span>Exploration Discoveries</span>
            </button>
          </div>

          {/* Right: Flagship Optics Status */}
          <div className="flex items-center space-x-4 text-[11px]">
            <div className="flex items-center space-x-1.5 text-neutral-300">
              <EyeIcon className="h-4 w-4 text-amber-400" />
              <span>Horizon:</span>
              <span className="text-yellow-300 font-bold">
                {sightBreakdown.finalRadiusTiles} Tiles
              </span>
            </div>

            {sightBreakdown.lookoutBonus > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-600/70 text-blue-300 font-semibold">
                🔭 Lookout Active (+{Math.round(sightBreakdown.lookoutBonus * 100)}%)
              </span>
            )}

            {sightBreakdown.telescopeBonus > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-600/70 text-emerald-300 font-semibold">
                🔭 Brass Telescope (+30%)
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1 rounded bg-[#3d2e1e] hover:bg-[#523e28] text-yellow-200 border border-[#8c6f4b] font-bold transition-colors cursor-pointer"
            >
              Close Atlas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
