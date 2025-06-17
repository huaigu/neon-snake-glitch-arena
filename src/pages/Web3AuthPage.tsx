
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { Web3AuthButton } from '../components/Web3AuthButton';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Shield, Zap, Users, User } from 'lucide-react';

const Web3AuthPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useWeb3Auth();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/lobby');
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
            <div className="text-center">
              <Web3AuthButton />
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
