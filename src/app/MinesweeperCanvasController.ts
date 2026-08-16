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

export function createMinesweeperCanvasController(
  host: CanvasHost,
  options: MinesweeperCanvasControllerOptions = { difficulty: 'Beginner' },
): MinesweeperCanvasController {
  const store = createGameStateStore(options.difficulty);
  const { canvas, ctx } = host;
  const layoutOptions = {
    ...DEFAULT_LAYOUT_OPTIONS,
    ...options.layout,
  };
  const playSound = (src: string): void => {
    try {
      const audio = new Audio(src);
      audio.volume = 0.8;
      const pending = audio.play();
      if (typeof pending?.catch === 'function') {
        pending.catch(() => {
          // Browser audio policies can block autoplay before user interaction.
        });
      }
    } catch {
      // Ignore audio errors to avoid impacting gameplay.
    }
  };
  const playLoseSound = (): void => playSound(loseSound);
  const playTickSound = (): void => playSound(tickSound);
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

  const getLayoutScale = (): GridZoom => layoutScale;

  const getResolvedLayoutOptions = (): Required<CanvasControllerLayoutOptions> => ({
    uiChromePx: Math.round(layoutOptions.uiChromePx),
    minCellSize: layoutOptions.minCellSize,
    maxCellSize: layoutOptions.maxCellSize,
    padding: layoutOptions.padding,
    scale: getLayoutScale(),
  });

  const getSafeViewport = (): { width: number; height: number } => ({
    width: Math.max(1, canvas.clientWidth),
    height: Math.max(1, canvas.clientHeight),
  });

  const getCellDensity = (state: ReturnType<typeof store.getState>): number => {
    const total = Math.max(1, state.rows * state.columns);
    const density = state.mines / total;
    return density > 0 && density < 1 ? density : 0.156;
  };

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

  const computeFillConfig = (): FillToWindowConfig => {
    const state = store.getState();
    const density = fillDensity ?? getCellDensity(state);
    const viewport = getSafeViewport();
    const resolvedScale = getLayoutScale();
    const safeWidth = Math.max(1, Math.round(viewport.width - Math.round(layoutOptions.padding * resolvedScale) * 2));
    const safeHeight = Math.max(1, Math.round(viewport.height - Math.round(layoutOptions.padding * resolvedScale) * 2));
    const boardWidth = Math.max(1, safeWidth - Math.round(19 * resolvedScale));
    const boardHeight = Math.max(1, safeHeight - Math.round(78 * resolvedScale));

    const minCellSize = Math.max(4, Math.round(layoutOptions.minCellSize * resolvedScale));
    const maxCellSize = Math.max(minCellSize, Math.round(layoutOptions.maxCellSize * resolvedScale));

    const bestCellSize = maxCellSize;
    const bestRows = Math.max(1, Math.floor(boardHeight / bestCellSize));
    const bestColumns = Math.max(1, Math.floor(boardWidth / bestCellSize));

    const total = bestRows * bestColumns;
    const rawMines = Math.round(total * density);
    const maxMines = Math.max(0, total - 1);
    const mines = total <= 1 ? 0 : Math.max(1, Math.min(rawMines, maxMines));

    return {
      rows: bestRows,
      columns: bestColumns,
      mines,
    };
  };

  const hasOpenedCell = (previous: ReturnType<typeof store.getState>, next: ReturnType<typeof store.getState>): boolean => {
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

  const applyFillToWindow = (force = false): void => {
    if (!isFillToWindow) return;
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

  const stopTimer = (): void => {
    if (timerInterval !== undefined) {
      window.clearInterval(timerInterval);
      timerInterval = undefined;
    }
  };

  const startTimer = (): void => {
    if (timerInterval !== undefined) return;
    timerInterval = window.setInterval(() => {
      timerSeconds += 1;
      render();
    }, 1000);
  };

  function render(): void {
    const state = store.getState();
    const resolvedScale = getLayoutScale();
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
    renderFrame(
      ctx,
      canvas.clientWidth,
      canvas.clientHeight,
      layout,
      state,
      {
        timerSeconds: Math.max(0, timerSeconds),
        facePressed,
      },
    );
  }

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

  const unsubscribe = store.subscribe(onStoreUpdate);
  unregisterImagesLoaded = onImagesLoaded(render);

  const onFacePress = (pressed: boolean): void => {
    facePressed = pressed;
    render();
  };

  const input = bindCanvasInput(
    canvas,
    () => layout,
    {
      isGridInteractive: () => {
        const status = store.getState().status;
        return status !== 'won' && status !== 'died';
      },
      onOpenCell: index => {
        store.open(index);
      },
      onChordCell: index => {
        store.openNeighbours(index);
      },
      onFlagCell: index => {
        store.toggleFlag(index);
      },
      onPreviewSingle: index => {
        store.dispatch({ type: 'OPENING_CEIL', payload: { index } });
      },
      onPreviewMulti: index => {
        store.dispatch({ type: 'OPENING_CEILS', payload: { index } });
      },
      onPreviewClear: () => {
        store.dispatch({ type: 'OPENING_CEIL', payload: { index: -1 } });
      },
      onReset: () => {
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

  const resizeObserver = new ResizeObserver(() => {
    render();
  });
  resizeObserver.observe(canvas);

  const handleWindowResize = (): void => {
    if (isFillToWindow) {
      applyFillToWindow();
    }
    render();
  };

  window.addEventListener('resize', handleWindowResize);

  render();

  return {
    start: () => {
      render();
    },
    setDifficulty: difficulty => {
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
    setZoom: zoom => {
      if (layoutScale === zoom) return;
      layoutScale = zoom;
      if (isFillToWindow) {
        applyFillToWindow(true);
        return;
      }
      render();
    },
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
