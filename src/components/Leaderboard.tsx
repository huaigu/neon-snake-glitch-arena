import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Trophy, Medal, Award, User, TrendingUp, GamepadIcon } from 'lucide-react';
import { useMultisynq } from '../contexts/MultisynqContext';
import { GameView } from '../views/GameView';
import { getLatestLeaderboardData } from '../contexts/RoomContext';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Leaderboard: Setting up global event listener');
    
    // 定义处理leaderboard更新的函数
    const handleLeaderboardUpdate = (data: any) => {
      try {
        console.log('🎯 Leaderboard: Processing leaderboard update:', data);
        
        // 验证数据格式
        if (!data || typeof data !== 'object') {
          console.warn('Leaderboard: Invalid data received:', data);
          setLoading(false);
          return;
        }
        
        // 确保数据结构正确
        const validData: LeaderboardData = {
          topPlayers: data.topPlayers || [],
          totalPlayers: data.totalPlayers || 0,
          lastUpdated: data.lastUpdated || new Date().toISOString()
        };
        
        console.log('✅ Leaderboard: Setting leaderboard data:', validData);
        setLeaderboardData(validData);
        setLoading(false);
        setError(null);
      } catch (error) {
        console.error('❌ Leaderboard: Error processing data update:', error);
        setError('Failed to process leaderboard data');
        setLoading(false);
      }
    };
    
    // 立即尝试获取最新数据
    const latestData = getLatestLeaderboardData();
    if (latestData) {
      console.log('🎯 Leaderboard: Found existing leaderboard data on mount:', latestData);
      handleLeaderboardUpdate(latestData);
    }
    
    // 监听全局 leaderboard 更新事件
    const handleGlobalLeaderboardUpdate = (event: CustomEvent) => {
      handleLeaderboardUpdate(event.detail);
    };

    // 添加事件监听器
    console.log('📝 Leaderboard: Adding event listener for global-leaderboard-update');
    window.addEventListener('global-leaderboard-update', handleGlobalLeaderboardUpdate as EventListener);
    
    return () => {
      // 移除事件监听器
      console.log('🗑️ Leaderboard: Removing event listener for global-leaderboard-update');
      window.removeEventListener('global-leaderboard-update', handleGlobalLeaderboardUpdate as EventListener);
    };
  }, []); // 不依赖 gameView，改为监听全局事件

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

  // 移除 Mock data，等待真实数据或超时后显示空状态
  React.useEffect(() => {
    // 设置一个超时，如果没有收到数据就停止loading状态
    const timeout = setTimeout(() => {
      if (!leaderboardData) {
        console.log('Leaderboard: No data received after timeout, showing empty state');
        setLoading(false);
      }
    }, 3000); // 3秒超时

    return () => clearTimeout(timeout);
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
            {/* <span>
              Last updated: {formatDate(leaderboardData.lastUpdated)}
            </span> */}
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