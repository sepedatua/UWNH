import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminModal({ isOpen, onClose }: Props) {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen, search]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminUsers(search);
      setUsers(res.users || []);
      setTotal(res.total || 0);
    } catch (e) {
      // Mock data if server is offline
      setUsers([
        {
          id: 1,
          name: 'Admiral João',
          email: 'admin@uncharted.com',
          role: 'admin',
          status: 'active',
          total_saves: 3,
          mp_saves: 1,
          fallen_captains: 0,
          last_login: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'Pirate Blackbeard',
          email: 'blackbeard@caribbean.net',
          role: 'player',
          status: 'active',
          total_saves: 2,
          mp_saves: 2,
          fallen_captains: 1,
          last_login: new Date().toISOString(),
        },
      ]);
      setTotal(2);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async (userId: number) => {
    try {
      await api.adminToggleBan(userId);
      await loadUsers();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleToggleRole = async (userId: number, currentRole: string) => {
    const nextRole = currentRole === 'admin' ? 'player' : 'admin';
    try {
      await api.adminSetRole(userId, nextRole);
      await loadUsers();
    } catch (err: any) {
      alert(`Role change failed: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono select-none">
      <div className="w-[900px] max-h-[90vh] bg-[#1a1714] border-4 border-yellow-700 rounded-lg shadow-2xl flex flex-col text-[#e6d5b8] overflow-hidden">
        {/* Header */}
        <div className="bg-[#261f18] border-b-2 border-yellow-700 p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👑</span>
            <h2 className="text-xl font-bold tracking-wider text-yellow-400">
              HIGH ADMIRALTY — ADMIN USER MANAGEMENT
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white px-2 py-1 border border-yellow-700 rounded cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-[#211a14] border-b border-[#5a4837] flex justify-between items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by captain name, email, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#120f0d] border border-[#8c6f4b] px-3 py-1.5 rounded text-sm text-white"
            />
          </div>
          <div className="text-xs text-yellow-300 font-bold whitespace-nowrap">
            Registered Captains: {total}
          </div>
        </div>

        {/* User Table */}
        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-400">
              Loading player registry...
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#8c6f4b] text-[#ffd700]">
                  <th className="p-2">ID</th>
                  <th className="p-2">Captain</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Saves (MP / KIA)</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-[#3d2e1e] hover:bg-[#261f18] transition-colors"
                  >
                    <td className="p-2 text-gray-400">#{u.id}</td>
                    <td className="p-2 font-bold text-white">{u.name}</td>
                    <td className="p-2 text-gray-300">{u.email}</td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-0.5 rounded font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-yellow-900 text-yellow-200'
                            : 'bg-gray-800 text-gray-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-0.5 rounded font-bold uppercase ${
                          u.status === 'active'
                            ? 'bg-green-900 text-green-200'
                            : 'bg-red-900 text-red-200'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="p-2 text-gray-300">
                      {u.total_saves || 0} (MP: {u.mp_saves || 0} / ☠️ {u.fallen_captains || 0})
                    </td>
                    <td className="p-2 text-right space-x-2">
                      <button
                        onClick={() => handleToggleRole(u.id, u.role)}
                        className="px-2 py-1 bg-yellow-900/60 hover:bg-yellow-800 text-yellow-200 rounded cursor-pointer"
                        title="Toggle Admin / Player"
                      >
                        {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                      </button>
                      <button
                        onClick={() => handleToggleBan(u.id)}
                        className={`px-2 py-1 rounded cursor-pointer font-bold ${
                          u.status === 'active'
                            ? 'bg-red-900/70 hover:bg-red-800 text-red-200'
                            : 'bg-green-900/70 hover:bg-green-800 text-green-200'
                        }`}
                      >
                        {u.status === 'active' ? 'Ban' : 'Unban'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#261f18] border-t border-yellow-700 flex justify-between items-center text-xs text-gray-400">
          <span>Hetzner Debian 13 LAMP Server Admin Console</span>
          <button
            onClick={loadUsers}
            className="hover:underline text-yellow-300 cursor-pointer"
          >
            ↻ Refresh List
          </button>
        </div>
      </div>
    </div>
  );
}
