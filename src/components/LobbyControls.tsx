
import React from 'react';
import { Player } from '../contexts/GameContext';
import { Button } from './ui/button';
import { Plus, Minus } from 'lucide-react';

interface LobbyControlsProps {
  players: Player[];
  onAddBot: () => void;
  onRemoveBot: () => void;
  disabled: boolean;
}

export const LobbyControls: React.FC<LobbyControlsProps> = ({
  players,
  onAddBot,
  onRemoveBot,
  disabled
}) => {
  const botCount = players.filter(p => p.isBot).length;
  const canAddBot = players.length < 8;
  const canRemoveBot = botCount > 0;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-lg font-semibold text-cyber-cyan">
          Bot Count: {botCount}
        </div>
        <p className="text-sm text-cyber-cyan/70">
          Maximum 7 bots allowed
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={onAddBot}
          disabled={!canAddBot || disabled}
          variant="outline"
          className="flex-1"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Bot
        </Button>

        <Button
          onClick={onRemoveBot}
          disabled={!canRemoveBot || disabled}
          variant="outline"
          className="flex-1"
        >
          <Minus className="w-4 h-4 mr-2" />
          Remove Bot
        </Button>
      </div>

      {players.length < 2 && (
        <div className="text-center text-yellow-400 text-sm">
          At least 2 players required to start game
        </div>
      )}
    </div>
  );
};
