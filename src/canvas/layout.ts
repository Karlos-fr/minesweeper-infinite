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
  /** Exact rectangle occupied by the playable cells. */
  readonly board: BoardRect;
  /** Exact rectangle occupied by the complete Minesweeper window. */
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

const REFERENCE_CELL_SIZE = 16;

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function scaled(value: number, cellSize: number): number {
  return Math.max(1, Math.round(value * (cellSize / REFERENCE_CELL_SIZE)));
}

function scaledBorder(value: number, cellSize: number, pixelRatio: number): number {
  const cssWidth = value * (cellSize / REFERENCE_CELL_SIZE);
  return Math.max(1 / pixelRatio, Math.floor(cssWidth * pixelRatio) / pixelRatio);
}

/**
 * Reproduces the geometry of ShizukuIchi/minesweeper. At the reference size,
 * a window is exactly `columns * 16 + 19` by `rows * 16 + 78` pixels.
 */
export function computeAdaptiveBoardLayout(
  viewport: LayoutViewport,
  rows: number,
  columns: number,
  options: LayoutOptions = {},
): BoardLayout {
  const { minCellSize = 8, maxCellSize = 16, padding = 6, scale = 1, pixelRatio = 1 } = options;
  const safeScale = Number.isFinite(scale) ? Math.max(0.5, scale) : 1;
  const safePixelRatio = Number.isFinite(pixelRatio) ? Math.max(1, pixelRatio) : 1;
  const minSize = Math.max(4, Math.round(minCellSize * safeScale));
  const maxSize = Math.max(minSize, Math.round(maxCellSize * safeScale));
  const outerPadding = Math.max(0, Math.round(padding));

  const maxOuterBorder = scaledBorder(3, maxSize, safePixelRatio);
  const maxBoardBorder = scaledBorder(3, maxSize, safePixelRatio);
  const horizontalChrome = maxOuterBorder + scaled(10, maxSize) + maxBoardBorder * 2;
  const verticalChrome =
    scaled(20 + 10 + 34 + 5, maxSize) + maxOuterBorder + maxBoardBorder * 2;
  const availableWidth = Math.max(1, viewport.width - outerPadding * 2 - horizontalChrome);
  const availableHeight = Math.max(1, viewport.height - outerPadding * 2 - verticalChrome);
  const cellSize = clamp(
    Math.floor(Math.min(availableWidth / columns, availableHeight / rows)),
    minSize,
    maxSize,
  );

  const menuHeight = scaled(20, cellSize);
  const outerBorder = scaledBorder(3, cellSize, safePixelRatio);
  const contentPadding = scaled(5, cellSize);
  const scoreHeight = scaled(34, cellSize);
  const scoreGap = scaled(5, cellSize);
  const boardBorder = scaledBorder(3, cellSize, safePixelRatio);
  const counterWidth = scaled(40, cellSize);
  const counterHeight = scaled(24, cellSize);
  const faceSize = scaled(24, cellSize);

  const boardWidth = columns * cellSize;
  const boardHeight = rows * cellSize;
  const windowWidth = outerBorder + contentPadding * 2 + boardBorder * 2 + boardWidth;
  const windowHeight =
    menuHeight + outerBorder + contentPadding * 2 + scoreHeight + scoreGap + boardBorder * 2 + boardHeight;
  const windowX = Math.max(0, (viewport.width - windowWidth) / 2);
  const windowY = Math.max(0, (viewport.height - windowHeight) / 2);
  const scoreX = windowX + outerBorder + contentPadding;
  const scoreY = windowY + menuHeight + outerBorder + contentPadding;
  const gridX = scoreX + boardBorder;
  const gridY = scoreY + scoreHeight + scoreGap + boardBorder;
  const counterY = scoreY + Math.round((scoreHeight - counterHeight) / 2);
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

export function indexToRowColumn(index: number, columns: number): { row: number; column: number } {
  return { row: Math.floor(index / columns), column: index % columns };
}

export function buildLayoutStateHash(layout: BoardLayout): string {
  return `${layout.rows}x${layout.columns}@${layout.cellSize}`;
}
