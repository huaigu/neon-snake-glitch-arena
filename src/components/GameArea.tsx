
import React from 'react';
import { Snake, Food, Segment } from '../hooks/useSnakeGame';

interface GameAreaProps {
  snakes: Snake[];
  foods: Food[];
  segments: Segment[];
  gridSize: number;
  isSpectator?: boolean;
}

export const GameArea: React.FC<GameAreaProps> = ({ 
  snakes, 
  foods, 
  segments, 
  gridSize,
  isSpectator = false 
}) => {
  const cellSize = 10;
  const boardWidth = gridSize * cellSize;
  const boardHeight = gridSize * cellSize;

  const currentPlayerSnake = snakes.find(snake => snake.isPlayer);
  
  const getVisibleElements = <T extends { position: { x: number; y: number } }>(elements: T[]): T[] => {
    if (isSpectator || !currentPlayerSnake || !currentPlayerSnake.isAlive) {
      return elements;
    }

    const visionRange = 10;
    const playerHead = currentPlayerSnake.segments[0];
    
    return elements.filter(element => {
      const distance = Math.abs(element.position.x - playerHead.x) + Math.abs(element.position.y - playerHead.y);
      return distance <= visionRange;
    });
  };

  const getVisibleSnakes = (): Snake[] => {
    if (isSpectator || !currentPlayerSnake || !currentPlayerSnake.isAlive) {
      return snakes;
    }

    const visionRange = 10;
    const playerHead = currentPlayerSnake.segments[0];
    
    return snakes.map(snake => {
      if (snake.isPlayer) {
        return snake;
      }
      
      const visibleSegments = snake.segments.filter(segment => {
        const distance = Math.abs(segment.x - playerHead.x) + Math.abs(segment.y - playerHead.y);
        return distance <= visionRange;
      });
      
      return {
        ...snake,
        segments: visibleSegments
      };
    });
  };

  const visibleFoods = getVisibleElements(foods);
  const visibleSegments = getVisibleElements(segments);
  const visibleSnakes = getVisibleSnakes();

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      {/* Outer container with enhanced boundary visualization */}
      <div className="relative p-4">
        {/* Animated boundary frame */}
        <div 
          className="absolute inset-0 rounded-lg"
          style={{
            background: `
              linear-gradient(45deg, transparent 30%, rgba(0, 255, 255, 0.1) 50%, transparent 70%),
              linear-gradient(-45deg, transparent 30%, rgba(0, 255, 255, 0.05) 50%, transparent 70%)
            `,
            border: '2px solid rgba(0, 255, 255, 0.6)',
            boxShadow: `
              0 0 20px rgba(0, 255, 255, 0.3),
              inset 0 0 20px rgba(0, 255, 255, 0.1),
              0 0 40px rgba(0, 255, 255, 0.2)
            `,
            animation: 'neon-pulse 3s ease-in-out infinite'
          }}
        />
        
        {/* Corner markers for better boundary definition */}
        <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-cyber-cyan animate-pulse" />
        <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-cyber-cyan animate-pulse" />
        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-cyber-cyan animate-pulse" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-cyber-cyan animate-pulse" />

        {/* Game board with enhanced visual references */}
        <div 
          className="relative bg-cyber-darker overflow-hidden"
          style={{ 
            width: boardWidth, 
            height: boardHeight,
            filter: isSpectator ? 'brightness(1.1) saturate(1.2)' : 'none',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '4px'
          }}
        >
          {/* Enhanced grid background with better visibility */}
          <div className="absolute inset-0">
            {/* Major grid lines every 5 cells for better reference */}
            {Array.from({ length: Math.floor(gridSize / 5) + 1 }).map((_, i) => (
              <React.Fragment key={`major-grid-${i}`}>
                {/* Vertical major grid lines */}
                <div
                  className="absolute bg-cyber-cyan/20"
                  style={{
                    left: i * 5 * cellSize,
                    top: 0,
                    width: '1px',
                    height: '100%',
                  }}
                />
                {/* Horizontal major grid lines */}
                <div
                  className="absolute bg-cyber-cyan/20"
                  style={{
                    left: 0,
                    top: i * 5 * cellSize,
                    width: '100%',
                    height: '1px',
                  }}
                />
              </React.Fragment>
            ))}
            
            {/* Minor grid lines */}
            {Array.from({ length: gridSize }).map((_, i) => (
              <div key={`row-${i}`}>
                {Array.from({ length: gridSize }).map((_, j) => (
                  <div
                    key={`cell-${i}-${j}`}
                    className="absolute border border-cyber-cyan/10"
                    style={{
                      left: j * cellSize,
                      top: i * cellSize,
                      width: cellSize,
                      height: cellSize,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Inner border gradient for movement reference */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                linear-gradient(to right, rgba(0, 255, 255, 0.15) 0%, transparent 10%, transparent 90%, rgba(0, 255, 255, 0.15) 100%),
                linear-gradient(to bottom, rgba(0, 255, 255, 0.15) 0%, transparent 10%, transparent 90%, rgba(0, 255, 255, 0.15) 100%)
              `
            }}
          />

          {/* Center reference point */}
          <div 
            className="absolute w-2 h-2 bg-cyber-cyan/30 rounded-full animate-pulse"
            style={{
              left: (gridSize / 2) * cellSize - 4,
              top: (gridSize / 2) * cellSize - 4,
            }}
          />

          {/* Quarter reference points */}
          <div 
            className="absolute w-1 h-1 bg-cyber-cyan/20 rounded-full"
            style={{
              left: (gridSize / 4) * cellSize,
              top: (gridSize / 4) * cellSize,
            }}
          />
          <div 
            className="absolute w-1 h-1 bg-cyber-cyan/20 rounded-full"
            style={{
              left: (gridSize * 3 / 4) * cellSize,
              top: (gridSize / 4) * cellSize,
            }}
          />
          <div 
            className="absolute w-1 h-1 bg-cyber-cyan/20 rounded-full"
            style={{
              left: (gridSize / 4) * cellSize,
              top: (gridSize * 3 / 4) * cellSize,
            }}
          />
          <div 
            className="absolute w-1 h-1 bg-cyber-cyan/20 rounded-full"
            style={{
              left: (gridSize * 3 / 4) * cellSize,
              top: (gridSize * 3 / 4) * cellSize,
            }}
          />

          {/* Fog of War Effect (only for non-spectators with living players) */}
          {!isSpectator && currentPlayerSnake && currentPlayerSnake.isAlive && (
            <div className="absolute inset-0 pointer-events-none">
              <div 
                className="absolute bg-black/60"
                style={{
                  left: 0,
                  top: 0,
                  right: 0,
                  bottom: 0,
                  mask: `radial-gradient(circle ${10 * cellSize}px at ${currentPlayerSnake.segments[0].x * cellSize + cellSize/2}px ${currentPlayerSnake.segments[0].y * cellSize + cellSize/2}px, transparent 70%, black 100%)`
                }}
              />
            </div>
          )}

          {/* Food */}
          {visibleFoods.map((food, index) => (
            <div
              key={`food-${index}`}
              className={`absolute rounded-full ${
                food.type === 'bonus' 
                  ? 'bg-cyber-yellow animate-pulse' 
                  : 'bg-cyber-green'
              }`}
              style={{
                left: food.position.x * cellSize + 2,
                top: food.position.y * cellSize + 2,
                width: cellSize - 4,
                height: cellSize - 4,
                boxShadow: isSpectator ? '0 0 8px currentColor' : '0 0 4px currentColor'
              }}
            />
          ))}

          {/* Power-up Segments */}
          {visibleSegments.map((segment) => (
            <div
              key={segment.id}
              className="absolute rounded animate-pulse"
              style={{
                left: segment.position.x * cellSize + 1,
                top: segment.position.y * cellSize + 1,
                width: cellSize - 2,
                height: cellSize - 2,
                backgroundColor: segment.color,
                boxShadow: isSpectator ? '0 0 8px currentColor' : '0 0 4px currentColor'
              }}
            />
          ))}

          {/* Snakes */}
          {visibleSnakes.map((snake) => (
            <div key={snake.id}>
              {snake.segments.map((segment, segmentIndex) => (
                <div
                  key={`${snake.id}-segment-${segmentIndex}`}
                  className={`absolute transition-all duration-150 ${
                    !snake.isAlive ? 'opacity-30' : ''
                  } ${snake.isSpectator ? 'animate-pulse' : ''}`}
                  style={{
                    left: segment.x * cellSize,
                    top: segment.y * cellSize,
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: snake.color,
                    border: segmentIndex === 0 ? '2px solid white' : 'none',
                    borderRadius: segmentIndex === 0 ? '50%' : '2px',
                    boxShadow: isSpectator ? '0 0 6px currentColor' : snake.isPlayer ? '0 0 4px currentColor' : 'none',
                    opacity: snake.isAlive ? 1 : 0.5,
                    zIndex: snake.isPlayer ? 10 : 5,
                    transform: segmentIndex === 0 ? 'scale(1.1)' : 'scale(1)'
                  }}
                />
              ))}
              
              {/* Spectator indicator for dead snakes */}
              {snake.isSpectator && !snake.isAlive && snake.segments.length > 0 && (
                <div
                  className="absolute text-xs text-cyber-cyan/70 font-bold pointer-events-none"
                  style={{
                    left: snake.segments[0].x * cellSize - 10,
                    top: snake.segments[0].y * cellSize - 20,
                    zIndex: 20
                  }}
                >
                  观察者
                </div>
              )}
            </div>
          ))}

          {/* Spectator Mode Visual Enhancement */}
          {isSpectator && (
            <div className="absolute inset-0 pointer-events-none border-2 border-cyber-cyan/50 rounded animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
};
