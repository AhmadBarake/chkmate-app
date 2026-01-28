import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere } from '@react-three/drei';
import * as THREE from 'three';

// --- Geometries ---

// A cloud Puff is just a sphere
const createCloudGeometry = () => {
  return new THREE.SphereGeometry(1, 16, 16); 
};

// --- Component ---

interface CloudPieceProps {
    position: [number, number, number];
    scale?: number;
    delay?: number;
}

const CloudPiece: React.FC<CloudPieceProps> = ({ position, scale = 1, delay = 0 }) => {
  const geometry = useMemo(() => createCloudGeometry(), []);
  const ref = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (ref.current) {
        // Slow rotation
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.1 + delay;
      // Gentle wobble
      ref.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.2 + delay) * 0.05;
    }
  });

  // A "Cloud Piece" is a cluster of spheres rendered as wireframes
  return (
    <group ref={ref} position={position} scale={[scale, scale, scale]}>
        
        {/* Helper to render a single puff with the requested style */}
        <group>
             {/* Center Puff */}
             <group position={[0, 0, 0]}>
                <lineSegments>
                    <wireframeGeometry args={[geometry]} />
                    <lineBasicMaterial color="#38bdf8" transparent opacity={0.15} />
                </lineSegments>
                <points>
                    <primitive object={geometry} />
                    <pointsMaterial color="#38bdf8" size={0.03} transparent opacity={0.4} sizeAttenuation />
                </points>
             </group>
             
             {/* Left Puff */}
             <group position={[-0.9, -0.3, 0]} scale={0.7}>
                <lineSegments>
                    <wireframeGeometry args={[geometry]} />
                    <lineBasicMaterial color="#38bdf8" transparent opacity={0.15} />
                </lineSegments>
                 <points>
                    <primitive object={geometry} />
                    <pointsMaterial color="#38bdf8" size={0.03} transparent opacity={0.4} sizeAttenuation />
                </points>
             </group>

             {/* Right Puff */}
             <group position={[0.9, -0.2, 0.2]} scale={0.7}>
                <lineSegments>
                    <wireframeGeometry args={[geometry]} />
                    <lineBasicMaterial color="#38bdf8" transparent opacity={0.15} />
                </lineSegments>
                 <points>
                    <primitive object={geometry} />
                    <pointsMaterial color="#38bdf8" size={0.03} transparent opacity={0.4} sizeAttenuation />
                </points>
             </group>

              {/* Top Puff */}
             <group position={[0, 0.7, 0]} scale={0.6}>
                <lineSegments>
                    <wireframeGeometry args={[geometry]} />
                    <lineBasicMaterial color="#38bdf8" transparent opacity={0.15} />
                </lineSegments>
                 <points>
                    <primitive object={geometry} />
                    <pointsMaterial color="#38bdf8" size={0.03} transparent opacity={0.4} sizeAttenuation />
                </points>
             </group>
        </group>
    </group>
  );
};

const Grid = () => {
    return (
        <group position={[0, -3, 0]} rotation={[0.1, 0, 0]}>
             <gridHelper args={[50, 50, 0x1e293b, 0x0f172a]} />
        </group>
    )
}

const ThreeCloudBackground: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`w-full h-full min-h-[400px] ${className || ''}`}>
      <Canvas camera={{ position: [0, 1, 9], fov: 45 }}>
        <fog attach="fog" args={['#020617', 5, 20]} />
        <ambientLight intensity={0.5} />
        
        {/* Main Cloud - Central & Large */}
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2} floatingRange={[-0.2, 0.2]}>
            <CloudPiece position={[0, -0.5, 0]} scale={2.8} />
        </Float>

        {/* Left Cloud - Large & Back */}
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3} floatingRange={[-0.2, 0.2]}>
            <CloudPiece position={[-5, 2, -4]} scale={2.5} delay={1} />
        </Float>
        
        {/* Right Cloud - Large & Back */}
        <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.2} floatingRange={[-0.1, 0.1]}>
             <CloudPiece position={[5, -1, -5]} scale={2.4} delay={2} />
        </Float>

        {/* Top/Secondary Cloud */}
        <Float speed={2.5} rotationIntensity={0.3} floatIntensity={0.2} floatingRange={[-0.2, 0.2]}>
             <CloudPiece position={[2, 4, -8]} scale={3.0} delay={3} />
        </Float>
        
        <Grid />
      </Canvas>
       <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80 pointer-events-none" />
       <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-transparent opacity-80 pointer-events-none" />
    </div>
  );
};

export default ThreeCloudBackground;
