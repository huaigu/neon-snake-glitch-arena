
import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomContext } from '../contexts/RoomContext';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { PlayerList } from './PlayerList';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Users, Crown } from 'lucide-react';

// 预定义的玩家颜色
const PLAYER_COLORS = [
  '#00ffff', // cyan
  '#ff00ff', // magenta
  '#ffff00', // yellow
  '#ff8800', // orange
  '#00ff00', // green
  '#8800ff', // purple
  '#ff0088', // pink
  '#88ff00', // lime
];

export const GameLobbyComponent: React.FC = () => {
  console.log('GameLobbyComponent: Component rendering started');
  
  const navigate = useNavigate();
  const { currentRoom, setPlayerReady } = useRoomContext();
  const { user } = useWeb3Auth();

  console.log('GameLobbyComponent: Hook values:', {
    hasCurrentRoom: !!currentRoom,
    hasUser: !!user,
    userAddress: user?.address,
    roomId: currentRoom?.id,
    hasSetPlayerReady: !!setPlayerReady
  });

  // Convert room players to game players format for PlayerList component
  const players = React.useMemo(() => {
    if (!currentRoom) {
      console.log('GameLobbyComponent: No currentRoom, returning empty players array');
      return [];
    }
    
    console.log('GameLobbyComponent: Converting room players to game format:', {
      roomId: currentRoom.id,
      roomPlayers: currentRoom.players.map(p => ({ name: p.name, isReady: p.isReady, address: p.address }))
    });
    
    return currentRoom.players.map((roomPlayer, index) => ({
      id: roomPlayer.address,
      name: roomPlayer.name,
      color: PLAYER_COLORS[index % PLAYER_COLORS.length],
      isReady: roomPlayer.isReady,
      isBot: false
    }));
  }, [currentRoom]);

  // Find current player directly from currentRoom data
  const currentPlayer = React.useMemo(() => {
    if (!currentRoom || !user?.address) return null;
    return currentRoom.players.find(p => p.address === user.address);
  }, [currentRoom, user?.address]);

  // Log currentPlayer for debugging
  useEffect(() => {
    console.log('GameLobbyComponent: currentPlayer updated:', {
      hasCurrentPlayer: !!currentPlayer,
      currentPlayerName: currentPlayer?.name,
      currentPlayerReady: currentPlayer?.isReady,
      userAddress: user?.address
    });
  }, [currentPlayer, user?.address]);

  const handleToggleReady = useCallback(() => {
    console.log('=== handleToggleReady CALLED ===');
    
    if (!currentRoom || !user?.address || !currentPlayer) {
      console.error('Missing currentRoom, user address, or currentPlayer');
      return;
    }

    const newReadyState = !currentPlayer.isReady;

    try {
      console.log('Calling setPlayerReady from RoomContext:', {
        roomId: currentRoom.id,
        playerAddress: user.address,
        currentReadyState: currentPlayer.isReady,
        newReadyState: newReadyState
      });
      
      setPlayerReady(currentRoom.id, user.address, newReadyState);
      
      console.log('setPlayerReady called successfully');
    } catch (error) {
      console.error('Error calling setPlayerReady:', error);
    }
  }, [currentRoom?.id, user?.address, currentPlayer?.isReady, setPlayerReady]);

  // Calculate ready status directly from currentRoom data
  const readyCount = React.useMemo(() => {
    if (!currentRoom) return 0;
    return currentRoom.players.filter(p => p.isReady).length;
  }, [currentRoom]);

  const totalPlayers = currentRoom?.players.length || 0;
  const canStartGame = totalPlayers >= 2 && readyCount === totalPlayers;

  const handleAutoStart = useCallback(() => {
    if (canStartGame) {
      navigate('/game');
    }
  }, [canStartGame, navigate]);

  // Auto-start game when all players are ready
  useEffect(() => {
    if (canStartGame) {
      const timer = setTimeout(() => {
        handleAutoStart();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [canStartGame, handleAutoStart]);

  // Early return if currentRoom or currentPlayer is not yet initialized
  if (!currentRoom || !currentPlayer) {
    return (
      <div className="min-h-screen bg-cyber-darker flex items-center justify-center p-4">
        <div className="text-cyber-cyan">Loading room data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-darker flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cyber-cyan neon-text mb-2">
            {currentRoom.name}
          </h1>
          <p className="text-cyber-cyan/70">
            Room Status: {currentRoom.status} • Host: {currentRoom.host}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players List */}
          <div className="lg:col-span-2">
            <Card className="cyber-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyber-cyan">
                  <Users className="w-5 h-5" />
                  Player List ({totalPlayers}/{currentRoom.maxPlayers})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PlayerList players={players} currentPlayerId={user?.address || ''} />
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
                  onClick={handleToggleReady}
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

            {/* Room Info */}
            <Card className="cyber-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyber-cyan">
                  <Users className="w-5 h-5" />
                  Room Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-cyber-cyan/70">Room ID:</span>
                  <span className="text-cyber-cyan text-sm font-mono">
                    {currentRoom.id.slice(-8)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyber-cyan/70">Status:</span>
                  <span className="text-cyber-cyan capitalize">{currentRoom.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyber-cyan/70">Created:</span>
                  <span className="text-cyber-cyan text-sm">
                    {new Date(currentRoom.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
