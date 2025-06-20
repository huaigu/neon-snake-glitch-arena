import React from 'react';
import { Player } from '../contexts/GameContext';
import { Crown, Bot, User, Check, Clock, Eye, Zap } from 'lucide-react';

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
            flex items-center justify-between p-4 rounded-lg border min-w-0 relative
            ${player.hasNFT && !player.isSpectator
              ? 'border-transparent bg-gradient-to-r from-purple-900/20 via-pink-900/20 to-cyan-900/20 overflow-hidden'
              : player.isSpectator 
                ? 'border-cyber-purple/50 bg-cyber-purple/10' 
                : player.isReady 
                  ? 'border-green-500 bg-green-500/10' 
                  : 'border-cyber-cyan/30 bg-cyber-cyan/5'
            }
            ${player.id === currentPlayerId ? 'ring-2 ring-cyber-cyan' : ''}
            ${player.hasNFT && !player.isSpectator ? 'shadow-lg shadow-purple-500/20' : ''}
          `}
          style={player.hasNFT && !player.isSpectator ? {
            background: 'linear-gradient(45deg, rgba(139, 69, 19, 0.1), rgba(255, 0, 128, 0.1), rgba(255, 255, 0, 0.1), rgba(0, 255, 128, 0.1), rgba(0, 255, 255, 0.1), rgba(128, 0, 255, 0.1))',
            backgroundSize: '400% 400%',
            animation: 'rainbow-shift 3s ease-in-out infinite',
            border: '2px solid transparent',
            backgroundImage: 'linear-gradient(45deg, rgba(139, 69, 19, 0.1), rgba(255, 0, 128, 0.1), rgba(255, 255, 0, 0.1), rgba(0, 255, 128, 0.1), rgba(0, 255, 255, 0.1), rgba(128, 0, 255, 0.1)), linear-gradient(45deg, #FF0080, #FFFF00, #00FF80, #00FFFF, #8000FF, #FF0080)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'content-box, border-box'
          } : {}}
        >
          {/* NFT Holder Floating Particles Effect */}
          {player.hasNFT && !player.isSpectator && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
              <div className="absolute top-2 left-2 w-1 h-1 bg-yellow-400 rounded-full animate-ping"></div>
              <div className="absolute top-3 right-4 w-1 h-1 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute bottom-3 left-6 w-1 h-1 bg-cyan-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
              <div className="absolute bottom-2 right-2 w-1 h-1 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
            </div>
          )}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 relative ${
                player.isSpectator 
                  ? 'ring-2 ring-cyber-purple/50' 
                  : player.hasNFT 
                    ? 'ring-2 ring-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 shadow-lg shadow-purple-500/30 animate-pulse' 
                    : ''
              }`}
              style={{ 
                backgroundColor: player.isSpectator 
                  ? '#8800ff' 
                  : player.hasNFT 
                    ? 'transparent'
                    : player.color,
                background: player.hasNFT && !player.isSpectator 
                  ? 'linear-gradient(45deg, #FF0080, #FFFF00, #00FF80, #00FFFF, #8000FF)'
                  : undefined,
                backgroundSize: player.hasNFT && !player.isSpectator ? '200% 200%' : undefined,
                animation: player.hasNFT && !player.isSpectator ? 'rainbow-shift 2s ease-in-out infinite' : undefined
              }}
            >
              {player.isSpectator ? (
                <Eye className="w-5 h-5 text-white" />
              ) : player.hasNFT ? (
                <div className="relative">
                  <Crown className="w-5 h-5 text-white drop-shadow-lg" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
              ) : (
                <span className="text-white font-bold">{index + 1}</span>
              )}
            </div>
            
                          <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span 
                  className={`font-medium truncate ${
                    player.hasNFT && !player.isSpectator
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 font-bold drop-shadow-sm'
                      : 'text-white'
                  }`}
                  style={player.hasNFT && !player.isSpectator ? {
                    background: 'linear-gradient(45deg, #FF0080, #FFFF00, #00FF80, #00FFFF, #8000FF)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundSize: '200% 200%',
                    animation: 'rainbow-shift 3s ease-in-out infinite'
                  } : {}}
                >
                  {player.hasNFT && !player.isSpectator && '✨ '}{player.name}{player.hasNFT && !player.isSpectator && ' ✨'}
                </span>
                
                {/* NFT Badge */}
                {player.hasNFT && !player.isSpectator && (
                  <div className="flex items-center gap-1 bg-gradient-to-r from-purple-600/80 to-pink-600/80 px-2 py-0.5 rounded-full text-xs text-white font-bold shadow-lg animate-pulse">
                    <Zap className="w-3 h-3" />
                    <span>NFT</span>
                  </div>
                )}
                
                {player.id === currentPlayerId && (
                  <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                )}
                {player.isBot && (
                  <Bot className="w-4 h-4 text-cyber-cyan flex-shrink-0" />
                )}
                {!player.isBot && player.id !== currentPlayerId && !player.isSpectator && !player.hasNFT && (
                  <User className="w-4 h-4 text-cyber-cyan/70 flex-shrink-0" />
                )}
                {player.isSpectator && (
                  <span className="text-xs bg-cyber-purple/20 text-cyber-purple px-2 py-1 rounded flex-shrink-0">
                    Spectator
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span 
                  className={player.hasNFT && !player.isSpectator ? 'text-purple-300 font-medium' : 'text-cyber-cyan/70'}
                >
                  {player.isBot 
                    ? 'Bot' 
                    : player.isSpectator 
                      ? 'Watching' 
                      : player.hasNFT 
                        ? 'VIP Player' 
                        : 'Player'
                  }
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
                      <span 
                        className={`font-medium ${
                          player.hasNFT ? 'text-green-300' : 'text-green-400'
                        }`}
                      >
                        {player.hasNFT ? '⚡ Ready' : 'Ready'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 text-yellow-400" />
                      <span 
                        className={`font-medium ${
                          player.hasNFT ? 'text-yellow-300' : 'text-yellow-400'
                        }`}
                      >
                        {player.hasNFT ? '💫 Waiting' : 'Waiting'}
                      </span>
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
