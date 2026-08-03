export type CellState = 'cover' | 'flag' | 'unknown' | 'open' | 'die' | 'misflagged' | 'mine';

export type Difficulty = 'Beginner' | 'Intermediate' | 'Expert';

export interface Cell {
  readonly state: CellState;
  readonly minesAround: number;
  readonly opening: boolean;
}

export type GameStatus = 'new' | 'started' | 'died' | 'won';

export interface GameState {
  readonly difficulty: Difficulty;
  readonly status: GameStatus;
  readonly rows: number;
  readonly columns: number;
  readonly mines: number;
  readonly ceils: Cell[];
}

export interface ClearMapAction {
  readonly type: 'CLEAR_MAP';
  readonly payload?: {
    readonly difficulty?: Difficulty;
    readonly rows?: number;
    readonly columns?: number;
    readonly mines?: number;
  };
}

export interface SetDifficultyAction {
  readonly type: 'SET_DIFFICULTY';
  readonly payload: {
    readonly difficulty: Difficulty;
  };
}

export interface StartGameAction {
  readonly type: 'START_GAME';
  readonly payload: {
    readonly index: number;
  };
}

export interface OpenCeilAction {
  readonly type: 'OPEN_CEIL';
  readonly payload: {
    readonly index: number;
  };
}

export interface OpeningCeilAction {
  readonly type: 'OPENING_CEIL';
  readonly payload: {
    readonly index: number;
  };
}

export interface OpeningCeilsAction {
  readonly type: 'OPENING_CEILS';
  readonly payload: {
    readonly index: number;
  };
}

export interface ChangeCeilStateAction {
  readonly type: 'CHANGE_CEIL_STATE';
  readonly payload: {
    readonly index: number;
  };
}

export interface GameOverAction {
  readonly type: 'GAME_OVER';
  readonly payload: {
    readonly index: number;
  };
}

export interface WonAction {
  readonly type: 'WON';
}

export type GameAction =
  | ClearMapAction
  | SetDifficultyAction
  | StartGameAction
  | OpenCeilAction
  | OpeningCeilAction
  | OpeningCeilsAction
  | ChangeCeilStateAction
  | GameOverAction
  | WonAction;

export interface DifficultyConfig {
  readonly rows: number;
  readonly columns: number;
  readonly ceils: number;
  readonly mines: number;
}
