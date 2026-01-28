import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

// --- Geometries ---

const createPieceGeometry = (points: THREE.Vector2[]) => {
  return new THREE.LatheGeometry(points, 32);
};

const KingProfile = [
  new THREE.Vector2(0.01, 0),
  new THREE.Vector2(0.6, 0.1),
  new THREE.Vector2(0.5, 0.3),
  new THREE.Vector2(0.55, 0.4),
  new THREE.Vector2(0.25, 1.5),
  new THREE.Vector2(0.2, 2.2),
  new THREE.Vector2(0.5, 2.4),
  new THREE.Vector2(0.5, 2.6),
  new THREE.Vector2(0.2, 2.9),
  new THREE.Vector2(0, 3.1)
];

const QueenProfile = [
    new THREE.Vector2(0.01, 0),
    new THREE.Vector2(0.6, 0.1),
    new THREE.Vector2(0.55, 0.3),
    new THREE.Vector2(0.3, 1.8), // Slender body
    new THREE.Vector2(0.35, 2.2), // Neck
    new THREE.Vector2(0.6, 2.5), // Crown base
    new THREE.Vector2(0.7, 2.8), // Crown flare
    new THREE.Vector2(0, 2.9)
];

const PawnProfile = [
    new THREE.Vector2(0.01, 0),
    new THREE.Vector2(0.5, 0.1),
    new THREE.Vector2(0.4, 0.3),
    new THREE.Vector2(0.2, 1.0),
    new THREE.Vector2(0.3, 1.3), // Collar
    new THREE.Vector2(0.15, 1.4), // Neck
    new THREE.Vector2(0.35, 1.7), // Head
    new THREE.Vector2(0, 1.8)
];

const RookProfile = [
    new THREE.Vector2(0.01, 0),
    new THREE.Vector2(0.6, 0.1),
    new THREE.Vector2(0.55, 0.2), 
    new THREE.Vector2(0.45, 1.8), // Tower body
    new THREE.Vector2(0.6, 2.0), // Battlements overhang
    new THREE.Vector2(0.6, 2.4),
    new THREE.Vector2(0.4, 2.4), // Inner Top
    new THREE.Vector2(0, 2.4)
];

// --- Component ---

interface ChessPieceProps {
    profile: THREE.Vector2[];
    position: [number, number, number];
    scale?: number;
    delay?: number;
}

const ChessPiece: React.FC<ChessPieceProps> = ({ profile, position, scale = 1, delay = 0 }) => {
  const geometry = useMemo(() => createPieceGeometry(profile), [profile]);
  const ref = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (ref.current) {
        // Slow rotation
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.15 + delay;
    }
  });

  return (
    <group ref={ref} position={position} scale={[scale, scale, scale]}>
      <lineSegments>
        <wireframeGeometry args={[geometry]} />
        <lineBasicMaterial color="#FFFFFF" transparent opacity={0.15} />
      </lineSegments>
      <points>
        <primitive object={geometry} />
        <pointsMaterial color="#FFFFFF" size={0.02} transparent opacity={0.4} sizeAttenuation />
      </points>
    </group>
  );
};

const BoardGrid = () => {
    return (
        <group position={[0, -2.5, 0]} rotation={[0.1, 0, 0]}>
             <gridHelper args={[50, 50, 0x333333, 0x111111]} />
        </group>
    )
}

const ThreeBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 h-full w-full bg-black">
      <Canvas camera={{ position: [0, 1, 9], fov: 45 }}>
        <fog attach="fog" args={['#000000', 5, 20]} />
        <ambientLight intensity={0.5} />
        
        {/* Main King */}
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2} floatingRange={[-0.2, 0.2]}>
            <ChessPiece profile={KingProfile} position={[2, -1, 0]} scale={1.2} />
        </Float>

        {/* Queen */}
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3} floatingRange={[-0.3, 0.3]}>
            <ChessPiece profile={QueenProfile} position={[-2, -0.5, -2]} scale={1.1} delay={1} />
        </Float>
        
        {/* Rook */}
        <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.2} floatingRange={[-0.1, 0.1]}>
             <ChessPiece profile={RookProfile} position={[-3.5, -1.5, 1]} scale={1} delay={2} />
        </Float>

        {/* Pawns */}
        <Float speed={2.5} rotationIntensity={0.3} floatIntensity={0.4}>
            <ChessPiece profile={PawnProfile} position={[3.5, 1, -3]} scale={0.7} delay={3} />
        </Float>
        <Float speed={2.2} rotationIntensity={0.3} floatIntensity={0.4}>
             <ChessPiece profile={PawnProfile} position={[-1.5, 2, -4]} scale={0.6} delay={4} />
        </Float>
        
        <BoardGrid />
      </Canvas>
      {/* Subtle vignettes */}
       <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60 pointer-events-none" />
       <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-60 pointer-events-none" />
    </div>
  );
};

export default ThreeBackground;