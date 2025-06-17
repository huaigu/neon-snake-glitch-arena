import React, { useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomContext } from '../contexts/RoomContext';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { useMultisynqRooms } from '../hooks/useMultisynqRooms';
import { PlayerList } from './PlayerList';
import { LobbyControls } from './LobbyControls';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Users, Crown } from 'lucide-react';
import { Player as GamePlayer } from '../contexts/GameContext';

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
  const { currentRoom, currentPlayerName } = useRoomContext();
  const { user } = useWeb3Auth();
  const { toggleReady } = useMultisynqRooms();

  console.log('GameLobbyComponent: Hook values:', {
    hasCurrentRoom: !!currentRoom,
    hasUser: !!user,
    userAddress: user?.address,
    roomId: currentRoom?.id,
    hasToggleReady: !!toggleReady
  });

  // Convert room players to game players format
  const players = useMemo(() => {
    if (!currentRoom) return [];
    
    console.log('Converting room players to game format:', currentRoom.players);
    
    return currentRoom.players.map((roomPlayer, index): GamePlayer => ({
      id: roomPlayer.address,
      name: roomPlayer.name,
      color: PLAYER_COLORS[index % PLAYER_COLORS.length],
      isReady: roomPlayer.isReady,
      isBot: false // Room players are never bots
    }));
  }, [currentRoom]);

  // Log player updates for debugging
  useEffect(() => {
    console.log('Room players updated:', {
      roomId: currentRoom?.id,
      playersCount: players.length,
      players: players.map(p => ({ name: p.name, isReady: p.isReady }))
    });
  }, [currentRoom?.id, players]);

  const currentPlayer = players.find(p => p.id === user?.address);

  const handleToggleReady = useCallback(() => {
    console.log('=== handleToggleReady CALLED ===');
    console.log('Basic check - this function is definitely being called');
    
    try {
      console.log('handleToggleReady: Current state check:', {
        hasCurrentRoom: !!currentRoom,
        hasUserAddress: !!user?.address,
        currentRoom: currentRoom?.id,
        userAddress: user?.address,
        currentPlayerExists: !!currentPlayer,
        currentPlayerReady: currentPlayer?.isReady
      });
      
      if (!currentRoom) {
        console.log('ERROR: No current room');
        return;
      }
      
      if (!user?.address) {
        console.log('ERROR: No user address');
        return;
      }
      
      console.log('About to call toggleReady with:', {
        roomId: currentRoom.id,
        userAddress: user.address
      });
      
      toggleReady(currentRoom.id, user.address);
      console.log('toggleReady called successfully');
      
    } catch (error) {
      console.error('Error in handleToggleReady:', error);
    }
  }, [currentRoom, user?.address, toggleReady, currentPlayer?.isReady]);

  const canStartGame = players.length >= 2 && players.every(p => p.isReady);

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
      }, 500); // Small delay to show the ready state
      
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

  const readyCount = players.filter(p => p.isReady).length;
  const totalPlayers = players.length;

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
                  onClick={(e) => {
                    console.log('Button onClick event triggered:', e);
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleReady();
                  }}
                  onMouseDown={() => console.log('Button mousedown event')}
                  onMouseUp={() => console.log('Button mouseup event')}
                  variant={currentPlayer.isReady ? "destructive" : "default"}
                  className="w-full"
                  disabled={false}
                  type="button"
                >
                  {currentPlayer.isReady ? "Cancel Ready" : "Ready Up"}
                </Button>

                {/* 临时测试按钮 */}
                <Button
                  onClick={() => {
                    console.log('TEST BUTTON CLICKED!');
                    console.log('Test button - currentRoom:', currentRoom?.id);
                    console.log('Test button - user:', user?.address);
                    console.log('Test button - toggleReady function:', typeof toggleReady);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Test Button (Debug)
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
