import { prisma } from '../models/prisma';
import { redisService } from './redis.service';
import { v4 as uuidv4 } from 'uuid';

export interface DefaultSceneTemplateOptions {
  name?: string;
  environmentPreset?: string;
}

export class SceneService {
  /**
   * Initializes a default rich 3D scene with primitives and starter materials
   */
  public async createScene(options?: DefaultSceneTemplateOptions) {
    const sceneId = uuidv4();
    const name = options?.name || `3D Spatial Project #${Math.floor(1000 + Math.random() * 9000)}`;
    const env = options?.environmentPreset || 'studio';

    const scene = await prisma.scene.create({
      data: {
        id: sceneId,
        name,
        description: 'Real-time collaborative 3D workspace',
        environmentPreset: env,
        backgroundColor: '#0a0d14',
        gridVisible: true,
        shadowsEnabled: true,
        cameraPosition: JSON.stringify([8, 8, 12]),
        cameraTarget: JSON.stringify([0, 1, 0]),
      },
    });

    // Spawn rich initial 3D objects
    const defaultObjects = [
      {
        id: uuidv4(),
        sceneId: scene.id,
        name: 'Cyber Core Box',
        type: 'box',
        visible: true,
        locked: false,
        transform: JSON.stringify({
          position: [-2.5, 1, 0],
          rotation: [0, 0.45, 0],
          scale: [1.8, 1.8, 1.8],
        }),
        materialProps: JSON.stringify({
          color: '#6366f1',
          roughness: 0.15,
          metalness: 0.85,
          wireframe: false,
          opacity: 1,
          transparent: false,
          emissive: '#1e1b4b',
          emissiveIntensity: 0.3,
        }),
        geometryData: JSON.stringify({ width: 1, height: 1, depth: 1 }),
      },
      {
        id: uuidv4(),
        sceneId: scene.id,
        name: 'Quantum Chrome Sphere',
        type: 'sphere',
        visible: true,
        locked: false,
        transform: JSON.stringify({
          position: [0.5, 1.2, -1],
          rotation: [0, 0, 0],
          scale: [2.2, 2.2, 2.2],
        }),
        materialProps: JSON.stringify({
          color: '#06b6d4',
          roughness: 0.05,
          metalness: 0.95,
          wireframe: false,
          opacity: 1,
          transparent: false,
          emissive: '#083344',
          emissiveIntensity: 0.2,
        }),
        geometryData: JSON.stringify({ radius: 0.5, radialSegments: 32 }),
      },
      {
        id: uuidv4(),
        sceneId: scene.id,
        name: 'Neon Glass Cylinder',
        type: 'cylinder',
        visible: true,
        locked: false,
        transform: JSON.stringify({
          position: [3, 1.5, 1],
          rotation: [0, 0, 0],
          scale: [1.4, 2.5, 1.4],
        }),
        materialProps: JSON.stringify({
          color: '#ec4899',
          roughness: 0.2,
          metalness: 0.4,
          wireframe: false,
          opacity: 0.85,
          transparent: true,
          emissive: '#831843',
          emissiveIntensity: 0.5,
        }),
        geometryData: JSON.stringify({ radius: 0.5, height: 1, radialSegments: 32 }),
      },
      {
        id: uuidv4(),
        sceneId: scene.id,
        name: 'Torus Beacon',
        type: 'torus',
        visible: true,
        locked: false,
        transform: JSON.stringify({
          position: [0, 2.8, 1.5],
          rotation: [1.2, 0.4, 0],
          scale: [1.2, 1.2, 1.2],
        }),
        materialProps: JSON.stringify({
          color: '#10b981',
          roughness: 0.3,
          metalness: 0.7,
          wireframe: false,
          opacity: 1,
          transparent: false,
          emissive: '#064e3b',
          emissiveIntensity: 0.4,
        }),
        geometryData: JSON.stringify({ radius: 0.7, tube: 0.2, radialSegments: 24, tubularSegments: 48 }),
      },
    ];

    for (const obj of defaultObjects) {
      await prisma.sceneObject.create({ data: obj });
    }

    // Default sample annotation
    await prisma.annotation.create({
      data: {
        id: uuidv4(),
        sceneId: scene.id,
        position: JSON.stringify([0.5, 2.4, -1]),
        normal: JSON.stringify([0, 1, 0]),
        title: 'Central Focus Point',
        text: 'Synchronous spatial anchor. Try dragging with the Transform Gizmo or pinning new annotations!',
        authorId: 'system',
        authorName: 'Spatial Bot',
        authorColor: '#8b5cf6',
        resolved: false,
      },
    });

    return this.getSceneSnapshot(scene.id);
  }

  /**
   * Fetches full scene snapshot (metadata, parsed objects, and annotations)
   */
  public async getSceneSnapshot(sceneId: string) {
    let scene = await prisma.scene.findUnique({
      where: { id: sceneId },
      include: {
        objects: true,
        annotations: true,
      },
    });

    // Auto-create if scene doesn't exist (e.g. user visits custom room ID)
    if (!scene) {
      scene = await prisma.scene.create({
        data: {
          id: sceneId,
          name: `Room ${sceneId.substring(0, 8)}`,
          environmentPreset: 'studio',
          backgroundColor: '#0a0d14',
          cameraPosition: JSON.stringify([8, 8, 12]),
          cameraTarget: JSON.stringify([0, 1, 0]),
        },
        include: {
          objects: true,
          annotations: true,
        },
      });
    }

    const parsedObjects = scene.objects.map((obj) => ({
      ...obj,
      transform: JSON.parse(obj.transform),
      materialProps: JSON.parse(obj.materialProps),
      geometryData: JSON.parse(obj.geometryData || '{}'),
      createdAt: obj.createdAt.toISOString(),
      updatedAt: obj.updatedAt.toISOString(),
    }));

    const parsedAnnotations = scene.annotations.map((ann) => ({
      ...ann,
      position: JSON.parse(ann.position),
      normal: ann.normal ? JSON.parse(ann.normal) : undefined,
      createdAt: ann.createdAt.toISOString(),
      updatedAt: ann.updatedAt.toISOString(),
    }));

    const parsedMetadata = {
      id: scene.id,
      name: scene.name,
      description: scene.description || undefined,
      environmentPreset: scene.environmentPreset as any,
      backgroundColor: scene.backgroundColor,
      gridVisible: scene.gridVisible,
      shadowsEnabled: scene.shadowsEnabled,
      cameraPosition: JSON.parse(scene.cameraPosition),
      cameraTarget: JSON.parse(scene.cameraTarget),
      createdAt: scene.createdAt.toISOString(),
      updatedAt: scene.updatedAt.toISOString(),
    };

    return {
      scene: parsedMetadata,
      objects: parsedObjects,
      annotations: parsedAnnotations,
    };
  }

  /**
   * Lists all recent scenes
   */
  public async listScenes() {
    const scenes = await prisma.scene.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: {
        _count: {
          select: { objects: true, annotations: true },
        },
      },
    });

    return scenes.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      environmentPreset: s.environmentPreset,
      objectCount: s._count.objects,
      annotationCount: s._count.annotations,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  }

  /**
   * Persists entire scene state snapshot (REST save or background sync)
   */
  public async saveSceneSnapshot(sceneId: string, snapshot: {
    name?: string;
    environmentPreset?: string;
    backgroundColor?: string;
    gridVisible?: boolean;
    shadowsEnabled?: boolean;
    objects?: any[];
    annotations?: any[];
  }) {
    // 1. Update scene metadata
    await prisma.scene.upsert({
      where: { id: sceneId },
      update: {
        name: snapshot.name,
        environmentPreset: snapshot.environmentPreset,
        backgroundColor: snapshot.backgroundColor,
        gridVisible: snapshot.gridVisible,
        shadowsEnabled: snapshot.shadowsEnabled,
      },
      create: {
        id: sceneId,
        name: snapshot.name || 'Collaborative Scene',
        environmentPreset: snapshot.environmentPreset || 'studio',
      },
    });

    // 2. Sync objects if provided
    if (snapshot.objects) {
      for (const obj of snapshot.objects) {
        await prisma.sceneObject.upsert({
          where: { id: obj.id },
          update: {
            name: obj.name,
            type: obj.type,
            visible: obj.visible ?? true,
            locked: obj.locked ?? false,
            lockedBy: obj.lockedBy,
            lockedByName: obj.lockedByName,
            lockedByColor: obj.lockedByColor,
            transform: JSON.stringify(obj.transform),
            materialProps: JSON.stringify(obj.materialProps),
            geometryData: JSON.stringify(obj.geometryData || {}),
            assetUrl: obj.assetUrl,
            assetName: obj.assetName,
            lastModifiedBy: obj.lastModifiedBy,
          },
          create: {
            id: obj.id,
            sceneId,
            name: obj.name,
            type: obj.type,
            visible: obj.visible ?? true,
            locked: obj.locked ?? false,
            lockedBy: obj.lockedBy,
            lockedByName: obj.lockedByName,
            lockedByColor: obj.lockedByColor,
            transform: JSON.stringify(obj.transform),
            materialProps: JSON.stringify(obj.materialProps),
            geometryData: JSON.stringify(obj.geometryData || {}),
            assetUrl: obj.assetUrl,
            assetName: obj.assetName,
            lastModifiedBy: obj.lastModifiedBy,
          },
        });
      }
    }

    // 3. Sync annotations if provided
    if (snapshot.annotations) {
      for (const ann of snapshot.annotations) {
        await prisma.annotation.upsert({
          where: { id: ann.id },
          update: {
            objectId: ann.objectId,
            position: JSON.stringify(ann.position),
            normal: ann.normal ? JSON.stringify(ann.normal) : undefined,
            title: ann.title,
            text: ann.text,
            authorName: ann.authorName,
            authorColor: ann.authorColor,
            resolved: ann.resolved,
          },
          create: {
            id: ann.id,
            sceneId,
            objectId: ann.objectId,
            position: JSON.stringify(ann.position),
            normal: ann.normal ? JSON.stringify(ann.normal) : undefined,
            title: ann.title,
            text: ann.text,
            authorId: ann.authorId || 'anon',
            authorName: ann.authorName,
            authorColor: ann.authorColor,
            resolved: ann.resolved,
          },
        });
      }
    }

    return this.getSceneSnapshot(sceneId);
  }

  /**
   * Delete a scene
   */
  public async deleteScene(sceneId: string) {
    return prisma.scene.delete({ where: { id: sceneId } });
  }

  /**
   * Upsert single object in DB
   */
  public async upsertObject(sceneId: string, obj: any) {
    return prisma.sceneObject.upsert({
      where: { id: obj.id },
      update: {
        name: obj.name,
        type: obj.type,
        visible: obj.visible,
        locked: obj.locked,
        lockedBy: obj.lockedBy,
        lockedByName: obj.lockedByName,
        lockedByColor: obj.lockedByColor,
        transform: JSON.stringify(obj.transform),
        materialProps: JSON.stringify(obj.materialProps),
        geometryData: JSON.stringify(obj.geometryData || {}),
        assetUrl: obj.assetUrl,
        assetName: obj.assetName,
        lastModifiedBy: obj.lastModifiedBy,
      },
      create: {
        id: obj.id,
        sceneId,
        name: obj.name,
        type: obj.type,
        visible: obj.visible ?? true,
        locked: obj.locked ?? false,
        lockedBy: obj.lockedBy,
        lockedByName: obj.lockedByName,
        lockedByColor: obj.lockedByColor,
        transform: JSON.stringify(obj.transform),
        materialProps: JSON.stringify(obj.materialProps),
        geometryData: JSON.stringify(obj.geometryData || {}),
        assetUrl: obj.assetUrl,
        assetName: obj.assetName,
        lastModifiedBy: obj.lastModifiedBy,
      },
    });
  }

  /**
   * Delete single object
   */
  public async deleteObject(objectId: string) {
    try {
      return await prisma.sceneObject.delete({ where: { id: objectId } });
    } catch {
      return null;
    }
  }

  /**
   * Upsert annotation
   */
  public async upsertAnnotation(sceneId: string, ann: any) {
    return prisma.annotation.upsert({
      where: { id: ann.id },
      update: {
        title: ann.title,
        text: ann.text,
        resolved: ann.resolved,
        position: JSON.stringify(ann.position),
        normal: ann.normal ? JSON.stringify(ann.normal) : undefined,
      },
      create: {
        id: ann.id,
        sceneId,
        objectId: ann.objectId,
        position: JSON.stringify(ann.position),
        normal: ann.normal ? JSON.stringify(ann.normal) : undefined,
        title: ann.title,
        text: ann.text,
        authorId: ann.authorId || 'anon',
        authorName: ann.authorName || 'Guest',
        authorColor: ann.authorColor || '#8b5cf6',
        resolved: ann.resolved ?? false,
      },
    });
  }

  /**
   * Delete annotation
   */
  public async deleteAnnotation(annotationId: string) {
    try {
      return await prisma.annotation.delete({ where: { id: annotationId } });
    } catch {
      return null;
    }
  }
}

export const sceneService = new SceneService();
