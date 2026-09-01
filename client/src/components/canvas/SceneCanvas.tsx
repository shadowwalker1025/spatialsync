import { useEffect, useRef } from 'react';
import { Canvas, ThreeEvent, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore } from '../../store/useSceneStore';
import { useUIStore } from '../../store/useUIStore';
import { EnvironmentStudio } from './EnvironmentStudio';
import { SceneGrid } from './SceneGrid';
import { SceneObjectMesh } from './SceneObjectMesh';
import { TransformGizmo } from './TransformGizmo';
import { RemoteCursors } from './RemoteCursors';
import { Annotations3D } from './Annotations3D';
import { CameraManager } from './CameraManager';
import { getSocket } from '../../services/socket';

function DevToolsBridge() {
  const { scene, camera, gl } = useThree();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__THREE__ = THREE;
      (window as any).threeScene = scene;
      (window as any).threeCamera = camera;
      (window as any).threeRenderer = gl;
    }
  }, [scene, camera, gl]);

  return null;
}

function CursorRaycaster() {
  const scene = useSceneStore((s) => s.scene);
  const selectedObjectId = useSceneStore((s) => s.selectedObjectId);
  const selectObject = useSceneStore((s) => s.selectObject);
  const activeTool = useUIStore((s) => s.activeTool);
  const lastCursorEmitTime = useRef(0);

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    const now = performance.now();
    if (now - lastCursorEmitTime.current < 40) return; // ~25 updates/sec throttle
    lastCursorEmitTime.current = now;

    if (scene && e.point) {
      const socket = getSocket();
      if (socket.connected) {
        socket.emit('cursor:move', {
          sceneId: scene.id,
          position: [e.point.x, e.point.y, e.point.z],
          normal: e.face?.normal ? [e.face.normal.x, e.face.normal.y, e.face.normal.z] : [0, 1, 0],
        });
      }
    }
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (activeTool === 'select' && selectedObjectId && scene) {
      selectObject(null);
      const socket = getSocket();
      socket.emit('object:deselect', { sceneId: scene.id, objectId: selectedObjectId });
    }
  };

  return (
    <mesh
      visible={false}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.02, 0]}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
    >
      <planeGeometry args={[300, 300]} />
      <meshBasicMaterial />
    </mesh>
  );
}

export function SceneCanvas() {
  const orbitControlsRef = useRef<any>(null);

  const objects = useSceneStore((s) => s.objects);
  const scene = useSceneStore((s) => s.scene);
  const selectedObjectId = useSceneStore((s) => s.selectedObjectId);
  const selectObject = useSceneStore((s) => s.selectObject);
  const activeTool = useUIStore((s) => s.activeTool);

  // Background pointer down (deselect object if clicking empty space)
  const handlePointerMissed = (e: MouseEvent) => {
    if (e.target instanceof HTMLCanvasElement && selectedObjectId && scene) {
      selectObject(null);
      const socket = getSocket();
      socket.emit('object:deselect', { sceneId: scene.id, objectId: selectedObjectId });
    }
  };

  const backgroundColor = scene?.backgroundColor || '#07090e';
  const cursorClass = activeTool === 'annotate' ? 'cursor-crosshair' : 'cursor-default';

  return (
    <div className={`w-full h-full relative ${cursorClass}`}>
      <Canvas
        shadows
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        onPointerMissed={handlePointerMissed}
        style={{ background: backgroundColor }}
      >
        <PerspectiveCamera makeDefault position={[10, 10, 12]} fov={48} near={0.1} far={1000} />
        
        <OrbitControls
          ref={orbitControlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.06}
          minDistance={2}
          maxDistance={120}
          maxPolarAngle={Math.PI / 2 + 0.05}
        />

        {/* Lighting & Environment Studio */}
        <EnvironmentStudio />

        {/* DevTools Bridge for Console Access */}
        <DevToolsBridge />

        {/* Ground Floor Grid */}
        <SceneGrid />

        {/* Raycaster plane for continuous cursor tracking */}
        <CursorRaycaster />

        {/* Scene Objects */}
        {objects.map((obj) => (
          <SceneObjectMesh key={obj.id} object={obj} />
        ))}

        {/* Transform Manipulator Gizmo */}
        <TransformGizmo orbitControlsRef={orbitControlsRef} />

        {/* Remote 3D Cursors */}
        <RemoteCursors />

        {/* 3D Anchored Annotations */}
        <Annotations3D />

        {/* Camera Views & Smooth Focus Controller */}
        <CameraManager orbitControlsRef={orbitControlsRef} />
      </Canvas>
    </div>
  );
}
