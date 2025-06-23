
import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
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
        {/* 移动端隐藏用户信息，PC端显示 */}
        <div className="hidden sm:flex items-center gap-2">
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
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          {/* 移动端只显示图标，PC端显示文字 */}
          <span className="hidden sm:inline ml-2">Sign Out</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          // Note: If your app doesn't use authentication, you
          // can remove all 'authenticationStatus' checks
          const ready = mounted && authenticationStatus !== 'loading';
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus ||
              authenticationStatus === 'authenticated');

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                style: {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <Button
                      onClick={openConnectModal}
                      disabled={isConnecting}
                      className="bg-cyber-cyan hover:bg-cyber-cyan/80 text-cyber-darker w-full"
                      title={isConnecting ? 'Connecting...' : 'Connect Wallet'}
                    >
                      <Wallet className="w-4 h-4" />
                      <span className="hidden sm:inline ml-2">
                        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                      </span>
                      {/* 移动端显示简短文字 */}
                      <span className="sm:hidden ml-2">
                        {isConnecting ? 'Connecting...' : 'Connect'}
                      </span>
                    </Button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <Button
                      onClick={openChainModal}
                      variant="destructive"
                      className="w-full"
                    >
                      Wrong Network
                    </Button>
                  );
                }

                return (
                  <div className="flex items-center gap-2 w-full">
                    <Button
                      onClick={() => signInWithEthereum()}
                      disabled={isConnecting}
                      className="bg-cyber-cyan hover:bg-cyber-cyan/80 text-cyber-darker flex-1"
                      title={isConnecting ? 'Signing...' : 'Sign & Authenticate'}
                    >
                      <Wallet className="w-4 h-4" />
                      <span className="hidden sm:inline ml-2">
                        {isConnecting ? 'Signing...' : 'Sign & Authenticate'}
                      </span>
                      {/* 移动端显示简短文字 */}
                      <span className="sm:hidden ml-2">
                        {isConnecting ? 'Signing...' : 'Sign In'}
                      </span>
                    </Button>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
      
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
        title={isConnecting ? 'Connecting...' : 'Continue as Guest'}
      >
        <User className="w-4 h-4" />
        <span className="hidden sm:inline ml-2">
          {isConnecting ? 'Connecting...' : 'Continue as Guest'}
        </span>
        {/* 移动端显示简短文字 */}
        <span className="sm:hidden ml-2">
          {isConnecting ? 'Connecting...' : 'Guest'}
        </span>
      </Button>
    </div>
  );
};
