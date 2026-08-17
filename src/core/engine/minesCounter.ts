// ============================================================================
// Minesweeper Infinite - Comptage des mines voisines
// ----------------------------------------------------------------------------
// Ce fichier calcule les valeurs numériques autour des mines. Il ne choisit
// pas leurs positions.
// ============================================================================
import { Cell } from '../types';
import { getNeighborIndexes } from './gridUtils';

export interface MineCounterInput {
  readonly rows: number;
  readonly columns: number;
  readonly ceils: readonly Cell[];
  readonly mineIndexes: readonly number[];
}

// ----------------------------------------------------------------------------
// Incrémente mine count.
//
// Paramètres :
// - cell : valeur fournie au traitement.
//
// Retour :
// - valeur de type `Cell` produite par le traitement.
//
// Effets de bord :
// - aucun.
// ----------------------------------------------------------------------------
function incMineCount(cell: Cell): Cell {
  return {
    ...cell,
    minesAround: cell.minesAround + 1,
  };
}

// ----------------------------------------------------------------------------
// Compte mines around.
//
// Paramètres :
// - input : valeur fournie au traitement.
//
// Retour :
// - valeur de type `Cell[]` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
export function countMinesAround(input: MineCounterInput): Cell[] {
  // Constante `next` utilisée par la responsabilité de ce module.
  const next = input.ceils.map(
    // ----------------------------------------------------------------------------
    // Exécute le callback associé à map.
    //
    // Paramètres :
    // - cell : valeur fournie au traitement.
    //
    // Retour :
    // - valeur de type `{ state: CellState; minesAround: number; opening: boolean; }` produite par le traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    (cell) => ({ ...cell }),
  );

  input.mineIndexes.forEach(
    // ----------------------------------------------------------------------------
    // Exécute le callback associé à for each.
    //
    // Paramètres :
    // - index : valeur fournie au traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    (index) => {
      // Constante `source` utilisée par la responsabilité de ce module.
      const source = next[index];
      if (!source) {
        throw new Error('Invalid mine index while counting');
      }

      next[index] = {
        ...source,
        minesAround: -10,
      };

      getNeighborIndexes(index, input.rows, input.columns).forEach(
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
          // Constante `cell` utilisée par la responsabilité de ce module.
          const cell = next[nearIndex];
          if (!cell) return;
          next[nearIndex] = incMineCount(cell);
        },
      );
    },
  );

  return next;
}
