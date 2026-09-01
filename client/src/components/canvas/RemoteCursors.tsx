import { Html } from '@react-three/drei';
import { useCollaborationStore } from '../../store/useCollaborationStore';

export function RemoteCursors() {
  const users = useCollaborationStore((s) => s.users);
  const currentUser = useCollaborationStore((s) => s.currentUser);

  // Filter remote users who have active 3D cursor coordinates
  const remoteUsers = users.filter(
    (u) => u.id !== currentUser.id && u.cursor3D && Array.isArray(u.cursor3D)
  );

  return (
    <group name="remote-cursors">
      {remoteUsers.map((user) => {
        const [x, y, z] = user.cursor3D!;
        const color = user.color || '#3b82f6';

        return (
          <group key={user.id} position={[x, y, z]}>
            {/* Pulsing Light Sphere at Hit Point */}
            <mesh>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshBasicMaterial color={color} />
            </mesh>

            {/* Subtle Beacon Ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
              <ringGeometry args={[0.12, 0.18, 24]} />
              <meshBasicMaterial color={color} transparent opacity={0.6} />
            </mesh>

            {/* Vertical Laser Ray Beam */}
            <mesh position={[0, 0.6, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 1.2, 8]} />
              <meshBasicMaterial color={color} transparent opacity={0.45} />
            </mesh>

            {/* Floating 3D User Nametag */}
            <Html position={[0, 0.35, 0]} center distanceFactor={14}>
              <div
                className="px-2 py-0.5 rounded-full text-[11px] font-medium text-white shadow-lg flex items-center gap-1.5 whitespace-nowrap pointer-events-none transition-all duration-150"
                style={{
                  backgroundColor: color,
                  boxShadow: `0 0 12px ${color}80`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                {user.name}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
