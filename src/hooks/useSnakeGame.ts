import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameContext } from '../contexts/GameContext';
import { useRoomContext } from '../contexts/RoomContext';
import { useMultisynq } from '../contexts/MultisynqContext';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { useResponsiveGrid } from './useResponsiveGrid';
import { useMobileControls } from './useMobileControls';
import { useIsMobile } from './use-mobile';

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

export const useSnakeGame = () => {
  const { gameView, isConnected } = useMultisynq();
  const { currentRoom } = useRoomContext();
  const { user } = useWeb3Auth();
  const { gridSize, cellSize } = useResponsiveGrid();
  const isMobile = useIsMobile();
  
  const [snakes, setSnakes] = useState<Snake[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [gameRunning, setGameRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);

  // Mobile swipe controls
  useMobileControls({
    onDirectionChange: changeDirection,
    isEnabled: isMobile && gameRunning && !isSpectator
  });

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
        segmentsCount: segments.length,
        speedMultiplier: gameSession?.speedMultiplier
      });

      if (gameSession) {
        setGameSessionId(gameSession.id);
        setSpeedMultiplier(gameSession.speedMultiplier || 1.0);
        
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
        
        const currentPlayerSnake = gameSnakes.find((snake: Snake) => snake.isPlayer);
        if (currentPlayerSnake) {
          setIsSpectator(currentPlayerSnake.isSpectator || false);
        }
        
        const gameFoods = foods.map(food => ({
          position: food.position,
          type: food.type,
          value: food.value
        }));
        setFoods(gameFoods);
        
        const gameSegments = segments.map(segment => ({
          id: segment.id,
          position: segment.position,
          type: segment.type,
          value: segment.value,
          color: segment.color
        }));
        setSegments(gameSegments);
        
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
        }
      } else {
        setGameSessionId(null);
        setSnakes([]);
        setFoods([]);
        setSegments([]);
        setGameRunning(false);
        setShowCountdown(false);
        setGameOver(false);
        setIsSpectator(false);
        setSpeedMultiplier(1.0);
      }
    };
    
    gameView.setGameCallback(gameCallback);

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
    if (!gameView || !gameSessionId || !user?.address || !gameRunning || isSpectator) {
      console.log('useSnakeGame: Cannot change direction - spectator mode or game not running');
      return;
    }

    console.log('useSnakeGame: Changing direction:', direction);
    gameView.changeDirection(gameSessionId, user.address, direction);
  }, [gameView, gameSessionId, user?.address, gameRunning, isSpectator]);

  const enterSpectatorMode = useCallback(() => {
    if (!gameView || !gameSessionId || !user?.address || !gameRunning) {
      console.log('useSnakeGame: Cannot enter spectator mode - game not running');
      return;
    }

    console.log('useSnakeGame: Entering spectator mode');
    gameView.enterSpectatorMode(gameSessionId, user.address);
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

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
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

  console.log('useSnakeGame render - multiplayer mode, snakes:', snakes.length, 'gameRunning:', gameRunning, 'countdown:', countdown, 'segments:', segments.length, 'isSpectator:', isSpectator, 'speedMultiplier:', speedMultiplier);

  return {
    snakes,
    foods,
    segments,
    gameRunning,
    gameOver,
    startGame,
    pauseGame,
    resetGame,
    gridSize,
    cellSize,
    countdown,
    showCountdown,
    isSpectator,
    enterSpectatorMode,
    speedMultiplier
  };
};
