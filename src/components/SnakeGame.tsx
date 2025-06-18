
import React from 'react';
import { useSnakeGame } from '../hooks/useSnakeGame';
import { useIsMobile } from '../hooks/use-mobile';
import { InfoPanel } from './InfoPanel';
import { GameArea } from './GameArea';

export const SnakeGame: React.FC = () => {
  const {
    snakes,
    foods,
    segments,
    gameRunning,
    gameOver,
    startGame,
    pauseGame,
    resetGame,
    gridSize,
    cellSize,
    countdown,
    showCountdown,
    isSpectator,
    enterSpectatorMode,
    speedMultiplier
  } = useSnakeGame();

  const isMobile = useIsMobile();

  return (
    <div className={`min-h-screen bg-cyber-darker ${isMobile ? 'flex flex-col' : 'flex'}`}>
      {/* Info Panel */}
      {!isMobile && (
        <InfoPanel
          snakes={snakes}
          gameRunning={gameRunning}
          gameOver={gameOver}
          onStart={startGame}
          onPause={pauseGame}
          onReset={resetGame}
        />
      )}
      
      {/* Game Area */}
      <div className="relative flex-1">
        {/* Speed Indicator */}
        {gameRunning && (
          <div className={`absolute ${isMobile ? 'top-2 right-2' : 'top-4 right-4'} z-40`}>
            <div className="bg-cyber-darker/90 border border-cyber-yellow/50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyber-yellow rounded-full animate-pulse"></div>
                <span className="text-cyber-yellow font-bold text-sm">
                  Speed: {speedMultiplier.toFixed(1)}x
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Spectator Mode Indicator */}
        {isSpectator && gameRunning && (
          <div className={`absolute ${isMobile ? 'top-2 left-2 right-2' : 'top-4 left-1/2 transform -translate-x-1/2'} z-40`}>
            <div className="bg-cyber-darker/90 border border-cyber-cyan/50 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2 justify-center">
                <div className="w-3 h-3 bg-cyber-cyan rounded-full animate-pulse"></div>
                <span className="text-cyber-cyan font-bold text-sm">Spectator Mode</span>
                {!isMobile && (
                  <span className="text-cyber-cyan/70 text-xs">| Watch all players</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Info Panel */}
        {isMobile && (
          <div className="bg-cyber-darker border-b border-cyber-cyan/30 p-2">
            <div className="flex justify-between items-center text-sm">
              <div className="text-cyber-cyan font-bold">CYBER SNAKE</div>
              {snakes.find(s => s.isPlayer) && (
                <div className="text-cyber-green">
                  Score: {snakes.find(s => s.isPlayer)?.score || 0}
                </div>
              )}
            </div>
          </div>
        )}

        <GameArea
          snakes={snakes}
          foods={foods}
          segments={segments}
          gridSize={gridSize}
          cellSize={cellSize}
          isSpectator={isSpectator}
        />
        
        {/* Countdown Overlay */}
        {showCountdown && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="text-center p-4">
              <h2 className="text-3xl md:text-4xl font-bold text-cyber-cyan neon-text mb-4">
                Game Starting Soon
              </h2>
              <div className="text-6xl md:text-8xl font-bold text-cyber-green neon-text animate-pulse mb-4">
                {countdown}
              </div>
              <p className="text-cyber-cyan/70 mb-6 text-sm md:text-base">
                All players ready, game starting!
              </p>
              
              {/* Player snakes preview */}
              {snakes.length > 0 && (
                <div className="bg-cyber-darker/90 p-3 md:p-4 rounded-lg border border-cyber-cyan/30">
                  <p className="text-cyber-cyan mb-2 text-sm">Players:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {snakes.map(snake => (
                      <div key={snake.id} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 md:w-4 md:h-4 rounded"
                          style={{ backgroundColor: snake.color }}
                        ></div>
                        <span className={`text-xs md:text-sm ${snake.isPlayer ? 'text-cyber-green font-bold' : 'text-cyber-cyan'}`}>
                          {snake.name} {snake.isPlayer && '(You)'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="text-center p-4">
              <h2 className="text-4xl md:text-6xl font-bold text-cyber-red neon-text mb-6">
                Game Over
              </h2>
              
              {/* Final Scores */}
              {snakes.length > 0 && (
                <div className="bg-cyber-darker/90 p-4 md:p-6 rounded-lg border border-cyber-red/30 mb-6">
                  <h3 className="text-cyber-cyan text-lg md:text-xl mb-4">Final Scores</h3>
                  <div className="space-y-2">
                    {snakes
                      .sort((a, b) => b.score - a.score)
                      .map((snake, index) => (
                        <div key={snake.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-cyber-yellow">#{index + 1}</span>
                            <div 
                              className="w-3 h-3 md:w-4 md:h-4 rounded"
                              style={{ backgroundColor: snake.color }}
                            ></div>
                            <span className={`text-sm md:text-base ${snake.isPlayer ? 'text-cyber-green font-bold' : 'text-cyber-cyan'}`}>
                              {snake.name}
                            </span>
                            {snake.isSpectator && (
                              <span className="text-cyber-cyan/50 text-xs">(Spectator)</span>
                            )}
                          </div>
                          <span className="text-cyber-yellow font-bold text-sm md:text-base">
                            {snake.score}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <p className="text-cyber-cyan/70 text-sm md:text-base">
                Return to lobby to start a new game
              </p>
            </div>
          </div>
        )}

        {/* Mobile Swipe Instructions */}
        {isMobile && gameRunning && !isSpectator && (
          <div className="absolute bottom-4 left-4 right-4 z-40">
            <div className="bg-cyber-darker/90 border border-cyber-cyan/30 rounded-lg p-3">
              <div className="text-center">
                <h3 className="text-cyber-cyan font-bold text-sm mb-2">Swipe Controls</h3>
                <div className="text-cyber-cyan/70 text-xs space-y-1">
                  <p>Swipe to change direction</p>
                  <p>↑ ↓ ← → anywhere on screen</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Death Notification for Spectator Mode Entry */}
        {snakes.find(snake => snake.isPlayer && !snake.isAlive && !snake.isSpectator) && gameRunning && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="bg-cyber-darker/95 border border-cyber-red/50 rounded-lg p-4 md:p-6 text-center">
              <h3 className="text-cyber-red text-lg md:text-xl font-bold mb-4">You Died</h3>
              <p className="text-cyber-cyan/70 mb-4 text-sm md:text-base">
                You've entered spectator mode automatically
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-cyber-cyan rounded-full animate-pulse"></div>
                <span className="text-cyber-cyan text-sm">Watching other players...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
