
import * as Multisynq from '@multisynq/client';
import GameModel from '../models/GameModel';

export class GameView extends Multisynq.View {
  model!: GameModel;
  private lobbyCallback: ((data: any) => void) | null = null;
  private gameCallback: ((gameSession: any, foods: any[], segments: any[]) => void) | null = null;
  private roomJoinedCallback: ((data: any) => void) | null = null;
  private roomCreatedCallback: ((data: any) => void) | null = null;
  private roomJoinFailedCallback: ((data: any) => void) | null = null;
  private roomCreationFailedCallback: ((data: any) => void) | null = null;
  private leaderboardCallback: ((data: any) => void) | null = null;

  constructor(model: GameModel) {
    super(model);
    this.model = model;
    
    console.log('GameView: Initializing with model:', !!model);
    
    // Subscribe to lobby updates
    this.subscribe("lobby", "updated", this.handleLobbyUpdate);
    
    // Subscribe to room created events
    this.subscribe("lobby", "room-created", this.handleRoomCreated);
    
    // Subscribe to room updates  
    this.subscribe("room", "updated", this.handleRoomUpdate);
    
    // Subscribe to player notifications
    this.subscribe("player", "joined-room", this.handlePlayerJoinedRoom);
    this.subscribe("player", "join-room-failed", this.handlePlayerJoinRoomFailed);
    this.subscribe("player", "room-creation-failed", this.handleRoomCreationFailed);
    
    // Subscribe to player errors
    this.subscribe("player", "create-room-error", this.handleCreateRoomError);
    
    // Subscribe to leaderboard updates
    this.subscribe("leaderboard", "updated", this.handleLeaderboardUpdate);
    
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

  setRoomJoinedCallback(callback: (data: any) => void) {
    console.log('GameView: Setting room joined callback');
    this.roomJoinedCallback = callback;
  }

  setRoomJoinFailedCallback(callback: (data: any) => void) {
    console.log('GameView: Setting room join failed callback');
    this.roomJoinFailedCallback = callback;
  }

  setRoomCreatedCallback(callback: (data: any) => void) {
    console.log('GameView: Setting room created callback');
    this.roomCreatedCallback = callback;
  }

  setRoomCreationFailedCallback(callback: (data: any) => void) {
    console.log('GameView: Setting room creation failed callback');
    this.roomCreationFailedCallback = callback;
  }

  setLeaderboardCallback(callback: (data: any) => void) {
    console.log('GameView: Setting leaderboard callback');
    this.leaderboardCallback = callback;
    
    // Request current leaderboard data
    this.requestLeaderboard();
  }

  // Leaderboard methods
  requestLeaderboard() {
    console.log('GameView: Requesting leaderboard data');
    this.publish("leaderboard", "get-rankings", {});
  }

  // Room management methods
  createRoom(roomName: string, playerName: string, hostAddress: string, hasNFT?: boolean) {
    console.log('GameView: Creating room:', { roomName, playerName, hostAddress, hasNFT });
    this.publish("lobby", "create-room", {
      roomName,
      playerName,
      hostAddress,
      hasNFT
    });
  }

  joinRoom(roomId: string, address: string, playerName: string, hasNFT?: boolean) {
    console.log('GameView: Joining room:', { roomId, address, playerName, hasNFT });
    this.publish("lobby", "join-room", {
      roomId,
      address,
      playerName,
      hasNFT
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
    // 调用房间加入成功的回调函数
    if (this.roomJoinedCallback) {
      this.roomJoinedCallback(data);
    }
  };

  private handlePlayerJoinRoomFailed = (data: any) => {
    console.log('GameView: Player join room failed notification:', data);
    // 调用房间加入失败的回调函数
    if (this.roomJoinFailedCallback) {
      this.roomJoinFailedCallback(data);
    }
  };

  private handleRoomCreated = (data: any) => {
    console.log('GameView: Room created successfully:', data);
    // 调用房间创建成功的回调函数，用于直接导航
    if (this.roomCreatedCallback) {
      this.roomCreatedCallback(data);
    }
  };

  private handleCreateRoomError = (data: any) => {
    console.log('GameView: Create room error:', data);
    // This will be handled by the RoomContext subscription
  };

  private handleRoomCreationFailed = (data: any) => {
    console.log('GameView: Room creation failed:', data);
    if (this.roomCreationFailedCallback) {
      this.roomCreationFailedCallback(data);
    }
  };

  private handleLeaderboardUpdate = (data: any) => {
    console.log('GameView: Leaderboard updated:', data);
    if (this.leaderboardCallback) {
      this.leaderboardCallback(data);
    }
  };
}
