import * as Multisynq from '@multisynq/client';
import { SnakeModel } from './SnakeModel';
import { PlayerModel } from './PlayerModel';
import { GAME_CONFIG } from '../utils/gameConstants';

interface Food {
  x: number;
  y: number;
  type: 'normal' | 'bonus';
  level: 1 | 2 | 3;  // 食物等级
  value: number;     // 根据等级计算的分数值
}

// 使用全局游戏配置
// GameConfig interface moved to gameConstants.ts

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
  tickCounter!: number;  // 用于计算每10个tick的存活分数
  speedBoostCountdown!: number;  // 速度提升倒计时
  foodCountdown!: number;        // 食物生成倒计时
  
  // 使用全局游戏配置
  private readonly CONFIG = GAME_CONFIG;

  init(payload: { id: string; name: string; hostAddress: string; createdAt: string }) {
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
    this.createdAt = payload.createdAt;
    this.tickCounter = 0;
    this.speedBoostCountdown = 20;
    this.foodCountdown = 10;

    // Subscribe to room events
    this.subscribe("room", "change-direction", this.handleChangeDirection);
    this.subscribe("room", "start-game", this.handleStartGame);
    this.subscribe("room", "force-start-game", this.handleForceStartGame);
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
    
    // 为玩家创建蛇（使用临时位置，真正的位置在倒计时开始时分配）
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
    
    // 创建蛇，使用中心位置作为临时位置
    const tempPosition = { x: Math.floor(this.CONFIG.BOARD.SIZE / 2), y: Math.floor(this.CONFIG.BOARD.SIZE / 2) };
    const snake = SnakeModel.create({
      viewId: player.viewId,
      name: player.name,
      startPosition: tempPosition,
      color: colors[colorIndex],
      boardSize: this.CONFIG.BOARD.SIZE,
      hasNFT: player.hasNFT
    });
    
    this.snakes.set(player.viewId, snake);
    console.log('GameRoomModel: Created snake for player:', player.viewId, 'color:', colors[colorIndex], 'NFT:', player.hasNFT, 'temp position:', tempPosition);
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
    console.log('GameRoomModel: Starting countdown - calculating positions with this.random()');
    
    this.status = 'countdown';
    this.countdown = this.CONFIG.TIMING.COUNTDOWN_DURATION;
    
    // 使用this.random()立即计算所有玩家位置
    const calculatedPositions = this.calculateStartPositions();
    
    // 发布位置同步事件给所有蛇模型
    this.publish("room", "sync-positions", {
      roomId: this.roomId,
      positions: calculatedPositions
    });
    
    console.log('GameRoomModel: Positions calculated and sync event published:', calculatedPositions);
    
    // 立即推送状态确保前端能看到倒计时
    this.publishRoomState();
    
    console.log('GameRoomModel: Countdown started, scheduling first tick');
    this.countdownTick();
  }

  // 使用this.random()计算起始位置的新方法
  calculateStartPositions() {
    const snakesArray = Array.from(this.snakes.values());
    const playerCount = snakesArray.length;
    
    if (playerCount === 0) return {};
    
    console.log('GameRoomModel: Calculating start positions for', playerCount, 'players using this.random()');
    
    // 使用this.random()生成确定性的位置分配
    const positions: { [viewId: string]: { x: number, y: number } } = {};
    const basePositions: Array<{x: number, y: number}> = [];
    
    if (playerCount === 1) {
      // 单人游戏：中心位置
      basePositions.push({
        x: Math.floor(this.CONFIG.BOARD.SIZE / 2),
        y: Math.floor(this.CONFIG.BOARD.SIZE / 2)
      });
    } else if (playerCount === 2) {
      // 双人游戏：对角线位置
      const offset = Math.floor(this.CONFIG.BOARD.SIZE * 0.2);
      basePositions.push(
        { x: offset, y: offset },
        { x: this.CONFIG.BOARD.SIZE - offset - 1, y: this.CONFIG.BOARD.SIZE - offset - 1 }
      );
    } else if (playerCount <= 4) {
      // 最多4人：四个角落
      const offset = Math.floor(this.CONFIG.BOARD.SIZE * 0.15);
      basePositions.push(
        { x: offset, y: offset },
        { x: this.CONFIG.BOARD.SIZE - offset - 1, y: offset },
        { x: offset, y: this.CONFIG.BOARD.SIZE - offset - 1 },
        { x: this.CONFIG.BOARD.SIZE - offset - 1, y: this.CONFIG.BOARD.SIZE - offset - 1 }
      );
    } else {
      // 更多玩家：圆形分布
      const centerX = this.CONFIG.BOARD.SIZE / 2;
      const centerY = this.CONFIG.BOARD.SIZE / 2;
      const radius = Math.min(centerX, centerY) * 0.6;
      
      for (let i = 0; i < playerCount; i++) {
        const angle = (2 * Math.PI * i) / playerCount;
        const x = Math.floor(centerX + radius * Math.cos(angle));
        const y = Math.floor(centerY + radius * Math.sin(angle));
        basePositions.push({ x, y });
      }
    }
    
    // 使用this.random()确定性地打乱位置
    const shuffledPositions = [...basePositions];
    for (let i = shuffledPositions.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [shuffledPositions[i], shuffledPositions[j]] = [shuffledPositions[j], shuffledPositions[i]];
    }
    
    // 分配位置给每个玩家
    snakesArray.forEach((snake, index) => {
      if (index < shuffledPositions.length) {
        const position = shuffledPositions[index];
        
        // 边界检查和修正
        const safeX = Math.max(2, Math.min(position.x, this.CONFIG.BOARD.SIZE - 3));
        const safeY = Math.max(2, Math.min(position.y, this.CONFIG.BOARD.SIZE - 5)); 
        const safePosition = { x: safeX, y: safeY };
        
        positions[snake.viewId] = safePosition;
        
        console.log('GameRoomModel: Calculated position for player:', {
          viewId: snake.viewId,
          name: snake.name,
          position: safePosition
        });
      }
    });
    
    return positions;
  }

  countdownTick() {
    if (this.status !== 'countdown') {
      console.log('GameRoomModel: countdownTick called but status is not countdown:', this.status);
      return;
    }
    
    console.log('GameRoomModel: Countdown tick - current value:', this.countdown);
    this.countdown--;
    
    // 推送状态更新倒计时，但不改变蛇的位置
    this.publishRoomState();
    
    if (this.countdown <= 0) {
      console.log('GameRoomModel: Countdown finished, starting game from synchronized positions');
      this.startGame();
    } else {
      console.log('GameRoomModel: Scheduling next countdown tick in 1000ms, remaining:', this.countdown);
      this.future(1000).countdownTick();
    }
  }

  handleStartGame() {
    console.log('GameRoomModel: Start game requested');
    this.checkStartGame();
  }

  handleForceStartGame(payload: { hostAddress: string }) {
    console.log('GameRoomModel: Force start game requested by:', payload.hostAddress);
    
    // 验证是否为房主
    if (payload.hostAddress !== this.hostAddress) {
      console.log('GameRoomModel: Force start denied - not host');
      return;
    }
    
    // 只有在等待状态才能强制开始
    if (this.status !== 'waiting') {
      console.log('GameRoomModel: Force start denied - not in waiting state:', this.status);
      return;
    }
    
    // 至少需要1个玩家
    if (this.players.size < 1) {
      console.log('GameRoomModel: Force start denied - no players');
      return;
    }
    
    console.log('GameRoomModel: Force starting game with', this.players.size, 'players');
    this.startCountdown();
  }

  startGame() {
    console.log('GameRoomModel: Starting game from countdown-synchronized positions');
    
    this.status = 'playing';
    this.isRunning = true;
    this.gameStartTime = this.now();
    this.speedMultiplier = 1.0;
    this.tickCounter = 0;  // Reset tick counter for new game
    this.speedBoostCountdown = 20;  // 初始化速度提升倒计时
    this.foodCountdown = 10;        // 初始化食物生成倒计时
    
    // 注意：位置已在startCountdown()中计算并通过事件同步，这里不需要重新分配
    console.log('GameRoomModel: Game started, snakes will begin moving from their synchronized positions');
    
    // Spawn initial foods
    this.spawnFood();
    this.spawnFood();
    this.spawnFood();
    
    // 安排定时事件 - 使用future()符合Multisynq规范
    this.future(20000).speedBoost(); // 20秒后第一次速度提升
    this.future(10000).spawnFood(); // 10秒后第一次生成food
    
    this.publishRoomState();
    
    // Start game loop
    this.gameTick();
  }

  gameTick() {
    if (!this.isRunning || this.status !== 'playing') {
      return;
    }

    // Increment tick counter
    this.tickCounter++;

    // Update countdown timers - 在realm环境中使用this.now()
    if (this.gameStartTime > 0) {
      const elapsed = Math.floor((this.now() - this.gameStartTime) / 1000);
      this.speedBoostCountdown = Math.max(0, 20 - (elapsed % 20));
      this.foodCountdown = Math.max(0, 10 - (elapsed % 10));
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

    // Every 10 ticks, add 1 point to all living snakes
    if (this.tickCounter % 10 === 0) {
      for (const snake of this.snakes.values()) {
        if (snake.isAlive && !snake.isSpectator) {
          snake.score += 1;
        }
      }
      console.log('GameRoomModel: Survival bonus applied to living snakes at tick', this.tickCounter);
    }

    // Check win condition
    this.checkWinCondition();

    this.publishRoomState();

    // Schedule next tick with current speed
    const tickRate = Math.floor(this.CONFIG.TIMING.GAME_TICK_RATE / this.speedMultiplier);
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
          
          // Calculate score based on food level
          let scoreGain = 0;
          switch (food.level) {
            case 1:
              scoreGain = 10;
              break;
            case 2:
              scoreGain = 20;
              break;
            case 3:
              scoreGain = 50;
              break;
          }
          
          snake.score += scoreGain;
          
          // Remove eaten food
          this.foods.splice(i, 1);
          
          console.log('GameRoomModel: Snake ate level', food.level, 'food, gained', scoreGain, 'points, new score:', snake.score);
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
      if (head.x < 0 || head.x >= this.CONFIG.BOARD.SIZE || 
          head.y < 0 || head.y >= this.CONFIG.BOARD.SIZE) {
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
    
    // Update leaderboard with all players' scores
    for (const snake of this.snakes.values()) {
      const player = this.players.get(snake.viewId);
      if (player) {
        const isWinner = snake.viewId === winnerId;
        console.log('GameRoomModel: Updating leaderboard for player:', {
          address: player.address,
          name: player.name,
          score: snake.score,
          isWinner: isWinner
        });
        
        // Publish score update to leaderboard session (持久化模型)
        this.publish("leaderboard-session", "update-score", {
          playerAddress: player.address,
          playerName: player.name,
          score: snake.score,
          isWinner: isWinner
        });
      }
    }
    
    // 游戏结束后保存排行榜数据
    console.log('GameRoomModel: Game ended, triggering leaderboard save');
    this.publish("leaderboard-session", "save-data", {
      reason: 'game-ended',
      roomId: this.roomId,
      winner: winnerId
    });
    
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
    
    console.log('GameRoomModel: Game ended, showing results briefly then resetting to waiting state');
    console.log('GameRoomModel: endGame scheduling details:', {
      currentStatus: this.status,
      delayDuration: this.CONFIG.TIMING.GAME_END_RESULT_DURATION,
      delayMilliseconds: this.CONFIG.TIMING.GAME_END_RESULT_DURATION * 1000,
      currentTimestamp: new Date().toISOString(),
      expectedResetTime: new Date(Date.now() + this.CONFIG.TIMING.GAME_END_RESULT_DURATION * 1000).toISOString()
    });
    
    // 短暂显示游戏结果后立刻重置为 waiting 状态
    this.future(this.CONFIG.TIMING.GAME_END_RESULT_DURATION * 1000).resetToWaiting();
  }

  resetToWaiting() {
    console.log('GameRoomModel: resetToWaiting called at:', {
      currentTimestamp: new Date().toISOString(),
      currentStatus: this.status,
      willChangeTo: 'waiting'
    });
    console.log('GameRoomModel: Resetting to waiting state');
    
    // 重置房间状态
    this.status = 'waiting';
    this.isRunning = false;
    this.winner = null;
    this.foods = [];
    this.speedMultiplier = 1.0;
    this.countdown = 0;
    this.gameStartTime = 0;
    this.tickCounter = 0;
    this.speedBoostCountdown = 20;
    this.foodCountdown = 10;
    
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

  speedBoost() {
    if (!this.isRunning || this.status !== 'playing') {
      return;
    }
    
    // 增加速度
    this.speedMultiplier = Math.min(3.0, this.speedMultiplier + 0.2);
    console.log('GameRoomModel: Speed boost applied! New speed:', this.speedMultiplier);
    
    this.publishRoomState();
    
    // 安排下一次速度提升
    this.future(20000).speedBoost();
  }

  spawnFood() {
    // 如果游戏没在运行，不生成食物
    if (!this.isRunning || this.status !== 'playing') {
      return;
    }
    
    // Limit food on board
    if (this.foods.length >= 8) {
      // 如果已经有足够食物，安排下一次检查
      this.future(10000).spawnFood();
      return;
    }
    
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
      const x = Math.floor(this.random() * this.CONFIG.BOARD.SIZE);
      const y = Math.floor(this.random() * this.CONFIG.BOARD.SIZE);
      
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
      
      // Check if position is occupied by other foods
      if (!occupied) {
        for (const food of this.foods) {
          if (food.x === x && food.y === y) {
            occupied = true;
            break;
          }
        }
      }
      
      if (!occupied) {
        // Determine food level with probability
        // 70% level 1, 25% level 2, 5% level 3
        const rand = this.random();
        let level: 1 | 2 | 3;
        let value: number;
        
        if (rand < 0.70) {
          level = 1;
          value = 10;
        } else if (rand < 0.95) {
          level = 2;
          value = 20;
        } else {
          level = 3;
          value = 50;
        }
        
        const food: Food = {
          x,
          y,
          type: level === 3 ? 'bonus' : 'normal',
          level: level,
          value: value
        };
        
        this.foods.push(food);
        console.log('GameRoomModel: Spawned level', level, 'food at:', x, y, 'worth', value, 'points');
        break;
      }
      
      attempts++;
    }
    
    // 安排下一次食物生成
    this.future(10000).spawnFood();
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
      isReady: player.isReady,
      hasNFT: player.hasNFT
    }));

    console.log('GameRoomModel: Building room state:', {
      roomId: this.roomId,
      playersCount: playersArray.length,
      players: playersArray.map(p => ({ name: p.name, hasNFT: p.hasNFT })),
      hostAddress: this.hostAddress
    });

    const roomState = {
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

    // 添加详细的 createdAt 调试信息
    console.log('GameRoomModel: getRoomState() returning:', {
      roomId: this.roomId,
      createdAt: this.createdAt,
      createdAtType: typeof this.createdAt,
      createdAtInResult: roomState.createdAt,
      createdAtInResultType: typeof roomState.createdAt,
      allKeys: Object.keys(roomState)
    });

    return roomState;
  }

  getGameState() {
    const snakesArray = Array.from(this.snakes.values()).map(snake => ({
      id: snake.viewId,
      segments: snake.body, // 身体位置数组
      body: snake.body,     // 也保留body字段以兼容
      direction: snake.direction,
      color: snake.color,
      isAlive: snake.isAlive,
      score: snake.score,
      name: snake.name,
      isSpectator: snake.isSpectator || false,
      hasNFT: snake.hasNFT
    }));

    console.log('GameRoomModel: Building game state with NFT data:', {
      roomId: this.roomId,
      snakesCount: snakesArray.length,
      snakesNFT: snakesArray.map(s => ({ name: s.name, hasNFT: s.hasNFT }))
    });

    // 使用模型中计算好的倒计时 - 符合Multisynq最佳实践
    return {
      id: this.roomId,
      status: this.status,
      countdown: this.countdown,
      players: snakesArray,
      speedMultiplier: this.speedMultiplier,
      speedBoostCountdown: this.speedBoostCountdown,
      foodCountdown: this.foodCountdown
    };
  }

  publishRoomState() {
    const roomState = this.getRoomState();
    const gameState = this.getGameState();
    
    console.log('GameRoomModel: Publishing room state:', {
      roomId: this.roomId,
      roomPlayersCount: roomState.players.length,
      gamePlayersCount: gameState.players.length,
      hostAddress: this.hostAddress,
      status: this.status
    });
    
    this.publish("room", "updated", {
      room: roomState,
      game: gameState,
      foods: this.foods
    });
    
    // 通知大厅状态更新 - 确保大厅页面能看到房间状态变化
    this.publish("lobby", "room-state-changed", {
      roomId: this.roomId,
      status: this.status
    });
  }
}

GameRoomModel.register("GameRoomModel");
