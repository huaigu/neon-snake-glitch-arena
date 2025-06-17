
import React from 'react';
import { Player } from '../contexts/GameContext';

interface LobbyControlsProps {
  players: Player[];
  disabled: boolean;
}

export const LobbyControls: React.FC<LobbyControlsProps> = ({
  players,
  disabled
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
    </div>
  );
};
