import * as Multisynq from '@multisynq/client';

interface PlayerScore {
  address: string;
  name: string;
  highScore: number;
  gamesPlayed: number;
  gamesWon: number;
  lastPlayedAt: string;
}

export class LeaderboardModel extends Multisynq.Model {
  playerScores!: Map<string, PlayerScore>;

  init() {
    console.log('LeaderboardModel: Initializing leaderboard model');
    
    // Initialize properties
    this.playerScores = new Map();

    // Subscribe to game events
    this.subscribe("leaderboard", "update-score", this.handleUpdateScore);
    this.subscribe("leaderboard", "get-rankings", this.handleGetRankings);

    console.log('LeaderboardModel: Initialization complete');
  }

  handleUpdateScore(payload: { 
    playerAddress: string; 
    playerName: string; 
    score: number; 
    isWinner: boolean 
  }) {
    console.log('LeaderboardModel: Updating score:', payload);
    
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
      console.log('LeaderboardModel: Created new player score record:', playerScore);
    } else {
      // Update existing record
      playerScore.name = playerName; // Update name in case it changed
      playerScore.highScore = Math.max(playerScore.highScore, score);
      playerScore.gamesPlayed += 1;
      if (isWinner) {
        playerScore.gamesWon += 1;
      }
      playerScore.lastPlayedAt = new Date(this.now()).toISOString();
      console.log('LeaderboardModel: Updated existing player score record:', playerScore);
    }
    
    this.playerScores.set(playerAddress, playerScore);
    
    // Publish updated leaderboard
    this.publishLeaderboard();
    
    console.log('LeaderboardModel: Score updated for player:', playerAddress);
  }

  handleGetRankings() {
    console.log('LeaderboardModel: Getting rankings');
    this.publishLeaderboard();
  }

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

  getLeaderboardState() {
    const topPlayers = this.getTopPlayers();
    const totalPlayers = this.playerScores.size;
    
    return {
      topPlayers,
      totalPlayers,
      lastUpdated: new Date(this.now()).toISOString()
    };
  }

  publishLeaderboard() {
    const leaderboardState = this.getLeaderboardState();
    this.publish("leaderboard", "updated", leaderboardState);
    console.log('LeaderboardModel: Published leaderboard state:', {
      topPlayersCount: leaderboardState.topPlayers.length,
      totalPlayers: leaderboardState.totalPlayers
    });
  }

  // Get player's personal stats
  getPlayerStats(playerAddress: string): PlayerScore | null {
    return this.playerScores.get(playerAddress) || null;
  }
}

LeaderboardModel.register("LeaderboardModel"); 