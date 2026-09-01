import { useEffect, useMemo } from 'react';
import { SceneCanvas } from './components/canvas/SceneCanvas';
import { HeaderHUD } from './components/ui/HeaderHUD';
import { ToolbarHUD } from './components/ui/ToolbarHUD';
import { SceneHierarchyPanel } from './components/ui/SceneHierarchyPanel';
import { PropertyInspectorPanel } from './components/ui/PropertyInspectorPanel';
import { ChatDrawer } from './components/ui/ChatDrawer';
import { AssetLibraryModal } from './components/ui/AssetLibraryModal';
import { RoomJoinModal } from './components/ui/RoomJoinModal';
import { ShortcutsModal } from './components/ui/ShortcutsModal';
import { PerformanceStatsHUD } from './components/ui/PerformanceStatsHUD';
import { useSocket } from './hooks/useSocket';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useCollaborationStore } from './store/useCollaborationStore';
import { useSceneStore } from './store/useSceneStore';
import { useUIStore } from './store/useUIStore';

// Expose stores & helpers to Browser DevTools Console
if (typeof window !== 'undefined') {
  (window as any).useSceneStore = useSceneStore;
  (window as any).useCollaborationStore = useCollaborationStore;
  (window as any).useUIStore = useUIStore;
  (window as any).spatialSync = {
    getScene: () => useSceneStore.getState().scene,
    getObjects: () => useSceneStore.getState().objects,
    getSelectedObject: () => {
      const id = useSceneStore.getState().selectedObjectId;
      return useSceneStore.getState().objects.find((o) => o.id === id) || null;
    },
    getAnnotations: () => useSceneStore.getState().annotations,
    getUsers: () => useCollaborationStore.getState().users,
    getCurrentUser: () => useCollaborationStore.getState().currentUser,
    sceneStore: useSceneStore,
    collabStore: useCollaborationStore,
    uiStore: useUIStore,
  };
}

export function App() {
  // Extract room ID from URL or default to 'main-studio'
  const roomId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('room') || 'main-studio';
    useCollaborationStore.getState().setActiveRoomId(id);
    return id;
  }, []);

  // Initialize real-time WebSocket connection & room synchronization
  useSocket(roomId);

  // Initialize standard 3D viewport shortcuts (W, E, R, Del, Ctrl+D, Ctrl+Z, F)
  useKeyboardShortcuts();

  return (
    <div className="w-screen h-screen relative bg-dark-900 overflow-hidden font-['Inter']">
      {/* Primary 3D WebGL Canvas */}
      <SceneCanvas />

      {/* 2D Overlay HUD & Controls */}
      <HeaderHUD />
      <ToolbarHUD />
      <SceneHierarchyPanel />
      <PropertyInspectorPanel />
      <ChatDrawer />

      {/* Modals & Dialogs */}
      <AssetLibraryModal />
      <RoomJoinModal />
      <ShortcutsModal />
      <PerformanceStatsHUD />
    </div>
  );
}

export default App;
