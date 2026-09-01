import { useState } from 'react';
import {
  Layers,
  Search,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Box,
  Circle,
  Cylinder,
  Cone,
  Donut,
  Square,
  Pill,
  FileCode,
  Crosshair,
} from 'lucide-react';
import { useSceneStore } from '../../store/useSceneStore';
import { useCollaborationStore } from '../../store/useCollaborationStore';
import { useUIStore } from '../../store/useUIStore';
import { getSocket } from '../../services/socket';
import { ObjectType } from '../../types';

export function SceneHierarchyPanel() {
  const objects = useSceneStore((s) => s.objects);
  const selectedObjectId = useSceneStore((s) => s.selectedObjectId);
  const selectObject = useSceneStore((s) => s.selectObject);
  const updateObject = useSceneStore((s) => s.updateObject);
  const removeObject = useSceneStore((s) => s.removeObject);
  const duplicateSelectedObject = useSceneStore((s) => s.duplicateSelectedObject);
  const scene = useSceneStore((s) => s.scene);

  const isSceneTreeOpen = useUIStore((s) => s.isSceneTreeOpen);
  const toggleSceneTree = useUIStore((s) => s.toggleSceneTree);
  const triggerFocus = useUIStore((s) => s.triggerFocus);

  const remoteLocks = useCollaborationStore((s) => s.remoteLocks);
  const currentUser = useCollaborationStore((s) => s.currentUser);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredObjects = objects.filter((o) =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getObjectIcon = (type: ObjectType) => {
    switch (type) {
      case 'sphere': return Circle;
      case 'cylinder': return Cylinder;
      case 'cone': return Cone;
      case 'torus': return Donut;
      case 'plane': return Square;
      case 'capsule': return Pill;
      case 'gltf': return FileCode;
      case 'box':
      default:
        return Box;
    }
  };

  const handleToggleVisibility = (id: string, currentVisible: boolean) => {
    const changes = { visible: !currentVisible };
    updateObject(id, changes);
    if (scene) {
      const socket = getSocket();
      socket.emit('object:update', { sceneId: scene.id, objectId: id, changes });
    }
  };

  const handleToggleLock = (id: string, currentLocked: boolean) => {
    const changes = { locked: !currentLocked };
    updateObject(id, changes);
    if (scene) {
      const socket = getSocket();
      socket.emit('object:update', { sceneId: scene.id, objectId: id, changes });
    }
  };

  const handleDelete = (id: string) => {
    removeObject(id);
    if (scene) {
      const socket = getSocket();
      socket.emit('object:delete', { sceneId: scene.id, objectId: id });
    }
  };

  const handleDuplicate = () => {
    const cloned = duplicateSelectedObject();
    if (cloned && scene) {
      const socket = getSocket();
      socket.emit('object:create', { sceneId: scene.id, object: cloned });
    }
  };

  return (
    <div
      className={`absolute top-16 left-3 bottom-24 z-20 transition-all duration-300 pointer-events-auto flex items-start ${
        isSceneTreeOpen ? 'w-64' : 'w-10'
      }`}
    >
      {isSceneTreeOpen ? (
        <div className="w-full h-full glass-panel rounded-2xl flex flex-col shadow-2xl border border-white/10 overflow-hidden">
          {/* Panel Header */}
          <div className="px-3.5 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <span className="font-semibold text-xs text-white uppercase tracking-wider font-['Outfit']">
                Scene Graph ({objects.length})
              </span>
            </div>
            <button
              onClick={toggleSceneTree}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Collapse Scene Tree"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Search Filter */}
          <div className="p-2.5 border-b border-white/5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search scene nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 glass-input rounded-xl text-xs placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Object Tree Node List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredObjects.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No objects match search.
              </div>
            ) : (
              filteredObjects.map((obj) => {
                const Icon = getObjectIcon(obj.type);
                const isSelected = selectedObjectId === obj.id;
                const remoteLock = remoteLocks[obj.id];
                const isLockedByPeer = !!remoteLock && remoteLock.userId !== currentUser.id;

                return (
                  <div
                    key={obj.id}
                    onClick={() => {
                      if (!isLockedByPeer) {
                        selectObject(obj.id);
                        if (scene) {
                          const socket = getSocket();
                          socket.emit('object:select', { sceneId: scene.id, objectId: obj.id });
                        }
                      }
                    }}
                    onDoubleClick={() => {
                      triggerFocus(obj.transform.position);
                    }}
                    className={`group px-2.5 py-2 rounded-xl flex items-center justify-between text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-brand-600/30 text-white border border-brand-500/50 shadow-md'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: obj.materialProps?.color || '#6366f1' }}
                      />
                      <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-300 flex-shrink-0" />
                      <span className="truncate font-medium">{obj.name}</span>
                      {isLockedByPeer && (
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-ping"
                          style={{ backgroundColor: remoteLock.userColor }}
                          title={`Locked by ${remoteLock.userName}`}
                        />
                      )}
                    </div>

                    {/* Quick Node Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Focus button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerFocus(obj.transform.position);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-white"
                        title="Focus Camera (F)"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                      </button>

                      {/* Visibility toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleVisibility(obj.id, obj.visible);
                        }}
                        className={`p-1 rounded hover:text-white ${
                          obj.visible ? 'text-slate-400' : 'text-slate-600'
                        }`}
                        title={obj.visible ? 'Hide Object' : 'Show Object'}
                      >
                        {obj.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(obj.id);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-400"
                        title="Delete Object"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Duplicate / Delete Footer */}
          {selectedObjectId && (
            <div className="p-2 border-t border-white/10 flex items-center justify-between gap-1">
              <button
                onClick={handleDuplicate}
                className="flex-1 py-1.5 px-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/5 transition-all"
                title="Duplicate (Ctrl+D)"
              >
                <Copy className="w-3 h-3" />
                <span>Duplicate</span>
              </button>
              <button
                onClick={() => handleDelete(selectedObjectId)}
                className="py-1.5 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center justify-center border border-rose-500/20 transition-all"
                title="Delete (Del)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Collapsed Button */
        <button
          onClick={toggleSceneTree}
          className="glass-panel p-2.5 rounded-xl text-slate-300 hover:text-white shadow-xl hover:scale-105 transition-all"
          title="Expand Scene Graph"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
