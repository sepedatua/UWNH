import React from 'react';
import Assets from '../../assets';

interface Props {
  onResume: () => void;
}

export default function PauseOverlay({ onResume }: Props) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1.5px] cursor-pointer select-none"
      onClick={onResume}
      data-test="pauseOverlay"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Pause' || e.key === 'p' || e.key === 'P' || e.key === 'Enter' || e.key === ' ') {
          onResume();
        }
      }}
    >
      <div
        className="relative w-[480px] p-6 bg-[#f3e3d3] border-4 border-[#8c6f4b] rounded-sm text-[#2b1908] font-serif shadow-2xl text-center transform transition-all hover:scale-[1.01]"
        style={{
          boxShadow: `
            inset 0 0 0 2px #000,
            inset 0 0 0 4px #d34100,
            inset 0 0 0 6px #f3a261,
            inset 0 0 0 8px #d34100,
            0 16px 40px rgba(0, 0, 0, 0.8)
          `,
        }}
        onClick={(e) => {
          // Allow clicking banner directly to resume
          e.stopPropagation();
          onResume();
        }}
      >
        {/* Vintage Corner Brackets */}
        <div className="absolute top-1 left-1 text-[#8c6f4b] text-xs pointer-events-none">╔</div>
        <div className="absolute top-1 right-1 text-[#8c6f4b] text-xs pointer-events-none">╗</div>
        <div className="absolute bottom-1 left-1 text-[#8c6f4b] text-xs pointer-events-none">╚</div>
        <div className="absolute bottom-1 right-1 text-[#8c6f4b] text-xs pointer-events-none">╝</div>

        {/* Title Header */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-xl text-yellow-800">⚓</span>
          <h2 className="text-2xl font-bold tracking-[0.25em] text-[#3d1e06] uppercase font-sans">
            PAUSED
          </h2>
          <span className="text-xl text-yellow-800">⚓</span>
        </div>

        {/* Decorative Divider */}
        <div className="w-48 h-[2px] bg-gradient-to-r from-transparent via-[#8c6f4b] to-transparent mx-auto mb-3" />

        {/* Status Text */}
        <p className="text-sm font-sans font-medium text-[#4a2e12] leading-relaxed mb-1">
          Voyage, time, and rations are safely suspended.
        </p>
        <p className="text-xs font-sans text-[#7a572a] mb-5">
          (No food or water will be consumed)
        </p>

        {/* Resume Action Pill */}
        <div className="inline-block px-5 py-2 bg-[#2d1b0d] hover:bg-[#422915] border-2 border-[#b8935c] text-[#f5ebd7] font-sans font-bold text-xs uppercase tracking-wider rounded shadow transition cursor-pointer">
          ▶️ Press [Pause] or Click to Resume
        </div>

        <div className="mt-2 text-[10px] font-sans text-[#8f6d41]">
          Shortcut: <span className="font-bold">[Pause]</span> or <span className="font-bold">[P]</span>
        </div>
      </div>
    </div>
  );
}
