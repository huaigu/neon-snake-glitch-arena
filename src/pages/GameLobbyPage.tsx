
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RoomList } from '../components/RoomList';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';

const GameLobbyPage = () => {
  const navigate = useNavigate();

  const handleReturnHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-cyber-darker">
      <div className="p-4">
        <Button
          onClick={handleReturnHome}
          variant="outline"
          className="mb-4 border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/10 hover:border-cyber-cyan/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Home
        </Button>
      </div>
      <RoomList />
    </div>
  );
};

export default GameLobbyPage;
