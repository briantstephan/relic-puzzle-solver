import type { Puzzle, SolutionStep } from '../lib/types';
import { Cell, Turn } from '../lib/types';

interface PuzzleGridProps {
  puzzle: Puzzle;
  solution: SolutionStep[] | null;
}

const PuzzleGrid = ({ puzzle, solution }: PuzzleGridProps) => {
  const getStepForCell = (row: number, col: number): SolutionStep | undefined => {
    if (!solution) return undefined;
    return solution.find(step => step.coordinates.row === row && step.coordinates.col === col);
  };

  const gridStyle = {
    gridTemplateColumns: `repeat(${puzzle[0]?.length || 0}, 20px)`,
  };

  return (
    <div className="puzzle-grid" style={gridStyle}>
      {puzzle.map((row, i) => (
        row.map((cell, j) => (
          <div
            key={`${i}-${j}`}
            className={`grid-cell ${
                cell === Cell.EMPTY ? 'empty' : cell === Cell.FILLED ? 'filled' : 'none'
              } ${getStepForCell(i, j) ? (getStepForCell(i, j)!.turn === Turn.LEFT ? 'solution-left' : 'solution-right') : ''}`}
            >
              {(() => {
                const s = getStepForCell(i, j);
                if (!s) return null;
                return s.turn === Turn.LEFT ? 'L' : 'R';
              })()}
          </div>
        ))
      ))}
    </div>
  );
};

export default PuzzleGrid;
