// ============================================================================
// Minesweeper Infinite - Store du jeu
// ----------------------------------------------------------------------------
// Ce fichier expose les opérations de partie autour du reducer. Il reste
// indépendant du DOM et du rendu.
// ============================================================================
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
  reset: (config?: {
    readonly difficulty?: Difficulty;
    readonly rows?: number;
    readonly columns?: number;
    readonly mines?: number;
  }) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  subscribe: (listener: GameStateListener) => () => void;
}

// ----------------------------------------------------------------------------
// Résout victoire after action.
//
// Paramètres :
// - nextState : valeur fournie au traitement.
//
// Retour :
// - valeur de type `GameState` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
function resolveWinAfterAction(nextState: GameState): GameState {
  if (nextState.status === 'started' && isWon(nextState)) {
    return gameReducer(nextState, { type: 'WON' });
  }
  return nextState;
}

// ----------------------------------------------------------------------------
// Crée jeu état store.
//
// Paramètres :
// - difficulty : valeur fournie au traitement.
//
// Retour :
// - valeur de type `GameStateStore` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
export function createGameStateStore(difficulty: Difficulty = 'Beginner'): GameStateStore {
  let state = createInitialGameState(difficulty);
  // Constante `listeners` utilisée par la responsabilité de ce module.
  const listeners = new Set<GameStateListener>();

  // ----------------------------------------------------------------------------
  // Notifie le traitement demandé.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  function emit(): void {
    listeners.forEach(
      // ----------------------------------------------------------------------------
      // Exécute le callback associé à for each.
      //
      // Paramètres :
      // - listener : valeur fournie au traitement.
      //
      // Effets de bord :
      // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
      // ----------------------------------------------------------------------------
      (listener) => listener(state),
    );
  }

  // ----------------------------------------------------------------------------
  // Applique le traitement demandé.
  //
  // Paramètres :
  // - action : valeur fournie au traitement.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  function apply(action: GameAction): void {
    // Constante `nextState` utilisée par la responsabilité de ce module.
    const nextState = resolveWinAfterAction(gameReducer(state, action));
    if (nextState !== state) {
      state = nextState;
      emit();
    }
  }

  // ----------------------------------------------------------------------------
  // Ouvre le traitement demandé.
  //
  // Paramètres :
  // - index : valeur fournie au traitement.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  function open(index: number): void {
    if (index < 0 || index >= state.ceils.length) return;
    if (['won', 'died'].includes(state.status)) return;

    if (state.status === 'new') {
      apply({ type: 'START_GAME', payload: { index } });
      apply({ type: 'OPEN_CEIL', payload: { index } });
      return;
    }

    if (state.status !== 'started') return;

    // Constante `ceil` utilisée par la responsabilité de ce module.
    const ceil = state.ceils[index];
    if (!ceil) return;
    if (['flag', 'open'].includes(ceil.state)) return;

    if (ceil.minesAround < 0) {
      apply({ type: 'GAME_OVER', payload: { index } });
      return;
    }

    apply({ type: 'OPEN_CEIL', payload: { index } });
  }

  // ----------------------------------------------------------------------------
  // Ouvre voisins.
  //
  // Paramètres :
  // - index : valeur fournie au traitement.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  function openNeighbours(index: number): void {
    // Constante `ceil` utilisée par la responsabilité de ce module.
    const ceil = state.ceils[index];
    if (!ceil) return;
    if (ceil.state !== 'open' || ceil.minesAround <= 0 || state.status !== 'started') return;

    if (!isFlagCompleteForCell(state, index)) return;

    // Constante `mineIndex` utilisée par la responsabilité de ce module.
    const mineIndex = findUnflaggedMineNeighbor(state, index);
    if (typeof mineIndex === 'number') {
      apply({ type: 'GAME_OVER', payload: { index: mineIndex } });
      return;
    }

    getNeighborIndexes(index, state.rows, state.columns).forEach(
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
        if (state.ceils[neighbor]) {
          apply({ type: 'OPEN_CEIL', payload: { index: neighbor } });
        }
      },
    );
  }

  // ----------------------------------------------------------------------------
  // Bascule drapeau.
  //
  // Paramètres :
  // - index : valeur fournie au traitement.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  function toggleFlag(index: number): void {
    if (['won', 'died'].includes(state.status)) return;
    if (index < 0 || index >= state.ceils.length) return;

    // Constante `ceil` utilisée par la responsabilité de ce module.
    const ceil = state.ceils[index];
    if (!ceil || ceil.state === 'open') return;
    apply({ type: 'CHANGE_CEIL_STATE', payload: { index } });
  }

  return {
    // ----------------------------------------------------------------------------
    // Retourne état.
    //
    // Retour :
    // - valeur de type `GameState` produite par le traitement.
    //
    // Effets de bord :
    // - aucun.
    // ----------------------------------------------------------------------------
    getState: () => state,
    dispatch: apply,
    // ----------------------------------------------------------------------------
    // Démarre le traitement demandé.
    //
    // Paramètres :
    // - index : valeur fournie au traitement.
    //
    // Effets de bord :
    // - aucun.
    // ----------------------------------------------------------------------------
    start: (index: number) => open(index),
    open,
    openNeighbours,
    toggleFlag,
    // ----------------------------------------------------------------------------
    // Réinitialise le traitement demandé.
    //
    // Paramètres :
    // - config : valeur fournie au traitement.
    //
    // Effets de bord :
    // - aucun.
    // ----------------------------------------------------------------------------
    reset: (config?: {
      readonly difficulty?: Difficulty;
      readonly rows?: number;
      readonly columns?: number;
      readonly mines?: number;
    }) => {
      if (config) {
        apply({ type: 'CLEAR_MAP', payload: config });
        return;
      }

      apply({ type: 'CLEAR_MAP' });
    },
    // ----------------------------------------------------------------------------
    // Définit difficulté.
    //
    // Paramètres :
    // - nextDifficulty : valeur fournie au traitement.
    //
    // Effets de bord :
    // - aucun.
    // ----------------------------------------------------------------------------
    setDifficulty: (nextDifficulty: Difficulty) => {
      apply({ type: 'SET_DIFFICULTY', payload: { difficulty: nextDifficulty } });
    },
    // ----------------------------------------------------------------------------
    // Abonne le traitement demandé.
    //
    // Paramètres :
    // - listener : valeur fournie au traitement.
    //
    // Retour :
    // - valeur de type `() => void` produite par le traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    subscribe: (listener: GameStateListener) => {
      listeners.add(listener);
      listener(state);
      // ----------------------------------------------------------------------------
      // Exécute le traitement callback.
      //
      // Effets de bord :
      // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
      // ----------------------------------------------------------------------------
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
