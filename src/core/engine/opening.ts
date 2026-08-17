// ============================================================================
// Minesweeper Infinite - Ouverture des cellules
// ----------------------------------------------------------------------------
// Ce fichier détermine les cellules à ouvrir récursivement. Il ne réalise pas
// lui-même les transitions du store.
// ============================================================================
import { GameState } from '../types';
import { getNeighborIndexes } from './gridUtils';

// ----------------------------------------------------------------------------
// Retourne automatique ouverte index.
//
// Paramètres :
// - state : valeur fournie au traitement.
// - index : valeur fournie au traitement.
//
// Retour :
// - valeur de type `number[]` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
export function getAutoOpenIndexes(state: GameState, index: number): number[] {
  if (index < 0 || index >= state.ceils.length) return [];

  // Constante `{ rows, columns, ceils }` utilisée par la responsabilité de ce module.
  const { rows, columns, ceils } = state;
  // Constante `queue` utilisée par la responsabilité de ce module.
  const queue = [index];
  // Constante `visited` utilisée par la responsabilité de ce module.
  const visited = new Set<number>();
  // Constante `result` utilisée par la responsabilité de ce module.
  const result: number[] = [];

  while (queue.length > 0) {
    // Constante `current` utilisée par la responsabilité de ce module.
    const current = queue.shift();
    if (current === undefined) break;

    // Constante `ceil` utilisée par la responsabilité de ce module.
    const ceil = ceils[current];
    if (!ceil || visited.has(current) || ceil.state === 'flag') continue;
    if (ceil.minesAround < 0) continue;

    visited.add(current);
    result.push(current);

    if (ceil.minesAround === 0) {
      getNeighborIndexes(current, rows, columns).forEach(
        // ----------------------------------------------------------------------------
        // Exécute le callback associé à for each.
        //
        // Paramètres :
        // - nearIndex : valeur fournie au traitement.
        //
        // Effets de bord :
        // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
        // ----------------------------------------------------------------------------
        (nearIndex) => {
          if (!visited.has(nearIndex) && !queue.includes(nearIndex)) {
            queue.push(nearIndex);
          }
        },
      );
    }
  }

  return result;
}

// ----------------------------------------------------------------------------
// Retourne adjacent index.
//
// Paramètres :
// - state : valeur fournie au traitement.
// - index : valeur fournie au traitement.
//
// Retour :
// - valeur de type `number[]` produite par le traitement.
//
// Effets de bord :
// - aucun.
// ----------------------------------------------------------------------------
export function getAdjacentIndexes(state: GameState, index: number): number[] {
  return getNeighborIndexes(index, state.rows, state.columns);
}
