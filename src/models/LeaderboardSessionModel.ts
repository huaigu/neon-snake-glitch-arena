import * as Multisynq from '@multisynq/client';

interface PlayerScore {
  address: string;
  name: string;
  highScore: number;
  gamesPlayed: number;
  gamesWon: number;
  lastPlayedAt: string;
}

export class LeaderboardSessionModel extends Multisynq.Model {
  playerScores!: Map<string, PlayerScore>;
  loadingPersistentData?: boolean;
  loadingPersistentDataErrored?: boolean;

  init(options?: any, persisted?: any) {
    console.log('LeaderboardSessionModel: Initializing with persistence support');
    
    // Initialize properties
    this.playerScores = new Map();

    // 处理持久化数据恢复
    if (persisted) {
      delete this.loadingPersistentDataErrored;
      this.loadingPersistentData = true;
      try {
        console.log('LeaderboardSessionModel: Loading persisted data...', {
          persistedDataExists: !!persisted,
          dataType: typeof persisted
        });
        this.fromSavedData(persisted);
        console.log('LeaderboardSessionModel: Successfully loaded persisted data');
      } catch (error) {
        console.error('LeaderboardSessionModel: Error in loading persistent data', error);
        this.loadingPersistentDataErrored = true;
      } finally {
        delete this.loadingPersistentData;
      }
    }

    // Subscribe to leaderboard events
    this.subscribe("leaderboard-session", "update-score", this.handleUpdateScore);
    this.subscribe("leaderboard-session", "get-data", this.handleGetData);
    this.subscribe("leaderboard-session", "save-data", this.handleSaveData);

    console.log('LeaderboardSessionModel: Initialization complete with persistence support');
  }

  // 保存排行榜数据到会话 (通过根模型)
  save() {
    if (this.loadingPersistentData) { 
      console.log('LeaderboardSessionModel: Skip saving - currently loading persistent data');
      return; 
    }
    if (this.loadingPersistentDataErrored) { 
      console.log('LeaderboardSessionModel: Skip saving - persistent data loading errored');
      return; 
    }
    
    try {
      // 准备要保存的数据
      const dataToSave = {
        playerScores: Array.from(this.playerScores.entries()).map(([address, score]) => ({
          address,
          ...score
        })),
        lastSaved: new Date(this.now()).toISOString(),
        version: '1.0'
      };
      
      console.log('LeaderboardSessionModel: Requesting save through root model', {
        playerCount: dataToSave.playerScores.length,
        timestamp: dataToSave.lastSaved
      });
      
      // 通知根模型进行持久化
      this.publish("root", "persist-leaderboard", dataToSave);
      
      console.log('LeaderboardSessionModel: Save request sent to root model');
    } catch (error) {
      console.error('LeaderboardSessionModel: Failed to request save', error);
    }
  }

  // 从保存的数据恢复排行榜
  fromSavedData(persisted: any) {
    if (!persisted) {
      console.log('LeaderboardSessionModel: No persisted data to restore');
      return;
    }

    try {
      // 清空现有数据
      this.playerScores.clear();
      
      // 恢复玩家分数数据
      if (persisted.playerScores && Array.isArray(persisted.playerScores)) {
        persisted.playerScores.forEach((playerData: any) => {
          if (playerData.address) {
            const playerScore: PlayerScore = {
              address: playerData.address,
              name: playerData.name || `Player_${playerData.address.slice(0, 6)}`,
              highScore: playerData.highScore || 0,
              gamesPlayed: playerData.gamesPlayed || 0,
              gamesWon: playerData.gamesWon || 0,
              lastPlayedAt: playerData.lastPlayedAt || new Date(this.now()).toISOString()
            };
            this.playerScores.set(playerData.address, playerScore);
          }
        });
      }
      
      console.log('LeaderboardSessionModel: Restored leaderboard from saved data', {
        playerCount: this.playerScores.size,
        version: persisted.version,
        lastSaved: persisted.lastSaved
      });
      
      // 发布恢复后的排行榜状态
      this.publishLeaderboardData();
      
    } catch (error) {
      console.error('LeaderboardSessionModel: Error restoring from saved data', error);
      throw error;
    }
  }

  // Event handlers
  handleUpdateScore(payload: { 
    playerAddress: string; 
    playerName: string; 
    score: number; 
    isWinner: boolean 
  }) {
    console.log('LeaderboardSessionModel: Updating score:', payload);
    
    const { playerAddress, playerName, score, isWinner } = payload;
    
    // Get existing player score or create new one
    let playerScore = this.playerScores.get(playerAddress);
    
    if (!playerScore) {
      playerScore = {
        address: playerAddress,
        name: playerName,
        highScore: score,
        gamesPlayed: 1,
        gamesWon: isWinner ? 1 : 0,
        lastPlayedAt: new Date(this.now()).toISOString()
      };
      console.log('LeaderboardSessionModel: Created new player score record:', playerScore);
    } else {
      // Update existing record
      playerScore.name = playerName; // Update name in case it changed
      playerScore.highScore = Math.max(playerScore.highScore, score);
      playerScore.gamesPlayed += 1;
      if (isWinner) {
        playerScore.gamesWon += 1;
      }
      playerScore.lastPlayedAt = new Date(this.now()).toISOString();
      console.log('LeaderboardSessionModel: Updated existing player score record:', playerScore);
    }
    
    this.playerScores.set(playerAddress, playerScore);
    
    // 立即保存更新的数据
    this.save();
    
    // Publish updated leaderboard data
    this.publishLeaderboardData();
    
    console.log('LeaderboardSessionModel: Score updated and saved for player:', playerAddress);
  }

  handleGetData() {
    console.log('LeaderboardSessionModel: Get data requested');
    this.publishLeaderboardData();
  }

  handleSaveData(payload: any) {
    console.log('LeaderboardSessionModel: Save data requested:', payload);
    this.save();
  }

  // Helper methods
  getTopPlayers(limit: number = 10): PlayerScore[] {
    const players = Array.from(this.playerScores.values());
    
    // Sort by high score (descending), then by games won (descending), then by win rate (descending)
    return players.sort((a, b) => {
      // Primary sort: high score
      if (a.highScore !== b.highScore) {
        return b.highScore - a.highScore;
      }
      
      // Secondary sort: games won
      if (a.gamesWon !== b.gamesWon) {
        return b.gamesWon - a.gamesWon;
      }
      
      // Tertiary sort: win rate
      const aWinRate = a.gamesPlayed > 0 ? a.gamesWon / a.gamesPlayed : 0;
      const bWinRate = b.gamesPlayed > 0 ? b.gamesWon / b.gamesPlayed : 0;
      
      return bWinRate - aWinRate;
    }).slice(0, limit);
  }

  getPlayerRank(playerAddress: string): number | null {
    const topPlayers = this.getTopPlayers(1000); // Get all players
    const playerIndex = topPlayers.findIndex(p => p.address === playerAddress);
    
    return playerIndex >= 0 ? playerIndex + 1 : null;
  }

  getLeaderboardData() {
    const topPlayers = this.getTopPlayers();
    const totalPlayers = this.playerScores.size;
    
    return {
      topPlayers,
      totalPlayers,
      lastUpdated: new Date(this.now()).toISOString()
    };
  }

  publishLeaderboardData() {
    const leaderboardData = this.getLeaderboardData();
    console.log('LeaderboardSessionModel: Publishing leaderboard data:', {
      topPlayersCount: leaderboardData.topPlayers.length,
      totalPlayers: leaderboardData.totalPlayers,
      topPlayers: leaderboardData.topPlayers,
      playerScoresMapSize: this.playerScores.size
    });
    this.publish("leaderboard", "updated", leaderboardData);
    console.log('LeaderboardSessionModel: Leaderboard data published successfully');
  }

  // Get player's personal stats
  getPlayerStats(playerAddress: string): PlayerScore | null {
    return this.playerScores.get(playerAddress) || null;
  }
}

LeaderboardSessionModel.register("LeaderboardSessionModel"); 