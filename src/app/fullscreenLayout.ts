// ============================================================================
// Minesweeper Infinite - Disposition plein écran
// ----------------------------------------------------------------------------
// Ce fichier adapte les options de fenêtre au calcul géométrique du Canvas. Il
// ne réalise aucun rendu.
// ============================================================================
import type { BoardLayout, LayoutOptions, LayoutViewport } from '../canvas/layout';
import { computeAdaptiveBoardLayout as computeCanvasAdaptiveBoardLayout } from '../canvas/layout';

export interface FullscreenLayoutOptions {
  readonly uiChromePx?: number;
  readonly minCellSize?: number;
  readonly maxCellSize?: number;
  readonly padding?: number;
  readonly scale?: number;
}

// Constante `DEFAULT_FULLSCREEN_LAYOUT_OPTIONS` utilisée par la responsabilité de ce module.
const DEFAULT_FULLSCREEN_LAYOUT_OPTIONS: Required<Omit<FullscreenLayoutOptions, 'uiChromePx'>> & {
  uiChromePx: number;
} = {
  uiChromePx: 14,
  minCellSize: 16,
  maxCellSize: 16,
  padding: 6,
  scale: 1,
};

// ----------------------------------------------------------------------------
// Calcule adaptive plateau disposition.
//
// Paramètres :
// - viewport : valeur fournie au traitement.
// - rows : valeur fournie au traitement.
// - columns : valeur fournie au traitement.
// - uiChromePx : valeur fournie au traitement.
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
  uiChromePx: number,
  options: FullscreenLayoutOptions = {},
): BoardLayout {
  // Constante `merged` utilisée par la responsabilité de ce module.
  const merged: Required<FullscreenLayoutOptions> = {
    ...DEFAULT_FULLSCREEN_LAYOUT_OPTIONS,
    ...options,
    uiChromePx:
      typeof uiChromePx === 'number'
        ? uiChromePx
        : (options.uiChromePx ?? DEFAULT_FULLSCREEN_LAYOUT_OPTIONS.uiChromePx),
  };

  // Constante `normalized` utilisée par la responsabilité de ce module.
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
