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
import { ROOM_JOIN_TIMEOUT } from '../utils/gameConstants';

export const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useWeb3Auth();
  const { currentRoom, setCurrentRoom, joinRoom, leaveRoom, spectateRoom, leaveSpectator, rooms, isConnected, isSpectator, spectatorRoom } = useRoomContext();
  const { joinSession, isConnecting, error: connectionError } = useMultisynq();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [joinState, setJoinState] = useState<'idle' | 'waiting' | 'joining' | 'spectating' | 'success' | 'error'>('waiting');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [hasAttemptedJoin, setHasAttemptedJoin] = useState(false);
  const previousRoomIdRef = useRef<string | undefined>(undefined);
  const pageLoadTimeRef = useRef<number>(Date.now());

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
      if (joinState !== 'success') {
        setJoinState('success');
      }
      return;
    }

    // 增强检测：即使 currentRoom 还没更新，也检查用户是否已经在目标房间的玩家列表中
    if (!currentRoom && rooms.length > 0 && user?.address) {
      const targetRoom = rooms.find(r => r.id === roomId);
      if (targetRoom && targetRoom.players.some(p => p.address === user.address)) {
        console.log('RoomPage: User found in target room players list, setting success state and currentRoom', {
          roomId: targetRoom.id,
          roomName: targetRoom.name,
          roomStatus: targetRoom.status,
          playersCount: targetRoom.players.length,
          userInPlayers: true,
          joinState: joinState
        });
        
        // 主动设置currentRoom状态，因为用户已经在房间中
        setCurrentRoom({ ...targetRoom });
        
        if (joinState !== 'success') {
          setJoinState('success');
        }
        return;
      }
    }

    // 如果在观察者模式中且正在观看目标房间，也标记为成功
    if (isSpectator && spectatorRoom && spectatorRoom.id === roomId) {
      console.log('RoomPage: Already spectating target room, setting success state', {
        roomId: spectatorRoom.id,
        roomName: spectatorRoom.name,
        roomStatus: spectatorRoom.status
      });
      if (joinState !== 'success') {
        setJoinState('success');
      }
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

    // 检查目标房间是否存在 - 但不立即显示错误，让5秒超时机制处理
    const targetRoom = rooms.find(room => room.id === roomId);
    if (!targetRoom) {
      console.log('RoomPage: Target room not found yet, waiting for timeout or room list update...', {
        roomId,
        roomsCount: rooms.length,
        hasAttemptedJoin,
        joinState
      });
      // 不立即设置错误状态，让5秒超时机制处理所有错误情况
      if (joinState !== 'waiting') {
        setJoinState('waiting');
      }
      return;
    }

    // 如果已经尝试过加入，不要重复尝试
    if (hasAttemptedJoin) {
      console.log('RoomPage: Already attempted join, waiting for state update...');
      return;
    }

    // 如果正在加入过程中，不要重复尝试
    if (joinState === 'joining' || joinState === 'spectating') {
      console.log('RoomPage: Join in progress, waiting for completion...');
      return;
    }

    console.log('RoomPage: Attempting to join/spectate room', {
      roomId,
      roomStatus: targetRoom.status
    });

    setHasAttemptedJoin(true);
    setJoinError(null);

    // 检查用户是否是房间中的玩家
    const isPlayerInRoom = targetRoom.players.some(player => player.address === user?.address);
    
    // 如果房间正在进行游戏或倒计时，但用户是玩家，则直接加入；否则进入观察者模式
    if (targetRoom.status === 'playing' || targetRoom.status === 'countdown' || targetRoom.status === 'finished') {
      if (isPlayerInRoom) {
        console.log('RoomPage: User is a player in the ongoing/finished game, joining as player');
        setJoinState('joining');
        
        // 使用立即执行的异步函数来处理joinRoom的异步调用
        (async () => {
          try {
            const success = await joinRoom(roomId);
            if (!success) {
              console.error('RoomPage: Join room call returned false for player in ongoing game');
              // 不立即设置错误，让5秒超时机制处理
            }
            // 如果成功，等待currentRoom更新后会自动设置为success
          } catch (error) {
            console.error('RoomPage: Join room call threw error for player in ongoing game:', error);
            // 不立即设置错误，让5秒超时机制处理
          }
        })();
      } else {
        console.log('RoomPage: Room is in progress and user is not a player, entering spectator mode');
        setJoinState('spectating');
        const success = spectateRoom(roomId);
        if (success) {
          console.log('RoomPage: Successfully entered spectator mode');
          setJoinState('success');
        } else {
          console.error('RoomPage: Failed to enter spectator mode');
          // 不立即设置错误，让5秒超时机制处理
        }
      }
    } else {
      // 房间在等待状态，尝试作为玩家加入
      console.log('RoomPage: Room is waiting, attempting to join as player');
      setJoinState('joining');
      
      // 使用立即执行的异步函数来处理joinRoom的异步调用
      (async () => {
        try {
          const success = await joinRoom(roomId);
          if (!success) {
            console.error('RoomPage: Join room call returned false');
            // 不立即设置错误，让5秒超时机制处理
          }
          // 如果成功，等待currentRoom更新后会自动设置为success
        } catch (error) {
          console.error('RoomPage: Join room call threw error:', error);
          // 不立即设置错误，让5秒超时机制处理
        }
      })();
    }
  }, [isAuthenticated, isConnected, roomId, currentRoom?.id, rooms, hasAttemptedJoin, user?.address, isSpectator, spectatorRoom?.id, joinState]);

  // 全局5秒超时检查 - 无论什么原因，如果5秒后仍未成功进入房间则显示错误
  useEffect(() => {
    if (!isConnected || !roomId || joinState === 'error' || joinState === 'success') {
      return;
    }

    // 如果用户已经在房间中，不需要超时处理
    if ((currentRoom && currentRoom.id === roomId) || (isSpectator && spectatorRoom && spectatorRoom.id === roomId)) {
      return;
    }

    console.log(`RoomPage: Setting ${ROOM_JOIN_TIMEOUT}-second global timeout for room entry`);
    const timeoutId = setTimeout(() => {
      // 最终检查：用户是否已经成功进入房间
      const userInCurrentRoom = currentRoom && currentRoom.id === roomId;
      const userInSpectatorRoom = isSpectator && spectatorRoom && spectatorRoom.id === roomId;
      
      // 增强检测：检查用户是否在房间的玩家列表中（即使 currentRoom 未更新）
      let userInRoomPlayersList = false;
      if (!userInCurrentRoom && !userInSpectatorRoom && user?.address && rooms.length > 0) {
        const targetRoom = rooms.find(r => r.id === roomId);
        userInRoomPlayersList = targetRoom && targetRoom.players.some(p => p.address === user.address);
      }
      
      const userInRoom = userInCurrentRoom || userInSpectatorRoom || userInRoomPlayersList;
      
      if (!userInRoom) {
        console.log(`RoomPage: ${ROOM_JOIN_TIMEOUT}-second timeout reached - user not in room`, {
          roomId,
          currentRoomId: currentRoom?.id,
          spectatorRoomId: spectatorRoom?.id,
          isSpectator,
          joinState: joinState,
          roomsCount: rooms.length,
          targetRoomExists: rooms.some(r => r.id === roomId),
          userInCurrentRoom,
          userInSpectatorRoom,
          userInRoomPlayersList,
          userAddress: user?.address
        });
        
        setJoinState('error');
        const targetRoomExists = rooms.some(r => r.id === roomId);
        if (targetRoomExists) {
          setJoinError('Unable to join the room. Please try again.');
        } else {
          setJoinError(`Room "${roomId}" does not exist or has expired.`);
        }
      }
    }, ROOM_JOIN_TIMEOUT * 1000);

    return () => clearTimeout(timeoutId);
  }, [isConnected, roomId, joinState, currentRoom?.id, isSpectator, spectatorRoom?.id, rooms, user?.address]);

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
  if (joinState === 'waiting' || joinState === 'joining' || joinState === 'spectating') {
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
    } else if (joinState === 'spectating') {
      statusText = 'Entering spectator mode...';
      subText = 'Preparing to watch the game...';
    } else if (isConnected && rooms.length === 0) {
      statusText = 'Loading rooms...';
      subText = 'Fetching room data...';
    } else if (isConnected) {
      statusText = 'Finding room...';
      subText = 'Locating the room you want to join...';
    }

    return (
      <div className="min-h-screen bg-cyber-darker flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyber-cyan mx-auto mb-4" />
          <div className="text-cyber-cyan mb-2">{statusText}</div>
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
  // 而且要确保不是初始加载阶段，避免闪现（页面加载后3秒内不显示）
  const timeSincePageLoad = Date.now() - pageLoadTimeRef.current;
  if (!isSpectator && currentRoom && currentRoom.id !== roomId && timeSincePageLoad > 3000) {
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
        {/* 移动端：只显示图标，PC端：显示文字 */}
        <Button
          onClick={handleLeaveRoom}
          variant="outline"
          className="border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/10"
          title={isSpectator ? 'Stop Watching' : 'Back to Lobby'}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline ml-2">
            {isSpectator ? 'Stop Watching' : 'Back to Lobby'}
          </span>
        </Button>
        
        <div className="flex-shrink-0">
          <Web3AuthButton />
        </div>
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
              Back to Room
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
