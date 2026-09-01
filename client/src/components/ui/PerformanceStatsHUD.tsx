import { useState, useEffect } from 'react';
import { Activity, Cpu, Layers, MessageSquare } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useSceneStore } from '../../store/useSceneStore';
import { useCollaborationStore } from '../../store/useCollaborationStore';

export function PerformanceStatsHUD() {
  const isStatsOpen = useUIStore((s) => s.isStatsOpen);
  const objects = useSceneStore((s) => s.objects);
  const annotations = useSceneStore((s) => s.annotations);
  const users = useCollaborationStore((s) => s.users);

  const [fps, setFps] = useState(60);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    function loop(now: number) {
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  if (!isStatsOpen) return null;

  return (
    <div className="absolute top-16 left-72 z-20 glass-panel px-3.5 py-2.5 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-4 text-xs pointer-events-auto">
      {/* FPS Counter */}
      <div className="flex items-center gap-1.5">
        <Activity className={`w-4 h-4 ${fps >= 55 ? 'text-emerald-400' : fps >= 30 ? 'text-amber-400' : 'text-rose-400'}`} />
        <div>
          <span className="font-mono font-bold text-white text-sm">{fps}</span>
          <span className="text-[10px] text-slate-400 ml-1">FPS</span>
        </div>
      </div>

      <div className="w-px h-5 bg-white/10" />

      {/* Meshes */}
      <div className="flex items-center gap-1.5 text-slate-300">
        <Layers className="w-3.5 h-3.5 text-brand-400" />
        <span>{objects.length} Meshes</span>
      </div>

      <div className="w-px h-5 bg-white/10" />

      {/* Pins */}
      <div className="flex items-center gap-1.5 text-slate-300">
        <MessageSquare className="w-3.5 h-3.5 text-neon-purple" />
        <span>{annotations.length} Pins</span>
      </div>
    </div>
  );
}
