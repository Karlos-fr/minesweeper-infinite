// ============================================================================
// Minesweeper Infinite - Validation de la partie
// ----------------------------------------------------------------------------
// Ce fichier évalue la victoire, les drapeaux et les mines voisines. Il ne
// modifie jamais l'état reçu.
// ============================================================================
import { Cell, GameState } from '../types';
import { getAdjacentIndexes } from './opening';

// ----------------------------------------------------------------------------
// Retourne restantes sûres cellules.
//
// Paramètres :
// - state : valeur fournie au traitement.
//
// Retour :
// - valeur de type `Cell[]` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
export function getRemainingSafeCeils(state: GameState): Cell[] {
  return state.ceils.filter(
    // ----------------------------------------------------------------------------
    // Exécute le callback associé à filter.
    //
    // Paramètres :
    // - ceil : valeur fournie au traitement.
    //
    // Retour :
    // - valeur de type `boolean` produite par le traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    (ceil) => ceil.state !== 'open' && ceil.minesAround >= 0,
  );
}

// ----------------------------------------------------------------------------
// Indique si won.
//
// Paramètres :
// - state : valeur fournie au traitement.
//
// Retour :
// - valeur de type `boolean` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
export function isWon(state: GameState): boolean {
  return getRemainingSafeCeils(state).length === 0;
}

// ----------------------------------------------------------------------------
// Indique si drapeau complete for cellule.
//
// Paramètres :
// - state : valeur fournie au traitement.
// - index : valeur fournie au traitement.
//
// Retour :
// - valeur de type `boolean` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
export function isFlagCompleteForCell(state: GameState, index: number): boolean {
  // Constante `ceil` utilisée par la responsabilité de ce module.
  const ceil = state.ceils[index];
  if (!ceil || ceil.minesAround <= 0) return false;

  // Constante `neighbors` utilisée par la responsabilité de ce module.
  const neighbors = getAdjacentIndexes(state, index);
  // Constante `flags` utilisée par la responsabilité de ce module.
  const flags = neighbors.filter(
    // ----------------------------------------------------------------------------
    // Exécute le callback associé à filter.
    //
    // Paramètres :
    // - neighborIndex : valeur fournie au traitement.
    //
    // Retour :
    // - valeur de type `boolean` produite par le traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    (neighborIndex) => state.ceils[neighborIndex]?.state === 'flag',
  );

  return flags.length === ceil.minesAround;
}

// ----------------------------------------------------------------------------
// Recherche unflagged mine voisin.
//
// Paramètres :
// - state : valeur fournie au traitement.
// - index : valeur fournie au traitement.
//
// Retour :
// - valeur de type `number | undefined` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
export function findUnflaggedMineNeighbor(state: GameState, index: number): number | undefined {
  // Constante `neighbors` utilisée par la responsabilité de ce module.
  const neighbors = getAdjacentIndexes(state, index);
  return neighbors.find(
    // ----------------------------------------------------------------------------
    // Recherche callback.
    //
    // Paramètres :
    // - neighbor : valeur fournie au traitement.
    //
    // Retour :
    // - valeur de type `boolean` produite par le traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    (neighbor) => state.ceils[neighbor]?.minesAround < 0 && state.ceils[neighbor]?.state !== 'flag',
  );
}
