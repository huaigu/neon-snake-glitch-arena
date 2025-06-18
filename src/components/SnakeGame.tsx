
import React from 'react';
import { useSnakeGame } from '../hooks/useSnakeGame';
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
    countdown,
    showCountdown,
    isSpectator,
    enterSpectatorMode
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
        {/* Spectator Mode Indicator */}
        {isSpectator && gameRunning && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40">
            <div className="bg-cyber-darker/90 border border-cyber-cyan/50 rounded-lg px-6 py-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-cyber-cyan rounded-full animate-pulse"></div>
                <span className="text-cyber-cyan font-bold">观察者模式</span>
                <span className="text-cyber-cyan/70 text-sm">| 你可以观察所有玩家的状态</span>
              </div>
            </div>
          </div>
        )}

        <GameArea
          snakes={snakes}
          foods={foods}
          segments={segments}
          gridSize={gridSize}
          isSpectator={isSpectator}
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
                所有玩家准备就绪，游戏即将开始！
              </p>
              
              {/* Player snakes preview */}
              {snakes.length > 0 && (
                <div className="bg-cyber-darker/90 p-4 rounded-lg border border-cyber-cyan/30">
                  <p className="text-cyber-cyan mb-3">参与玩家：</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {snakes.map(snake => (
                      <div key={snake.id} className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: snake.color }}
                        ></div>
                        <span className={`text-sm ${snake.isPlayer ? 'text-cyber-green font-bold' : 'text-cyber-cyan'}`}>
                          {snake.name} {snake.isPlayer && '(你)'}
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
            <div className="text-center">
              <h2 className="text-6xl font-bold text-cyber-red neon-text mb-6">
                游戏结束
              </h2>
              
              {/* Final Scores */}
              {snakes.length > 0 && (
                <div className="bg-cyber-darker/90 p-6 rounded-lg border border-cyber-red/30 mb-6">
                  <h3 className="text-cyber-cyan text-xl mb-4">最终得分</h3>
                  <div className="space-y-2">
                    {snakes
                      .sort((a, b) => b.score - a.score)
                      .map((snake, index) => (
                        <div key={snake.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-cyber-yellow">#{index + 1}</span>
                            <div 
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: snake.color }}
                            ></div>
                            <span className={snake.isPlayer ? 'text-cyber-green font-bold' : 'text-cyber-cyan'}>
                              {snake.name}
                            </span>
                            {snake.isSpectator && (
                              <span className="text-cyber-cyan/50 text-xs">(观察者)</span>
                            )}
                          </div>
                          <span className="text-cyber-yellow font-bold">
                            {snake.score}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <p className="text-cyber-cyan/70">
                返回大厅重新开始游戏
              </p>
            </div>
          </div>
        )}

        {/* Spectator Controls Overlay */}
        {isSpectator && gameRunning && (
          <div className="absolute bottom-4 right-4 z-40">
            <div className="bg-cyber-darker/90 border border-cyber-cyan/30 rounded-lg p-4">
              <h3 className="text-cyber-cyan font-bold mb-2">观察者模式</h3>
              <div className="text-cyber-cyan/70 text-sm space-y-1">
                <p>• 无战争迷雾限制</p>
                <p>• 可查看所有玩家状态</p>
                <p>• 实时观察游戏进程</p>
              </div>
            </div>
          </div>
        )}

        {/* Death Notification for Spectator Mode Entry */}
        {snakes.find(snake => snake.isPlayer && !snake.isAlive && !snake.isSpectator) && gameRunning && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="bg-cyber-darker/95 border border-cyber-red/50 rounded-lg p-6 text-center">
              <h3 className="text-cyber-red text-xl font-bold mb-4">你已死亡</h3>
              <p className="text-cyber-cyan/70 mb-4">
                在测试模式下，你已自动进入观察者模式
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-cyber-cyan rounded-full animate-pulse"></div>
                <span className="text-cyber-cyan">正在观察其他玩家...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
