import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Gamepad2, 
  Users, 
  Zap, 
  Crown, 
  ArrowRight, 
  Wallet, 
  Eye,
  Share2,
  UserPlus,
  Palette,
  Coins,
  Target,
  TrendingUp,
  Sparkles,
  Twitter
} from 'lucide-react';



// NFT Contract Configuration
const NFT_CONTRACT_ADDRESS = '0xDF49DBA5A46966A02314c7f3cf95D8D6e3719bD5';
const NFT_CONTRACT_ABI = [
  {
    inputs: [{ name: '_quantity', type: 'uint256' }],
    name: 'mint',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'remainingSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const Landing = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const [isMinting, setIsMinting] = useState(false);
  
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Get remaining supply from contract
  const { data: remainingSupply, refetch: refetchSupply } = useReadContract({
    address: NFT_CONTRACT_ADDRESS as `0x${string}`,
    abi: NFT_CONTRACT_ABI,
    functionName: 'remainingSupply',
  });

  const totalSupply = 2025;
  const remaining = remainingSupply ? Number(remainingSupply) : 778; // fallback value
  const minted = totalSupply - remaining;





  const handleEnterLobby = () => {
    navigate('/auth');
  };

  const handleViewFeatures = () => {
    // Scroll to features section
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };



  const handleMintNFT = () => {
    if (!isConnected) {
      navigate('/auth');
      return;
    }
    
    // TODO: Implement actual mint functionality with proper Web3 integration
    // Price: 0.1 MON per NFT
    alert(`Mint NFT Snake for 0.1 MON\nContract: 0xDF49DBA5A46966A02314c7f3cf95D8D6e3719bD5\nRemaining: ${remaining}/${totalSupply}`);
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
              NEON SNAKE
            </h1>
            <h2 className="text-4xl font-bold text-cyber-green neon-text mb-6 animate-fade-in">
              GLITCH ARENA
            </h2>
            <p className="text-xl text-cyber-cyan/70 mb-8 max-w-3xl mx-auto animate-fade-in">
              The ultimate multiplayer snake battleground! Battle up to 8 players, spectate epic matches, and collect exclusive NFTs. Join the cyberpunk revolution where every snake can be a masterpiece!
            </p>
          </div>

          {/* NFT Preview Section */}
          <div className="mb-12">
            <Card className="cyber-panel border-cyber-purple/50 hover:border-cyber-purple transition-all duration-300 max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-3 text-cyber-purple text-2xl">
                  <Sparkles className="w-8 h-8" />
                  Chromatic Serpents NFT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gradient-to-br from-cyber-dark to-cyber-darker rounded-lg border border-cyber-purple/30 flex items-center justify-center mb-6 relative overflow-hidden">
                  {/* NFT Snake Preview */}
                  <div className="grid grid-cols-12 grid-rows-8 gap-1 w-full h-full p-4">
                    {/* Rainbow Snake */}
                    <div className="bg-gradient-to-r from-red-400 to-orange-400 snake-segment col-start-3 row-start-4"></div>
                    <div className="bg-gradient-to-r from-orange-400 to-yellow-400 snake-segment col-start-4 row-start-4"></div>
                    <div className="bg-gradient-to-r from-yellow-400 to-green-400 snake-segment col-start-5 row-start-4"></div>
                    <div className="bg-gradient-to-r from-green-400 to-cyan-400 snake-segment col-start-6 row-start-4"></div>
                    <div className="bg-gradient-to-r from-cyan-400 to-blue-400 snake-segment col-start-7 row-start-4"></div>
                    <div className="bg-gradient-to-r from-blue-400 to-purple-400 snake-segment col-start-8 row-start-4"></div>
                    <div className="bg-gradient-to-r from-purple-400 to-pink-400 snake-segment col-start-9 row-start-4"></div>
                    {/* Crown emoji */}
                    <div className="col-start-2 row-start-4 flex items-center justify-center text-lg">👑</div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-cyber-purple/20 to-transparent animate-pulse"></div>
                  <div className="absolute top-4 right-4 text-cyber-purple font-bold text-lg">#{minted}</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-cyber-cyan/70">Total Supply</span>
                    <span className="text-cyber-purple font-bold">{totalSupply.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyber-cyan/70">Minted</span>
                    <span className="text-cyber-green font-bold">{minted.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyber-cyan/70">Remaining</span>
                    <span className="text-cyber-cyan font-bold">{remaining.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyber-cyan/70">Mint Price</span>
                    <span className="text-yellow-400 font-bold">0.1 MON</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-cyber-cyan/70 mb-2">
                    <span>Minting Progress</span>
                    <span>{((minted / totalSupply) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-cyber-dark rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-cyber-purple to-cyber-pink h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(minted / totalSupply) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-cyber-cyan/70 text-sm mt-4 text-center">
                  Own exclusive rainbow snakes with crown heads and special visual effects
                </p>
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
                Connect & Battle
              </Button>
              
              <Button
                onClick={handleViewFeatures}
                variant="outline"
                size="lg"
                className="border-cyber-green/50 text-cyber-green hover:bg-cyber-green/10 hover:border-cyber-green text-xl px-12 py-6"
              >
                Explore Arena
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
            </div>
            
            <p className="text-cyber-cyan/50 text-sm">
              Play as guest or connect wallet for NFT benefits • Share battles instantly
            </p>
          </div>
        </div>
      </div>

      {/* NFT Section */}
      <div id="nft-section" className="p-4 py-16 bg-gradient-to-b from-cyber-darker to-cyber-dark">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-cyber-purple neon-text mb-4">
              CHROMATIC SERPENTS NFT
            </h2>
            <p className="text-lg text-cyber-cyan/70 max-w-2xl mx-auto">
              Own exclusive rainbow snakes with crown heads and special visual effects in the arena
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* NFT Preview */}
            <Card className="cyber-panel border-cyber-purple/50 hover:border-cyber-purple transition-all duration-300">
              <CardContent className="p-6">
                <div className="aspect-square bg-gradient-to-br from-cyber-dark to-cyber-darker rounded-lg border border-cyber-purple/30 flex items-center justify-center mb-6 relative overflow-hidden">
                  {/* NFT Snake Preview */}
                  <div className="grid grid-cols-12 grid-rows-12 gap-1 w-full h-full p-4">
                    {/* Rainbow Snake with Crown */}
                    <div className="col-start-2 row-start-6 flex items-center justify-center text-2xl">👑</div>
                    <div className="bg-gradient-to-r from-red-400 to-orange-400 snake-segment col-start-3 row-start-6"></div>
                    <div className="bg-gradient-to-r from-orange-400 to-yellow-400 snake-segment col-start-4 row-start-6"></div>
                    <div className="bg-gradient-to-r from-yellow-400 to-green-400 snake-segment col-start-5 row-start-6"></div>
                    <div className="bg-gradient-to-r from-green-400 to-cyan-400 snake-segment col-start-6 row-start-6"></div>
                    <div className="bg-gradient-to-r from-cyan-400 to-blue-400 snake-segment col-start-7 row-start-6"></div>
                    <div className="bg-gradient-to-r from-blue-400 to-purple-400 snake-segment col-start-8 row-start-6"></div>
                    <div className="bg-gradient-to-r from-purple-400 to-pink-400 snake-segment col-start-9 row-start-6"></div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-cyber-purple/20 to-transparent animate-pulse"></div>
                  <div className="absolute top-4 right-4 text-cyber-purple font-bold text-lg">#{minted}</div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-cyber-cyan/70">Total Supply</span>
                      <span className="text-cyber-purple font-bold">{totalSupply.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-cyan/70">Minted</span>
                      <span className="text-cyber-green font-bold">{minted.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-cyan/70">Remaining</span>
                      <span className="text-cyber-cyan font-bold">{remaining.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-cyan/70">Mint Price</span>
                      <span className="text-yellow-400 font-bold">0.1 MON</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-cyber-cyan/70 mb-2">
                      <span>Minting Progress</span>
                      <span>{((minted / totalSupply) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-cyber-dark rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-cyber-purple to-cyber-pink h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(minted / totalSupply) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* NFT Benefits */}
            <div className="space-y-4">
              <Card className="cyber-panel border-cyber-cyan/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-cyber-cyan">
                    <Palette className="w-6 h-6" />
                    Visual Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-cyber-cyan/70 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyber-cyan rounded-full"></div>
                      Crown emoji as snake head
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyber-green rounded-full"></div>
                      Rainbow gradient snake effects
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyber-purple rounded-full"></div>
                      Enhanced visual recognition
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="cyber-panel border-cyber-green/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-cyber-green">
                    <Crown className="w-6 h-6" />
                    Collection Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-cyber-cyan/70 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyber-cyan rounded-full"></div>
                      Limited edition collectible
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyber-green rounded-full"></div>
                      Unique digital identity
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyber-purple rounded-full"></div>
                      Community status symbol
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Mint Button */}
              <div className="pt-4">
                <Button
                  onClick={handleMintNFT}
                  size="lg"
                  className="w-full bg-gradient-to-r from-cyber-purple to-cyber-pink hover:from-cyber-purple/80 hover:to-cyber-pink/80 text-white text-lg px-8 py-4 neon-border"
                  disabled={isMinting}
                >
                  <Coins className="w-5 h-5 mr-2" />
                  {isMinting ? 'Minting...' : 'Mint NFT Snake'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Screenshots Section */}
      <div className="p-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-cyber-cyan neon-text mb-4">
              GAME IN ACTION
            </h2>
            <p className="text-lg text-cyber-cyan/70 max-w-2xl mx-auto">
              Experience the thrill of real-time multiplayer battles and join as a spectator to watch epic showdowns
            </p>
          </div>

          {/* Screenshots Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Game Lobby Screenshot */}
            <Card className="cyber-panel border-cyber-purple/50 hover:border-cyber-purple transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-cyber-purple">
                  <Users className="w-6 h-6" />
                  Game Lobby
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gradient-to-br from-cyber-dark to-cyber-darker rounded-lg border border-cyber-purple/30 flex items-center justify-center relative overflow-hidden group-hover:border-cyber-purple/60 transition-all duration-300">
                  <img 
                    src="/lobby.jpg" 
                    alt="Game Lobby Screenshot" 
                    className="w-full h-full object-contain rounded-lg opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <div className="absolute inset-0 bg-cyber-purple/5 group-hover:bg-cyber-purple/0 transition-all duration-300"></div>
                  <div className="absolute top-3 right-3 bg-cyber-purple/90 text-white px-3 py-1 rounded text-xs font-bold backdrop-blur-sm">
                    LOBBY
                  </div>
                </div>
                <p className="text-cyber-cyan/70 text-sm mt-3">
                  Browse active rooms, create your own battles, or join friends for multiplayer showdowns
                </p>
              </CardContent>
            </Card>

            {/* Battle Mode Screenshot */}
            <Card className="cyber-panel border-cyber-cyan/50 hover:border-cyber-cyan transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-cyber-cyan">
                  <Gamepad2 className="w-6 h-6" />
                  8-Player Battle Arena
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gradient-to-br from-cyber-dark to-cyber-darker rounded-lg border border-cyber-cyan/30 flex items-center justify-center relative overflow-hidden group-hover:border-cyber-cyan/60 transition-all duration-300">
                  <img 
                    src="/room.jpg" 
                    alt="8-Player Battle Mode Screenshot" 
                    className="w-full h-full object-contain rounded-lg opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <div className="absolute inset-0 bg-cyber-cyan/5 group-hover:bg-cyber-cyan/0 transition-all duration-300"></div>
                  <div className="absolute top-3 right-3 bg-cyber-cyan/90 text-cyber-darker px-3 py-1 rounded text-xs font-bold backdrop-blur-sm">
                    LIVE BATTLE
                  </div>
                </div>
                <p className="text-cyber-cyan/70 text-sm mt-3">
                  Intense real-time multiplayer action with up to 8 players competing for arena dominance
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Spectator Mode - Full Width */}
          <div className="mt-8">
            <Card className="cyber-panel border-cyber-green/50 hover:border-cyber-green transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-cyber-green text-center justify-center">
                  <Eye className="w-6 h-6" />
                  Spectator Mode - Watch Epic Battles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gradient-to-br from-cyber-dark to-cyber-darker rounded-lg border border-cyber-green/30 flex items-center justify-center relative overflow-hidden group-hover:border-cyber-green/60 transition-all duration-300">
                  <img 
                    src="/spectator.jpg" 
                    alt="Spectator Mode Screenshot" 
                    className="w-full h-full object-contain rounded-lg opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <div className="absolute inset-0 bg-cyber-green/5 group-hover:bg-cyber-green/0 transition-all duration-300"></div>
                  <div className="absolute top-3 right-3 bg-cyber-green/90 text-cyber-darker px-3 py-1 rounded text-xs font-bold backdrop-blur-sm">
                    SPECTATING
                  </div>
                </div>
                <p className="text-cyber-cyan/70 text-sm mt-3 text-center">
                  Join as a spectator to watch intense battles unfold in real-time. Learn strategies from the best players and enjoy the action without pressure
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="min-h-screen p-4 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-cyber-cyan neon-text mb-6">
              ARENA FEATURES
            </h2>
            <p className="text-xl text-cyber-cyan/70 max-w-3xl mx-auto">
              Experience next-generation multiplayer snake battles with advanced gameplay mechanics and social features
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <Card className="cyber-panel hover:border-cyber-cyan/60 transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-cyber-cyan">
                  <Users className="w-8 h-8 group-hover:animate-pulse" />
                  8-Player Battles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-cyber-cyan/70 mb-4">
                  Massive multiplayer mayhem with up to 8 players in real-time. Experience intense competition in the ultimate snake battlefield.
                </p>
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-cyber-cyan rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-cyber-green rounded-full animate-pulse delay-100"></div>
                  <div className="w-3 h-3 bg-cyber-purple rounded-full animate-pulse delay-200"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse delay-300"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-panel hover:border-cyber-green/60 transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-cyber-green">
                  <Eye className="w-8 h-8 group-hover:animate-pulse" />
                  Spectator Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-cyber-cyan/70 mb-4">
                  Watch epic battles unfold in real-time. Learn from the pros and enjoy the action even when you're not playing.
                </p>
                <div className="text-xs text-cyber-green/80 bg-cyber-green/10 px-3 py-1 rounded-full inline-block">
                  Live Commentary
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-panel hover:border-cyber-purple/60 transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-cyber-purple">
                  <Share2 className="w-8 h-8 group-hover:animate-pulse" />
                  Instant Sharing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-cyber-cyan/70 mb-4">
                  Share battle rooms instantly with friends. One-click invites make it easy to gather your squad for epic showdowns.
                </p>
                <div className="text-xs text-cyber-purple/80 bg-cyber-purple/10 px-3 py-1 rounded-full inline-block">
                  Quick Invite Links
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-panel hover:border-cyber-cyan/60 transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-cyber-cyan">
                  <UserPlus className="w-8 h-8 group-hover:animate-pulse" />
                  Guest Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-cyber-cyan/70 mb-4">
                  Jump in immediately without wallet connection. Perfect for trying the game or quick matches with friends.
                </p>
                <div className="text-xs text-cyber-cyan/80 bg-cyber-cyan/10 px-3 py-1 rounded-full inline-block">
                  No Registration
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-panel hover:border-cyber-green/60 transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-cyber-green">
                  <Target className="w-8 h-8 group-hover:animate-pulse" />
                  Triple Food System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-cyber-cyan/70 mb-4">
                  Three food types with different point values. Strategy matters - choose your targets wisely for maximum growth.
                </p>
                <div className="flex gap-1">
                  <div className="w-4 h-4 bg-cyber-green rounded-full" title="Basic Food: +10"></div>
                  <div className="w-4 h-4 bg-cyber-purple rounded-full animate-pulse" title="Power Food: +25"></div>
                  <div className="w-4 h-4 bg-yellow-400 rounded-full animate-bounce" title="Super Food: +50"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-panel hover:border-cyber-purple/60 transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-cyber-purple">
                  <TrendingUp className="w-8 h-8 group-hover:animate-pulse" />
                  Advanced Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-cyber-cyan/70 mb-4">
                  Track your performance with detailed statistics. Monitor win rates, high scores, and climb the global rankings.
                </p>
                <div className="text-xs text-cyber-purple/80 bg-cyber-purple/10 px-3 py-1 rounded-full inline-block">
                  Win Rate Tracking
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>



      {/* Final CTA Section */}
      <div className="p-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-cyber-cyan neon-text mb-6">
            READY TO DOMINATE?
          </h2>
          <p className="text-xl text-cyber-cyan/70 mb-8">
            Join thousands of players in the most advanced snake arena ever created
          </p>
          
          <div className="flex justify-center">
            <Button
              onClick={handleEnterLobby}
              size="lg"
              className="bg-gradient-to-r from-cyber-cyan to-cyber-green hover:from-cyber-cyan/80 hover:to-cyber-green/80 text-cyber-darker text-xl px-16 py-6 neon-border"
            >
              <Gamepad2 className="w-6 h-6 mr-3" />
              Enter the Arena
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-4 py-8 bg-cyber-darker border-t border-cyber-cyan/20">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center items-center gap-4 mb-4">
            <span className="text-cyber-cyan/70">Follow me:</span>
            <a
              href="https://x.com/coder_chao"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-cyber-cyan hover:text-cyber-green transition-colors duration-300 group"
            >
              <Twitter className="w-5 h-5 group-hover:animate-pulse" />
              <span className="text-sm font-medium">@coder_chao</span>
            </a>
          </div>
          <p className="text-cyber-cyan/50 text-sm">
            © 2025 Neon Snake Glitch Arena. Built on Monad blockchain.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
