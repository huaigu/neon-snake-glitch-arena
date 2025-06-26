
import React from 'react';
import { Snake } from '../hooks/useSnakeGame';
import { Trophy, Medal, Award, GamepadIcon } from 'lucide-react';

interface LeaderboardProps {
  snakes: Snake[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ snakes }) => {
  // Sort snakes by score (descending)
  const sortedSnakes = [...snakes]
    .filter(snake => !snake.isSpectator) // Exclude spectators from leaderboard
    .sort((a, b) => b.score - a.score);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-400">#{rank}</span>;
    }
  };

  if (sortedSnakes.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-cyber-cyan mb-3">Leaderboard</h3>
        <div className="text-center py-8">
          <GamepadIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h4 className="text-md font-medium text-gray-500 mb-2">No players yet</h4>
          <p className="text-gray-400 text-sm">Start playing to see the leaderboard!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-bold text-cyber-cyan mb-3">Leaderboard</h3>
      
      <div className="space-y-2">
        {sortedSnakes.slice(0, 10).map((snake, index) => (
          <div
            key={snake.id}
            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
              index < 3 
                ? 'bg-gradient-to-r from-yellow-50/10 to-orange-50/10 border-yellow-200/30' 
                : 'bg-gray-50/5 border-gray-200/20 hover:bg-gray-100/10'
            } ${snake.isPlayer ? 'ring-1 ring-cyber-cyan' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8">
                {getRankIcon(index + 1)}
              </div>
              <div>
                <h4 className={`font-semibold text-sm ${
                  snake.hasNFT 
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400' 
                    : snake.isPlayer 
                      ? 'text-cyber-cyan' 
                      : 'text-gray-200'
                }`}>
                  {snake.hasNFT && '✨ '}{snake.name}{snake.hasNFT && ' ✨'}
                </h4>
                <p className={`text-xs ${
                  snake.isAlive ? 'text-green-400' : 'text-red-400'
                }`}>
                  {snake.isAlive ? 'Alive' : 'Dead'} • Length: {snake.segments.length}
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-cyber-green">{snake.score}</div>
              <div className="text-xs text-gray-400">points</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
