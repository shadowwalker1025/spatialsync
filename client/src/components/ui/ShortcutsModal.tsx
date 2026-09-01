import { HelpCircle, X, Command } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';

export function ShortcutsModal() {
  const isShortcutsOpen = useUIStore((s) => s.isShortcutsOpen);
  const setShortcutsOpen = useUIStore((s) => s.setShortcutsOpen);

  if (!isShortcutsOpen) return null;

  const shortcutList = [
    { key: 'W', desc: 'Translate (Move) gizmo mode' },
    { key: 'E', desc: 'Rotate gizmo mode' },
    { key: 'R', desc: 'Scale gizmo mode' },
    { key: 'V / Q', desc: 'Select & Transform pointer tool' },
    { key: 'C / A', desc: '3D Surface Annotation pin tool' },
    { key: 'F', desc: 'Focus camera on selected object' },
    { key: 'Ctrl + D', desc: 'Duplicate selected object' },
    { key: 'Delete / Backspace', desc: 'Delete selected object' },
    { key: 'Ctrl + Z', desc: 'Undo last transformation/action' },
    { key: 'Ctrl + Y', desc: 'Redo last undone action' },
    { key: 'Escape', desc: 'Deselect object / close modal' },
    { key: 'Left Click + Drag', desc: 'Orbit camera around scene' },
    { key: 'Right Click + Drag', desc: 'Pan camera view' },
    { key: 'Mouse Wheel', desc: 'Zoom in / out' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel-elevated rounded-3xl border border-white/20 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-brand-400">
              <Command className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Outfit']">Keyboard Shortcuts</h2>
              <p className="text-xs text-slate-400">SpatialSync 3D Editor hotkeys</p>
            </div>
          </div>
          <button
            onClick={() => setShortcutsOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-6 space-y-2 max-h-[70vh] overflow-y-auto">
          {shortcutList.map((item) => (
            <div
              key={item.key}
              className="glass-panel px-3.5 py-2 rounded-xl border border-white/5 flex items-center justify-between text-xs"
            >
              <span className="text-slate-300">{item.desc}</span>
              <kbd className="px-2 py-1 rounded bg-dark-700 border border-white/10 font-mono text-[11px] font-bold text-brand-300">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
