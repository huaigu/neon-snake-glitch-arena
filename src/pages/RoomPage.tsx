import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { useRoomContext } from '../contexts/RoomContext';
import { useMultisynq } from '../contexts/MultisynqContext';
import { GameLobbyComponent } from '../components/GameLobbyComponent';
import { Web3AuthButton } from '../components/Web3AuthButton';
import { Button } from '../components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

export const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useWeb3Auth();
  const { currentRoom, joinRoom, leaveRoom, spectateRoom, leaveSpectator, rooms, isConnected, isSpectator, spectatorRoom } = useRoomContext();
  const { joinSession, isConnecting, error: connectionError } = useMultisynq();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [joinState, setJoinState] = useState<'idle' | 'waiting' | 'joining' | 'spectating' | 'success' | 'error'>('waiting');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [hasAttemptedJoin, setHasAttemptedJoin] = useState(false);
  const previousRoomIdRef = useRef<string | undefined>(undefined);

  // 组件挂载时的一次性清理检查
  const hasInitialCleanup = useRef(false);
  useEffect(() => {
    if (!hasInitialCleanup.current && isSpectator && spectatorRoom && roomId && spectatorRoom.id !== roomId) {
      console.log('RoomPage: Initial cleanup of mismatched spectator state', {
        roomId,
        spectatorRoomId: spectatorRoom.id
      });
      leaveSpectator();
      hasInitialCleanup.current = true;
    }
  }, [isSpectator, spectatorRoom, roomId, leaveSpectator]);

  // 重定向到登录页面，如果用户未认证
  useEffect(() => {
    if (!isAuthenticated) {
      // 保存当前URL用于登录后跳转
      sessionStorage.setItem('redirectAfterAuth', location.pathname);
      navigate('/auth');
    }
  }, [isAuthenticated, navigate, location.pathname]);

  // 自动连接Multisynq会话（如果还未连接）
  useEffect(() => {
    if (isAuthenticated && !isConnected && !isConnecting && !connectionError) {
      console.log('RoomPage: Auto-connecting to Multisynq session...');
      joinSession().catch(error => {
        console.error('RoomPage: Failed to auto-connect:', error);
      });
    }
  }, [isAuthenticated, isConnected, isConnecting, connectionError, joinSession]);

  // 添加调试用的effect，监控关键状态变化
  useEffect(() => {
    console.log('RoomPage: Key state changed:', {
      roomId,
      isAuthenticated,
      isConnected,
      isConnecting,
      connectionError: !!connectionError,
      roomsCount: rooms.length,
      roomsList: rooms.map(r => ({ id: r.id, name: r.name, players: r.players.length })),
      currentRoomId: currentRoom?.id,
      joinState,
      hasAttemptedJoin,
      timestamp: new Date().toISOString()
    });
  }, [roomId, isAuthenticated, isConnected, isConnecting, connectionError, rooms.length, currentRoom?.id, joinState, hasAttemptedJoin]);

  // 简化的房间状态检查逻辑
  useEffect(() => {
    if (!isAuthenticated || !roomId) {
      return;
    }

    console.log('RoomPage: Room state check triggered', {
      isAuthenticated,
      isConnected, 
      roomId,
      currentRoomId: currentRoom?.id,
      isSpectator,
      spectatorRoomId: spectatorRoom?.id,
      joinState
    });

    // 清理陈旧的观察者状态 - 如果当前roomId与观察者房间不匹配
    if (isSpectator && spectatorRoom && spectatorRoom.id !== roomId) {
      console.log('RoomPage: Clearing stale spectator state', {
        currentRoomId: roomId,
        spectatorRoomId: spectatorRoom.id
      });
      leaveSpectator();
    }

    // 如果已经在目标房间中，直接标记为成功
    if (currentRoom && currentRoom.id === roomId) {
      console.log('RoomPage: Already in target room, setting success state', {
        roomId: currentRoom.id,
        roomName: currentRoom.name,
        roomStatus: currentRoom.status,
        playersCount: currentRoom.players?.length || 0,
        userAddress: user?.address,
        userInPlayers: currentRoom.players?.some(p => p.address === user?.address) || false
      });
      setJoinState('success');
      return;
    }

    // 如果在其他房间中，显示房间不匹配（不考虑观察者状态）
    if (!isSpectator && currentRoom && currentRoom.id !== roomId) {
      console.log('RoomPage: In different room', {
        currentRoomId: currentRoom.id,
        targetRoomId: roomId,
        isSpectator
      });
      return; // UI会显示房间不匹配的提示
    }

    // 等待连接建立
    if (!isConnected) {
      console.log('RoomPage: Waiting for connection...');
      setJoinState('waiting');
      return;
    }

    // 连接已建立，等待房间列表加载
    if (rooms.length === 0) {
      console.log('RoomPage: Connected but waiting for room list...');
      setJoinState('waiting');
      return;
    }

    // 检查目标房间是否存在
    const targetRoom = rooms.find(room => room.id === roomId);
    if (!targetRoom) {
      console.log('RoomPage: Target room not found in loaded rooms', {
        roomId,
        availableRooms: rooms.map(r => ({ id: r.id, name: r.name }))
      });
      setJoinState('error');
      setJoinError(`Room "${roomId}" does not exist or has expired.`);
      return;
    }

    // 如果已经尝试过加入，不要重复尝试
    if (hasAttemptedJoin) {
      console.log('RoomPage: Already attempted join, waiting for state update...');
      return;
    }

    console.log('RoomPage: Attempting to join/spectate room', {
      roomId,
      roomStatus: targetRoom.status
    });

    setHasAttemptedJoin(true);
    setJoinError(null);

    // 如果房间正在进行游戏或倒计时，进入观察者模式
    if (targetRoom.status === 'playing' || targetRoom.status === 'countdown' || targetRoom.status === 'finished') {
      console.log('RoomPage: Room is in progress, entering spectator mode');
      setJoinState('spectating');
      const success = spectateRoom(roomId);
      if (success) {
        console.log('RoomPage: Successfully entered spectator mode');
        setJoinState('success');
      } else {
        console.error('RoomPage: Failed to enter spectator mode');
        setJoinState('error');
        setJoinError('Failed to spectate room. The room may not be available.');
      }
    } else {
      // 房间在等待状态，尝试作为玩家加入
      console.log('RoomPage: Room is waiting, attempting to join as player');
      setJoinState('joining');
      const success = joinRoom(roomId);
      if (!success) {
        console.error('RoomPage: Join room call failed');
        setJoinState('error');
        setJoinError('Failed to join room. The room may be full or unavailable.');
      }
      // 如果成功，等待currentRoom更新后会自动设置为success
    }
  }, [isAuthenticated, isConnected, roomId, currentRoom, rooms, joinRoom, spectateRoom, leaveSpectator, hasAttemptedJoin, user?.address, isSpectator, spectatorRoom?.id]);

  // 重置状态当roomId真正变化时（避免初始化时的重置）
  useEffect(() => {
    const previousRoomId = previousRoomIdRef.current;
    
    console.log('RoomPage: RoomId effect triggered:', {
      previousRoomId,
      newRoomId: roomId,
      currentRoomId: currentRoom?.id,
      currentJoinState: joinState
    });
    
    // 更新ref
    previousRoomIdRef.current = roomId;
    
    // 如果这是第一次设置roomId（从undefined到实际值），并且用户已经在房间中，不要重置
    if (previousRoomId === undefined && currentRoom && currentRoom.id === roomId) {
      console.log('RoomPage: Initial roomId set and user already in room, skipping reset');
      return;
    }
    
    // 如果roomId没有实际变化，不要重置
    if (previousRoomId === roomId) {
      console.log('RoomPage: RoomId unchanged, skipping reset');
      return;
    }
    
    // 只有当roomId真正变化时才重置状态
    if (previousRoomId !== undefined) {
      console.log('RoomPage: RoomId changed from', previousRoomId, 'to', roomId, '- resetting state');
      setHasAttemptedJoin(false);
      setJoinState('waiting');
      setJoinError(null);
    }
  }, [roomId, currentRoom?.id, joinState]);

  // 监听路由变化，当用户尝试离开房间页面时显示确认对话框
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentRoom) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave the room?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentRoom]);

  // 处理路由变化的守护逻辑
  useEffect(() => {
    const isNavigating = false;

    const handlePopState = (e: PopStateEvent) => {
      if (currentRoom && !isNavigating) {
        e.preventDefault();
        window.history.pushState(null, '', location.pathname);
        setShowLeaveDialog(true);
        setPendingNavigation('/lobby');
      }
    };

    // 监听浏览器后退按钮
    window.addEventListener('popstate', handlePopState);

    // 阻止初始的后退
    window.history.pushState(null, '', location.pathname);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentRoom, location.pathname]);

  const handleLeaveRoom = () => {
    setShowLeaveDialog(true);
  };

  const confirmLeaveRoom = () => {
    if (isSpectator) {
      leaveSpectator();
    } else {
      leaveRoom();
    }
    setShowLeaveDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    } else {
      navigate('/lobby');
    }
  };

  const cancelLeaveRoom = () => {
    setShowLeaveDialog(false);
    setPendingNavigation(null);
  };

  const handleRetryJoin = () => {
    console.log('RoomPage: Retrying room join');
    setHasAttemptedJoin(false);
    setJoinState('waiting');
    setJoinError(null);
  };

  // 未认证状态
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cyber-darker flex items-center justify-center">
        <div className="text-cyber-cyan">Redirecting to authentication...</div>
      </div>
    );
  }

  // 等待连接或加入中状态
  if (joinState === 'waiting' || joinState === 'joining') {
    let statusText = 'Connecting to game server...';
    let subText = '';
    
    if (isConnecting) {
      statusText = 'Connecting to game server...';
      subText = 'Establishing connection...';
    } else if (connectionError) {
      statusText = 'Connection failed';
      subText = connectionError;
    } else if (!isConnected) {
      statusText = 'Connecting to game server...';
      subText = 'Please wait...';
    } else if (joinState === 'joining') {
      statusText = 'Joining room...';
      subText = 'Adding you to the room...';
    } else if (isConnected && rooms.length === 0) {
      statusText = 'Loading rooms...';
      subText = 'Fetching room data...';
    } else if (isConnected) {
      statusText = 'Preparing to join room...';
      subText = 'Validating room access...';
    }

    return (
      <div className="min-h-screen bg-cyber-darker flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyber-cyan mx-auto mb-4" />
          <div className="text-cyber-cyan mb-2">{statusText}</div>
          {subText && (
            <div className="text-cyber-cyan/70 text-sm mb-4">{subText}</div>
          )}
          {roomId && (
            <div className="text-cyber-cyan/50 text-xs">
              Target Room: {roomId.slice(-8)}...
            </div>
          )}
          {connectionError && (
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-cyber-cyan hover:bg-cyber-cyan/80 text-cyber-darker"
            >
              Retry Connection
            </Button>
          )}
        </div>
      </div>
    );
  }

  // 加入失败状态
  if (joinState === 'error') {
    return (
      <div className="min-h-screen bg-cyber-darker flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-cyber-cyan mb-4">
            Unable to Join Room
          </h2>
          <p className="text-cyber-cyan/70 mb-6">
            {joinError || 'The room you\'re trying to join is not available.'}
          </p>
          <div className="space-y-3">
            <Button 
              onClick={handleRetryJoin} 
              className="bg-cyber-cyan hover:bg-cyber-cyan/80 text-cyber-darker w-full"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => navigate('/lobby')} 
              variant="outline"
              className="border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/10 w-full"
            >
              Go to Lobby
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 房间不匹配状态（在其他房间中）- 只有在非观察者模式下才检查
  if (!isSpectator && currentRoom && currentRoom.id !== roomId) {
    return (
      <div className="min-h-screen bg-cyber-darker flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-cyber-cyan mb-4">
            Room Mismatch
          </h2>
          <p className="text-cyber-cyan/70 mb-6">
            You are currently in room "{currentRoom.name}". Please leave your current room first.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => navigate(`/room/${currentRoom.id}`)}
              className="bg-cyber-cyan hover:bg-cyber-cyan/80 text-cyber-darker w-full"
            >
              Go to Current Room
            </Button>
            <Button 
              onClick={() => navigate('/lobby')}
              variant="outline"
              className="border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/10 w-full"
            >
              Back to Lobby
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 成功状态但房间数据还未更新
  if (joinState === 'success' && !currentRoom && !isSpectator) {
    return (
      <div className="min-h-screen bg-cyber-darker flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyber-cyan mx-auto mb-4" />
          <div className="text-cyber-cyan">Loading room data...</div>
        </div>
      </div>
    );
  }

  // 观察者模式等待房间数据
  if (isSpectator && !spectatorRoom) {
    return (
      <div className="min-h-screen bg-cyber-darker flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyber-cyan mx-auto mb-4" />
          <div className="text-cyber-cyan">Loading spectator view...</div>
        </div>
      </div>
    );
  }

  // 正常房间状态
  return (
    <div className="min-h-screen bg-cyber-darker">
      <div className="p-4 flex justify-between items-center">
        <Button
          onClick={handleLeaveRoom}
          variant="outline"
          className="border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {isSpectator ? 'Stop Watching' : 'Back to Lobby'}
        </Button>
        
        <Web3AuthButton />
      </div>

      {/* 观察者模式提示 */}
      {isSpectator && spectatorRoom && (
        <div className="mx-4 mb-4 p-4 bg-cyber-purple/10 border border-cyber-purple/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-cyber-purple rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
            <div>
              <h3 className="font-bold text-cyber-purple mb-1">Spectator Mode</h3>
              <p className="text-sm text-cyber-purple/80">
                {spectatorRoom.status === 'playing' ? 
                  'Game is currently in progress. You are watching as a spectator.' :
                  spectatorRoom.status === 'finished' ?
                  'Game has ended. You joined as a spectator.' :
                  'You joined while the game was starting. You will watch this round as a spectator.'
                }
              </p>
              {spectatorRoom.status === 'waiting' && (
                <p className="text-xs text-cyber-purple/60 mt-1">
                  To participate in the next game, please refresh this page.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <GameLobbyComponent />

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent className="cyber-panel">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-cyber-cyan">Leave Room</AlertDialogTitle>
            <AlertDialogDescription className="text-cyber-cyan/70">
              Are you sure you want to leave the room? Other players will be notified and you will need to join again if you want to continue playing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={cancelLeaveRoom}
              className="border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/10"
            >
              Stay in Room
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmLeaveRoom}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Leave Room
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RoomPage;
