// ============================================================================
// Minesweeper Infinite - Géométrie du plateau
// ----------------------------------------------------------------------------
// Ce fichier calcule les dimensions et positions de l'interface. Il ne crée
// aucun élément DOM.
// ============================================================================
import type { Difficulty } from '../core/types';

export interface LayoutViewport {
  width: number;
  height: number;
}

export interface BoardRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoardLayout {
  readonly rows: number;
  readonly columns: number;
  readonly cellSize: number;
  readonly canvasWidth: number;
  readonly canvasHeight: number;
  /** Rectangle exact occupé par les cellules jouables. */
  readonly board: BoardRect;
  /** Rectangle exact occupé par la fenêtre complète du Démineur. */
  readonly topBar: BoardRect;
  readonly face: { x: number; y: number; size: number };
  readonly leftCounter: BoardRect;
  readonly rightCounter: BoardRect;
}

export interface LayoutOptions {
  readonly minCellSize?: number;
  readonly maxCellSize?: number;
  readonly chromeHeight?: number;
  readonly padding?: number;
  readonly scale?: number;
  readonly pixelRatio?: number;
}

export interface DifficultyPreset {
  readonly difficulty: Difficulty;
}

// Constante `REFERENCE_CELL_SIZE` utilisée par la responsabilité de ce module.
const REFERENCE_CELL_SIZE = 16;

// ----------------------------------------------------------------------------
// Limite le traitement demandé.
//
// Paramètres :
// - value : valeur fournie au traitement.
// - min : valeur fournie au traitement.
// - max : valeur fournie au traitement.
//
// Retour :
// - valeur de type `number` produite par le traitement.
//
// Effets de bord :
// - aucun.
// ----------------------------------------------------------------------------
function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

// ----------------------------------------------------------------------------
// Calcule la mise à l'échelle de le traitement demandé.
//
// Paramètres :
// - value : valeur fournie au traitement.
// - cellSize : valeur fournie au traitement.
//
// Retour :
// - valeur de type `number` produite par le traitement.
//
// Effets de bord :
// - aucun.
// ----------------------------------------------------------------------------
function scaled(value: number, cellSize: number): number {
  return Math.max(1, Math.round(value * (cellSize / REFERENCE_CELL_SIZE)));
}

// ----------------------------------------------------------------------------
// Calcule la mise à l'échelle de border.
//
// Paramètres :
// - value : valeur fournie au traitement.
// - cellSize : valeur fournie au traitement.
// - pixelRatio : valeur fournie au traitement.
//
// Retour :
// - valeur de type `number` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
function scaledBorder(value: number, cellSize: number, pixelRatio: number): number {
  // Constante `cssWidth` utilisée par la responsabilité de ce module.
  const cssWidth = value * (cellSize / REFERENCE_CELL_SIZE);
  return Math.max(1 / pixelRatio, Math.floor(cssWidth * pixelRatio) / pixelRatio);
}

/**
 * Reproduit la géométrie de ShizukuIchi/minesweeper. À la taille de référence,
 * une fenêtre mesure exactement `columns * 16 + 19` par `rows * 16 + 78` pixels.
 */
// ----------------------------------------------------------------------------
// Calcule adaptive plateau disposition.
//
// Paramètres :
// - viewport : valeur fournie au traitement.
// - rows : valeur fournie au traitement.
// - columns : valeur fournie au traitement.
// - options : valeur fournie au traitement.
//
// Retour :
// - valeur de type `BoardLayout` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
export function computeAdaptiveBoardLayout(
  viewport: LayoutViewport,
  rows: number,
  columns: number,
  options: LayoutOptions = {},
): BoardLayout {
  // Constante `{ minCellSize = 8, maxCellSize = 16, padding = 6, scale = 1, pixelRatio = 1 }` utilisée par la responsabilité de ce module.
  const { minCellSize = 8, maxCellSize = 16, padding = 6, scale = 1, pixelRatio = 1 } = options;
  // Constante `safeScale` utilisée par la responsabilité de ce module.
  const safeScale = Number.isFinite(scale) ? Math.max(0.5, scale) : 1;
  // Constante `safePixelRatio` utilisée par la responsabilité de ce module.
  const safePixelRatio = Number.isFinite(pixelRatio) ? Math.max(1, pixelRatio) : 1;
  // Constante `minSize` utilisée par la responsabilité de ce module.
  const minSize = Math.max(4, Math.round(minCellSize * safeScale));
  // Constante `maxSize` utilisée par la responsabilité de ce module.
  const maxSize = Math.max(minSize, Math.round(maxCellSize * safeScale));
  // Constante `outerPadding` utilisée par la responsabilité de ce module.
  const outerPadding = Math.max(0, Math.round(padding));

  // Constante `maxOuterBorder` utilisée par la responsabilité de ce module.
  const maxOuterBorder = scaledBorder(3, maxSize, safePixelRatio);
  // Constante `maxBoardBorder` utilisée par la responsabilité de ce module.
  const maxBoardBorder = scaledBorder(3, maxSize, safePixelRatio);
  // Constante `horizontalChrome` utilisée par la responsabilité de ce module.
  const horizontalChrome = maxOuterBorder + scaled(10, maxSize) + maxBoardBorder * 2;
  // Constante `verticalChrome` utilisée par la responsabilité de ce module.
  const verticalChrome = scaled(20 + 10 + 34 + 5, maxSize) + maxOuterBorder + maxBoardBorder * 2;
  // Constante `availableWidth` utilisée par la responsabilité de ce module.
  const availableWidth = Math.max(1, viewport.width - outerPadding * 2 - horizontalChrome);
  // Constante `availableHeight` utilisée par la responsabilité de ce module.
  const availableHeight = Math.max(1, viewport.height - outerPadding * 2 - verticalChrome);
  // Constante `cellSize` utilisée par la responsabilité de ce module.
  const cellSize = clamp(Math.floor(Math.min(availableWidth / columns, availableHeight / rows)), minSize, maxSize);

  // Constante `menuHeight` utilisée par la responsabilité de ce module.
  const menuHeight = scaled(20, cellSize);
  // Constante `outerBorder` utilisée par la responsabilité de ce module.
  const outerBorder = scaledBorder(3, cellSize, safePixelRatio);
  // Constante `contentPadding` utilisée par la responsabilité de ce module.
  const contentPadding = scaled(5, cellSize);
  // Constante `scoreHeight` utilisée par la responsabilité de ce module.
  const scoreHeight = scaled(34, cellSize);
  // Constante `scoreGap` utilisée par la responsabilité de ce module.
  const scoreGap = scaled(5, cellSize);
  // Constante `boardBorder` utilisée par la responsabilité de ce module.
  const boardBorder = scaledBorder(3, cellSize, safePixelRatio);
  // Constante `counterWidth` utilisée par la responsabilité de ce module.
  const counterWidth = scaled(40, cellSize);
  // Constante `counterHeight` utilisée par la responsabilité de ce module.
  const counterHeight = scaled(24, cellSize);
  // Constante `faceSize` utilisée par la responsabilité de ce module.
  const faceSize = scaled(24, cellSize);

  // Constante `boardWidth` utilisée par la responsabilité de ce module.
  const boardWidth = columns * cellSize;
  // Constante `boardHeight` utilisée par la responsabilité de ce module.
  const boardHeight = rows * cellSize;
  // Constante `windowWidth` utilisée par la responsabilité de ce module.
  const windowWidth = outerBorder + contentPadding * 2 + boardBorder * 2 + boardWidth;
  // Constante `windowHeight` utilisée par la responsabilité de ce module.
  const windowHeight =
    menuHeight + outerBorder + contentPadding * 2 + scoreHeight + scoreGap + boardBorder * 2 + boardHeight;
  // Constante `windowX` utilisée par la responsabilité de ce module.
  const windowX = Math.max(0, (viewport.width - windowWidth) / 2);
  // Constante `windowY` utilisée par la responsabilité de ce module.
  const windowY = Math.max(0, (viewport.height - windowHeight) / 2);
  // Constante `scoreX` utilisée par la responsabilité de ce module.
  const scoreX = windowX + outerBorder + contentPadding;
  // Constante `scoreY` utilisée par la responsabilité de ce module.
  const scoreY = windowY + menuHeight + outerBorder + contentPadding;
  // Constante `gridX` utilisée par la responsabilité de ce module.
  const gridX = scoreX + boardBorder;
  // Constante `gridY` utilisée par la responsabilité de ce module.
  const gridY = scoreY + scoreHeight + scoreGap + boardBorder;
  // Constante `counterY` utilisée par la responsabilité de ce module.
  const counterY = scoreY + Math.round((scoreHeight - counterHeight) / 2);
  // Constante `scoreWidth` utilisée par la responsabilité de ce module.
  const scoreWidth = boardWidth + boardBorder * 2;

  return {
    rows,
    columns,
    cellSize,
    canvasWidth: viewport.width,
    canvasHeight: viewport.height,
    board: { x: gridX, y: gridY, width: boardWidth, height: boardHeight },
    topBar: { x: windowX, y: windowY, width: windowWidth, height: windowHeight },
    face: {
      x: scoreX + Math.floor((scoreWidth - faceSize) / 2),
      y: scoreY + Math.floor((scoreHeight - faceSize) / 2),
      size: faceSize,
    },
    leftCounter: {
      x: scoreX + scaled(4, cellSize),
      y: counterY,
      width: counterWidth,
      height: counterHeight,
    },
    rightCounter: {
      x: scoreX + scoreWidth - scaled(7, cellSize) - counterWidth,
      y: counterY,
      width: counterWidth,
      height: counterHeight,
    },
  };
}

// ----------------------------------------------------------------------------
// Convertit to ligne column.
//
// Paramètres :
// - index : valeur fournie au traitement.
// - columns : valeur fournie au traitement.
//
// Retour :
// - valeur de type `{ row: number; column: number; }` produite par le traitement.
//
// Effets de bord :
// - aucun.
// ----------------------------------------------------------------------------
export function indexToRowColumn(index: number, columns: number): { row: number; column: number } {
  return { row: Math.floor(index / columns), column: index % columns };
}

// ----------------------------------------------------------------------------
// Construit disposition état hash.
//
// Paramètres :
// - layout : valeur fournie au traitement.
//
// Retour :
// - valeur de type `string` produite par le traitement.
//
// Effets de bord :
// - aucun.
// ----------------------------------------------------------------------------
export function buildLayoutStateHash(layout: BoardLayout): string {
  return `${layout.rows}x${layout.columns}@${layout.cellSize}`;
}
