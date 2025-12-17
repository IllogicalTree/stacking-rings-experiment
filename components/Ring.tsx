import React, { useMemo, useState, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/three';
import { ThreeEvent } from '@react-three/fiber';
import { RingData } from '../types';
import { RING_INNER_RADIUS, RING_TUBE_RADIUS, RING_HEIGHT, STACK_BASE_Y } from '../constants';

interface RingProps {
  data: RingData;
  onClick: (id: string) => void;
  stackSize: number;
}

export const Ring: React.FC<RingProps> = ({ data, onClick, stackSize }) => {
  const { id, color, floorPosition, status, stackIndex, shakeTrigger } = data;
  const [hovered, setHovered] = useState(false);

  // Calculate target position based on status
  const targetPosition = useMemo(() => {
    if (status === 'floor') {
      return floorPosition;
    } else if (status === 'stack' && stackIndex !== null) {
      // Calculate y position based on stack index
      const y = STACK_BASE_Y + stackIndex * RING_HEIGHT;
      return [0, y, 0] as [number, number, number];
    }
    return [0, 0, 0] as [number, number, number];
  }, [status, stackIndex, floorPosition]);

  const isInteractive = status === 'floor' || (status === 'stack' && stackIndex === stackSize - 1);

  // Spring animation configuration
  const [spring, api] = useSpring(() => ({
    position: targetPosition,
    scale: 1,
    rotation: [Math.PI / 2, 0, 0] as [number, number, number],
    config: { tension: 120, friction: 14 }
  }));

  // Update spring when props/state change
  useEffect(() => {
    api.start({
      position: targetPosition,
      scale: hovered && isInteractive ? 1.1 : 1,
      rotation: [Math.PI / 2, 0, 0],
    });
  }, [targetPosition, hovered, isInteractive, api]);

  // Handle Shake Animation via async sequence
  useEffect(() => {
    if (shakeTrigger > 0) {
      const [x, y, z] = targetPosition;
      const shakeOffset = 0.5;
      const speed = 40; // duration in ms

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
        if (isInteractive) setHovered(true);
      }}
      onPointerOut={(e) => setHovered(false)}
      onClick={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onClick(id);
      }}
    >
      <mesh castShadow receiveShadow>
        <torusGeometry args={[RING_INNER_RADIUS, RING_TUBE_RADIUS, 16, 50]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.2} 
          metalness={0.1} 
        />
      </mesh>
    </animated.group>
  );
};