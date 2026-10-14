import React, { useState } from 'react';
import api, { User } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserChanged: (user: User | null) => void;
}

export default function GoogleAuthModal({
  isOpen,
  onClose,
  user,
  onUserChanged,
}: Props) {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulateLogin = async (role: 'player' | 'admin' = 'player') => {
    setLoading(true);
    setError(null);
    try {
      const mockUser = await api.loginWithGoogle(`mock_token_${role}_${Date.now()}`);
      if (role === 'admin') {
        mockUser.role = 'admin';
        mockUser.email = 'admin@uncharted.com';
        mockUser.name = 'Fleet Admiral';
        api.setCurrentUser(mockUser);
      }
      onUserChanged(mockUser);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const loggedUser = await api.loginWithGoogle(tokenInput.trim());
      onUserChanged(loggedUser);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await api.logout();
      onUserChanged(null);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono select-none">
      <div className="w-[480px] bg-[#1e1b18] border-4 border-[#8c6f4b] rounded-lg shadow-2xl flex flex-col text-[#e6d5b8] overflow-hidden">
        {/* Header */}
        <div className="bg-[#2d241e] border-b-2 border-[#8c6f4b] p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌐</span>
            <h2 className="text-lg font-bold text-[#ffd700]">
              {user ? 'CAPTAIN ACCOUNT' : 'SIGN IN WITH GOOGLE'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white px-2 py-0.5 border border-[#8c6f4b] rounded cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-900/60 border border-red-500 rounded text-xs text-red-200">
              {error}
            </div>
          )}

          {user ? (
            /* Logged in state */
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-full border-2 border-yellow-400 bg-amber-950 flex items-center justify-center text-3xl overflow-hidden">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  '⚓'
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{user.name}</h3>
                <p className="text-xs text-[#c4b39b]">{user.email}</p>
                <div className="mt-2 inline-block px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-amber-800 text-yellow-200">
                  Role: {user.role}
                </div>
              </div>

              <div className="pt-4 border-t border-[#8c6f4b]">
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="w-full py-2 bg-red-900/70 hover:bg-red-800 text-white font-bold rounded text-sm cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            /* Login Form */
            <div className="space-y-4">
              <p className="text-xs text-[#c4b39b] leading-relaxed">
                Signing in links your voyages across all devices, enables cloud
                multi-slot saves, and unlocks <strong>Multiplayer Living World</strong> mode!
              </p>

              {/* Instant One-Click Login Options */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleSimulateLogin('player')}
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded flex items-center justify-center gap-2 text-sm cursor-pointer shadow"
                >
                  <span>G</span> Sign in with Google Account
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateLogin('admin')}
                  disabled={loading}
                  className="w-full py-1.5 bg-[#4a392b] hover:bg-[#5a4837] text-yellow-300 font-bold rounded text-xs cursor-pointer border border-[#8c6f4b]"
                >
                  🔑 Sign in as Administrator (Dev Mode)
                </button>
              </div>

              {/* Direct ID Token Verification form */}
              <div className="pt-3 border-t border-[#5a4837]">
                <details className="text-xs text-gray-400">
                  <summary className="cursor-pointer hover:text-white">
                    Advanced: Paste Google ID Token directly
                  </summary>
                  <form onSubmit={handleCustomTokenSubmit} className="mt-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Paste Google JWT id_token..."
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      className="w-full bg-[#12100e] border border-[#8c6f4b] p-2 rounded text-xs text-white"
                    />
                    <button
                      type="submit"
                      disabled={loading || !tokenInput}
                      className="w-full py-1 bg-yellow-700 hover:bg-yellow-600 text-black font-bold text-xs rounded cursor-pointer"
                    >
                      Verify Token with Server
                    </button>
                  </form>
                </details>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
