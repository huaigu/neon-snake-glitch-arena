
import { Multisynq } from '@multisynq/client';
import GameModel from '../models/GameModel';

export class GameView extends Multisynq.View {
  model!: GameModel;
  private lobbyCallback: ((data: any) => void) | null = null;
  private gameCallback: ((gameSession: any, foods: any[], segments: any[]) => void) | null = null;

  constructor(model: GameModel) {
    super(model);
    this.model = model;
    
    console.log('GameView: Initializing with model:', !!model);
    
    // Subscribe to lobby updates
    this.subscribe("lobby", "updated", this.handleLobbyUpdate);
    
    // Subscribe to room updates  
    this.subscribe("room", "updated", this.handleRoomUpdate);
    
    // Subscribe to player notifications
    this.subscribe("player", "joined-room", this.handlePlayerJoinedRoom);
    
    console.log('GameView: Subscriptions set up');
  }

  // Lobby management methods
  setLobbyCallback(callback: (data: any) => void) {
    console.log('GameView: Setting lobby callback');
    this.lobbyCallback = callback;
    
    // Immediately call with current state if available
    if (this.model?.lobby) {
      const currentState = this.model.lobby.getLobbyState();
      callback(currentState);
    }
  }

  setGameCallback(callback: (gameSession: any, foods: any[], segments: any[]) => void) {
    console.log('GameView: Setting game callback');
    this.gameCallback = callback;
  }

  // Room management methods
  createRoom(roomName: string, playerName: string, hostAddress: string) {
    console.log('GameView: Creating room:', { roomName, playerName, hostAddress });
    this.publish("lobby", "create-room", {
      roomName,
      playerName,
      hostAddress
    });
  }

  joinRoom(roomId: string, address: string, playerName: string) {
    console.log('GameView: Joining room:', { roomId, address, playerName });
    this.publish("lobby", "join-room", {
      roomId,
      address,
      playerName
    });
  }

  leaveRoom(roomId: string, address: string) {
    console.log('GameView: Leaving room:', { roomId, address });
    this.publish("lobby", "leave-room", {
      roomId,
      address
    });
  }

  setPlayerReady(roomId: string, playerAddress: string, isReady: boolean) {
    console.log('GameView: Setting player ready:', { roomId, playerAddress, isReady });
    this.publish("lobby", "set-player-ready", {
      roomId,
      playerAddress,
      isReady
    });
  }

  // Game control methods
  startGame(roomId: string) {
    console.log('GameView: Starting game for room:', roomId);
    this.publish("room", "start-game", { roomId });
  }

  changeDirection(sessionId: string, viewId: string, direction: string) {
    console.log('GameView: Changing direction:', { sessionId, viewId, direction });
    this.publish("room", "change-direction", {
      sessionId,
      viewId,
      direction
    });
  }

  enterSpectatorMode(sessionId: string, viewId: string) {
    console.log('GameView: Entering spectator mode:', { sessionId, viewId });
    this.publish("room", "enter-spectator", {
      sessionId,
      viewId
    });
  }

  // Helper methods for backward compatibility
  getGameSessionByRoom(roomId: string) {
    if (!this.model?.lobby) return null;
    
    const room = this.model.lobby.gameRooms.get(roomId);
    if (!room) return null;
    
    return room.getGameState();
  }

  // Event handlers
  private handleLobbyUpdate = (data: any) => {
    console.log('GameView: Lobby updated:', data);
    if (this.lobbyCallback) {
      this.lobbyCallback(data);
    }
  };

  private handleRoomUpdate = (data: any) => {
    console.log('GameView: Room updated:', data);
    if (this.gameCallback && data.game) {
      this.gameCallback(data.game, data.foods || [], data.segments || []);
    }
  };

  private handlePlayerJoinedRoom = (data: any) => {
    console.log('GameView: Player joined room notification:', data);
    // This could trigger navigation in the UI
    // For now, we'll let the lobby callback handle the room state change
  };
}

GameView.register("GameView");
