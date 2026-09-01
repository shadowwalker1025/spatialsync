import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore } from '../../store/useSceneStore';
import { useUIStore } from '../../store/useUIStore';
import { useTransformThrottle } from '../../hooks/useTransformThrottle';
import { degToRad } from '../../utils/math';

interface TransformGizmoProps {
  orbitControlsRef: React.RefObject<any>;
}

export function TransformGizmo({ orbitControlsRef }: TransformGizmoProps) {
  const { scene: threeScene } = useThree();
  const transformRef = useRef<any>(null);

  const selectedObjectId = useSceneStore((s) => s.selectedObjectId);
  const updateObjectTransform = useSceneStore((s) => s.updateObjectTransform);
  const scene = useSceneStore((s) => s.scene);

  const transformMode = useUIStore((s) => s.transformMode);
  const transformSpace = useUIStore((s) => s.transformSpace);
  const activeTool = useUIStore((s) => s.activeTool);
  const snapEnabled = useUIStore((s) => s.snapEnabled);
  const snapTranslation = useUIStore((s) => s.snapTranslation);
  const snapRotation = useUIStore((s) => s.snapRotation);
  const snapScale = useUIStore((s) => s.snapScale);

  const { emitContinuousTransform, emitFinalTransform } = useTransformThrottle(
    scene?.id || 'default',
    selectedObjectId || ''
  );

  // Find the selected object in Three.js scene graph via recursive traversal
  let targetObject: THREE.Object3D | null = null;
  if (selectedObjectId && activeTool === 'select') {
    threeScene.traverse((child) => {
      if (!targetObject && child.userData?.objectId === selectedObjectId) {
        targetObject = child;
      }
    });
  }

  useEffect(() => {
    const controls = transformRef.current;
    if (!controls) return;

    function handleDraggingChanged(event: any) {
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = !event.value;
      }

      // Drag released (persist final transform)
      if (!event.value && controls.object && selectedObjectId) {
        const obj = controls.object;
        const finalTransform = {
          position: [obj.position.x, obj.position.y, obj.position.z] as [number, number, number],
          rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z] as [number, number, number],
          scale: [obj.scale.x, obj.scale.y, obj.scale.z] as [number, number, number],
        };

        updateObjectTransform(selectedObjectId, finalTransform, true);
        emitFinalTransform(finalTransform);
      }
    }

    function handleObjectChange() {
      if (controls.object && selectedObjectId) {
        const obj = controls.object;
        const currentTransform = {
          position: [obj.position.x, obj.position.y, obj.position.z] as [number, number, number],
          rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z] as [number, number, number],
          scale: [obj.scale.x, obj.scale.y, obj.scale.z] as [number, number, number],
        };

        // Emit throttled delta over network
        emitContinuousTransform(currentTransform);
      }
    }

    controls.addEventListener('dragging-changed', handleDraggingChanged);
    controls.addEventListener('objectChange', handleObjectChange);

    return () => {
      controls.removeEventListener('dragging-changed', handleDraggingChanged);
      controls.removeEventListener('objectChange', handleObjectChange);
    };
  }, [selectedObjectId, scene?.id, emitContinuousTransform, emitFinalTransform, updateObjectTransform, orbitControlsRef, targetObject]);

  if (!targetObject) return null;

  return (
    <TransformControls
      ref={transformRef}
      object={targetObject}
      mode={transformMode}
      space={transformSpace}
      translationSnap={snapEnabled ? snapTranslation : null}
      rotationSnap={snapEnabled ? degToRad(snapRotation) : null}
      scaleSnap={snapEnabled ? snapScale : null}
      size={0.85}
    />
  );
}
