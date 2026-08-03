import { Cell } from '../types';
import { getNeighborIndexes } from './gridUtils';

export interface MineCounterInput {
  readonly rows: number;
  readonly columns: number;
  readonly ceils: readonly Cell[];
  readonly mineIndexes: readonly number[];
}

function incMineCount(cell: Cell): Cell {
  return {
    ...cell,
    minesAround: cell.minesAround + 1,
  };
}

export function countMinesAround(input: MineCounterInput): Cell[] {
  const next = input.ceils.map(cell => ({ ...cell }));

  input.mineIndexes.forEach(index => {
    const source = next[index];
    if (!source) {
      throw new Error('Invalid mine index while counting');
    }

    next[index] = {
      ...source,
      minesAround: -10,
    };

    getNeighborIndexes(index, input.rows, input.columns).forEach(nearIndex => {
      const cell = next[nearIndex];
      if (!cell) return;
      next[nearIndex] = incMineCount(cell);
    });
  });

  return next;
}
