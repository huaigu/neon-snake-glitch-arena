
import { Multisynq } from '@multisynq/client';
import { LobbyModel } from './LobbyModel';

export default class GameModel extends Multisynq.Model {
  lobby!: LobbyModel;

  init() {
    console.log('GameModel: Initializing root game model');
    
    // Create and initialize the lobby
    this.lobby = LobbyModel.create({});
    this.lobby.beWellKnownAs("lobby");
    
    console.log('GameModel: Root model initialized with lobby');
  }

  static types() {
    return {};
  }
}

GameModel.register("GameModel");

// Export types for backward compatibility
export interface Room {
  id: string;
  name: string;
  status: 'waiting' | 'playing' | 'finished';
  players: Player[];
  hostAddress: string;
  maxPlayers: number;
}

export interface Player {
  id: string;
  name: string;
  address: string;
  isReady: boolean;
  isSpectator?: boolean;
}
