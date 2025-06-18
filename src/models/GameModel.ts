
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
  status: 'waiting' | 'countdown' | 'playing' | 'paused' | 'finished';
  startedAt?: string;
  finishedAt?: string;
  countdown?: number;
}

export interface GamePlayer {
  id: string;
  name: string;
  address: string;
  color: string;
  score: number;
  isAlive: boolean;
  position: { x: number; y: number };
  direction: 'up' | 'down' | 'left' | 'right';
  segments: { x: number; y: number }[];
}

export interface Food {
  id: string;
  position: { x: number; y: number };
  type: 'normal' | 'bonus';
  value: number;
}

export class GameModel extends Multisynq.Model {
  // 房间管理
  rooms: Room[] = [];
  private playerRoomMap: Map<string, string> = new Map(); // playerAddress -> roomId
  
  // 游戏会话管理
  gameSessions: GameSession[] = [];
  private roomGameMap: Map<string, string> = new Map(); // roomId -> gameSessionId
  
  // 游戏状态
  foods: Food[] = [];
  
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
    this.subscribe("game", "player-direction-change", this.handlePlayerDirectionChange);
    
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

    // 检查房间状态 - 如果房间正在游戏中，不允许加入
    if (room.status === 'playing') {
      this.publish("lobby", "join-room-failed", { error: "Game is already in progress" });
      return;
    }

    if (room.players.length >= room.maxPlayers || room.status === 'finished') {
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
        // 如果房间没有玩家了，删除房间
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
    
    // 如果房间已经在游戏中，不允许改变ready状态
    if (room.status === 'playing') {
      console.log('GameModel: Cannot change ready state, game already in progress');
      return;
    }

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
    
    // 检查是否所有玩家都准备好了，并且玩家数大于等于2
    const allReady = this.rooms[roomIndex].players.every(p => p.isReady);
    const playerCount = this.rooms[roomIndex].players.length;
    
    if (allReady && playerCount >= 2) {
      console.log('GameModel: All players ready and player count >= 2, changing room status to playing');
      // 将房间状态改为playing，防止新玩家加入
      this.rooms[roomIndex] = {
        ...this.rooms[roomIndex],
        status: 'playing'
      };
      
      // 开始游戏
      this.startGame({ roomId: data.roomId });
    }
    
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

    // 检查所有玩家是否都准备好了且人数大于2
    const allReady = room.players.every(p => p.isReady);
    const playerCount = room.players.length;
    if (!allReady || playerCount < 2) {
      console.log('GameModel: Not all players are ready or player count < 2');
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
        position: this.getInitialPosition(index, room.players.length),
        direction: 'right',
        segments: [
          this.getInitialPosition(index, room.players.length),
          { x: this.getInitialPosition(index, room.players.length).x - 1, y: this.getInitialPosition(index, room.players.length).y },
          { x: this.getInitialPosition(index, room.players.length).x - 2, y: this.getInitialPosition(index, room.players.length).y }
        ]
      })),
      status: 'countdown',
      countdown: 3,
      startedAt: new Date().toISOString()
    };

    this.gameSessions.push(gameSession);
    this.roomGameMap.set(data.roomId, gameSessionId);

    // 更新房间状态
    const roomIndex = this.rooms.findIndex(r => r.id === data.roomId);
    this.rooms[roomIndex].status = 'playing';

    // 生成初始食物
    this.generateInitialFood(8);

    console.log(`GameModel: Game session ${gameSessionId} created with countdown`);
    this.publish("game", "refresh");
    this.publish("lobby", "refresh");

    // 开始3秒倒计时
    this.startCountdown(gameSessionId);
  }

  startCountdown(gameSessionId: string) {
    console.log('GameModel: Starting countdown for game session:', gameSessionId);
    
    const gameSession = this.gameSessions.find(g => g.id === gameSessionId);
    if (!gameSession || gameSession.status !== 'countdown') {
      return;
    }

    // 使用 this.future 来实现倒计时
    this.future(1000).countdownTick(gameSessionId);
  }

  countdownTick(gameSessionId: string) {
    const gameSessionIndex = this.gameSessions.findIndex(g => g.id === gameSessionId);
    if (gameSessionIndex === -1) {
      console.log('GameModel: Game session not found for countdown:', gameSessionId);
      return;
    }

    const gameSession = this.gameSessions[gameSessionIndex];
    if (gameSession.status !== 'countdown') {
      return;
    }

    const newCountdown = (gameSession.countdown || 3) - 1;
    
    if (newCountdown <= 0) {
      // 倒计时结束，开始游戏
      this.gameSessions[gameSessionIndex] = {
        ...gameSession,
        status: 'playing',
        countdown: 0
      };
      
      console.log('GameModel: Countdown finished, starting game');
      this.publish("game", "refresh");
      
      // 开始游戏循环
      this.future(150).gameStep(gameSessionId);
    } else {
      // 继续倒计时
      this.gameSessions[gameSessionIndex] = {
        ...gameSession,
        countdown: newCountdown
      };
      
      console.log(`GameModel: Countdown: ${newCountdown}`);
      this.publish("game", "refresh");
      
      // 继续倒计时
      this.future(1000).countdownTick(gameSessionId);
    }
  }

  gameStep(gameSessionId: string) {
    const gameSessionIndex = this.gameSessions.findIndex(g => g.id === gameSessionId);
    if (gameSessionIndex === -1) return;

    const gameSession = this.gameSessions[gameSessionIndex];
    if (gameSession.status !== 'playing') return;

    // 移动所有存活的玩家
    const updatedPlayers = gameSession.players.map(player => {
      if (!player.isAlive) return player;

      const head = { ...player.position };
      
      // 根据方向移动
      switch (player.direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
      }

      // 边界检查
      if (head.x < 0 || head.x >= 60 || head.y < 0 || head.y >= 60) {
        console.log(`GameModel: Player ${player.name} hit wall at (${head.x}, ${head.y})`);
        return { ...player, isAlive: false };
      }

      // 检查与自己身体的碰撞
      if (player.segments.some(segment => segment.x === head.x && segment.y === head.y)) {
        console.log(`GameModel: Player ${player.name} hit themselves`);
        return { ...player, isAlive: false };
      }

      // 检查与其他玩家的碰撞
      const otherPlayers = gameSession.players.filter(p => p.id !== player.id && p.isAlive);
      if (otherPlayers.some(p => p.segments.some(segment => segment.x === head.x && segment.y === head.y))) {
        console.log(`GameModel: Player ${player.name} hit another player`);
        return { ...player, isAlive: false };
      }

      // 检查食物碰撞
      const eatenFood = this.foods.find(food => food.position.x === head.x && food.position.y === head.y);
      let newSegments = [head, ...player.segments];
      let newScore = player.score;

      if (eatenFood) {
        // 吃到食物，增加分数，不移除尾部
        newScore += eatenFood.value;
        console.log(`GameModel: Player ${player.name} ate food, score: ${newScore}`);
        // 移除被吃掉的食物
        this.foods = this.foods.filter(food => food.id !== eatenFood.id);
        // 生成新食物
        this.generateFood();
      } else {
        // 没吃到食物，移除尾部
        newSegments.pop();
      }

      return {
        ...player,
        position: head,
        segments: newSegments,
        score: newScore
      };
    });

    // 更新游戏会话
    this.gameSessions[gameSessionIndex] = {
      ...gameSession,
      players: updatedPlayers
    };

    // 检查游戏是否结束 - 修复: 只有当存活玩家数量 <= 1 时才结束游戏
    const alivePlayers = updatedPlayers.filter(p => p.isAlive);
    console.log(`GameModel: Game step completed, alive players: ${alivePlayers.length}/${updatedPlayers.length}`);
    
    if (alivePlayers.length <= 1) {
      console.log(`GameModel: Game ending - only ${alivePlayers.length} players alive`);
      this.endGameSession(gameSessionId);
      return;
    }

    this.publish("game", "refresh");
    
    // 继续游戏循环
    this.future(150).gameStep(gameSessionId);
  }

  handlePlayerDirectionChange(data: { gameSessionId: string; playerAddress: string; direction: 'up' | 'down' | 'left' | 'right' }) {
    const gameSessionIndex = this.gameSessions.findIndex(g => g.id === data.gameSessionId);
    if (gameSessionIndex === -1) return;

    const gameSession = this.gameSessions[gameSessionIndex];
    if (gameSession.status !== 'playing') return;

    const playerIndex = gameSession.players.findIndex(p => p.address === data.playerAddress);
    if (playerIndex === -1) return;

    const player = gameSession.players[playerIndex];
    
    // 防止反向移动
    const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
    if (opposites[data.direction] === player.direction) {
      return;
    }

    // 更新玩家方向
    const updatedPlayers = [...gameSession.players];
    updatedPlayers[playerIndex] = {
      ...player,
      direction: data.direction
    };

    this.gameSessions[gameSessionIndex] = {
      ...gameSession,
      players: updatedPlayers
    };

    this.publish("game", "refresh");
  }

  handlePlayerMove(data: { gameSessionId: string; playerAddress: string; direction: string }) {
    // 这个方法现在用于处理方向改变
    this.handlePlayerDirectionChange({
      gameSessionId: data.gameSessionId,
      playerAddress: data.playerAddress,
      direction: data.direction as 'up' | 'down' | 'left' | 'right'
    });
  }

  handlePlayerDied(data: { gameSessionId: string; playerAddress: string }) {
    const gameSessionIndex = this.gameSessions.findIndex(g => g.id === data.gameSessionId);
    if (gameSessionIndex === -1) return;

    const gameSession = this.gameSessions[gameSessionIndex];
    const playerIndex = gameSession.players.findIndex(p => p.address === data.playerAddress);
    if (playerIndex === -1) return;

    const updatedPlayers = [...gameSession.players];
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      isAlive: false
    };

    this.gameSessions[gameSessionIndex] = {
      ...gameSession,
      players: updatedPlayers
    };
    
    console.log(`GameModel: Player ${data.playerAddress} died manually`);
    
    // 检查游戏是否结束 - 只有当存活玩家数量 <= 1 时才结束游戏
    const alivePlayers = updatedPlayers.filter(p => p.isAlive);
    console.log(`GameModel: After manual death, alive players: ${alivePlayers.length}/${updatedPlayers.length}`);
    
    if (alivePlayers.length <= 1) {
      console.log(`GameModel: Game ending after manual death - only ${alivePlayers.length} players alive`);
      this.endGameSession(data.gameSessionId);
    }

    this.publish("game", "refresh");
  }

  endGame(data: { gameSessionId: string }) {
    this.endGameSession(data.gameSessionId);
  }

  private endGameSession(gameSessionId: string) {
    const gameSessionIndex = this.gameSessions.findIndex(g => g.id === gameSessionId);
    if (gameSessionIndex === -1) return;

    const gameSession = this.gameSessions[gameSessionIndex];
    
    this.gameSessions[gameSessionIndex] = {
      ...gameSession,
      status: 'finished',
      finishedAt: new Date().toISOString()
    };

    // 重置房间状态为waiting，允许新玩家加入
    const room = this.rooms.find(r => r.id === gameSession.roomId);
    if (room) {
      const roomIndex = this.rooms.findIndex(r => r.id === gameSession.roomId);
      this.rooms[roomIndex] = {
        ...room,
        status: 'waiting',
        players: room.players.map(player => ({ ...player, isReady: false }))
      };
    }

    this.roomGameMap.delete(gameSession.roomId);
    
    // 清理食物
    this.foods = [];
    
    console.log(`GameModel: Game session ${gameSessionId} ended`);
    this.publish("game", "refresh");
    this.publish("lobby", "refresh");
  }

  // ============ 食物管理 ============
  generateInitialFood(count: number) {
    this.foods = [];
    for (let i = 0; i < count; i++) {
      this.generateFood();
    }
  }

  generateFood() {
    const foodId = `food_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const type = Math.random() < 0.8 ? 'normal' : 'bonus';
    
    const newFood: Food = {
      id: foodId,
      position: {
        x: Math.floor(Math.random() * 60),
        y: Math.floor(Math.random() * 60)
      },
      type,
      value: type === 'normal' ? 10 : 50
    };
    
    this.foods.push(newFood);
  }

  // ============ 工具方法 ============
  private getPlayerColor(index: number): string {
    const colors = ['#00ff00', '#ff0000', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080'];
    return colors[index % colors.length];
  }

  private getInitialPosition(index: number, playerCount: number): { x: number; y: number } {
    // 根据玩家数量和索引计算初始位置，确保玩家不会重叠
    const centerX = 30;
    const centerY = 30;
    const radius = 15;
    
    if (playerCount === 1) {
      return { x: centerX, y: centerY };
    }
    
    const angle = (2 * Math.PI * index) / playerCount;
    return {
      x: Math.floor(centerX + radius * Math.cos(angle)),
      y: Math.floor(centerY + radius * Math.sin(angle))
    };
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
