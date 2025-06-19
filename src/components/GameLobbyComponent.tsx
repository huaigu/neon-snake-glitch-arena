
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
  console.log('=== GameLobbyComponent RENDER START ===');
  
  const navigate = useNavigate();
  const { currentRoom, setPlayerReady } = useRoomContext();
  const { user } = useWeb3Auth();

  console.log('GameLobbyComponent: Current state snapshot:', {
    hasCurrentRoom: !!currentRoom,
    hasUser: !!user,
    userAddress: user?.address,
    roomId: currentRoom?.id,
    roomPlayersCount: currentRoom?.players?.length || 0,
    roomPlayersData: currentRoom?.players?.map(p => ({ 
      name: p.name, 
      address: p.address, 
      isReady: p.isReady 
    })) || [],
    timestamp: new Date().toISOString()
  });

  // Convert room players to game players format for PlayerList component
  const players = React.useMemo(() => {
    if (!currentRoom) {
      console.log('GameLobbyComponent: No currentRoom, returning empty players array');
      return [];
    }
    
    console.log('GameLobbyComponent: Converting room players to game format:', {
      roomId: currentRoom.id,
      roomStatus: currentRoom.status,
      roomPlayers: currentRoom.players.map(p => ({ 
        name: p.name, 
        isReady: p.isReady, 
        address: p.address 
      })),
      timestamp: new Date().toISOString()
    });
    
    return currentRoom.players.map((roomPlayer, index) => ({
      id: roomPlayer.address,
      name: roomPlayer.name,
      color: PLAYER_COLORS[index % PLAYER_COLORS.length],
      isReady: roomPlayer.isReady,
      isBot: false
    }));
  }, [currentRoom?.players, currentRoom?.status]); // 添加 status 作为依赖项

  // Find current player - 强制重新计算当玩家数据变化时
  const currentPlayer = React.useMemo(() => {
    console.log('=== COMPUTING CURRENT PLAYER ===');
    
    if (!currentRoom || !user?.address) {
      console.log('GameLobbyComponent: Missing currentRoom or user address for currentPlayer calculation');
      return null;
    }
    
    const player = currentRoom.players.find(p => p.address === user.address);
    
    console.log('GameLobbyComponent: currentPlayer calculation DETAILED:', {
      userAddress: user.address,
      totalPlayersInRoom: currentRoom.players.length,
      allPlayersData: currentRoom.players.map(p => ({ 
        address: p.address, 
        name: p.name, 
        isReady: p.isReady,
        matchesCurrentUser: p.address === user.address
      })),
      foundPlayer: player ? {
        address: player.address,
        name: player.name,
        isReady: player.isReady
      } : null,
      timestamp: new Date().toISOString()
    });
    
    return player;
  }, [currentRoom?.players, user?.address]); // 更精确的依赖项

  // 添加详细的 currentPlayer 变化日志
  useEffect(() => {
    console.log('=== CURRENT PLAYER EFFECT TRIGGERED ===');
    console.log('GameLobbyComponent: currentPlayer state updated:', {
      hasCurrentPlayer: !!currentPlayer,
      currentPlayerName: currentPlayer?.name,
      currentPlayerReady: currentPlayer?.isReady,
      currentPlayerAddress: currentPlayer?.address,
      userAddress: user?.address,
      playersMatch: currentPlayer?.address === user?.address,
      timestamp: new Date().toISOString()
    });
  }, [currentPlayer, user?.address]);

  const handleToggleReady = useCallback(() => {
    console.log('=== HANDLE TOGGLE READY CALLED ===');
    console.log('handleToggleReady: Function entry state:', {
      hasCurrentRoom: !!currentRoom,
      hasUserAddress: !!user?.address,
      hasCurrentPlayer: !!currentPlayer,
      currentPlayerData: currentPlayer ? {
        name: currentPlayer.name,
        address: currentPlayer.address,
        isReady: currentPlayer.isReady
      } : null,
      timestamp: new Date().toISOString()
    });
    
    if (!currentRoom || !user?.address || !currentPlayer) {
      console.error('handleToggleReady: Missing dependencies:', {
        hasCurrentRoom: !!currentRoom,
        hasUserAddress: !!user?.address,
        hasCurrentPlayer: !!currentPlayer,
        currentRoomId: currentRoom?.id,
        userAddress: user?.address
      });
      return;
    }

    const newReadyState = !currentPlayer.isReady;

    console.log('handleToggleReady: STATE CHANGE CALCULATION:', {
      playerName: currentPlayer.name,
      playerAddress: currentPlayer.address,
      currentReadyState: currentPlayer.isReady,
      newReadyState: newReadyState,
      roomId: currentRoom.id,
      willActuallyChange: currentPlayer.isReady !== newReadyState,
      timestamp: new Date().toISOString()
    });

    // 验证我们即将发送的数据
    console.log('handleToggleReady: ABOUT TO CALL setPlayerReady with:', {
      roomId: currentRoom.id,
      playerAddress: user.address,
      newReadyState: newReadyState,
      previousState: currentPlayer.isReady
    });

    try {
      setPlayerReady(currentRoom.id, user.address, newReadyState);
      console.log('handleToggleReady: setPlayerReady call completed successfully');
    } catch (error) {
      console.error('handleToggleReady: Error calling setPlayerReady:', error);
    }
  }, [currentRoom, user?.address, currentPlayer, setPlayerReady]);

  // Calculate ready status directly from currentRoom data
  const readyCount = React.useMemo(() => {
    if (!currentRoom) return 0;
    const count = currentRoom.players.filter(p => p.isReady).length;
    console.log('GameLobbyComponent: Ready count calculation:', {
      totalPlayers: currentRoom.players.length,
      readyCount: count,
      playersReadyState: currentRoom.players.map(p => ({ 
        name: p.name, 
        isReady: p.isReady 
      }))
    });
    return count;
  }, [currentRoom?.players]);

  const totalPlayers = currentRoom?.players.length || 0;
  const canStartGame = totalPlayers >= 2 && readyCount === totalPlayers;

  const handleAutoStart = useCallback(() => {
    if (canStartGame) {
      navigate('/game');
    }
  }, [canStartGame, navigate]);

  // 专门监控房间状态变化，特别是游戏结束后的状态重置
  useEffect(() => {
    console.log('=== ROOM STATUS CHANGE MONITOR ===');
    console.log('GameLobbyComponent: Room status or players changed:', {
      roomId: currentRoom?.id,
      roomStatus: currentRoom?.status,
      playersCount: currentRoom?.players?.length || 0,
      playersReady: currentRoom?.players?.map(p => ({ name: p.name, isReady: p.isReady })) || [],
      timestamp: new Date().toISOString()
    });
  }, [currentRoom?.status, currentRoom?.players]);

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
    console.log('GameLobbyComponent: Early return - missing room or player data:', {
      hasCurrentRoom: !!currentRoom,
      hasCurrentPlayer: !!currentPlayer,
      userAddress: user?.address
    });
    return (
      <div className="min-h-screen bg-cyber-darker flex items-center justify-center p-4">
        <div className="text-cyber-cyan">Loading room data...</div>
      </div>
    );
  }

  console.log('GameLobbyComponent: FINAL RENDER DATA:', {
    currentPlayerIsReady: currentPlayer.isReady,
    readyCount: readyCount,
    totalPlayers: totalPlayers,
    canStartGame: canStartGame,
    buttonText: currentPlayer.isReady ? "Cancel Ready" : "Ready Up",
    timestamp: new Date().toISOString()
  });

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

                {/* 增强的调试信息 */}
                <div hidden={true} className="text-xs text-cyan-400 bg-gray-800 p-2 rounded space-y-1">
                  <div>Debug Info:</div>
                  <div>Player: {currentPlayer.name}</div>
                  <div>Address: {currentPlayer.address}</div>
                  <div>Status: {currentPlayer.isReady ? 'READY' : 'NOT READY'}</div>
                  <div>Ready Count: {readyCount}/{totalPlayers}</div>
                  <div>Time: {new Date().toLocaleTimeString()}</div>
                </div>

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
