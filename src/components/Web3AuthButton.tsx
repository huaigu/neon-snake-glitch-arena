
import React from 'react';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { Button } from './ui/button';
import { Wallet, LogOut } from 'lucide-react';

export const Web3AuthButton: React.FC = () => {
  const { user, isConnecting, signInWithEthereum, signOut, isAuthenticated } = useWeb3Auth();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-cyber-cyan text-sm">
          {formatAddress(user.address)}
        </span>
        <Button
          onClick={signOut}
          variant="outline"
          size="sm"
          className="border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={signInWithEthereum}
      disabled={isConnecting}
      className="bg-cyber-cyan hover:bg-cyber-cyan/80 text-cyber-darker"
    >
      <Wallet className="w-4 h-4 mr-2" />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
};
