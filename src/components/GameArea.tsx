import React from 'react';
import { Snake, Food, Segment } from '../hooks/useSnakeGame';
import { useIsMobile } from '../hooks/use-mobile';
import { useResponsiveGrid } from '../hooks/useResponsiveGrid';

// 生成五彩蛇的颜色
const generateRainbowColor = (segmentIndex: number, snakeId: string): string => {
  // 基础彩虹色调数组
  const rainbowHues = [
    '#FF0080', // 洋红
    '#FF4000', // 红橙
    '#FF8000', // 橙色
    '#FFFF00', // 黄色
    '#80FF00', // 黄绿
    '#00FF80', // 绿色
    '#00FFFF', // 青色
    '#0080FF', // 蓝色
    '#8000FF', // 紫色
    '#FF00FF', // 品红
  ];
  
  // 使用snake ID和segment索引创建伪随机种子
  const seed = snakeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + segmentIndex;
  
  // 为每个segment选择颜色
  const colorIndex = (seed + segmentIndex * 3) % rainbowHues.length;
  return rainbowHues[colorIndex];
};

interface GameAreaProps {
  snakes: Snake[];
  foods: Food[];
  segments: Segment[];
  gridSize?: number; // 可选，主要用于向后兼容
  cellSize?: number; // 可选，主要用于向后兼容
  isSpectator?: boolean;
}

export const GameArea: React.FC<GameAreaProps> = ({ 
  snakes, 
  foods, 
  segments, 
  isSpectator = false 
}) => {
  const isMobile = useIsMobile();
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // 使用动态网格计算hook
  const { gridSize, cellSize } = useResponsiveGrid(containerRef);

  // 计算游戏板尺寸
  const boardWidth = gridSize * cellSize;
  const boardHeight = gridSize * cellSize;

  console.log('GameArea 最终尺寸 :', {
    gridSize,
    cellSize,
    boardSize: `${boardWidth}x${boardHeight}`,
    isMobile
  });

  const currentPlayerSnake = snakes.find(snake => snake.isPlayer);
  
  // Vision range for fog of war
  const visionRange = Math.floor(gridSize * 0.25); // 25% of grid size
  
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
    <div 
      ref={containerRef}
      className={`flex-1 flex flex-col items-center justify-center overflow-hidden ${
        isMobile ? 'px-1 py-2' : 'p-2'
      }`}
    >
      {/* Outer container with enhanced boundary visualization - 最大化利用空间 */}
      <div className={`relative flex items-center justify-center ${
        isMobile ? 'w-full max-w-full' : 'h-full max-h-full'
      }`}>
        {/* Animated boundary frame - 唯一的游戏边框 */}
        <div 
          className="absolute inset-0 rounded-lg p-2 m-2"
          style={{
            background: `
              linear-gradient(45deg, transparent 30%, rgba(0, 255, 255, 0.1) 50%, transparent 70%),
              linear-gradient(-45deg, transparent 30%, rgba(0, 255, 255, 0.05) 50%, transparent 70%)
            `,
            border: '2px solid rgba(0, 255, 255, 0.8)',
            boxShadow: `
              0 0 25px rgba(0, 255, 255, 0.4),
              inset 0 0 25px rgba(0, 255, 255, 0.15),
              0 0 50px rgba(0, 255, 255, 0.25)
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
            filter: isSpectator ? 'brightness(1.1) saturate(1.2)' : 'none'
          }}
        >
          {/* Grid background */}
          <div className="absolute inset-0">
            {/* Major grid lines every 5 cells */}
            {Array.from({ length: Math.floor(gridSize / 5) + 1 }).map((_, i) => (
              <div key={`major-grid-${i}`}>
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
              </div>
            ))}
          </div>

          {/* Boundary warning indicators - 改为完整边框 */}
          <div 
            className="absolute inset-0 pointer-events-none border-2 border-red-500/60"
            style={{
              borderWidth: `${Math.max(2, Math.floor(cellSize / 4))}px`,
              background: `
                linear-gradient(to bottom, rgba(239, 68, 68, 0.2) 0%, transparent ${cellSize}px),
                linear-gradient(to top, rgba(239, 68, 68, 0.2) 0%, transparent ${cellSize}px),
                linear-gradient(to right, rgba(239, 68, 68, 0.2) 0%, transparent ${cellSize}px),
                linear-gradient(to left, rgba(239, 68, 68, 0.2) 0%, transparent ${cellSize}px)
              `
            }}
          />

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
                
                // 为NFT持有者生成五彩颜色，否则使用原始颜色
                const segmentColor = snake.hasNFT 
                  ? generateRainbowColor(segmentIndex, snake.id)
                  : snake.color;
                  
                return (
                  <div
                    key={`${snake.id}-segment-${segmentIndex}`}
                    className={`absolute transition-all duration-150 snake-segment ${
                      !snake.isAlive ? 'opacity-30' : ''
                    } ${snake.isSpectator ? 'animate-pulse' : ''} ${
                      isOutOfBounds ? 'ring-2 ring-red-500' : ''
                    } ${snake.hasNFT ? 'animate-pulse' : ''}`} // NFT蛇添加脉冲动画
                    style={{
                      left: Math.max(0, Math.min(segment.x * cellSize, boardWidth - cellSize)),
                      top: Math.max(0, Math.min(segment.y * cellSize, boardHeight - cellSize)),
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: isOutOfBounds ? '#ff0000' : segmentColor,
                      border: segmentIndex === 0 ? '2px solid white' : 'none',
                      borderRadius: segmentIndex === 0 ? '1px' : '0px',
                      boxShadow: isSpectator 
                        ? '0 0 6px currentColor' 
                        : snake.isPlayer 
                          ? (snake.hasNFT ? '0 0 8px currentColor, 0 0 12px rgba(255, 255, 255, 0.3)' : '0 0 4px currentColor')
                          : snake.hasNFT 
                            ? '0 0 6px currentColor' 
                            : 'none',
                      opacity: snake.isAlive ? 1 : 0.5,
                      zIndex: snake.isPlayer ? 10 : 5,
                      transform: segmentIndex === 0 ? 'scale(1.05)' : 'scale(1)'
                    }}
                  />
                );
              })}
              
              {/* NFT Crown indicator for rainbow snakes */}
              {snake.hasNFT && snake.segments.length > 0 && (
                <div
                  className="absolute text-xs font-bold pointer-events-none animate-bounce"
                  style={{
                    left: snake.segments[0].x * cellSize + cellSize / 2 - 6,
                    top: snake.segments[0].y * cellSize - 15,
                    zIndex: 20,
                    color: '#FFD700',
                    animation: 'crown-glow 1.5s ease-in-out infinite, bounce 2s infinite'
                  }}
                >
                  👑
                </div>
              )}
              
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
