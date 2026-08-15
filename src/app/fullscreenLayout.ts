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
  minCellSize: 16,
  maxCellSize: 16,
  padding: 6,
  scale: 1,
};

export function computeAdaptiveBoardLayout(
  viewport: LayoutViewport,
  rows: number,
  columns: number,
  uiChromePx: number,
  options: FullscreenLayoutOptions = {},
): BoardLayout {
  const merged: Required<FullscreenLayoutOptions> = {
    ...DEFAULT_FULLSCREEN_LAYOUT_OPTIONS,
    ...options,
    uiChromePx: typeof uiChromePx === 'number' ? uiChromePx : options.uiChromePx ?? DEFAULT_FULLSCREEN_LAYOUT_OPTIONS.uiChromePx,
  };

  const normalized: LayoutOptions = {
    minCellSize: merged.minCellSize,
    maxCellSize: merged.maxCellSize,
    chromeHeight: merged.uiChromePx,
    padding: merged.padding,
    scale: merged.scale,
    pixelRatio: typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1,
  };

  return computeCanvasAdaptiveBoardLayout(viewport, rows, columns, normalized);
}
