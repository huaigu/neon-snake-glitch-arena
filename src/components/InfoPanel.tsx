
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface InfoPanelProps {
  isSpectator: boolean;
  enterSpectatorMode: () => void;
  speedMultiplier: number;
  foodCountdown: number;
  speedBoostCountdown: number;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({
  isSpectator,
  enterSpectatorMode,
  speedMultiplier,
  foodCountdown,
  speedBoostCountdown
}) => {
  const navigate = useNavigate();

  const handleReturnToLobby = () => {
    navigate('/lobby');
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-cyber-cyan neon-text mb-2">
          Game Info
        </h2>
        <div className="h-0.5 bg-gradient-to-r from-transparent via-cyber-cyan to-transparent"></div>
      </div>

      {/* Return to Lobby Button */}
      <Card className="cyber-panel p-3">
        <Button 
          onClick={handleReturnToLobby}
          className="w-full bg-cyber-purple hover:bg-cyber-purple/80 text-white font-bold neon-border text-sm"
        >
          RETURN TO LOBBY
        </Button>
      </Card>

      {/* Game Status */}
      <Card className="cyber-panel p-3">
        <h3 className="text-md font-semibold text-cyber-cyan mb-2 neon-text">Game Status</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-sm">Mode:</span>
            <span className={`font-bold text-sm ${isSpectator ? 'text-cyber-purple' : 'text-cyber-green'}`}>
              {isSpectator ? 'Spectating' : 'Playing'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-sm">Speed:</span>
            <span className="text-cyber-orange font-bold text-sm">{speedMultiplier}x</span>
          </div>
          {foodCountdown > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm">Next Food:</span>
              <span className="text-cyber-green font-bold text-sm">{foodCountdown}s</span>
            </div>
          )}
          {speedBoostCountdown > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm">Speed Boost:</span>
              <span className="text-cyber-yellow font-bold text-sm">{speedBoostCountdown}s</span>
            </div>
          )}
        </div>
      </Card>

      {/* Spectator Controls */}
      {!isSpectator && (
        <Card className="cyber-panel p-3">
          <Button 
            onClick={enterSpectatorMode}
            className="w-full bg-cyber-purple hover:bg-cyber-purple/80 text-white font-bold neon-border text-sm"
          >
            Enter Spectator Mode
          </Button>
        </Card>
      )}

      {/* Controls Info */}
      <Card className="cyber-panel p-3">
        <h3 className="text-md font-semibold text-cyber-cyan mb-2 neon-text">Controls</h3>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="flex items-center space-x-1">
            <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">W</kbd>
            <span className="text-gray-300">Up</span>
          </div>
          <div className="flex items-center space-x-1">
            <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">S</kbd>
            <span className="text-gray-300">Down</span>
          </div>
          <div className="flex items-center space-x-1">
            <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">A</kbd>
            <span className="text-gray-300">Left</span>
          </div>
          <div className="flex items-center space-x-1">
            <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">D</kbd>
            <span className="text-gray-300">Right</span>
          </div>
        </div>
        <div className="mt-1 text-xs text-gray-400">
          Or arrow keys / swipe on mobile
        </div>
      </Card>
    </div>
  );
};
