
import React from 'react';
import { Snake, Food } from '../hooks/useSnakeGame';
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
  gridSize?: number; // 可选，主要用于向后兼容
  cellSize?: number; // 可选，主要用于向后兼容
  isSpectator?: boolean;
  countdown?: number;
  showCountdown?: boolean;
}

export const GameArea: React.FC<GameAreaProps> = ({ 
  snakes, 
  foods, 
  isSpectator = false,
  countdown = 0,
  showCountdown = false
}) => {
  const isMobile = useIsMobile();
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // 使用动态网格计算hook
  const { gridSize, cellSize } = useResponsiveGrid(containerRef);

  // 移动端触摸事件处理
  React.useEffect(() => {
    if (isMobile && containerRef.current) {
      const gameContainer = containerRef.current;
      
      const handleTouchEvent = (e: TouchEvent) => {
        // 只阻止默认的滚动行为，但不阻止事件传播，让滑动控制能正常工作
        e.preventDefault();
      };

      // 只添加touchmove事件来阻止滚动，保持touchstart和touchend的传播
      gameContainer.addEventListener('touchmove', handleTouchEvent, { passive: false });

      return () => {
        gameContainer.removeEventListener('touchmove', handleTouchEvent);
      };
    }
  }, [isMobile]);

  // 计算游戏板尺寸
  const boardWidth = gridSize * cellSize;
  const boardHeight = gridSize * cellSize;

  // 只在debug模式下输出尺寸信息，避免频繁渲染日志
  // console.log('GameArea 最终尺寸 :', {
  //   gridSize,
  //   cellSize,
  //   boardSize: `${boardWidth}x${boardHeight}`,
  //   isMobile
  // });

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

  // Food is always visible
  const visibleFoods = foods;
  const visibleSnakes = getVisibleSnakes();

    return (
    <div 
      ref={containerRef}
      className={`flex-1 flex flex-col items-center justify-center overflow-hidden ${
        isMobile ? 'px-1 py-2' : 'p-2'
      }`}
      style={isMobile ? {
        touchAction: 'pan-y', // 允许垂直滑动但防止水平滚动
        overscrollBehavior: 'none',
        WebkitOverflowScrolling: 'auto'
      } : {}}
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
          {visibleFoods.map((food, index) => {
            // 根据食物等级确定颜色和效果
            let foodClass = '';
            let foodColor = '';
            let glow = '';
            
            switch (food.level) {
              case 1:
                foodClass = 'bg-green-400';
                foodColor = '#4ade80';
                glow = '0 0 4px #4ade80';
                break;
              case 2:
                foodClass = 'bg-blue-400 animate-pulse';
                foodColor = '#60a5fa';
                glow = '0 0 6px #60a5fa';
                break;
              case 3:
                foodClass = 'bg-yellow-400 animate-pulse animate-bounce';
                foodColor = '#facc15';
                glow = '0 0 8px #facc15, 0 0 12px #facc15';
                break;
              default:
                foodClass = 'bg-green-400';
                foodColor = '#4ade80';
                glow = '0 0 4px #4ade80';
            }
            
            return (
              <div
                key={`food-${index}`}
                className={`absolute rounded-sm ${foodClass} snake-segment flex items-center justify-center`}
                style={{
                  left: food.position.x * cellSize + 1,
                  top: food.position.y * cellSize + 1,
                  width: cellSize - 2,
                  height: cellSize - 2,
                  boxShadow: isSpectator ? `0 0 12px ${foodColor}` : glow
                }}
              >
                {/* 显示食物等级 */}
                {food.level > 1 && (
                  <span 
                    className="text-black font-bold text-xs"
                    style={{ 
                      fontSize: Math.max(6, cellSize * 0.3) + 'px',
                      lineHeight: '1'
                    }}
                  >
                    {food.level}
                  </span>
                )}
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
                
                // NFT蛇的第一个身体部分显示皇冠，其他部分正常显示
                const isNFTHead = snake.hasNFT && segmentIndex === 0;
                  
                return (
                  <div
                    key={`${snake.id}-segment-${segmentIndex}`}
                    className={`absolute transition-all duration-150 snake-segment flex items-center justify-center ${
                      !snake.isAlive ? 'opacity-30' : ''
                    } ${snake.isSpectator ? 'animate-pulse' : ''} ${
                      isOutOfBounds ? 'ring-2 ring-red-500' : ''
                    } ${snake.hasNFT ? 'animate-pulse' : ''}`} // NFT蛇添加脉冲动画
                    style={{
                      left: Math.max(0, Math.min(segment.x * cellSize, boardWidth - cellSize)),
                      top: Math.max(0, Math.min(segment.y * cellSize, boardHeight - cellSize)),
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: isOutOfBounds ? '#ff0000' : (isNFTHead ? 'transparent' : segmentColor),
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
                  >
                    {/* NFT蛇的第一个部分显示皇冠emoji */}
                    {isNFTHead && (
                      <span 
                        className="text-lg font-bold animate-pulse"
                        style={{
                          fontSize: Math.max(8, cellSize * 0.8) + 'px',
                          lineHeight: '1',
                          color: '#FFD700',
                          textShadow: '0 0 4px rgba(255, 215, 0, 0.8)',
                          filter: 'drop-shadow(0 0 2px rgba(255, 215, 0, 0.6))'
                        }}
                      >
                        👑
                      </span>
                    )}
                  </div>
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

          {/* Circular Countdown Timer */}
          {showCountdown && countdown > 0 && (
            <div 
              className="absolute flex items-center justify-center pointer-events-none"
              style={{
                left: (gridSize / 2) * cellSize - 40,
                top: (gridSize / 2) * cellSize - 40,
                zIndex: 50
              }}
            >
              {/* 圆形背景 */}
              <div 
                className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center border-4"
                style={{
                  backgroundColor: 'rgba(0, 255, 255, 0.1)', // 浅青色背景
                  borderColor: 'rgba(0, 255, 255, 0.6)',
                  boxShadow: `
                    0 0 20px rgba(0, 255, 255, 0.3),
                    inset 0 0 20px rgba(0, 255, 255, 0.1)
                  `,
                  backdropFilter: 'blur(2px)',
                  animation: 'neon-pulse 1s ease-in-out infinite'
                }}
              >
                {/* 倒计时数字 */}
                <span 
                  className="font-bold text-white"
                  style={{
                    fontSize: isMobile ? '24px' : '32px',
                    textShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
                    color: '#00ffff'
                  }}
                >
                  {countdown}
                </span>
              </div>
            </div>
          )}

          {/* Spectator Mode Visual Enhancement */}
          {isSpectator && (
            <div className="absolute inset-0 pointer-events-none border-2 border-cyber-cyan/50 rounded animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
};
