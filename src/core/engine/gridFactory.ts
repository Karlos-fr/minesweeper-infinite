// ============================================================================
// Minesweeper Infinite - Fabrique de grilles
// ----------------------------------------------------------------------------
// Ce fichier crée les cellules et états initiaux. Le placement aléatoire des
// mines reste confié au module dédié.
// ============================================================================
import { Cell, Difficulty, DifficultyConfig, GameState } from '../types';
import { CONFIG } from '../config';

export interface GameInitConfig {
  readonly difficulty: Difficulty;
}

// ----------------------------------------------------------------------------
// Crée empty cellule.
//
// Retour :
// - valeur de type `Cell` produite par le traitement.
//
// Effets de bord :
// - aucun.
// ----------------------------------------------------------------------------
function createEmptyCeil(): Cell {
  return {
    state: 'cover',
    minesAround: 0,
    opening: false,
  };
}

// ----------------------------------------------------------------------------
// Crée empty grille.
//
// Paramètres :
// - rows : valeur fournie au traitement.
// - columns : valeur fournie au traitement.
//
// Retour :
// - valeur de type `Cell[]` produite par le traitement.
//
// Effets de bord :
// - aucun.
// ----------------------------------------------------------------------------
export function createEmptyGrid(rows: number, columns: number): Cell[] {
  return Array(rows * columns)
    .fill(null)
    .map(
      // ----------------------------------------------------------------------------
      // Exécute le callback associé à map.
      //
      // Retour :
      // - valeur de type `Cell` produite par le traitement.
      //
      // Effets de bord :
      // - aucun.
      // ----------------------------------------------------------------------------
      () => createEmptyCeil(),
    );
}

// ----------------------------------------------------------------------------
// Retourne difficulté configuration.
//
// Paramètres :
// - difficulty : valeur fournie au traitement.
//
// Retour :
// - valeur de type `DifficultyConfig` produite par le traitement.
//
// Effets de bord :
// - aucun.
// ----------------------------------------------------------------------------
export function getDifficultyConfig(difficulty: Difficulty): DifficultyConfig {
  return CONFIG[difficulty];
}

// ----------------------------------------------------------------------------
// Crée initial jeu état.
//
// Paramètres :
// - difficulty : valeur fournie au traitement.
//
// Retour :
// - valeur de type `GameState` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
export function createInitialGameState(difficulty: Difficulty): GameState {
  // Constante `config` utilisée par la responsabilité de ce module.
  const config = getDifficultyConfig(difficulty);

  return {
    difficulty,
    status: 'new',
    rows: config.rows,
    columns: config.columns,
    mines: config.mines,
    ceils: createEmptyGrid(config.rows, config.columns),
  };
}
