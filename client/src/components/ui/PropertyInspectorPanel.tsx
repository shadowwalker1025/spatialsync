import { useState } from 'react';
import {
  Sliders,
  ChevronRight,
  ChevronLeft,
  Palette,
  Maximize2,
  RotateCw,
  Move,
  Lock,
  Unlock,
  Sparkles,
} from 'lucide-react';
import { useSceneStore } from '../../store/useSceneStore';
import { useUIStore } from '../../store/useUIStore';
import { getSocket } from '../../services/socket';
import { radToDeg, degToRad, round } from '../../utils/math';

export function PropertyInspectorPanel() {
  const selectedObjectId = useSceneStore((s) => s.selectedObjectId);
  const objects = useSceneStore((s) => s.objects);
  const updateObject = useSceneStore((s) => s.updateObject);
  const scene = useSceneStore((s) => s.scene);

  const isInspectorOpen = useUIStore((s) => s.isInspectorOpen);
  const toggleInspector = useUIStore((s) => s.toggleInspector);

  const [uniformScale, setUniformScale] = useState(true);

  const selectedObject = objects.find((o) => o.id === selectedObjectId);

  if (!isInspectorOpen) {
    return (
      <div className="absolute top-16 right-3 z-20 pointer-events-auto">
        <button
          onClick={toggleInspector}
          className="glass-panel p-2.5 rounded-xl text-slate-300 hover:text-white shadow-xl hover:scale-105 transition-all"
          title="Expand Property Inspector"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const handleNameChange = (name: string) => {
    if (!selectedObjectId) return;
    updateObject(selectedObjectId, { name });
    if (scene) {
      const socket = getSocket();
      socket.emit('object:update', { sceneId: scene.id, objectId: selectedObjectId, changes: { name } });
    }
  };

  const handlePositionChange = (axis: 0 | 1 | 2, val: number) => {
    if (!selectedObject) return;
    const newPos = [...selectedObject.transform.position] as [number, number, number];
    newPos[axis] = val;
    const transform = { ...selectedObject.transform, position: newPos };
    updateObject(selectedObject.id, { transform }, true);
    if (scene) {
      const socket = getSocket();
      socket.emit('object:transform-end', { sceneId: scene.id, objectId: selectedObject.id, transform });
    }
  };

  const handleRotationChange = (axis: 0 | 1 | 2, degVal: number) => {
    if (!selectedObject) return;
    const newRot = [...selectedObject.transform.rotation] as [number, number, number];
    newRot[axis] = degToRad(degVal);
    const transform = { ...selectedObject.transform, rotation: newRot };
    updateObject(selectedObject.id, { transform }, true);
    if (scene) {
      const socket = getSocket();
      socket.emit('object:transform-end', { sceneId: scene.id, objectId: selectedObject.id, transform });
    }
  };

  const handleScaleChange = (axis: 0 | 1 | 2, val: number) => {
    if (!selectedObject) return;
    let newScale = [...selectedObject.transform.scale] as [number, number, number];
    if (uniformScale) {
      newScale = [val, val, val];
    } else {
      newScale[axis] = val;
    }
    const transform = { ...selectedObject.transform, scale: newScale };
    updateObject(selectedObject.id, { transform }, true);
    if (scene) {
      const socket = getSocket();
      socket.emit('object:transform-end', { sceneId: scene.id, objectId: selectedObject.id, transform });
    }
  };

  const handleMaterialChange = (changes: any) => {
    if (!selectedObject) return;
    updateObject(selectedObject.id, { materialProps: changes }, true);
    if (scene) {
      const socket = getSocket();
      socket.emit('object:update', {
        sceneId: scene.id,
        objectId: selectedObject.id,
        changes: { materialProps: { ...selectedObject.materialProps, ...changes } },
      });
    }
  };

  const materialPresets = [
    { name: 'Chrome', color: '#e2e8f0', roughness: 0.05, metalness: 0.95 },
    { name: 'Glass', color: '#93c5fd', roughness: 0.1, metalness: 0.2, opacity: 0.6, transparent: true },
    { name: 'Neon Cyber', color: '#06b6d4', roughness: 0.1, metalness: 0.8, emissive: '#083344', emissiveIntensity: 0.6 },
    { name: 'Gold', color: '#facc15', roughness: 0.2, metalness: 0.9 },
    { name: 'Obsidian', color: '#1e1b4b', roughness: 0.3, metalness: 0.7 },
    { name: 'Matte Coral', color: '#fb7185', roughness: 0.85, metalness: 0.0 },
  ];

  return (
    <div className="absolute top-16 right-3 bottom-24 z-20 w-72 transition-all duration-300 pointer-events-auto flex">
      <div className="w-full h-full glass-panel rounded-2xl flex flex-col shadow-2xl border border-white/10 overflow-hidden">
        {/* Panel Header */}
        <div className="px-3.5 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-400" />
            <span className="font-semibold text-xs text-white uppercase tracking-wider font-['Outfit']">
              Property Inspector
            </span>
          </div>
          <button
            onClick={toggleInspector}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Collapse Inspector"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          {!selectedObject ? (
            <div className="text-center py-16 text-xs text-slate-500">
              <p>No 3D object selected.</p>
              <p className="mt-1 text-[11px] text-slate-600">Click any mesh in the canvas or scene tree to inspect properties.</p>
            </div>
          ) : (
            <>
              {/* Object Name */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                  Object Name
                </label>
                <input
                  type="text"
                  value={selectedObject.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 glass-input rounded-xl text-xs font-semibold"
                />
              </div>

              {/* Transform - Position */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  <Move className="w-3 h-3 text-brand-400" />
                  <span>Position (XYZ)</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['X', 'Y', 'Z'] as const).map((axis, i) => (
                    <div key={axis} className="flex items-center glass-input rounded-lg px-2 py-1">
                      <span className="text-[10px] font-bold text-brand-400 mr-1.5">{axis}</span>
                      <input
                        type="number"
                        step={0.1}
                        value={round(selectedObject.transform.position[i], 2)}
                        onChange={(e) => handlePositionChange(i as any, parseFloat(e.target.value) || 0)}
                        className="w-full bg-transparent text-xs font-mono focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Transform - Rotation */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  <RotateCw className="w-3 h-3 text-neon-cyan" />
                  <span>Rotation (Degrees)</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['X', 'Y', 'Z'] as const).map((axis, i) => (
                    <div key={axis} className="flex items-center glass-input rounded-lg px-2 py-1">
                      <span className="text-[10px] font-bold text-neon-cyan mr-1.5">{axis}</span>
                      <input
                        type="number"
                        step={5}
                        value={round(radToDeg(selectedObject.transform.rotation[i]), 1)}
                        onChange={(e) => handleRotationChange(i as any, parseFloat(e.target.value) || 0)}
                        className="w-full bg-transparent text-xs font-mono focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Transform - Scale */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Maximize2 className="w-3 h-3 text-neon-pink" />
                    <span>Scale</span>
                  </div>
                  <button
                    onClick={() => setUniformScale(!uniformScale)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                    title={uniformScale ? 'Uniform Scaling (ON)' : 'Uniform Scaling (OFF)'}
                  >
                    {uniformScale ? <Lock className="w-3 h-3 text-neon-pink" /> : <Unlock className="w-3 h-3" />}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['X', 'Y', 'Z'] as const).map((axis, i) => (
                    <div key={axis} className="flex items-center glass-input rounded-lg px-2 py-1">
                      <span className="text-[10px] font-bold text-neon-pink mr-1.5">{axis}</span>
                      <input
                        type="number"
                        step={0.1}
                        min={0.01}
                        value={round(selectedObject.transform.scale[i], 2)}
                        onChange={(e) => handleScaleChange(i as any, parseFloat(e.target.value) || 0.1)}
                        className="w-full bg-transparent text-xs font-mono focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full h-px bg-white/10" />

              {/* Material Editor */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  <Palette className="w-3 h-3 text-emerald-400" />
                  <span>Material & Shading</span>
                </div>

                {/* Base Color Picker */}
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Base Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedObject.materialProps?.color || '#6366f1'}
                      onChange={(e) => handleMaterialChange({ color: e.target.value })}
                      className="w-8 h-8 rounded-lg border border-white/20 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={selectedObject.materialProps?.color || '#6366f1'}
                      onChange={(e) => handleMaterialChange({ color: e.target.value })}
                      className="flex-1 px-2.5 py-1.5 glass-input rounded-xl text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Roughness Slider */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Roughness</span>
                    <span className="font-mono text-slate-300">
                      {round(selectedObject.materialProps?.roughness ?? 0.2, 2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={selectedObject.materialProps?.roughness ?? 0.2}
                    onChange={(e) => handleMaterialChange({ roughness: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-dark-700 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Metalness Slider */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Metalness</span>
                    <span className="font-mono text-slate-300">
                      {round(selectedObject.materialProps?.metalness ?? 0.5, 2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={selectedObject.materialProps?.metalness ?? 0.5}
                    onChange={(e) => handleMaterialChange({ metalness: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-dark-700 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Opacity Slider */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Opacity</span>
                    <span className="font-mono text-slate-300">
                      {round(selectedObject.materialProps?.opacity ?? 1, 2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={selectedObject.materialProps?.opacity ?? 1}
                    onChange={(e) => {
                      const op = parseFloat(e.target.value);
                      handleMaterialChange({ opacity: op, transparent: op < 1 });
                    }}
                    className="w-full h-1.5 bg-dark-700 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Wireframe Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-300">Wireframe Mode</span>
                  <input
                    type="checkbox"
                    checked={selectedObject.materialProps?.wireframe || false}
                    onChange={(e) => handleMaterialChange({ wireframe: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-500 cursor-pointer accent-brand-500"
                  />
                </div>

                {/* Material Presets */}
                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Quick Shader Presets</span>
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {materialPresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handleMaterialChange(preset)}
                        className="px-2 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 border border-white/5 text-[10px] font-medium text-slate-300 hover:text-white transition-all text-left flex items-center gap-1.5"
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.color }} />
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
