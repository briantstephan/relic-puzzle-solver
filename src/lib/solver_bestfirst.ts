import { Cell, Turn } from './types';
import type { Puzzle, Coordinates, SolutionStep } from './types';

const copy = (p: Puzzle): Puzzle => {
  return p.map(row => [...row]);
};

export const isSolved = (p: Puzzle): boolean => {
  for (let i = 0; i < p.length; i++) {
    for (let j = 0; j < p[0].length; j++) {
      if (p[i][j] === Cell.EMPTY) {
        return false;
      }
    }
  }
  return true;
};

const calculateLeftWeight = (p: Puzzle, row: number, col: number): number => {
  if (p[row][col] !== Cell.EMPTY) {
    return 0;
  }

  let weight = 1;
  const N = p.length;
  const M = p[0].length;

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      const newRow = row + i;
      const newCol = col + j;
      if (newRow >= 0 && newRow < N && newCol >= 0 && newCol < M && p[newRow][newCol] === Cell.EMPTY) {
        weight++;
      }
    }
  }

  return weight;
};

const turnLeft = (oldP: Puzzle, { row, col }: Coordinates): Puzzle => {
  const p = copy(oldP);
  const N = p.length;
  const M = p[0].length;

  if (p[row][col] !== Cell.EMPTY) {
    return p;
  }

  p[row][col] = Cell.FILLED;

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      const newRow = row + i;
      const newCol = col + j;
      if (newRow >= 0 && newRow < N && newCol >= 0 && newCol < M && p[newRow][newCol] === Cell.EMPTY) {
        p[newRow][newCol] = Cell.FILLED;
      }
    }
  }

  return p;
};

const calculateRightWeight = (p: Puzzle, row: number, col: number): number => {
  if (p[row][col] !== Cell.EMPTY) {
    return 0;
  }

  let weight = 1;
  const N = p.length;
  const M = p[0].length;

  // Up
  for (let i = row - 1; i >= 0; i--) {
    if (p[i][col] === Cell.NONE) break;
    if (p[i][col] === Cell.EMPTY) weight++;
  }
  // Down
  for (let i = row + 1; i < N; i++) {
    if (p[i][col] === Cell.NONE) break;
    if (p[i][col] === Cell.EMPTY) weight++;
  }
  // Left
  for (let j = col - 1; j >= 0; j--) {
    if (p[row][j] === Cell.NONE) break;
    if (p[row][j] === Cell.EMPTY) weight++;
  }
  // Right
  for (let j = col + 1; j < M; j++) {
    if (p[row][j] === Cell.NONE) break;
    if (p[row][j] === Cell.EMPTY) weight++;
  }

  return weight;
};

const turnRight = (oldP: Puzzle, { row, col }: Coordinates): Puzzle => {
  const p = copy(oldP);
  const N = p.length;
  const M = p[0].length;

  if (p[row][col] !== Cell.EMPTY) {
    return p;
  }

  p[row][col] = Cell.FILLED;

  // Up
  for (let i = row - 1; i >= 0; i--) {
    if (p[i][col] === Cell.NONE) break;
    if (p[i][col] === Cell.EMPTY) p[i][col] = Cell.FILLED;
  }
  // Down
  for (let i = row + 1; i < N; i++) {
    if (p[i][col] === Cell.NONE) break;
    if (p[i][col] === Cell.EMPTY) p[i][col] = Cell.FILLED;
  }
  // Left
  for (let j = col - 1; j >= 0; j--) {
    if (p[row][j] === Cell.NONE) break;
    if (p[row][j] === Cell.EMPTY) p[row][j] = Cell.FILLED;
  }
  // Right
  for (let j = col + 1; j < M; j++) {
    if (p[row][j] === Cell.NONE) break;
    if (p[row][j] === Cell.EMPTY) p[row][j] = Cell.FILLED;
  }

  return p;
};

const applyStep = (p: Puzzle, step: SolutionStep): Puzzle => {
  return step.turn === Turn.LEFT ? turnLeft(p, step.coordinates) : turnRight(p, step.coordinates);
};

const countEmpty = (p: Puzzle): number => {
  let c = 0;
  for (let i = 0; i < p.length; i++) {
    for (let j = 0; j < p[0].length; j++) {
      if (p[i][j] === Cell.EMPTY) c++;
    }
  }
  return c;
};

const serializePuzzle = (p: Puzzle): string => {
  return p.map(row => row.join('')).join('|');
};

// Simple candidate generator (both left and right moves), sorted by immediate weight (descending)
const getCandidates = (p: Puzzle): Array<{ step: SolutionStep; weight: number }> => {
  const N = p.length;
  const M = p[0].length;
  const candidates: Array<{ step: SolutionStep; weight: number }> = [];
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < M; j++) {
      if (p[i][j] !== Cell.EMPTY) continue;
      const lw = calculateLeftWeight(p, i, j);
      const rw = calculateRightWeight(p, i, j);
      if (lw > 0) candidates.push({ step: { coordinates: { row: i, col: j }, turn: Turn.LEFT }, weight: lw });
      if (rw > 0) candidates.push({ step: { coordinates: { row: i, col: j }, turn: Turn.RIGHT }, weight: rw });
    }
  }
  candidates.sort((a, b) => b.weight - a.weight);
  return candidates;
};

// Bounded best-first (A*-like) search. Returns the best solution found within time limit.
export const solvePuzzleBestFirst = async (initialPuzzle: Puzzle, options?: { timeLimitMs?: number; maxOpen?: number }): Promise<SolutionStep[]> => {
  const timeLimitMs = options?.timeLimitMs ?? 4000;
  const maxOpen = options?.maxOpen ?? 20000;

  const start = Date.now();
  const deadline = start + timeLimitMs;

  // Heuristic: optimistic number of moves remaining = ceil(remainingEmpty / 9)
  const heuristic = (p: Puzzle): number => {
    const rem = countEmpty(p);
    return Math.ceil(rem / 9);
  };

  type Node = { p: Puzzle; g: number; f: number; path: SolutionStep[] };

  // priority queue implemented with an array for simplicity; we keep it bounded
  const open: Node[] = [];
  const closed = new Map<string, number>(); // puzzleKey -> best g seen

  const startNode: Node = { p: copy(initialPuzzle), g: 0, f: heuristic(initialPuzzle), path: [] };
  open.push(startNode);

  let bestSolution: SolutionStep[] = [];

  let iterations = 0;
  while (open.length > 0 && Date.now() <= deadline) {
    // sort open by f (g + h) ascending; stable for ties
    open.sort((a, b) => a.f - b.f || a.g - b.g);
    const node = open.shift()!;

    const key = serializePuzzle(node.p);
    const prevG = closed.get(key);
    if (prevG !== undefined && prevG <= node.g) {
      // we've seen a better or equal path to this state
      continue;
    }
    closed.set(key, node.g);

    if (isSolved(node.p)) {
      bestSolution = node.path;
      break;
    }

    // expand
    const candidates = getCandidates(node.p);
    for (const c of candidates) {
      if (Date.now() > deadline) break;
      const nextP = applyStep(node.p, c.step);
      const nextPath = [...node.path, c.step];
      const g = node.g + 1;
      const h = heuristic(nextP);
      const f = g + h;
      const k = serializePuzzle(nextP);
      const seenG = closed.get(k);
      if (seenG !== undefined && seenG <= g) continue;
      // push into open set
      open.push({ p: nextP, g, f, path: nextPath });
      // keep open bounded
      if (open.length > maxOpen) {
        // drop worst by f
        open.sort((a, b) => a.f - b.f || a.g - b.g);
        open.length = maxOpen;
      }
      iterations++;
      if ((iterations & 0x3ff) === 0) await new Promise(res => setTimeout(res, 0));
    }
  }

  return bestSolution;
}
