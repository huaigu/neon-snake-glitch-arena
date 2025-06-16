
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Gamepad2, Users, Zap, Crown } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  const handleEnterLobby = () => {
    navigate('/lobby');
  };

  return (
    <div className="min-h-screen bg-cyber-darker flex items-center justify-center p-4">
      <div className="w-full max-w-4xl text-center">
        {/* Main Title */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold text-cyber-cyan neon-text mb-4">
            CYBER SNAKE
          </h1>
          <h2 className="text-3xl font-bold text-cyber-green neon-text mb-6">
            GLITCH ARENA
          </h2>
          <p className="text-xl text-cyber-cyan/70 mb-8 max-w-2xl mx-auto">
            Enter the cyberpunk world of multiplayer snake arena. Battle with friends and become the ultimate snake master!
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="cyber-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyber-cyan">
                <Users className="w-6 h-6" />
                Multiplayer Battle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-cyber-cyan/70">
                Up to 8 players online battle simultaneously, experience thrilling multiplayer competition
              </p>
            </CardContent>
          </Card>

          <Card className="cyber-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyber-cyan">
                <Zap className="w-6 h-6" />
                AI Bots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-cyber-cyan/70">
                Add AI bots to fill rooms and start game challenges anytime
              </p>
            </CardContent>
          </Card>

          <Card className="cyber-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyber-cyan">
                <Crown className="w-6 h-6" />
                Room System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-cyber-cyan/70">
                Create your own room and invite friends to join exclusive battles
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enter Button */}
        <div className="space-y-4">
          <Button
            onClick={handleEnterLobby}
            size="lg"
            className="bg-cyber-cyan hover:bg-cyber-cyan/80 text-cyber-darker text-xl px-12 py-6 neon-border"
          >
            <Gamepad2 className="w-6 h-6 mr-3" />
            Enter Game Lobby
          </Button>
          
          <p className="text-cyber-cyan/50 text-sm">
            Ready to conquer cyberspace?
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
