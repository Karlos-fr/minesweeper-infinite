// ============================================================================
// Minesweeper Infinite - Entrées du plateau
// ----------------------------------------------------------------------------
// Ce fichier traduit les interactions pointeur et tactiles en actions de jeu.
// Il ne décide pas des règles métier.
// ============================================================================
import { BoardLayout } from './layout';

export type PreviewMode = 'single' | 'multi' | null;

export interface CanvasInteractionState {
  mode: PreviewMode;
  index: number;
}

export interface CanvasInputCallbacks {
  isGridInteractive: () => boolean;
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

// ----------------------------------------------------------------------------
// Indique si point in rectangle.
//
// Paramètres :
// - x : valeur fournie au traitement.
// - y : valeur fournie au traitement.
// - rect : valeur fournie au traitement.
//
// Retour :
// - valeur de type `boolean` produite par le traitement.
//
// Effets de bord :
// - aucun.
// ----------------------------------------------------------------------------
function isPointInRect(x: number, y: number, rect: DOMRect): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

// ----------------------------------------------------------------------------
// Retourne cellule index from point.
//
// Paramètres :
// - clientX : valeur fournie au traitement.
// - clientY : valeur fournie au traitement.
// - canvas : valeur fournie au traitement.
// - layout : valeur fournie au traitement.
//
// Retour :
// - valeur de type `number` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
function getCellIndexFromPoint(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  layout: BoardLayout,
): number {
  // Constante `bounds` utilisée par la responsabilité de ce module.
  const bounds = canvas.getBoundingClientRect();
  // Constante `localX` utilisée par la responsabilité de ce module.
  const localX = clientX - bounds.left - layout.board.x;
  // Constante `localY` utilisée par la responsabilité de ce module.
  const localY = clientY - bounds.top - layout.board.y;

  if (localX < 0 || localY < 0 || localX >= layout.board.width || localY >= layout.board.height) {
    return -1;
  }

  // Constante `col` utilisée par la responsabilité de ce module.
  const col = Math.floor(localX / layout.cellSize);
  // Constante `row` utilisée par la responsabilité de ce module.
  const row = Math.floor(localY / layout.cellSize);

  if (col < 0 || col >= layout.columns || row < 0 || row >= layout.rows) {
    return -1;
  }

  return row * layout.columns + col;
}

// ----------------------------------------------------------------------------
// Indique si visage point.
//
// Paramètres :
// - clientX : valeur fournie au traitement.
// - clientY : valeur fournie au traitement.
// - canvas : valeur fournie au traitement.
// - layout : valeur fournie au traitement.
//
// Retour :
// - valeur de type `boolean` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
function isFacePoint(clientX: number, clientY: number, canvas: HTMLCanvasElement, layout: BoardLayout): boolean {
  // Constante `bounds` utilisée par la responsabilité de ce module.
  const bounds = canvas.getBoundingClientRect();
  // Constante `x` utilisée par la responsabilité de ce module.
  const x = clientX - bounds.left;
  // Constante `y` utilisée par la responsabilité de ce module.
  const y = clientY - bounds.top;
  // Constante `{ x: faceX, y: faceY, size: faceSize }` utilisée par la responsabilité de ce module.
  const { x: faceX, y: faceY, size: faceSize } = layout.face;

  return x >= faceX && y >= faceY && x <= faceX + faceSize && y <= faceY + faceSize;
}

// ----------------------------------------------------------------------------
// Associe canvas entrée.
//
// Paramètres :
// - canvas : valeur fournie au traitement.
// - getLayout : valeur fournie au traitement.
// - callbacks : valeur fournie au traitement.
//
// Retour :
// - valeur de type `MountedCanvasInput` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
export function bindCanvasInput(
  canvas: HTMLCanvasElement,
  getLayout: () => BoardLayout,
  callbacks: CanvasInputCallbacks,
): MountedCanvasInput {
  // Constante `state` utilisée par la responsabilité de ce module.
  const state: CanvasInteractionState = {
    mode: null,
    index: -1,
  };
  // Constante `LONG_PRESS_DELAY_MS` utilisée par la responsabilité de ce module.
  const LONG_PRESS_DELAY_MS = 550;
  // Constante `TOUCH_MOVE_CANCEL_PX` utilisée par la responsabilité de ce module.
  const TOUCH_MOVE_CANCEL_PX = 10;
  let longPressTimer: number | undefined;
  let longPressIndex = -1;
  let longPressTriggered = false;
  let longPressPointerId = -1;
  let pressX = 0;
  let pressY = 0;

  // ----------------------------------------------------------------------------
  // Met à jour preview.
  //
  // Paramètres :
  // - nextIndex : valeur fournie au traitement.
  // - nextMode : valeur fournie au traitement.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
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

  // ----------------------------------------------------------------------------
  // Traite pointer down.
  //
  // Paramètres :
  // - event : valeur fournie au traitement.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const handlePointerDown = (event: PointerEvent): void => {
    // Constante `layout` utilisée par la responsabilité de ce module.
    const layout = getLayout();
    event.preventDefault();
    // Constante `targetCanvas` utilisée par la responsabilité de ce module.
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

    if (!callbacks.isGridInteractive()) {
      state.mode = null;
      state.index = -1;
      longPressPointerId = -1;
      return;
    }

    // Constante `index` utilisée par la responsabilité de ce module.
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

    // Constante `actionMode` utilisée par la responsabilité de ce module.
    const actionMode: PreviewMode = event.buttons === 3 ? 'multi' : 'single';
    updatePreview(index, actionMode);

    if (event.pointerType === 'touch') {
      longPressTimer = window.setTimeout(
        // ----------------------------------------------------------------------------
        // Définit timeout callback.
        //
        // Effets de bord :
        // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
        // ----------------------------------------------------------------------------
        () => {
          if (longPressIndex === index && callbacks.isGridInteractive()) {
            callbacks.onFlagCell(index);
            longPressTriggered = true;
            callbacks.onPreviewClear();
            state.mode = null;
            state.index = -1;
          }
          longPressTimer = undefined;
        },
        LONG_PRESS_DELAY_MS,
      );
    }
  };

  // ----------------------------------------------------------------------------
  // Traite pointer move.
  //
  // Paramètres :
  // - event : valeur fournie au traitement.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== longPressPointerId) return;
    if (!callbacks.isGridInteractive()) {
      handlePointerCancel();
      return;
    }
    // Constante `layout` utilisée par la responsabilité de ce module.
    const layout = getLayout();
    // Constante `targetCanvas` utilisée par la responsabilité de ce module.
    const targetCanvas = event.currentTarget as HTMLCanvasElement;

    if (longPressTimer !== undefined) {
      // Constante `moveDistanceX` utilisée par la responsabilité de ce module.
      const moveDistanceX = Math.abs(event.clientX - pressX);
      // Constante `moveDistanceY` utilisée par la responsabilité de ce module.
      const moveDistanceY = Math.abs(event.clientY - pressY);
      if (moveDistanceX > TOUCH_MOVE_CANCEL_PX || moveDistanceY > TOUCH_MOVE_CANCEL_PX) {
        window.clearTimeout(longPressTimer);
        longPressTimer = undefined;
      }
    }

    if (state.mode === null) {
      return;
    }

    // Constante `index` utilisée par la responsabilité de ce module.
    const index = getCellIndexFromPoint(event.clientX, event.clientY, targetCanvas, layout);
    if (index === -1) {
      updatePreview(-1, null);
      return;
    }

    if (index !== state.index) {
      updatePreview(index, state.mode);
    }
  };

  // ----------------------------------------------------------------------------
  // Traite pointer up.
  //
  // Paramètres :
  // - event : valeur fournie au traitement.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== longPressPointerId) return;
    // Constante `layout` utilisée par la responsabilité de ce module.
    const layout = getLayout();
    // Constante `targetCanvas` utilisée par la responsabilité de ce module.
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

    // Constante `activeMode` utilisée par la responsabilité de ce module.
    const activeMode = state.mode;
    // Constante `index` utilisée par la responsabilité de ce module.
    const index = state.index;

    callbacks.onPreviewClear();

    if (activeMode === 'single' && index >= 0) {
      callbacks.onOpenCell(index);
    }
    if (activeMode === 'multi' && index >= 0) {
      callbacks.onChordCell(index);
    }

    state.mode = null;
    state.index = -1;
    longPressPointerId = -1;
    longPressIndex = -1;
  };

  // ----------------------------------------------------------------------------
  // Traite context menu.
  //
  // Paramètres :
  // - event : valeur fournie au traitement.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const handleContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
  };

  // ----------------------------------------------------------------------------
  // Traite pointer cancel.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
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
    // ----------------------------------------------------------------------------
    // Retourne état.
    //
    // Retour :
    // - valeur de type `{ mode: PreviewMode; index: number; }` produite par le traitement.
    //
    // Effets de bord :
    // - aucun.
    // ----------------------------------------------------------------------------
    getState: () => ({ ...state }),
    // ----------------------------------------------------------------------------
    // Libère le traitement demandé.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    dispose: () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerCancel);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    },
  };
}
