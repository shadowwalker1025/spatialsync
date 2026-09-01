import { useMemo } from 'react';
import { Environment } from '@react-three/drei';
import { useUIStore } from '../../store/useUIStore';

export function EnvironmentStudio() {
  const environmentPreset = useUIStore((s) => s.environmentPreset);
  const shadowsEnabled = useUIStore((s) => s.shadowsEnabled);

  const envConfig = useMemo(() => {
    switch (environmentPreset) {
      case 'sunset':
        return {
          ambientIntensity: 0.4,
          dirLightColor: '#fb923c',
          dirLightIntensity: 1.8,
          dirPosition: [12, 10, -8] as [number, number, number],
          hemiSky: '#fed7aa',
          hemiGround: '#7c2d12',
          envMap: 'sunset' as const,
        };
      case 'dawn':
        return {
          ambientIntensity: 0.5,
          dirLightColor: '#c084fc',
          dirLightIntensity: 1.5,
          dirPosition: [-10, 12, 8] as [number, number, number],
          hemiSky: '#e9d5ff',
          hemiGround: '#3b0764',
          envMap: 'dawn' as const,
        };
      case 'night':
        return {
          ambientIntensity: 0.15,
          dirLightColor: '#60a5fa',
          dirLightIntensity: 0.8,
          dirPosition: [5, 15, 5] as [number, number, number],
          hemiSky: '#1e293b',
          hemiGround: '#020617',
          envMap: 'night' as const,
        };
      case 'cyberpunk':
        return {
          ambientIntensity: 0.3,
          dirLightColor: '#ec4899',
          dirLightIntensity: 2.2,
          dirPosition: [8, 12, 6] as [number, number, number],
          hemiSky: '#06b6d4',
          hemiGround: '#4c0519',
          envMap: 'city' as const,
        };
      case 'minimal':
        return {
          ambientIntensity: 0.8,
          dirLightColor: '#ffffff',
          dirLightIntensity: 1.0,
          dirPosition: [0, 20, 0] as [number, number, number],
          hemiSky: '#f8fafc',
          hemiGround: '#334155',
          envMap: 'studio' as const,
        };
      case 'studio':
      default:
        return {
          ambientIntensity: 0.6,
          dirLightColor: '#ffffff',
          dirLightIntensity: 1.6,
          dirPosition: [10, 16, 10] as [number, number, number],
          hemiSky: '#e0e7ff',
          hemiGround: '#0f172a',
          envMap: 'studio' as const,
        };
    }
  }, [environmentPreset]);

  return (
    <>
      {/* Ambient Lighting */}
      <ambientLight intensity={envConfig.ambientIntensity} />

      {/* Hemisphere Light for realistic ambient gradient */}
      <hemisphereLight
        color={envConfig.hemiSky}
        groundColor={envConfig.hemiGround}
        intensity={0.6}
      />

      {/* Main Directional Light with Shadows */}
      <directionalLight
        position={envConfig.dirPosition}
        intensity={envConfig.dirLightIntensity}
        color={envConfig.dirLightColor}
        castShadow={shadowsEnabled}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.0001}
      />

      {/* Secondary Fill Light */}
      <directionalLight
        position={[-envConfig.dirPosition[0], 8, -envConfig.dirPosition[2]]}
        intensity={0.4}
        color="#818cf8"
      />

      {/* HDR Environment Reflections */}
      {envConfig.envMap && (
        <Environment preset={envConfig.envMap} background={false} />
      )}
    </>
  );
}
