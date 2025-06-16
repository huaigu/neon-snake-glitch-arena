
import React from 'react';
import { Player } from '../contexts/GameContext';
import { Crown, Bot, User, Check, Clock } from 'lucide-react';

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string;
}

export const PlayerList: React.FC<PlayerListProps> = ({ players, currentPlayerId }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {players.map((player, index) => (
        <div
          key={player.id}
          className={`
            flex items-center justify-between p-3 rounded-lg border
            ${player.isReady 
              ? 'border-green-500 bg-green-500/10' 
              : 'border-cyber-cyan/30 bg-cyber-cyan/5'
            }
            ${player.id === currentPlayerId ? 'ring-2 ring-cyber-cyan' : ''}
          `}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: player.color }}
            >
              {index + 1}
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">
                  {player.name}
                </span>
                {player.id === currentPlayerId && (
                  <Crown className="w-4 h-4 text-yellow-400" />
                )}
                {player.isBot && (
                  <Bot className="w-4 h-4 text-cyber-cyan" />
                )}
                {!player.isBot && player.id !== currentPlayerId && (
                  <User className="w-4 h-4 text-cyber-cyan/70" />
                )}
              </div>
              <div className="text-xs text-cyber-cyan/70">
                {player.isBot ? 'Bot' : 'Player'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {player.isReady ? (
              <div className="flex items-center gap-1 text-green-400">
                <Check className="w-4 h-4" />
                <span className="text-sm">Ready</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-yellow-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Waiting</span>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Empty slots */}
      {Array.from({ length: 8 - players.length }).map((_, index) => (
        <div
          key={`empty-${index}`}
          className="flex items-center justify-center p-3 rounded-lg border border-dashed border-cyber-cyan/20 bg-cyber-cyan/5"
        >
          <span className="text-cyber-cyan/50 text-sm">Waiting for players...</span>
        </div>
      ))}
    </div>
  );
};
