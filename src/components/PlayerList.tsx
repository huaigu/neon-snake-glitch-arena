
import React from 'react';
import { Snake } from '../hooks/useSnakeGame';
import { Crown, User, Check, Clock, Eye, Zap } from 'lucide-react';

interface PlayerListProps {
  snakes: Snake[];
}

export const PlayerList: React.FC<PlayerListProps> = ({ snakes }) => {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-bold text-cyber-cyan mb-3">Players</h3>
      
      {snakes.map((snake, index) => (
        <div
          key={snake.id}
          className={`
            flex items-center justify-between p-3 rounded-lg border min-w-0 relative
            ${snake.hasNFT && !snake.isSpectator
              ? 'border-transparent bg-gradient-to-r from-purple-900/20 via-pink-900/20 to-cyan-900/20 overflow-hidden'
              : snake.isSpectator 
                ? 'border-cyber-purple/50 bg-cyber-purple/10' 
                : snake.isAlive
                  ? 'border-cyber-green/50 bg-cyber-green/10' 
                  : 'border-cyber-pink/50 bg-cyber-pink/10'
            }
            ${snake.isPlayer ? 'ring-2 ring-cyber-cyan' : ''}
            ${snake.hasNFT && !snake.isSpectator ? 'shadow-lg shadow-purple-500/20' : ''}
          `}
          style={snake.hasNFT && !snake.isSpectator ? {
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
          {snake.hasNFT && !snake.isSpectator && (
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
                snake.isSpectator 
                  ? 'ring-2 ring-cyber-purple/50' 
                  : snake.hasNFT 
                    ? 'ring-2 ring-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 shadow-lg shadow-purple-500/30 animate-pulse' 
                    : ''
              }`}
              style={{ 
                backgroundColor: snake.isSpectator 
                  ? '#8800ff' 
                  : snake.hasNFT 
                    ? 'transparent'
                    : snake.color,
                background: snake.hasNFT && !snake.isSpectator 
                  ? 'linear-gradient(45deg, #FF0080, #FFFF00, #00FF80, #00FFFF, #8000FF)'
                  : undefined,
                backgroundSize: snake.hasNFT && !snake.isSpectator ? '200% 200%' : undefined,
                animation: snake.hasNFT && !snake.isSpectator ? 'rainbow-shift 2s ease-in-out infinite' : undefined
              }}
            >
              {snake.isSpectator ? (
                <Eye className="w-4 h-4 text-white" />
              ) : snake.hasNFT ? (
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
                    snake.hasNFT && !snake.isSpectator
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 font-bold drop-shadow-sm'
                      : 'text-white'
                  }`}
                  style={snake.hasNFT && !snake.isSpectator ? {
                    background: 'linear-gradient(45deg, #FF0080, #FFFF00, #00FF80, #00FFFF, #8000FF)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundSize: '200% 200%',
                    animation: 'rainbow-shift 3s ease-in-out infinite'
                  } : {}}
                >
                  {snake.hasNFT && !snake.isSpectator && '✨ '}{snake.name}{snake.hasNFT && !snake.isSpectator && ' ✨'}
                </span>
                
                {/* NFT Badge */}
                {snake.hasNFT && !snake.isSpectator && (
                  <div className="flex items-center gap-1 bg-gradient-to-r from-purple-600/80 to-pink-600/80 px-1.5 py-0.5 rounded-full text-xs text-white font-bold shadow-lg animate-pulse">
                    <Zap className="w-2.5 h-2.5" />
                    <span>NFT</span>
                  </div>
                )}
                
                {snake.isPlayer && (
                  <Crown className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                )}
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span 
                  className={snake.hasNFT && !snake.isSpectator ? 'text-purple-300 font-medium' : 'text-cyber-cyan/70'}
                >
                  Score: {snake.score}
                </span>
                <div className="flex items-center gap-1">
                  {snake.isSpectator ? (
                    <>
                      <Eye className="w-3 h-3 text-cyber-purple" />
                      <span className="font-medium text-cyber-purple">Spectating</span>
                    </>
                  ) : snake.isAlive ? (
                    <>
                      <Check className="w-3 h-3 text-green-400" />
                      <span className={`font-medium ${snake.hasNFT ? 'text-green-300' : 'text-green-400'}`}>
                        {snake.hasNFT ? '⚡ Alive' : 'Alive'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 text-red-400" />
                      <span className={`font-medium ${snake.hasNFT ? 'text-red-300' : 'text-red-400'}`}>
                        {snake.hasNFT ? '💀 Dead' : 'Dead'}
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
