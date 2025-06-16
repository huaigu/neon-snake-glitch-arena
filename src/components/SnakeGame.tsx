
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
    gridSize,
    countdown,
    showCountdown
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
      <div className="relative flex-1">
        <GameArea
          snakes={snakes}
          foods={foods}
          gridSize={gridSize}
        />
        
        {/* Countdown Overlay */}
        {showCountdown && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-cyber-cyan neon-text mb-4">
                游戏即将开始
              </h2>
              <div className="text-8xl font-bold text-cyber-green neon-text animate-pulse mb-4">
                {countdown}
              </div>
              <p className="text-cyber-cyan/70 mb-8">
                找到你的蛇准备开始！
              </p>
              
              {/* Player position hint */}
              {snakes.length > 0 && (
                <div className="bg-cyber-darker/90 p-4 rounded-lg border border-cyber-cyan/30">
                  <p className="text-cyber-cyan mb-2">你的蛇位置：</p>
                  <div className="flex items-center justify-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: snakes.find(s => s.isPlayer)?.color || '#00ffff' }}
                    ></div>
                    <span className="text-cyber-cyan text-sm">
                      {snakes.find(s => s.isPlayer)?.name || 'PLAYER_01'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
