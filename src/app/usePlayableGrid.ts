import { createFullscreenHost } from './fullscreenHost';
import type { MinesweeperCanvasController } from './MinesweeperCanvasController';
import {
  createMinesweeperCanvasController,
  type CanvasControllerLayoutOptions,
  type GridZoom,
} from './MinesweeperCanvasController';
import { createMinesweeperMenu } from './menu';
import type { Difficulty } from '../core/types';
import type { CanvasHost } from './bootstrap';

export interface PlayableGridOptions extends CanvasControllerLayoutOptions {}

export interface PlayableGridSession extends MinesweeperCanvasController {
  readonly host: CanvasHost;
}

type ActiveMode = 'difficulty' | 'fillToWindow';

export function createPlayableFullScreenGrid(
  root: HTMLElement,
  difficulty: Difficulty = 'Beginner',
  options: PlayableGridOptions = {},
): PlayableGridSession {
  const fullscreenHost = createFullscreenHost(root);
  let activeDifficulty = difficulty;
  let activeMode: ActiveMode = 'difficulty';
  let activeZoom: GridZoom = options.scale ?? 1;
  let menu: ReturnType<typeof createMinesweeperMenu>;
  const controller = createMinesweeperCanvasController(
    fullscreenHost.host,
    {
      difficulty,
      layout: options,
      onLayoutChange: nextLayout => {
        menu?.setLayout(nextLayout);
      },
    },
  );

  menu = createMinesweeperMenu(
    root,
    {
      onNewGame: () => {
        if (activeMode === 'fillToWindow') {
          controller.setFillToWindow();
        } else {
          controller.setDifficulty(activeDifficulty);
        }
      },
      onChangeDifficulty: next => {
        activeMode = 'difficulty';
        activeDifficulty = next;
        controller.setDifficulty(next);
        menu.setDifficulty(next);
      },
      onFillToWindow: () => {
        activeMode = 'fillToWindow';
        controller.setFillToWindow();
      },
      onChangeZoom: zoom => {
        activeZoom = zoom;
        controller.setZoom(zoom);
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
        window.open('https://github.com/Karlos-fr/minesweeper-infinite', '_blank');
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
      initialColorEnabled: true,
      initialSoundEnabled: false,
      initialZoom: activeZoom,
    },
  );

  controller.start();

  return {
    host: fullscreenHost.host,
    start: controller.start,
    setDifficulty: difficultyArg => {
      activeMode = 'difficulty';
      activeDifficulty = difficultyArg;
      controller.setDifficulty(difficultyArg);
      menu.setDifficulty(difficultyArg);
    },
    setFillToWindow: () => {
      activeMode = 'fillToWindow';
      controller.setFillToWindow();
    },
    setZoom: zoom => {
      activeZoom = zoom;
      controller.setZoom(zoom);
      menu.setZoom(zoom);
    },
    dispose: () => {
      controller.dispose();
      menu.dispose();
      fullscreenHost.dispose();
    },
  };
}
