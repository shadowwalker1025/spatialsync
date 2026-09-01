import { Grid } from '@react-three/drei';
import { useUIStore } from '../../store/useUIStore';

export function SceneGrid() {
  const gridVisible = useUIStore((s) => s.gridVisible);
  const environmentPreset = useUIStore((s) => s.environmentPreset);

  if (!gridVisible) return null;

  const isCyberpunk = environmentPreset === 'cyberpunk';
  const isSunset = environmentPreset === 'sunset';

  const cellColor = isCyberpunk ? '#06b6d4' : isSunset ? '#fb923c' : '#4338ca';
  const sectionColor = isCyberpunk ? '#ec4899' : isSunset ? '#f97316' : '#6366f1';

  return (
    <Grid
      position={[0, -0.01, 0]}
      args={[80, 80]}
      cellSize={1}
      cellThickness={1.2}
      cellColor={cellColor}
      sectionSize={5}
      sectionThickness={1.8}
      sectionColor={sectionColor}
      fadeDistance={45}
      fadeStrength={1.5}
      followCamera={false}
      infiniteGrid={true}
    />
  );
}
