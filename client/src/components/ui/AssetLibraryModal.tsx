import { useState, useEffect } from 'react';
import {
  UploadCloud,
  X,
  FileCode,
  Plus,
  Trash2,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useSceneStore } from '../../store/useSceneStore';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { UploadedAsset } from '../../types';

export function AssetLibraryModal() {
  const isAssetLibraryOpen = useUIStore((s) => s.isAssetLibraryOpen);
  const setAssetLibraryOpen = useUIStore((s) => s.setAssetLibraryOpen);

  const spawnPrimitive = useSceneStore((s) => s.spawnPrimitive);
  const scene = useSceneStore((s) => s.scene);

  const [assets, setAssets] = useState<UploadedAsset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Sample remote GLTF assets (public CDN 3D models)
  const sampleModels = [
    {
      name: 'Flight Helmet',
      url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/FlightHelmet/glTF/FlightHelmet.gltf',
      category: 'Sci-Fi Hardware',
      preview: '🪖',
    },
    {
      name: 'Damaged Helmet',
      url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
      category: 'PBR Showcase',
      preview: '🤖',
    },
    {
      name: 'Antique Camera',
      url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/AntiqueCamera/glTF-Binary/AntiqueCamera.glb',
      category: 'Electronics',
      preview: '📷',
    },
    {
      name: 'Sci-Fi Duck',
      url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb',
      category: 'Character',
      preview: '🦆',
    },
  ];

  useEffect(() => {
    if (isAssetLibraryOpen) {
      loadAssets();
    }
  }, [isAssetLibraryOpen]);

  const loadAssets = async () => {
    try {
      const data = await api.listAssets();
      setAssets(data);
    } catch (err) {
      console.error('Failed to load assets:', err);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsUploading(true);
    setUploadError(null);

    try {
      const uploaded = await api.uploadAsset(file);
      setAssets((prev) => [uploaded, ...prev]);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleInsertModel = (name: string, url: string) => {
    const created = spawnPrimitive('gltf', {
      name,
      assetUrl: url,
      assetName: name,
      transform: {
        position: [0, 1, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
    });

    if (scene) {
      const socket = getSocket();
      socket.emit('object:create', { sceneId: scene.id, object: created });
    }

    setAssetLibraryOpen(false);
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      await api.deleteAsset(id);
      setAssets((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Failed to delete asset:', err);
    }
  };

  if (!isAssetLibraryOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl glass-panel-elevated rounded-3xl border border-white/20 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-brand-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Outfit']">3D Asset Library</h2>
              <p className="text-xs text-slate-400">Import and spawn custom glTF / GLB models in your collaborative scene</p>
            </div>
          </div>
          <button
            onClick={() => setAssetLibraryOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Drag & Drop Upload Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFileUpload(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-white/20 hover:border-brand-500/60 bg-dark-800/60 hover:bg-brand-950/20 rounded-2xl p-6 text-center transition-all cursor-pointer relative"
          >
            <input
              type="file"
              accept=".glb,.gltf,.obj"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 mb-1">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-white">
                {isUploading ? 'Uploading & Processing Model...' : 'Click to Upload or Drag & Drop 3D Files'}
              </div>
              <div className="text-xs text-slate-400">
                Supports <span className="text-brand-300 font-mono">.GLB</span>, <span className="text-brand-300 font-mono">.GLTF</span> (up to 50MB)
              </div>
            </div>
          </div>

          {uploadError && (
            <div className="px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {uploadError}
            </div>
          )}

          {/* Sample Community 3D Models */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Featured 3D Samples
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {sampleModels.map((model) => (
                <div
                  key={model.name}
                  className="glass-panel p-3.5 rounded-2xl border border-white/10 hover:border-brand-500/40 flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{model.preview}</div>
                    <div>
                      <div className="text-xs font-bold text-white">{model.name}</div>
                      <div className="text-[10px] text-slate-400">{model.category}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleInsertModel(model.name, model.url)}
                    className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1 shadow-lg shadow-brand-500/30 transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Insert</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Uploaded Custom Assets */}
          {assets.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-neon-cyan" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Your Uploaded 3D Assets ({assets.length})
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="glass-panel p-3 rounded-2xl border border-white/10 flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                      <FileCode className="w-5 h-5 text-neon-cyan flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{asset.originalName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {(asset.size / (1024 * 1024)).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleInsertModel(asset.originalName, asset.url)}
                        className="px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1"
                        title="Insert into scene"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Insert</span>
                      </button>
                      <button
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400"
                        title="Delete asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
