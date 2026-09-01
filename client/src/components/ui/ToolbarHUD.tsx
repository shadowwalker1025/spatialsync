import { useState } from 'react';
import {
  Move,
  RotateCw,
  Maximize2,
  MousePointer,
  Pin,
  Box,
  Circle,
  Cylinder,
  Cone,
  Donut,
  Square,
  Pill,
  UploadCloud,
  Undo2,
  Redo2,
  Magnet,
  Grid as GridIcon,
  Eye,
  Camera,
  ChevronDown,
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useSceneStore } from '../../store/useSceneStore';
import { getSocket } from '../../services/socket';
import { ObjectType, TransformMode } from '../../types';

export function ToolbarHUD() {
  const transformMode = useUIStore((s) => s.transformMode);
  const setTransformMode = useUIStore((s) => s.setTransformMode);
  const transformSpace = useUIStore((s) => s.transformSpace);
  const setTransformSpace = useUIStore((s) => s.setTransformSpace);
  const snapEnabled = useUIStore((s) => s.snapEnabled);
  const toggleSnap = useUIStore((s) => s.toggleSnap);
  const activeTool = useUIStore((s) => s.activeTool);
  const setActiveTool = useUIStore((s) => s.setActiveTool);
  const setAssetLibraryOpen = useUIStore((s) => s.setAssetLibraryOpen);
  const gridVisible = useUIStore((s) => s.gridVisible);
  const setGridVisible = useUIStore((s) => s.setGridVisible);
  const cameraPreset = useUIStore((s) => s.cameraPreset);
  const setCameraPreset = useUIStore((s) => s.setCameraPreset);

  const spawnPrimitive = useSceneStore((s) => s.spawnPrimitive);
  const undo = useSceneStore((s) => s.undo);
  const redo = useSceneStore((s) => s.redo);
  const undoStack = useSceneStore((s) => s.undoStack);
  const redoStack = useSceneStore((s) => s.redoStack);
  const scene = useSceneStore((s) => s.scene);

  const [primitiveMenuOpen, setPrimitiveMenuOpen] = useState(false);
  const [cameraMenuOpen, setCameraMenuOpen] = useState(false);

  const handleSpawn = (type: ObjectType) => {
    const created = spawnPrimitive(type);
    setPrimitiveMenuOpen(false);
    if (scene) {
      const socket = getSocket();
      socket.emit('object:create', { sceneId: scene.id, object: created });
    }
  };

  const primitives: { type: ObjectType; label: string; icon: any }[] = [
    { type: 'box', label: 'Cube Box', icon: Box },
    { type: 'sphere', label: 'Sphere', icon: Circle },
    { type: 'cylinder', label: 'Cylinder', icon: Cylinder },
    { type: 'cone', label: 'Cone', icon: Cone },
    { type: 'torus', label: 'Torus Ring', icon: Donut },
    { type: 'plane', label: 'Plane Ground', icon: Square },
    { type: 'capsule', label: 'Capsule', icon: Pill },
  ];

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 pointer-events-auto">
      {/* Primary Tool HUD */}
      <div className="glass-panel-elevated p-1.5 rounded-2xl flex items-center gap-1 shadow-2xl border border-white/15">
        {/* Select Tool */}
        <button
          onClick={() => setActiveTool('select')}
          className={`p-2.5 rounded-xl transition-all ${
            activeTool === 'select'
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
          title="Select & Transform Tool (V / Q)"
        >
          <MousePointer className="w-4 h-4" />
        </button>

        {/* Annotate Tool */}
        <button
          onClick={() => setActiveTool('annotate')}
          className={`p-2.5 rounded-xl transition-all ${
            activeTool === 'annotate'
              ? 'bg-neon-purple text-white shadow-lg shadow-neon-purple/30'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
          title="3D Surface Annotation Pin (C / A)"
        >
          <Pin className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Transform Modes */}
        <button
          onClick={() => {
            setTransformMode('translate');
            setActiveTool('select');
          }}
          className={`p-2.5 rounded-xl transition-all ${
            transformMode === 'translate' && activeTool === 'select'
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
          title="Translate Mode (W)"
        >
          <Move className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            setTransformMode('rotate');
            setActiveTool('select');
          }}
          className={`p-2.5 rounded-xl transition-all ${
            transformMode === 'rotate' && activeTool === 'select'
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
          title="Rotate Mode (E)"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            setTransformMode('scale');
            setActiveTool('select');
          }}
          className={`p-2.5 rounded-xl transition-all ${
            transformMode === 'scale' && activeTool === 'select'
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
          title="Scale Mode (R)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* World vs Local Space Toggle */}
        <button
          onClick={() => setTransformSpace(transformSpace === 'world' ? 'local' : 'world')}
          className="px-2 py-1 text-[11px] font-bold uppercase rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors border border-white/5"
          title={`Switch Coordinate Space (${transformSpace})`}
        >
          {transformSpace}
        </button>

        {/* Snap Toggle */}
        <button
          onClick={toggleSnap}
          className={`p-2.5 rounded-xl transition-all ${
            snapEnabled
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
          title={snapEnabled ? 'Coordinate Snapping (ON)' : 'Coordinate Snapping (OFF)'}
        >
          <Magnet className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Add 3D Primitive Dropdown */}
        <div className="relative">
          <button
            onClick={() => setPrimitiveMenuOpen(!primitiveMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white text-xs font-semibold shadow-lg hover:brightness-110 active:scale-95 transition-all"
          >
            <Box className="w-3.5 h-3.5" />
            <span>Add 3D Mesh</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {primitiveMenuOpen && (
            <div className="absolute bottom-12 left-0 w-44 glass-panel-elevated p-1.5 rounded-xl border border-white/15 shadow-2xl flex flex-col gap-0.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
              {primitives.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.type}
                    onClick={() => handleSpawn(p.type)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:text-white hover:bg-brand-600/30 transition-colors text-left"
                  >
                    <Icon className="w-3.5 h-3.5 text-brand-400" />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Upload 3D Model Button */}
        <button
          onClick={() => setAssetLibraryOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-200 hover:text-white text-xs font-semibold border border-white/10 shadow-lg transition-all"
          title="Upload or Browse glTF/GLB Assets"
        >
          <UploadCloud className="w-3.5 h-3.5 text-neon-cyan" />
          <span>Asset Library</span>
        </button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Undo / Redo */}
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Camera Views Selector */}
        <div className="relative">
          <button
            onClick={() => setCameraMenuOpen(!cameraMenuOpen)}
            className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1"
            title="Camera Perspective & Ortho Views"
          >
            <Camera className="w-4 h-4 text-slate-300" />
          </button>

          {cameraMenuOpen && (
            <div className="absolute bottom-12 right-0 w-36 glass-panel-elevated p-1.5 rounded-xl border border-white/15 shadow-2xl flex flex-col gap-0.5 animate-in fade-in duration-150">
              {(['perspective', 'top', 'front', 'side', 'isometric'] as const).map((cam) => (
                <button
                  key={cam}
                  onClick={() => {
                    setCameraPreset(cam);
                    setCameraMenuOpen(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize text-left transition-colors ${
                    cameraPreset === cam
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cam}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grid Toggle */}
        <button
          onClick={() => setGridVisible(!gridVisible)}
          className={`p-2.5 rounded-xl transition-all ${
            gridVisible ? 'text-brand-400' : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Toggle Ground Grid"
        >
          <GridIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
