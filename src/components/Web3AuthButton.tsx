
import React from 'react';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { Button } from './ui/button';
import { Wallet, LogOut, User } from 'lucide-react';

export const Web3AuthButton: React.FC = () => {
  const { user, isConnecting, signInWithEthereum, signInAsGuest, signOut, isAuthenticated } = useWeb3Auth();

  const formatAddress = (address: string) => {
    if (address.startsWith('guest_')) {
      return user?.username || 'Guest';
    }
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          {user.isGuest ? (
            <User className="w-4 h-4 text-cyber-orange" />
          ) : (
            <Wallet className="w-4 h-4 text-cyber-cyan" />
          )}
          <span className="text-cyber-cyan text-sm">
            {formatAddress(user.address)}
          </span>
        </div>
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
    <div className="flex flex-col gap-3 w-full">
      <Button
        onClick={signInWithEthereum}
        disabled={isConnecting}
        className="bg-cyber-cyan hover:bg-cyber-cyan/80 text-cyber-darker w-full"
      >
        <Wallet className="w-4 h-4 mr-2" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-cyber-cyan/20" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-cyber-darker px-2 text-cyber-cyan/60">Or</span>
        </div>
      </div>
      
      <Button
        onClick={signInAsGuest}
        disabled={isConnecting}
        variant="outline"
        className="border-cyber-orange/50 text-cyber-orange hover:bg-cyber-orange/10 hover:border-cyber-orange w-full"
      >
        <User className="w-4 h-4 mr-2" />
        {isConnecting ? 'Connecting...' : 'Continue as Guest'}
      </Button>
    </div>
  );
};
