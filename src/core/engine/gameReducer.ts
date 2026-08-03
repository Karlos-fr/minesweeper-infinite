import { Cell, Difficulty, GameAction, GameState } from '../types';
import { getDifficultyConfig } from './gridFactory';
import { createInitialGameState } from './gridFactory';
import { getAutoOpenIndexes } from './opening';
import { placeMines } from './minePlacer';
import { getNeighborIndexes } from './gridUtils';

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

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'CLEAR_MAP':
    case 'SET_DIFFICULTY': {
      const difficulty = action.payload.difficulty || state.difficulty;
      return resetToDifficulty(state, difficulty);
    }

    case 'START_GAME': {
      const { index } = action.payload;
      const config = getDifficultyConfig(state.difficulty);
      const ceils = placeMines({
        rows: state.rows,
        columns: state.columns,
        mines: config.mines,
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

      let newState = target.state;
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
          throw new Error(`Unknown ceil state ${target.state}`);
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
      const ceils = state.ceils.map(ceil => {
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
      const ceils = state.ceils.map(ceil =>
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
