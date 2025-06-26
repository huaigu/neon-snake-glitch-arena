import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomContext } from '../contexts/RoomContext';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { PlayerList } from './PlayerList';
import { Leaderboard } from './Leaderboard';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Users, Crown, Share2, Copy, Check, Trophy, Play, Clock } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { PLAYER_COLORS } from '../utils/gameConfig';
import { MIN_FORCE_START, MIN_PLAYERS, TOAST_DURATION, FORCE_START_DELAY } from '../utils/gameConstants';
import type { Snake } from '../hooks/useSnakeGame';

export const GameLobbyComponent: React.FC = () => {
  // console.log('=== GameLobbyComponent RENDER START ===');
  
  const navigate = useNavigate();
  const { 
    currentRoom, 
    spectatorRoom,
    setPlayerReady, 
    forceStartGame,
    error, 
    isConnected,
    isSpectator 
  } = useRoomContext();
  const { user } = useWeb3Auth();
  const { toast } = useToast();
  const [shareUrlCopied, setShareUrlCopied] = React.useState(false);
  
  // 新增状态：强制开始倒计时
  const [forceStartCountdown, setForceStartCountdown] = React.useState(0);

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

  // 添加 activeRoom 结构的调试信息
  console.log('GameLobbyComponent: ActiveRoom structure debug:', {
    activeRoom: activeRoom ? {
      id: activeRoom.id,
      name: activeRoom.name,
      status: activeRoom.status,
      hostAddress: activeRoom.hostAddress,
      host: activeRoom.host,
      createdAt: activeRoom.createdAt,
      createdAtType: typeof activeRoom.createdAt,
      allKeys: Object.keys(activeRoom)
    } : null
  });

  // Convert room players to snake format for PlayerList component
  const snakes = React.useMemo(() => {
    if (!activeRoom) {
      console.log('GameLobbyComponent: No activeRoom, returning empty snakes array');
      return [];
    }
    
    console.log('GameLobbyComponent: Converting room players to snake format:', {
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
      hasNFT: roomPlayer.hasNFT || false,
      isAlive: true, // Default to alive for lobby
      score: 0, // Default score for lobby
      isSpectator: false,
      // Required Snake interface properties for PlayerList compatibility
      segments: [{ x: 10, y: 10 }], // Default single segment for lobby display
      direction: 'up' as const,
      isPlayer: roomPlayer.address === user?.address
    }));
  }, [activeRoom?.players, activeRoom?.status, isSpectator, user?.address]); // 添加 user?.address 作为依赖项

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

  // 检测是否是房主
  const isHost = React.useMemo(() => {
    return activeRoom && user?.address && activeRoom.host === user.address;
  }, [activeRoom?.host, user?.address]);

  // 监听玩家列表变化，检测新玩家加入
  const prevPlayersCount = React.useRef(0);
  useEffect(() => {
    if (!activeRoom || !isHost) return;
    
    const currentPlayersCount = activeRoom.players.length;
    
    // 如果玩家数量增加（新玩家加入），启动3秒倒计时
    if (currentPlayersCount > prevPlayersCount.current && prevPlayersCount.current > 0) {
      console.log('GameLobbyComponent: New player joined, starting force start countdown');
      setForceStartCountdown(FORCE_START_DELAY);
      
      const countdownInterval = setInterval(() => {
        setForceStartCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(countdownInterval);
    }
    
    prevPlayersCount.current = currentPlayersCount;
  }, [activeRoom?.players.length, isHost]);

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

  // 处理房主强制开始游戏
  const handleForceStart = useCallback(() => {
    if (!activeRoom || !isHost) {
      console.error('handleForceStart: Not host or no active room');
      return;
    }

    if (forceStartCountdown > 0) {
      console.warn('handleForceStart: Still in countdown period');
      return;
    }

    if (activeRoom.status !== 'waiting') {
      console.warn('handleForceStart: Room not in waiting state');
      return;
    }

    if (activeRoom.players.length < MIN_PLAYERS) {
      toast({
        title: "Cannot Start Game",
        description: `At least ${MIN_PLAYERS} players are required to start the game`,
        variant: "destructive",
        duration: TOAST_DURATION,
      });
      return;
    }

    console.log('GameLobbyComponent: Host force starting game');
    forceStartGame(activeRoom.id);
    
    toast({
      title: "Force Starting Game",
      description: `Starting game with ${activeRoom.players.length} players`,
      duration: 3000,
    });
  }, [activeRoom, isHost, forceStartCountdown, forceStartGame, toast]);

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
  const canStartGame = totalPlayers >= MIN_PLAYERS && readyCount === totalPlayers;

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

    // 当房间状态变为 countdown 或 playing 且用户是玩家时，跳转到游戏页面
    if (activeRoom?.status === 'countdown' || activeRoom?.status === 'playing') {
      if (!isSpectator && currentPlayer) {
        console.log('GameLobbyComponent: Game starting/started, user is a player, navigating to game page');
        navigate('/game');
      } else if (isSpectator) {
        console.log('GameLobbyComponent: Game starting/started, user is spectator, navigating to game page for spectator view');
        navigate('/game');
      } else {
        console.log('GameLobbyComponent: Game starting/started, but user is not a player, staying on lobby');
      }
    }
  }, [activeRoom?.status, activeRoom?.players, isSpectator, currentPlayer, navigate]);

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
    <div className="bg-cyber-darker flex items-center justify-center p-2 lg:p-4 overflow-hidden">
      <div className="w-full max-w-5xl max-h-full overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl lg:text-4xl font-bold text-cyber-cyan neon-text mb-2">
            {activeRoom.name}
          </h1>
          <p className="text-cyber-cyan/70 text-sm">
            Room Status: {activeRoom.status} • Host: {activeRoom.host}
            {isHost && <span className="text-yellow-400 ml-2">(You are the host)</span>}
          </p>
        </div>

        {/* PC端布局 */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-3 gap-4 mb-4">
            {/* Players List */}
            <div className="col-span-2">
              <Card className="cyber-panel h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-cyber-cyan text-lg">
                    <Users className="w-5 h-5" />
                    Player List ({totalPlayers}/{activeRoom.maxPlayers})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <PlayerList snakes={snakes} currentPlayerId={user?.address || ''} />
                </CardContent>
              </Card>
            </div>

            {/* Ready Status - 与Player List同高 */}
            <div>
              <Card className="cyber-panel h-full flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-cyber-cyan text-base">
                    <Crown className="w-4 h-4" />
                    {isSpectator ? 'Spectator Mode' : 'Ready Status'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 flex-1 flex flex-col justify-center pt-0">
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
                        disabled={activeRoom.status !== 'waiting' || totalPlayers < MIN_PLAYERS}
                        title={totalPlayers < MIN_PLAYERS ? `At least ${MIN_PLAYERS} players are required` : ''}
                      >
                        {currentPlayer.isReady ? "Cancel Ready" : "Ready Up"}
                      </Button>

                      {/* 房主强制开始按钮 */}
                      {isHost && (
                        <div className="border-t border-cyber-cyan/20 pt-3">
                          <div className="text-xs text-cyber-cyan/70 mb-2 flex items-center gap-2">
                            <Crown className="w-3 h-3" />
                            Host Controls
                          </div>
                          
                          {forceStartCountdown > 0 ? (
                            <Button
                              variant="outline"
                              className="w-full"
                              disabled={true}
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              Force Start Available in {forceStartCountdown}s
                            </Button>
                          ) : (
                            <Button
                              onClick={handleForceStart}
                              variant="outline"
                              className="w-full border-yellow-400 text-yellow-400 hover:bg-yellow-400/10"
                              disabled={totalPlayers < MIN_PLAYERS || activeRoom.status !== 'waiting'}
                              title={totalPlayers < MIN_PLAYERS ? `At least ${MIN_PLAYERS} players are required` : ''}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Force Start Game
                            </Button>
                          )}
                          
                          <p className="text-xs text-cyber-cyan/50 mt-2 text-center">
                            💡 Force start requires at least {MIN_PLAYERS} players and is available 3 seconds after new players join
                          </p>
                        </div>
                      )}

                      {/* 玩家数量不足提示 */}
                      {totalPlayers < MIN_PLAYERS && (
                        <div className="text-center text-yellow-400 text-xs bg-yellow-400/10 py-2 px-3 rounded border border-yellow-400/20">
                          <div className="font-medium mb-0.5">Waiting for More Players</div>
                          <div className="text-xs opacity-80">
                            {totalPlayers}/{MIN_PLAYERS} players joined. Need {MIN_PLAYERS - totalPlayers} more to start.
                          </div>
                        </div>
                      )}

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
                    <div>Is Host: {isHost ? 'YES' : 'NO'}</div>
                    <div>Force Countdown: {forceStartCountdown}</div>
                    <div>Ready Count: {readyCount}/{totalPlayers}</div>
                    <div>Time: {new Date().toLocaleTimeString()}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Room Info - 单独占用底部一行 */}
          <div className="w-full">
            <Card className="cyber-panel">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-cyber-cyan text-base">
                  <Users className="w-4 h-4" />
                  Room Info
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex">
                  {/* Room Details */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-cyber-cyan/70 text-sm">Room ID:</span>
                      <span className="text-cyber-cyan font-mono text-sm">
                        {activeRoom.id.slice(-8)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-cyber-cyan/70 text-sm">Status:</span>
                      <span className="text-cyber-cyan capitalize text-sm">{activeRoom.status}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-cyber-cyan/70 text-sm">Created:</span>
                      <span className="text-cyber-cyan text-sm">
                        {activeRoom.createdAt ? (
                          new Date(activeRoom.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        ) : (
                          (() => {
                            // 备用方案：从房间ID中提取时间戳
                            // 房间ID格式: room_${timestamp}_${random}
                            const match = activeRoom.id.match(/room_(\d+)_/);
                            if (match) {
                              const timestamp = parseInt(match[1]);
                              return new Date(timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              });
                            }
                            return <span className="text-red-400">No creation time</span>;
                          })()
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Middle Gap with Centered Divider */}
                  <div className="w-8 flex items-start justify-center pt-2">
                    <div className="w-px bg-cyber-cyan/20 h-16"></div>
                  </div>

                  {/* Share Room Section */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Share2 className="w-4 h-4 text-cyber-cyan" />
                      <span className="text-sm font-medium text-cyber-cyan">Share Room</span>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex gap-2">
                        <div className="flex-1 bg-cyber-darker border border-cyber-cyan/20 rounded px-3 py-2">
                          <div className="text-sm text-cyber-cyan/70 font-mono truncate">
                            {shareUrl}
                          </div>
                        </div>
                        
                        <Button
                          onClick={handleCopyShareUrl}
                          size="sm"
                          variant="outline"
                          className="border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/10"
                        >
                          {shareUrlCopied ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      
                      <div className="text-xs text-cyber-cyan/50">
                        💡 Share link to invite friends
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 移动端布局 */}
        <div className="lg:hidden">
          <div className="space-y-3">
            {/* Players List */}
            <Card className="cyber-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-1 text-cyber-cyan">
                  <Users className="w-5 h-5" />
                  Player List ({totalPlayers}/{activeRoom.maxPlayers})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PlayerList snakes={snakes} currentPlayerId={user?.address || ''} />
              </CardContent>
            </Card>

            {/* Ready Status */}
            <Card className="cyber-panel">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-cyber-cyan text-base">
                  <Crown className="w-4 h-4" />
                  {isSpectator ? 'Spectator Mode' : 'Ready Status'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
                      disabled={activeRoom.status !== 'waiting' || totalPlayers < MIN_PLAYERS}
                      title={totalPlayers < MIN_PLAYERS ? `At least ${MIN_PLAYERS} players are required` : ''}
                    >
                      {currentPlayer.isReady ? "Cancel Ready" : "Ready Up"}
                    </Button>

                    {/* 房主强制开始按钮 */}
                    {isHost && activeRoom.status === 'waiting' && (
                      <div className="border-t border-cyber-cyan/20 pt-3">
                        <div className="text-xs text-cyber-cyan/70 mb-2 flex items-center gap-2">
                          <Crown className="w-3 h-3" />
                          Host Controls
                        </div>
                        
                        {forceStartCountdown > 0 ? (
                          <Button
                            variant="outline"
                            className="w-full"
                            disabled={true}
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            Force Start Available in {forceStartCountdown}s
                          </Button>
                        ) : (
                          <Button
                            onClick={handleForceStart}
                            variant="outline"
                            className="w-full border-yellow-400 text-yellow-400 hover:bg-yellow-400/10"
                            disabled={totalPlayers < MIN_PLAYERS}
                            title={totalPlayers < MIN_PLAYERS ? `At least ${MIN_PLAYERS} players are required` : ''}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Force Start Game
                          </Button>
                        )}
                        
                        <p className="text-xs text-cyber-cyan/50 mt-2 text-center">
                          💡 Force start requires at least {MIN_PLAYERS} players and is available 3 seconds after new players join
                        </p>
                      </div>
                    )}

                    {/* 玩家数量不足提示 */}
                    {totalPlayers < MIN_PLAYERS && (
                      <div className="text-center text-yellow-400 text-xs bg-yellow-400/10 py-2 px-3 rounded border border-yellow-400/20">
                        <div className="font-medium mb-0.5">Waiting for More Players</div>
                        <div className="text-xs opacity-80">
                          {totalPlayers}/{MIN_PLAYERS} players joined. Need {MIN_PLAYERS - totalPlayers} more to start.
                        </div>
                      </div>
                    )}

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
                  <div>Is Host: {isHost ? 'YES' : 'NO'}</div>
                  <div>Force Countdown: {forceStartCountdown}</div>
                  <div>Ready Count: {readyCount}/{totalPlayers}</div>
                  <div>Time: {new Date().toLocaleTimeString()}</div>
                </div>
              </CardContent>
            </Card>

            {/* Room Info */}
            <Card className="cyber-panel">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-cyber-cyan text-sm">
                  <Users className="w-4 h-4" />
                  Room Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Room Details - Compact Grid */}
                <div className="grid grid-cols-1 gap-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-cyber-cyan/70">ID:</span>
                    <span className="text-cyber-cyan font-mono">
                      {activeRoom.id.slice(-8)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-cyber-cyan/70">Status:</span>
                    <span className="text-cyber-cyan capitalize">{activeRoom.status}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-cyber-cyan/70">Created:</span>
                    <span className="text-cyber-cyan text-sm">
                      {activeRoom.createdAt ? (
                        new Date(activeRoom.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })
                      ) : (
                        (() => {
                          // 备用方案：从房间ID中提取时间戳
                          // 房间ID格式: room_${timestamp}_${random}
                          const match = activeRoom.id.match(/room_(\d+)_/);
                          if (match) {
                            const timestamp = parseInt(match[1]);
                            return new Date(timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                          }
                          return <span className="text-red-400">No creation time</span>;
                        })()
                      )}
                    </span>
                  </div>
                </div>

                {/* Share Room Section - Compact */}
                <div className="border-t border-cyber-cyan/20 pt-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Share2 className="w-3 h-3 text-cyber-cyan" />
                    <span className="text-xs font-medium text-cyber-cyan">Share Room</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      <div className="flex-1 bg-cyber-darker border border-cyber-cyan/20 rounded px-2 py-1">
                        <div className="text-xs text-cyber-cyan/70 font-mono">
                          {/* PC端显示完整URL，移动端显示省略版本 */}
                          <span className="hidden sm:inline">{shareUrl}</span>
                          <span className="sm:hidden">
                            {shareUrl.length > 40 
                              ? `${shareUrl.substring(0, 20)}...${shareUrl.substring(shareUrl.length - 17)}`
                              : shareUrl
                            }
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        onClick={handleCopyShareUrl}
                        size="sm"
                        variant="outline"
                        className="border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/10 px-2 py-1 h-auto"
                      >
                        {shareUrlCopied ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                    
                    <div className="text-xs text-cyber-cyan/50">
                      💡 Share link to invite friends
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
