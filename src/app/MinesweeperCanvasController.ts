import type { Difficulty } from '../core/types';
import { computeAdaptiveBoardLayout } from './fullscreenLayout';
import { type BoardLayout } from '../canvas/layout';
import { onImagesLoaded, renderFrame } from '../canvas/renderer';
import { bindCanvasInput } from '../canvas/input';
import { createGameStateStore } from '../core/engine/useGameState';
import type { CanvasHost } from './bootstrap';

export interface MinesweeperCanvasController {
  start: () => void;
  dispose: () => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setFillToWindow: () => void;
}

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

  let layout: BoardLayout = computeAdaptiveBoardLayout(
    { width: host.canvas.clientWidth, height: host.canvas.clientHeight },
    store.getState().rows,
    store.getState().columns,
    layoutOptions.uiChromePx,
    layoutOptions,
  );

  let facePressed = false;
  let timerSeconds = 0;
  let timerInterval: number | undefined;
  let previousStatus = store.getState().status;
  let unregisterImagesLoaded: () => void = () => {};
  let isFillToWindow = false;
  let fillConfig: FillToWindowConfig | null = null;

  const MENU_BAR_HEIGHT = 20;
  const SCORE_BAR_HEIGHT = 34;

  const getSafeViewport = (): { width: number; height: number } => ({
    width: Math.max(1, canvas.clientWidth),
    height: Math.max(1, canvas.clientHeight),
  });

  const getCellDensity = (state: ReturnType<typeof store.getState>): number => {
    const total = Math.max(1, state.rows * state.columns);
    const density = state.mines / total;
    return density > 0 && density < 1 ? density : 0.156;
  };

  const computeFillConfig = (): FillToWindowConfig => {
    const state = store.getState();
    const density = getCellDensity(state);
    const viewport = getSafeViewport();
    const safeWidth = Math.max(1, Math.round(viewport.width - layoutOptions.padding * 2));
    const safeHeight = Math.max(1, Math.round(viewport.height - layoutOptions.padding * 2));
    const reservedTop = Math.max(0, Math.round(layoutOptions.uiChromePx));
    const availableHeight = Math.max(1, safeHeight - reservedTop);
    const boardHeight = Math.max(1, availableHeight - (MENU_BAR_HEIGHT + SCORE_BAR_HEIGHT));

    const minCellSize = Math.max(4, Math.round(layoutOptions.minCellSize));
    const maxCellSize = Math.max(minCellSize, Math.round(layoutOptions.maxCellSize));

    let bestRows = Math.max(1, Math.floor(boardHeight / maxCellSize));
    let bestColumns = Math.max(1, Math.floor(safeWidth / maxCellSize));
    let bestCellSize = maxCellSize;
    let bestArea = bestRows * bestColumns;

    for (let cellSize = maxCellSize - 1; cellSize >= minCellSize; cellSize -= 1) {
      const rows = Math.max(1, Math.floor(boardHeight / cellSize));
      const columns = Math.max(1, Math.floor(safeWidth / cellSize));
      const area = rows * columns;

      if (area > bestArea) {
        bestArea = area;
        bestRows = rows;
        bestColumns = columns;
        bestCellSize = cellSize;
      }

      if (area === bestArea && cellSize > bestCellSize) {
        bestRows = rows;
        bestColumns = columns;
        bestCellSize = cellSize;
      }
    }

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
    layout = computeAdaptiveBoardLayout(
      {
        width: canvas.clientWidth,
        height: canvas.clientHeight,
      },
      state.rows,
      state.columns,
      layoutOptions.uiChromePx,
      layoutOptions,
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
      store.setDifficulty(difficulty);
      store.reset(difficulty);
      timerSeconds = 0;
      stopTimer();
      previousStatus = store.getState().status;
      render();
    },
    setFillToWindow: () => {
      isFillToWindow = true;
      applyFillToWindow(true);
      timerSeconds = 0;
      previousStatus = store.getState().status;
      render();
    },
    dispose: () => {
      unsubscribe();
      unregisterImagesLoaded();
      resizeObserver.disconnect();
      input.dispose();
      window.removeEventListener('resize', handleWindowResize);
      stopTimer();
    },
  };
}
