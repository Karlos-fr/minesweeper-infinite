import { Difficulty, GameAction, GameState } from '../types';
import { createInitialGameState } from './gridFactory';
import { findUnflaggedMineNeighbor, isFlagCompleteForCell, isWon } from './validator';
import { gameReducer } from './gameReducer';
import { getNeighborIndexes } from './gridUtils';

export type GameStateListener = (state: GameState) => void;

export interface GameStateStore {
  getState: () => GameState;
  dispatch: (action: GameAction) => void;
  start: (index: number) => void;
  open: (index: number) => void;
  openNeighbours: (index: number) => void;
  toggleFlag: (index: number) => void;
  reset: (difficulty: Difficulty) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  subscribe: (listener: GameStateListener) => () => void;
}

function resolveWinAfterAction(nextState: GameState): GameState {
  if (nextState.status === 'started' && isWon(nextState)) {
    return gameReducer(nextState, { type: 'WON' });
  }
  return nextState;
}

export function createGameStateStore(difficulty: Difficulty = 'Beginner'): GameStateStore {
  let state = createInitialGameState(difficulty);
  const listeners = new Set<GameStateListener>();

  function emit(): void {
    listeners.forEach(listener => listener(state));
  }

  function apply(action: GameAction): void {
    const nextState = resolveWinAfterAction(gameReducer(state, action));
    if (nextState !== state) {
      state = nextState;
      emit();
    }
  }

  function open(index: number): void {
    if (index < 0 || index >= state.ceils.length) return;
    if (['won', 'died'].includes(state.status)) return;

    if (state.status === 'new') {
      apply({ type: 'START_GAME', payload: { index } });
      apply({ type: 'OPEN_CEIL', payload: { index } });
      return;
    }

    if (state.status !== 'started') return;

    const ceil = state.ceils[index];
    if (!ceil) return;
    if (['flag', 'open'].includes(ceil.state)) return;

    if (ceil.minesAround < 0) {
      apply({ type: 'GAME_OVER', payload: { index } });
      return;
    }

    apply({ type: 'OPEN_CEIL', payload: { index } });
  }

  function openNeighbours(index: number): void {
    const ceil = state.ceils[index];
    if (!ceil) return;
    if (ceil.state !== 'open' || ceil.minesAround <= 0 || state.status !== 'started') return;

    if (!isFlagCompleteForCell(state, index)) return;

    const mineIndex = findUnflaggedMineNeighbor(state, index);
    if (typeof mineIndex === 'number') {
      apply({ type: 'GAME_OVER', payload: { index: mineIndex } });
      return;
    }

    getNeighborIndexes(index, state.rows, state.columns).forEach(neighbor => {
      if (state.ceils[neighbor]) {
        apply({ type: 'OPEN_CEIL', payload: { index: neighbor } });
      }
    });
  }

  function toggleFlag(index: number): void {
    if (['won', 'died'].includes(state.status)) return;
    if (index < 0 || index >= state.ceils.length) return;

    const ceil = state.ceils[index];
    if (!ceil || ceil.state === 'open') return;
    apply({ type: 'CHANGE_CEIL_STATE', payload: { index } });
  }

  return {
    getState: () => state,
    dispatch: apply,
    start: (index: number) => open(index),
    open,
    openNeighbours,
    toggleFlag,
    reset: (nextDifficulty: Difficulty) => {
      apply({ type: 'CLEAR_MAP', payload: { difficulty: nextDifficulty } });
    },
    setDifficulty: (nextDifficulty: Difficulty) => {
      apply({ type: 'SET_DIFFICULTY', payload: { difficulty: nextDifficulty } });
    },
    subscribe: (listener: GameStateListener) => {
      listeners.add(listener);
      listener(state);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
