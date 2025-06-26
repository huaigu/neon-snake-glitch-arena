
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { useMultisynq } from '../contexts/MultisynqContext';
import { RoomList } from '../components/RoomList';
import { Leaderboard } from '../components/Leaderboard';
import { Web3AuthButton } from '../components/Web3AuthButton';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, Loader2, Users, Trophy } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle } from 'lucide-react';

const GameLobbyPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useWeb3Auth();
  const { joinSession, isConnected, isConnecting, error } = useMultisynq();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    // 用户登录后自动加入Multisynq会话，但只调用一次
    if (isAuthenticated && !isConnected && !isConnecting) {
      console.log('Auto-joining Multisynq session...');
      joinSession();
    }
  }, [isAuthenticated, isConnected, isConnecting, navigate, joinSession]);

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

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-cyber-darker flex items-center justify-center">
        <div className="flex items-center gap-3 text-cyber-cyan">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Connecting to lobby session...</span>
        </div>
      </div>
    );
  }

  if (error && !isConnected) {
    return (
      <div className="min-h-screen bg-cyber-darker flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert className="border-red-500/50 bg-red-500/10 mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-400">
              Failed to connect to lobby session: {error}
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button 
              onClick={() => joinSession()} 
              className="flex-1 bg-cyber-cyan hover:bg-cyber-cyan/80 text-cyber-darker"
            >
              Retry Connection
            </Button>
            <Button 
              onClick={handleReturnHome} 
              variant="outline"
              className="flex-1 border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/10"
            >
              Return Home
            </Button>
          </div>
        </div>
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
      
      <div className="p-4">
        <Tabs defaultValue="rooms" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-cyber-darker border border-cyber-cyan/20">
            <TabsTrigger 
              value="rooms" 
              className="flex items-center gap-2 data-[state=active]:bg-cyber-cyan/20 data-[state=active]:text-cyber-cyan text-cyber-cyan/70"
            >
              <Users className="w-4 h-4" />
              Game Rooms
            </TabsTrigger>
            <TabsTrigger 
              value="leaderboard" 
              className="flex items-center gap-2 data-[state=active]:bg-cyber-cyan/20 data-[state=active]:text-cyber-cyan text-cyber-cyan/70"
            >
              <Trophy className="w-4 h-4" />
              Leaderboard
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="rooms" className="mt-4">
            <RoomList />
          </TabsContent>
          
          <TabsContent value="leaderboard" className="mt-4">
            <Leaderboard snakes={[]} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GameLobbyPage;
