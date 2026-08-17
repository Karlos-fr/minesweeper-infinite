// ============================================================================
// Minesweeper Infinite - Reducer du jeu
// ----------------------------------------------------------------------------
// Ce fichier applique les actions métier et produit de nouveaux états. Il ne
// déclenche aucun effet de bord navigateur.
// ============================================================================
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

// ----------------------------------------------------------------------------
// Remplace cellules.
//
// Paramètres :
// - ceils : valeur fournie au traitement.
// - indexes : valeur fournie au traitement.
// - transform : valeur fournie au traitement.
//
// Retour :
// - valeur de type `Cell[]` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
function replaceCeils(ceils: readonly Cell[], indexes: readonly number[], transform: (cell: Cell) => Cell): Cell[] {
  if (indexes.length === 0) return [...ceils];

  // Constante `next` utilisée par la responsabilité de ce module.
  const next = [...ceils];
  indexes.forEach(
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
      // Constante `current` utilisée par la responsabilité de ce module.
      const current = next[index];
      if (!current) return;
      next[index] = transform(current);
    },
  );

  return next;
}

// ----------------------------------------------------------------------------
// Réinitialise to difficulté.
//
// Paramètres :
// - state : valeur fournie au traitement.
// - difficulty : valeur fournie au traitement.
//
// Retour :
// - valeur de type `GameState` produite par le traitement.
//
// Effets de bord :
// - aucun.
// ----------------------------------------------------------------------------
function resetToDifficulty(state: GameState, difficulty: Difficulty): GameState {
  return {
    ...createInitialGameState(difficulty),
    difficulty,
  };
}

// ----------------------------------------------------------------------------
// Limite positive integer.
//
// Paramètres :
// - value : valeur fournie au traitement.
// - fallback : valeur fournie au traitement.
//
// Retour :
// - valeur de type `number` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
function clampPositiveInteger(value: number, fallback: number): number {
  // Constante `sanitized` utilisée par la responsabilité de ce module.
  const sanitized = Math.trunc(value);
  if (!Number.isFinite(sanitized)) {
    return fallback;
  }
  return Math.max(1, sanitized);
}

// ----------------------------------------------------------------------------
// Limite mine count.
//
// Paramètres :
// - mines : valeur fournie au traitement.
// - total : valeur fournie au traitement.
//
// Retour :
// - valeur de type `number` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
function clampMineCount(mines: number, total: number): number {
  // Constante `maxMines` utilisée par la responsabilité de ce module.
  const maxMines = Math.max(0, total - 1);
  // Constante `normalizedMines` utilisée par la responsabilité de ce module.
  const normalizedMines = clampPositiveInteger(mines, 0);
  if (maxMines <= 0) {
    return 0;
  }
  return Math.max(1, Math.min(normalizedMines, maxMines));
}

// ----------------------------------------------------------------------------
// Réinitialise to custom configuration.
//
// Paramètres :
// - state : valeur fournie au traitement.
// - payload : valeur fournie au traitement.
//
// Retour :
// - valeur de type `GameState` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
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

  // Constante `rows` utilisée par la responsabilité de ce module.
  const rows = clampPositiveInteger(payload.rows ?? state.rows, state.rows);
  // Constante `columns` utilisée par la responsabilité de ce module.
  const columns = clampPositiveInteger(payload.columns ?? state.columns, state.columns);
  // Constante `total` utilisée par la responsabilité de ce module.
  const total = rows * columns;
  // Constante `mines` utilisée par la responsabilité de ce module.
  const mines = payload.mines === undefined ? clampMineCount(state.mines, total) : clampMineCount(payload.mines, total);

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

// ----------------------------------------------------------------------------
// Met à jour uniquement les cellules dont l'aperçu d'ouverture change.
//
// Paramètres :
// - state : état courant de la partie.
// - openingIndexes : index qui doivent apparaître enfoncés.
//
// Retour :
// - état inchangé si aucun aperçu ne varie, sinon nouvel état structurellement partagé.
//
// Effets de bord :
// - aucun.
// ----------------------------------------------------------------------------
function updateOpeningPreview(state: GameState, openingIndexes: ReadonlySet<number>): GameState {
  let changed = false;
  // Tableau qui réutilise les cellules visuellement identiques pour limiter les allocations.
  const ceils = state.ceils.map(
    // ----------------------------------------------------------------------------
    // Applique l'état d'aperçu attendu à une cellule.
    //
    // Paramètres :
    // - ceil : cellule actuellement stockée.
    // - index : position de la cellule dans la grille.
    //
    // Retour :
    // - cellule d'origine ou copie dont l'aperçu a changé.
    //
    // Effets de bord :
    // - met à jour l'indicateur local `changed` lorsqu'une copie est nécessaire.
    // ----------------------------------------------------------------------------
    (ceil, index) => {
      // Indique si cette cellule doit être affichée comme enfoncée.
      const opening = openingIndexes.has(index);
      if (ceil.opening === opening) return ceil;
      changed = true;
      return { ...ceil, opening };
    },
  );

  return changed ? { ...state, ceils } : state;
}

// ----------------------------------------------------------------------------
// Exécute le traitement jeu reducer.
//
// Paramètres :
// - state : valeur fournie au traitement.
// - action : valeur fournie au traitement.
//
// Retour :
// - valeur de type `GameState` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
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
      // Constante `{ index }` utilisée par la responsabilité de ce module.
      const { index } = action.payload;
      // Constante `ceils` utilisée par la responsabilité de ce module.
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
      // Constante `{ index }` utilisée par la responsabilité de ce module.
      const { index } = action.payload;
      // Constante `indexes` utilisée par la responsabilité de ce module.
      const indexes = getAutoOpenIndexes(state, index);
      // Constante `ceils` utilisée par la responsabilité de ce module.
      const ceils = replaceCeils(
        state.ceils,
        indexes,
        // ----------------------------------------------------------------------------
        // Remplace cellules callback.
        //
        // Paramètres :
        // - ceil : valeur fournie au traitement.
        //
        // Retour :
        // - valeur de type `{ state: "open"; minesAround: number; opening: boolean; }` produite par le traitement.
        //
        // Effets de bord :
        // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
        // ----------------------------------------------------------------------------
        (ceil) => ({ ...ceil, state: 'open' }),
      );

      return {
        ...state,
        ceils,
      };
    }

    case 'CHANGE_CEIL_STATE': {
      // Constante `{ index }` utilisée par la responsabilité de ce module.
      const { index } = action.payload;
      // Constante `target` utilisée par la responsabilité de ce module.
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

      // Constante `next` utilisée par la responsabilité de ce module.
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
      // Constante `clickedIndex` utilisée par la responsabilité de ce module.
      const clickedIndex = action.payload.index;
      // Constante `ceils` utilisée par la responsabilité de ce module.
      const ceils = state.ceils.map(
        // ----------------------------------------------------------------------------
        // Exécute le callback associé à map.
        //
        // Paramètres :
        // - ceil : valeur fournie au traitement.
        //
        // Retour :
        // - valeur de type `Cell` produite par le traitement.
        //
        // Effets de bord :
        // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
        // ----------------------------------------------------------------------------
        (ceil): Cell => {
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
        },
      );

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
      // Constante `ceils` utilisée par la responsabilité de ce module.
      const ceils = state.ceils.map(
        // ----------------------------------------------------------------------------
        // Exécute le callback associé à map.
        //
        // Paramètres :
        // - ceil : valeur fournie au traitement.
        //
        // Retour :
        // - valeur de type `Cell` produite par le traitement.
        //
        // Effets de bord :
        // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
        // ----------------------------------------------------------------------------
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
      // Constante `{ index }` utilisée par la responsabilité de ce module.
      const { index } = action.payload;
      // Ensemble vide lors du relâchement, ou limité à la cellule pressée.
      const openingIndexes = new Set<number>();
      if (state.ceils[index]) openingIndexes.add(index);
      return updateOpeningPreview(state, openingIndexes);
    }

    case 'OPENING_CEILS': {
      // Constante `{ index }` utilisée par la responsabilité de ce module.
      const { index } = action.payload;
      if (!state.ceils[index]) return state;
      // Constante `neighbors` utilisée par la responsabilité de ce module.
      const neighbors = getNeighborIndexes(index, state.rows, state.columns);
      // Ensemble des cellules concernées par l'ouverture combinée.
      const openingIndexes = new Set<number>([...neighbors, index]);
      return updateOpeningPreview(state, openingIndexes);
    }

    default:
      return state;
  }
}
