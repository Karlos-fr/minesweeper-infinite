import { Difficulty } from '../core/types';

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
  readonly board: BoardRect;
  readonly topBar: BoardRect;
  readonly face: {
    x: number;
    y: number;
    size: number;
  };
  readonly leftCounter: BoardRect;
  readonly rightCounter: BoardRect;
}

export interface LayoutOptions {
  readonly minCellSize?: number;
  readonly maxCellSize?: number;
  readonly chromeHeight?: number;
  readonly padding?: number;
  readonly scale?: number;
}

export interface DifficultyPreset {
  readonly difficulty: Difficulty;
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function computeAdaptiveBoardLayout(
  viewport: LayoutViewport,
  rows: number,
  columns: number,
  options: LayoutOptions = {},
): BoardLayout {
  const {
    minCellSize = 8,
    maxCellSize = 16,
    chromeHeight = 28,
    padding = 12,
    scale = 1,
  } = options;
  const resolvedScale = Number.isFinite(scale as number) ? Math.max(0.5, scale as number) : 1;
  const safeWidth = Math.max(1, Math.round(viewport.width - Math.round(padding * resolvedScale) * 2));
  const safeHeight = Math.max(1, Math.round(viewport.height - Math.round(padding * resolvedScale) * 2));
  const reservedTop = Math.max(0, Math.round(chromeHeight * resolvedScale));

  const availableHeight = Math.max(1, safeHeight - reservedTop);
  const MENU_BAR_HEIGHT = Math.max(1, Math.round(20 * resolvedScale));
  const SCORE_BAR_HEIGHT = Math.max(1, Math.round(34 * resolvedScale));
  const resolvedMinCellSize = Math.max(1, Math.round(minCellSize * resolvedScale));
  const resolvedMaxCellSize = Math.max(resolvedMinCellSize, Math.round(maxCellSize * resolvedScale));
  let cellSize = clamp(
    Math.floor(Math.min(safeWidth / columns, availableHeight / rows)),
    resolvedMinCellSize,
    resolvedMaxCellSize,
  );
  const topBarHeight = MENU_BAR_HEIGHT + SCORE_BAR_HEIGHT;
  while (cellSize > resolvedMinCellSize && rows * cellSize + topBarHeight > availableHeight) {
    cellSize -= 1;
  }

  const boardWidth = columns * cellSize;
  const boardHeight = rows * cellSize;

  const scoreBarPaddingX = Math.max(1, Math.round(4 * resolvedScale));
  const scoreBarPaddingRight = Math.max(1, Math.round(7 * resolvedScale));
  const counterHeight = Math.max(1, SCORE_BAR_HEIGHT - 2 * Math.round(2 * resolvedScale) - 2 * Math.round(3 * resolvedScale));
  const counterWidth = Math.max(1, Math.round(40 * resolvedScale));
  const faceSize = Math.max(
    Math.round(16 * resolvedScale),
    Math.round(Math.min(cellSize * 1.5, SCORE_BAR_HEIGHT - Math.round(8 * resolvedScale))),
  );

  const x = Math.max(0, Math.round((viewport.width - boardWidth) / 2));
  const y = Math.max(0, Math.round(padding + reservedTop));

  return {
    rows,
    columns,
    cellSize,
    canvasWidth: viewport.width,
    canvasHeight: viewport.height,
    board: {
      x,
      y: y + topBarHeight,
      width: boardWidth,
      height: boardHeight,
    },
    topBar: {
      x,
      y,
      width: boardWidth,
      height: topBarHeight,
    },
    face: {
      x: x + Math.floor((boardWidth - faceSize) / 2),
      y: Math.round(y + MENU_BAR_HEIGHT + (SCORE_BAR_HEIGHT - faceSize) / 2),
      size: faceSize,
    },
    leftCounter: {
      x: Math.max(x + scoreBarPaddingX, 0),
      y: Math.round(y + MENU_BAR_HEIGHT + (SCORE_BAR_HEIGHT - counterHeight) / 2),
      width: counterWidth,
      height: counterHeight,
    },
    rightCounter: {
      x: Math.max(x + boardWidth - counterWidth - scoreBarPaddingRight, 0),
      y: Math.round(y + MENU_BAR_HEIGHT + (SCORE_BAR_HEIGHT - counterHeight) / 2),
      width: counterWidth,
      height: counterHeight,
    },
  };
}

export function indexToRowColumn(index: number, columns: number): { row: number; column: number } {
  return {
    row: Math.floor(index / columns),
    column: index % columns,
  };
}

export function buildLayoutStateHash(layout: BoardLayout): string {
  return `${layout.rows}x${layout.columns}@${layout.cellSize}`;
}
