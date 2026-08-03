import { Cell, GameState } from '../types';
import { getAdjacentIndexes } from './opening';

export function getRemainingSafeCeils(state: GameState): Cell[] {
  return state.ceils.filter(ceil => ceil.state !== 'open' && ceil.minesAround >= 0);
}

export function isWon(state: GameState): boolean {
  return getRemainingSafeCeils(state).length === 0;
}

export function isFlagCompleteForCell(state: GameState, index: number): boolean {
  const ceil = state.ceils[index];
  if (!ceil || ceil.minesAround <= 0) return false;

  const neighbors = getAdjacentIndexes(state, index);
  const flags = neighbors.filter((neighborIndex) => state.ceils[neighborIndex]?.state === 'flag');

  return flags.length === ceil.minesAround;
}

export function findUnflaggedMineNeighbor(state: GameState, index: number): number | undefined {
  const neighbors = getAdjacentIndexes(state, index);
  return neighbors.find(
    neighbor => state.ceils[neighbor]?.minesAround < 0 && state.ceils[neighbor]?.state !== 'flag',
  );
}
