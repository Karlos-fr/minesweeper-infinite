import { Cell } from '../types';
import { getNeighborIndexes, pickRandomIndexes } from './gridUtils';

interface PlaceMinesInput {
  readonly rows: number;
  readonly columns: number;
  readonly mines: number;
  readonly exclude: number;
  readonly ceils: readonly Cell[];
}

function isMine(cell: Cell): boolean {
  return cell.minesAround < 0;
}

function placeMineAt(index: number, state: readonly Cell[], rows: number, columns: number): Cell[] {
  const next = [...state];
  const source = state[index];
  if (!source) {
    throw new Error('Invalid mine index');
  }

  next[index] = {
    ...source,
    minesAround: -10,
  };

  const neighboring = getNeighborIndexes(index, rows, columns);
  neighboring.forEach(neighbor => {
    const neighborCell = next[neighbor];
    if (!neighborCell) return;

    next[neighbor] = {
      ...neighborCell,
      minesAround: neighborCell.minesAround + 1,
    };
  });

  return next;
}

export function placeMines(input: PlaceMinesInput): Cell[] {
  const { rows, columns, mines, exclude, ceils } = input;
  const total = rows * columns;

  if (total !== ceils.length) {
    throw new Error('rows and columns do not match ceils length');
  }

  if (exclude < 0 || exclude >= total) {
    throw new Error('Invalid exclude index');
  }

  const candidateIndexes = Array.from({ length: total }, (_, i) => i).filter(
    value => value !== exclude,
  );

  const mineIndexes = pickRandomIndexes(candidateIndexes, mines);

  let next = ceils.map(cell => ({ ...cell }));
  mineIndexes.forEach(index => {
    next = placeMineAt(index, next, rows, columns);
  });

  if (mineIndexes.some(index => !isMine(next[index]))) {
    throw new Error('Internal mine assignment failed');
  }

  return next;
}
