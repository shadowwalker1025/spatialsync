import { useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useUIStore } from '../../store/useUIStore';

interface CameraManagerProps {
  orbitControlsRef: React.RefObject<any>;
}

export function CameraManager({ orbitControlsRef }: CameraManagerProps) {
  const { camera } = useThree();
  const cameraPreset = useUIStore((s) => s.cameraPreset);
  const focusTarget = useUIStore((s) => s.focusTarget);
  const clearFocus = useUIStore((s) => s.clearFocus);

  // Target camera position & lookAt vectors
  const targetCamPos = THREE.Vector3.prototype;

  useEffect(() => {
    if (!orbitControlsRef.current) return;
    const controls = orbitControlsRef.current;

    switch (cameraPreset) {
      case 'top':
        camera.position.set(0, 25, 0.001);
        controls.target.set(0, 0, 0);
        break;
      case 'front':
        camera.position.set(0, 2, 20);
        controls.target.set(0, 1, 0);
        break;
      case 'side':
        camera.position.set(20, 2, 0);
        controls.target.set(0, 1, 0);
        break;
      case 'isometric':
        camera.position.set(16, 16, 16);
        controls.target.set(0, 1, 0);
        break;
      case 'perspective':
      default:
        // standard perspective view
        break;
    }
    controls.update();
  }, [cameraPreset, camera, orbitControlsRef]);

  // Smooth focus animation to target object
  useFrame((_, delta) => {
    if (focusTarget && orbitControlsRef.current) {
      const controls = orbitControlsRef.current;
      const targetVec = new THREE.Vector3(...focusTarget);
      
      // Lerp orbit target
      controls.target.lerp(targetVec, Math.min(delta * 8, 1));
      
      // Lerp camera position maintaining offset
      const desiredPos = new THREE.Vector3(
        targetVec.x + 5,
        targetVec.y + 4,
        targetVec.z + 5
      );
      camera.position.lerp(desiredPos, Math.min(delta * 8, 1));
      controls.update();

      if (controls.target.distanceTo(targetVec) < 0.05) {
        clearFocus();
      }
    }
  });

  return null;
}
