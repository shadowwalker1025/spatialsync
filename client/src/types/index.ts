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
  rotation: [number, number, number]; // Radians
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
  lockedBy?: string | null;
  lockedByName?: string | null;
  lockedByColor?: string | null;
  transform: TransformData;
  materialProps: MaterialProps;
  geometryData: GeometryData;
  assetUrl?: string;
  assetName?: string;
  lastModifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Annotation {
  id: string;
  sceneId: string;
  objectId?: string | null;
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
