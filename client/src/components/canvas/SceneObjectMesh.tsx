import React, { useRef, useState, useMemo, Suspense } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { SceneObject, TransformData } from '../../types';
import { useSceneStore } from '../../store/useSceneStore';
import { useCollaborationStore } from '../../store/useCollaborationStore';
import { useUIStore } from '../../store/useUIStore';
import { useGPUDisposal } from '../../hooks/useGPUDisposal';
import { useTransformThrottle } from '../../hooks/useTransformThrottle';
import { GLTFModelViewer } from './GLTFModelViewer';
import { getSocket } from '../../services/socket';
import { degToRad } from '../../utils/math';

interface SceneObjectMeshProps {
  object: SceneObject;
  orbitControlsRef?: React.RefObject<any>;
}

export function SceneObjectMesh({ object, orbitControlsRef }: SceneObjectMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const gpuRef = useGPUDisposal();

  const selectedObjectId = useSceneStore((s) => s.selectedObjectId);
  const selectObject = useSceneStore((s) => s.selectObject);
  const updateObjectTransform = useSceneStore((s) => s.updateObjectTransform);
  const scene = useSceneStore((s) => s.scene);
  const activeTool = useUIStore((s) => s.activeTool);
  const transformMode = useUIStore((s) => s.transformMode);
  const transformSpace = useUIStore((s) => s.transformSpace);
  const snapEnabled = useUIStore((s) => s.snapEnabled);
  const snapTranslation = useUIStore((s) => s.snapTranslation);
  const snapRotation = useUIStore((s) => s.snapRotation);
  const snapScale = useUIStore((s) => s.snapScale);
  const addAnnotation = useSceneStore((s) => s.addAnnotation);
  const currentUser = useCollaborationStore((s) => s.currentUser);

  const remoteTransforms = useCollaborationStore((s) => s.remoteTransforms);
  const remoteLocks = useCollaborationStore((s) => s.remoteLocks);

  const { emitContinuousTransform, emitFinalTransform } = useTransformThrottle(
    scene?.id || 'default',
    object.id
  );

  const [hovered, setHovered] = useState(false);

  const isSelected = selectedObjectId === object.id;
  const remoteLock = remoteLocks[object.id];
  const isLockedByPeer = !!remoteLock && remoteLock.userId !== currentUser.id;

  // Target transform vectors for smooth useFrame lerping
  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const targetRot = useMemo(() => new THREE.Euler(), []);
  const targetQuat = useMemo(() => new THREE.Quaternion(), []);
  const targetScale = useMemo(() => new THREE.Vector3(1, 1, 1), []);

  // Sync initial transforms to group
  React.useEffect(() => {
    if (groupRef.current && !remoteTransforms[object.id]) {
      groupRef.current.position.set(...object.transform.position);
      groupRef.current.rotation.set(...object.transform.rotation);
      groupRef.current.scale.set(...object.transform.scale);
    }
  }, [object.transform, remoteTransforms]);

  // High-performance 60+ FPS interpolation loop decoupled from React state
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const remoteDelta = remoteTransforms[object.id];
    if (remoteDelta) {
      targetPos.set(...remoteDelta.transform.position);
      targetRot.set(...remoteDelta.transform.rotation);
      targetQuat.setFromEuler(targetRot);
      targetScale.set(...remoteDelta.transform.scale);

      // Smooth interpolation
      const lerpFactor = Math.min(delta * 22, 1);
      groupRef.current.position.lerp(targetPos, lerpFactor);
      groupRef.current.quaternion.slerp(targetQuat, lerpFactor);
      groupRef.current.scale.lerp(targetScale, lerpFactor);
    }
  });

  // Handle pointer selection & annotation pinning
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();

    // If Annotation tool is active, place a pin on this exact surface point
    if (activeTool === 'annotate' && e.point && scene) {
      const normal = e.face?.normal
        ? [e.face.normal.x, e.face.normal.y, e.face.normal.z] as [number, number, number]
        : [0, 1, 0] as [number, number, number];

      const newAnnotation = {
        id: `ann-${Date.now()}`,
        sceneId: scene.id,
        objectId: object.id,
        position: [e.point.x, e.point.y, e.point.z] as [number, number, number],
        normal,
        title: `Pin on ${object.name}`,
        text: 'New spatial note...',
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorColor: currentUser.color,
        resolved: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addAnnotation(newAnnotation);
      const socket = getSocket();
      socket.emit('annotation:create', { sceneId: scene.id, annotation: newAnnotation });
      return;
    }

    if (isLockedByPeer) return;

    if (!isSelected) {
      selectObject(object.id);
      if (scene) {
        const socket = getSocket();
        socket.emit('object:select', { sceneId: scene.id, objectId: object.id });
      }
    }
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    if (activeTool === 'select' && !isLockedByPeer) {
      document.body.style.cursor = 'pointer';
    } else if (activeTool === 'annotate') {
      document.body.style.cursor = 'crosshair';
    }
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = activeTool === 'annotate' ? 'crosshair' : 'default';
  };

  // Render geometry by primitive type
  const renderGeometry = () => {
    const geo = object.geometryData || {};
    switch (object.type) {
      case 'sphere':
        return <sphereGeometry args={[geo.radius || 0.6, geo.radialSegments || 32, 32]} />;
      case 'cylinder':
        return <cylinderGeometry args={[geo.radius || 0.5, geo.radius || 0.5, geo.height || 1, geo.radialSegments || 32]} />;
      case 'cone':
        return <coneGeometry args={[geo.radius || 0.6, geo.height || 1.2, 32]} />;
      case 'torus':
        return <torusGeometry args={[geo.radius || 0.6, geo.tube || 0.2, geo.radialSegments || 24, geo.tubularSegments || 48]} />;
      case 'plane':
        return <planeGeometry args={[geo.width || 2, geo.height || 2]} />;
      case 'capsule':
        return <capsuleGeometry args={[geo.radius || 0.4, geo.height || 0.8, 8, 16]} />;
      case 'box':
      default:
        return <boxGeometry args={[geo.width || 1, geo.height || 1, geo.depth || 1]} />;
    }
  };

  const mat = object.materialProps;

  return (
    <>
      <group
        ref={groupRef}
        name={object.name}
        userData={{ objectId: object.id }}
        visible={object.visible}
      >
      <group ref={gpuRef as any}>
        {object.type === 'gltf' && object.assetUrl ? (
          <Suspense
            fallback={
              <mesh castShadow receiveShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#64748b" wireframe />
              </mesh>
            }
          >
            <group
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
            >
              <GLTFModelViewer url={object.assetUrl} materialProps={mat} />
            </group>
          </Suspense>
        ) : (
          <mesh
            ref={meshRef}
            castShadow
            receiveShadow
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            {renderGeometry()}
            <meshStandardMaterial
              color={mat.color}
              roughness={mat.roughness}
              metalness={mat.metalness}
              wireframe={mat.wireframe}
              opacity={mat.opacity}
              transparent={mat.transparent || mat.opacity < 1}
              emissive={mat.emissive || '#000000'}
              emissiveIntensity={mat.emissiveIntensity || 0}
            />
          </mesh>
        )}
      </group>

      {/* Visual Hover & Selection Bounding Box Indicator */}
      {(hovered || isSelected) && !isLockedByPeer && (
        <lineSegments>
          <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(1.05, 1.05, 1.05)]} />
          <lineBasicMaterial
            attach="material"
            color={isSelected ? '#818cf8' : '#38bdf8'}
            linewidth={2}
          />
        </lineSegments>
      )}

      {/* Remote Peer Lock Bounding Box & Floating Badge */}
      {isLockedByPeer && (
        <>
          <lineSegments>
            <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(1.08, 1.08, 1.08)]} />
            <lineBasicMaterial
              attach="material"
              color={remoteLock.userColor || '#f43f5e'}
              linewidth={2}
            />
          </lineSegments>
          <Html position={[0, 1.2, 0]} center distanceFactor={12}>
            <div
              className="px-2 py-0.5 rounded text-[11px] font-semibold text-white shadow-lg flex items-center gap-1.5 whitespace-nowrap pointer-events-none animate-pulse"
              style={{ backgroundColor: remoteLock.userColor || '#f43f5e' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              Editing: {remoteLock.userName || 'Peer'}
            </div>
          </Html>
        </>
      )}
    </group>

    {/* Interactive 3D Transform Gizmo (Translate, Rotate, Scale) */}
    {isSelected && activeTool === 'select' && !isLockedByPeer && (
      <TransformControls
        object={groupRef as any}
        mode={transformMode}
        space={transformSpace}
        translationSnap={snapEnabled ? snapTranslation : null}
        rotationSnap={snapEnabled ? degToRad(snapRotation) : null}
        scaleSnap={snapEnabled ? snapScale : null}
        size={0.85}
        makeDefault
        onMouseDown={() => {
          if (orbitControlsRef?.current) {
            orbitControlsRef.current.enabled = false;
          }
        }}
        onMouseUp={() => {
          if (orbitControlsRef?.current) {
            orbitControlsRef.current.enabled = true;
          }
          if (groupRef.current && scene) {
            const obj = groupRef.current;
            const finalTransform: TransformData = {
              position: [obj.position.x, obj.position.y, obj.position.z],
              rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
              scale: [obj.scale.x, obj.scale.y, obj.scale.z],
            };
            updateObjectTransform(object.id, finalTransform, true);
            emitFinalTransform(finalTransform);
          }
        }}
        onObjectChange={() => {
          if (groupRef.current) {
            const obj = groupRef.current;
            const currentTransform: TransformData = {
              position: [obj.position.x, obj.position.y, obj.position.z],
              rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
              scale: [obj.scale.x, obj.scale.y, obj.scale.z],
            };
            emitContinuousTransform(currentTransform);
          }
        }}
      />
    )}
  </>
  );
}
