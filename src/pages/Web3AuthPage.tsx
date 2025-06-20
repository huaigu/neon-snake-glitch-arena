
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Shield, Zap, Users, User, Wallet } from 'lucide-react';

const Web3AuthPage = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { isAuthenticated, signInWithEthereum, signInAsGuest, isConnecting } = useWeb3Auth();

  React.useEffect(() => {
    if (isAuthenticated) {
      // 检查是否有重定向URL
      const redirectUrl = sessionStorage.getItem('redirectAfterAuth');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterAuth');
        navigate(redirectUrl);
      } else {
        navigate('/lobby');
      }
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-cyber-darker flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="mb-4 border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <Card className="cyber-panel">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-cyber-cyan neon-text mb-2">
              JOIN THE ARENA
            </CardTitle>
            <p className="text-cyber-cyan/70">
              Connect your wallet or play as a guest
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
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
                              className="bg-cyber-cyan hover:bg-cyber-cyan/80 text-cyber-darker w-full text-lg py-6"
                            >
                              <Wallet className="w-5 h-5 mr-3" />
                              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                            </Button>
                          );
                        }

                        if (chain.unsupported) {
                          return (
                            <Button
                              onClick={openChainModal}
                              variant="destructive"
                              className="w-full text-lg py-6"
                            >
                              Wrong Network - Switch to Monad
                            </Button>
                          );
                        }

                        return (
                          <div className="flex flex-col gap-3 w-full">
                            <div className="flex items-center justify-between p-4 bg-cyber-darker/50 border border-cyber-cyan/30 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Wallet className="w-5 h-5 text-cyber-cyan" />
                                <div>
                                  <p className="text-cyber-cyan font-medium">Connected</p>
                                  <p className="text-cyber-cyan/70 text-sm">
                                    {account.displayName || `${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
                                  </p>
                                </div>
                              </div>
                              <Button
                                onClick={openAccountModal}
                                variant="outline"
                                size="sm"
                                className="border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/10"
                              >
                                Manage
                              </Button>
                            </div>
                            
                            <Button
                              onClick={() => signInWithEthereum()}
                              disabled={isConnecting}
                              className="bg-cyber-cyan hover:bg-cyber-cyan/80 text-cyber-darker w-full text-lg py-6"
                            >
                              <Shield className="w-5 h-5 mr-3" />
                              {isConnecting ? 'Signing...' : 'Sign & Authenticate'}
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
                className="border-cyber-orange/50 text-cyber-orange hover:bg-cyber-orange/10 hover:border-cyber-orange w-full text-lg py-6"
              >
                <User className="w-5 h-5 mr-3" />
                {isConnecting ? 'Connecting...' : 'Continue as Guest'}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-cyber-cyan/70">
                <Shield className="w-5 h-5 text-cyber-green" />
                <span>Secure authentication with your wallet</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-cyber-cyan/70">
                <User className="w-5 h-5 text-cyber-orange" />
                <span>Quick guest access - no wallet required</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-cyber-cyan/70">
                <Zap className="w-5 h-5 text-cyber-cyan" />
                <span>No gas fees required for signing in</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-cyber-cyan/70">
                <Users className="w-5 h-5 text-cyber-purple" />
                <span>Join rooms and play with friends</span>
              </div>
            </div>

            <div className="border-t border-cyber-cyan/20 pt-4 text-xs text-cyber-cyan/50 text-center">
              Guest users can play immediately. Wallet users get persistent identity and 
              enhanced features. No transactions will be made without your explicit consent.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Web3AuthPage;
