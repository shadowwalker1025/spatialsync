import { useState, useEffect } from 'react';
import {
  DoorOpen,
  X,
  Plus,
  ArrowRight,
  User,
  Palette,
  Sparkles,
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useCollaborationStore } from '../../store/useCollaborationStore';
import { api } from '../../services/api';
import { USER_COLORS } from '../../utils/colors';

export function RoomJoinModal() {
  const isRoomModalOpen = useUIStore((s) => s.isRoomModalOpen);
  const setRoomModalOpen = useUIStore((s) => s.setRoomModalOpen);

  const currentUser = useCollaborationStore((s) => s.currentUser);
  const setCurrentUser = useCollaborationStore((s) => s.setCurrentUser);
  const activeRoomId = useCollaborationStore((s) => s.activeRoomId);

  const [roomIdInput, setRoomIdInput] = useState('');
  const [userName, setUserName] = useState(currentUser.name);
  const [userColor, setUserColor] = useState(currentUser.color);
  const [recentScenes, setRecentScenes] = useState<any[]>([]);

  useEffect(() => {
    if (isRoomModalOpen) {
      loadRecentScenes();
      setUserName(currentUser.name);
      setUserColor(currentUser.color);
    }
  }, [isRoomModalOpen, currentUser]);

  const loadRecentScenes = async () => {
    try {
      const data = await api.listScenes();
      setRecentScenes(data || []);
    } catch (err) {
      console.error('Failed to load recent scenes:', err);
    }
  };

  const handleJoinRoom = (targetRoomId: string) => {
    if (!targetRoomId.trim()) return;
    setCurrentUser({ name: userName, color: userColor });
    const newUrl = `${window.location.pathname}?room=${targetRoomId.trim()}`;
    window.history.pushState({}, '', newUrl);
    window.location.reload();
  };

  const handleCreateNewRoom = async () => {
    try {
      const created = await api.createScene({ name: `New Studio #${Math.floor(100 + Math.random() * 900)}` });
      handleJoinRoom(created.scene.id);
    } catch (err) {
      console.error('Failed to create new scene room:', err);
    }
  };

  if (!isRoomModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg glass-panel-elevated rounded-3xl border border-white/20 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-brand-400">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Outfit']">Collaboration Session</h2>
              <p className="text-xs text-slate-400">Join a 3D workspace or customize your spatial avatar</p>
            </div>
          </div>
          <button
            onClick={() => setRoomModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* User Profile Config */}
          <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <User className="w-3.5 h-3.5 text-brand-400" />
              <span>Your Collaborator Profile</span>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Display Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 glass-input rounded-xl text-xs font-semibold"
                placeholder="e.g. Alex Architect"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Cursor & Badge Color</label>
              <div className="flex items-center gap-2">
                {USER_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setUserColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      userColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-dark-900' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Join / Switch Room */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Join by Room ID
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Current: {activeRoomId}</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter Room Code (e.g. cyber-lab-1)"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                className="flex-1 px-3 py-2 glass-input rounded-xl text-xs font-mono"
              />
              <button
                onClick={() => handleJoinRoom(roomIdInput)}
                disabled={!roomIdInput.trim()}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg"
              >
                <span>Join</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleCreateNewRoom}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-brand-600 hover:brightness-110 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Clean 3D Workspace</span>
            </button>
          </div>

          {/* Recent Rooms List */}
          {recentScenes.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Available Scene Sessions
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {recentScenes.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleJoinRoom(s.id)}
                    className="glass-panel p-2.5 rounded-xl border border-white/10 hover:border-brand-500/40 flex items-center justify-between text-xs cursor-pointer hover:bg-white/5 transition-all"
                  >
                    <div>
                      <div className="font-semibold text-white">{s.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {s.objectCount} objects • {s.annotationCount} notes
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-brand-400">Join →</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
