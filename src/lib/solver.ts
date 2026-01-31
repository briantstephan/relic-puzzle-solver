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


const findMaxWeight = (p: Puzzle, calculator: (p: Puzzle, row: number, col: number) => number): { weight: number, coordinates: Coordinates } => {
  let maxWeight = 0;
  let maxWeightCoordinates: Coordinates = { row: -1, col: -1 };
  const N = p.length;
  const M = p[0].length;

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < M; j++) {
      const weight = calculator(p, i, j);
      if (weight > maxWeight) {
        maxWeight = weight;
        maxWeightCoordinates = { row: i, col: j };
      }
    }
  }

  return { weight: maxWeight, coordinates: maxWeightCoordinates };
};

// Greedy solver (original behavior) used as a fallback and starting best solution
const greedySolve = (initialPuzzle: Puzzle): SolutionStep[] => {
  let currentPuzzle = copy(initialPuzzle);
  const solution: SolutionStep[] = [];

  while (!isSolved(currentPuzzle)) {
    const { weight: leftWeight, coordinates: leftCoords } = findMaxWeight(currentPuzzle, calculateLeftWeight);
    const { weight: rightWeight, coordinates: rightCoords } = findMaxWeight(currentPuzzle, calculateRightWeight);

    if (leftWeight === 0 && rightWeight === 0) {
      // No more moves possible, but puzzle is not solved. Return what we have.
      break;
    }

    if (leftWeight > rightWeight) {
      currentPuzzle = turnLeft(currentPuzzle, leftCoords);
      solution.push({ coordinates: leftCoords, turn: Turn.LEFT });
    } else {
      currentPuzzle = turnRight(currentPuzzle, rightCoords);
      solution.push({ coordinates: rightCoords, turn: Turn.RIGHT });
    }
  }

  return solution;
};

// Asynchronous (bounded) beam-search/backtracking solver. Returns the best solution found within timeLimitMs.
export const solvePuzzle = async (initialPuzzle: Puzzle, options?: { beamWidth?: number; timeLimitMs?: number }): Promise<SolutionStep[]> => {
  const beamWidth = options?.beamWidth ?? 3;
  const timeLimitMs = options?.timeLimitMs ?? 2000; // default 2s

  const start = Date.now();
  const deadline = start + timeLimitMs;

  // Start with greedy solution as baseline
  let bestSolution = greedySolve(initialPuzzle);
  let bestLength = bestSolution.length || Infinity;
  // Helper: apply a single step
  const applyStep = (p: Puzzle, step: SolutionStep): Puzzle => {
    return step.turn === Turn.LEFT ? turnLeft(p, step.coordinates) : turnRight(p, step.coordinates);
  };

  // Helper: apply a list of steps
  const applySolution = (p: Puzzle, steps: SolutionStep[]): Puzzle => {
    let cur = copy(p);
    for (const s of steps) {
      cur = applyStep(cur, s);
    }
    return cur;
  };

  // If the greedy solved it, set best length
  if (isSolved(applySolution(copy(initialPuzzle), bestSolution))) {
    bestLength = bestSolution.length;
  }

  // Generate all candidate moves sorted by weight (descending)
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

  // DFS with beam pruning — make cooperative (async) so UI can update
  let nodesVisited = 0;
  const visited = new Map<string, number>(); // map serialized puzzle -> shortest path length seen

  const serializePuzzle = (p: Puzzle): string => {
    return p.map(row => row.join('')).join('|');
  };

  const dfs = async (p: Puzzle, path: SolutionStep[]): Promise<void> => {
    if (Date.now() > deadline) return; // time up
    if (path.length >= bestLength) return; // cannot improve
    // transposition pruning: if we've seen this state with an equal or shorter path, skip
    const key = serializePuzzle(p);
    const prev = visited.get(key);
    if (prev !== undefined && prev <= path.length) return;
    visited.set(key, path.length);
    if (isSolved(p)) {
      // found a better solution
      bestSolution = [...path];
      bestLength = path.length;
      return;
    }

    const candidates = getCandidates(p);
    if (candidates.length === 0) return;

    // Explore top-K candidates, but allow some diversification: also include any candidate
    // whose weight is at least 60% of the top candidate's weight (up to a modest cap).
    const cap = Math.max(beamWidth, 1);
    const top = candidates.slice(0, cap);
    if (candidates.length > cap) {
      const topWeight = candidates[0]?.weight ?? 0;
      const diversify = candidates.slice(cap).filter(c => c.weight >= Math.ceil(topWeight * 0.6));
      // append diversify candidates but keep total expansion bounded
      for (const d of diversify) {
        if (top.length >= cap * 2) break;
        top.push(d);
      }
    }
    for (const c of top) {
      if (Date.now() > deadline) return;
      const nextP = applyStep(p, c.step);
      path.push(c.step);
      nodesVisited++;
      // occasionally yield to the event loop so the browser can render (spinner)
      if ((nodesVisited & 0x3ff) === 0) { // every 1024 nodes
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      await dfs(nextP, path);
      path.pop();
    }
  };

  // Kick off search
  try {
    await dfs(copy(initialPuzzle), []);
  } catch {
    // ignore and fallback
  }

  // If search found nothing better, return greedy fallback
  if (!bestSolution || bestSolution.length === 0) {
    return bestSolution;
  }

  return bestSolution;
};
