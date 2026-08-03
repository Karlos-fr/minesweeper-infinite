import type { Difficulty } from '../core/types';
import { computeAdaptiveBoardLayout } from './fullscreenLayout';
import { type BoardLayout } from '../canvas/layout';
import { renderFrame } from '../canvas/renderer';
import { bindCanvasInput } from '../canvas/input';
import { createGameStateStore } from '../core/engine/useGameState';
import type { CanvasHost } from './bootstrap';

export interface MinesweeperCanvasController {
  start: () => void;
  dispose: () => void;
  setDifficulty: (difficulty: Difficulty) => void;
}

const DEFAULT_LAYOUT_OPTIONS = {
  uiChromePx: 120,
  minCellSize: 8,
  maxCellSize: 48,
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
        store.reset(current.difficulty);
      },
      onFacePress,
    },
  );

  const resizeObserver = new ResizeObserver(() => {
    render();
  });
  resizeObserver.observe(canvas);

  const handleWindowResize = (): void => {
    render();
  };

  window.addEventListener('resize', handleWindowResize);

  render();

  return {
    start: () => {
      render();
    },
    setDifficulty: difficulty => {
      store.setDifficulty(difficulty);
      store.reset(difficulty);
      timerSeconds = 0;
      stopTimer();
      previousStatus = store.getState().status;
      render();
    },
    dispose: () => {
      unsubscribe();
      resizeObserver.disconnect();
      input.dispose();
      window.removeEventListener('resize', handleWindowResize);
      stopTimer();
    },
  };
}
