// ============================================================================
// Minesweeper Infinite - Contrôleur du plateau
// ----------------------------------------------------------------------------
// Ce fichier orchestre le store, les entrées, le rendu, le son et le temps.
// Les règles métier restent dans core/engine.
// ============================================================================
import type { Difficulty } from '../core/types';
import { computeAdaptiveBoardLayout } from './fullscreenLayout';
import { type BoardLayout } from '../canvas/layout';
import { disposeRenderer, onImagesLoaded, renderFrame } from '../canvas/renderer';
import { bindCanvasInput } from '../canvas/input';
import { createGameStateStore } from '../core/engine/useGameState';
import type { CanvasHost } from './bootstrap';
import loseSound from '../ui/assets/sounds/lose.wav';
import tickSound from '../ui/assets/sounds/tick.wav';
import winSound from '../ui/assets/sounds/win.wav';

export interface MinesweeperCanvasController {
  start: () => void;
  dispose: () => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setFillToWindow: () => void;
  setZoom: (zoom: GridZoom) => void;
}

export type GridZoom = 1 | 1.5 | 2;

// Constante `DEFAULT_LAYOUT_OPTIONS` utilisée par la responsabilité de ce module.
const DEFAULT_LAYOUT_OPTIONS = {
  uiChromePx: 14,
  minCellSize: 8,
  maxCellSize: 16,
  padding: 6,
};

export interface CanvasControllerLayoutOptions {
  readonly uiChromePx?: number;
  readonly minCellSize?: number;
  readonly maxCellSize?: number;
  readonly padding?: number;
  readonly scale?: GridZoom;
}

export interface MinesweeperCanvasControllerOptions {
  difficulty: Difficulty;
  layout?: CanvasControllerLayoutOptions;
  onLayoutChange?: (layout: BoardLayout) => void;
}

interface FillToWindowConfig {
  rows: number;
  columns: number;
  mines: number;
}

// ----------------------------------------------------------------------------
// Crée minesweeper canvas controller.
//
// Paramètres :
// - host : valeur fournie au traitement.
// - options : valeur fournie au traitement.
//
// Retour :
// - valeur de type `MinesweeperCanvasController` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
export function createMinesweeperCanvasController(
  host: CanvasHost,
  options: MinesweeperCanvasControllerOptions = { difficulty: 'Beginner' },
): MinesweeperCanvasController {
  // Constante `store` utilisée par la responsabilité de ce module.
  const store = createGameStateStore(options.difficulty);
  // Constante `{ canvas, ctx }` utilisée par la responsabilité de ce module.
  const { canvas, ctx } = host;
  // Constante `layoutOptions` utilisée par la responsabilité de ce module.
  const layoutOptions = {
    ...DEFAULT_LAYOUT_OPTIONS,
    ...options.layout,
  };
  // ----------------------------------------------------------------------------
  // Joue son.
  //
  // Paramètres :
  // - src : valeur fournie au traitement.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const playSound = (src: string): void => {
    try {
      // Constante `audio` utilisée par la responsabilité de ce module.
      const audio = new Audio(src);
      audio.volume = 0.8;
      // Constante `pending` utilisée par la responsabilité de ce module.
      const pending = audio.play();
      if (typeof pending?.catch === 'function') {
        pending.catch(
          // ----------------------------------------------------------------------------
          // Exécute le callback associé à catch.
          //
          // Effets de bord :
          // - aucun.
          // ----------------------------------------------------------------------------
          () => {
            // Les règles audio du navigateur peuvent bloquer la lecture avant la première interaction.
          },
        );
      }
    } catch {
      // Les erreurs audio sont ignorées afin de ne pas interrompre la partie.
    }
  };
  // ----------------------------------------------------------------------------
  // Joue lose son.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const playLoseSound = (): void => playSound(loseSound);
  // ----------------------------------------------------------------------------
  // Joue tick son.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const playTickSound = (): void => playSound(tickSound);
  // ----------------------------------------------------------------------------
  // Joue victoire son.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const playWinSound = (): void => playSound(winSound);

  let facePressed = false;
  let timerSeconds = 0;
  let timerInterval: number | undefined;
  let previousStatus = store.getState().status;
  let previousState = store.getState();
  let unregisterImagesLoaded: () => void = () => {};
  let isFillToWindow = false;
  let fillConfig: FillToWindowConfig | null = null;
  let fillDensity: number | null = null;
  let layoutScale: GridZoom = options.layout?.scale ?? 1;

  // ----------------------------------------------------------------------------
  // Retourne disposition échelle.
  //
  // Retour :
  // - valeur de type `GridZoom` produite par le traitement.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const getLayoutScale = (): GridZoom => layoutScale;

  // ----------------------------------------------------------------------------
  // Retourne resolved disposition options.
  //
  // Retour :
  // - valeur de type `Required<CanvasControllerLayoutOptions>` produite par le traitement.
  //
  // Effets de bord :
  // - aucun.
  // ----------------------------------------------------------------------------
  const getResolvedLayoutOptions = (): Required<CanvasControllerLayoutOptions> => ({
    uiChromePx: Math.round(layoutOptions.uiChromePx),
    minCellSize: layoutOptions.minCellSize,
    maxCellSize: layoutOptions.maxCellSize,
    padding: layoutOptions.padding,
    scale: getLayoutScale(),
  });

  // ----------------------------------------------------------------------------
  // Retourne sûres zone d'affichage.
  //
  // Retour :
  // - valeur de type `{ width: number; height: number; }` produite par le traitement.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const getSafeViewport = (): { width: number; height: number } => ({
    width: Math.max(1, canvas.clientWidth),
    height: Math.max(1, canvas.clientHeight),
  });

  // ----------------------------------------------------------------------------
  // Retourne cellule density.
  //
  // Paramètres :
  // - state : valeur fournie au traitement.
  //
  // Retour :
  // - valeur de type `number` produite par le traitement.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const getCellDensity = (state: ReturnType<typeof store.getState>): number => {
    // Constante `total` utilisée par la responsabilité de ce module.
    const total = Math.max(1, state.rows * state.columns);
    // Constante `density` utilisée par la responsabilité de ce module.
    const density = state.mines / total;
    return density > 0 && density < 1 ? density : 0.156;
  };

  // Constante `initialScale` utilisée par la responsabilité de ce module.
  const initialScale = getLayoutScale();
  let layout: BoardLayout = computeAdaptiveBoardLayout(
    { width: host.canvas.clientWidth, height: host.canvas.clientHeight },
    store.getState().rows,
    store.getState().columns,
    Math.round(layoutOptions.uiChromePx * initialScale),
    {
      ...getResolvedLayoutOptions(),
      uiChromePx: Math.round(layoutOptions.uiChromePx * initialScale),
    },
  );

  // ----------------------------------------------------------------------------
  // Calcule remplissage configuration.
  //
  // Retour :
  // - valeur de type `FillToWindowConfig` produite par le traitement.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const computeFillConfig = (): FillToWindowConfig => {
    // Constante `state` utilisée par la responsabilité de ce module.
    const state = store.getState();
    // Constante `density` utilisée par la responsabilité de ce module.
    const density = fillDensity ?? getCellDensity(state);
    // Constante `viewport` utilisée par la responsabilité de ce module.
    const viewport = getSafeViewport();
    // Constante `resolvedScale` utilisée par la responsabilité de ce module.
    const resolvedScale = getLayoutScale();
    // Constante `safeWidth` utilisée par la responsabilité de ce module.
    const safeWidth = Math.max(1, Math.round(viewport.width - Math.round(layoutOptions.padding * resolvedScale) * 2));
    // Constante `safeHeight` utilisée par la responsabilité de ce module.
    const safeHeight = Math.max(1, Math.round(viewport.height - Math.round(layoutOptions.padding * resolvedScale) * 2));
    // Constante `boardWidth` utilisée par la responsabilité de ce module.
    const boardWidth = Math.max(1, safeWidth - Math.round(19 * resolvedScale));
    // Constante `boardHeight` utilisée par la responsabilité de ce module.
    const boardHeight = Math.max(1, safeHeight - Math.round(78 * resolvedScale));

    // Constante `minCellSize` utilisée par la responsabilité de ce module.
    const minCellSize = Math.max(4, Math.round(layoutOptions.minCellSize * resolvedScale));
    // Constante `maxCellSize` utilisée par la responsabilité de ce module.
    const maxCellSize = Math.max(minCellSize, Math.round(layoutOptions.maxCellSize * resolvedScale));

    // Constante `bestCellSize` utilisée par la responsabilité de ce module.
    const bestCellSize = maxCellSize;
    // Constante `bestRows` utilisée par la responsabilité de ce module.
    const bestRows = Math.max(1, Math.floor(boardHeight / bestCellSize));
    // Constante `bestColumns` utilisée par la responsabilité de ce module.
    const bestColumns = Math.max(1, Math.floor(boardWidth / bestCellSize));

    // Constante `total` utilisée par la responsabilité de ce module.
    const total = bestRows * bestColumns;
    // Constante `rawMines` utilisée par la responsabilité de ce module.
    const rawMines = Math.round(total * density);
    // Constante `maxMines` utilisée par la responsabilité de ce module.
    const maxMines = Math.max(0, total - 1);
    // Constante `mines` utilisée par la responsabilité de ce module.
    const mines = total <= 1 ? 0 : Math.max(1, Math.min(rawMines, maxMines));

    return {
      rows: bestRows,
      columns: bestColumns,
      mines,
    };
  };

  // ----------------------------------------------------------------------------
  // Indique si opened cellule.
  //
  // Paramètres :
  // - previous : valeur fournie au traitement.
  // - next : valeur fournie au traitement.
  //
  // Retour :
  // - valeur de type `boolean` produite par le traitement.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const hasOpenedCell = (
    previous: ReturnType<typeof store.getState>,
    next: ReturnType<typeof store.getState>,
  ): boolean => {
    if (previous.status === 'won' || previous.status === 'died' || next.status === 'won' || next.status === 'died') {
      return false;
    }

    for (let i = 0; i < previous.ceils.length; i += 1) {
      if (!next.ceils[i]) continue;
      if (previous.ceils[i]?.state !== 'open' && next.ceils[i]!.state === 'open') {
        return true;
      }
    }
    return false;
  };

  // ----------------------------------------------------------------------------
  // Applique remplissage to fenêtre.
  //
  // Paramètres :
  // - force : valeur fournie au traitement.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const applyFillToWindow = (force = false): void => {
    if (!isFillToWindow) return;
    // Constante `nextConfig` utilisée par la responsabilité de ce module.
    const nextConfig = computeFillConfig();
    if (
      force ||
      !fillConfig ||
      fillConfig.rows !== nextConfig.rows ||
      fillConfig.columns !== nextConfig.columns ||
      fillConfig.mines !== nextConfig.mines
    ) {
      fillConfig = nextConfig;
      store.reset(nextConfig);
    }
  };

  // ----------------------------------------------------------------------------
  // Arrête chronomètre.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const stopTimer = (): void => {
    if (timerInterval !== undefined) {
      window.clearInterval(timerInterval);
      timerInterval = undefined;
    }
  };

  // ----------------------------------------------------------------------------
  // Démarre chronomètre.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const startTimer = (): void => {
    if (timerInterval !== undefined) return;
    timerInterval = window.setInterval(
      // ----------------------------------------------------------------------------
      // Définit interval callback.
      //
      // Effets de bord :
      // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
      // ----------------------------------------------------------------------------
      () => {
        timerSeconds += 1;
        render();
      },
      1000,
    );
  };

  // ----------------------------------------------------------------------------
  // Effectue le rendu de le traitement demandé.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  function render(): void {
    // Constante `state` utilisée par la responsabilité de ce module.
    const state = store.getState();
    // Constante `resolvedScale` utilisée par la responsabilité de ce module.
    const resolvedScale = getLayoutScale();
    // Constante `dynamicLayoutOptions` utilisée par la responsabilité de ce module.
    const dynamicLayoutOptions = getResolvedLayoutOptions();
    layout = computeAdaptiveBoardLayout(
      {
        width: canvas.clientWidth,
        height: canvas.clientHeight,
      },
      state.rows,
      state.columns,
      Math.round(layoutOptions.uiChromePx * resolvedScale),
      {
        ...dynamicLayoutOptions,
        uiChromePx: Math.round(layoutOptions.uiChromePx * resolvedScale),
      },
    );
    options.onLayoutChange?.(layout);
    renderFrame(ctx, canvas.clientWidth, canvas.clientHeight, layout, state, {
      timerSeconds: Math.max(0, timerSeconds),
      facePressed,
    });
  }

  // ----------------------------------------------------------------------------
  // Réagit à store update.
  //
  // Paramètres :
  // - state : valeur fournie au traitement.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  function onStoreUpdate(state: ReturnType<typeof store.getState>): void {
    if (state.status === 'won' && previousStatus !== 'won') {
      playWinSound();
    } else if (state.status === 'died' && previousStatus !== 'died') {
      playLoseSound();
    } else if (hasOpenedCell(previousState, state)) {
      playTickSound();
    }

    if (state.status !== previousStatus) {
      if (state.status === 'started' && previousStatus === 'new') {
        timerSeconds = 0;
        startTimer();
      }

      if (state.status === 'won' || state.status === 'died') {
        stopTimer();
      }
      if (state.status === 'new') {
        stopTimer();
        timerSeconds = 0;
      }

      previousStatus = state.status;
    }

    if (state.status === 'new') {
      stopTimer();
      timerSeconds = 0;
    }

    previousState = state;
    render();
  }

  // Constante `unsubscribe` utilisée par la responsabilité de ce module.
  const unsubscribe = store.subscribe(onStoreUpdate);
  unregisterImagesLoaded = onImagesLoaded(render);

  // ----------------------------------------------------------------------------
  // Réagit à visage press.
  //
  // Paramètres :
  // - pressed : valeur fournie au traitement.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const onFacePress = (pressed: boolean): void => {
    facePressed = pressed;
    render();
  };

  // Constante `input` utilisée par la responsabilité de ce module.
  const input = bindCanvasInput(
    canvas,
    // ----------------------------------------------------------------------------
    // Associe canvas entrée callback.
    //
    // Retour :
    // - valeur de type `BoardLayout` produite par le traitement.
    //
    // Effets de bord :
    // - aucun.
    // ----------------------------------------------------------------------------
    () => layout,
    {
      // ----------------------------------------------------------------------------
      // Indique si grille interactive.
      //
      // Retour :
      // - valeur de type `boolean` produite par le traitement.
      //
      // Effets de bord :
      // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
      // ----------------------------------------------------------------------------
      isGridInteractive: () => {
        // Constante `status` utilisée par la responsabilité de ce module.
        const status = store.getState().status;
        return status !== 'won' && status !== 'died';
      },
      // ----------------------------------------------------------------------------
      // Réagit à ouverte cellule.
      //
      // Paramètres :
      // - index : valeur fournie au traitement.
      //
      // Effets de bord :
      // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
      // ----------------------------------------------------------------------------
      onOpenCell: (index) => {
        store.open(index);
      },
      // ----------------------------------------------------------------------------
      // Réagit à chord cellule.
      //
      // Paramètres :
      // - index : valeur fournie au traitement.
      //
      // Effets de bord :
      // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
      // ----------------------------------------------------------------------------
      onChordCell: (index) => {
        store.openNeighbours(index);
      },
      // ----------------------------------------------------------------------------
      // Réagit à drapeau cellule.
      //
      // Paramètres :
      // - index : valeur fournie au traitement.
      //
      // Effets de bord :
      // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
      // ----------------------------------------------------------------------------
      onFlagCell: (index) => {
        store.toggleFlag(index);
      },
      // ----------------------------------------------------------------------------
      // Réagit à preview single.
      //
      // Paramètres :
      // - index : valeur fournie au traitement.
      //
      // Effets de bord :
      // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
      // ----------------------------------------------------------------------------
      onPreviewSingle: (index) => {
        store.dispatch({ type: 'OPENING_CEIL', payload: { index } });
      },
      // ----------------------------------------------------------------------------
      // Réagit à preview multi.
      //
      // Paramètres :
      // - index : valeur fournie au traitement.
      //
      // Effets de bord :
      // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
      // ----------------------------------------------------------------------------
      onPreviewMulti: (index) => {
        store.dispatch({ type: 'OPENING_CEILS', payload: { index } });
      },
      // ----------------------------------------------------------------------------
      // Réagit à preview clear.
      //
      // Effets de bord :
      // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
      // ----------------------------------------------------------------------------
      onPreviewClear: () => {
        store.dispatch({ type: 'OPENING_CEIL', payload: { index: -1 } });
      },
      // ----------------------------------------------------------------------------
      // Réagit à reset.
      //
      // Effets de bord :
      // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
      // ----------------------------------------------------------------------------
      onReset: () => {
        // Constante `current` utilisée par la responsabilité de ce module.
        const current = store.getState();
        store.reset(
          isFillToWindow
            ? {
                rows: current.rows,
                columns: current.columns,
                mines: current.mines,
              }
            : { difficulty: current.difficulty },
        );
      },
      onFacePress,
    },
  );

  // Constante `resizeObserver` utilisée par la responsabilité de ce module.
  const resizeObserver = new ResizeObserver(
    // ----------------------------------------------------------------------------
    // Exécute le traitement callback.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    () => {
      render();
    },
  );
  resizeObserver.observe(canvas);

  // ----------------------------------------------------------------------------
  // Traite fenêtre resize.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const handleWindowResize = (): void => {
    if (isFillToWindow) {
      applyFillToWindow();
    }
    render();
  };

  window.addEventListener('resize', handleWindowResize);

  render();

  return {
    // ----------------------------------------------------------------------------
    // Démarre le traitement demandé.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    start: () => {
      render();
    },
    // ----------------------------------------------------------------------------
    // Définit difficulté.
    //
    // Paramètres :
    // - difficulty : valeur fournie au traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    setDifficulty: (difficulty) => {
      isFillToWindow = false;
      fillConfig = null;
      fillDensity = null;
      store.setDifficulty(difficulty);
      store.reset({ difficulty });
      timerSeconds = 0;
      stopTimer();
      previousStatus = store.getState().status;
      render();
    },
    // ----------------------------------------------------------------------------
    // Définit remplissage to fenêtre.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    setFillToWindow: () => {
      if (!isFillToWindow || fillDensity === null) {
        fillDensity = getCellDensity(store.getState());
      }
      isFillToWindow = true;
      applyFillToWindow(true);
      timerSeconds = 0;
      previousStatus = store.getState().status;
      render();
    },
    // ----------------------------------------------------------------------------
    // Définit zoom.
    //
    // Paramètres :
    // - zoom : valeur fournie au traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    setZoom: (zoom) => {
      if (layoutScale === zoom) return;
      layoutScale = zoom;
      if (isFillToWindow) {
        applyFillToWindow(true);
        return;
      }
      render();
    },
    // ----------------------------------------------------------------------------
    // Libère le traitement demandé.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    dispose: () => {
      unsubscribe();
      unregisterImagesLoaded();
      resizeObserver.disconnect();
      input.dispose();
      disposeRenderer(canvas);
      window.removeEventListener('resize', handleWindowResize);
      stopTimer();
    },
  };
}
