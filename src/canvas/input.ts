import { BoardLayout } from './layout';

export type PreviewMode = 'single' | 'multi' | null;

export interface CanvasInteractionState {
  mode: PreviewMode;
  index: number;
}

export interface CanvasInputCallbacks {
  onOpenCell: (index: number) => void;
  onChordCell: (index: number) => void;
  onFlagCell: (index: number) => void;
  onPreviewSingle: (index: number) => void;
  onPreviewMulti: (index: number) => void;
  onPreviewClear: () => void;
  onReset: () => void;
  onFacePress: (pressed: boolean) => void;
}

export interface MountedCanvasInput {
  dispose: () => void;
  getState: () => CanvasInteractionState;
}

function isPointInRect(x: number, y: number, rect: DOMRect): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

function getCellIndexFromPoint(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  layout: BoardLayout,
): number {
  const bounds = canvas.getBoundingClientRect();
  const localX = clientX - bounds.left - layout.board.x;
  const localY = clientY - bounds.top - layout.board.y;

  if (localX < 0 || localY < 0 || localX >= layout.board.width || localY >= layout.board.height) {
    return -1;
  }

  const col = Math.floor(localX / layout.cellSize);
  const row = Math.floor(localY / layout.cellSize);

  if (col < 0 || col >= layout.columns || row < 0 || row >= layout.rows) {
    return -1;
  }

  return row * layout.columns + col;
}

function isFacePoint(clientX: number, clientY: number, canvas: HTMLCanvasElement, layout: BoardLayout): boolean {
  const bounds = canvas.getBoundingClientRect();
  const x = clientX - bounds.left;
  const y = clientY - bounds.top;

  return (
    x >= layout.face.x &&
    y >= layout.face.y &&
    x <= layout.face.x + layout.face.size &&
    y <= layout.face.y + layout.face.size
  );
}

export function bindCanvasInput(
  canvas: HTMLCanvasElement,
  getLayout: () => BoardLayout,
  callbacks: CanvasInputCallbacks,
): MountedCanvasInput {
  const state: CanvasInteractionState = {
    mode: null,
    index: -1,
  };
  const LONG_PRESS_DELAY_MS = 550;
  const TOUCH_MOVE_CANCEL_PX = 10;
  let longPressTimer: number | undefined;
  let longPressIndex = -1;
  let longPressTriggered = false;
  let longPressPointerId = -1;
  let pressX = 0;
  let pressY = 0;

  const updatePreview = (nextIndex: number, nextMode: PreviewMode): void => {
    if (nextIndex < 0 || nextMode === null) {
      callbacks.onPreviewClear();
      state.index = -1;
      state.mode = nextMode;
      return;
    }

    state.index = nextIndex;
    state.mode = nextMode;

    if (nextMode === 'single') {
      callbacks.onPreviewSingle(nextIndex);
    } else {
      callbacks.onPreviewMulti(nextIndex);
    }
  };

  const handlePointerDown = (event: PointerEvent): void => {
    const layout = getLayout();
    event.preventDefault();
    const targetCanvas = event.currentTarget as HTMLCanvasElement;
    longPressIndex = -1;
    longPressTriggered = false;
    longPressPointerId = event.pointerId;
    pressX = event.clientX;
    pressY = event.clientY;

    if (isFacePoint(event.clientX, event.clientY, targetCanvas, layout)) {
      state.mode = null;
      state.index = -1;
      callbacks.onFacePress(true);
      if (longPressTimer !== undefined) {
        window.clearTimeout(longPressTimer);
        longPressTimer = undefined;
      }
      return;
    }

    const index = getCellIndexFromPoint(event.clientX, event.clientY, targetCanvas, layout);
    if (index < 0) {
      state.index = -1;
      callbacks.onPreviewClear();
      if (longPressTimer !== undefined) {
        window.clearTimeout(longPressTimer);
        longPressTimer = undefined;
      }
      return;
    }

    longPressIndex = index;

    if (event.button === 2) {
      callbacks.onFlagCell(index);
      callbacks.onPreviewClear();
      return;
    }

    const actionMode: PreviewMode = event.buttons === 3 ? 'multi' : 'single';
    updatePreview(index, actionMode);

    if (event.pointerType === 'touch') {
      longPressTimer = window.setTimeout(() => {
        if (longPressIndex === index) {
          callbacks.onFlagCell(index);
          longPressTriggered = true;
          callbacks.onPreviewClear();
          state.mode = null;
          state.index = -1;
        }
        longPressTimer = undefined;
      }, LONG_PRESS_DELAY_MS);
    }
  };

  const handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== longPressPointerId) return;
    const layout = getLayout();
    const targetCanvas = event.currentTarget as HTMLCanvasElement;

    if (longPressTimer !== undefined) {
      const moveDistanceX = Math.abs(event.clientX - pressX);
      const moveDistanceY = Math.abs(event.clientY - pressY);
      if (moveDistanceX > TOUCH_MOVE_CANCEL_PX || moveDistanceY > TOUCH_MOVE_CANCEL_PX) {
        window.clearTimeout(longPressTimer);
        longPressTimer = undefined;
      }
    }

    if (state.mode === null) {
      return;
    }

    const index = getCellIndexFromPoint(event.clientX, event.clientY, targetCanvas, layout);
    if (index === -1) {
      updatePreview(-1, null);
      return;
    }

    if (index !== state.index) {
      updatePreview(index, state.mode);
    }
  };

  const handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== longPressPointerId) return;
    const layout = getLayout();
    const targetCanvas = event.currentTarget as HTMLCanvasElement;

    if (longPressTimer !== undefined) {
      window.clearTimeout(longPressTimer);
      longPressTimer = undefined;
    }

    if (isFacePoint(event.clientX, event.clientY, targetCanvas, layout)) {
      callbacks.onFacePress(false);
      callbacks.onReset();
      callbacks.onPreviewClear();
      state.mode = null;
      state.index = -1;
      longPressTriggered = false;
      longPressPointerId = -1;
      return;
    }

    if (longPressTriggered) {
      longPressTriggered = false;
      longPressPointerId = -1;
      return;
    }

    callbacks.onFacePress(false);

    const activeMode = state.mode;
    const index = state.index;

    if (activeMode === 'single' && index >= 0) {
      callbacks.onOpenCell(index);
    }
    if (activeMode === 'multi' && index >= 0) {
      callbacks.onChordCell(index);
    }

    callbacks.onPreviewClear();
    state.mode = null;
    state.index = -1;
    longPressPointerId = -1;
    longPressIndex = -1;
  };

  const handleContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
  };

  const handlePointerCancel = (): void => {
    callbacks.onFacePress(false);
    callbacks.onPreviewClear();
    state.mode = null;
    state.index = -1;
    if (longPressTimer !== undefined) {
      window.clearTimeout(longPressTimer);
      longPressTimer = undefined;
    }
    longPressTriggered = false;
    longPressPointerId = -1;
    longPressIndex = -1;
  };

  canvas.addEventListener('pointerdown', handlePointerDown, { passive: false });
  canvas.addEventListener('pointermove', handlePointerMove, { passive: false });
  canvas.addEventListener('pointerup', handlePointerUp, { passive: false });
  canvas.addEventListener('pointercancel', handlePointerCancel, { passive: false });
  canvas.addEventListener('contextmenu', handleContextMenu);

  return {
    getState: () => ({ ...state }),
    dispose: () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerCancel);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    },
  };
}
