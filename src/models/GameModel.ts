
import * as Multisynq from '@multisynq/client';
import { LobbyModel } from './LobbyModel';
import { LeaderboardSessionModel } from './LeaderboardSessionModel';

export default class GameModel extends Multisynq.Model {
  lobby!: LobbyModel;
  leaderboardSession!: LeaderboardSessionModel;

  init(options?: any, persisted?: any) {
    console.log('GameModel: Initializing root game model with persistence support');
    
    // Create and initialize the lobby
    this.lobby = LobbyModel.create({});
    this.lobby.beWellKnownAs("lobby");
    
    // Create leaderboard session model 
    this.leaderboardSession = LeaderboardSessionModel.create();
    this.leaderboardSession.beWellKnownAs("leaderboard-session");
    
    // Restore persisted data if available
    if (persisted) {
      console.log('GameModel: Restoring persisted leaderboard data');
      this.leaderboardSession.fromSavedData(persisted);
    }
    
    // Subscribe to persistence requests
    this.subscribe("root", "persist-leaderboard", this.handlePersistLeaderboard);
    
    console.log('GameModel: Root model initialized with lobby, leaderboard session and persistence');
  }

  handlePersistLeaderboard(data: any) {
    try {
      console.log('GameModel: Persisting leaderboard data', {
        playerCount: data.playerScores?.length || 0,
        timestamp: data.lastSaved
      });
      
      // 使用根模型的persistSession方法
      this.persistSession(() => data);
      
      console.log('GameModel: Successfully persisted leaderboard data');
    } catch (error) {
      console.error('GameModel: Failed to persist leaderboard data', error);
    }
  }

  static types() {
    return {};
  }
}

GameModel.register("GameModel");

// Export updated interfaces to match actual data structure
export interface Room {
  id: string;
  name: string;
  status: 'waiting' | 'countdown' | 'playing' | 'finished';
  players: Player[];
  hostAddress: string;
  maxPlayers: number;
  host?: string; // Added for UI compatibility
  isPrivate?: boolean; // Added for UI compatibility  
  createdAt?: string; // Added for UI compatibility
  isSpectatorView?: boolean; // Added for spectator mode
}

export interface Player {
  id: string;
  name: string;
  address: string;
  isReady: boolean;
  isSpectator?: boolean;
  hasNFT?: boolean;
}
