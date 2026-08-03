import { Cell, Difficulty, GameAction, GameState } from '../types';
import { getDifficultyConfig } from './gridFactory';
import { createEmptyGrid, createInitialGameState } from './gridFactory';
import { getAutoOpenIndexes } from './opening';
import { placeMines } from './minePlacer';
import { getNeighborIndexes } from './gridUtils';

interface ClearMapPayload {
  readonly difficulty?: Difficulty;
  readonly rows?: number;
  readonly columns?: number;
  readonly mines?: number;
}

function replaceCeils(
  ceils: readonly Cell[],
  indexes: readonly number[],
  transform: (cell: Cell) => Cell,
): Cell[] {
  if (indexes.length === 0) return [...ceils];

  const next = [...ceils];
  indexes.forEach(index => {
    const current = next[index];
    if (!current) return;
    next[index] = transform(current);
  });

  return next;
}

function resetToDifficulty(state: GameState, difficulty: Difficulty): GameState {
  return {
    ...createInitialGameState(difficulty),
    difficulty,
  };
}

function clampPositiveInteger(value: number, fallback: number): number {
  const sanitized = Math.trunc(value);
  if (!Number.isFinite(sanitized)) {
    return fallback;
  }
  return Math.max(1, sanitized);
}

function clampMineCount(mines: number, total: number): number {
  const maxMines = Math.max(0, total - 1);
  const normalizedMines = clampPositiveInteger(mines, 0);
  if (maxMines <= 0) {
    return 0;
  }
  return Math.max(1, Math.min(normalizedMines, maxMines));
}

function resetToCustomConfig(state: GameState, payload?: ClearMapPayload): GameState {
  if (
    !payload ||
    (payload.difficulty === undefined &&
      payload.rows === undefined &&
      payload.columns === undefined &&
      payload.mines === undefined)
  ) {
    return {
      ...state,
      status: 'new',
      ceils: createEmptyGrid(state.rows, state.columns),
    };
  }

  if (
    payload.difficulty !== undefined &&
    payload.rows === undefined &&
    payload.columns === undefined &&
    payload.mines === undefined
  ) {
    return resetToDifficulty(state, payload.difficulty);
  }

  const rows = clampPositiveInteger(payload.rows ?? state.rows, state.rows);
  const columns = clampPositiveInteger(payload.columns ?? state.columns, state.columns);
  const total = rows * columns;
  const mines = payload.mines === undefined
    ? clampMineCount(state.mines, total)
    : clampMineCount(payload.mines, total);

  return {
    ...state,
    difficulty: payload.difficulty ?? state.difficulty,
    status: 'new',
    rows,
    columns,
    mines,
    ceils: createEmptyGrid(rows, columns),
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'CLEAR_MAP':
    case 'SET_DIFFICULTY': {
      if (action.type === 'SET_DIFFICULTY') {
        return resetToDifficulty(state, action.payload.difficulty);
      }
      return resetToCustomConfig(state, action.payload);
    }

    case 'START_GAME': {
      const { index } = action.payload;
      const ceils = placeMines({
        rows: state.rows,
        columns: state.columns,
        mines: state.mines,
        exclude: index,
        ceils: state.ceils,
      });

      return {
        ...state,
        status: 'started',
        ceils,
      };
    }

    case 'OPEN_CEIL': {
      const { index } = action.payload;
      const indexes = getAutoOpenIndexes(state, index);
      const ceils = replaceCeils(state.ceils, indexes, ceil => ({ ...ceil, state: 'open' }));

      return {
        ...state,
        ceils,
      };
    }

    case 'CHANGE_CEIL_STATE': {
      const { index } = action.payload;
      const target = state.ceils[index];
      if (!target) return state;

      let newState: Cell['state'];
      switch (target.state) {
        case 'cover':
          newState = 'flag';
          break;
        case 'flag':
          newState = 'unknown';
          break;
        case 'unknown':
          newState = 'cover';
          break;
        default:
          return state;
      }

      const next = [...state.ceils];
      next[index] = {
        ...target,
        state: newState,
      };

      return {
        ...state,
        ceils: next,
      };
    }

    case 'GAME_OVER': {
      const clickedIndex = action.payload.index;
      const ceils = state.ceils.map((ceil): Cell => {
        if (ceil.minesAround < 0 && ceil.state !== 'flag') {
          return {
            ...ceil,
            state: 'mine',
          };
        }

        if (ceil.state === 'flag' && ceil.minesAround >= 0) {
          return {
            ...ceil,
            state: 'misflagged',
          };
        }

        return {
          ...ceil,
          opening: false,
        };
      });

      if (!ceils[clickedIndex]) {
        throw new Error('Invalid clicked mine index');
      }

      ceils[clickedIndex] = {
        ...ceils[clickedIndex],
        state: 'die',
      };

      return {
        ...state,
        status: 'died',
        ceils,
      };
    }

    case 'WON': {
      const ceils = state.ceils.map(
        (ceil): Cell =>
          ceil.minesAround >= 0
            ? {
                ...ceil,
                state: 'open',
              }
            : {
                ...ceil,
                state: 'flag',
              },
      );

      return {
        ...state,
        status: 'won',
        ceils,
      };
    }

    case 'OPENING_CEIL': {
      const { index } = action.payload;
      const ceils = state.ceils.map(ceil => ({
        ...ceil,
        opening: false,
      }));

      if (!ceils[index]) {
        return state;
      }

      ceils[index] = {
        ...ceils[index],
        opening: true,
      };

      return {
        ...state,
        ceils,
      };
    }

    case 'OPENING_CEILS': {
      const { index } = action.payload;
      const neighbors = getNeighborIndexes(index, state.rows, state.columns);
      const ceils = state.ceils.map(ceil => ({
        ...ceil,
        opening: false,
      }));

      if (!ceils[index]) {
        return state;
      }

      [...neighbors, index].forEach(nearIndex => {
        if (!ceils[nearIndex]) return;
        ceils[nearIndex] = {
          ...ceils[nearIndex],
          opening: true,
        };
      });

      return {
        ...state,
        ceils,
      };
    }

    default:
      return state;
  }
}
