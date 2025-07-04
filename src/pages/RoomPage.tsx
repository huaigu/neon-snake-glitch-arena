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

  // 主要的房间状态检查和加入逻辑
  useEffect(() => {
    console.log('RoomPage: Key state changed:', {
      roomId,
      isAuthenticated,
      isConnected,
      isConnecting,
      connectionError,
      currentRoomId: currentRoom?.id,
      roomsCount: rooms.length,
      joinState,
      hasAttemptedJoin,
      userAddress: user?.address,
      isSpectator,
      spectatorRoomId: spectatorRoom?.id
    });

    // 基础条件检查
    if (!isAuthenticated || !isConnected || !roomId || isConnecting) {
      console.log('RoomPage: Basic conditions not met, waiting...');
      return;
    }

    if (connectionError) {
      console.log('RoomPage: Connection error detected');
      setJoinState('error');
      setJoinError(connectionError);
      return;
    }

    // 检查是否正在进行加入尝试（防止重复调用）
    const currentJoinAttempt = window.currentJoinAttempt;
    if (currentJoinAttempt && currentJoinAttempt.userAddress === user?.address && currentJoinAttempt.roomId === roomId) {
      console.log('RoomPage: Join attempt already in progress, waiting for completion...');
      return;
    }

    console.log('RoomPage: Room state check triggered', {
      isAuthenticated,
      isConnected,
      roomId,
      currentRoomId: currentRoom?.id,
      isSpectator,
      spectatorRoomId: spectatorRoom?.id,
      joinState,
      hasAttemptedJoin,
      roomsCount: rooms.length
    });

    // 如果用户已经在当前房间中，直接设置成功状态
    if (currentRoom && currentRoom.id === roomId) {
      console.log('RoomPage: User already in target room via currentRoom, setting success state');
      setJoinState('success');
      return;
    }

    // 如果用户已经在观察者模式中观看目标房间，设置成功状态
    if (isSpectator && spectatorRoom && spectatorRoom.id === roomId) {
      console.log('RoomPage: User already spectating target room, setting success state');
      setJoinState('success');
      return;
    }

    // 检查用户是否已经在目标房间的玩家列表中（但currentRoom状态还没更新）
    if (user?.address && rooms.length > 0) {
      const targetRoom = rooms.find(r => r.id === roomId);
      if (targetRoom) {
        const isPlayerInRoom = targetRoom.players.some(player => player.address === user.address);
        if (isPlayerInRoom) {
          console.log('RoomPage: User found in target room players list, setting success state and currentRoom', {
            roomId: targetRoom.id,
            roomName: targetRoom.name,
            roomStatus: targetRoom.status,
            playersCount: targetRoom.players.length,
            userInPlayers: true,
            userAddress: user.address
          });
          setJoinState('success');
          // 直接设置currentRoom状态，避免等待回调
          setCurrentRoom({ ...targetRoom });
          return;
        }
      }
    }

    // 如果房间数据还没加载完成，等待
    if (rooms.length === 0) {
      console.log('RoomPage: No rooms data available yet, waiting...');
      return;
    }

    // 查找目标房间
    const targetRoom = rooms.find(r => r.id === roomId);
    if (!targetRoom) {
      console.log('RoomPage: Target room not found in rooms list:', {
        targetRoomId: roomId,
        availableRooms: rooms.map(r => ({ id: r.id, name: r.name }))
      });
      setJoinState('error');
      setJoinError('Room not found');
      return;
    }

    // 检查用户是否已经在房间中
    const isPlayerInRoom = user?.address && targetRoom.players.some(player => player.address === user.address);

    // 如果已经尝试过加入，等待状态更新
    if (hasAttemptedJoin) {
      console.log('RoomPage: Already attempted join, waiting for state update...');
      return;
    }

    console.log('RoomPage: Attempting to join/spectate room', {
      roomId: targetRoom.id,
      roomStatus: targetRoom.status
    });

    // 标记已尝试加入，防止重复调用
    setHasAttemptedJoin(true);
    
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
    // 基础条件检查：没有连接或没有roomId时不启动超时
    if (!isConnected || !roomId) {
      return;
    }

    // 如果已经成功或者已经出错，不需要超时处理
    if (joinState === 'error' || joinState === 'success') {
      return;
    }

    // 如果用户已经在房间中，不需要超时处理
    if ((currentRoom && currentRoom.id === roomId) || (isSpectator && spectatorRoom && spectatorRoom.id === roomId)) {
      return;
    }

    // 增强检测：如果用户已经在目标房间的玩家列表中，也不需要超时处理
    if (user?.address && rooms.length > 0) {
      const targetRoom = rooms.find(r => r.id === roomId);
      const userInRoomPlayersList = targetRoom && targetRoom.players.some(p => p.address === user.address);
      if (userInRoomPlayersList) {
        return;
      }
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
        
        // 5秒超时后自动返回lobby
        console.log(`RoomPage: Auto-navigating to lobby after ${ROOM_JOIN_TIMEOUT}-second timeout`);
        navigate('/lobby');
      }
    }, ROOM_JOIN_TIMEOUT * 1000);

    return () => clearTimeout(timeoutId);
  }, [isConnected, roomId, currentRoom?.id, isSpectator, spectatorRoom?.id, rooms, user?.address, navigate]);

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
