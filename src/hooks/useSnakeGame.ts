
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
}

export interface Food {
  position: Position;
  type: 'normal' | 'bonus';
  value: number;
}

const GRID_SIZE = 60;

export const useSnakeGame = () => {
  const { gameView, isConnected } = useMultisynq();
  const { currentRoom } = useRoomContext();
  const { user } = useWeb3Auth();
  
  const [snakes, setSnakes] = useState<Snake[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [gameRunning, setGameRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);

  // 设置游戏回调
  useEffect(() => {
    if (!gameView || !isConnected) {
      return;
    }

    console.log('useSnakeGame: Setting up game callback');
    
    const gameCallback = (gameSession: any, foods: any[]) => {
      console.log('useSnakeGame: Game callback triggered:', {
        hasGameSession: !!gameSession,
        sessionStatus: gameSession?.status,
        countdown: gameSession?.countdown,
        playersCount: gameSession?.players?.length || 0,
        foodsCount: foods.length
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
          name: player.name
        }));
        
        setSnakes(gameSnakes);
        
        // 转换食物
        const gameFoods = foods.map(food => ({
          position: food.position,
          type: food.type,
          value: food.value
        }));
        setFoods(gameFoods);
        
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
        }
      } else {
        // 没有活跃的游戏会话
        setGameSessionId(null);
        setSnakes([]);
        setFoods([]);
        setGameRunning(false);
        setShowCountdown(false);
        setGameOver(false);
      }
    };
    
    gameView.setGameCallback(gameCallback);

    // 获取初始状态
    if (currentRoom && gameView.model) {
      const gameSession = gameView.getGameSessionByRoom(currentRoom.id);
      const foods = gameView.model.foods || [];
      gameCallback(gameSession, foods);
    }

    return () => {
      console.log('useSnakeGame: Cleaning up game callback');
      gameView.setGameCallback(() => {});
    };
  }, [gameView, isConnected, currentRoom, user?.address]);

  const changeDirection = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!gameView || !gameSessionId || !user?.address || !gameRunning) {
      return;
    }

    console.log('useSnakeGame: Changing direction:', direction);
    gameView.changeDirection(gameSessionId, user.address, direction);
  }, [gameView, gameSessionId, user?.address, gameRunning]);

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
      if (!gameRunning) return;
      
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
  }, [gameRunning, changeDirection]);

  console.log('useSnakeGame render - multiplayer mode, snakes:', snakes.length, 'gameRunning:', gameRunning, 'countdown:', countdown);

  return {
    snakes,
    foods,
    gameRunning,
    gameOver,
    startGame,
    pauseGame,
    resetGame,
    gridSize: GRID_SIZE,
    countdown,
    showCountdown
  };
};
