import React, { useEffect, useState } from 'react';
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

const RoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useWeb3Auth();
  const { currentRoom, joinRoom, leaveRoom, rooms, isConnected } = useRoomContext();
  const { joinSession, isConnecting, error: connectionError } = useMultisynq();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [joinState, setJoinState] = useState<'waiting' | 'joining' | 'success' | 'error'>('waiting');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [hasAttemptedJoin, setHasAttemptedJoin] = useState(false);

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

  // 核心房间加入逻辑 - 等待连接建立和房间数据可用
  useEffect(() => {
    if (!isAuthenticated || !roomId) {
      return;
    }

    console.log('RoomPage: Room join effect triggered', {
      isAuthenticated,
      isConnected, 
      roomId,
      hasAttemptedJoin,
      roomsCount: rooms.length,
      currentRoomId: currentRoom?.id,
      joinState
    });

    // 如果已经在目标房间中，标记为成功
    if (currentRoom && currentRoom.id === roomId) {
      console.log('RoomPage: Already in target room', roomId);
      setJoinState('success');
      setHasAttemptedJoin(true);
      return;
    }

    // 如果在其他房间中，需要先离开
    if (currentRoom && currentRoom.id !== roomId) {
      console.log('RoomPage: In different room, need to leave first', {
        currentRoomId: currentRoom.id,
        targetRoomId: roomId
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
      setHasAttemptedJoin(true);
      return;
    }

    // 如果已经尝试过加入，不要重复尝试
    if (hasAttemptedJoin) {
      return;
    }

    // 开始加入房间
    console.log('RoomPage: All conditions met, attempting to join room', {
      roomId,
      targetRoom: {
        id: targetRoom.id,
        name: targetRoom.name,
        playersCount: targetRoom.players.length,
        maxPlayers: targetRoom.maxPlayers,
        status: targetRoom.status
      }
    });

    setJoinState('joining');
    setJoinError(null);
    setHasAttemptedJoin(true);

    try {
      const success = joinRoom(roomId);
      if (success) {
        console.log('RoomPage: Join room call succeeded');
        // 不要立即设置成功状态，等待currentRoom更新
      } else {
        console.error('RoomPage: Join room call failed');
        setJoinState('error');
        setJoinError('Failed to join room. The room may be full or unavailable.');
      }
    } catch (error) {
      console.error('RoomPage: Exception during join room:', error);
      setJoinState('error');
      setJoinError('An error occurred while joining the room.');
    }
  }, [isAuthenticated, isConnected, roomId, currentRoom, rooms, joinRoom, hasAttemptedJoin, joinState]);

  // 监听 currentRoom 变化来确定加入是否成功
  useEffect(() => {
    if (currentRoom && currentRoom.id === roomId && joinState === 'joining') {
      console.log('RoomPage: Successfully joined room - currentRoom updated', {
        roomId: currentRoom.id,
        roomName: currentRoom.name
      });
      setJoinState('success');
    }
  }, [currentRoom, roomId, joinState]);

  // 重置状态当roomId变化时
  useEffect(() => {
    setHasAttemptedJoin(false);
    setJoinState('waiting');
    setJoinError(null);
  }, [roomId]);

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
    let isNavigating = false;

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
    leaveRoom();
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

  // 房间不匹配状态（在其他房间中）
  if (currentRoom && currentRoom.id !== roomId) {
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

  // 成功状态但currentRoom还未更新
  if (joinState === 'success' && !currentRoom) {
    return (
      <div className="min-h-screen bg-cyber-darker flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyber-cyan mx-auto mb-4" />
          <div className="text-cyber-cyan">Loading room data...</div>
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
          Back to Lobby
        </Button>
        
        <Web3AuthButton />
      </div>
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
