import type { BoardLayout, LayoutOptions, LayoutViewport } from '../canvas/layout';
import { computeAdaptiveBoardLayout as computeCanvasAdaptiveBoardLayout } from '../canvas/layout';

export interface FullscreenLayoutOptions {
  readonly uiChromePx?: number;
  readonly minCellSize?: number;
  readonly maxCellSize?: number;
  readonly padding?: number;
  readonly scale?: number;
}

const DEFAULT_FULLSCREEN_LAYOUT_OPTIONS: Required<Omit<FullscreenLayoutOptions, 'uiChromePx'>> & {
  uiChromePx: number;
} = {
  uiChromePx: 14,
  minCellSize: 8,
  maxCellSize: 16,
  padding: 6,
  scale: 1,
};

export function computeAdaptiveBoardLayout(
  viewport: LayoutViewport,
  rows: number,
  columns: number,
  options: FullscreenLayoutOptions = {},
): BoardLayout {
  const merged: Required<FullscreenLayoutOptions> = {
    ...DEFAULT_FULLSCREEN_LAYOUT_OPTIONS,
    ...options,
  };

  const normalized: LayoutOptions = {
    minCellSize: merged.minCellSize,
    maxCellSize: merged.maxCellSize,
    chromeHeight: merged.uiChromePx,
    padding: merged.padding,
    scale: merged.scale,
  };

  return computeCanvasAdaptiveBoardLayout(viewport, rows, columns, normalized);
}
