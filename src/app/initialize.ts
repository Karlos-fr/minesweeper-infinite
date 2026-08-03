import type { Difficulty } from '../core/types';
import {
  createPlayableFullScreenGrid,
  type PlayableGridOptions,
  type PlayableGridSession,
} from './usePlayableGrid';

export interface MinesweeperInitializeOptions {
  readonly root?: HTMLElement;
  readonly difficulty?: Difficulty;
  readonly layout?: PlayableGridOptions;
}

export interface MinesweeperAppSession extends PlayableGridSession {
  readonly root: HTMLElement;
}

export function initializeMinesweeperApp(
  options: MinesweeperInitializeOptions = {},
): MinesweeperAppSession {
  const root = options.root ?? document.getElementById('root') ?? document.body;

  const game = createPlayableFullScreenGrid(
    root,
    options.difficulty ?? 'Beginner',
    options.layout,
  );

  return {
    ...game,
    root,
  };
}
