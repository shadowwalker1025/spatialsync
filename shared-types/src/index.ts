export type ObjectType =
  | 'box'
  | 'sphere'
  | 'cylinder'
  | 'cone'
  | 'torus'
  | 'plane'
  | 'capsule'
  | 'gltf'
  | 'light';

export type TransformMode = 'translate' | 'rotate' | 'scale';

export type TransformSpace = 'world' | 'local';

export type EnvironmentPreset =
  | 'studio'
  | 'sunset'
  | 'dawn'
  | 'night'
  | 'cyberpunk'
  | 'minimal';

export interface TransformData {
  position: [number, number, number];
  rotation: [number, number, number]; // Euler angles in radians [x, y, z]
  scale: [number, number, number];
}

export interface MaterialProps {
  color: string;
  roughness: number;
  metalness: number;
  wireframe: boolean;
  opacity: number;
  transparent: boolean;
  emissive: string;
  emissiveIntensity: number;
  mapUrl?: string;
}

export interface GeometryData {
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
  radialSegments?: number;
  tubularSegments?: number;
  tube?: number;
  arc?: number;
  [key: string]: any;
}

export interface SceneObject {
  id: string;
  sceneId: string;
  name: string;
  type: ObjectType;
  visible: boolean;
  locked: boolean;
  lockedBy?: string | null; // User ID who holds the lock
  lockedByName?: string | null;
  lockedByColor?: string | null;
  transform: TransformData;
  materialProps: MaterialProps;
  geometryData: GeometryData;
  assetUrl?: string; // For glTF/GLB models
  assetName?: string;
  lastModifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Annotation {
  id: string;
  sceneId: string;
  objectId?: string | null; // Attached object ID if pinned to a mesh
  position: [number, number, number];
  normal?: [number, number, number];
  title?: string;
  text: string;
  authorId: string;
  authorName: string;
  authorColor: string;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SceneMetadata {
  id: string;
  name: string;
  description?: string;
  environmentPreset: EnvironmentPreset;
  backgroundColor: string;
  gridVisible: boolean;
  shadowsEnabled: boolean;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  createdAt: string;
  updatedAt: string;
}

export interface SceneSnapshot {
  scene: SceneMetadata;
  objects: SceneObject[];
  annotations: Annotation[];
}

export interface UserPresence {
  id: string;
  socketId: string;
  name: string;
  color: string;
  avatar?: string;
  cursor3D: [number, number, number] | null;
  cursorNormal?: [number, number, number] | null;
  selectedObjectId: string | null;
  activeGizmoMode: TransformMode | null;
  lastActive: number;
}

export interface ChatMessage {
  id: string;
  sceneId: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  text: string;
  timestamp: string;
  type: 'chat' | 'system';
}

export interface UploadedAsset {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

// ----------------------------------------------------
// WebSocket Event Payloads
// ----------------------------------------------------

export interface JoinRoomPayload {
  sceneId: string;
  user: {
    id: string;
    name: string;
    color: string;
    avatar?: string;
  };
}

export interface RoomInitPayload {
  scene: SceneSnapshot;
  users: UserPresence[];
  chatHistory: ChatMessage[];
  yourUser: UserPresence;
}

export interface CursorMovePayload {
  sceneId: string;
  userId: string;
  position: [number, number, number] | null;
  normal?: [number, number, number] | null;
}

export interface ObjectTransformPayload {
  sceneId: string;
  objectId: string;
  userId: string;
  transform: TransformData;
  isContinuous: boolean; // true during dragging, false on release
}

export interface ObjectSelectPayload {
  sceneId: string;
  objectId: string | null;
  userId: string;
  userName?: string;
  userColor?: string;
}

export interface ObjectCreatePayload {
  sceneId: string;
  object: SceneObject;
  userId: string;
}

export interface ObjectUpdatePayload {
  sceneId: string;
  objectId: string;
  changes: Partial<SceneObject>;
  userId: string;
}

export interface ObjectDeletePayload {
  sceneId: string;
  objectId: string;
  userId: string;
}

export interface AnnotationCreatePayload {
  sceneId: string;
  annotation: Annotation;
  userId: string;
}

export interface AnnotationUpdatePayload {
  sceneId: string;
  annotationId: string;
  changes: Partial<Annotation>;
  userId: string;
}

export interface AnnotationDeletePayload {
  sceneId: string;
  annotationId: string;
  userId: string;
}

export interface SendChatPayload {
  sceneId: string;
  text: string;
}

export interface SceneMetaUpdatePayload {
  sceneId: string;
  changes: Partial<SceneMetadata>;
  userId: string;
}
