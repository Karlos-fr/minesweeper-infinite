// ============================================================================
// Minesweeper Infinite - Session de grille jouable
// ----------------------------------------------------------------------------
// Ce fichier assemble l'hôte, le contrôleur et le menu. Il ne contient pas les
// règles internes du moteur.
// ============================================================================
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

// ----------------------------------------------------------------------------
// Crée playable full screen grille.
//
// Paramètres :
// - root : valeur fournie au traitement.
// - difficulty : valeur fournie au traitement.
// - options : valeur fournie au traitement.
//
// Retour :
// - valeur de type `PlayableGridSession` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
export function createPlayableFullScreenGrid(
  root: HTMLElement,
  difficulty: Difficulty = 'Beginner',
  options: PlayableGridOptions = {},
): PlayableGridSession {
  // Constante `fullscreenHost` utilisée par la responsabilité de ce module.
  const fullscreenHost = createFullscreenHost(root);
  let activeDifficulty = difficulty;
  let activeMode: ActiveMode = 'difficulty';
  let activeZoom: GridZoom = options.scale ?? 1;
  let menu: ReturnType<typeof createMinesweeperMenu>;
  // Constante `controller` utilisée par la responsabilité de ce module.
  const controller = createMinesweeperCanvasController(fullscreenHost.host, {
    difficulty,
    layout: options,
    // ----------------------------------------------------------------------------
    // Réagit à disposition change.
    //
    // Paramètres :
    // - nextLayout : valeur fournie au traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    onLayoutChange: (nextLayout) => {
      menu?.setLayout(nextLayout);
    },
  });

  menu = createMinesweeperMenu(
    root,
    {
      // ----------------------------------------------------------------------------
      // Réagit à new jeu.
      //
      // Effets de bord :
      // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
      // ----------------------------------------------------------------------------
      onNewGame: () => {
        if (activeMode === 'fillToWindow') {
          controller.setFillToWindow();
        } else {
          controller.setDifficulty(activeDifficulty);
        }
      },
      // ----------------------------------------------------------------------------
      // Réagit à change difficulté.
      //
      // Paramètres :
      // - next : valeur fournie au traitement.
      //
      // Effets de bord :
      // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
      // ----------------------------------------------------------------------------
      onChangeDifficulty: (next) => {
        activeMode = 'difficulty';
        activeDifficulty = next;
        controller.setDifficulty(next);
        menu.setDifficulty(next);
      },
      // ----------------------------------------------------------------------------
      // Réagit à remplissage to fenêtre.
      //
      // Effets de bord :
      // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
      // ----------------------------------------------------------------------------
      onFillToWindow: () => {
        activeMode = 'fillToWindow';
        controller.setFillToWindow();
      },
      // ----------------------------------------------------------------------------
      // Réagit à change zoom.
      //
      // Paramètres :
      // - zoom : valeur fournie au traitement.
      //
      // Effets de bord :
      // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
      // ----------------------------------------------------------------------------
      onChangeZoom: (zoom) => {
        activeZoom = zoom;
        controller.setZoom(zoom);
      },
      // ----------------------------------------------------------------------------
      // Réagit à toggle marks.
      //
      // Effets de bord :
      // - aucun.
      // ----------------------------------------------------------------------------
      onToggleMarks: () => {
        return;
      },
      // ----------------------------------------------------------------------------
      // Réagit à toggle color.
      //
      // Effets de bord :
      // - aucun.
      // ----------------------------------------------------------------------------
      onToggleColor: () => {
        return;
      },
      // ----------------------------------------------------------------------------
      // Réagit à toggle son.
      //
      // Effets de bord :
      // - aucun.
      // ----------------------------------------------------------------------------
      onToggleSound: () => {
        return;
      },
      // ----------------------------------------------------------------------------
      // Réagit à best times.
      //
      // Effets de bord :
      // - aucun.
      // ----------------------------------------------------------------------------
      onBestTimes: () => {
        alert('Best times feature is not implemented yet.');
      },
      // ----------------------------------------------------------------------------
      // Réagit à ouverte contents help.
      //
      // Effets de bord :
      // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
      // ----------------------------------------------------------------------------
      onOpenContentsHelp: () => {
        window.open('https://support.microsoft.com/search/?query=minesweeper', '_blank');
      },
      // ----------------------------------------------------------------------------
      // Réagit à search help.
      //
      // Effets de bord :
      // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
      // ----------------------------------------------------------------------------
      onSearchHelp: () => {
        window.open('https://www.bing.com/search?q=Windows+Minesweeper+help', '_blank');
      },
      // ----------------------------------------------------------------------------
      // Réagit à using help.
      //
      // Effets de bord :
      // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
      // ----------------------------------------------------------------------------
      onUsingHelp: () => {
        window.open('https://www.google.com/search?q=minesweeper+help', '_blank');
      },
      // ----------------------------------------------------------------------------
      // Réagit à about.
      //
      // Effets de bord :
      // - aucun.
      // ----------------------------------------------------------------------------
      onAbout: () => {
        alert('Minesweeper Infinite\nClone XP-like en TypeScript + Canvas.');
      },
      // ----------------------------------------------------------------------------
      // Réagit à github.
      //
      // Effets de bord :
      // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
      // ----------------------------------------------------------------------------
      onGithub: () => {
        window.open('https://github.com/Karlos-fr/minesweeper-infinite', '_blank');
      },
      // ----------------------------------------------------------------------------
      // Réagit à exit.
      //
      // Effets de bord :
      // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
      // ----------------------------------------------------------------------------
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
    // ----------------------------------------------------------------------------
    // Définit difficulté.
    //
    // Paramètres :
    // - difficultyArg : valeur fournie au traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    setDifficulty: (difficultyArg) => {
      activeMode = 'difficulty';
      activeDifficulty = difficultyArg;
      controller.setDifficulty(difficultyArg);
      menu.setDifficulty(difficultyArg);
    },
    // ----------------------------------------------------------------------------
    // Définit remplissage to fenêtre.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    setFillToWindow: () => {
      activeMode = 'fillToWindow';
      controller.setFillToWindow();
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
      activeZoom = zoom;
      controller.setZoom(zoom);
      menu.setZoom(zoom);
    },
    // ----------------------------------------------------------------------------
    // Libère le traitement demandé.
    //
    // Effets de bord :
    // - aucun.
    // ----------------------------------------------------------------------------
    dispose: () => {
      controller.dispose();
      menu.dispose();
      fullscreenHost.dispose();
    },
  };
}
