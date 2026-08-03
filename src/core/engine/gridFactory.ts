import { Cell, Difficulty, DifficultyConfig, GameState } from '../types';
import { CONFIG } from '../core/config';

export interface GameInitConfig {
  readonly difficulty: Difficulty;
}

function createEmptyCeil(): Cell {
  return {
    state: 'cover',
    minesAround: 0,
    opening: false,
  };
}

export function createEmptyGrid(rows: number, columns: number): Cell[] {
  return Array(rows * columns)
    .fill(null)
    .map(() => createEmptyCeil());
}

export function getDifficultyConfig(difficulty: Difficulty): DifficultyConfig {
  return CONFIG[difficulty];
}

export function createInitialGameState(difficulty: Difficulty): GameState {
  const config = getDifficultyConfig(difficulty);

  return {
    difficulty,
    status: 'new',
    rows: config.rows,
    columns: config.columns,
    mines: config.mines,
    ceils: createEmptyGrid(config.rows, config.columns),
  };
}
