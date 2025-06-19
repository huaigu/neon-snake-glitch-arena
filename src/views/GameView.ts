import * as Multisynq from '@multisynq/client';
import { Room, Player, GameSession, GamePlayer, Food, Segment } from '../models/GameModel';

export class GameView extends Multisynq.View {
  public model: any;
  
  // 回调函数
  private lobbyCallback: ((data: { rooms: Room[]; connectedPlayers: number }) => void) | null = null;
  private gameCallback: ((gameSession: GameSession | null, foods: Food[], segments: Segment[]) => void) | null = null;
  private systemCallback: ((data: { connectedPlayers: Set<string> }) => void) | null = null;

  constructor(model: any) {
    super(model);
    this.model = model;
    console.log('GameView: Constructor called with model:', !!model);
    this.setupSubscriptions();
    
    // 初始化时立即刷新状态，确保任何已设置的回调都能收到初始数据
    this.refreshAllStates();
    console.log('GameView: Instance created and initial states refreshed');
  }

  setupSubscriptions() {
    console.log('GameView: Setting up subscriptions...');
    
    // 订阅 Model 发布的本地状态刷新事件
    this.subscribe("lobby", "refresh", this.refreshLobbyState.bind(this));
    this.subscribe("game", "refresh", this.refreshGameState.bind(this));
    this.subscribe("system", "refresh", this.refreshSystemState.bind(this));
    
    // 订阅特定事件的响应
    this.subscribe("lobby", "room-created", this.onRoomCreated.bind(this));
    this.subscribe("lobby", "join-room-success", this.onJoinRoomSuccess.bind(this));
    this.subscribe("lobby", "join-room-failed", this.onJoinRoomFailed.bind(this));
    this.subscribe("lobby", "room-creation-failed", this.onRoomCreationFailed.bind(this));
    
    console.log('GameView: Subscribed to all refresh events');
  }

  // ============ 状态刷新方法 ============
  refreshAllStates() {
    this.refreshLobbyState();
    this.refreshGameState();
    this.refreshSystemState();
  }

  refreshLobbyState() {
    console.log('GameView: Received lobby refresh event from Model');
    
    if (this.model && this.model.rooms) {
      console.log('GameView: Refreshing lobby UI with latest state');
      // 创建深拷贝确保所有引用都是新的，特别是玩家数据
      const lobbyData = {
        rooms: this.model.rooms.map((room: any) => ({
          ...room,
          players: room.players.map((player: any) => ({ ...player }))
        })),
        connectedPlayers: this.model.connectedPlayers.size
      };
      
      console.log('GameView: Lobby data prepared with detailed room states:', {
        roomsCount: lobbyData.rooms.length,
        roomsDetails: lobbyData.rooms.map(r => ({
          id: r.id,
          name: r.name,
          status: r.status,
          playersCount: r.players.length,
          playersReady: r.players.map((p: any) => ({ name: p.name, isReady: p.isReady }))
        }))
      });
      
      if (this.lobbyCallback) {
        console.log('GameView: Executing lobby callback with rooms:', lobbyData.rooms.length);
        this.lobbyCallback(lobbyData);
        console.log('GameView: Lobby callback executed successfully');
      } else {
        console.log('GameView: No lobby callback set - this is normal during initialization');
      }
    } else {
      console.log('GameView: No model or rooms data available');
    }
  }

  refreshGameState() {
    console.log('GameView: Received game refresh event from Model');
    
    if (this.model && this.model.gameSessions) {
      console.log('GameView: Refreshing game UI with latest state');
      
      // 简化逻辑：优先获取活跃的游戏会话
      let currentGameSession = this.model.gameSessions.find(
        (session: GameSession) => session.status === 'countdown' || session.status === 'playing'
      ) || null;
      
      // 如果没有活跃会话，获取最近完成的游戏会话
      if (!currentGameSession) {
        // 按时间倒序排列，获取最新的已完成游戏会话
        const finishedSessions = this.model.gameSessions
          .filter((session: GameSession) => session.status === 'finished')
          .sort((a: GameSession, b: GameSession) => {
            const timeA = new Date(a.finishedAt || '').getTime();
            const timeB = new Date(b.finishedAt || '').getTime();
            return timeB - timeA; // 降序排列，最新的在前
          });
        
        currentGameSession = finishedSessions[0] || null;
      }
      
      // 获取食物和道具数据
      const foods = this.model.foods || [];
      const segments = this.model.segments || [];
      
      if (this.gameCallback) {
        this.gameCallback(currentGameSession, foods, segments);
        console.log('GameView: Game callback executed with session:', !!currentGameSession, 'status:', currentGameSession?.status, 'foods:', foods.length, 'segments:', segments.length);
      } else {
        console.log('GameView: No game callback set');
      }
    } else {
      console.log('GameView: No model or game sessions data available');
    }
  }

  refreshSystemState() {
    console.log('GameView: Received system refresh event from Model');
    
    if (this.model) {
      console.log('GameView: Refreshing system UI with latest state');
      const systemData = {
        connectedPlayers: this.model.connectedPlayers
      };
      
      if (this.systemCallback) {
        this.systemCallback(systemData);
        console.log('GameView: System callback executed');
      } else {
        console.log('GameView: No system callback set');
      }
    }
  }

  // ============ 事件响应方法 ============
  onRoomCreated(data: { roomId: string; room: Room }) {
    console.log('GameView: Room created event received:', data);
  }

  onJoinRoomSuccess(data: { roomId: string }) {
    console.log('GameView: Join room success event received:', data);
  }

  onJoinRoomFailed(data: { error: string }) {
    console.log('GameView: Join room failed event received:', data);
  }

  onRoomCreationFailed(data: { error: string }) {
    console.log('GameView: Room creation failed event received:', data);
  }

  // ============ 回调设置方法 ============
  setLobbyCallback(callback: (data: { rooms: Room[]; connectedPlayers: number }) => void) {
    console.log('GameView: Setting lobby callback');
    this.lobbyCallback = callback;
    
    // 立即调用一次回调，如果有数据的话
    if (this.model && this.model.rooms) {
      // 使用与 refreshLobbyState 相同的深拷贝逻辑
      const lobbyData = {
        rooms: this.model.rooms.map((room: any) => ({
          ...room,
          players: room.players.map((player: any) => ({ ...player }))
        })),
        connectedPlayers: this.model.connectedPlayers.size
      };
      console.log('GameView: Immediately calling lobby callback with current data:', lobbyData.rooms.length, 'rooms');
      callback(lobbyData);
    }
  }

  setGameCallback(callback: (gameSession: GameSession | null, foods: Food[], segments: Segment[]) => void) {
    console.log('GameView: Setting game callback');
    this.gameCallback = callback;
    
    // 立即调用一次回调，如果有数据的话
    if (this.model && this.model.gameSessions) {
      // 优先获取活跃的游戏会话
      let currentGameSession = this.model.gameSessions.find(
        (session: GameSession) => session.status === 'countdown' || session.status === 'playing'
      ) || null;
      
      // 如果没有活跃会话，获取最新的已完成游戏会话
      if (!currentGameSession) {
        const finishedSessions = this.model.gameSessions
          .filter((session: GameSession) => session.status === 'finished')
          .sort((a: GameSession, b: GameSession) => {
            const timeA = new Date(a.finishedAt || '').getTime();
            const timeB = new Date(b.finishedAt || '').getTime();
            return timeB - timeA;
          });
        
        currentGameSession = finishedSessions[0] || null;
      }
      
      const foods = this.model.foods || [];
      const segments = this.model.segments || [];
      console.log('GameView: Immediately calling game callback with current data');
      callback(currentGameSession, foods, segments);
    }
  }

  setSystemCallback(callback: (data: { connectedPlayers: Set<string> }) => void) {
    this.systemCallback = callback;
    console.log('GameView: System callback set');
  }

  // ============ 发布事件方法 (供 React 组件调用) ============
  
  // 房间管理
  createRoom(roomName: string, hostName: string, hostAddress: string) {
    console.log('GameView: Publishing create-room event');
    this.publish("lobby", "create-room", { roomName, hostName, hostAddress });
  }

  joinRoom(roomId: string, playerAddress: string, playerName: string) {
    console.log('GameView: Publishing join-room event');
    this.publish("lobby", "join-room", { roomId, playerAddress, playerName });
  }

  leaveRoom(roomId: string, playerAddress: string) {
    console.log('GameView: Publishing leave-room event');
    this.publish("lobby", "leave-room", { roomId, playerAddress });
  }

  setPlayerReady(roomId: string, playerAddress: string, isReady: boolean) {
    console.log('GameView: Publishing set-player-ready event:', { roomId, playerAddress, isReady });
    this.publish("lobby", "set-player-ready", { roomId, playerAddress, isReady });
  }

  // 游戏管理
  startGame(roomId: string) {
    console.log('GameView: Publishing start-game event');
    this.publish("game", "start-game", { roomId });
  }

  playerMove(gameSessionId: string, playerAddress: string, direction: string) {
    console.log('GameView: Publishing player-move event');
    this.publish("game", "player-move", { gameSessionId, playerAddress, direction });
  }

  changeDirection(gameSessionId: string, playerAddress: string, direction: 'up' | 'down' | 'left' | 'right') {
    console.log('GameView: Publishing player-direction-change event');
    this.publish("game", "player-direction-change", { gameSessionId, playerAddress, direction });
  }

  playerDied(gameSessionId: string, playerAddress: string) {
    console.log('GameView: Publishing player-died event');
    this.publish("game", "player-died", { gameSessionId, playerAddress });
  }

  endGame(gameSessionId: string) {
    console.log('GameView: Publishing end-game event');
    this.publish("game", "end-game", { gameSessionId });
  }

  // 进入观察者模式方法
  enterSpectatorMode(gameSessionId: string, playerAddress: string) {
    console.log('GameView: Publishing enter-spectator-mode event');
    this.publish("game", "enter-spectator-mode", { gameSessionId, playerAddress });
  }

  // ============ 查询方法 ============
  getRoomByPlayer(playerAddress: string): Room | null {
    return this.model ? this.model.getRoomByPlayer(playerAddress) : null;
  }

  getGameSessionByRoom(roomId: string): GameSession | null {
    return this.model ? this.model.getGameSessionByRoom(roomId) : null;
  }

  isPlayerConnected(playerAddress: string): boolean {
    return this.model ? this.model.isPlayerConnected(playerAddress) : false;
  }

  // ============ 清理方法 ============
  cleanup() {
    console.log('GameView: Cleaning up subscriptions');
    this.unsubscribeAll();
    this.lobbyCallback = null;
    this.gameCallback = null;
    this.systemCallback = null;
  }
}
