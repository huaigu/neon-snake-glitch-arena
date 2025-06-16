
import React from 'react';
import { useSnakeGame } from '../hooks/useSnakeGame';
import { InfoPanel } from './InfoPanel';
import { GameArea } from './GameArea';

export const SnakeGame: React.FC = () => {
  const {
    snakes,
    foods,
    gameRunning,
    gameOver,
    startGame,
    pauseGame,
    resetGame,
    gridSize
  } = useSnakeGame();

  return (
    <div className="min-h-screen bg-cyber-darker flex">
      {/* Info Panel */}
      <InfoPanel
        snakes={snakes}
        gameRunning={gameRunning}
        gameOver={gameOver}
        onStart={startGame}
        onPause={pauseGame}
        onReset={resetGame}
      />
      
      {/* Game Area */}
      <GameArea
        snakes={snakes}
        foods={foods}
        gridSize={gridSize}
      />
    </div>
  );
};
