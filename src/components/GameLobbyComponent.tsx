
import React, { useEffect } from 'react';
import { useGameLobby } from '../hooks/useGameLobby';
import { PlayerList } from './PlayerList';
import { LobbyControls } from './LobbyControls';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Users, Crown, Zap } from 'lucide-react';

export const GameLobbyComponent: React.FC = () => {
  const {
    players,
    canStartGame,
    toggleReady,
    addBot,
    removeBot,
    currentPlayer,
    handleAutoStart
  } = useGameLobby();

  // Auto-start game when all players are ready
  useEffect(() => {
    if (canStartGame) {
      const timer = setTimeout(() => {
        handleAutoStart();
      }, 500); // Small delay to show the ready state
      
      return () => clearTimeout(timer);
    }
  }, [canStartGame, handleAutoStart]);

  // Early return if currentPlayer is not yet initialized
  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-cyber-darker flex items-center justify-center p-4">
        <div className="text-cyber-cyan">Loading...</div>
      </div>
    );
  }

  const readyCount = players.filter(p => p.isReady).length;
  const totalPlayers = players.length;

  return (
    <div className="min-h-screen bg-cyber-darker flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cyber-cyan neon-text mb-2">
            CYBER SNAKE LOBBY
          </h1>
          <p className="text-cyber-cyan/70">
            Waiting for players • Maximum 8 players
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players List */}
          <div className="lg:col-span-2">
            <Card className="cyber-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyber-cyan">
                  <Users className="w-5 h-5" />
                  Player List ({totalPlayers}/8)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PlayerList players={players} currentPlayerId={currentPlayer.id} />
              </CardContent>
            </Card>
          </div>

          {/* Lobby Controls */}
          <div className="space-y-6">
            {/* Ready Status */}
            <Card className="cyber-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyber-cyan">
                  <Crown className="w-5 h-5" />
                  Ready Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyber-cyan">
                    {readyCount}/{totalPlayers}
                  </div>
                  <p className="text-sm text-cyber-cyan/70">
                    Players Ready
                  </p>
                </div>

                <Button
                  onClick={toggleReady}
                  variant={currentPlayer.isReady ? "destructive" : "default"}
                  className="w-full"
                >
                  {currentPlayer.isReady ? "Cancel Ready" : "Ready Up"}
                </Button>

                {canStartGame && (
                  <div className="text-center text-green-400 text-sm animate-pulse">
                    All players ready! Starting game...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bot Controls */}
            <Card className="cyber-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyber-cyan">
                  <Zap className="w-5 h-5" />
                  Bot Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LobbyControls
                  players={players}
                  onAddBot={addBot}
                  onRemoveBot={removeBot}
                  disabled={false}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
