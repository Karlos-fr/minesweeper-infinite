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
      onCustomDifficulty: () => {
        alert(
          'Custom mode is not implemented in this build.\n\n'
            + 'Use Beginner / Intermediate / Expert to set a preset grid.',
        );
      },
      onToggleMarks: () => {
        return;
      },
      onToggleColor: () => {
        return;
      },
      onToggleSound: () => {
        return;
      },
      onBestTimes: () => {
        alert('Best times feature is not implemented yet.');
      },
      onOpenContentsHelp: () => {
        window.open('https://support.microsoft.com/search/?query=minesweeper', '_blank');
      },
      onSearchHelp: () => {
        window.open('https://www.bing.com/search?q=Windows+Minesweeper+help', '_blank');
      },
      onUsingHelp: () => {
        window.open('https://www.google.com/search?q=minesweeper+help', '_blank');
      },
      onAbout: () => {
        alert('Minesweeper Infinite\nClone XP-like en TypeScript + Canvas.');
      },
      onGithub: () => {
        window.open('https://github.com/ShizukuIchi/minesweeper', '_blank');
      },
      onExit: () => {
        if (window.confirm('Fermer le jeu ?')) {
          window.close();
        }
      },
    },
    {
      initialDifficulty: difficulty,
      initialMarksEnabled: true,
      initialColorEnabled: false,
      initialSoundEnabled: true,
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
