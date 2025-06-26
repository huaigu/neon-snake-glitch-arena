
import React from 'react';
import { Player } from '../contexts/GameContext';

interface LobbyControlsProps {
  players: Player[];
  disabled: boolean;
  isHost?: boolean;
  onStartGame?: () => void;
  onForceStart?: () => void;
  gameStatus?: string;
  allPlayersReady?: boolean;
}

export const LobbyControls: React.FC<LobbyControlsProps> = ({
  players,
  disabled,
  isHost = false,
  onStartGame,
  onForceStart,
  gameStatus = 'waiting',
  allPlayersReady = false
}) => {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-lg font-semibold text-cyber-cyan">
          Real Players Only
        </div>
        <p className="text-sm text-cyber-cyan/70">
          Waiting for more players to join
        </p>
      </div>

      {players.length < 2 && (
        <div className="text-center text-yellow-400 text-sm">
          At least 2 players required to start game
        </div>
      )}

      {/* Host Controls - Always shown for room owner */}
      {isHost && (
        <div className="mt-6 p-4 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-lg">
          <h3 className="text-cyber-cyan font-semibold mb-3">Host Controls</h3>
          <div className="space-y-2">
            {gameStatus === 'waiting' && (
              <>
                {allPlayersReady && players.length >= 2 && (
                  <button
                    onClick={onStartGame}
                    disabled={disabled}
                    className="w-full bg-cyber-cyan hover:bg-cyber-cyan/80 disabled:bg-cyber-cyan/50 text-cyber-darker font-medium py-2 px-4 rounded transition-colors"
                  >
                    Start Game
                  </button>
                )}
                
                {players.length >= 1 && (
                  <button
                    onClick={onForceStart}
                    disabled={disabled}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-medium py-2 px-4 rounded transition-colors"
                  >
                    Force Start {players.length < 2 ? '(Solo Play)' : '(Skip Ready Check)'}
                  </button>
                )}
                
                {players.length === 0 && (
                  <div className="text-center text-cyber-cyan/60 text-sm py-2">
                    Waiting for players to join...
                  </div>
                )}
              </>
            )}
            
            {gameStatus === 'countdown' && (
              <div className="text-center text-cyber-cyan text-sm py-2">
                Game starting soon...
              </div>
            )}
            
            {gameStatus === 'playing' && (
              <div className="text-center text-cyber-cyan text-sm py-2">
                Game in progress
              </div>
            )}
            
            {gameStatus === 'finished' && (
              <div className="text-center text-cyber-cyan text-sm py-2">
                Game finished - Preparing next round...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
