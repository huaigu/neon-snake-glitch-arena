
import React from 'react';
import { Snake, Food, Segment } from '../hooks/useSnakeGame';
import { useIsMobile } from '../hooks/use-mobile';

interface GameAreaProps {
  snakes: Snake[];
  foods: Food[];
  segments: Segment[];
  gridSize: number;
  cellSize: number;
  isSpectator?: boolean;
}

export const GameArea: React.FC<GameAreaProps> = ({ 
  snakes, 
  foods, 
  segments, 
  gridSize,
  cellSize,
  isSpectator = false 
}) => {
  const boardWidth = gridSize * cellSize;
  const boardHeight = gridSize * cellSize;
  const isMobile = useIsMobile();

  const currentPlayerSnake = snakes.find(snake => snake.isPlayer);
  
  // Vision range for fog of war
  const visionRange = Math.floor(gridSize * 0.25); // 25% of grid size
  
  // Debug boundary information
  React.useEffect(() => {
    console.log('GameArea: Render with gridSize:', gridSize, 'cellSize:', cellSize, 'boardSize:', boardWidth, 'x', boardHeight);
    console.log('GameArea: Valid coordinates are 0 to', gridSize - 1);
  }, [gridSize, cellSize, boardWidth, boardHeight]);
  
  const getVisibleElements = <T extends { position: { x: number; y: number } }>(elements: T[]): T[] => {
    if (isSpectator || !currentPlayerSnake || !currentPlayerSnake.isAlive) {
      return elements;
    }

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

  // Get segment size and animations based on type
  const getSegmentStyle = (segment: Segment) => {
    const baseSize = cellSize - 2;
    let size: number;
    let animationClass: string;
    
    switch (segment.type) {
      case 1:
        size = baseSize * 0.7; // 70% of cell size
        animationClass = 'animate-pulse';
        break;
      case 2:
        size = baseSize * 0.85; // 85% of cell size
        animationClass = 'animate-pulse';
        break;
      case 3:
        size = baseSize; // Full cell size
        animationClass = 'animate-pulse animate-bounce';
        break;
      default:
        size = baseSize;
        animationClass = 'animate-pulse';
    }
    
    const offset = (cellSize - size) / 2;
    
    return {
      size,
      offset,
      animationClass,
      fontSize: Math.max(6, size * 0.4)
    };
  };

  // Food is always visible
  const visibleFoods = foods;
  // Power segments affected by fog of war
  const visibleSegments = getVisibleElements(segments);
  const visibleSnakes = getVisibleSnakes();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-1 md:p-2">
      {/* Debug info overlay */}
      {false && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-black/80 text-white text-xs p-2 rounded z-50">
          <div>Grid: {gridSize}x{gridSize}</div>
          <div>Cell: {cellSize}px</div>
          <div>Board: {boardWidth}x{boardHeight}px</div>
          <div>Valid coords: 0 to {gridSize - 1}</div>
        </div>
      )}
      
      {/* PC Segment Legend - 移到游戏区域外部上方 */}
      {!isMobile && (
        <div className="mb-2 w-full flex justify-center">
          <div className="bg-cyber-darker/95 backdrop-blur-sm rounded-lg p-3 border border-cyber-cyan/50 neon-border">
            <div className="text-sm text-cyber-cyan font-bold mb-2 text-center">POWER-UP SEGMENTS</div>
            <div className="flex gap-4 justify-center">
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-sm flex items-center justify-center text-xs font-bold text-black animate-pulse"
                  style={{ backgroundColor: '#00ffff' }}
                >
                  1
                </div>
                <span className="text-sm text-cyber-green">+1 Length</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-5 h-5 rounded-sm flex items-center justify-center text-xs font-bold text-black animate-pulse"
                  style={{ backgroundColor: '#ffff00' }}
                >
                  2
                </div>
                <span className="text-sm text-cyber-green">+2 Length</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-5 h-5 rounded-sm flex items-center justify-center text-xs font-bold text-black animate-pulse animate-bounce"
                  style={{ backgroundColor: '#ff00ff' }}
                >
                  3
                </div>
                <span className="text-sm text-cyber-green">+3 Length</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Segment Legend - 在游戏区域外部上方，使用文字说明 */}
      {isMobile && (
        <div className="mb-1 w-full px-2">
          <div className="bg-cyber-darker/95 backdrop-blur-sm rounded px-3 py-2 border border-cyber-cyan/50">
            <div className="text-xs text-cyber-cyan font-bold mb-1 text-center">POWER-UPS</div>
            <div className="flex justify-between text-xs">
              <div className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded flex items-center justify-center text-xs font-bold text-black animate-pulse"
                  style={{ backgroundColor: '#00ffff', fontSize: '8px' }}
                >
                  1
                </div>
                <span className="text-cyber-green">Type 1: Adds 1 segment</span>
              </div>
              <div className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded flex items-center justify-center text-xs font-bold text-black animate-pulse"
                  style={{ backgroundColor: '#ffff00', fontSize: '8px' }}
                >
                  2
                </div>
                <span className="text-cyber-green">Type 2: Adds 2 segments</span>
              </div>
              <div className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded flex items-center justify-center text-xs font-bold text-black animate-pulse animate-bounce"
                  style={{ backgroundColor: '#ff00ff', fontSize: '8px' }}
                >
                  3
                </div>
                <span className="text-cyber-green">Type 3: Adds 3 segments</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Outer container with enhanced boundary visualization */}
      <div className="relative p-1 md:p-2">
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
        
        {/* Corner markers */}
        <div className="absolute -top-1 -left-1 w-4 h-4 md:w-6 md:h-6 border-l-2 border-t-2 md:border-l-4 md:border-t-4 border-cyber-cyan animate-pulse" />
        <div className="absolute -top-1 -right-1 w-4 h-4 md:w-6 md:h-6 border-r-2 border-t-2 md:border-r-4 md:border-t-4 border-cyber-cyan animate-pulse" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 md:w-6 md:h-6 border-l-2 border-b-2 md:border-l-4 md:border-b-4 border-cyber-cyan animate-pulse" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 md:w-6 md:h-6 border-r-2 border-b-2 md:border-r-4 md:border-b-4 border-cyber-cyan animate-pulse" />

        {/* Game board */}
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
          {/* Grid background */}
          <div className="absolute inset-0">
            {/* Major grid lines every 5 cells */}
            {Array.from({ length: Math.floor(gridSize / 5) + 1 }).map((_, i) => (
              <React.Fragment key={`major-grid-${i}`}>
                <div
                  className="absolute bg-cyber-cyan/20"
                  style={{
                    left: i * 5 * cellSize,
                    top: 0,
                    width: '1px',
                    height: '100%',
                  }}
                />
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
          </div>

          {/* Boundary warning indicators */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top boundary */}
            <div 
              className="absolute w-full bg-red-500/20 border-b border-red-500/50"
              style={{ height: cellSize, top: 0 }}
            />
            {/* Bottom boundary */}
            <div 
              className="absolute w-full bg-red-500/20 border-t border-red-500/50"
              style={{ height: cellSize, bottom: 0 }}
            />
            {/* Left boundary */}
            <div 
              className="absolute h-full bg-red-500/20 border-r border-red-500/50"
              style={{ width: cellSize, left: 0 }}
            />
            {/* Right boundary */}
            <div 
              className="absolute h-full bg-red-500/20 border-l border-red-500/50"
              style={{ width: cellSize, right: 0 }}
            />
          </div>

          {/* Center reference point */}
          <div 
            className="absolute w-1 h-1 md:w-2 md:h-2 bg-cyber-cyan/30 rounded-full animate-pulse"
            style={{
              left: (gridSize / 2) * cellSize - (cellSize < 8 ? 2 : 4),
              top: (gridSize / 2) * cellSize - (cellSize < 8 ? 2 : 4),
            }}
          />

          {/* Fog of War Effect */}
          {!isSpectator && currentPlayerSnake && currentPlayerSnake.isAlive && (
            <div className="absolute inset-0 pointer-events-none">
              <div 
                className="absolute bg-black/60"
                style={{
                  left: 0,
                  top: 0,
                  right: 0,
                  bottom: 0,
                  mask: `radial-gradient(circle ${visionRange * cellSize}px at ${currentPlayerSnake.segments[0].x * cellSize + cellSize/2}px ${currentPlayerSnake.segments[0].y * cellSize + cellSize/2}px, transparent 70%, black 100%)`
                }}
              />
            </div>
          )}

          {/* Food - always visible */}
          {visibleFoods.map((food, index) => (
            <div
              key={`food-${index}`}
              className={`absolute rounded-sm ${
                food.type === 'bonus' 
                  ? 'bg-yellow-400 animate-pulse' 
                  : 'bg-green-400'
              } snake-segment`}
              style={{
                left: food.position.x * cellSize + 1,
                top: food.position.y * cellSize + 1,
                width: cellSize - 2,
                height: cellSize - 2,
                boxShadow: isSpectator ? '0 0 8px currentColor' : '0 0 4px currentColor'
              }}
            />
          ))}

          {/* Power-up Segments with different sizes and animations */}
          {visibleSegments.map((segment) => {
            const segmentStyle = getSegmentStyle(segment);
            
            return (
              <div
                key={segment.id}
                className={`absolute snake-segment flex items-center justify-center ${segmentStyle.animationClass}`}
                style={{
                  left: segment.position.x * cellSize + segmentStyle.offset,
                  top: segment.position.y * cellSize + segmentStyle.offset,
                  width: segmentStyle.size,
                  height: segmentStyle.size,
                  backgroundColor: segment.color,
                  boxShadow: isSpectator ? '0 0 8px currentColor' : `0 0 ${4 + segment.type * 2}px currentColor`,
                  borderRadius: segment.type === 3 ? '4px' : '2px'
                }}
              >
                <span 
                  className="font-bold text-black"
                  style={{ 
                    fontSize: segmentStyle.fontSize + 'px',
                    lineHeight: '1'
                  }}
                >
                  {segment.type}
                </span>
              </div>
            );
          })}

          {/* Snakes */}
          {visibleSnakes.map((snake) => (
            <div key={snake.id}>
              {snake.segments.map((segment, segmentIndex) => {
                // Check if segment is out of bounds for debugging
                const isOutOfBounds = segment.x < 0 || segment.x >= gridSize || segment.y < 0 || segment.y >= gridSize;
                
                return (
                  <div
                    key={`${snake.id}-segment-${segmentIndex}`}
                    className={`absolute transition-all duration-150 snake-segment ${
                      !snake.isAlive ? 'opacity-30' : ''
                    } ${snake.isSpectator ? 'animate-pulse' : ''} ${
                      isOutOfBounds ? 'ring-2 ring-red-500' : ''
                    }`}
                    style={{
                      left: Math.max(0, Math.min(segment.x * cellSize, boardWidth - cellSize)),
                      top: Math.max(0, Math.min(segment.y * cellSize, boardHeight - cellSize)),
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: isOutOfBounds ? '#ff0000' : snake.color,
                      border: segmentIndex === 0 ? '2px solid white' : 'none',
                      borderRadius: segmentIndex === 0 ? '1px' : '0px',
                      boxShadow: isSpectator ? '0 0 6px currentColor' : snake.isPlayer ? '0 0 4px currentColor' : 'none',
                      opacity: snake.isAlive ? 1 : 0.5,
                      zIndex: snake.isPlayer ? 10 : 5,
                      transform: segmentIndex === 0 ? 'scale(1.05)' : 'scale(1)'
                    }}
                  />
                );
              })}
              
              {/* Spectator indicator */}
              {snake.isSpectator && !snake.isAlive && snake.segments.length > 0 && (
                <div
                  className="absolute text-xs text-cyber-cyan/70 font-bold pointer-events-none"
                  style={{
                    left: snake.segments[0].x * cellSize - 10,
                    top: snake.segments[0].y * cellSize - 20,
                    zIndex: 20
                  }}
                >
                  Spectator
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
