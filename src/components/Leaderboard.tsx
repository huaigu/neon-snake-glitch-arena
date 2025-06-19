import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Trophy, Medal, Award, User, TrendingUp, GamepadIcon } from 'lucide-react';
import { useMultisynq } from '../contexts/MultisynqContext';

interface PlayerScore {
  address: string;
  name: string;
  highScore: number;
  gamesPlayed: number;
  gamesWon: number;
  lastPlayedAt: string;
}

interface LeaderboardData {
  topPlayers: PlayerScore[];
  totalPlayers: number;
  lastUpdated: string;
}

interface LeaderboardProps {
  onRequestData?: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onRequestData }) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { gameView } = useMultisynq();

  useEffect(() => {
    if (gameView) {
      // 设置排行榜数据回调
      gameView.setLeaderboardCallback((data: LeaderboardData) => {
        console.log('Leaderboard: Received data from GameView:', data);
        setLeaderboardData(data);
        setLoading(false);
      });
      
      // 请求排行榜数据
      gameView.requestLeaderboard();
    }
  }, [gameView]);

  useEffect(() => {
    if (onRequestData) {
      onRequestData();
    }
  }, [onRequestData]);

  const updateLeaderboard = (data: LeaderboardData) => {
    console.log('Leaderboard: Updating data:', data);
    setLeaderboardData(data);
    setLoading(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-400">#{rank}</span>;
    }
  };

  const formatWinRate = (gamesWon: number, gamesPlayed: number) => {
    if (gamesPlayed === 0) return '0%';
    return `${Math.round((gamesWon / gamesPlayed) * 100)}%`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Mock data for development
  React.useEffect(() => {
    if (!leaderboardData) {
      const mockData: LeaderboardData = {
        topPlayers: [],
        totalPlayers: 0,
        lastUpdated: new Date().toISOString()
      };
      setLeaderboardData(mockData);
      setLoading(false);
    }
  }, [leaderboardData]);

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 bg-gray-100 rounded-lg">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-300 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Leaderboard
        </CardTitle>
        {leaderboardData && (
          <div className="text-sm text-gray-500 flex items-center gap-4">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {leaderboardData.totalPlayers} Players
            </span>
            <span>
              Last updated: {formatDate(leaderboardData.lastUpdated)}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!leaderboardData || leaderboardData.topPlayers.length === 0 ? (
          <div className="text-center py-12">
            <GamepadIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">No games played yet</h3>
            <p className="text-gray-400">Be the first to start a game and claim the top spot!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboardData.topPlayers.map((player, index) => (
              <div
                key={player.address}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  index < 3 
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10">
                    {getRankIcon(index + 1)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{player.name}</h3>
                    <p className="text-sm text-gray-500">
                      {player.address.slice(0, 6)}...{player.address.slice(-4)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{player.highScore}</div>
                    <div className="text-xs text-gray-500">High Score</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">
                      {formatWinRate(player.gamesWon, player.gamesPlayed)}
                    </div>
                    <div className="text-xs text-gray-500">Win Rate</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">{player.gamesWon}</div>
                    <div className="text-xs text-gray-500">Wins</div>
                  </div>
                  
                  <div className="text-center min-w-[80px]">
                    <Badge variant="outline" className="text-xs">
                      {formatDate(player.lastPlayedAt)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Hook to use leaderboard data
export const useLeaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  
  return {
    leaderboardData,
    updateLeaderboard: setLeaderboardData
  };
}; 