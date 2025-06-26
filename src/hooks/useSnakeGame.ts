import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameContext } from '../contexts/GameContext';
import { useRoomContext } from '../contexts/RoomContext';
import { useMultisynq } from '../contexts/MultisynqContext';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { useResponsiveGrid } from './useResponsiveGrid';
import { useMobileControls } from './useMobileControls';
import { useIsMobile } from './use-mobile';
import { assignPlayerColors } from '../utils/gameConfig';
import { COUNTDOWN_DURATION, GAME_END_RESULT_DURATION } from '../utils/gameConstants';

export interface Position {
  x: number;
  y: number;
}

export interface Snake {
  id: string;
  segments: Position[];
  direction: 'up' | 'down' | 'left' | 'right';
  color: string;
  isAlive: boolean;
  score: number;
  isPlayer: boolean;
  name: string;
  isSpectator?: boolean;
  hasNFT?: boolean; // NFT holder flag for rainbow snake effect
}

export interface Food {
  position: Position;
  type: 'normal' | 'bonus';
  level: 1 | 2 | 3;  // 食物等级
  value: number;
}

// Helper function to convert direction objects to string literals
const convertDirectionToString = (direction: { x: number; y: number } | undefined): 'up' | 'down' | 'left' | 'right' => {
  if (!direction) return 'up';
  
  if (direction.x === 0 && direction.y === -1) return 'up';
  if (direction.x === 0 && direction.y === 1) return 'down';
  if (direction.x === -1 && direction.y === 0) return 'left';
  if (direction.x === 1 && direction.y === 0) return 'right';
  
  // Default fallback
  return 'up';
};

export const useSnakeGame = () => {
  const { gameView, isConnected } = useMultisynq();
  const { currentRoom, spectatorRoom, isSpectator: isExternalSpectator } = useRoomContext();
  const { user } = useWeb3Auth();
  const { gridSize, cellSize } = useResponsiveGrid();
  const isMobile = useIsMobile();
  
  const [snakes, setSnakes] = useState<Snake[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [finalScores, setFinalScores] = useState<Snake[]>([]); // 保存游戏结束时的最终分数

  const [gameRunning, setGameRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameEndTime, setGameEndTime] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [foodCountdown, setFoodCountdown] = useState(10);
  const [speedBoostCountdown, setSpeedBoostCountdown] = useState(20);

  // 合并内部观察者状态（死亡玩家）和外部观察者状态（链接加入的观察者）
  const effectiveIsSpectator = isSpectator || isExternalSpectator;
  
  // 获取当前活动房间：观察者模式使用spectatorRoom，否则使用currentRoom
  const activeRoom = isExternalSpectator ? spectatorRoom : currentRoom;

  // Define changeDirection first
  const changeDirection = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!gameView || !gameSessionId || !user?.address || (!gameRunning && !showCountdown) || effectiveIsSpectator) {
      console.log('useSnakeGame: Cannot change direction - spectator mode, game not running, or countdown not active');
      return;
    }

    console.log('useSnakeGame: Changing direction:', direction);
    gameView.changeDirection(gameSessionId, user.address, direction);
  }, [gameView, gameSessionId, user?.address, gameRunning, showCountdown, effectiveIsSpectator]);

  // Now mobile controls can use changeDirection safely
  useMobileControls({
    onDirectionChange: changeDirection,
    isEnabled: isMobile && (gameRunning || showCountdown) && !effectiveIsSpectator
  });

  // Updated game callback setup to work with new model structure
  useEffect(() => {
    if (!gameView || !isConnected) {
      console.log('useSnakeGame: Not ready - gameView:', !!gameView, 'isConnected:', isConnected);
      return;
    }

    console.log('useSnakeGame: Setting up game callback with synchronized position architecture');

    const gameCallback = (gameSession: {
      id: string;
      status: string;
      players: Array<{
        id: string;
        segments?: Array<{ x: number; y: number }>;
        body?: Array<{ x: number; y: number }>;
        direction?: { x: number; y: number };
        position?: { x: number; y: number };
        color?: string;
        isAlive?: boolean;
        score?: number;
        name?: string;
        isSpectator?: boolean;
        hasNFT?: boolean;
      }>;
      countdown?: number;
      speedMultiplier?: number;
      speedBoostCountdown?: number;
      foodCountdown?: number;
    }, foods: Array<{ x: number; y: number; type?: string; level?: number; value?: number }>) => {
      console.log('=== useSnakeGame: Game callback triggered with synchronized positions ===', {
        hasGameSession: !!gameSession,
        gameSessionId: gameSession?.id,
        gameSessionStatus: gameSession?.status,
        playersCount: gameSession?.players?.length || 0,
        currentUserId: user?.address?.slice(-6) || 'none',
        gameSessionPlayers: gameSession?.players?.map((p) => ({
          id: p.id.slice(-6),
          name: p.name,
          isAlive: p.isAlive,
          hasSegments: !!p.segments,
          segmentsLength: p.segments?.length || 0
        })) || []
      });

      if (!gameSession) return;

      setGameSessionId(gameSession.id);

      if (gameSession.players && gameSession.players.length > 0) {
        // Map players to snakes format
        const rawGameSnakes = gameSession.players.map((player) => ({
          id: player.id,
          segments: player.segments || player.body || [player.position],
          direction: convertDirectionToString(player.direction), // Convert to string literal
          color: player.color, // 临时颜色，将被重新分配
          isAlive: player.isAlive,
          score: player.score,
          isPlayer: player.id === user?.address,
          name: player.name,
          isSpectator: player.isSpectator || false,
          // 使用来自Snake模型的实际NFT状态
          hasNFT: player.hasNFT || false
        }));

        console.log('useSnakeGame: Mapped snakes with synchronized segments data:', {
          totalSnakes: rawGameSnakes.length,
          snakesData: rawGameSnakes.map((s, index) => ({
            index,
            id: s.id.slice(-6),
            name: s.name,
            hasNFT: s.hasNFT,
            isPlayer: s.isPlayer,
            segments: s.segments?.length || 0,
            firstSegment: s.segments?.[0],
            isAlive: s.isAlive
          }))
        });
        
        // 重新分配颜色确保一致性 - 只对非NFT玩家分配预设颜色
        const gameSnakes: Snake[] = assignPlayerColors(
          rawGameSnakes, 
          (snake) => snake.id
        );
        
        console.log('useSnakeGame: Color assignment with synchronized positions:', {
          totalPlayers: gameSnakes.length,
          players: gameSnakes.map((s, index) => ({ 
            index,
            id: s.id.slice(-6),
            name: s.name, 
            color: s.color, 
            hasNFT: s.hasNFT,
            isPlayer: s.isPlayer,
            headPosition: s.segments?.[0]
          }))
        });
        
        setSnakes(gameSnakes);
        
        // 检查当前玩家的状态
        const currentPlayerSnake = gameSnakes.find((snake: Snake) => snake.isPlayer);
        if (currentPlayerSnake) {
          // 找到了玩家的蛇，使用蛇的观察者状态
          setIsSpectator(currentPlayerSnake.isSpectator || false);
          
          // Debug position information during countdown
          if (currentPlayerSnake.segments.length > 0) {
            const head = currentPlayerSnake.segments[0];
            console.log('useSnakeGame: Player snake synchronized head position:', head, 'gridSize:', gridSize);
          }
        } else if (isExternalSpectator) {
          // 外部观察者：没有找到玩家蛇，但是是外部观察者模式
          console.log('useSnakeGame: External spectator mode - no player snake found, but showing spectator view');
          setIsSpectator(false); // 内部观察者状态为false，因为effectiveIsSpectator会处理
        } else {
          // 既不是游戏玩家也不是外部观察者
          setIsSpectator(false);
        }
        
        // Map foods to expected format with proper type casting
        const gameFoods: Food[] = foods.map(food => ({
          position: { x: food.x, y: food.y },
          type: (food.type === 'normal' || food.type === 'bonus') ? food.type : 'normal', // Type guard
          level: (food.level === 1 || food.level === 2 || food.level === 3) ? food.level : 1, // Type guard
          value: food.value || 1
        }));
        setFoods(gameFoods);
        
        // Update speed multiplier from game session
        if (gameSession.speedMultiplier !== undefined) {
          setSpeedMultiplier(gameSession.speedMultiplier);
        }

        // Handle game state
        if (gameSession.status === 'countdown') {
          console.log('useSnakeGame: Countdown state - positions are synchronized and fixed:', {
            countdown: gameSession.countdown,
            expectedCountdown: COUNTDOWN_DURATION,
            snakesCount: gameSnakes.length,
            snakesWithSegments: gameSnakes.filter(s => s.segments.length > 0).length,
            allSnakePositions: gameSnakes.map(s => ({ 
              name: s.name, 
              headPos: s.segments?.[0]
            }))
          });
          setShowCountdown(true);
          setCountdown(gameSession.countdown || COUNTDOWN_DURATION);
          setGameRunning(false);
          setGameOver(false);
        } else if (gameSession.status === 'playing') {
          console.log('useSnakeGame: Game started - snakes begin moving from synchronized positions');
          setShowCountdown(false);
          setGameRunning(true);
          setGameOver(false);
        } else if (gameSession.status === 'finished') {
          console.log('useSnakeGame: Game finished - showing game over screen');
          
          // 保存最终分数，避免被后续的reset操作影响
          console.log('useSnakeGame: Saving final scores before reset:', gameSnakes.map(s => ({ name: s.name, score: s.score })));
          setFinalScores([...gameSnakes]); // 深拷贝当前分数状态
          
          setGameRunning(false);
          setGameOver(true);
          setGameEndTime(Date.now()); // 记录游戏结束时间
          setShowCountdown(false);
          setIsSpectator(false);
        } else if (gameSession.status === 'waiting') {
          // 检查是否应该隐藏游戏结束界面
          const now = Date.now();
          const timeSinceGameEnd = gameEndTime ? now - gameEndTime : 0;
          const minDisplayTime = GAME_END_RESULT_DURATION * 1000; // 转换为毫秒
          
          console.log('useSnakeGame: Game reset to waiting - checking if should hide game over screen');
          
          // 只有经过足够时间后才隐藏游戏结束界面
          if (!gameEndTime || timeSinceGameEnd >= minDisplayTime) {
            // 游戏重置回等待状态 - 重置所有UI状态
            setShowCountdown(false);
            setGameRunning(false);
            setGameOver(false);
            setGameEndTime(null); // 清除游戏结束时间
            setFinalScores([]); // 清除保存的最终分数
            setIsSpectator(false);
            setSpeedMultiplier(1.0);
            setSpeedBoostCountdown(20);
            setFoodCountdown(10);
            setCountdown(0);
            
            console.log('useSnakeGame: Game reset to waiting state - all UI states reset');
          }
        }
      } else {
        // Reset state when no game session
        setGameSessionId(null);
        setSnakes([]);
        setFoods([]);
        setFinalScores([]); // 清除保存的最终分数
        setGameRunning(false);
        setShowCountdown(false);
        setGameOver(false);
        setGameEndTime(null); // 清除游戏结束时间
        setIsSpectator(false);
        setSpeedMultiplier(1.0);
        setSpeedBoostCountdown(20);
      }
    };

    // 监听全局游戏更新事件（从setupGameViewCallbacks触发）
    const handleGlobalGameUpdate = (event: CustomEvent) => {
      console.log('=== useSnakeGame: Game callback triggered (GLOBAL with synchronized positions) ===');
      const { gameSession, foods } = event.detail;
      gameCallback(gameSession, foods);
    };

    // 设置全局事件监听器
    window.addEventListener('global-game-update', handleGlobalGameUpdate as EventListener);
    
    // 保留原有的gameCallback设置作为fallback
    gameView.setGameCallback(gameCallback);

    // Try to get initial game state for current room or spectator room
    if (activeRoom && gameView.model) {
      console.log('useSnakeGame: Trying to get initial synchronized game state for room:', {
        roomId: activeRoom.id,
        isExternalSpectator,
        roomSource: isExternalSpectator ? 'spectatorRoom' : 'currentRoom'
      });
      const gameSession = gameView.getGameSessionByRoom(activeRoom.id);
      if (gameSession) {
        console.log('useSnakeGame: Found initial game session with synchronized positions, triggering callback');
        gameCallback(gameSession, []);
      } else {
        console.log('useSnakeGame: No initial game session found for room:', activeRoom.id);
      }
    }

    return () => {
      console.log('useSnakeGame: Cleaning up game callback and global event listener');
      window.removeEventListener('global-game-update', handleGlobalGameUpdate as EventListener);
      gameView.setGameCallback(() => {});
    };
  }, [gameView, isConnected, activeRoom, user?.address, gridSize, isExternalSpectator]);

  const enterSpectatorMode = useCallback(() => {
    if (!gameView || !gameSessionId || !user?.address || !gameRunning) {
      console.log('useSnakeGame: Cannot enter spectator mode - game not running');
      return;
    }

    console.log('useSnakeGame: Entering spectator mode');
    gameView.enterSpectatorMode(gameSessionId, user.address);
  }, [gameView, gameSessionId, user?.address, gameRunning]);

  // Listen to local countdown updates from GameView using future()
  useEffect(() => {
    const handleLocalCountdownUpdate = (event: CustomEvent) => {
      const { speedBoostCountdown: newSpeedBoostCountdown, foodCountdown: newFoodCountdown } = event.detail;
      console.log('useSnakeGame: Local countdown update received:', {
        speedBoostCountdown: newSpeedBoostCountdown,
        foodCountdown: newFoodCountdown
      });
      
      setSpeedBoostCountdown(newSpeedBoostCountdown);
      setFoodCountdown(newFoodCountdown);
    };

    window.addEventListener('local-countdown-update', handleLocalCountdownUpdate as EventListener);
    
    return () => {
      window.removeEventListener('local-countdown-update', handleLocalCountdownUpdate as EventListener);
    };
  }, []);

  // Keyboard controls - work during countdown and game with synchronized positions
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((!gameRunning && !showCountdown) || effectiveIsSpectator) return;
      
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          e.preventDefault();
          changeDirection('up');
          break;
        case 's':
        case 'arrowdown':
          e.preventDefault();
          changeDirection('down');
          break;
        case 'a':
        case 'arrowleft':
          e.preventDefault();
          changeDirection('left');
          break;
        case 'd':
        case 'arrowright':
          e.preventDefault();
          changeDirection('right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameRunning, showCountdown, changeDirection, effectiveIsSpectator]);

  return {
    snakes: gameOver && finalScores.length > 0 ? finalScores : snakes, // 游戏结束时使用保存的最终分数
    foods,
    gameRunning,
    gameOver,
    startGame: () => {},
    pauseGame: () => {},
    resetGame: () => {},
    gridSize,
    cellSize,
    countdown,
    showCountdown,
    isSpectator: effectiveIsSpectator,
    enterSpectatorMode,
    speedMultiplier,
    foodCountdown,
    speedBoostCountdown
  };
};
