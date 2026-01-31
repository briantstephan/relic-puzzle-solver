export enum Cell {
  NONE = 0,
  EMPTY = 1,
  FILLED = 2,
}

export type Puzzle = Cell[][];

export type Coordinates = {
  row: number;
  col: number;
};

export enum Turn {
  LEFT = 'left',
  RIGHT = 'right',
}

export type SolutionStep = {
  coordinates: Coordinates;
  turn: Turn;
};
