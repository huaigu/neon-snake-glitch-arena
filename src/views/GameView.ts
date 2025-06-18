
import * as Multisynq from '@multisynq/client';
import { Room, Player, GameSession, GamePlayer, Food } from '../models/GameModel';

export class GameView extends Multisynq.View {
  public model: any;
  
  // 回调函数
  private lobbyCallback: ((data: { rooms: Room[]; connectedPlayers: number }) => void) | null = null;
  private gameCallback: ((gameSession: GameSession | null, foods: Food[]) => void) | null = null;
  private systemCallback: ((data: { connectedPlayers: Set<string> }) => void) | null = null;

  constructor(model: any) {
    super(model);
    this.model = model;
    console.log('GameView: Constructor called with model:', !!model);
    this.setupSubscriptions();
    
    // 初始化时刷新一次状态
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
      const lobbyData = {
        rooms: this.model.rooms,
        connectedPlayers: this.model.connectedPlayers.size
      };
      
      if (this.lobbyCallback) {
        this.lobbyCallback(lobbyData);
        console.log('GameView: Lobby callback executed');
      } else {
        console.log('GameView: No lobby callback set');
      }
    } else {
      console.log('GameView: No model or rooms data available');
    }
  }

  refreshGameState() {
    console.log('GameView: Received game refresh event from Model');
    
    if (this.model && this.model.gameSessions) {
      console.log('GameView: Refreshing game UI with latest state');
      
      // 获取当前活跃的游戏会话（倒计时或进行中的游戏）
      const activeGameSession = this.model.gameSessions.find(
        (session: GameSession) => session.status === 'countdown' || session.status === 'playing'
      ) || null;
      
      // 获取食物数据
      const foods = this.model.foods || [];
      
      if (this.gameCallback) {
        this.gameCallback(activeGameSession, foods);
        console.log('GameView: Game callback executed with session:', !!activeGameSession, 'foods:', foods.length);
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
    // 不需要手动刷新，因为 Model 已经发布了 "lobby refresh" 事件
  }

  onJoinRoomSuccess(data: { roomId: string }) {
    console.log('GameView: Join room success event received:', data);
    // 不需要手动刷新，因为 Model 已经发布了 "lobby refresh" 事件
  }

  onJoinRoomFailed(data: { error: string }) {
    console.log('GameView: Join room failed event received:', data);
    // 可以在这里处理错误显示
  }

  onRoomCreationFailed(data: { error: string }) {
    console.log('GameView: Room creation failed event received:', data);
    // 可以在这里处理错误显示
  }

  // ============ 回调设置方法 ============
  setLobbyCallback(callback: (data: { rooms: Room[]; connectedPlayers: number }) => void) {
    this.lobbyCallback = callback;
    console.log('GameView: Lobby callback set');
  }

  setGameCallback(callback: (gameSession: GameSession | null, foods: Food[]) => void) {
    this.gameCallback = callback;
    console.log('GameView: Game callback set');
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
