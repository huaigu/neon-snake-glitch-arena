
import * as Multisynq from '@multisynq/client';
import { LobbyModel } from './LobbyModel';
import { LeaderboardSessionModel } from './LeaderboardSessionModel';

export default class GameModel extends Multisynq.Model {
  lobby!: LobbyModel;
  leaderboardSession!: LeaderboardSessionModel;

  init() {
    console.log('GameModel: Initializing root game model with persistence support');
    
    // Create and initialize the lobby
    this.lobby = LobbyModel.create({});
    this.lobby.beWellKnownAs("lobby");
    
    // Create leaderboard session model for persistence
    this.leaderboardSession = LeaderboardSessionModel.create();
    this.leaderboardSession.beWellKnownAs("leaderboard-session");
    
    console.log('GameModel: Root model initialized with lobby, leaderboard session and persistence');
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
