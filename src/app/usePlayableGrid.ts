import { createFullscreenHost } from './fullscreenHost';
import type { MinesweeperCanvasController } from './MinesweeperCanvasController';
import {
  createMinesweeperCanvasController,
  type CanvasControllerLayoutOptions,
} from './MinesweeperCanvasController';
import type { Difficulty } from '../core/types';
import type { CanvasHost } from './bootstrap';

export interface PlayableGridOptions extends CanvasControllerLayoutOptions {}

export interface PlayableGridSession extends MinesweeperCanvasController {
  readonly host: CanvasHost;
}

export function createPlayableFullScreenGrid(
  root: HTMLElement,
  difficulty: Difficulty = 'Beginner',
  options: PlayableGridOptions = {},
): PlayableGridSession {
  const fullscreenHost = createFullscreenHost(root);
  const controller = createMinesweeperCanvasController(
    fullscreenHost.host,
    {
      difficulty,
      layout: options,
    },
  );

  return {
    host: fullscreenHost.host,
    start: controller.start,
    setDifficulty: difficultyArg => {
      controller.setDifficulty(difficultyArg);
    },
    dispose: () => {
      controller.dispose();
      fullscreenHost.dispose();
    },
  };
}
