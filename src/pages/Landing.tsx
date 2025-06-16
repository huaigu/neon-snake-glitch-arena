
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Gamepad2, Users, Zap, Crown, Play, ArrowRight, Shield, Trophy, Wallet } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  const handleEnterLobby = () => {
    navigate('/auth');
  };

  const handleViewFeatures = () => {
    // Scroll to features section
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-cyber-darker">
      {/* Hero Section */}
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Grid Effect */}
        <div className="absolute inset-0 cyber-grid opacity-20"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 border border-cyber-cyan/30 rotate-45 animate-pulse"></div>
        <div className="absolute bottom-32 right-16 w-16 h-16 border border-cyber-green/40 rotate-12 animate-bounce"></div>
        <div className="absolute top-1/3 right-1/4 w-12 h-12 border border-cyber-purple/50 rounded-full animate-spin"></div>

        <div className="w-full max-w-6xl text-center relative z-10">
          {/* Main Title */}
          <div className="mb-12">
            <h1 className="text-7xl font-bold text-cyber-cyan neon-text mb-4 animate-fade-in">
              CYBER SNAKE
            </h1>
            <h2 className="text-4xl font-bold text-cyber-green neon-text mb-6 animate-fade-in">
              GLITCH ARENA
            </h2>
            <p className="text-xl text-cyber-cyan/70 mb-8 max-w-3xl mx-auto animate-fade-in">
              Enter the cyberpunk world of multiplayer snake arena. Battle with friends in neon-lit digital battlegrounds and become the ultimate snake master in this futuristic gaming experience!
            </p>
          </div>

          {/* Game Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card className="cyber-panel group hover:border-cyber-cyan/60 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyber-cyan">
                  <Play className="w-6 h-6" />
                  Live Gameplay Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gradient-to-br from-cyber-dark to-cyber-darker rounded-lg border border-cyber-cyan/30 flex items-center justify-center mb-4 relative overflow-hidden">
                  {/* Simulated Game Board */}
                  <div className="grid grid-cols-8 grid-rows-6 gap-1 w-full h-full p-4">
                    {/* Snake segments */}
                    <div className="bg-cyber-cyan snake-segment"></div>
                    <div className="bg-cyber-cyan/80 snake-segment"></div>
                    <div className="bg-cyber-cyan/60 snake-segment"></div>
                    {/* Food */}
                    <div className="bg-cyber-green food-item col-start-6 row-start-3"></div>
                    {/* Other snake */}
                    <div className="bg-cyber-purple snake-segment col-start-7 row-start-5"></div>
                    <div className="bg-cyber-purple/80 snake-segment col-start-6 row-start-5"></div>
                  </div>
                  <div className="absolute inset-0 bg-cyber-cyan/5 animate-pulse"></div>
                </div>
                <p className="text-cyber-cyan/70 text-sm">
                  Real-time multiplayer snake battles with stunning neon visuals
                </p>
              </CardContent>
            </Card>

            <Card className="cyber-panel group hover:border-cyber-green/60 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyber-green">
                  <Trophy className="w-6 h-6" />
                  Arena Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-cyber-cyan/70">Active Players</span>
                    <span className="text-cyber-cyan font-bold text-lg">1,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-cyber-cyan/70">Games Today</span>
                    <span className="text-cyber-green font-bold text-lg">892</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-cyber-cyan/70">Top Score</span>
                    <span className="text-cyber-purple font-bold text-lg">15,420</span>
                  </div>
                  <div className="w-full bg-cyber-dark rounded-full h-2">
                    <div className="bg-gradient-to-r from-cyber-cyan to-cyber-green h-2 rounded-full w-3/4 animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={handleEnterLobby}
                size="lg"
                className="bg-cyber-cyan hover:bg-cyber-cyan/80 text-cyber-darker text-xl px-12 py-6 neon-border group"
              >
                <Wallet className="w-6 h-6 mr-3 group-hover:animate-pulse" />
                Connect & Play
              </Button>
              
              <Button
                onClick={handleViewFeatures}
                variant="outline"
                size="lg"
                className="border-cyber-green/50 text-cyber-green hover:bg-cyber-green/10 hover:border-cyber-green text-xl px-12 py-6"
              >
                Explore Features
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
            </div>
            
            <p className="text-cyber-cyan/50 text-sm">
              Connect your wallet to join thousands of players in the ultimate cyberpunk snake experience
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="min-h-screen p-4 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-cyber-cyan neon-text mb-6">
              GAME FEATURES
            </h2>
            <p className="text-xl text-cyber-cyan/70 max-w-3xl mx-auto">
              Experience the most advanced multiplayer snake game with cutting-edge features designed for competitive gaming
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <Card className="cyber-panel hover:border-cyber-cyan/60 transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-cyber-cyan">
                  <Users className="w-8 h-8 group-hover:animate-pulse" />
                  Multiplayer Battle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-cyber-cyan/70 mb-4">
                  Up to 8 players battle simultaneously in real-time. Experience intense multiplayer competition with friends and players worldwide.
                </p>
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-cyber-cyan rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-cyber-green rounded-full animate-pulse delay-100"></div>
                  <div className="w-3 h-3 bg-cyber-purple rounded-full animate-pulse delay-200"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-panel hover:border-cyber-green/60 transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-cyber-green">
                  <Zap className="w-8 h-8 group-hover:animate-pulse" />
                  AI Opponents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-cyber-cyan/70 mb-4">
                  Advanced AI bots with different difficulty levels. Practice your skills or fill rooms instantly for non-stop action.
                </p>
                <div className="text-xs text-cyber-green/80 bg-cyber-green/10 px-3 py-1 rounded-full inline-block">
                  Smart AI Technology
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-panel hover:border-cyber-purple/60 transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-cyber-purple">
                  <Crown className="w-8 h-8 group-hover:animate-pulse" />
                  Custom Rooms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-cyber-cyan/70 mb-4">
                  Create private rooms with custom settings. Invite friends for exclusive battles with personalized game rules.
                </p>
                <div className="text-xs text-cyber-purple/80 bg-cyber-purple/10 px-3 py-1 rounded-full inline-block">
                  Room Customization
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-panel hover:border-cyber-cyan/60 transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-cyber-cyan">
                  <Shield className="w-8 h-8 group-hover:animate-pulse" />
                  Power-ups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-cyber-cyan/70 mb-4">
                  Collect special power-ups during battle. Speed boosts, shields, and more strategic elements to master.
                </p>
                <div className="flex gap-1">
                  <div className="w-4 h-4 bg-cyber-cyan/30 rounded border border-cyber-cyan/50"></div>
                  <div className="w-4 h-4 bg-cyber-green/30 rounded border border-cyber-green/50"></div>
                  <div className="w-4 h-4 bg-cyber-purple/30 rounded border border-cyber-purple/50"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-panel hover:border-cyber-green/60 transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-cyber-green">
                  <Trophy className="w-8 h-8 group-hover:animate-pulse" />
                  Leaderboards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-cyber-cyan/70 mb-4">
                  Compete for the top spots on global and daily leaderboards. Track your progress and climb the ranks.
                </p>
                <div className="text-xs text-cyber-green/80 bg-cyber-green/10 px-3 py-1 rounded-full inline-block">
                  Global Rankings
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-panel hover:border-cyber-purple/60 transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-cyber-purple">
                  <Gamepad2 className="w-8 h-8 group-hover:animate-pulse" />
                  Smooth Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-cyber-cyan/70 mb-4">
                  Responsive controls optimized for competitive play. Multiple control schemes and customizable key bindings.
                </p>
                <div className="text-xs text-cyber-purple/80 bg-cyber-purple/10 px-3 py-1 rounded-full inline-block">
                  60+ FPS Gameplay
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <Button
              onClick={handleEnterLobby}
              size="lg"
              className="bg-gradient-to-r from-cyber-cyan to-cyber-green hover:from-cyber-cyan/80 hover:to-cyber-green/80 text-cyber-darker text-xl px-16 py-6 neon-border"
            >
              <Gamepad2 className="w-6 h-6 mr-3" />
              Start Playing Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
