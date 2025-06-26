import React from 'react';
import { GameArea } from './GameArea';
import { InfoPanel } from './InfoPanel';
import { PlayerList } from './PlayerList';
import { Leaderboard } from './Leaderboard';
import { Web3AuthButton } from './Web3AuthButton';
import { useSnakeGame } from '../hooks/useSnakeGame';
import { useRoomContext } from '../contexts/RoomContext';
import { useMultisynq } from '../contexts/MultisynqContext';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { useIsMobile } from '../hooks/use-mobile';

export const SnakeGame = () => {
  const { 
    snakes, 
    foods, 
    gameRunning, 
    gameOver, 
    gridSize, 
    cellSize,
    countdown,
    showCountdown,
    isSpectator,
    enterSpectatorMode,
    speedMultiplier,
    foodCountdown,
    speedBoostCountdown
  } = useSnakeGame();

  const { currentRoom, spectatorRoom, isSpectator: isExternalSpectator } = useRoomContext();
  const { gameView } = useMultisynq();
  const { user } = useWeb3Auth();
  const isMobile = useIsMobile();

  return (
    <div className="h-screen flex flex-col bg-cyber-darker text-white overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 bg-cyber-dark/50 border-b border-cyber-cyan/30">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-cyber-cyan">
            Multi Snake Game
          </h1>
          <Web3AuthButton />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Info Panel */}
        <div className="flex-shrink-0 w-64 lg:w-80 bg-cyber-dark/30 border-r border-cyber-cyan/30 overflow-y-auto">
          <InfoPanel 
            isSpectator={isSpectator}
            enterSpectatorMode={enterSpectatorMode}
            speedMultiplier={speedMultiplier}
            foodCountdown={foodCountdown}
            speedBoostCountdown={speedBoostCountdown}
          />
        </div>

        {/* Game Area - Takes remaining space */}
        <GameArea 
          snakes={snakes} 
          foods={foods} 
          isSpectator={isSpectator}
          countdown={countdown}
          showCountdown={showCountdown}
        />

        {/* Right Panel - Player List and Leaderboard */}
        <div className="flex-shrink-0 w-64 lg:w-80 bg-cyber-dark/30 border-l border-cyber-cyan/30 overflow-y-auto">
          <div className="p-4 space-y-6">
            <PlayerList snakes={snakes} />
            <Leaderboard snakes={snakes} />
          </div>
        </div>
      </div>

      {/* Game Over Overlay */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-cyber-dark border-2 border-cyber-cyan rounded-lg p-8 text-center max-w-md mx-4">
            <h2 className="text-3xl font-bold text-cyber-cyan mb-4">Game Over!</h2>
            <div className="space-y-2 mb-6">
              {snakes
                .filter(snake => snake.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 3)
                .map((snake, index) => (
                  <div key={snake.id} className="flex justify-between items-center">
                    <span className={`font-bold ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : 'text-orange-400'}`}>
                      #{index + 1} {snake.name}
                    </span>
                    <span className="text-cyber-cyan">{snake.score} points</span>
                  </div>
                ))}
            </div>
            <p className="text-gray-400">
              {currentRoom ? 'Waiting for new game...' : 'Join a room to play again!'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
