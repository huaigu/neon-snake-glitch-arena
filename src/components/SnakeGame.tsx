import React from 'react';
import { useSnakeGame } from '../hooks/useSnakeGame';
import { useIsMobile } from '../hooks/use-mobile';
import { InfoPanel } from './InfoPanel';
import { GameArea } from './GameArea';
import { Timer, Zap, TrendingUp, Target, Activity } from 'lucide-react';
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
            {/* 游戏信息面板 - 桌面版 */}
            {gameRunning && (
              <div className="bg-cyber-darker/95 border-b border-cyber-cyan/30 px-6 py-3">
                <div className="grid grid-cols-4 gap-6">
                  {/* Segments 倒计时 */}
                  <div className="flex items-center gap-3 bg-cyber-darker/60 border border-cyber-purple/50 rounded-lg px-4 py-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-cyber-purple/20 rounded-full">
                      <Timer className="w-4 h-4 text-cyber-purple" />
                    </div>
                    <div>
                      <div className="text-xs text-cyber-purple/70 uppercase tracking-wide">Segments Drop</div>
                      <div className="text-cyber-purple font-bold text-lg">{segmentCountdown}s</div>
                    </div>
                  </div>

                  {/* 当前速度 */}
                  <div className="flex items-center gap-3 bg-cyber-darker/60 border border-cyber-yellow/50 rounded-lg px-4 py-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-cyber-yellow/20 rounded-full">
                      <Zap className="w-4 h-4 text-cyber-yellow" />
                    </div>
                    <div>
                      <div className="text-xs text-cyber-yellow/70 uppercase tracking-wide">Current Speed</div>
                      <div className="text-cyber-yellow font-bold text-lg">{speedMultiplier.toFixed(1)}x</div>
                    </div>
                  </div>

                  {/* 下一次速度提升倒计时 */}
                  <div className="flex items-center gap-3 bg-cyber-darker/60 border border-cyber-green/50 rounded-lg px-4 py-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-cyber-green/20 rounded-full">
                      <TrendingUp className="w-4 h-4 text-cyber-green" />
                    </div>
                    <div>
                      <div className="text-xs text-cyber-green/70 uppercase tracking-wide">Next Speed Up</div>
                      <div className="text-cyber-green font-bold text-lg">{speedBoostCountdown}s</div>
                    </div>
                  </div>

                  {/* 当前长度 */}
                  <div className="flex items-center gap-3 bg-cyber-darker/60 border border-cyber-cyan/50 rounded-lg px-4 py-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-cyber-cyan/20 rounded-full">
                      <Activity className="w-4 h-4 text-cyber-cyan" />
                    </div>
                    <div>
                      <div className="text-xs text-cyber-cyan/70 uppercase tracking-wide">Snake Length</div>
                      <div className="text-cyber-cyan font-bold text-lg">
                        {playerSnake ? playerSnake.segments.length : 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 游戏区域容器 */}
            <div className="relative flex-1">
              {/* Spectator Mode Indicator */}
              {isSpectator && gameRunning && (
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-40">
                  <div className="bg-cyber-darker/90 border border-cyber-cyan/50 rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-3 h-3 bg-cyber-cyan rounded-full animate-pulse"></div>
                      <span className="text-cyber-cyan font-bold text-sm">Spectator Mode</span>
                      <span className="text-cyber-cyan/70 text-xs">| Watch all players</span>
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
        </div>
      )}

      {/* Mobile Layout - Info Panel on top */}
      {isMobile && (
        <>
          {/* Mobile Top Bar */}
          <div className="bg-cyber-darker border-b border-cyber-cyan/30 p-2">
            <div className="flex justify-between items-center">
              <div className="text-cyber-cyan font-bold">CYBER SNAKE</div>
              {snakes.find(s => s.isPlayer) && (
                <div className="text-cyber-green font-bold">
                  Score: {snakes.find(s => s.isPlayer)?.score || 0}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Info Panel */}
          <div className="bg-cyber-darker border-b border-cyber-cyan/30 p-2">
            <MobileInfoPanel 
              snakes={snakes}
              gameRunning={gameRunning}
              gameOver={gameOver}
              onStart={startGame}
              onPause={pauseGame}
              onReset={resetGame}
            />
          </div>

          {/* 游戏信息面板 - 移动版 */}
          {gameRunning && (
            <div className="bg-cyber-darker/95 border-b border-cyber-cyan/30 px-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                {/* Segments 倒计时 */}
                <div className="flex items-center gap-2 bg-cyber-darker/60 border border-cyber-purple/50 rounded-lg px-3 py-1">
                  <Timer className="w-3 h-3 text-cyber-purple" />
                  <div>
                    <div className="text-xs text-cyber-purple/70">Segments</div>
                    <div className="text-cyber-purple font-bold text-sm">{segmentCountdown}s</div>
                  </div>
                </div>

                {/* 当前速度 */}
                <div className="flex items-center gap-2 bg-cyber-darker/60 border border-cyber-yellow/50 rounded-lg px-3 py-1">
                  <Zap className="w-3 h-3 text-cyber-yellow" />
                  <div>
                    <div className="text-xs text-cyber-yellow/70">Speed</div>
                    <div className="text-cyber-yellow font-bold text-sm">{speedMultiplier.toFixed(1)}x</div>
                  </div>
                </div>

                {/* 下一次速度提升倒计时 */}
                <div className="flex items-center gap-2 bg-cyber-darker/60 border border-cyber-green/50 rounded-lg px-3 py-1">
                  <TrendingUp className="w-3 h-3 text-cyber-green" />
                  <div>
                    <div className="text-xs text-cyber-green/70">Speed Up</div>
                    <div className="text-cyber-green font-bold text-sm">{speedBoostCountdown}s</div>
                  </div>
                </div>

                {/* 当前长度 */}
                <div className="flex items-center gap-2 bg-cyber-darker/60 border border-cyber-cyan/50 rounded-lg px-3 py-1">
                  <Activity className="w-3 h-3 text-cyber-cyan" />
                  <div>
                    <div className="text-xs text-cyber-cyan/70">Length</div>
                    <div className="text-cyber-cyan font-bold text-sm">
                      {playerSnake ? playerSnake.segments.length : 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Game Area Container */}
          <div className="relative flex-1">
            {/* Spectator Mode Indicator */}
            {isSpectator && gameRunning && (
              <div className="absolute top-4 left-2 right-2 z-40">
                <div className="bg-cyber-darker/90 border border-cyber-cyan/50 rounded-lg px-2 py-1">
                  <div className="flex items-center gap-1 justify-center">
                    <div className="w-2 h-2 bg-cyber-cyan rounded-full animate-pulse"></div>
                    <span className="text-cyber-cyan font-bold text-xs">Spectator Mode</span>
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

            {/* Mobile Swipe Instructions */}
            {isMobile && gameRunning && !isSpectator && (
              <div className="absolute bottom-4 left-4 right-4 z-40">
                <div className="bg-cyber-darker/90 border border-cyber-cyan/30 rounded-lg p-2">
                  <div className="text-center">
                    <h3 className="text-cyber-cyan font-bold text-xs mb-1">Swipe Controls</h3>
                    <div className="text-cyber-cyan/70 text-xs">
                      <p>Swipe to change direction</p>
                    </div>
                  </div>
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

    </div>
  );
};

// Mobile-optimized version of InfoPanel
const MobileInfoPanel: React.FC<{
  snakes: any[];
  gameRunning: boolean;
  gameOver: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}> = ({ snakes, gameRunning, gameOver }) => {
  const navigate = useNavigate();

  // Sort snakes by score
  const sortedSnakes = [...snakes].sort((a, b) => b.score - a.score);
  const playerSnake = snakes.find(snake => snake.isPlayer);

  return (
    <div className="space-y-2">
      {/* Player stats and controls in a row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {playerSnake && (
            <>
              <div 
                className="w-3 h-3 rounded" 
                style={{ backgroundColor: playerSnake.color }}
              ></div>
              <span className="text-cyber-cyan text-sm">
                {playerSnake.name}
              </span>
            </>
          )}
        </div>

        {/* Return to Lobby Button */}
        <button 
          onClick={() => navigate('/lobby')}
          className="bg-cyber-purple hover:bg-cyber-purple/80 text-white text-xs font-bold px-3 py-1 rounded"
        >
          LOBBY
        </button>
      </div>

      {/* Mini Leaderboard */}
      <div className="bg-cyber-darker/50 rounded p-1">
        <div className="text-xs text-cyber-purple mb-1">LEADERBOARD</div>
        <div className="grid grid-cols-3 gap-1 text-xs">
          {sortedSnakes.slice(0, 3).map((snake, index) => (
            <div 
              key={snake.id} 
              className={`flex items-center justify-between ${
                snake.isPlayer ? 'bg-cyber-cyan/10' : 'bg-gray-800/30'
              } rounded px-1`}
            >
              <div className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded" 
                  style={{ backgroundColor: snake.color }}
                ></div>
                <span className="text-gray-300 truncate" style={{ maxWidth: '50px' }}>
                  {snake.name}
                </span>
              </div>
              <span className="text-cyber-green text-xs">{snake.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Basic Controls Reference */}
      <div className="text-center text-xs text-cyber-cyan/70">
        WASD/Arrow Keys or Swipe to move
      </div>
    </div>
  );
};
