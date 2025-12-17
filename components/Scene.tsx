import React from 'react';
import { OrbitControls, ContactShadows, Environment, Text } from '@react-three/drei';
import { POLE_HEIGHT, POLE_RADIUS, POLE_COLOR, FLOOR_COLOR, POLE_POSITIONS } from '../constants';
import { Ring } from './Ring';
import { RingData, PoleId } from '../types';
import { ThreeEvent } from '@react-three/fiber';

interface SceneProps {
  rings: RingData[];
  stacks: Record<string, string[]>;
  onRingClick: (id: string) => void;
  onPoleClick: (poleId: PoleId) => void;
  layout: 'SINGLE' | 'DUAL';
  blindfold: boolean;
  selectedRingId: string | null;
}

const Pole: React.FC<{ 
  position: [number, number, number], 
  id: PoleId, 
  onClick: (id: PoleId) => void,
  highlight: boolean 
}> = ({ position, id, onClick, highlight }) => (
  <group position={position}>
    <mesh 
      receiveShadow 
      castShadow 
      onClick={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onClick(id);
      }}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    >
      <cylinderGeometry args={[POLE_RADIUS, POLE_RADIUS, POLE_HEIGHT, 32]} />
      <meshStandardMaterial 
        color={highlight ? "#6366f1" : POLE_COLOR} 
        roughness={0.5} 
        emissive={highlight ? "#312e81" : "#000"} 
      />
    </mesh>
    {/* Base Hitbox for easier clicking */}
    <mesh position={[0, -POLE_HEIGHT/2 + 0.1, 0]} onClick={(e) => { e.stopPropagation(); onClick(id); }}>
      <cylinderGeometry args={[POLE_RADIUS * 1.5, POLE_RADIUS * 1.5, 0.2, 32]} />
      <meshStandardMaterial color={POLE_COLOR} />
    </mesh>
  </group>
);

export const Scene: React.FC<SceneProps> = ({ 
  rings, stacks, onRingClick, onPoleClick, layout, blindfold, selectedRingId 
}) => {
  return (
    <>
      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.2} />
      
      <Environment preset="city" />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />

      {/* Poles */}
      {layout === 'SINGLE' && (
        <Pole 
          position={POLE_POSITIONS.CENTER} 
          id="CENTER" 
          onClick={onPoleClick} 
          highlight={false} 
        />
      )}
      
      {layout === 'DUAL' && (
        <>
          <Pole 
            position={POLE_POSITIONS.LEFT} 
            id="LEFT" 
            onClick={onPoleClick} 
            highlight={!!selectedRingId} 
          />
          <Pole 
            position={POLE_POSITIONS.RIGHT} 
            id="RIGHT" 
            onClick={onPoleClick} 
            highlight={!!selectedRingId} 
          />
        </>
      )}

      {/* Blindfold Box */}
      {blindfold && (
        <mesh position={[0, 3, 0]} castShadow>
          <boxGeometry args={[4, 7, 4]} />
          <meshStandardMaterial color="#334155" opacity={1} transparent={false} />
          <Text 
            position={[0, 0, 2.1]} 
            fontSize={0.5} 
            color="white" 
            anchorX="center" 
            anchorY="middle"
          >
            ?
          </Text>
        </mesh>
      )}

      {/* Floor */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[20, 64]} />
        <meshStandardMaterial color={FLOOR_COLOR} />
      </mesh>
      
      <ContactShadows opacity={0.4} scale={40} blur={2} far={10} color="#000000" />

      {/* Rings - Hide stack rings if blindfolded */}
      {rings.map((ring) => {
        if (blindfold && ring.status === 'stack') return null;
        
        const stack = stacks[ring.poleId] || [];
        const isTop = stack[stack.length - 1] === ring.id;
        
        return (
          <Ring 
            key={ring.id} 
            data={ring} 
            onClick={onRingClick} 
            isTop={isTop}
            isSelected={selectedRingId === ring.id}
            isClickable={!blindfold}
          />
        );
      })}
    </>
  );
};
