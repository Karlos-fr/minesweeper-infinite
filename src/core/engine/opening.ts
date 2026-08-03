import { GameState } from '../types';
import { getNeighborIndexes } from './gridUtils';

export function getAutoOpenIndexes(state: GameState, index: number): number[] {
  if (index < 0 || index >= state.ceils.length) return [];

  const { rows, columns, ceils } = state;
  const queue = [index];
  const visited = new Set<number>();
  const result: number[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;

    const ceil = ceils[current];
    if (!ceil || visited.has(current) || ceil.state === 'flag') continue;
    if (ceil.minesAround < 0) continue;

    visited.add(current);
    result.push(current);

    if (ceil.minesAround === 0) {
      getNeighborIndexes(current, rows, columns).forEach(nearIndex => {
        if (!visited.has(nearIndex) && !queue.includes(nearIndex)) {
          queue.push(nearIndex);
        }
      });
    }
  }

  return result;
}

export function getAdjacentIndexes(state: GameState, index: number): number[] {
  return getNeighborIndexes(index, state.rows, state.columns);
}
