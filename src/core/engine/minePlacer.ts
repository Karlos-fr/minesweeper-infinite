// ============================================================================
// Minesweeper Infinite - Placement des mines
// ----------------------------------------------------------------------------
// Ce fichier distribue les mines après le premier clic et met à jour les
// compteurs voisins. Il ne gère pas l'ouverture.
// ============================================================================
import { Cell } from '../types';
import { getNeighborIndexes, pickRandomIndexes } from './gridUtils';

interface PlaceMinesInput {
  readonly rows: number;
  readonly columns: number;
  readonly mines: number;
  readonly exclude: number;
  readonly ceils: readonly Cell[];
}

// ----------------------------------------------------------------------------
// Indique si mine.
//
// Paramètres :
// - cell : valeur fournie au traitement.
//
// Retour :
// - valeur de type `boolean` produite par le traitement.
//
// Effets de bord :
// - aucun.
// ----------------------------------------------------------------------------
function isMine(cell: Cell): boolean {
  return cell.minesAround < 0;
}

// ----------------------------------------------------------------------------
// Place mine at.
//
// Paramètres :
// - index : valeur fournie au traitement.
// - state : valeur fournie au traitement.
// - rows : valeur fournie au traitement.
// - columns : valeur fournie au traitement.
//
// Retour :
// - valeur de type `Cell[]` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
function placeMineAt(index: number, state: readonly Cell[], rows: number, columns: number): Cell[] {
  // Constante `next` utilisée par la responsabilité de ce module.
  const next = [...state];
  // Constante `source` utilisée par la responsabilité de ce module.
  const source = state[index];
  if (!source) {
    throw new Error('Invalid mine index');
  }

  next[index] = {
    ...source,
    minesAround: -10,
  };

  // Constante `neighboring` utilisée par la responsabilité de ce module.
  const neighboring = getNeighborIndexes(index, rows, columns);
  neighboring.forEach(
    // ----------------------------------------------------------------------------
    // Exécute le callback associé à for each.
    //
    // Paramètres :
    // - neighbor : valeur fournie au traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    (neighbor) => {
      // Constante `neighborCell` utilisée par la responsabilité de ce module.
      const neighborCell = next[neighbor];
      if (!neighborCell) return;

      next[neighbor] = {
        ...neighborCell,
        minesAround: neighborCell.minesAround + 1,
      };
    },
  );

  return next;
}

// ----------------------------------------------------------------------------
// Place mines.
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
export function placeMines(input: PlaceMinesInput): Cell[] {
  // Constante `{ rows, columns, mines, exclude, ceils }` utilisée par la responsabilité de ce module.
  const { rows, columns, mines, exclude, ceils } = input;
  // Constante `total` utilisée par la responsabilité de ce module.
  const total = rows * columns;

  if (total !== ceils.length) {
    throw new Error('rows and columns do not match ceils length');
  }

  if (exclude < 0 || exclude >= total) {
    throw new Error('Invalid exclude index');
  }

  // Constante `candidateIndexes` utilisée par la responsabilité de ce module.
  const candidateIndexes = Array.from(
    { length: total },
    // ----------------------------------------------------------------------------
    // Exécute le callback associé à from.
    //
    // Paramètres :
    // - _ : valeur fournie au traitement.
    // - i : valeur fournie au traitement.
    //
    // Retour :
    // - valeur de type `number` produite par le traitement.
    //
    // Effets de bord :
    // - aucun.
    // ----------------------------------------------------------------------------
    (_, i) => i,
  ).filter(
    // ----------------------------------------------------------------------------
    // Exécute le callback associé à filter.
    //
    // Paramètres :
    // - value : valeur fournie au traitement.
    //
    // Retour :
    // - valeur de type `boolean` produite par le traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    (value) => value !== exclude,
  );

  // Constante `mineIndexes` utilisée par la responsabilité de ce module.
  const mineIndexes = pickRandomIndexes(candidateIndexes, mines);

  let next = ceils.map(
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
  mineIndexes.forEach(
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
      next = placeMineAt(index, next, rows, columns);
    },
  );

  if (
    mineIndexes.some(
      // ----------------------------------------------------------------------------
      // Exécute le callback associé à some.
      //
      // Paramètres :
      // - index : valeur fournie au traitement.
      //
      // Retour :
      // - valeur de type `boolean` produite par le traitement.
      //
      // Effets de bord :
      // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
      // ----------------------------------------------------------------------------
      (index) => !isMine(next[index]),
    )
  ) {
    throw new Error('Internal mine assignment failed');
  }

  return next;
}
