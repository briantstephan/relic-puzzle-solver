import { useState } from 'react';
import { puzzles } from './lib/puzzles';
import { solvePuzzle } from './lib/solver';
import type { Puzzle, SolutionStep } from './lib/types';
import { Cell } from './lib/types';
import PuzzleGrid from './components/PuzzleGrid';
import SolutionDisplay from './components/SolutionDisplay';
import PuzzleEditor from './components/PuzzleEditor';
import './App.css';

const App = () => {
  const [puzzle, setPuzzle] = useState<Puzzle>(puzzles['Default Puzzle']);
  const [solution, setSolution] = useState<SolutionStep[] | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [selectedPuzzle, setSelectedPuzzle] = useState('Default Puzzle');

  const handleSolve = async () => {
    setIsSolving(true);
    setIsEditing(false);
    try {
      // Make sure the spinner has time to render before starting heavy computation
      await new Promise(requestAnimationFrame);
  // beam-DFS solver options: beamWidth and timeLimitMs
  const newSolution = await solvePuzzle(puzzle, { beamWidth: 64, timeLimitMs: 32000 });
      setSolution(newSolution);
    } finally {
      setIsSolving(false);
    }
  };

  const handlePuzzleChange = (newPuzzle: Puzzle) => {
    setPuzzle(newPuzzle);
    setSolution(null);
  };

  const handleSelectPuzzle = (puzzleName: string) => {
    setSelectedPuzzle(puzzleName);
    setPuzzle(puzzles[puzzleName]);
    setSolution(null);
    setIsEditing(false);
  };

  const handleCreateNew = () => {
    const newPuzzle: Puzzle = Array.from({ length: 15 }, () => Array(15).fill(Cell.NONE));
    setPuzzle(newPuzzle);
    setSolution(null);
    setIsEditing(true);
    setSelectedPuzzle('');
  };

  return (
    <div className="app">
      <header>
        <h1>Relic Puzzle Solver</h1>
        <nav>
          <select onChange={(e) => handleSelectPuzzle(e.target.value)} value={selectedPuzzle} disabled={isSolving}>
            <option value="" disabled>Select a puzzle</option>
            {Object.keys(puzzles).map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <button onClick={handleCreateNew} disabled={isSolving}>Create New</button>
        </nav>
      </header>
      <main>
        <div className="puzzle-container">
          <h2>Puzzle</h2>
          {isEditing ? (
            <PuzzleEditor puzzle={puzzle} onPuzzleChange={handlePuzzleChange} />
          ) : (
            <PuzzleGrid puzzle={puzzle} solution={solution} />
          )}
          <button onClick={handleSolve} disabled={!!solution || isSolving}>
            {isSolving ? <span className="spinner" aria-hidden></span> : 'Solve'}
            {isSolving ? ' Solving...' : ''}
          </button>
        </div>
        <div className="solution-container">
          <h2>Solution</h2>
          {solution && <SolutionDisplay solution={solution} />}
        </div>
      </main>
    </div>
  );
}

export default App;
