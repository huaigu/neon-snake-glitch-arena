import React from 'react';
import { useSnakeGame } from '../hooks/useSnakeGame';
import { useIsMobile } from '../hooks/use-mobile';
import { useRoomContext } from '../contexts/RoomContext';
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

  const { isSpectator: isExternalSpectator } = useRoomContext();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const playerSnake = snakes.find(snake => snake.isPlayer);

  return (
    <div className="h-screen bg-cyber-darker flex flex-col overflow-hidden">
      {/* Desktop Layout - Info Panel on side */}
      {!isMobile && (
        <div className="flex h-full">
          <div className="flex flex-col min-w-0">
            <InfoPanel
              snakes={snakes}
              gameRunning={gameRunning}
              gameOver={gameOver}
              onStart={startGame}
              onPause={pauseGame}
              onReset={resetGame}
            />
          </div>
          
          <div className="relative flex-1 flex flex-col overflow-hidden min-h-0">

            {/* PC游戏信息面板 - 紧密水平排列 */}
            {(
              <div className="bg-cyber-darker/95 border-b border-cyber-cyan/30 px-4 py-2">
                <div className="flex items-center justify-center gap-4">
                  {/* Segments 倒计时 */}
                  <div className="flex items-center gap-2 bg-cyber-darker/80 border border-cyber-purple/60 rounded-lg px-3 py-1.5">
                    <Timer className="w-4 h-4 text-cyber-purple" />
                    <span className="text-xs text-cyber-purple/70">Power-ups</span>
                    <span className="text-cyber-purple font-bold text-sm">{segmentCountdown}s</span>
                  </div>

                  {/* 当前速度 */}
                  <div className="flex items-center gap-2 bg-cyber-darker/80 border border-cyber-yellow/60 rounded-lg px-3 py-1.5">
                    <Zap className="w-4 h-4 text-cyber-yellow" />
                    <span className="text-xs text-cyber-yellow/70">Speed</span>
                    <span className="text-cyber-yellow font-bold text-sm">{speedMultiplier.toFixed(1)}x</span>
                  </div>

                  {/* 下一次速度提升倒计时 */}
                  <div className="flex items-center gap-2 bg-cyber-darker/80 border border-cyber-green/60 rounded-lg px-3 py-1.5">
                    <TrendingUp className="w-4 h-4 text-cyber-green" />
                    <span className="text-xs text-cyber-green/70">Speed Boost</span>
                    <span className="text-cyber-green font-bold text-sm">{speedBoostCountdown}s</span>
                  </div>

                  {/* 当前长度 */}
                  <div className="flex items-center gap-2 bg-cyber-darker/80 border border-cyber-cyan/60 rounded-lg px-3 py-1.5">
                    <Activity className="w-4 h-4 text-cyber-cyan" />
                    <span className="text-xs text-cyber-cyan/70">Length</span>
                    <span className="text-cyber-cyan font-bold text-sm">
                      {playerSnake ? playerSnake.segments.length : 0}
                    </span>
                  </div>

                  {/* Power-up Segments 图例 */}
                  <div className="flex items-center gap-2 bg-cyber-darker/80 border border-cyber-cyan/60 rounded-lg px-3 py-1.5">
                    <div className="flex items-center gap-1">
                      <div 
                        className="w-4 h-4 rounded flex items-center justify-center text-xs font-bold text-black animate-pulse"
                        style={{ backgroundColor: '#00ffff' }}
                      >
                        1
                      </div>
                      <div 
                        className="w-4 h-4 rounded flex items-center justify-center text-xs font-bold text-black animate-pulse"
                        style={{ backgroundColor: '#ffff00' }}
                      >
                        2
                      </div>
                      <div 
                        className="w-4 h-4 rounded flex items-center justify-center text-xs font-bold text-black animate-pulse animate-bounce"
                        style={{ backgroundColor: '#ff00ff' }}
                      >
                        3
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Spectator Mode Indicator - 游戏区域正上方 */}
            {isSpectator && (
              <div className="bg-cyber-darker/95 border-b border-cyber-cyan/50 px-4 py-2">
                <div className="flex items-center gap-2 justify-center">
                  <div className="w-3 h-3 bg-cyber-cyan rounded-full animate-pulse"></div>
                  <span className="text-cyber-cyan font-bold">Spectator Mode</span>
                  {/* 区分外部观察者和死亡观察者 */}
                  {isExternalSpectator ? (
                    <span className="text-cyber-cyan/70 text-sm ml-2">- Joined During Game</span>
                  ) : snakes.find(snake => snake.isPlayer && !snake.isAlive) ? (
                    <span className="text-cyber-cyan/70 text-sm ml-2">- Died in Game</span>
                  ) : (
                    <span className="text-cyber-cyan/70 text-sm ml-2">- Watching</span>
                  )}
                </div>
              </div>
            )}

            {/* 游戏区域容器 */}
            <div className="relative flex-1 flex flex-col overflow-hidden min-h-0">
              <GameArea
                snakes={snakes}
                foods={foods}
                segments={segments}
                isSpectator={isSpectator}
              />

              {/* Death Notification for Spectator Mode Entry */}
              {snakes.find(snake => snake.isPlayer && !snake.isAlive && !snake.isSpectator) && gameRunning && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                  <div className="bg-cyber-darker/95 border border-cyber-red/50 rounded-lg p-6 text-center">
                    <h3 className="text-cyber-red text-xl font-bold mb-3">You Died</h3>
                    <p className="text-cyber-cyan/70 mb-3">
                      Entered spectator mode
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-cyber-cyan rounded-full animate-pulse"></div>
                      <span className="text-cyber-cyan">Watching other players...</span>
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
        <div className="h-full flex flex-col overflow-hidden">
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

          {/* Mobile Segment Legend - 简化文字 */}
          <div className="bg-cyber-darker/95 backdrop-blur-sm border-b border-cyber-cyan/50 px-3 py-2">
            <div className="text-xs text-cyber-cyan font-bold mb-1 text-center">POWER-UPS</div>
            <div className="flex justify-between text-xs">
              <div className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded flex items-center justify-center text-xs font-bold text-black animate-pulse"
                  style={{ backgroundColor: '#00ffff', fontSize: '8px' }}
                >
                  1
                </div>
                <span className="text-cyber-green">+1</span>
              </div>
              <div className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded flex items-center justify-center text-xs font-bold text-black animate-pulse"
                  style={{ backgroundColor: '#ffff00', fontSize: '8px' }}
                >
                  2
                </div>
                <span className="text-cyber-green">+2</span>
              </div>
              <div className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded flex items-center justify-center text-xs font-bold text-black animate-pulse animate-bounce"
                  style={{ backgroundColor: '#ff00ff', fontSize: '8px' }}
                >
                  3
                </div>
                <span className="text-cyber-green">+3</span>
              </div>
            </div>
          </div>

          {/* 游戏信息面板 - 移动版 - 紧凑样式 */}
          {(gameRunning || isSpectator) && (
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

          {/* Spectator Mode Indicator - 移动端游戏区域上方 */}
          {isSpectator && (
            <div className="bg-cyber-darker/95 border-b border-cyber-cyan/50 px-2 py-1">
              <div className="flex items-center gap-1 justify-center">
                <div className="w-1 h-1 bg-cyber-cyan rounded-full animate-pulse"></div>
                <span className="text-cyber-cyan font-bold text-xs">Spectator Mode</span>
              </div>
            </div>
          )}

          {/* Game Area Container */}
          <div className="relative flex-1 overflow-hidden">
            <GameArea
              snakes={snakes}
              foods={foods}
              segments={segments}
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
        </div>
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
                      {/* NFT持有者显示彩虹色块，普通玩家显示单色 */}
                      {snake.hasNFT ? (
                        <div className="w-2 h-2 md:w-3 md:h-3 rounded animate-pulse"
                             style={{
                               background: 'linear-gradient(45deg, #FF0080, #FFFF00, #00FF80, #00FFFF, #8000FF)',
                               backgroundSize: '200% 200%',
                               animation: 'rainbow-shift 2s ease-in-out infinite'
                             }}>
                        </div>
                      ) : (
                        <div 
                          className="w-2 h-2 md:w-3 md:h-3 rounded"
                          style={{ backgroundColor: snake.color }}
                        ></div>
                      )}
                      <span className={`text-xs ${snake.isPlayer ? 'text-cyber-green font-bold' : 'text-cyber-cyan'}`}>
                        {snake.hasNFT && '👑'} {snake.name} {snake.isPlayer && '(You)'}
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
                              {/* NFT持有者显示彩虹色块，普通玩家显示单色 */}
                              {snake.hasNFT ? (
                                <div className="w-4 h-4 rounded-full mb-1 animate-pulse"
                                     style={{
                                       background: 'linear-gradient(45deg, #FF0080, #FFFF00, #00FF80, #00FFFF, #8000FF)',
                                       backgroundSize: '200% 200%',
                                       animation: 'rainbow-shift 2s ease-in-out infinite'
                                     }}>
                                </div>
                              ) : (
                                <div 
                                  className="w-4 h-4 rounded-full mb-1"
                                  style={{ backgroundColor: snake.color }}
                                ></div>
                              )}
                              <div className={`font-bold text-xs ${snake.isPlayer ? 'text-cyber-green' : ''}`}>
                                {snake.hasNFT && '👑'} {snake.name}
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
                              {/* NFT持有者显示彩虹色块，普通玩家显示单色 */}
                              {playerSnake.hasNFT ? (
                                <div className="w-4 h-4 rounded-full animate-pulse"
                                     style={{
                                       background: 'linear-gradient(45deg, #FF0080, #FFFF00, #00FF80, #00FFFF, #8000FF)',
                                       backgroundSize: '200% 200%',
                                       animation: 'rainbow-shift 2s ease-in-out infinite'
                                     }}>
                                </div>
                              ) : (
                                <div 
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: playerSnake.color }}
                                ></div>
                              )}
                              <span className="text-cyber-green font-bold text-sm">
                                {playerSnake.hasNFT && '👑'} {playerSnake.name} (You)
                              </span>
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
                            {/* NFT持有者显示彩虹色块，普通玩家显示单色 */}
                            {snake.hasNFT ? (
                              <div className="w-3 h-3 rounded-full animate-pulse"
                                   style={{
                                     background: 'linear-gradient(45deg, #FF0080, #FFFF00, #00FF80, #00FFFF, #8000FF)',
                                     backgroundSize: '200% 200%',
                                     animation: 'rainbow-shift 2s ease-in-out infinite'
                                   }}>
                              </div>
                            ) : (
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: snake.color }}
                              ></div>
                            )}
                            <span className={`${
                              snake.isPlayer ? 'text-cyber-green font-bold' : 'text-cyber-cyan'
                            }`}>
                              {snake.hasNFT && '👑'} {snake.name}
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
