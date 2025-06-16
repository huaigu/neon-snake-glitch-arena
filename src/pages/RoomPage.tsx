
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoomContext } from '../contexts/RoomContext';
import { GameLobbyComponent } from '../components/GameLobbyComponent';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';

const RoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { currentRoom, leaveRoom } = useRoomContext();

  const handleLeaveRoom = () => {
    leaveRoom();
    navigate('/lobby');
  };

  if (!currentRoom || currentRoom.id !== roomId) {
    return (
      <div className="min-h-screen bg-cyber-darker flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-cyber-cyan mb-4">
            房间不存在或已失效
          </h2>
          <Button onClick={() => navigate('/lobby')}>
            返回大厅
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-darker">
      <div className="p-4">
        <Button
          onClick={handleLeaveRoom}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回大厅
        </Button>
      </div>
      <GameLobbyComponent />
    </div>
  );
};

export default RoomPage;
