
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { RoomList } from '../components/RoomList';
import { Web3AuthButton } from '../components/Web3AuthButton';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';

const GameLobbyPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useWeb3Auth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

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
