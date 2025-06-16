
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { useRoomContext } from '../contexts/RoomContext';
import { GameLobbyComponent } from '../components/GameLobbyComponent';
import { Web3AuthButton } from '../components/Web3AuthButton';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';

const RoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useWeb3Auth();
  const { currentRoom, leaveRoom } = useRoomContext();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  const handleLeaveRoom = () => {
    leaveRoom();
    navigate('/lobby');
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
    </div>
  );
};

export default RoomPage;
