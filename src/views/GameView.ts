import * as Multisynq from '@multisynq/client';
import GameModel from '../models/GameModel';
import { setupGameViewCallbacks } from '../contexts/RoomContext';

export class GameView extends Multisynq.View {
  model!: GameModel;
  private lobbyCallback: ((data: any) => void) | null = null;
  private gameCallback: ((gameSession: any, foods: any[]) => void) | null = null;
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
    
    // 立即设置全局callbacks，确保每次GameView实例创建时都有正确的callbacks
    console.log('GameView: Setting up global callbacks in constructor');
    setupGameViewCallbacks(this);
  }

  // Lobby management methods
  setLobbyCallback(callback: (data: any) => void) {
    console.log('GameView: Setting lobby callback');
    this.lobbyCallback = callback;
    
    // Note: 不再立即调用callback，避免时序问题
    // 全局callback设置会延迟触发一次状态更新
  }

  setGameCallback(callback: (gameSession: any, foods: any[]) => void) {
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
    this.publish("leaderboard-session", "get-data", {});
  }

  // 保存排行榜数据（游戏结束时调用）
  saveLeaderboard() {
    console.log('GameView: Saving leaderboard data');
    if (this.model?.leaderboardSession) {
      this.model.leaderboardSession.save();
      console.log('GameView: Leaderboard session save initiated');
    } else {
      console.warn('GameView: Cannot save leaderboard - leaderboard session not available');
    }
  }

  // 获取排行榜数据（从持久化会话中）
  getLeaderboardData() {
    console.log('GameView: Getting leaderboard data from session');
    if (this.model?.leaderboardSession) {
      this.publish("leaderboard-session", "get-data", {});
      return this.model.leaderboardSession.getLeaderboardData();
    } else {
      console.warn('GameView: Cannot get leaderboard data - leaderboard session not available');
      return null;
    }
  }

  // Room management methods
  createRoom(roomName: string, playerName: string, hostAddress: string, hasNFT?: boolean) {
    console.log('GameView: Creating room:', { roomName, playerName, hostAddress, hasNFT });
    this.publish("lobby", "create-room", {
      roomName,
      playerName,
      hostAddress,
      hasNFT,
      createdAt: new Date().toISOString()
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
    console.log('GameView: Getting game session by room:', roomId);
    if (!this.model?.lobby) {
      console.log('GameView: No lobby model available');
      return null;
    }
    
    const room = this.model.lobby.gameRooms.get(roomId);
    if (!room) {
      console.log('GameView: No room found for ID:', roomId);
      return null;
    }
    
    const gameState = room.getGameState();
    console.log('GameView: Retrieved game state:', {
      roomId,
      status: gameState?.status,
      countdown: gameState?.countdown,
      playersCount: gameState?.players?.length
    });
    
    return gameState;
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
      this.gameCallback(data.game, data.foods || []);
    }
  };

  private handlePlayerJoinedRoom = (data: any) => {
    console.log('GameView: Player joined room notification:', data);
    // 调用房间加入成功的回调函数
    if (this.roomJoinedCallback) {
      this.roomJoinedCallback(data);
    } else {
      console.warn('⚠️ GameView: roomJoinedCallback is null - this may happen during reconnection. Event data:', data);
      console.warn('⚠️ GameView: This indicates callbacks were not properly re-registered after reconnection');
    }
  };

  private handlePlayerJoinRoomFailed = (data: any) => {
    console.log('GameView: Player join room failed notification:', data);
    // 调用房间加入失败的回调函数
    if (this.roomJoinFailedCallback) {
      this.roomJoinFailedCallback(data);
    } else {
      console.warn('⚠️ GameView: roomJoinFailedCallback is null - this may happen during reconnection. Event data:', data);
    }
  };

  private handleRoomCreated = (data: any) => {
    console.log('GameView: Room created successfully:', data);
    // 调用房间创建成功的回调函数，用于直接导航
    if (this.roomCreatedCallback) {
      this.roomCreatedCallback(data);
    } else {
      console.warn('⚠️ GameView: roomCreatedCallback is null - this may happen during reconnection. Event data:', data);
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
    } else {
      console.warn('⚠️ GameView: roomCreationFailedCallback is null - this may happen during reconnection. Event data:', data);
    }
  };

  private handleLeaderboardUpdate = (data: any) => {
    console.log('GameView: Leaderboard updated:', data);
    if (this.leaderboardCallback) {
      this.leaderboardCallback(data);
    }
  };
}
