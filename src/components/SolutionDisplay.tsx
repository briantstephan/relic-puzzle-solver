import type { SolutionStep } from '../lib/types';
import { Turn } from '../lib/types';

interface SolutionDisplayProps {
  solution: SolutionStep[];
}

const SolutionDisplay = ({ solution }: SolutionDisplayProps) => {
  // sort steps top-to-bottom, left-to-right
  const sorted = [...solution].sort((a, b) => {
    if (a.coordinates.row !== b.coordinates.row) return a.coordinates.row - b.coordinates.row;
    return a.coordinates.col - b.coordinates.col;
  });

  return (
    <div className="solution-display">
      <ol className="solution-list">
        {sorted.map((step, idx) => (
          <li key={idx} className={`solution-item ${step.turn === Turn.LEFT ? 'left' : 'right'}`}>
            ({step.coordinates.row}, {step.coordinates.col}) — {step.turn === Turn.LEFT ? 'left' : 'right'}
          </li>
        ))}
      </ol>
    </div>
  );
};

export default SolutionDisplay;
