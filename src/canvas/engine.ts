export type MouseButton = 'left' | 'right';

export interface PointerEventLike {
  readonly x: number;
  readonly y: number;
  readonly button?: MouseButton;
}

export function normalizePointer(x: number, y: number): { x: number; y: number } {
  return { x: Math.floor(x), y: Math.floor(y) };
}
