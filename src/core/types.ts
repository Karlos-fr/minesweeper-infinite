export type CellState = 'cover' | 'flag' | 'unknown' | 'open' | 'die' | 'misflagged';

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

export type GameActionType =
  | 'START'
  | 'OPEN'
  | 'FLAG'
  | 'UNFLAG'
  | 'RESET'
  | 'SET_DIFFICULTY';

export interface GameAction {
  readonly type: GameActionType;
  readonly payload?: {
    index?: number;
    difficulty?: Difficulty;
  };
}
