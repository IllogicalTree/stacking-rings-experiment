import React, { useMemo, useState, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/three';
import { ThreeEvent } from '@react-three/fiber';
import { RingData } from '../types';
import { RING_INNER_RADIUS, RING_TUBE_RADIUS, RING_HEIGHT, STACK_BASE_Y, POLE_POSITIONS } from '../constants';

interface RingProps {
  data: RingData;
  onClick: (id: string) => void;
  isTop: boolean;
  isSelected: boolean;
  isClickable: boolean;
}

export const Ring: React.FC<RingProps> = ({ data, onClick, isTop, isSelected, isClickable }) => {
  const { id, color, floorPosition, status, stackIndex, shakeTrigger, poleId } = data;
  const [hovered, setHovered] = useState(false);

  // Calculate target position
  const targetPosition = useMemo(() => {
    if (status === 'floor') {
      return floorPosition;
    } 
    
    // Determine X/Z based on Pole ID
    let basePos = [0, 0, 0];
    if (poleId === 'LEFT') basePos = [POLE_POSITIONS.LEFT[0], 0, POLE_POSITIONS.LEFT[2]];
    else if (poleId === 'RIGHT') basePos = [POLE_POSITIONS.RIGHT[0], 0, POLE_POSITIONS.RIGHT[2]];
    
    if (status === 'stack' && stackIndex !== null) {
      const y = STACK_BASE_Y + stackIndex * RING_HEIGHT;
      return [basePos[0], y, basePos[2]] as [number, number, number];
    }
    
    if (status === 'moving' || isSelected) {
      // Float above the pole if selected/moving
      return [basePos[0], POLE_POSITIONS.CENTER[1] + 3, basePos[2]] as [number, number, number];
    }

    return [0, 0, 0] as [number, number, number];
  }, [status, stackIndex, floorPosition, poleId, isSelected]);

  const [spring, api] = useSpring(() => ({
    position: targetPosition,
    scale: 1,
    rotation: [Math.PI / 2, 0, 0] as [number, number, number],
    config: { tension: 120, friction: 14 }
  }));

  useEffect(() => {
    api.start({
      position: targetPosition,
      scale: (hovered && isClickable) || isSelected ? 1.1 : 1,
      rotation: [Math.PI / 2, 0, 0],
    });
  }, [targetPosition, hovered, isClickable, isSelected, api]);

  // Shake Animation
  useEffect(() => {
    if (shakeTrigger > 0) {
      const [x, y, z] = targetPosition;
      const shakeOffset = 0.5;
      const speed = 40;

      api.start({
        to: async (next) => {
          await next({ position: [x - shakeOffset, y, z], config: { duration: speed } });
          await next({ position: [x + shakeOffset, y, z], config: { duration: speed } });
          await next({ position: [x - shakeOffset, y, z], config: { duration: speed } });
          await next({ position: [x + shakeOffset, y, z], config: { duration: speed } });
          await next({ position: [x, y, z], config: { duration: speed } });
        }
      });
    }
  }, [shakeTrigger, targetPosition, api]);

  return (
    <animated.group
      position={spring.position as any}
      scale={spring.scale}
      rotation={spring.rotation as any}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (isClickable) setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        if (isClickable) onClick(id);
      }}
    >
      <mesh castShadow receiveShadow>
        <torusGeometry args={[RING_INNER_RADIUS, RING_TUBE_RADIUS, 16, 50]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.2} 
          metalness={0.1}
          emissive={isSelected ? "#444" : "#000"}
        />
      </mesh>
    </animated.group>
  );
};
