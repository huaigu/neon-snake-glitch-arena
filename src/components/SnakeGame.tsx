
import React from 'react';
import { useSnakeGame } from '../hooks/useSnakeGame';
import { useIsMobile } from '../hooks/use-mobile';
import { InfoPanel } from './InfoPanel';
import { GameArea } from './GameArea';
import { Timer, Zap, TrendingUp, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    speedMultiplier,
    segmentCountdown,
    speedBoostCountdown
  } = useSnakeGame();

  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const playerSnake = snakes.find(snake => snake.isPlayer);

  return (
    <div className="min-h-screen bg-cyber-darker flex flex-col">
      {/* Desktop Layout - Info Panel on side */}
      {!isMobile && (
        <div className="flex flex-1">
          <InfoPanel
            snakes={snakes}
            gameRunning={gameRunning}
            gameOver={gameOver}
            onStart={startGame}
            onPause={pauseGame}
            onReset={resetGame}
          />
          <div className="relative flex-1 flex flex-col">
            {/* 游戏信息面板 - 桌面版 - 更紧凑 */}
            {gameRunning && (
              <div className="bg-cyber-darker/95 border-b border-cyber-cyan/30 px-4 py-2">
                <div className="flex justify-between items-center gap-4">
                  {/* Segments 倒计时 */}
                  <div className="flex items-center gap-2 bg-cyber-darker/60 border border-cyber-purple/50 rounded px-3 py-1">
                    <Timer className="w-4 h-4 text-cyber-purple" />
                    <span className="text-cyber-purple font-bold">{segmentCountdown}s</span>
                  </div>

                  {/* 当前速度 */}
                  <div className="flex items-center gap-2 bg-cyber-darker/60 border border-cyber-yellow/50 rounded px-3 py-1">
                    <Zap className="w-4 h-4 text-cyber-yellow" />
                    <span className="text-cyber-yellow font-bold">{speedMultiplier.toFixed(1)}x</span>
                  </div>

                  {/* 下一次速度提升倒计时 */}
                  <div className="flex items-center gap-2 bg-cyber-darker/60 border border-cyber-green/50 rounded px-3 py-1">
                    <TrendingUp className="w-4 h-4 text-cyber-green" />
                    <span className="text-cyber-green font-bold">{speedBoostCountdown}s</span>
                  </div>

                  {/* 当前长度 */}
                  <div className="flex items-center gap-2 bg-cyber-darker/60 border border-cyber-cyan/50 rounded px-3 py-1">
                    <Activity className="w-4 h-4 text-cyber-cyan" />
                    <span className="text-cyber-cyan font-bold">
                      {playerSnake ? playerSnake.segments.length : 0}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 游戏区域容器 */}
            <div className="relative flex-1">
              {/* Spectator Mode Indicator */}
              {isSpectator && gameRunning && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40">
                  <div className="bg-cyber-darker/90 border border-cyber-cyan/50 rounded-lg px-3 py-1">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-2 h-2 bg-cyber-cyan rounded-full animate-pulse"></div>
                      <span className="text-cyber-cyan font-bold text-sm">Spectator</span>
                    </div>
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

              {/* Death Notification for Spectator Mode Entry */}
              {snakes.find(snake => snake.isPlayer && !snake.isAlive && !snake.isSpectator) && gameRunning && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                  <div className="bg-cyber-darker/95 border border-cyber-red/50 rounded-lg p-4 text-center">
                    <h3 className="text-cyber-red text-lg font-bold mb-2">You Died</h3>
                    <p className="text-cyber-cyan/70 mb-2 text-sm">
                      Entered spectator mode
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-cyber-cyan rounded-full animate-pulse"></div>
                      <span className="text-cyber-cyan text-xs">Watching...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Layout - 极简设计 */}
      {isMobile && (
        <>
          {/* Mobile Top Bar - 压缩到最小 */}
          <div className="bg-cyber-darker border-b border-cyber-cyan/30 p-2 flex justify-between items-center">
            <div className="text-cyber-cyan font-bold text-sm">CYBER SNAKE</div>
            <div className="flex items-center gap-3">
              {snakes.find(s => s.isPlayer) && (
                <div className="text-cyber-green font-bold text-sm">
                  {snakes.find(s => s.isPlayer)?.score || 0}
                </div>
              )}
              <button 
                onClick={() => navigate('/lobby')}
                className="bg-cyber-purple hover:bg-cyber-purple/80 text-white text-xs font-bold px-2 py-1 rounded"
              >
                LOBBY
              </button>
            </div>
          </div>

          {/* 游戏信息面板 - 移动版 - 超级紧凑 */}
          {gameRunning && (
            <div className="bg-cyber-darker/95 border-b border-cyber-cyan/30 px-2 py-1">
              <div className="flex justify-between items-center">
                {/* Segments 倒计时 */}
                <div className="flex items-center gap-1">
                  <Timer className="w-3 h-3 text-cyber-purple" />
                  <span className="text-cyber-purple font-bold text-xs">{segmentCountdown}s</span>
                </div>

                {/* 当前速度 */}
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyber-yellow" />
                  <span className="text-cyber-yellow font-bold text-xs">{speedMultiplier.toFixed(1)}x</span>
                </div>

                {/* 下一次速度提升倒计时 */}
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-cyber-green" />
                  <span className="text-cyber-green font-bold text-xs">{speedBoostCountdown}s</span>
                </div>

                {/* 当前长度 */}
                <div className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-cyber-cyan" />
                  <span className="text-cyber-cyan font-bold text-xs">
                    {playerSnake ? playerSnake.segments.length : 0}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Game Area Container */}
          <div className="relative flex-1">
            {/* Spectator Mode Indicator */}
            {isSpectator && gameRunning && (
              <div className="absolute top-2 left-2 right-2 z-40">
                <div className="bg-cyber-darker/90 border border-cyber-cyan/50 rounded px-2 py-1">
                  <div className="flex items-center gap-1 justify-center">
                    <div className="w-1 h-1 bg-cyber-cyan rounded-full animate-pulse"></div>
                    <span className="text-cyber-cyan font-bold text-xs">Spectator</span>
                  </div>
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

            {/* Mobile Controls Hint - 移到右下角 */}
            {isMobile && gameRunning && !isSpectator && (
              <div className="absolute bottom-2 right-2 z-40">
                <div className="bg-cyber-darker/90 border border-cyber-cyan/30 rounded px-2 py-1">
                  <span className="text-cyber-cyan/70 text-xs">Swipe</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Countdown Overlay - Only shown once */}
      {showCountdown && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="text-center p-4">
            <h2 className="text-2xl md:text-3xl font-bold text-cyber-cyan neon-text mb-3">
              Game Starting
            </h2>
            <div className="text-4xl md:text-6xl font-bold text-cyber-green neon-text animate-pulse mb-3">
              {countdown}
            </div>
            <p className="text-cyber-cyan/70 mb-4 text-sm">
              All players ready!
            </p>
            
            {/* Player snakes preview - 紧凑版 */}
            {snakes.length > 0 && (
              <div className="bg-cyber-darker/90 p-2 rounded border border-cyber-cyan/30">
                <p className="text-cyber-cyan mb-1 text-xs">Players:</p>
                <div className="flex flex-wrap justify-center gap-1">
                  {snakes.map(snake => (
                    <div key={snake.id} className="flex items-center gap-1">
                      <div 
                        className="w-2 h-2 md:w-3 md:h-3 rounded"
                        style={{ backgroundColor: snake.color }}
                      ></div>
                      <span className={`text-xs ${snake.isPlayer ? 'text-cyber-green font-bold' : 'text-cyber-cyan'}`}>
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
          <div className="text-center p-4 max-w-4xl w-full max-h-screen overflow-y-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-cyber-red neon-text mb-4">
              Game Over
            </h2>
            
            {/* Final Scores */}
            {snakes.length > 0 && (
              <div className="bg-cyber-darker/90 p-3 md:p-4 rounded-lg border border-cyber-red/30 mb-4">
                <h3 className="text-cyber-cyan text-md md:text-lg mb-4">Final Results</h3>
                
                {/* Top 3 Podium */}
                <div className="mb-6">
                  <h4 className="text-cyber-yellow text-sm mb-3">🏆 Top 3</h4>
                  <div className="flex justify-center items-end gap-2 mb-4">
                    {snakes
                      .sort((a, b) => b.score - a.score)
                      .slice(0, 3)
                      .map((snake, index) => {
                        const position = index + 1;
                        const heights = ['h-16', 'h-12', 'h-10'];
                        const colors = ['text-yellow-400', 'text-gray-300', 'text-orange-600'];
                        const bgColors = ['bg-yellow-400/20', 'bg-gray-300/20', 'bg-orange-600/20'];
                        const medals = ['🥇', '🥈', '🥉'];
                        
                        return (
                          <div key={snake.id} className={`flex flex-col items-center ${index === 1 ? 'order-first' : ''}`}>
                            <div className="text-lg mb-1">{medals[index]}</div>
                            <div className={`${bgColors[index]} border border-current ${colors[index]} rounded p-2 ${heights[index]} flex flex-col justify-center items-center min-w-[60px]`}>
                              <div 
                                className="w-4 h-4 rounded-full mb-1"
                                style={{ backgroundColor: snake.color }}
                              ></div>
                              <div className={`font-bold text-xs ${snake.isPlayer ? 'text-cyber-green' : ''}`}>
                                {snake.name}
                                {snake.isPlayer && <div className="text-xs text-cyber-green">(You)</div>}
                              </div>
                              <div className="text-sm font-bold mt-1">{snake.score}</div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
                
                {/* Current Player Rank (if not in top 3) */}
                {(() => {
                  const sortedSnakes = snakes.sort((a, b) => b.score - a.score);
                  const playerSnake = sortedSnakes.find(snake => snake.isPlayer);
                  const playerRank = sortedSnakes.findIndex(snake => snake.isPlayer) + 1;
                  
                  if (playerSnake && playerRank > 3) {
                    return (
                      <div className="mb-4">
                        <h4 className="text-cyber-green text-sm mb-2">Your Ranking</h4>
                        <div className="bg-cyber-green/10 border border-cyber-green/50 rounded p-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-cyber-green">#{playerRank}</span>
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: playerSnake.color }}
                              ></div>
                              <span className="text-cyber-green font-bold text-sm">{playerSnake.name} (You)</span>
                            </div>
                            <span className="text-cyber-green font-bold text-lg">{playerSnake.score}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                
                {/* Complete Leaderboard - 紧凑版 */}
                <div className="mb-3">
                  <h4 className="text-cyber-purple text-sm mb-2">Complete Leaderboard</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {snakes
                      .sort((a, b) => b.score - a.score)
                      .map((snake, index) => (
                        <div 
                          key={snake.id} 
                          className={`flex items-center justify-between p-2 rounded border text-xs ${
                            snake.isPlayer 
                              ? 'border-cyber-green bg-cyber-green/10' 
                              : 'border-gray-600 bg-gray-800/30'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${
                              index < 3 ? 'text-cyber-yellow' : 'text-cyber-purple'
                            }`}>
                              #{index + 1}
                            </span>
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: snake.color }}
                            ></div>
                            <span className={`${
                              snake.isPlayer ? 'text-cyber-green font-bold' : 'text-cyber-cyan'
                            }`}>
                              {snake.name}
                              {snake.isPlayer && ' (You)'}
                            </span>
                          </div>
                          <span className="text-cyber-yellow font-bold">
                            {snake.score}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-cyber-cyan/70 text-sm">
                Return to lobby to start a new game.
              </p>
              
              {/* Action Buttons */}
              <div className="flex justify-center">
                <button 
                  onClick={() => navigate('/lobby')}
                  className="bg-cyber-cyan hover:bg-cyber-cyan/80 text-cyber-darker font-bold py-2 px-4 rounded neon-border transition-all text-sm"
                >
                  Return to Lobby
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
