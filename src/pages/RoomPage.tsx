import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { useRoomContext } from '../contexts/RoomContext';
import { GameLobbyComponent } from '../components/GameLobbyComponent';
import { Web3AuthButton } from '../components/Web3AuthButton';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
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
  const { currentRoom, leaveRoom } = useRoomContext();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cyber-darker flex items-center justify-center">
        <div className="text-cyber-cyan">Redirecting to authentication...</div>
      </div>
    );
  }

  if (!currentRoom || currentRoom.id !== roomId) {
    return (
      <div className="min-h-screen bg-cyber-darker flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-cyber-cyan mb-4">
            Room does not exist or has expired
          </h2>
          <Button onClick={() => navigate('/lobby')}>
            Back to Lobby
          </Button>
        </div>
      </div>
    );
  }

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
