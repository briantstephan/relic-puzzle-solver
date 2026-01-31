import type { Puzzle } from '../lib/types';
import { Cell } from '../lib/types';

interface PuzzleEditorProps {
  puzzle: Puzzle;
  onPuzzleChange: (puzzle: Puzzle) => void;
}

const PuzzleEditor = ({ puzzle, onPuzzleChange }: PuzzleEditorProps) => {
  const handleCellClick = (row: number, col: number) => {
    const newPuzzle = puzzle.map(r => [...r]);
    const currentCell = newPuzzle[row][col];
    newPuzzle[row][col] = currentCell === Cell.NONE ? Cell.EMPTY : Cell.NONE;
    onPuzzleChange(newPuzzle as Puzzle);
  };

  const gridStyle = {
    gridTemplateColumns: `repeat(${puzzle[0]?.length || 0}, 20px)`,
  };

  return (
    <div className="puzzle-grid editor" style={gridStyle}>
      {puzzle.map((row, i) => (
        row.map((cell, j) => (
          <div
            key={`${i}-${j}`}
            className={`grid-cell ${
              cell === Cell.EMPTY ? 'empty' : 'none'
            }`}
            onClick={() => handleCellClick(i, j)}
          />
        ))
      ))}
    </div>
  );
};

export default PuzzleEditor;
