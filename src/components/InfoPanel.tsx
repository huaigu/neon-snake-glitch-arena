
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Snake } from '../hooks/useSnakeGame';
import { useNavigate } from 'react-router-dom';

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
    <div className="w-80 h-screen p-4 space-y-4 bg-cyber-darker border-r border-cyber-cyan/30">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-cyber-cyan neon-text mb-2">
          CYBER SNAKE
        </h1>
        <div className="h-1 bg-gradient-to-r from-transparent via-cyber-cyan to-transparent"></div>
      </div>

      {/* Return to Lobby Button */}
      <Card className="cyber-panel p-4">
        <Button 
          onClick={handleReturnToLobby}
          className="w-full bg-cyber-purple hover:bg-cyber-purple/80 text-white font-bold neon-border"
        >
          RETURN TO LOBBY
        </Button>
      </Card>

      {/* Power-up Guide */}
      <Card className="cyber-panel p-4">
        <h2 className="text-lg font-semibold text-cyber-cyan mb-3 neon-text">POWER-UPS</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-400 rounded-sm"></div>
              <span className="text-gray-300 text-sm">Food</span>
            </div>
            <span className="text-cyber-green text-xs">+10 Points</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded-sm"></div>
              <span className="text-gray-300 text-sm">Bonus</span>
            </div>
            <span className="text-cyber-green text-xs">+50 Points</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-sm flex items-center justify-center text-xs font-bold text-black"
                style={{ backgroundColor: '#00ffff' }}
              >
                1
              </div>
              <span className="text-gray-300 text-sm">Segment</span>
            </div>
            <span className="text-cyber-green text-xs">+1 Length</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-sm flex items-center justify-center text-xs font-bold text-black"
                style={{ backgroundColor: '#ffff00' }}
              >
                2
              </div>
              <span className="text-gray-300 text-sm">Segment</span>
            </div>
            <span className="text-cyber-green text-xs">+2 Length</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-sm flex items-center justify-center text-xs font-bold text-black"
                style={{ backgroundColor: '#ff00ff' }}
              >
                3
              </div>
              <span className="text-gray-300 text-sm">Segment</span>
            </div>
            <span className="text-cyber-green text-xs">+3 Length</span>
          </div>
        </div>
      </Card>

      {/* Player Stats */}
      {playerSnake && (
        <Card className="cyber-panel p-4">
          <h2 className="text-lg font-semibold text-cyber-cyan mb-3 neon-text">PLAYER STATUS</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Name:</span>
              <span className="text-cyber-cyan font-bold">{playerSnake.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Score:</span>
              <span className="text-cyber-green font-bold text-xl">{playerSnake.score}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Length:</span>
              <span className="text-cyber-orange font-bold">{playerSnake.segments.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Status:</span>
              <span className={`font-bold ${playerSnake.isAlive ? 'text-cyber-green' : 'text-cyber-pink'}`}>
                {playerSnake.isAlive ? 'ALIVE' : 'DEAD'}
              </span>
            </div>
            {playerSnake.segments.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Position:</span>
                <span className="text-cyber-cyan font-mono text-sm">
                  ({playerSnake.segments[0].x}, {playerSnake.segments[0].y})
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Leaderboard */}
      <Card className="cyber-panel p-4 flex-1">
        <h2 className="text-lg font-semibold text-cyber-purple mb-3 neon-text">LEADERBOARD</h2>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {sortedSnakes.map((snake, index) => (
            <div 
              key={snake.id}
              className={`flex items-center justify-between p-2 rounded border ${
                snake.isPlayer ? 'border-cyber-cyan bg-cyber-cyan/10' : 'border-gray-600 bg-gray-800/50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-cyber-orange">#{index + 1}</span>
                <div 
                  className="w-4 h-4 rounded snake-segment"
                  style={{ backgroundColor: snake.color }}
                ></div>
                <span className={`font-mono text-sm ${snake.isPlayer ? 'text-cyber-cyan' : 'text-gray-300'}`}>
                  {snake.name}
                </span>
              </div>
              <div className="text-right">
                <div className="text-cyber-green font-bold">{snake.score}</div>
                <div className="text-xs text-gray-400">{snake.segments.length} segments</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Controls Info */}
      <Card className="cyber-panel p-4">
        <h2 className="text-lg font-semibold text-cyber-cyan mb-3 neon-text">CONTROLS</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center space-x-2">
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">W</kbd>
            <span className="text-gray-300">Up</span>
          </div>
          <div className="flex items-center space-x-2">
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">S</kbd>
            <span className="text-gray-300">Down</span>
          </div>
          <div className="flex items-center space-x-2">
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">A</kbd>
            <span className="text-gray-300">Left</span>
          </div>
          <div className="flex items-center space-x-2">
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">D</kbd>
            <span className="text-gray-300">Right</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-400">
          Or use arrow keys / swipe on mobile
        </div>
      </Card>

      {gameOver && (
        <Card className="cyber-panel p-4 border-cyber-pink">
          <div className="text-center">
            <h3 className="text-xl font-bold text-cyber-pink neon-text mb-2">GAME OVER</h3>
            <p className="text-gray-300 text-sm">
              Final Score: <span className="text-cyber-green font-bold">{playerSnake?.score || 0}</span>
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
