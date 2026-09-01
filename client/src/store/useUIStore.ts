import { create } from 'zustand';
import { TransformMode, TransformSpace, EnvironmentPreset } from '../types';

interface UIStore {
  // Transform & Gizmo Controls
  transformMode: TransformMode;
  transformSpace: TransformSpace;
  snapEnabled: boolean;
  snapTranslation: number; // units (e.g. 0.5)
  snapRotation: number;    // degrees (e.g. 15)
  snapScale: number;       // step (e.g. 0.25)
  activeTool: 'select' | 'annotate';

  // Panels & Modals
  isSceneTreeOpen: boolean;
  isInspectorOpen: boolean;
  isAnnotationsOpen: boolean;
  isAssetLibraryOpen: boolean;
  isChatOpen: boolean;
  isRoomModalOpen: boolean;
  isStatsOpen: boolean;
  isShortcutsOpen: boolean;

  // Scene View Settings
  environmentPreset: EnvironmentPreset;
  gridVisible: boolean;
  shadowsEnabled: boolean;
  statsFps: number;

  // Camera Presets & Focus
  cameraPreset: 'perspective' | 'top' | 'front' | 'side' | 'isometric';
  focusTarget: [number, number, number] | null;

  // Actions
  setTransformMode: (mode: TransformMode) => void;
  setTransformSpace: (space: TransformSpace) => void;
  toggleSnap: () => void;
  setSnapTranslation: (val: number) => void;
  setSnapRotation: (val: number) => void;
  setSnapScale: (val: number) => void;
  setActiveTool: (tool: 'select' | 'annotate') => void;

  toggleSceneTree: () => void;
  toggleInspector: () => void;
  toggleAnnotations: () => void;
  setAssetLibraryOpen: (open: boolean) => void;
  setChatOpen: (open: boolean) => void;
  setRoomModalOpen: (open: boolean) => void;
  setStatsOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;

  setEnvironmentPreset: (preset: EnvironmentPreset) => void;
  setGridVisible: (visible: boolean) => void;
  setShadowsEnabled: (enabled: boolean) => void;
  setStatsFps: (fps: number) => void;

  setCameraPreset: (preset: 'perspective' | 'top' | 'front' | 'side' | 'isometric') => void;
  triggerFocus: (target: [number, number, number]) => void;
  clearFocus: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  transformMode: 'translate',
  transformSpace: 'world',
  snapEnabled: false,
  snapTranslation: 0.5,
  snapRotation: 15,
  snapScale: 0.25,
  activeTool: 'select',

  isSceneTreeOpen: true,
  isInspectorOpen: true,
  isAnnotationsOpen: false,
  isAssetLibraryOpen: false,
  isChatOpen: false,
  isRoomModalOpen: false,
  isStatsOpen: false,
  isShortcutsOpen: false,

  environmentPreset: 'studio',
  gridVisible: true,
  shadowsEnabled: true,
  statsFps: 60,

  cameraPreset: 'perspective',
  focusTarget: null,

  setTransformMode: (transformMode) => set({ transformMode }),
  setTransformSpace: (transformSpace) => set({ transformSpace }),
  toggleSnap: () => set((state) => ({ snapEnabled: !state.snapEnabled })),
  setSnapTranslation: (snapTranslation) => set({ snapTranslation }),
  setSnapRotation: (snapRotation) => set({ snapRotation }),
  setSnapScale: (snapScale) => set({ snapScale }),
  setActiveTool: (activeTool) => set({ activeTool }),

  toggleSceneTree: () => set((state) => ({ isSceneTreeOpen: !state.isSceneTreeOpen })),
  toggleInspector: () => set((state) => ({ isInspectorOpen: !state.isInspectorOpen })),
  toggleAnnotations: () => set((state) => ({ isAnnotationsOpen: !state.isAnnotationsOpen })),
  setAssetLibraryOpen: (isAssetLibraryOpen) => set({ isAssetLibraryOpen }),
  setChatOpen: (isChatOpen) => set({ isChatOpen }),
  setRoomModalOpen: (isRoomModalOpen) => set({ isRoomModalOpen }),
  setStatsOpen: (isStatsOpen) => set({ isStatsOpen }),
  setShortcutsOpen: (isShortcutsOpen) => set({ isShortcutsOpen }),

  setEnvironmentPreset: (environmentPreset) => set({ environmentPreset }),
  setGridVisible: (gridVisible) => set({ gridVisible }),
  setShadowsEnabled: (shadowsEnabled) => set({ shadowsEnabled }),
  setStatsFps: (statsFps) => set({ statsFps }),

  setCameraPreset: (cameraPreset) => set({ cameraPreset }),
  triggerFocus: (target) => set({ focusTarget: target }),
  clearFocus: () => set({ focusTarget: null }),
}));
