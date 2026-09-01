import { useState } from 'react';
import {
  Boxes,
  Users,
  Share2,
  Save,
  Download,
  Upload,
  SunMedium,
  MessageSquare,
  Activity,
  HelpCircle,
  Check,
  Sparkles,
} from 'lucide-react';
import { useSceneStore } from '../../store/useSceneStore';
import { useCollaborationStore } from '../../store/useCollaborationStore';
import { useUIStore } from '../../store/useUIStore';
import { api } from '../../services/api';
import { exportSceneToFile, importSceneFromFile } from '../../utils/exportImport';
import { EnvironmentPreset } from '../../types';

export function HeaderHUD() {
  const scene = useSceneStore((s) => s.scene);
  const objects = useSceneStore((s) => s.objects);
  const annotations = useSceneStore((s) => s.annotations);
  const isSaving = useSceneStore((s) => s.isSaving);
  const lastSavedAt = useSceneStore((s) => s.lastSavedAt);
  const setIsSaving = useSceneStore((s) => s.setIsSaving);
  const setLastSavedAt = useSceneStore((s) => s.setLastSavedAt);
  const setSceneSnapshot = useSceneStore((s) => s.setSceneSnapshot);

  const currentUser = useCollaborationStore((s) => s.currentUser);
  const users = useCollaborationStore((s) => s.users);
  const isConnected = useCollaborationStore((s) => s.isConnected);
  const unreadChatCount = useCollaborationStore((s) => s.unreadChatCount);
  const resetUnreadChat = useCollaborationStore((s) => s.resetUnreadChat);

  const environmentPreset = useUIStore((s) => s.environmentPreset);
  const setEnvironmentPreset = useUIStore((s) => s.setEnvironmentPreset);
  const isChatOpen = useUIStore((s) => s.isChatOpen);
  const setChatOpen = useUIStore((s) => s.setChatOpen);
  const setRoomModalOpen = useUIStore((s) => s.setRoomModalOpen);
  const isStatsOpen = useUIStore((s) => s.isStatsOpen);
  const setStatsOpen = useUIStore((s) => s.setStatsOpen);
  const setShortcutsOpen = useUIStore((s) => s.setShortcutsOpen);

  const [copiedShare, setCopiedShare] = useState(false);

  // Manual save snapshot to backend database
  const handleSaveScene = async () => {
    if (!scene) return;
    try {
      setIsSaving(true);
      await api.saveScene(scene.id, {
        scene,
        objects,
        annotations,
      });
      setLastSavedAt(new Date());
    } catch (err) {
      console.error('Failed to persist scene:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleExportJSON = () => {
    if (!scene) return;
    exportSceneToFile({ scene, objects, annotations }, `${scene.name || 'spatial-scene'}.json`);
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const snapshot = await importSceneFromFile(file);
        setSceneSnapshot(snapshot);
      } catch (err: any) {
        alert(`Failed to import JSON: ${err.message}`);
      }
    }
  };

  return (
    <header className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
      {/* Left Branding & Room Switcher */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="glass-panel px-3.5 py-2 rounded-xl flex items-center gap-2.5 shadow-lg border border-white/10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-neon-cyan flex items-center justify-center text-white shadow-neon-cyan">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white font-['Outfit']">
                SpatialSync
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                3D Studio
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500'}`} />
              <button
                onClick={() => setRoomModalOpen(true)}
                className="hover:text-white transition-colors underline decoration-dotted"
                title="Change or join room"
              >
                Room: {scene?.id?.substring(0, 8) || 'main'}
              </button>
            </div>
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShareLink}
          className="glass-button glass-panel px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-white shadow-lg pointer-events-auto"
        >
          {copiedShare ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-brand-400" />
              <span>Share</span>
            </>
          )}
        </button>
      </div>

      {/* Center Live Collaborators Indicator */}
      <div className="pointer-events-auto flex items-center gap-2 glass-panel px-3 py-1.5 rounded-xl shadow-lg border border-white/10">
        <Users className="w-4 h-4 text-brand-400" />
        <span className="text-xs font-medium text-slate-300 mr-1">
          {users.length} {users.length === 1 ? 'Collaborator' : 'Collaborators'}
        </span>
        <div className="flex items-center -space-x-1.5">
          {users.slice(0, 5).map((u) => (
            <div
              key={u.id}
              className="w-6 h-6 rounded-full border-2 border-dark-900 flex items-center justify-center text-[10px] font-bold text-white shadow-md relative group cursor-pointer"
              style={{ backgroundColor: u.color }}
              title={u.id === currentUser.id ? `${u.name} (You)` : u.name}
            >
              {u.name.charAt(0).toUpperCase()}
              {/* Tooltip */}
              <div className="absolute top-8 hidden group-hover:block glass-panel-elevated px-2 py-0.5 rounded text-[10px] text-white whitespace-nowrap z-50">
                {u.name} {u.id === currentUser.id && '(You)'}
              </div>
            </div>
          ))}
          {users.length > 5 && (
            <div className="w-6 h-6 rounded-full bg-slate-700 border-2 border-dark-900 flex items-center justify-center text-[10px] font-bold text-slate-200">
              +{users.length - 5}
            </div>
          )}
        </div>
      </div>

      {/* Right Actions & Settings */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Environment Preset Dropdown */}
        <div className="glass-panel px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-white/10">
          <SunMedium className="w-3.5 h-3.5 text-amber-400" />
          <select
            value={environmentPreset}
            onChange={(e) => setEnvironmentPreset(e.target.value as EnvironmentPreset)}
            className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="studio" className="bg-dark-800 text-slate-100">Studio Light</option>
            <option value="sunset" className="bg-dark-800 text-slate-100">Warm Sunset</option>
            <option value="dawn" className="bg-dark-800 text-slate-100">Violet Dawn</option>
            <option value="night" className="bg-dark-800 text-slate-100">Moonlit Night</option>
            <option value="cyberpunk" className="bg-dark-800 text-slate-100">Cyberpunk Neon</option>
            <option value="minimal" className="bg-dark-800 text-slate-100">Minimal White</option>
          </select>
        </div>

        {/* Save Snapshot Button */}
        <button
          onClick={handleSaveScene}
          disabled={isSaving}
          className="glass-button glass-panel px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-white shadow-lg"
          title={lastSavedAt ? `Last saved: ${lastSavedAt.toLocaleTimeString()}` : 'Save scene to database'}
        >
          <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin text-brand-400' : 'text-slate-300'}`} />
          <span>{isSaving ? 'Saving...' : 'Save Snapshot'}</span>
        </button>

        {/* Export / Import Menu */}
        <button
          onClick={handleExportJSON}
          className="glass-button glass-panel p-2 rounded-xl text-slate-300 hover:text-white"
          title="Export Scene as JSON"
        >
          <Download className="w-4 h-4" />
        </button>

        <label className="glass-button glass-panel p-2 rounded-xl text-slate-300 hover:text-white cursor-pointer" title="Import Scene JSON">
          <Upload className="w-4 h-4" />
          <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
        </label>

        {/* Stats HUD Toggle */}
        <button
          onClick={() => setStatsOpen(!isStatsOpen)}
          className={`glass-button glass-panel p-2 rounded-xl transition-colors ${
            isStatsOpen ? 'active' : 'text-slate-300 hover:text-white'
          }`}
          title="Toggle FPS & WebGL Statistics"
        >
          <Activity className="w-4 h-4" />
        </button>

        {/* Shortcuts Toggle */}
        <button
          onClick={() => setShortcutsOpen(true)}
          className="glass-button glass-panel p-2 rounded-xl text-slate-300 hover:text-white"
          title="Keyboard Shortcuts Cheat Sheet"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Chat Drawer Toggle */}
        <button
          onClick={() => {
            setChatOpen(!isChatOpen);
            resetUnreadChat();
          }}
          className={`glass-button glass-panel p-2 rounded-xl relative transition-colors ${
            isChatOpen ? 'active' : 'text-slate-300 hover:text-white'
          }`}
          title="Open Collaboration Chat"
        >
          <MessageSquare className="w-4 h-4" />
          {unreadChatCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white animate-pulse">
              {unreadChatCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
