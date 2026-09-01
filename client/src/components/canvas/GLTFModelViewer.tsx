import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface GLTFModelViewerProps {
  url: string;
  materialProps?: any;
}

export function GLTFModelViewer({ url, materialProps }: GLTFModelViewerProps) {
  const { scene } = useGLTF(url);

  // Clone scene so multiple instances don't share identical scene graph nodes
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (materialProps && child.material) {
          // If custom color override is specified
          if (materialProps.color) {
            child.material.color = new THREE.Color(materialProps.color);
          }
          if (materialProps.roughness !== undefined) {
            child.material.roughness = materialProps.roughness;
          }
          if (materialProps.metalness !== undefined) {
            child.material.metalness = materialProps.metalness;
          }
          if (materialProps.wireframe !== undefined) {
            child.material.wireframe = materialProps.wireframe;
          }
        }
      }
    });
    return clone;
  }, [scene, materialProps]);

  return <primitive object={clonedScene} />;
}
