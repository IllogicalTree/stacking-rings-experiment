import { ThreeElements } from '@react-three/fiber';

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {
      mesh: ThreeElements['mesh'];
      torusGeometry: ThreeElements['torusGeometry'];
      meshStandardMaterial: ThreeElements['meshStandardMaterial'];
      cylinderGeometry: ThreeElements['cylinderGeometry'];
      circleGeometry: ThreeElements['circleGeometry'];
      ambientLight: ThreeElements['ambientLight'];
      directionalLight: ThreeElements['directionalLight'];
    }
  }
}

export interface RingData {
  id: string;
  color: string;
  floorPosition: [number, number, number]; // [x, y, z]
  status: 'floor' | 'stack';
  stackIndex: number | null; // Index in the stack array if status is 'stack'
  shakeTrigger: number; // Timestamp to trigger shake animation
}

export type TaskId = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'FREE_PLAY';

export interface LogEntry {
  taskId: TaskId;
  timestamp: number; // ms
  action: 'PUSH' | 'POP' | 'ERROR';
  errorType?: 'LIFO_VIOLATION' | 'CAPACITY_FULL' | null;
  details?: string;
  _uiId: string; // Internal ID for UI rendering list
}

export const COLORS = [
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#22c55e", // Green
  "#eab308", // Yellow
  "#a855f7", // Purple
  "#ec4899", // Pink
  "#f97316", // Orange
];