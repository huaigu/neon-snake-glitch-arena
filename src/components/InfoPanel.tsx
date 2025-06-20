
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Snake } from '../hooks/useSnakeGame';
import { useNavigate } from 'react-router-dom';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { AlertTriangle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface InfoPanelProps {
  snakes: Snake[];
  gameRunning: boolean;
  gameOver: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({
  snakes,
  gameRunning,
  gameOver,
  onStart,
  onPause,
  onReset
}) => {
  const navigate = useNavigate();
  const { user } = useWeb3Auth();
  
  // Sort by score first, then by segments length
  const sortedSnakes = [...snakes].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return b.segments.length - a.segments.length;
  });
  
  const playerSnake = snakes.find(snake => snake.isPlayer);

  const handleReturnToLobby = () => {
    navigate('/lobby');
  };

  return (
    <div className="w-72 h-screen p-3 space-y-3 bg-cyber-darker border-r border-cyber-cyan/30">
      {/* Header - 压缩 */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-cyber-cyan neon-text mb-1">
          CYBER SNAKE
        </h1>
        <div className="h-0.5 bg-gradient-to-r from-transparent via-cyber-cyan to-transparent"></div>
      </div>

      {/* Return to Lobby Button */}
      <Card className="cyber-panel p-3">
        <Button 
          onClick={handleReturnToLobby}
          className="w-full bg-cyber-purple hover:bg-cyber-purple/80 text-white font-bold neon-border text-sm"
        >
          RETURN TO LOBBY
        </Button>
      </Card>

      {/* Player Stats - 更紧凑 */}
      {playerSnake && (
        <Card className="cyber-panel p-3">
          <h2 className="text-md font-semibold text-cyber-cyan mb-2 neon-text">PLAYER STATUS</h2>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm">Name:</span>
              <span className="text-cyber-cyan font-bold text-sm">{playerSnake.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm">Score:</span>
              <div className="flex items-center gap-1">
                <span className="text-cyber-green font-bold text-lg">{playerSnake.score}</span>
                {user?.isGuest && playerSnake.score > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertTriangle className="w-4 h-4 text-cyber-orange" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-cyber-darker border-cyber-orange/50">
                        <p className="text-cyber-orange text-xs">Guest scores not saved</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm">Length:</span>
              <span className="text-cyber-orange font-bold text-sm">{playerSnake.segments.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm">Status:</span>
              <span className={`font-bold text-sm ${playerSnake.isAlive ? 'text-cyber-green' : 'text-cyber-pink'}`}>
                {playerSnake.isAlive ? 'ALIVE' : 'DEAD'}
              </span>
            </div>
            {playerSnake.segments.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">Position:</span>
                <span className="text-cyber-cyan font-mono text-xs">
                  ({playerSnake.segments[0].x}, {playerSnake.segments[0].y})
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Leaderboard - 压缩 */}
      <Card className="cyber-panel p-3 flex-1">
        <h2 className="text-md font-semibold text-cyber-purple mb-2 neon-text">LEADERBOARD</h2>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {sortedSnakes.map((snake, index) => (
            <div 
              key={snake.id}
              className={`flex items-center justify-between p-1.5 rounded border text-sm ${
                snake.isPlayer ? 'border-cyber-cyan bg-cyber-cyan/10' : 
                snake.isAlive ? 'border-gray-600 bg-gray-800/50' : 'border-gray-700 bg-gray-900/30'
              } ${!snake.isAlive ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center space-x-2">
                <span className={`font-bold ${
                  snake.isAlive ? 'text-cyber-orange' : 'text-gray-500'
                }`}>#{index + 1}</span>
                <div 
                  className="w-3 h-3 rounded snake-segment"
                  style={{ 
                    backgroundColor: snake.isAlive ? snake.color : '#6b7280',
                    opacity: snake.isAlive ? 1 : 0.5
                  }}
                ></div>
                <span className={`font-mono text-xs ${
                  snake.isPlayer ? 'text-cyber-cyan' : 
                  snake.isAlive ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  {snake.name}
                  {!snake.isAlive && (
                    <span className="ml-1 text-xs text-gray-600">💀</span>
                  )}
                </span>
              </div>
              <div className="text-right">
                <div className={`font-bold text-sm ${
                  snake.isAlive ? 'text-cyber-green' : 'text-gray-500'
                }`}>{snake.score}</div>
                <div className={`text-xs ${
                  snake.isAlive ? 'text-gray-400' : 'text-gray-600'
                }`}>{snake.segments.length}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Controls Info - 压缩 */}
      <Card className="cyber-panel p-3">
        <h2 className="text-md font-semibold text-cyber-cyan mb-2 neon-text">CONTROLS</h2>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="flex items-center space-x-1">
            <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">W</kbd>
            <span className="text-gray-300">Up</span>
          </div>
          <div className="flex items-center space-x-1">
            <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">S</kbd>
            <span className="text-gray-300">Down</span>
          </div>
          <div className="flex items-center space-x-1">
            <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">A</kbd>
            <span className="text-gray-300">Left</span>
          </div>
          <div className="flex items-center space-x-1">
            <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">D</kbd>
            <span className="text-gray-300">Right</span>
          </div>
        </div>
        <div className="mt-1 text-xs text-gray-400">
          Or arrow keys / swipe on mobile
        </div>
      </Card>

      {gameOver && (
        <Card className="cyber-panel p-3 border-cyber-pink">
          <div className="text-center">
            <h3 className="text-lg font-bold text-cyber-pink neon-text mb-1">GAME OVER</h3>
            <div className="text-gray-300 text-sm">
              <div className="flex items-center justify-center gap-1">
                <span>Final Score:</span>
                <span className="text-cyber-green font-bold">{playerSnake?.score || 0}</span>
                {user?.isGuest && (playerSnake?.score || 0) > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertTriangle className="w-4 h-4 text-cyber-orange" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-cyber-darker border-cyber-orange/50">
                        <p className="text-cyber-orange text-xs">Guest scores not saved</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              {user?.isGuest && (playerSnake?.score || 0) > 0 && (
                <div className="text-cyber-orange text-xs mt-1 text-center">
                  Score not saved - Connect wallet for full features
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
