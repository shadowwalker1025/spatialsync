import { useEffect } from 'react';
import { useUIStore } from '../store/useUIStore';
import { useSceneStore } from '../store/useSceneStore';
import { getSocket } from '../services/socket';

export function useKeyboardShortcuts() {
  const setTransformMode = useUIStore((s) => s.setTransformMode);
  const setActiveTool = useUIStore((s) => s.setActiveTool);
  const triggerFocus = useUIStore((s) => s.triggerFocus);
  
  const selectedObjectId = useSceneStore((s) => s.selectedObjectId);
  const objects = useSceneStore((s) => s.objects);
  const selectObject = useSceneStore((s) => s.selectObject);
  const removeObject = useSceneStore((s) => s.removeObject);
  const duplicateSelectedObject = useSceneStore((s) => s.duplicateSelectedObject);
  const undo = useSceneStore((s) => s.undo);
  const redo = useSceneStore((s) => s.redo);
  const scene = useSceneStore((s) => s.scene);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore keystrokes when typing inside inputs, textareas, or contenteditables
      const activeElement = document.activeElement;
      const isInput =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.tagName === 'SELECT' ||
        (activeElement as HTMLElement)?.isContentEditable;

      if (isInput) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Ctrl+Z
      if (modifier && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((modifier && e.key.toLowerCase() === 'y') || (modifier && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        redo();
        return;
      }

      // Duplicate: Ctrl+D
      if (modifier && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const cloned = duplicateSelectedObject();
        if (cloned && scene) {
          const socket = getSocket();
          socket.emit('object:create', { sceneId: scene.id, object: cloned });
        }
        return;
      }

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedObjectId && scene) {
          e.preventDefault();
          const targetId = selectedObjectId;
          removeObject(targetId);
          const socket = getSocket();
          socket.emit('object:delete', { sceneId: scene.id, objectId: targetId });
        }
        return;
      }

      // Transform tool shortcuts
      switch (e.key.toLowerCase()) {
        case 'w':
          setTransformMode('translate');
          setActiveTool('select');
          break;
        case 'e':
          setTransformMode('rotate');
          setActiveTool('select');
          break;
        case 'r':
          setTransformMode('scale');
          setActiveTool('select');
          break;
        case 'q':
        case 'v':
          setActiveTool('select');
          break;
        case 'c':
          setActiveTool('annotate');
          break;
        case 'f':
          if (selectedObjectId) {
            const target = objects.find((o) => o.id === selectedObjectId);
            if (target) {
              triggerFocus(target.transform.position);
            }
          }
          break;
        case 'escape':
          if (selectedObjectId && scene) {
            selectObject(null);
            const socket = getSocket();
            socket.emit('object:deselect', { sceneId: scene.id, objectId: selectedObjectId });
          }
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjectId, objects, scene, undo, redo, removeObject, duplicateSelectedObject, selectObject, setTransformMode, setActiveTool, triggerFocus]);
}
