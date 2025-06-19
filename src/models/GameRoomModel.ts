import * as Multisynq from '@multisynq/client';
import { SnakeModel } from './SnakeModel';
import { PlayerModel } from './PlayerModel';

interface Food {
  x: number;
  y: number;
  type: 'normal' | 'bonus';
  value: number;
}

interface GameConfig {
  BOARD_SIZE: number;
  GAME_TICK_RATE: number;
  COUNTDOWN_DURATION: number;
}

export class GameRoomModel extends Multisynq.Model {
  roomId!: string;
  name!: string;
  hostAddress!: string;
  players!: Map<string, PlayerModel>;
  snakes!: Map<string, SnakeModel>;
  foods!: Food[];
  isRunning!: boolean;
  status!: 'waiting' | 'countdown' | 'playing' | 'finished';
  countdown!: number;
  winner!: string | null;
  speedMultiplier!: number;
  gameStartTime!: number;
  createdAt!: string;
  
  // Game configuration
  private readonly CONFIG: GameConfig = {
    BOARD_SIZE: 60,
    GAME_TICK_RATE: 5500,
    COUNTDOWN_DURATION: 3
  };

  init(payload: { id: string; name: string; hostAddress: string }) {
    console.log('GameRoomModel: Initializing room:', payload);
    
    this.roomId = payload.id;
    this.name = payload.name;
    this.hostAddress = payload.hostAddress;
    this.players = new Map();
    this.snakes = new Map();
    this.foods = [];
    this.isRunning = false;
    this.status = 'waiting';
    this.countdown = 0;
    this.winner = null;
    this.speedMultiplier = 1.0;
    this.gameStartTime = 0;
    this.createdAt = new Date(this.now()).toISOString(); // 在初始化时设置创建时间

    // Subscribe to room events
    this.subscribe("room", "change-direction", this.handleChangeDirection);
    this.subscribe("room", "start-game", this.handleStartGame);
    this.subscribe("room", "enter-spectator", this.handleEnterSpectator);

    console.log('GameRoomModel: Room initialized with config:', this.CONFIG);
  }

  addPlayer(player: PlayerModel) {
    console.log('GameRoomModel: Adding player to room:', {
      playerId: player.viewId,
      playerName: player.name,
      playerAddress: player.address,
      roomId: this.roomId,
      roomStatus: this.status
    });
    
    // 只有在等待状态才能加入房间成为真正的玩家
    if (this.status !== 'waiting') {
      console.log('GameRoomModel: Cannot add player - game not in waiting state:', this.status);
      return false;
    }
    
    this.players.set(player.viewId, player);
    player.currentRoomId = this.roomId;
    player.isReady = false;
    
    // 为玩家创建蛇
    this.createSnakeForPlayer(player);
    console.log('GameRoomModel: Player joined as participant');
    
    this.publishRoomState();
    console.log('GameRoomModel: Player added successfully, total players:', this.players.size);
    
    return true;
  }

  removePlayer(viewId: string) {
    console.log('GameRoomModel: Removing player from room:', viewId);
    
    const player = this.players.get(viewId);
    if (player) {
      player.currentRoomId = null;
      this.players.delete(viewId);
      
      // Remove snake
      const snake = this.snakes.get(viewId);
      if (snake) {
        snake.destroy();
        this.snakes.delete(viewId);
      }
    }
    
    this.publishRoomState();
  }

  // Transfer host to a new player
  transferHost(newHostAddress: string) {
    console.log('GameRoomModel: Transferring host to:', newHostAddress);
    
    const newHostPlayer = Array.from(this.players.values()).find(p => p.address === newHostAddress);
    if (newHostPlayer) {
      this.hostAddress = newHostAddress;
      console.log('GameRoomModel: Host transferred successfully to:', newHostAddress);
      this.publishRoomState();
    } else {
      console.error('GameRoomModel: Cannot transfer host - new host player not found:', newHostAddress);
    }
  }

  setPlayerReady(playerAddress: string, isReady: boolean) {
    console.log('GameRoomModel: Setting player ready:', { playerAddress, isReady, roomId: this.roomId });
    
    const player = Array.from(this.players.values()).find(p => p.address === playerAddress);
    if (player) {
      console.log('GameRoomModel: Found player, updating ready state:', {
        playerId: player.viewId,
        playerName: player.name,
        oldReady: player.isReady,
        newReady: isReady
      });
      
      player.isReady = isReady;
      this.publishRoomState();
      
      // Check if all players are ready and start countdown
      this.checkStartGame();
    } else {
      console.error('GameRoomModel: Player not found for ready state update:', {
        playerAddress,
        availablePlayers: Array.from(this.players.values()).map(p => ({
          viewId: p.viewId,
          address: p.address,
          name: p.name
        }))
      });
    }
  }

  createSnakeForPlayer(player: PlayerModel) {
    const colors = ['#ff0080', '#00ff80', '#8000ff', '#ff8000', '#0080ff', '#80ff00'];
    const colorIndex = this.snakes.size % colors.length;
    
    // Generate safe starting position
    const startX = Math.floor(this.CONFIG.BOARD_SIZE * 0.2 + this.random() * this.CONFIG.BOARD_SIZE * 0.6);
    const startY = Math.floor(this.CONFIG.BOARD_SIZE * 0.2 + this.random() * this.CONFIG.BOARD_SIZE * 0.6);
    
    const snake = SnakeModel.create({
      viewId: player.viewId,
      name: player.name,
      startPosition: { x: startX, y: startY },
      color: colors[colorIndex],
      boardSize: this.CONFIG.BOARD_SIZE
    });
    
    this.snakes.set(player.viewId, snake);
    console.log('GameRoomModel: Created snake for player:', player.viewId, 'at', startX, startY);
  }

  checkStartGame() {
    if (this.status !== 'waiting') return;
    
    const allReady = Array.from(this.players.values()).every(p => p.isReady);
    const hasPlayers = this.players.size >= 1; // Allow single player for testing
    
    if (allReady && hasPlayers) {
      console.log('GameRoomModel: All players ready, starting countdown');
      this.startCountdown();
    }
  }

  startCountdown() {
    this.status = 'countdown';
    this.countdown = this.CONFIG.COUNTDOWN_DURATION;
    this.publishRoomState();
    
    this.countdownTick();
  }

  countdownTick() {
    if (this.status !== 'countdown') return;
    
    this.countdown--;
    this.publishRoomState();
    
    if (this.countdown <= 0) {
      this.startGame();
    } else {
      this.future(1000).countdownTick();
    }
  }

  handleStartGame() {
    console.log('GameRoomModel: Start game requested');
    this.checkStartGame();
  }

  startGame() {
    console.log('GameRoomModel: Starting game');
    
    this.status = 'playing';
    this.isRunning = true;
    this.gameStartTime = this.now();
    this.speedMultiplier = 1.0;
    
    // Reset all snakes
    for (const snake of this.snakes.values()) {
      snake.reset();
    }
    
    // Spawn initial foods
    this.spawnFood();
    this.spawnFood();
    this.spawnFood();
    
    this.publishRoomState();
    
    // Start game loop
    this.gameTick();
  }

  gameTick() {
    if (!this.isRunning || this.status !== 'playing') {
      return;
    }

    // Move all snakes
    for (const snake of this.snakes.values()) {
      if (snake.isAlive) {
        snake.move();
      }
    }

    // Check food consumption
    this.checkFoodConsumption();

    // Check collisions
    this.checkCollisions();

    // Check win condition
    this.checkWinCondition();

    this.publishRoomState();

    // Schedule next tick with current speed
    const tickRate = Math.floor(this.CONFIG.GAME_TICK_RATE / this.speedMultiplier);
    this.future(tickRate).gameTick();
  }

  checkFoodConsumption() {
    for (const snake of this.snakes.values()) {
      if (!snake.isAlive) continue;
      
      const head = snake.body[0];
      
      for (let i = this.foods.length - 1; i >= 0; i--) {
        const food = this.foods[i];
        if (head.x === food.x && head.y === food.y) {
          // Snake eats food
          snake.grow();
          snake.score += food.value;
          
          // Remove eaten food
          this.foods.splice(i, 1);
          
          // Spawn new food
          this.spawnFood();
          
          console.log('GameRoomModel: Snake ate food, new score:', snake.score);
          break;
        }
      }
    }
  }

  checkCollisions() {
    for (const snake of this.snakes.values()) {
      if (!snake.isAlive) continue;
      
      const head = snake.body[0];
      
      // Check wall collision
      if (head.x < 0 || head.x >= this.CONFIG.BOARD_SIZE || 
          head.y < 0 || head.y >= this.CONFIG.BOARD_SIZE) {
        snake.die();
        console.log('GameRoomModel: Snake died from wall collision:', snake.viewId);
        continue;
      }
      
      // Check self collision
      for (let i = 1; i < snake.body.length; i++) {
        const segment = snake.body[i];
        if (head.x === segment.x && head.y === segment.y) {
          snake.die();
          console.log('GameRoomModel: Snake died from self collision:', snake.viewId);
          break;
        }
      }
      
      // Check collision with other snakes
      for (const otherSnake of this.snakes.values()) {
        if (otherSnake.viewId === snake.viewId || !otherSnake.isAlive) continue;
        
        for (const segment of otherSnake.body) {
          if (head.x === segment.x && head.y === segment.y) {
            snake.die();
            console.log('GameRoomModel: Snake died from collision with other snake:', snake.viewId);
            break;
          }
        }
      }
    }
  }

  checkWinCondition() {
    const aliveSnakes = Array.from(this.snakes.values()).filter(s => s.isAlive);
    
    if (aliveSnakes.length <= 1) {
      this.endGame(aliveSnakes.length === 1 ? aliveSnakes[0].viewId : null);
    }
  }

  endGame(winnerId: string | null) {
    console.log('GameRoomModel: Game ended, winner:', winnerId);
    
    this.isRunning = false;
    this.status = 'finished';
    this.winner = winnerId;
    this.speedMultiplier = 1.0; // 重置速度倍数
    this.countdown = 0; // 重置倒计时
    
    // Reset player ready states immediately when game ends
    for (const player of this.players.values()) {
      player.isReady = false;
      console.log('GameRoomModel: Reset player ready state:', player.name, 'isReady:', player.isReady);
    }
    
    // Reset all snakes spectator status
    for (const snake of this.snakes.values()) {
      snake.isSpectator = false;
      console.log('GameRoomModel: Reset snake spectator status:', snake.viewId);
    }
    
    this.publishRoomState();
    
    console.log('GameRoomModel: Game ended, all player states reset. Auto-reset to waiting in 5 seconds.');
    
    // Auto-reset to waiting state after a delay
    this.future(5000).resetToWaiting();
  }

  resetToWaiting() {
    console.log('GameRoomModel: Resetting to waiting state');
    
    // 重置房间状态
    this.status = 'waiting';
    this.isRunning = false;
    this.winner = null;
    this.foods = [];
    this.speedMultiplier = 1.0;
    this.countdown = 0;
    this.gameStartTime = 0;
    
    // 重置所有玩家状态
    for (const player of this.players.values()) {
      player.isReady = false;
      console.log('GameRoomModel: Reset player ready state:', player.name, 'isReady:', player.isReady);
    }
    
    // Reset all snakes
    for (const snake of this.snakes.values()) {
      snake.reset();
    }
    
    console.log('GameRoomModel: Room fully reset to waiting state - all players unready, snakes reset');
    this.publishRoomState();
  }

  spawnFood() {
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
      const x = Math.floor(this.random() * this.CONFIG.BOARD_SIZE);
      const y = Math.floor(this.random() * this.CONFIG.BOARD_SIZE);
      
      // Check if position is occupied by any snake
      let occupied = false;
      for (const snake of this.snakes.values()) {
        for (const segment of snake.body) {
          if (segment.x === x && segment.y === y) {
            occupied = true;
            break;
          }
        }
        if (occupied) break;
      }
      
      if (!occupied) {
        const food: Food = {
          x,
          y,
          type: this.random() < 0.1 ? 'bonus' : 'normal',
          value: this.random() < 0.1 ? 3 : 1
        };
        this.foods.push(food);
        console.log('GameRoomModel: Spawned food at:', x, y);
        break;
      }
      
      attempts++;
    }
  }

  handleChangeDirection(payload: { sessionId: string; viewId: string; direction: string }) {
    if (this.status !== 'playing') return;
    
    const snake = this.snakes.get(payload.viewId);
    if (snake && snake.isAlive) {
      const directionMap: { [key: string]: { x: number; y: number } } = {
        'up': { x: 0, y: -1 },
        'down': { x: 0, y: 1 },
        'left': { x: -1, y: 0 },
        'right': { x: 1, y: 0 }
      };
      
      const newDirection = directionMap[payload.direction];
      if (newDirection) {
        snake.changeDirection(newDirection);
      }
    }
  }

  handleEnterSpectator(payload: { sessionId: string; viewId: string }) {
    console.log('GameRoomModel: Player entering spectator mode:', payload.viewId);
    
    const snake = this.snakes.get(payload.viewId);
    if (snake) {
      snake.isSpectator = true;
      snake.die();
    }
    
    this.publishRoomState();
  }

  getRoomState() {
    const playersArray = Array.from(this.players.values()).map(player => ({
      id: player.viewId,
      name: player.name,
      address: player.address,
      isReady: player.isReady
    }));

    console.log('GameRoomModel: Building room state:', {
      roomId: this.roomId,
      playersCount: playersArray.length,
      players: playersArray,
      hostAddress: this.hostAddress
    });

    return {
      id: this.roomId,
      name: this.name,
      hostAddress: this.hostAddress,
      status: this.status,
      players: playersArray,
      maxPlayers: 8,
      host: this.hostAddress,
      isPrivate: false,
      createdAt: this.createdAt
    };
  }

  getGameState() {
    const snakesArray = Array.from(this.snakes.values()).map(snake => ({
      id: snake.viewId,
      segments: snake.body,
      direction: snake.direction,
      color: snake.color,
      isAlive: snake.isAlive,
      score: snake.score,
      name: snake.name,
      isSpectator: snake.isSpectator || false
    }));

    return {
      id: this.roomId,
      status: this.status,
      countdown: this.countdown,
      players: snakesArray,
      speedMultiplier: this.speedMultiplier,
      speedBoostCountdown: 20,
      segmentCountdown: 10
    };
  }

  publishRoomState() {
    const roomState = this.getRoomState();
    const gameState = this.getGameState();
    
    console.log('GameRoomModel: Publishing room state:', {
      roomId: this.roomId,
      roomPlayersCount: roomState.players.length,
      gamePlayersCount: gameState.players.length,
      hostAddress: this.hostAddress
    });
    
    this.publish("room", "updated", {
      room: roomState,
      game: gameState,
      foods: this.foods,
      segments: []
    });
  }
}

GameRoomModel.register("GameRoomModel");
