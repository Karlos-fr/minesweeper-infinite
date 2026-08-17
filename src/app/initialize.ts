// ============================================================================
// Minesweeper Infinite - Initialisation de l'application
// ----------------------------------------------------------------------------
// Ce fichier choisit la racine et crée la session jouable. Le cycle de vie
// détaillé reste dans les modules spécialisés.
// ============================================================================
import type { Difficulty } from '../core/types';
import { createPlayableFullScreenGrid, type PlayableGridOptions, type PlayableGridSession } from './usePlayableGrid';

export interface MinesweeperInitializeOptions {
  readonly root?: HTMLElement;
  readonly difficulty?: Difficulty;
  readonly layout?: PlayableGridOptions;
}

export interface MinesweeperAppSession extends PlayableGridSession {
  readonly root: HTMLElement;
}

// ----------------------------------------------------------------------------
// Initialise minesweeper app.
//
// Paramètres :
// - options : valeur fournie au traitement.
//
// Retour :
// - valeur de type `MinesweeperAppSession` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
export function initializeMinesweeperApp(options: MinesweeperInitializeOptions = {}): MinesweeperAppSession {
  // Constante `root` utilisée par la responsabilité de ce module.
  const root = options.root ?? document.getElementById('root') ?? document.body;

  // Constante `game` utilisée par la responsabilité de ce module.
  const game = createPlayableFullScreenGrid(root, options.difficulty ?? 'Beginner', options.layout);

  return {
    ...game,
    root,
  };
}
