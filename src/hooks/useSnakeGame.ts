
import { useState, useEffect, useCallback, useRef } from 'react';

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

const GRID_SIZE = 60; // Increased from 30 to 60
const GAME_SPEED = 150;
const AI_PLAYERS = [
  { name: 'NEON_HUNTER', color: '#ff0080' },
  { name: 'CYBER_VIPER', color: '#8000ff' },
  { name: 'DIGITAL_SNAKE', color: '#00ff41' }
];

export const useSnakeGame = () => {
  const [snakes, setSnakes] = useState<Snake[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [gameRunning, setGameRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const directionRef = useRef<'up' | 'down' | 'left' | 'right'>('right');

  const createInitialSnake = (id: string, startPos: Position, color: string, isPlayer: boolean, name: string): Snake => ({
    id,
    segments: [startPos, { x: startPos.x - 1, y: startPos.y }, { x: startPos.x - 2, y: startPos.y }],
    direction: 'right',
    color,
    isAlive: true,
    score: 0,
    isPlayer,
    name
  });

  const initializeGame = useCallback(() => {
    console.log('Initializing game...');
    
    // Create player snake with cyan color and starting position (center of grid)
    const centerPos = Math.floor(GRID_SIZE / 2);
    const playerSnake = createInitialSnake('player', { x: centerPos, y: centerPos }, '#00ffff', true, 'PLAYER_01');
    
    // Create AI snakes with different starting positions around the center
    const aiSnakes = AI_PLAYERS.map((ai, index) => 
      createInitialSnake(
        `ai_${index}`, 
        { x: centerPos + (index + 1) * 7, y: centerPos + (index * 3) }, 
        ai.color, 
        false, 
        ai.name
      )
    );

    const allSnakes = [playerSnake, ...aiSnakes];
    console.log('Created snakes:', allSnakes);
    
    setSnakes(allSnakes);
    
    // Generate more food across the larger grid
    const initialFoods = [];
    for (let i = 0; i < 8; i++) {
      initialFoods.push(generateFood());
    }
    setFoods(initialFoods);
    
    setGameOver(false);
    directionRef.current = 'right';
  }, []);

  const generateFood = useCallback((): Food => {
    const type = Math.random() < 0.8 ? 'normal' : 'bonus';
    return {
      position: {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      },
      type,
      value: type === 'normal' ? 10 : 50
    };
  }, []);

  const checkCollision = useCallback((pos: Position, segments: Position[], otherSnakes: Snake[] = []) => {
    // Wall collision
    if (pos.x < 0 || pos.x >= GRID_SIZE || pos.y < 0 || pos.y >= GRID_SIZE) return true;
    
    // Self collision
    if (segments.some(segment => segment.x === pos.x && segment.y === pos.y)) return true;
    
    // Other snakes collision
    return otherSnakes.some(snake => 
      snake.isAlive && snake.segments.some(segment => segment.x === pos.x && segment.y === pos.y)
    );
  }, []);

  const getAIDirection = useCallback((snake: Snake, foods: Food[], otherSnakes: Snake[]) => {
    const head = snake.segments[0];
    const nearestFood = foods.reduce((nearest, food) => {
      const distance = Math.abs(head.x - food.position.x) + Math.abs(head.y - food.position.y);
      return distance < nearest.distance ? { food, distance } : nearest;
    }, { food: foods[0], distance: Infinity });

    const possibleDirections = ['up', 'down', 'left', 'right'] as const;
    const oppositeDirection = {
      up: 'down', down: 'up', left: 'right', right: 'left'
    };

    const validDirections = possibleDirections.filter(dir => {
      if (dir === oppositeDirection[snake.direction]) return false;
      
      const nextPos = { ...head };
      switch (dir) {
        case 'up': nextPos.y--; break;
        case 'down': nextPos.y++; break;
        case 'left': nextPos.x--; break;
        case 'right': nextPos.x++; break;
      }
      
      return !checkCollision(nextPos, snake.segments.slice(1), otherSnakes.filter(s => s.id !== snake.id));
    });

    if (validDirections.length === 0) return snake.direction;

    // Simple AI: move towards food
    if (nearestFood.food) {
      const targetX = nearestFood.food.position.x;
      const targetY = nearestFood.food.position.y;
      
      if (Math.abs(head.x - targetX) > Math.abs(head.y - targetY)) {
        const preferredDir = head.x > targetX ? 'left' : 'right';
        if (validDirections.includes(preferredDir)) return preferredDir;
      } else {
        const preferredDir = head.y > targetY ? 'up' : 'down';
        if (validDirections.includes(preferredDir)) return preferredDir;
      }
    }

    return validDirections[Math.floor(Math.random() * validDirections.length)];
  }, [checkCollision]);

  const moveSnake = useCallback((snake: Snake, direction: string, foods: Food[], otherSnakes: Snake[]) => {
    const head = { ...snake.segments[0] };
    
    switch (direction) {
      case 'up': head.y--; break;
      case 'down': head.y++; break;
      case 'left': head.x--; break;
      case 'right': head.x++; break;
    }

    if (checkCollision(head, snake.segments, otherSnakes.filter(s => s.id !== snake.id))) {
      return { ...snake, isAlive: false };
    }

    const newSegments = [head, ...snake.segments];
    const ateFood = foods.find(food => food.position.x === head.x && food.position.y === head.y);
    
    if (!ateFood) {
      newSegments.pop();
    }

    return {
      ...snake,
      segments: newSegments,
      direction: direction as any,
      score: snake.score + (ateFood ? ateFood.value : 0)
    };
  }, [checkCollision]);

  const gameStep = useCallback(() => {
    setSnakes(currentSnakes => {
      console.log('Game step - current snakes:', currentSnakes.length);
      
      const aliveSnakes = currentSnakes.filter(snake => snake.isAlive);
      if (aliveSnakes.length === 0) {
        setGameOver(true);
        setGameRunning(false);
        return currentSnakes;
      }

      const newSnakes = currentSnakes.map(snake => {
        if (!snake.isAlive) return snake;
        
        const direction = snake.isPlayer 
          ? directionRef.current 
          : getAIDirection(snake, foods, currentSnakes);
        
        return moveSnake(snake, direction, foods, currentSnakes);
      });

      // Remove eaten food and generate new food
      setFoods(currentFoods => {
        let newFoods = [...currentFoods];
        newSnakes.forEach(snake => {
          const head = snake.segments[0];
          newFoods = newFoods.filter(food => 
            !(food.position.x === head.x && food.position.y === head.y)
          );
        });
        
        // Maintain more food on larger grid
        while (newFoods.length < 8) {
          newFoods.push(generateFood());
        }
        
        return newFoods;
      });

      return newSnakes;
    });
  }, [foods, moveSnake, getAIDirection, generateFood]);

  const startGame = useCallback(() => {
    console.log('Starting game, current snakes:', snakes.length);
    if (!gameRunning) {
      setGameRunning(true);
      gameLoopRef.current = setInterval(gameStep, GAME_SPEED);
    }
  }, [gameRunning, gameStep, snakes.length]);

  const pauseGame = useCallback(() => {
    setGameRunning(false);
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
  }, []);

  const resetGame = useCallback(() => {
    pauseGame();
    initializeGame();
  }, [pauseGame, initializeGame]);

  const changeDirection = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    const opposite = {
      up: 'down', down: 'up', left: 'right', right: 'left'
    };
    
    if (direction !== opposite[directionRef.current]) {
      directionRef.current = direction;
    }
  }, []);

  useEffect(() => {
    console.log('useSnakeGame mounted, initializing game');
    initializeGame();
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [initializeGame]);

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

  console.log('useSnakeGame render - snakes:', snakes.length, 'gameRunning:', gameRunning);

  return {
    snakes,
    foods,
    gameRunning,
    gameOver,
    startGame,
    pauseGame,
    resetGame,
    gridSize: GRID_SIZE
  };
};
