export const RING_TUBE_RADIUS = 0.4;
export const RING_INNER_RADIUS = 1.2;
export const RING_HEIGHT = RING_TUBE_RADIUS * 2.5;
export const POLE_RADIUS = 1.0;
export const POLE_HEIGHT = 5.5;
export const POLE_COLOR = "#9ca3af";
export const FLOOR_COLOR = "#e5e7eb";

export const STACK_BASE_Y = 0.5;
export const FLOOR_RADIUS_MIN = 4;
export const FLOOR_RADIUS_MAX = 8;
export const MAX_STACK_CAPACITY = 5;

// Layout Configurations
export const POLE_POSITIONS = {
  CENTER: [0, POLE_HEIGHT / 2, 0] as [number, number, number],
  LEFT: [-4, POLE_HEIGHT / 2, 0] as [number, number, number],
  RIGHT: [4, POLE_HEIGHT / 2, 0] as [number, number, number],
};
