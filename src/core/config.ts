import { Difficulty } from './types';

export interface DifficultyConfig {
  readonly rows: number;
  readonly columns: number;
  readonly ceils: number;
  readonly mines: number;
}

export const CONFIG: Record<Difficulty, DifficultyConfig> = {
  Beginner: {
    rows: 9,
    columns: 9,
    ceils: 81,
    mines: 10,
  },
  Intermediate: {
    rows: 16,
    columns: 16,
    ceils: 256,
    mines: 40,
  },
  Expert: {
    rows: 16,
    columns: 30,
    ceils: 480,
    mines: 99,
  },
};
