import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameContext } from '../contexts/GameContext';
import { useRoomContext } from '../contexts/RoomContext';
import { useMultisynq } from '../contexts/MultisynqContext';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { useResponsiveGrid } from './useResponsiveGrid';
import { useMobileControls } from './useMobileControls';
import { useIsMobile } from './use-mobile';
import { assignPlayerColors } from '../utils/gameConfig';

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



export const useSnakeGame = () => {
  const { gameView, isConnected } = useMultisynq();
  const { currentRoom, isSpectator: isExternalSpectator } = useRoomContext();
  const { user } = useWeb3Auth();
  const { gridSize, cellSize } = useResponsiveGrid();
  const isMobile = useIsMobile();
  
  const [snakes, setSnakes] = useState<Snake[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);

  const [gameRunning, setGameRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [foodCountdown, setFoodCountdown] = useState(10);
  const [speedBoostCountdown, setSpeedBoostCountdown] = useState(20);

  // 合并内部观察者状态（死亡玩家）和外部观察者状态（链接加入的观察者）
  const effectiveIsSpectator = isSpectator || isExternalSpectator;

  // Define changeDirection first
  const changeDirection = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!gameView || !gameSessionId || !user?.address || !gameRunning || effectiveIsSpectator) {
      console.log('useSnakeGame: Cannot change direction - spectator mode or game not running');
      return;
    }

    console.log('useSnakeGame: Changing direction:', direction);
    gameView.changeDirection(gameSessionId, user.address, direction);
  }, [gameView, gameSessionId, user?.address, gameRunning, effectiveIsSpectator]);

  // Now mobile controls can use changeDirection safely
  useMobileControls({
    onDirectionChange: changeDirection,
    isEnabled: isMobile && gameRunning && !effectiveIsSpectator
  });

  // Updated game callback setup to work with new model structure
  useEffect(() => {
    if (!gameView || !isConnected) {
      return;
    }

    console.log('useSnakeGame: Setting up game callback with new model architecture, fixed gridSize:', gridSize);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gameCallback = (gameSession: any, foods: any[]) => {
      console.log('=== useSnakeGame: Game callback triggered (NEW MODEL) ===');
      console.log('gameSession:', gameSession);
      console.log('gameSession status:', gameSession?.status);
      console.log('gameSession players:', gameSession?.players);
      console.log('current user address:', user?.address);
      console.log('current room:', currentRoom?.id);
      console.log('==========================================');
      
      if (gameSession) {
        setGameSessionId(gameSession.id);
        setSpeedMultiplier(gameSession.speedMultiplier || 1.0);
        
        // Use model-calculated countdown values - Multisynq best practice
        setSpeedBoostCountdown(gameSession.speedBoostCountdown || 20);
        setFoodCountdown(gameSession.foodCountdown || 10);
        
        // Map players to snakes format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawGameSnakes = gameSession.players.map((player: any) => ({
          id: player.id,
          segments: player.segments || [player.position],
          direction: player.direction,
          color: player.color, // 临时颜色，将被重新分配
          isAlive: player.isAlive,
          score: player.score,
          isPlayer: player.id === user?.address,
          name: player.name,
          isSpectator: player.isSpectator || false,
          // 使用来自Snake模型的实际NFT状态
          hasNFT: player.hasNFT || false
        }));

        console.log('useSnakeGame: Raw snake NFT data from gameSession:', {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          playersWithNFT: gameSession.players.map((p: any) => ({ 
            id: p.id.slice(-6), 
            name: p.name, 
            hasNFT: p.hasNFT,
            isCurrentPlayer: p.id === user?.address
          }))
        });
        
        // 重新分配颜色确保一致性 - 只对非NFT玩家分配预设颜色
        const gameSnakes: Snake[] = assignPlayerColors(
          rawGameSnakes, 
          (snake) => snake.id
        );
        
        console.log('useSnakeGame: Detailed color assignment:', {
          totalPlayers: gameSnakes.length,
          players: gameSnakes.map((s, index) => ({ 
            index,
            id: s.id.slice(-6),
            name: s.name, 
            color: s.color, 
            hasNFT: s.hasNFT,
            isPlayer: s.isPlayer
          })),
          playerAddressSorting: rawGameSnakes
            .sort((a, b) => a.id.localeCompare(b.id))
            .map((s, index) => ({ 
              sortedIndex: index,
              id: s.id.slice(-6),
              name: s.name 
            }))
        });
        
        setSnakes(gameSnakes);
        
        // 检查当前玩家的状态
        const currentPlayerSnake = gameSnakes.find((snake: Snake) => snake.isPlayer);
        if (currentPlayerSnake) {
          // 找到了玩家的蛇，使用蛇的观察者状态
          setIsSpectator(currentPlayerSnake.isSpectator || false);
          
          // Debug boundary information
          if (currentPlayerSnake.segments.length > 0) {
            const head = currentPlayerSnake.segments[0];
            console.log('useSnakeGame: Player snake head position:', head, 'gridSize:', gridSize, 'boundaries: 0 to', gridSize - 1);
            
            // Check if head is near boundaries
            if (head.x <= 1 || head.x >= gridSize - 2 || head.y <= 1 || head.y >= gridSize - 2) {
              console.log('useSnakeGame: WARNING - Snake head is very close to boundary!');
            }
          }
        } else if (isExternalSpectator) {
          // 外部观察者：没有找到玩家蛇，但是是外部观察者模式
          console.log('useSnakeGame: External spectator mode - no player snake found, but showing spectator view');
          setIsSpectator(false); // 内部观察者状态为false，因为effectiveIsSpectator会处理
        } else {
          // 既不是游戏玩家也不是外部观察者
          setIsSpectator(false);
        }
        
        // Map foods to expected format
        const gameFoods = foods.map(food => ({
          position: { x: food.x, y: food.y },
          type: food.type,
          level: food.level || 1,  // 默认为1级食物
          value: food.value
        }));
        setFoods(gameFoods);
        
        // Segments removed - no longer used
        
        // Handle game state
        if (gameSession.status === 'countdown') {
          setShowCountdown(true);
          setCountdown(gameSession.countdown || 3);
          setGameRunning(false);
          setGameOver(false);
        } else if (gameSession.status === 'playing') {
          setShowCountdown(false);
          setGameRunning(true);
          setGameOver(false);
        } else if (gameSession.status === 'finished') {
          setGameRunning(false);
          setGameOver(true);
          setShowCountdown(false);
          setIsSpectator(false);
          
          console.log('useSnakeGame: Displaying finished game results for all players in room');
        } else if (gameSession.status === 'waiting') {
          // 游戏重置回等待状态 - 重置所有UI状态
          setShowCountdown(false);
          setGameRunning(false);
          setGameOver(false);
          setIsSpectator(false);
          setSpeedMultiplier(1.0);
          setSpeedBoostCountdown(20);
          setFoodCountdown(10);
          setCountdown(0);
          
          console.log('useSnakeGame: Game reset to waiting state - all UI states reset');
        }
      } else {
        // Reset state when no game session
        setGameSessionId(null);
        setSnakes([]);
        setFoods([]);
        setGameRunning(false);
        setShowCountdown(false);
        setGameOver(false);
        setIsSpectator(false);
        setSpeedMultiplier(1.0);
        setSpeedBoostCountdown(20);
      }
    };
    
    gameView.setGameCallback(gameCallback);

    // Try to get initial game state for current room
    if (currentRoom && gameView.model) {
      const gameSession = gameView.getGameSessionByRoom(currentRoom.id);
      if (gameSession) {
        gameCallback(gameSession, []);
      }
    }

    return () => {
      console.log('useSnakeGame: Cleaning up game callback');
      gameView.setGameCallback(() => {});
    };
  }, [gameView, isConnected, currentRoom, user?.address, gridSize]);

  const enterSpectatorMode = useCallback(() => {
    if (!gameView || !gameSessionId || !user?.address || !gameRunning) {
      console.log('useSnakeGame: Cannot enter spectator mode - game not running');
      return;
    }

    console.log('useSnakeGame: Entering spectator mode');
    gameView.enterSpectatorMode(gameSessionId, user.address);
  }, [gameView, gameSessionId, user?.address, gameRunning]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameRunning || effectiveIsSpectator) return;
      
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
  }, [gameRunning, changeDirection, effectiveIsSpectator]);

  // 只在debug模式下输出渲染日志
  // console.log('useSnakeGame render - multiplayer mode, snakes:', snakes.length, 'gameRunning:', gameRunning, 'countdown:', countdown, 'segments:', segments.length, 'isSpectator:', effectiveIsSpectator, 'speedMultiplier:', speedMultiplier, 'gridSize:', gridSize);

  return {
    snakes,
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
