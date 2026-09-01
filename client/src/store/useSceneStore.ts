import { create } from 'zustand';
import { SceneObject, Annotation, SceneMetadata, SceneSnapshot, TransformData, ObjectType } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface HistoryState {
  objects: SceneObject[];
}

interface SceneStore {
  scene: SceneMetadata | null;
  objects: SceneObject[];
  annotations: Annotation[];
  selectedObjectId: string | null;
  selectedAnnotationId: string | null;
  isSaving: boolean;
  lastSavedAt: Date | null;
  
  // History for Undo/Redo
  undoStack: HistoryState[];
  redoStack: HistoryState[];

  // Actions
  setSceneSnapshot: (snapshot: SceneSnapshot) => void;
  updateSceneMetadata: (changes: Partial<SceneMetadata>) => void;
  selectObject: (id: string | null) => void;
  selectAnnotation: (id: string | null) => void;
  
  // Object manipulation
  addObject: (object: SceneObject, skipHistory?: boolean) => void;
  spawnPrimitive: (type: ObjectType, customProps?: Partial<SceneObject>) => SceneObject;
  updateObject: (id: string, changes: Partial<SceneObject>, recordHistory?: boolean) => void;
  updateObjectTransform: (id: string, transform: TransformData, recordHistory?: boolean) => void;
  removeObject: (id: string) => void;
  duplicateSelectedObject: () => SceneObject | null;
  
  // Annotation manipulation
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, changes: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;

  // History Actions
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  
  // Persistence state
  setIsSaving: (isSaving: boolean) => void;
  setLastSavedAt: (date: Date) => void;
}

export const useSceneStore = create<SceneStore>((set, get) => ({
  scene: null,
  objects: [],
  annotations: [],
  selectedObjectId: null,
  selectedAnnotationId: null,
  isSaving: false,
  lastSavedAt: null,
  undoStack: [],
  redoStack: [],

  setSceneSnapshot: (snapshot) => {
    set({
      scene: snapshot.scene,
      objects: snapshot.objects,
      annotations: snapshot.annotations,
      selectedObjectId: null,
      selectedAnnotationId: null,
      undoStack: [],
      redoStack: [],
      lastSavedAt: new Date(),
    });
  },

  updateSceneMetadata: (changes) => {
    set((state) => ({
      scene: state.scene ? { ...state.scene, ...changes, updatedAt: new Date().toISOString() } : null,
    }));
  },

  selectObject: (id) => {
    set({ selectedObjectId: id, selectedAnnotationId: null });
  },

  selectAnnotation: (id) => {
    set({ selectedAnnotationId: id, selectedObjectId: null });
  },

  pushHistory: () => {
    const { objects, undoStack } = get();
    set({
      undoStack: [...undoStack.slice(-30), { objects: JSON.parse(JSON.stringify(objects)) }],
      redoStack: [],
    });
  },

  undo: () => {
    const { undoStack, redoStack, objects } = get();
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);
    set({
      undoStack: newUndoStack,
      redoStack: [{ objects: JSON.parse(JSON.stringify(objects)) }, ...redoStack],
      objects: previous.objects,
    });
  },

  redo: () => {
    const { undoStack, redoStack, objects } = get();
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    const newRedoStack = redoStack.slice(1);
    set({
      undoStack: [...undoStack, { objects: JSON.parse(JSON.stringify(objects)) }],
      redoStack: newRedoStack,
      objects: next.objects,
    });
  },

  addObject: (object, skipHistory = false) => {
    if (!skipHistory) get().pushHistory();
    set((state) => ({
      objects: [...state.objects, object],
      selectedObjectId: object.id,
    }));
  },

  spawnPrimitive: (type, customProps = {}) => {
    get().pushHistory();
    const sceneId = get().scene?.id || 'default';
    const id = uuidv4();
    
    // Position slightly offset or on ground
    const currentCount = get().objects.length;
    const offsetX = ((currentCount % 4) - 1.5) * 2;
    const offsetZ = Math.floor(currentCount / 4) * 2;

    const defaultColors: Record<ObjectType, string> = {
      box: '#6366f1',
      sphere: '#06b6d4',
      cylinder: '#ec4899',
      cone: '#f59e0b',
      torus: '#10b981',
      plane: '#8b5cf6',
      capsule: '#3b82f6',
      gltf: '#e2e8f0',
      light: '#fef08a',
    };

    const newObj: SceneObject = {
      id,
      sceneId,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${currentCount + 1}`,
      type,
      visible: true,
      locked: false,
      transform: {
        position: [offsetX, 1, offsetZ],
        rotation: [0, 0, 0],
        scale: [1.5, 1.5, 1.5],
      },
      materialProps: {
        color: defaultColors[type] || '#6366f1',
        roughness: 0.2,
        metalness: 0.6,
        wireframe: false,
        opacity: 1,
        transparent: false,
        emissive: '#000000',
        emissiveIntensity: 0,
      },
      geometryData: {
        width: 1,
        height: 1,
        depth: 1,
        radius: 0.6,
        radialSegments: 32,
        tubularSegments: 32,
        tube: 0.2,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...customProps,
    };

    set((state) => ({
      objects: [...state.objects, newObj],
      selectedObjectId: newObj.id,
    }));

    return newObj;
  },

  updateObject: (id, changes, recordHistory = false) => {
    if (recordHistory) get().pushHistory();
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id
          ? {
              ...obj,
              ...changes,
              materialProps: changes.materialProps
                ? { ...obj.materialProps, ...changes.materialProps }
                : obj.materialProps,
              transform: changes.transform
                ? { ...obj.transform, ...changes.transform }
                : obj.transform,
              updatedAt: new Date().toISOString(),
            }
          : obj
      ),
    }));
  },

  updateObjectTransform: (id, transform, recordHistory = false) => {
    if (recordHistory) get().pushHistory();
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id
          ? {
              ...obj,
              transform,
              updatedAt: new Date().toISOString(),
            }
          : obj
      ),
    }));
  },

  removeObject: (id) => {
    get().pushHistory();
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
      selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
      // Remove attached annotations
      annotations: state.annotations.filter((ann) => ann.objectId !== id),
    }));
  },

  duplicateSelectedObject: () => {
    const { selectedObjectId, objects } = get();
    if (!selectedObjectId) return null;
    const target = objects.find((o) => o.id === selectedObjectId);
    if (!target) return null;

    get().pushHistory();
    const cloned: SceneObject = {
      ...JSON.parse(JSON.stringify(target)),
      id: uuidv4(),
      name: `${target.name} (Copy)`,
      transform: {
        ...target.transform,
        position: [
          target.transform.position[0] + 1.2,
          target.transform.position[1],
          target.transform.position[2] + 1.2,
        ],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      objects: [...state.objects, cloned],
      selectedObjectId: cloned.id,
    }));

    return cloned;
  },

  addAnnotation: (annotation) => {
    set((state) => ({
      annotations: [...state.annotations, annotation],
      selectedAnnotationId: annotation.id,
    }));
  },

  updateAnnotation: (id, changes) => {
    set((state) => ({
      annotations: state.annotations.map((ann) =>
        ann.id === id
          ? { ...ann, ...changes, updatedAt: new Date().toISOString() }
          : ann
      ),
    }));
  },

  removeAnnotation: (id) => {
    set((state) => ({
      annotations: state.annotations.filter((ann) => ann.id !== id),
      selectedAnnotationId: state.selectedAnnotationId === id ? null : state.selectedAnnotationId,
    }));
  },

  setIsSaving: (isSaving) => set({ isSaving }),
  setLastSavedAt: (lastSavedAt) => set({ lastSavedAt }),
}));
