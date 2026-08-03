import { createFullscreenHost } from './fullscreenHost';
import type { MinesweeperCanvasController } from './MinesweeperCanvasController';
import {
  createMinesweeperCanvasController,
  type CanvasControllerLayoutOptions,
} from './MinesweeperCanvasController';
import { createMinesweeperMenu } from './menu';
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
  let activeDifficulty = difficulty;
  const controller = createMinesweeperCanvasController(
    fullscreenHost.host,
    {
      difficulty,
      layout: options,
    },
  );

  const menu = createMinesweeperMenu(
    root,
    {
      onNewGame: () => {
        controller.setDifficulty(activeDifficulty);
      },
      onChangeDifficulty: next => {
        activeDifficulty = next;
        controller.setDifficulty(next);
        menu.setDifficulty(next);
      },
    },
    {
      initialDifficulty: difficulty,
    },
  );

  return {
    host: fullscreenHost.host,
    start: controller.start,
    setDifficulty: difficultyArg => {
      activeDifficulty = difficultyArg;
      controller.setDifficulty(difficultyArg);
      menu.setDifficulty(difficultyArg);
    },
    dispose: () => {
      controller.dispose();
      menu.dispose();
      fullscreenHost.dispose();
    },
  };
}
