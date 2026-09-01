import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Ensures complete disposal of geometries, materials, and textures
 * to prevent GPU memory leaks in long-running WebGL sessions.
 */
export function useGPUDisposal() {
  const meshRef = useRef<THREE.Mesh | THREE.Group | null>(null);

  useEffect(() => {
    return () => {
      if (meshRef.current) {
        meshRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry) {
              child.geometry.dispose();
            }
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => {
                  disposeMaterial(mat);
                });
              } else {
                disposeMaterial(child.material);
              }
            }
          }
        });
      }
    };
  }, []);

  return meshRef;
}

function disposeMaterial(material: THREE.Material) {
  material.dispose();
  // Dispose textures if present
  Object.keys(material).forEach((prop) => {
    const value = (material as any)[prop];
    if (value && typeof value === 'object' && 'minFilter' in value && typeof value.dispose === 'function') {
      value.dispose();
    }
  });
}
