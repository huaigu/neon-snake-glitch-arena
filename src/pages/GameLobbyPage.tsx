
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { useMultisynq } from '../contexts/MultisynqContext';
import { RoomList } from '../components/RoomList';
import { Web3AuthButton } from '../components/Web3AuthButton';
import { Button } from '../components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

const GameLobbyPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useWeb3Auth();
  const { joinSession, isConnected } = useMultisynq();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    // 用户登录后自动加入Multisynq会话
    if (isAuthenticated && !isConnected) {
      joinSession();
    }
  }, [isAuthenticated, isConnected, navigate, joinSession]);

  const handleReturnHome = () => {
    navigate('/');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cyber-darker flex items-center justify-center">
        <div className="text-cyber-cyan">Redirecting to authentication...</div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-cyber-darker flex items-center justify-center">
        <div className="flex items-center gap-3 text-cyber-cyan">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Connecting to lobby session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-darker">
      <div className="p-4 flex justify-between items-center">
        <Button
          onClick={handleReturnHome}
          variant="outline"
          className="border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/10 hover:border-cyber-cyan/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Home
        </Button>
        
        <Web3AuthButton />
      </div>
      <RoomList />
    </div>
  );
};

export default GameLobbyPage;
