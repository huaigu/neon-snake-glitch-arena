import * as Multisynq from '@multisynq/client';

export interface Room {
  id: string;
  name: string;
  host: string;
  hostAddress: string;
  players: Player[];
  maxPlayers: number;
  isPrivate: boolean;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: string;
}

export interface Player {
  id: string;
  address: string;
  name: string;
  isReady: boolean;
  joinedAt: string;
}

export interface GameSession {
  id: string;
  roomId: string;
  players: GamePlayer[];
  status: 'waiting' | 'playing' | 'paused' | 'finished';
  startedAt?: string;
  finishedAt?: string;
}

export interface GamePlayer {
  id: string;
  name: string;
  address: string;
  color: string;
  score: number;
  isAlive: boolean;
  position?: { x: number; y: number };
  direction?: 'up' | 'down' | 'left' | 'right';
}

export class GameModel extends Multisynq.Model {
  // 房间管理
  rooms: Room[] = [];
  private playerRoomMap: Map<string, string> = new Map(); // playerAddress -> roomId
  
  // 游戏会话管理
  gameSessions: GameSession[] = [];
  private roomGameMap: Map<string, string> = new Map(); // roomId -> gameSessionId
  
  // 系统管理
  private instanceId: string;
  connectedPlayers: Set<string> = new Set(); // 当前连接的玩家地址

  init() {
    this.instanceId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    console.log(`GameModel instance created and initialized: ${this.instanceId}`);
    
    // 监听玩家进入和离开事件
    this.subscribe(this.sessionId, "view-join", this.onViewJoin);
    this.subscribe(this.sessionId, "view-exit", this.onViewExit);
    
    // 监听房间相关事件
    console.log(`GameModel ${this.instanceId}: Subscribing to lobby events`);
    this.subscribe("lobby", "create-room", this.createRoom);
    this.subscribe("lobby", "join-room", this.joinRoom);
    this.subscribe("lobby", "leave-room", this.leaveRoom);
    this.subscribe("lobby", "set-player-ready", this.setPlayerReady);
    
    // 监听游戏相关事件
    console.log(`GameModel ${this.instanceId}: Subscribing to game events`);
    this.subscribe("game", "start-game", this.startGame);
    this.subscribe("game", "player-move", this.handlePlayerMove);
    this.subscribe("game", "player-died", this.handlePlayerDied);
    this.subscribe("game", "end-game", this.endGame);
    
    console.log(`GameModel ${this.instanceId}: All event subscriptions complete`);
  }

  // ============ 系统事件处理 ============
  onViewJoin(viewInfo: any) {
    console.log(`GameModel: Player joined session (${this.instanceId}):`, viewInfo);
    this.connectedPlayers.add(viewInfo.viewId);
    this.publish("system", "refresh");
  }

  onViewExit(viewInfo: any) {
    console.log(`GameModel: Player left session (${this.instanceId}):`, viewInfo);
    const playerAddress = viewInfo.viewId;
    this.connectedPlayers.delete(playerAddress);
    
    // 从房间中移除玩家
    const roomId = this.playerRoomMap.get(playerAddress);
    if (roomId) {
      console.log(`GameModel: Player ${playerAddress} was in room ${roomId}, removing from room`);
      this.removePlayerFromRoom(roomId, playerAddress);
      this.playerRoomMap.delete(playerAddress);
    }
    
    // 查找并删除用户创建的房间（如果用户是房主）
    const userRooms = this.rooms.filter(room => room.hostAddress === playerAddress);
    if (userRooms.length > 0) {
      this.rooms = this.rooms.filter(room => room.hostAddress !== playerAddress);
      console.log(`GameModel: Deleted ${userRooms.length} room(s) created by user ${playerAddress}`);
      
      // 清理这些房间中所有玩家的 playerRoomMap 记录
      userRooms.forEach(room => {
        room.players.forEach(player => {
          this.playerRoomMap.delete(player.address);
        });
      });
    }
    
    this.publish("lobby", "refresh");
    this.publish("system", "refresh");
  }

  // ============ 房间管理 ============
  createRoom(data: { roomName: string; hostName: string; hostAddress: string }) {
    const existingRoom = this.rooms.find(room => room.hostAddress === data.hostAddress);
    if (existingRoom) {
      this.publish("lobby", "room-creation-failed", { 
        error: "You can only create one room at a time. Please leave your current room first." 
      });
      return;
    }

    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRoom: Room = {
      id: roomId,
      name: data.roomName,
      host: data.hostName,
      hostAddress: data.hostAddress,
      players: [{
        id: data.hostAddress,
        address: data.hostAddress,
        name: data.hostName,
        isReady: false,
        joinedAt: new Date().toISOString()
      }],
      maxPlayers: 8,
      isPrivate: false,
      status: 'waiting',
      createdAt: new Date().toISOString()
    };

    this.rooms.push(newRoom);
    this.playerRoomMap.set(data.hostAddress, roomId);
    
    console.log(`GameModel: Room ${roomId} created by ${data.hostAddress}`);
    this.publish("lobby", "room-created", { roomId, room: newRoom });
    this.publish("lobby", "refresh");
  }

  joinRoom(data: { roomId: string; playerAddress: string; playerName: string }) {
    const room = this.rooms.find(r => r.id === data.roomId);
    if (!room) {
      this.publish("lobby", "join-room-failed", { error: "Room not found" });
      return;
    }

    if (room.players.length >= room.maxPlayers || room.status !== 'waiting') {
      this.publish("lobby", "join-room-failed", { error: "Room is full or not available" });
      return;
    }

    if (room.players.some(p => p.address === data.playerAddress)) {
      this.publish("lobby", "join-room-success", { roomId: data.roomId });
      return;
    }

    // 如果玩家在其他房间中，先移除
    const currentRoomId = this.playerRoomMap.get(data.playerAddress);
    if (currentRoomId && currentRoomId !== data.roomId) {
      this.removePlayerFromRoom(currentRoomId, data.playerAddress);
    }

    // 添加玩家到新房间
    const newPlayer: Player = {
      id: data.playerAddress,
      address: data.playerAddress,
      name: data.playerName,
      isReady: false,
      joinedAt: new Date().toISOString()
    };

    const roomIndex = this.rooms.findIndex(r => r.id === data.roomId);
    this.rooms[roomIndex] = {
      ...room,
      players: [...room.players, newPlayer]
    };

    this.playerRoomMap.set(data.playerAddress, data.roomId);
    
    console.log(`GameModel: Player ${data.playerAddress} joined room ${data.roomId}`);
    this.publish("lobby", "join-room-success", { roomId: data.roomId });
    this.publish("lobby", "refresh");
  }

  leaveRoom(data: { roomId: string; playerAddress: string }) {
    console.log('GameModel: leaveRoom called:', data);
    this.removePlayerFromRoom(data.roomId, data.playerAddress);
    this.playerRoomMap.delete(data.playerAddress);
    this.publish("lobby", "refresh");
  }

  private removePlayerFromRoom(roomId: string, playerAddress: string) {
    const roomIndex = this.rooms.findIndex(r => r.id === roomId);
    if (roomIndex === -1) {
      console.log('GameModel: Room not found:', roomId);
      return;
    }

    const room = this.rooms[roomIndex];
    console.log('GameModel: Removing player from room:', { roomId, playerAddress, hostAddress: room.hostAddress });
    
    if (room.hostAddress === playerAddress) {
      // 如果是房主离开，删除整个房间
      room.players.forEach(player => {
        this.playerRoomMap.delete(player.address);
      });
      
      this.rooms.splice(roomIndex, 1);
      console.log(`GameModel: Room ${roomId} deleted because host ${playerAddress} left`);
    } else {
      // 普通成员离开
      const updatedPlayers = room.players.filter(p => p.address !== playerAddress);
      
      if (updatedPlayers.length === 0) {
        this.rooms.splice(roomIndex, 1);
        console.log(`GameModel: Room ${roomId} deleted because no players left`);
      } else {
        this.rooms[roomIndex] = {
          ...room,
          players: updatedPlayers
        };
        console.log(`GameModel: Updated room ${roomId}, remaining players:`, updatedPlayers.length);
      }
    }
  }

  setPlayerReady(data: { roomId: string; playerAddress: string; isReady: boolean }) {
    console.log('GameModel: setPlayerReady called:', data);
    const roomIndex = this.rooms.findIndex(r => r.id === data.roomId);
    if (roomIndex === -1) {
      console.log('GameModel: Room not found:', data.roomId);
      return;
    }

    const room = this.rooms[roomIndex];
    const playerIndex = room.players.findIndex(p => p.address === data.playerAddress);
    if (playerIndex === -1) {
      console.log('GameModel: Player not found in room:', data.playerAddress);
      return;
    }

    const oldReadyState = this.rooms[roomIndex].players[playerIndex].isReady;
    
    // 如果状态没有变化，不需要更新
    if (oldReadyState === data.isReady) {
      console.log(`GameModel: Player ${data.playerAddress} ready state unchanged (${oldReadyState}), skipping update`);
      return;
    }
    
    // 创建新的房间对象以确保 Multisynq 检测到变化
    const updatedPlayers = [...room.players];
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      isReady: data.isReady
    };
    
    this.rooms[roomIndex] = {
      ...room,
      players: updatedPlayers
    };
    
    const newReadyState = this.rooms[roomIndex].players[playerIndex].isReady;
    console.log(`GameModel: Player ${data.playerAddress} ready state updated: ${oldReadyState} -> ${newReadyState}`);
    
    this.publish("lobby", "refresh");
  }

  // ============ 游戏会话管理 ============
  startGame(data: { roomId: string }) {
    console.log('GameModel: startGame called:', data);
    const room = this.rooms.find(r => r.id === data.roomId);
    if (!room) {
      console.log('GameModel: Room not found for game start:', data.roomId);
      return;
    }

    // 检查所有玩家是否都准备好了
    const allReady = room.players.every(p => p.isReady);
    if (!allReady) {
      console.log('GameModel: Not all players are ready');
      return;
    }

    // 创建游戏会话
    const gameSessionId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const gameSession: GameSession = {
      id: gameSessionId,
      roomId: data.roomId,
      players: room.players.map((player, index) => ({
        id: player.address,
        name: player.name,
        address: player.address,
        color: this.getPlayerColor(index),
        score: 0,
        isAlive: true,
        position: this.getInitialPosition(index),
        direction: 'right'
      })),
      status: 'playing',
      startedAt: new Date().toISOString()
    };

    this.gameSessions.push(gameSession);
    this.roomGameMap.set(data.roomId, gameSessionId);

    // 更新房间状态
    const roomIndex = this.rooms.findIndex(r => r.id === data.roomId);
    this.rooms[roomIndex].status = 'playing';

    console.log(`GameModel: Game session ${gameSessionId} started for room ${data.roomId}`);
    this.publish("game", "refresh");
    this.publish("lobby", "refresh");
  }

  handlePlayerMove(data: { gameSessionId: string; playerAddress: string; direction: string }) {
    const gameSession = this.gameSessions.find(g => g.id === data.gameSessionId);
    if (!gameSession) return;

    const playerIndex = gameSession.players.findIndex(p => p.address === data.playerAddress);
    if (playerIndex === -1) return;

    gameSession.players[playerIndex].direction = data.direction as any;
    this.publish("game", "refresh");
  }

  handlePlayerDied(data: { gameSessionId: string; playerAddress: string }) {
    const gameSession = this.gameSessions.find(g => g.id === data.gameSessionId);
    if (!gameSession) return;

    const playerIndex = gameSession.players.findIndex(p => p.address === data.playerAddress);
    if (playerIndex === -1) return;

    gameSession.players[playerIndex].isAlive = false;
    
    // 检查游戏是否结束
    const alivePlayers = gameSession.players.filter(p => p.isAlive);
    if (alivePlayers.length <= 1) {
      this.endGameSession(data.gameSessionId);
    }

    this.publish("game", "refresh");
  }

  endGame(data: { gameSessionId: string }) {
    this.endGameSession(data.gameSessionId);
  }

  private endGameSession(gameSessionId: string) {
    const gameSession = this.gameSessions.find(g => g.id === gameSessionId);
    if (!gameSession) return;

    gameSession.status = 'finished';
    gameSession.finishedAt = new Date().toISOString();

    // 重置房间状态
    const room = this.rooms.find(r => r.id === gameSession.roomId);
    if (room) {
      const roomIndex = this.rooms.findIndex(r => r.id === gameSession.roomId);
      this.rooms[roomIndex].status = 'waiting';
      
      // 重置所有玩家的准备状态
      this.rooms[roomIndex].players.forEach(player => {
        player.isReady = false;
      });
    }

    this.roomGameMap.delete(gameSession.roomId);
    
    console.log(`GameModel: Game session ${gameSessionId} ended`);
    this.publish("game", "refresh");
    this.publish("lobby", "refresh");
  }

  // ============ 工具方法 ============
  private getPlayerColor(index: number): string {
    const colors = ['#00ff00', '#ff0000', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080'];
    return colors[index % colors.length];
  }

  private getInitialPosition(index: number): { x: number; y: number } {
    const positions = [
      { x: 50, y: 50 },
      { x: 750, y: 50 },
      { x: 50, y: 550 },
      { x: 750, y: 550 },
      { x: 400, y: 50 },
      { x: 400, y: 550 },
      { x: 50, y: 300 },
      { x: 750, y: 300 }
    ];
    return positions[index % positions.length];
  }

  // ============ 查询方法 ============
  getRoomByPlayer(playerAddress: string): Room | null {
    const roomId = this.playerRoomMap.get(playerAddress);
    return roomId ? this.rooms.find(r => r.id === roomId) || null : null;
  }

  getGameSessionByRoom(roomId: string): GameSession | null {
    const gameSessionId = this.roomGameMap.get(roomId);
    return gameSessionId ? this.gameSessions.find(g => g.id === gameSessionId) || null : null;
  }

  isPlayerConnected(playerAddress: string): boolean {
    return this.connectedPlayers.has(playerAddress);
  }
}

// 注册 GameModel 到 Multisynq
GameModel.register("GameModel");

// 确保 GameModel 被正确导出
export default GameModel; 