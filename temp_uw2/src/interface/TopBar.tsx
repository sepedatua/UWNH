import React, { useState, useEffect } from 'react';
import api, { User } from '../services/api';
import state from '../state/state';
import SaveLoadModal from './SaveLoadModal';
import GoogleAuthModal from './GoogleAuthModal';
import AdminModal from './AdminModal';
import ScenarioPrologueModal, { PrologueData } from './ScenarioPrologueModal';
import ScenarioJournalModal from './scenario/ScenarioJournalModal';
import WorldAtlasModal from './world/WorldAtlasModal';

export default function TopBar() {
  const [user, setUser] = useState<User | null>(api.getCurrentUser());
  const [isSaveLoadOpen, setIsSaveLoadOpen] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isAtlasOpen, setIsAtlasOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [prologueData, setPrologueData] = useState<PrologueData | null>(null);

  const [captainInfo, setCaptainInfo] = useState({
    name: state.protagonistName || 'João Franco',
    mode: state.gameMode || 'sp_scenario',
    nation: state.nationality || 'Portugal',
  });

  const syncCaptainInfo = () => {
    setCaptainInfo({
      name: state.protagonistName || 'Captain',
      mode: state.gameMode || 'sp_scenario',
      nation: state.nationality || 'Portugal',
    });
  };

  useEffect(() => {
    api.checkSession().then((u) => setUser(u));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'm' || e.key === 'M') {
        setIsAtlasOpen((prev) => !prev);
      }
    };
    const handleOpenAtlas = () => {
      setIsAtlasOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-world-atlas', handleOpenAtlas);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-world-atlas', handleOpenAtlas);
    };
  }, []);

  return (
    <>
      <div className="w-full bg-[#1c1814] border-b-2 border-[#8c6f4b] px-4 py-2 flex justify-between items-center text-xs font-mono select-none text-[#e6d5b8] shadow-md z-40">
        {/* Left: Game Title & Mode */}
        <div className="flex items-center gap-3">
          <span className="text-base">⚓</span>
          <span className="font-bold tracking-widest text-[#ffd700] text-sm">
            UNCHARTED WATERS: NEW HORIZONS
          </span>
          <span className="bg-[#2d2218] border border-[#8c6f4b] px-2 py-0.5 rounded text-[11px] text-yellow-300 font-bold uppercase">
            1522 AD
          </span>
          <span
            className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase border ${
              captainInfo.mode === 'mp_endless'
                ? 'bg-blue-950/80 text-blue-300 border-blue-600'
                : captainInfo.mode === 'sp_endless'
                ? 'bg-purple-950/80 text-purple-300 border-purple-600'
                : 'bg-amber-950/80 text-amber-300 border-amber-600'
            }`}
          >
            {captainInfo.mode === 'mp_endless'
              ? '🌐 MP: Endless'
              : captainInfo.mode === 'sp_endless'
              ? '⚔️ SP: Endless'
              : '📖 SP: Scenario'}{' '}
            • {captainInfo.name} ({captainInfo.nation})
          </span>
        </div>

        {/* Right: Actions & User Info */}
        <div className="flex items-center gap-3">
          {/* World Atlas [M] button */}
          <button
            onClick={() => setIsAtlasOpen(true)}
            className="px-3 py-1 bg-[#253240] hover:bg-[#344659] text-sky-200 border border-sky-600 rounded font-bold cursor-pointer flex items-center gap-1.5 transition-colors"
            title="Open World Atlas [M]"
          >
            <span>🗺️</span>
            <span>World Atlas [M]</span>
          </button>

          {/* Quest Journal button */}
          <button
            onClick={() => setIsJournalOpen(true)}
            className="px-3 py-1 bg-amber-950/80 hover:bg-amber-900 text-yellow-200 border border-amber-600 rounded font-bold cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <span>📖</span>
            <span>Quest Journal</span>
          </button>

          {/* Save / Load Slots button */}
          <button
            onClick={() => setIsSaveLoadOpen(true)}
            className="px-3 py-1 bg-[#3d2e1e] hover:bg-[#523e28] text-yellow-200 border border-[#8c6f4b] rounded font-bold cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <span>📜</span>
            <span>Save / Load</span>
          </button>

          {/* Admin Panel button (if admin) */}
          {user?.role === 'admin' && (
            <button
              onClick={() => setIsAdminOpen(true)}
              className="px-3 py-1 bg-yellow-950/80 hover:bg-yellow-900 text-yellow-300 border border-yellow-600 rounded font-bold cursor-pointer flex items-center gap-1 transition-colors"
            >
              <span>👑</span>
              <span>Admin Panel</span>
            </button>
          )}

          {/* User Account / Google Sign-In */}
          <button
            onClick={() => setIsAuthOpen(true)}
            className="px-3 py-1 bg-[#26201a] hover:bg-[#382f26] border border-[#8c6f4b] rounded cursor-pointer flex items-center gap-2 transition-colors"
          >
            {user ? (
              <>
                <div className="w-4 h-4 rounded-full bg-yellow-600 flex items-center justify-center text-[10px] text-black font-bold overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full" />
                  ) : (
                    'C'
                  )}
                </div>
                <span className="text-white font-bold max-w-[120px] truncate">
                  {user.name}
                </span>
              </>
            ) : (
              <>
                <span className="text-blue-400 font-bold">G</span>
                <span>Sign In with Google</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modals */}
      {isJournalOpen && (
        <ScenarioJournalModal onClose={() => setIsJournalOpen(false)} />
      )}

      <SaveLoadModal
        isOpen={isSaveLoadOpen}
        onClose={() => setIsSaveLoadOpen(false)}
        onGameLoaded={syncCaptainInfo}
        onStartPrologue={(data) => {
          setPrologueData(data);
          syncCaptainInfo();
        }}
      />

      <ScenarioPrologueModal
        isOpen={prologueData !== null}
        onClose={() => setPrologueData(null)}
        data={prologueData}
      />

      <GoogleAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        user={user}
        onUserChanged={(u) => setUser(u)}
      />

      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      <WorldAtlasModal
        isOpen={isAtlasOpen}
        onClose={() => setIsAtlasOpen(false)}
      />
    </>
  );
}
