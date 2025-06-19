import * as Multisynq from '@multisynq/client';
import { getGameConfig, type GameConfig } from '../utils/gameConfig';

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
  speedMultiplier?: number;
  lastSpeedIncrease?: number;
  speedBoostCountdown?: number;
  segmentCountdown?: number;
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
  isSpectator?: boolean;
}

export interface Food {
  id: string;
  position: { x: number; y: number };
  type: 'normal' | 'bonus';
  value: number;
}

export interface Segment {
  id: string;
  position: { x: number; y: number };
  type: 1 | 2 | 3;
  value: number;
  color: string;
  spawnTime: number;
}

export class GameModel extends Multisynq.Model {
  rooms: Room[] = [];
  private playerRoomMap: Map<string, string> = new Map();
  gameSessions: GameSession[] = [];
  private roomGameMap: Map<string, string> = new Map();
  foods: Food[] = [];
  segments: Segment[] = [];
  private instanceId: string;
  connectedPlayers: Set<string> = new Set();
  private gameConfig: GameConfig | null = null;

  init() {
    this.instanceId = `game_${Date.now()}_${this.random().toString().substr(2, 6)}`;
    console.log(`GameModel instance created and initialized: ${this.instanceId}`);
    
    this.loadGameConfig();
    
    this.subscribe(this.sessionId, "view-join", this.onViewJoin);
    this.subscribe(this.sessionId, "view-exit", this.onViewExit);
    
    console.log(`GameModel ${this.instanceId}: Subscribing to lobby events`);
    this.subscribe("lobby", "create-room", this.createRoom);
    this.subscribe("lobby", "join-room", this.joinRoom);
    this.subscribe("lobby", "leave-room", this.leaveRoom);
    this.subscribe("lobby", "set-player-ready", this.setPlayerReady);
    
    console.log(`GameModel ${this.instanceId}: Subscribing to game events`);
    this.subscribe("game", "start-game", this.startGame);
    this.subscribe("game", "player-move", this.handlePlayerMove);
    this.subscribe("game", "player-died", this.handlePlayerDied);
    this.subscribe("game", "end-game", this.endGame);
    this.subscribe("game", "player-direction-change", this.handlePlayerDirectionChange);
    this.subscribe("game", "enter-spectator-mode", this.handleEnterSpectatorMode);
    
    console.log(`GameModel ${this.instanceId}: All event subscriptions complete`);
  }

  private async loadGameConfig() {
    try {
      console.log('GameModel: Loading game configuration...');
      
      this.gameConfig = {
        test_mode: true,
        default_players: 2
      };
      
      console.log('GameModel: Game config initialized with defaults:', this.gameConfig);
    } catch (error) {
      console.error('GameModel: Error loading game config, using defaults:', error);
      this.gameConfig = {
        test_mode: true,
        default_players: 2
      };
    }
  }

  private getMinimumPlayers(): number {
    return this.gameConfig?.default_players ?? 2;
  }

  private isTestMode(): boolean {
    return this.gameConfig?.test_mode ?? true;
  }

  onViewJoin(viewInfo: any) {
    console.log(`GameModel: Player joined session (${this.instanceId}):`, viewInfo);
    this.connectedPlayers.add(viewInfo.viewId);
    this.publish("system", "refresh");
  }

  onViewExit(viewInfo: any) {
    console.log(`GameModel: Player left session (${this.instanceId}):`, viewInfo);
    const playerAddress = viewInfo.viewId;
    this.connectedPlayers.delete(playerAddress);
    
    const roomId = this.playerRoomMap.get(playerAddress);
    if (roomId) {
      console.log(`GameModel: Player ${playerAddress} was in room ${roomId}, removing from room`);
      this.removePlayerFromRoom(roomId, playerAddress);
      this.playerRoomMap.delete(playerAddress);
    }
    
    const userRooms = this.rooms.filter(room => room.hostAddress === playerAddress);
    if (userRooms.length > 0) {
      this.rooms = this.rooms.filter(room => room.hostAddress !== playerAddress);
      console.log(`GameModel: Deleted ${userRooms.length} room(s) created by user ${playerAddress}`);
      
      userRooms.forEach(room => {
        room.players.forEach(player => {
          this.playerRoomMap.delete(player.address);
        });
      });
    }
    
    this.publish("lobby", "refresh");
    this.publish("system", "refresh");
  }

  createRoom(data: { roomName: string; hostName: string; hostAddress: string }) {
    const existingRoom = this.rooms.find(room => room.hostAddress === data.hostAddress);
    if (existingRoom) {
      this.publish("lobby", "room-creation-failed", { 
        error: "You can only create one room at a time. Please leave your current room first." 
      });
      return;
    }

    const roomId = `room_${Date.now()}_${this.random().toString().substr(2, 9)}`;
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

    const currentRoomId = this.playerRoomMap.get(data.playerAddress);
    if (currentRoomId && currentRoomId !== data.roomId) {
      this.removePlayerFromRoom(currentRoomId, data.playerAddress);
    }

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
      room.players.forEach(player => {
        this.playerRoomMap.delete(player.address);
      });
      
      this.rooms.splice(roomIndex, 1);
      console.log(`GameModel: Room ${roomId} deleted because host ${playerAddress} left`);
    } else {
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
    
    // if (oldReadyState === data.isReady) {
    //   console.log(`GameModel: Player ${data.playerAddress} ready state unchanged (${oldReadyState}), skipping update`);
    //   return;
    // }
    
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
    
    const allReady = this.rooms[roomIndex].players.every(p => p.isReady);
    const playerCount = this.rooms[roomIndex].players.length;
    const minPlayers = this.getMinimumPlayers();
    
    if (allReady && playerCount >= minPlayers) {
      console.log(`GameModel: All players ready and player count >= ${minPlayers}, changing room status to playing`);
      this.rooms[roomIndex] = {
        ...this.rooms[roomIndex],
        status: 'playing'
      };
      
      this.startGame({ roomId: data.roomId });
    }
    
    this.publish("lobby", "refresh");
  }

  startGame(data: { roomId: string }) {
    console.log('GameModel: startGame called:', data);
    const room = this.rooms.find(r => r.id === data.roomId);
    if (!room) {
      console.log('GameModel: Room not found for game start:', data.roomId);
      return;
    }

    const allReady = room.players.every(p => p.isReady);
    const playerCount = room.players.length;
    const minPlayers = this.getMinimumPlayers();
    
    if (!allReady || playerCount < minPlayers) {
      console.log(`GameModel: Not all players are ready or player count < ${minPlayers}`);
      return;
    }

    const gameSessionId = `game_${Date.now()}_${this.random().toString().substr(2, 9)}`;
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
        ],
        isSpectator: false
      })),
      status: 'countdown',
      countdown: 3,
      startedAt: new Date().toISOString(),
      speedMultiplier: 1.0,
      lastSpeedIncrease: this.now()
    };

    this.gameSessions.push(gameSession);
    this.roomGameMap.set(data.roomId, gameSessionId);

    const roomIndex = this.rooms.findIndex(r => r.id === data.roomId);
    this.rooms[roomIndex].status = 'playing';

    this.generateInitialFood(8);
    this.generateInitialSegments(3);

    console.log(`GameModel: Game session ${gameSessionId} created with countdown`);
    this.publish("game", "refresh");
    this.publish("lobby", "refresh");

    this.startCountdown(gameSessionId);
  }

  startCountdown(gameSessionId: string) {
    console.log('GameModel: Starting countdown for game session:', gameSessionId);
    
    const gameSession = this.gameSessions.find(g => g.id === gameSessionId);
    if (!gameSession || gameSession.status !== 'countdown') {
      return;
    }

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
      this.gameSessions[gameSessionIndex] = {
        ...gameSession,
        status: 'playing',
        countdown: 0,
        lastSpeedIncrease: this.now(),
        speedBoostCountdown: 20,
        segmentCountdown: 10
      };
      
      console.log('GameModel: Countdown finished, starting game');
      this.publish("game", "refresh");
      
      this.future(150).gameStep(gameSessionId);
      this.future(3000).segmentSpawnLoop(gameSessionId);
      this.future(20000).speedBoostLoop(gameSessionId);
      this.future(1000).speedBoostCountdownTick(gameSessionId);
      this.future(1000).segmentCountdownTick(gameSessionId);
    } else {
      this.gameSessions[gameSessionIndex] = {
        ...gameSession,
        countdown: newCountdown
      };
      
      console.log(`GameModel: Countdown: ${newCountdown}`);
      this.publish("game", "refresh");
      
      this.future(1000).countdownTick(gameSessionId);
    }
  }

  speedBoostCountdownTick(gameSessionId: string) {
    const gameSessionIndex = this.gameSessions.findIndex(g => g.id === gameSessionId);
    if (gameSessionIndex === -1) return;

    const gameSession = this.gameSessions[gameSessionIndex];
    if (gameSession.status !== 'playing') return;

    const currentCountdown = gameSession.speedBoostCountdown || 20;
    const newCountdown = currentCountdown > 0 ? currentCountdown - 1 : 20;

    this.gameSessions[gameSessionIndex] = {
      ...gameSession,
      speedBoostCountdown: newCountdown
    };

    this.publish("game", "refresh");
    
    this.future(1000).speedBoostCountdownTick(gameSessionId);
  }

  segmentCountdownTick(gameSessionId: string) {
    const gameSessionIndex = this.gameSessions.findIndex(g => g.id === gameSessionId);
    if (gameSessionIndex === -1) return;

    const gameSession = this.gameSessions[gameSessionIndex];
    if (gameSession.status !== 'playing') return;

    const currentCountdown = gameSession.segmentCountdown || 10;
    const newCountdown = currentCountdown > 0 ? currentCountdown - 1 : 10;

    this.gameSessions[gameSessionIndex] = {
      ...gameSession,
      segmentCountdown: newCountdown
    };

    this.publish("game", "refresh");
    
    this.future(1000).segmentCountdownTick(gameSessionId);
  }

  speedBoostLoop(gameSessionId: string) {
    const gameSessionIndex = this.gameSessions.findIndex(g => g.id === gameSessionId);
    if (gameSessionIndex === -1) return;

    const gameSession = this.gameSessions[gameSessionIndex];
    if (gameSession.status !== 'playing') return;

    const newSpeedMultiplier = (gameSession.speedMultiplier || 1.0) * 1.2;
    
    this.gameSessions[gameSessionIndex] = {
      ...gameSession,
      speedMultiplier: newSpeedMultiplier,
      lastSpeedIncrease: this.now(),
      speedBoostCountdown: 20
    };

    console.log(`GameModel: Speed increased to ${newSpeedMultiplier.toFixed(2)}x for game ${gameSessionId}`);
    this.publish("game", "refresh");

    this.future(20000).speedBoostLoop(gameSessionId);
  }

  gameStep(gameSessionId: string) {
    const gameSessionIndex = this.gameSessions.findIndex(g => g.id === gameSessionId);
    if (gameSessionIndex === -1) return;

    const gameSession = this.gameSessions[gameSessionIndex];
    if (gameSession.status !== 'playing') return;

    const updatedPlayers = gameSession.players.map(player => {
      if (!player.isAlive) return player;

      const head = { ...player.position };
      
      switch (player.direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
      }

      if (head.x < 0 || head.x >= 60 || head.y < 0 || head.y >= 60) {
        console.log(`GameModel: Player ${player.name} hit wall at (${head.x}, ${head.y})`);
        if (this.isTestMode()) {
          return { ...player, isAlive: false, isSpectator: true };
        } else {
          return { ...player, isAlive: false };
        }
      }

      if (player.segments.some(segment => segment.x === head.x && segment.y === head.y)) {
        console.log(`GameModel: Player ${player.name} hit themselves`);
        if (this.isTestMode()) {
          return { ...player, isAlive: false, isSpectator: true };
        } else {
          return { ...player, isAlive: false };
        }
      }

      const otherPlayers = gameSession.players.filter(p => p.id !== player.id && p.isAlive);
      if (otherPlayers.some(p => p.segments.some(segment => segment.x === head.x && segment.y === head.y))) {
        console.log(`GameModel: Player ${player.name} hit another player`);
        if (this.isTestMode()) {
          return { ...player, isAlive: false, isSpectator: true };
        } else {
          return { ...player, isAlive: false };
        }
      }

      const eatenFood = this.foods.find(food => food.position.x === head.x && food.position.y === head.y);
      const eatenSegment = this.segments.find(segment => segment.position.x === head.x && segment.position.y === head.y);
      
      let newSegments = [head, ...player.segments];
      let newScore = player.score;

      if (eatenFood) {
        newScore += eatenFood.value;
        console.log(`GameModel: Player ${player.name} ate food, score: ${newScore}`);
        this.foods = this.foods.filter(food => food.id !== eatenFood.id);
        this.generateFood();
      } else if (eatenSegment) {
        const lengthIncrease = eatenSegment.type;
        newScore += eatenSegment.value;
        
        const tailPosition = player.segments[player.segments.length - 1];
        
        for (let i = 1; i < lengthIncrease; i++) {
          newSegments.push({ ...tailPosition });
        }
        
        console.log(`GameModel: Player ${player.name} ate type ${eatenSegment.type} segment, added ${lengthIncrease} length, new total length: ${newSegments.length}, score: ${newScore}`);
        this.segments = this.segments.filter(segment => segment.id !== eatenSegment.id);
      } else {
        newSegments.pop();
      }

      return {
        ...player,
        position: head,
        segments: newSegments,
        score: newScore
      };
    });

    this.gameSessions[gameSessionIndex] = {
      ...gameSession,
      players: updatedPlayers
    };

    const alivePlayers = updatedPlayers.filter(p => p.isAlive);
    const totalPlayers = updatedPlayers.length;
    console.log(`GameModel: Game step completed, alive players: ${alivePlayers.length}/${totalPlayers}`);
    
    const testMode = this.isTestMode();
    let shouldEndGame = false;

    if (testMode) {
      shouldEndGame = alivePlayers.length === 0;
      if (shouldEndGame) {
        console.log(`GameModel: Game ending in test mode - no players alive (${alivePlayers.length})`);
      }
    } else {
      shouldEndGame = alivePlayers.length <= 1;
      if (shouldEndGame) {
        console.log(`GameModel: Game ending in normal mode - only ${alivePlayers.length} players alive`);
      }
    }

    if (shouldEndGame) {
      this.endGameSession(gameSessionId);
      return;
    }

    this.publish("game", "refresh");
    
    const baseInterval = 150;
    const speedMultiplier = gameSession.speedMultiplier || 1.0;
    const adjustedInterval = Math.max(50, Math.floor(baseInterval / speedMultiplier));
    
    this.future(adjustedInterval).gameStep(gameSessionId);
  }

  segmentSpawnLoop(gameSessionId: string) {
    const gameSessionIndex = this.gameSessions.findIndex(g => g.id === gameSessionId);
    if (gameSessionIndex === -1) return;

    const gameSession = this.gameSessions[gameSessionIndex];
    if (gameSession.status !== 'playing') return;

    if ((gameSession.segmentCountdown || 10) <= 1) {
      const spawnCount = this.getRandomSegmentSpawnCount();
      for (let i = 0; i < spawnCount; i++) {
        if (this.segments.length < 8) {
          this.generateSegment();
        }
      }
      
      this.gameSessions[gameSessionIndex] = {
        ...gameSession,
        segmentCountdown: 10
      };
    }

    const currentTime = this.now();
    this.segments = this.segments.filter(segment => 
      currentTime - segment.spawnTime < 20000
    );

    this.publish("game", "refresh");
    
    this.future(1000).segmentSpawnLoop(gameSessionId);
  }

  // 获取随机生成segment数量（1-3个，概率递减）
  private getRandomSegmentSpawnCount(): number {
    const rand = this.random();
    if (rand < 0.5) return 1;      // 50% 概率生成1个
    if (rand < 0.8) return 2;      // 30% 概率生成2个  
    return 3;                      // 20% 概率生成3个
  }

  handlePlayerDirectionChange(data: { gameSessionId: string; playerAddress: string; direction: 'up' | 'down' | 'left' | 'right' }) {
    const gameSessionIndex = this.gameSessions.findIndex(g => g.id === data.gameSessionId);
    if (gameSessionIndex === -1) return;

    const gameSession = this.gameSessions[gameSessionIndex];
    if (gameSession.status !== 'playing') return;

    const playerIndex = gameSession.players.findIndex(p => p.address === data.playerAddress);
    if (playerIndex === -1) return;

    const player = gameSession.players[playerIndex];
    
    if (!player.isAlive || player.isSpectator) return;
    
    const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
    if (opposites[data.direction] === player.direction) {
      return;
    }

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
    const testMode = this.isTestMode();
    
    if (testMode) {
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        isAlive: false,
        isSpectator: true
      };
      console.log(`GameModel: Player ${data.playerAddress} entered spectator mode`);
    } else {
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        isAlive: false
      };
      console.log(`GameModel: Player ${data.playerAddress} died`);
    }

    this.gameSessions[gameSessionIndex] = {
      ...gameSession,
      players: updatedPlayers
    };
    
    const alivePlayers = updatedPlayers.filter(p => p.isAlive);
    const totalPlayers = updatedPlayers.length;
    console.log(`GameModel: After manual death, alive players: ${alivePlayers.length}/${totalPlayers}`);
    
    let shouldEndGame = false;

    if (testMode) {
      shouldEndGame = alivePlayers.length === 0;
      if (shouldEndGame) {
        console.log(`GameModel: Game ending after manual death in test mode - no players alive (${alivePlayers.length})`);
      }
    } else {
      shouldEndGame = alivePlayers.length <= 1;
      if (shouldEndGame) {
        console.log(`GameModel: Game ending after manual death in normal mode - only ${alivePlayers.length} players alive`);
      }
    }

    if (shouldEndGame) {
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

    const room = this.rooms.find(r => r.id === gameSession.roomId);
    if (room) {
      const roomIndex = this.rooms.findIndex(r => r.id === gameSession.roomId);
      // 创建新的房间对象，确保所有玩家状态重置
      this.rooms[roomIndex] = {
        ...room,
        status: 'waiting',
        players: room.players.map(player => ({ 
          ...player, 
          isReady: false 
        }))
      };
      
      console.log(`GameModel: Room ${gameSession.roomId} status reset to waiting, all players set to not ready:`, {
        roomId: gameSession.roomId,
        playersCount: this.rooms[roomIndex].players.length,
        playersReadyStates: this.rooms[roomIndex].players.map(p => ({ name: p.name, isReady: p.isReady }))
      });
    }

    // 保留roomGameMap映射关系，这样客户端仍能找到已完成的游戏会话来显示最终结果
    // roomGameMap会在cleanupFinishedGameSession中清理
    
    console.log(`GameModel: Game session ${gameSessionId} ended, keeping food and segments for room reuse`);
    
    this.future(300000).cleanupFinishedGameSession(gameSessionId);
    
    // 先发布游戏状态更新，再发布大厅状态更新
    console.log(`GameModel: Publishing refresh events for game end - game first, then lobby`);
    this.publish("game", "refresh");
    this.publish("lobby", "refresh");
  }

  cleanupFinishedGameSession(gameSessionId: string) {
    const gameSessionIndex = this.gameSessions.findIndex(g => g.id === gameSessionId);
    if (gameSessionIndex !== -1) {
      const gameSession = this.gameSessions[gameSessionIndex];
      if (gameSession.status === 'finished') {
        // 清理roomGameMap映射关系
        this.roomGameMap.delete(gameSession.roomId);
        // 清理游戏会话
        this.gameSessions.splice(gameSessionIndex, 1);
        console.log(`GameModel: Cleaned up finished game session ${gameSessionId} after 5 minutes`);
      }
    }
  }

  handleEnterSpectatorMode(data: { gameSessionId: string; playerAddress: string }) {
    const gameSessionIndex = this.gameSessions.findIndex(g => g.id === data.gameSessionId);
    if (gameSessionIndex === -1) return;

    const gameSession = this.gameSessions[gameSessionIndex];
    if (gameSession.status !== 'playing') return;

    const playerIndex = gameSession.players.findIndex(p => p.address === data.playerAddress);
    if (playerIndex === -1) return;

    const player = gameSession.players[playerIndex];
    
    if (!player.isAlive && this.isTestMode()) {
      const updatedPlayers = [...gameSession.players];
      updatedPlayers[playerIndex] = {
        ...player,
        isSpectator: true
      };

      this.gameSessions[gameSessionIndex] = {
        ...gameSession,
        players: updatedPlayers
      };

      console.log(`GameModel: Player ${data.playerAddress} entered spectator mode`);
      this.publish("game", "refresh");
    }
  }

  generateInitialFood(count: number) {
    this.foods = [];
    for (let i = 0; i < count; i++) {
      this.generateFood();
    }
  }

  generateFood() {
    const foodId = `food_${this.now()}_${this.random().toString().substr(2, 6)}`;
    const type = this.random() < 0.8 ? 'normal' : 'bonus';
    
    const newFood: Food = {
      id: foodId,
      position: {
        x: Math.floor(this.random() * 60),
        y: Math.floor(this.random() * 60)
      },
      type,
      value: type === 'normal' ? 10 : 50
    };
    
    this.foods.push(newFood);
  }

  generateInitialSegments(count: number) {
    this.segments = [];
    for (let i = 0; i < count; i++) {
      this.generateSegment();
    }
  }

  generateSegment() {
    const segmentId = `segment_${this.now()}_${this.random().toString().substr(2, 6)}`;
    
    const rand = this.random();
    let type: 1 | 2 | 3;
    let value: number;
    let color: string;
    
    if (rand < 0.5) {
      type = 1;
      value = 20;
      color = '#00ffff'; // 青色
    } else if (rand < 0.8) {
      type = 2;
      value = 50;
      color = '#ffff00'; // 黄色
    } else {
      type = 3;
      value = 100;
      color = '#ff00ff'; // 紫色
    }
    
    const newSegment: Segment = {
      id: segmentId,
      position: {
        x: Math.floor(this.random() * 60),
        y: Math.floor(this.random() * 60)
      },
      type,
      value,
      color,
      spawnTime: this.now()
    };
    
    this.segments.push(newSegment);
    console.log(`GameModel: Generated type ${type} segment (+${type} length) at (${newSegment.position.x}, ${newSegment.position.y})`);
  }

  private getPlayerColor(index: number): string {
    const colors = ['#00ff00', '#ff0000', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080'];
    return colors[index % colors.length];
  }

  private getInitialPosition(index: number, playerCount: number): { x: number; y: number } {
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

GameModel.register("GameModel");

export default GameModel;
