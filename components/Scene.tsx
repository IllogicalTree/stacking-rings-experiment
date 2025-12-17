import React from 'react';
import { OrbitControls, Stage, ContactShadows, Environment } from '@react-three/drei';
import { POLE_HEIGHT, POLE_RADIUS, POLE_COLOR, FLOOR_COLOR } from '../constants';
import { Ring } from './Ring';
import { RingData } from '../types';

interface SceneProps {
  rings: RingData[];
  stack: string[];
  onRingClick: (id: string) => void;
}

export const Scene: React.FC<SceneProps> = ({ rings, stack, onRingClick }) => {
  return (
    <>
      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.2} />
      
      {/* Lighting environment */}
      <Environment preset="city" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

      {/* The Pole */}
      <mesh position={[0, POLE_HEIGHT / 2, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[POLE_RADIUS, POLE_RADIUS, POLE_HEIGHT, 32]} />
        <meshStandardMaterial color={POLE_COLOR} roughness={0.5} />
      </mesh>

      {/* The Base/Floor for context */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[15, 64]} />
        <meshStandardMaterial color={FLOOR_COLOR} />
      </mesh>
      
      <ContactShadows opacity={0.4} scale={30} blur={2} far={10} resolution={256} color="#000000" />

      {/* Rings */}
      {rings.map((ring) => (
        <Ring 
          key={ring.id} 
          data={ring} 
          onClick={onRingClick} 
          stackSize={stack.length}
        />
      ))}
    </>
  );
};