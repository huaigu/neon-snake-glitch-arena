import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameContext } from '../contexts/GameContext';
import { useRoomContext } from '../contexts/RoomContext';
import { useMultisynq } from '../contexts/MultisynqContext';
import { useWeb3Auth } from '../contexts/Web3AuthContext';

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
  isSpectator?: boolean; // New field for spectator mode
}

export interface Food {
  position: Position;
  type: 'normal' | 'bonus';
  value: number;
}

export interface Segment {
  id: string;
  position: Position;
  type: 'speed' | 'score' | 'length';
  value: number;
  color: string;
}

const GRID_SIZE = 60;

export const useSnakeGame = () => {
  const { gameView, isConnected } = useMultisynq();
  const { currentRoom } = useRoomContext();
  const { user } = useWeb3Auth();
  
  const [snakes, setSnakes] = useState<Snake[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [gameRunning, setGameRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);
  const [isSpectator, setIsSpectator] = useState(false); // New state for spectator mode

  // 设置游戏回调
  useEffect(() => {
    if (!gameView || !isConnected) {
      return;
    }

    console.log('useSnakeGame: Setting up game callback');
    
    const gameCallback = (gameSession: any, foods: any[], segments: any[]) => {
      console.log('useSnakeGame: Game callback triggered:', {
        hasGameSession: !!gameSession,
        sessionStatus: gameSession?.status,
        countdown: gameSession?.countdown,
        playersCount: gameSession?.players?.length || 0,
        foodsCount: foods.length,
        segmentsCount: segments.length
      });

      if (gameSession) {
        setGameSessionId(gameSession.id);
        
        // 转换游戏玩家为蛇
        const gameSnakes = gameSession.players.map((player: any) => ({
          id: player.id,
          segments: player.segments || [player.position],
          direction: player.direction,
          color: player.color,
          isAlive: player.isAlive,
          score: player.score,
          isPlayer: player.address === user?.address,
          name: player.name,
          isSpectator: player.isSpectator || false
        }));
        
        setSnakes(gameSnakes);
        
        // Check if current player is in spectator mode
        const currentPlayerSnake = gameSnakes.find((snake: Snake) => snake.isPlayer);
        if (currentPlayerSnake) {
          setIsSpectator(currentPlayerSnake.isSpectator || false);
        }
        
        // 转换食物
        const gameFoods = foods.map(food => ({
          position: food.position,
          type: food.type,
          value: food.value
        }));
        setFoods(gameFoods);
        
        // 转换道具
        const gameSegments = segments.map(segment => ({
          id: segment.id,
          position: segment.position,
          type: segment.type,
          value: segment.value,
          color: segment.color
        }));
        setSegments(gameSegments);
        
        // 处理游戏状态
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
          setIsSpectator(false); // Reset spectator mode when game ends
        }
      } else {
        // 没有活跃的游戏会话
        setGameSessionId(null);
        setSnakes([]);
        setFoods([]);
        setSegments([]);
        setGameRunning(false);
        setShowCountdown(false);
        setGameOver(false);
        setIsSpectator(false);
      }
    };
    
    gameView.setGameCallback(gameCallback);

    // 获取初始状态
    if (currentRoom && gameView.model) {
      const gameSession = gameView.getGameSessionByRoom(currentRoom.id);
      const foods = gameView.model.foods || [];
      const segments = gameView.model.segments || [];
      gameCallback(gameSession, foods, segments);
    }

    return () => {
      console.log('useSnakeGame: Cleaning up game callback');
      gameView.setGameCallback(() => {});
    };
  }, [gameView, isConnected, currentRoom, user?.address]);

  const changeDirection = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    // Don't allow direction changes if player is in spectator mode
    if (!gameView || !gameSessionId || !user?.address || !gameRunning || isSpectator) {
      console.log('useSnakeGame: Cannot change direction - spectator mode or game not running');
      return;
    }

    console.log('useSnakeGame: Changing direction:', direction);
    gameView.changeDirection(gameSessionId, user.address, direction);
  }, [gameView, gameSessionId, user?.address, gameRunning, isSpectator]);

  const startGame = useCallback(() => {
    console.log('useSnakeGame: Start game called - games are started automatically when all players are ready');
  }, []);

  const pauseGame = useCallback(() => {
    console.log('useSnakeGame: Pause game called - not implemented for multiplayer');
  }, []);

  const resetGame = useCallback(() => {
    console.log('useSnakeGame: Reset game called - not implemented for multiplayer');
  }, []);

  // 键盘控制
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't handle key presses if in spectator mode or game not running
      if (!gameRunning || isSpectator) return;
      
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
  }, [gameRunning, changeDirection, isSpectator]);

  console.log('useSnakeGame render - multiplayer mode, snakes:', snakes.length, 'gameRunning:', gameRunning, 'countdown:', countdown, 'segments:', segments.length, 'isSpectator:', isSpectator);

  return {
    snakes,
    foods,
    segments,
    gameRunning,
    gameOver,
    startGame,
    pauseGame,
    resetGame,
    gridSize: GRID_SIZE,
    countdown,
    showCountdown,
    isSpectator // Export spectator state
  };
};
