import { useState } from 'react';
import { Html } from '@react-three/drei';
import { CheckCircle2, MessageSquare, Trash2, X } from 'lucide-react';
import { useSceneStore } from '../../store/useSceneStore';
import { useCollaborationStore } from '../../store/useCollaborationStore';
import { getSocket } from '../../services/socket';
import { Annotation } from '../../types';

export function Annotations3D() {
  const annotations = useSceneStore((s) => s.annotations);
  const selectedAnnotationId = useSceneStore((s) => s.selectedAnnotationId);
  const selectAnnotation = useSceneStore((s) => s.selectAnnotation);
  const updateAnnotation = useSceneStore((s) => s.updateAnnotation);
  const removeAnnotation = useSceneStore((s) => s.removeAnnotation);
  const scene = useSceneStore((s) => s.scene);
  const currentUser = useCollaborationStore((s) => s.currentUser);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggleResolve = (ann: Annotation) => {
    const updated = { resolved: !ann.resolved };
    updateAnnotation(ann.id, updated);
    if (scene) {
      const socket = getSocket();
      socket.emit('annotation:update', {
        sceneId: scene.id,
        annotationId: ann.id,
        changes: updated,
      });
    }
  };

  const handleDelete = (annId: string) => {
    removeAnnotation(annId);
    if (scene) {
      const socket = getSocket();
      socket.emit('annotation:delete', {
        sceneId: scene.id,
        annotationId: annId,
      });
    }
  };

  return (
    <group name="annotations-3d">
      {annotations.map((ann) => {
        const [x, y, z] = ann.position;
        const isSelected = selectedAnnotationId === ann.id;
        const isExpanded = expandedId === ann.id || isSelected;
        const pinColor = ann.authorColor || '#8b5cf6';

        return (
          <group key={ann.id} position={[x, y, z]}>
            {/* 3D Pin Geometry */}
            <group
              position={[0, 0.4, 0]}
              onClick={(e) => {
                e.stopPropagation();
                setExpandedId(isExpanded ? null : ann.id);
                selectAnnotation(ann.id);
              }}
            >
              {/* Pin Head Sphere */}
              <mesh position={[0, 0.35, 0]}>
                <sphereGeometry args={[0.16, 16, 16]} />
                <meshStandardMaterial
                  color={ann.resolved ? '#10b981' : pinColor}
                  emissive={ann.resolved ? '#059669' : pinColor}
                  emissiveIntensity={0.5}
                />
              </mesh>

              {/* Pin Needle Cone */}
              <mesh position={[0, 0.12, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.06, 0.3, 16]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} />
              </mesh>
            </group>

            {/* Projected HTML Label Card */}
            <Html
              position={[0, 0.9, 0]}
              center
              distanceFactor={10}
              className="pointer-events-auto"
            >
              {!isExpanded ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedId(ann.id);
                    selectAnnotation(ann.id);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-xl transition-transform hover:scale-110 active:scale-95 whitespace-nowrap"
                  style={{
                    backgroundColor: ann.resolved ? '#10b981' : pinColor,
                    boxShadow: `0 4px 14px ${pinColor}80`,
                  }}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{ann.title || 'Note'}</span>
                  {ann.resolved && <CheckCircle2 className="w-3 h-3 text-emerald-100 ml-0.5" />}
                </button>
              ) : (
                <div className="w-64 glass-panel-elevated p-3.5 rounded-xl border border-white/20 shadow-2xl text-slate-100 flex flex-col gap-2 transition-all">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow"
                        style={{ backgroundColor: pinColor }}
                      >
                        {ann.authorName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-slate-300">
                        {ann.authorName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleResolve(ann)}
                        title={ann.resolved ? 'Mark unresolved' : 'Mark resolved'}
                        className={`p-1 rounded hover:bg-white/10 transition-colors ${
                          ann.resolved ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-300'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ann.id)}
                        title="Delete note"
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpandedId(null)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-white">
                    {ann.title || 'Spatial Note'}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed max-h-28 overflow-y-auto pr-1">
                    {ann.text}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                    <span>
                      {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                        ann.resolved ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {ann.resolved ? 'Resolved' : 'Active'}
                    </span>
                  </div>
                </div>
              )}
            </Html>
          </group>
        );
      })}
    </group>
  );
}
