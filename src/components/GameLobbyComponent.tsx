import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomContext } from '../contexts/RoomContext';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { PlayerList } from './PlayerList';
import { Leaderboard } from './Leaderboard';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Users, Crown, Share2, Copy, Check, Trophy } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { PLAYER_COLORS } from '../utils/gameConfig';

export const GameLobbyComponent: React.FC = () => {
  // console.log('=== GameLobbyComponent RENDER START ===');
  
  const navigate = useNavigate();
  const { 
    currentRoom, 
    spectatorRoom,
    setPlayerReady, 
    loading, 
    error, 
    isConnected,
    isSpectator 
  } = useRoomContext();
  const { user } = useWeb3Auth();
  const { toast } = useToast();
  const [shareUrlCopied, setShareUrlCopied] = React.useState(false);

  // 使用正确的房间状态 - 观察者模式使用spectatorRoom，否则使用currentRoom
  const activeRoom = isSpectator ? spectatorRoom : currentRoom;

  console.log('GameLobbyComponent: Current state snapshot:', {
    hasActiveRoom: !!activeRoom,
    hasUser: !!user,
    userAddress: user?.address,
    roomId: activeRoom?.id,
    roomPlayersCount: activeRoom?.players?.length || 0,
    roomPlayersData: activeRoom?.players?.map(p => ({ 
      name: p.name, 
      address: p.address, 
      isReady: p.isReady 
    })) || [],
    isSpectator,
    timestamp: new Date().toISOString()
  });

  // Convert room players to game players format for PlayerList component
  const players = React.useMemo(() => {
    if (!activeRoom) {
      console.log('GameLobbyComponent: No activeRoom, returning empty players array');
      return [];
    }
    
    console.log('GameLobbyComponent: Converting room players to game format:', {
      roomId: activeRoom.id,
      roomStatus: activeRoom.status,
      roomPlayers: activeRoom.players.map(p => ({ 
        name: p.name, 
        isReady: p.isReady, 
        address: p.address
      })),
      isSpectator,
      timestamp: new Date().toISOString()
    });
    
    return activeRoom.players.map((roomPlayer, index) => ({
      id: roomPlayer.address,
      name: roomPlayer.name,
      color: PLAYER_COLORS[index % PLAYER_COLORS.length],
      isReady: roomPlayer.isReady,
      isBot: false,
      hasNFT: roomPlayer.hasNFT || false
    }));
  }, [activeRoom?.players, activeRoom?.status, isSpectator]); // 添加 status 作为依赖项

  // Find current player from room players 
  const currentPlayer = React.useMemo(() => {
    if (!activeRoom || !user?.address) return null;
    
    // 观察者不在玩家列表中
    if (isSpectator) {
      return null;
    }
    
    const roomPlayer = activeRoom.players.find(p => p.address === user.address);
    if (!roomPlayer) return null;
    
    return {
      ...roomPlayer,
      isSpectator: false
    };
  }, [activeRoom?.players, user?.address, isSpectator]);

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
    
    if (!activeRoom || !user?.address || !currentPlayer) {
      console.error('handleToggleReady: Missing dependencies:', {
        hasActiveRoom: !!activeRoom,
        hasUserAddress: !!user?.address,
        hasCurrentPlayer: !!currentPlayer,
        activeRoomId: activeRoom?.id,
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
      roomId: activeRoom.id,
      willActuallyChange: currentPlayer.isReady !== newReadyState,
      timestamp: new Date().toISOString()
    });

    // 验证我们即将发送的数据
    console.log('handleToggleReady: ABOUT TO CALL setPlayerReady with:', {
      roomId: activeRoom.id,
      playerAddress: user.address,
      newReadyState: newReadyState,
      previousState: currentPlayer.isReady
    });

    try {
      setPlayerReady(activeRoom.id, user.address, newReadyState);
      console.log('handleToggleReady: setPlayerReady call completed successfully');
    } catch (error) {
      console.error('handleToggleReady: Error calling setPlayerReady:', error);
    }
  }, [activeRoom, user?.address, currentPlayer, setPlayerReady]);

  // Calculate ready status directly from activeRoom data
  const readyCount = React.useMemo(() => {
    if (!activeRoom) return 0;
    const count = activeRoom.players.filter(p => p.isReady).length;
    console.log('GameLobbyComponent: Ready count calculation:', {
      totalPlayers: activeRoom.players.length,
      readyCount: count,
      playersReadyState: activeRoom.players.map(p => ({ 
        name: p.name, 
        isReady: p.isReady 
      }))
    });
    return count;
  }, [activeRoom?.players]);

  const totalPlayers = activeRoom?.players.length || 0;
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
      roomId: activeRoom?.id,
      roomStatus: activeRoom?.status,
      playersCount: activeRoom?.players?.length || 0,
      playersReady: activeRoom?.players?.map(p => ({ name: p.name, isReady: p.isReady })) || [],
      isSpectator,
      timestamp: new Date().toISOString()
    });
  }, [activeRoom?.status, activeRoom?.players, isSpectator]);

  // Auto-start game when all players are ready
  useEffect(() => {
    if (canStartGame) {
      const timer = setTimeout(() => {
        handleAutoStart();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [canStartGame, handleAutoStart]);

  // Generate share URL for the room
  const shareUrl = React.useMemo(() => {
    if (!activeRoom) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/room/${activeRoom.id}`;
  }, [activeRoom?.id]);

  // Copy share URL to clipboard
  const handleCopyShareUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareUrlCopied(true);
      toast({
        title: "Share URL Copied!",
        description: "Room link has been copied to clipboard",
        duration: 3000,
      });
      
      // Reset copy indicator after 3 seconds
      setTimeout(() => setShareUrlCopied(false), 3000);
    } catch (error) {
      console.error('Failed to copy share URL:', error);
      toast({
        title: "Copy Failed",
        description: "Unable to copy URL to clipboard",
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [shareUrl, toast]);

  // Early return if activeRoom is not yet initialized, or if not spectator and no currentPlayer
  if (!activeRoom || (!isSpectator && !currentPlayer)) {
    console.log('GameLobbyComponent: Early return - missing room or player data:', {
      hasActiveRoom: !!activeRoom,
      hasCurrentPlayer: !!currentPlayer,
      isSpectator,
      userAddress: user?.address,
      roomPlayers: activeRoom?.players?.map(p => ({ name: p.name, address: p.address })) || [],
      addressMatches: activeRoom?.players?.some(p => p.address === user?.address) || false
    });
    return (
      <div className="min-h-screen bg-cyber-darker flex items-center justify-center p-4">
        <div className="text-cyber-cyan">Loading room data...</div>
      </div>
    );
  }

  // 只在调试时输出详细渲染信息
  // console.log('GameLobbyComponent: FINAL RENDER DATA:', {
  //   currentPlayerIsReady: currentPlayer?.isReady ?? false,
  //   readyCount: readyCount,
  //   totalPlayers: totalPlayers,
  //   canStartGame: canStartGame,
  //   buttonText: currentPlayer?.isReady ? "Cancel Ready" : "Ready Up",
  //   timestamp: new Date().toISOString(),
  //   isSpectator
  // });

  return (
    <div className="min-h-screen bg-cyber-darker flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cyber-cyan neon-text mb-2">
            {activeRoom.name}
          </h1>
          <p className="text-cyber-cyan/70">
            Room Status: {activeRoom.status} • Host: {activeRoom.host}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players List */}
          <div className="lg:col-span-2">
            <Card className="cyber-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyber-cyan">
                  <Users className="w-5 h-5" />
                  Player List ({totalPlayers}/{activeRoom.maxPlayers})
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
                  {isSpectator ? 'Spectator Mode' : 'Ready Status'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isSpectator ? (
                  // 观察者模式UI
                  <div className="text-center">
                    <div className="w-3 h-3 bg-cyber-purple rounded-full animate-pulse mx-auto mb-2"></div>
                    <div className="text-cyber-purple font-bold mb-2">Spectating Game</div>
                    <p className="text-xs text-cyber-cyan/70 mb-4">
                      {activeRoom.status === 'playing' ? 
                        'Game is in progress. You are watching as a spectator.' :
                        activeRoom.status === 'finished' ?
                        'Game has ended. You joined as a spectator.' :
                        'Game will start soon. You joined as a spectator.'
                      }
                    </p>
                    {activeRoom.status === 'waiting' && (
                      <div className="text-xs text-cyber-cyan/50">
                        To participate, please refresh this page.
                      </div>
                    )}
                  </div>
                ) : currentPlayer ? (
                  // 正常玩家模式UI
                  <>
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
                      disabled={activeRoom.status !== 'waiting'}
                    >
                      {currentPlayer.isReady ? "Cancel Ready" : "Ready Up"}
                    </Button>

                    {canStartGame && (
                      <div className="text-center text-green-400 text-sm animate-pulse">
                        All players ready! Starting game...
                      </div>
                    )}
                  </>
                ) : (
                  // 加载状态
                  <div className="text-center">
                    <div className="text-cyber-cyan/70">Loading player data...</div>
                  </div>
                )}

                {/* 增强的调试信息 */}
                <div hidden={true} className="text-xs text-cyan-400 bg-gray-800 p-2 rounded space-y-1">
                  <div>Debug Info:</div>
                  <div>Player: {currentPlayer?.name || 'N/A'}</div>
                  <div>Address: {currentPlayer?.address || 'N/A'}</div>
                  <div>Status: {currentPlayer?.isReady ? 'READY' : 'NOT READY'}</div>
                  <div>Spectator: {isSpectator ? 'YES' : 'NO'}</div>
                  <div>Ready Count: {readyCount}/{totalPlayers}</div>
                  <div>Time: {new Date().toLocaleTimeString()}</div>
                </div>
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
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-cyber-cyan/70">Room ID:</span>
                    <span className="text-cyber-cyan text-sm font-mono">
                      {activeRoom.id.slice(-8)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyber-cyan/70">Status:</span>
                    <span className="text-cyber-cyan capitalize">{activeRoom.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyber-cyan/70">Created:</span>
                    <span className="text-cyber-cyan text-sm">
                      {new Date(activeRoom.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Share Room Section */}
                <div className="border-t border-cyber-cyan/20 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Share2 className="w-4 h-4 text-cyber-cyan" />
                    <span className="text-sm font-medium text-cyber-cyan">Share Room</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs text-cyber-cyan/70 mb-2">
                      Share this link with friends to join the room:
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="flex-1 bg-cyber-darker border border-cyber-cyan/20 rounded p-2">
                        <div className="text-xs text-cyber-cyan/70 font-mono break-all">
                          {shareUrl}
                        </div>
                      </div>
                      
                      <Button
                        onClick={handleCopyShareUrl}
                        size="sm"
                        variant="outline"
                        className="border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/10 flex-shrink-0"
                      >
                        {shareUrlCopied ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    
                    <div className="text-xs text-cyber-cyan/50">
                      💡 Friends will need to sign in before joining
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
