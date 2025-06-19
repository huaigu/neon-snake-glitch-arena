import React from 'react';
import { Player } from '../contexts/GameContext';
import { Crown, Bot, User, Check, Clock, Eye } from 'lucide-react';

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
            flex items-center justify-between p-4 rounded-lg border min-w-0
            ${player.isSpectator 
              ? 'border-cyber-purple/50 bg-cyber-purple/10' 
              : player.isReady 
                ? 'border-green-500 bg-green-500/10' 
                : 'border-cyber-cyan/30 bg-cyber-cyan/5'
            }
            ${player.id === currentPlayerId ? 'ring-2 ring-cyber-cyan' : ''}
          `}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                player.isSpectator ? 'ring-2 ring-cyber-purple/50' : ''
              }`}
              style={{ backgroundColor: player.isSpectator ? '#8800ff' : player.color }}
            >
              {player.isSpectator ? <Eye className="w-5 h-5 text-white" /> : index + 1}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-white truncate">
                  {player.name}
                </span>
                {player.id === currentPlayerId && (
                  <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                )}
                {player.isBot && (
                  <Bot className="w-4 h-4 text-cyber-cyan flex-shrink-0" />
                )}
                {!player.isBot && player.id !== currentPlayerId && !player.isSpectator && (
                  <User className="w-4 h-4 text-cyber-cyan/70 flex-shrink-0" />
                )}
                {player.isSpectator && (
                  <span className="text-xs bg-cyber-purple/20 text-cyber-purple px-2 py-1 rounded flex-shrink-0">
                    Spectator
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-cyber-cyan/70">
                  {player.isBot ? 'Bot' : player.isSpectator ? 'Watching' : 'Player'}
                </span>
                <div className="flex items-center gap-1">
                  {player.isSpectator ? (
                    <>
                      <Eye className="w-3 h-3 text-cyber-purple" />
                      <span className="font-medium text-cyber-purple">Spectating</span>
                    </>
                  ) : player.isReady ? (
                    <>
                      <Check className="w-3 h-3 text-green-400" />
                      <span className="font-medium text-green-400">Ready</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 text-yellow-400" />
                      <span className="font-medium text-yellow-400">Waiting</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Empty slots */}
      {Array.from({ length: Math.max(0, 8 - players.length) }).map((_, index) => (
        <div
          key={`empty-${index}`}
          className="flex items-center justify-center p-4 rounded-lg border border-dashed border-cyber-cyan/20 bg-cyber-cyan/5 min-h-[72px]"
        >
          <span className="text-cyber-cyan/50 text-sm">Waiting for players...</span>
        </div>
      ))}
    </div>
  );
};
