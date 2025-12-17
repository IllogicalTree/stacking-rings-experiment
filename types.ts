export type PoleId = 'LEFT' | 'RIGHT' | 'CENTER';

export interface RingData {
  id: string;
  color: string;
  floorPosition: [number, number, number];
  status: 'floor' | 'stack' | 'moving'; // moving = selected/held
  poleId: PoleId; // Which pole does this ring belong to (or is currently on)
  stackIndex: number | null;
  shakeTrigger: number;
}

export type TaskId = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4' | 'LEVEL_5' | 'COMPLETE';

export interface LogEntry {
  taskId: TaskId;
  timestamp: number;
  action: 'PUSH' | 'POP' | 'MOVE' | 'ERROR' | 'GUESS';
  errorType?: 'LIFO_VIOLATION' | 'STACK_UNDERFLOW' | 'BLOCKED_BY_TOP' | 'MENTAL_MODEL_FAIL' | null;
  context?: string; // e.g., "GOLD_RING", "EMPTY_POP"
  _uiId: string;
}

export const COLORS = {
  RED: "#ef4444",
  BLUE: "#3b82f6",
  GREEN: "#22c55e",
  GOLD: "#eab308", // Yellow-ish gold
  PURPLE: "#a855f7",
};
