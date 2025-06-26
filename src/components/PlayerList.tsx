
import React from 'react';
import { Crown, User, Check, Clock, Eye, Zap } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  color: string;
  isReady: boolean;
  isBot: boolean;
  hasNFT?: boolean;
  isPlayer?: boolean;
  isAlive?: boolean;
  isSpectator?: boolean;
  score?: number;
}

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: string;
}

export const PlayerList: React.FC<PlayerListProps> = ({ players, currentPlayerId }) => {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-bold text-cyber-cyan mb-3">Players</h3>
      
      {players.map((player, index) => (
        <div
          key={player.id}
          className={`
            flex items-center justify-between p-3 rounded-lg border min-w-0 relative
            ${player.hasNFT && !player.isSpectator
              ? 'border-transparent bg-gradient-to-r from-purple-900/20 via-pink-900/20 to-cyan-900/20 overflow-hidden'
              : player.isSpectator 
                ? 'border-cyber-purple/50 bg-cyber-purple/10' 
                : player.isAlive !== false
                  ? 'border-cyber-green/50 bg-cyber-green/10' 
                  : 'border-cyber-pink/50 bg-cyber-pink/10'
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
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 relative ${
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
                <Eye className="w-4 h-4 text-white" />
              ) : player.hasNFT ? (
                <div className="relative">
                  <Crown className="w-4 h-4 text-white drop-shadow-lg" />
                  <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
              ) : (
                <span className="text-white font-bold text-xs">{index + 1}</span>
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span 
                  className={`font-medium truncate text-sm ${
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
                  <div className="flex items-center gap-1 bg-gradient-to-r from-purple-600/80 to-pink-600/80 px-1.5 py-0.5 rounded-full text-xs text-white font-bold shadow-lg animate-pulse">
                    <Zap className="w-2.5 h-2.5" />
                    <span>NFT</span>
                  </div>
                )}
                
                {player.id === currentPlayerId && (
                  <Crown className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                )}
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span 
                  className={player.hasNFT && !player.isSpectator ? 'text-purple-300 font-medium' : 'text-cyber-cyan/70'}
                >
                  Score: {player.score || 0}
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
                      <span className={`font-medium ${player.hasNFT ? 'text-green-300' : 'text-green-400'}`}>
                        {player.hasNFT ? '⚡ Ready' : 'Ready'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 text-red-400" />
                      <span className={`font-medium ${player.hasNFT ? 'text-red-300' : 'text-red-400'}`}>
                        {player.hasNFT ? '💀 Not Ready' : 'Not Ready'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
