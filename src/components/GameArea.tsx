
import React from 'react';
import { Snake, Food } from '../hooks/useSnakeGame';

interface GameAreaProps {
  snakes: Snake[];
  foods: Food[];
  gridSize: number;
}

export const GameArea: React.FC<GameAreaProps> = ({ snakes, foods, gridSize }) => {
  const cellSize = 18;
  const viewportSize = 30; // Show 30x30 area around player
  const containerSize = viewportSize * cellSize;
  
  // Minimap settings - show larger area around player
  const minimapSize = 120;
  const minimapViewRadius = 15; // Show 15x15 area around player (total 30x30 view)
  const minimapCellSize = minimapSize / (minimapViewRadius * 2);

  // Get player snake
  const playerSnake = snakes.find(snake => snake.isPlayer);
  const playerHead = playerSnake?.segments[0];

  // Calculate viewport bounds based on player position
  const getViewportBounds = () => {
    if (!playerHead) return { minX: 0, maxX: viewportSize, minY: 0, maxY: viewportSize };
    
    const centerX = playerHead.x;
    const centerY = playerHead.y;
    const halfViewport = Math.floor(viewportSize / 2);
    
    return {
      minX: Math.max(0, centerX - halfViewport),
      maxX: Math.min(gridSize, centerX - halfViewport + viewportSize),
      minY: Math.max(0, centerY - halfViewport),
      maxY: Math.min(gridSize, centerY - halfViewport + viewportSize)
    };
  };

  // Calculate minimap bounds based on player position
  const getMinimapBounds = () => {
    if (!playerHead) return { minX: 0, maxX: minimapViewRadius * 2, minY: 0, maxY: minimapViewRadius * 2 };
    
    const centerX = playerHead.x;
    const centerY = playerHead.y;
    
    return {
      minX: Math.max(0, centerX - minimapViewRadius),
      maxX: Math.min(gridSize, centerX + minimapViewRadius),
      minY: Math.max(0, centerY - minimapViewRadius),
      maxY: Math.min(gridSize, centerY + minimapViewRadius)
    };
  };

  const viewportBounds = getViewportBounds();
  const minimapBounds = getMinimapBounds();

  // Filter items that are within the viewport
  const getVisibleItems = () => {
    const visibleFoods = foods.filter(food => 
      food.position.x >= viewportBounds.minX && food.position.x < viewportBounds.maxX &&
      food.position.y >= viewportBounds.minY && food.position.y < viewportBounds.maxY
    );

    const visibleSnakeSegments = snakes.flatMap(snake => 
      snake.segments
        .filter(segment => 
          segment.x >= viewportBounds.minX && segment.x < viewportBounds.maxX &&
          segment.y >= viewportBounds.minY && segment.y < viewportBounds.maxY
        )
        .map((segment, index) => ({ snake, segment, segmentIndex: index }))
    );

    return { visibleFoods, visibleSnakeSegments };
  };

  // Filter items that are within the minimap view
  const getMinimapItems = () => {
    const visibleFoods = foods.filter(food => 
      food.position.x >= minimapBounds.minX && food.position.x < minimapBounds.maxX &&
      food.position.y >= minimapBounds.minY && food.position.y < minimapBounds.maxY
    );

    const visibleSnakeSegments = snakes.flatMap(snake => 
      snake.segments
        .filter(segment => 
          segment.x >= minimapBounds.minX && segment.x < minimapBounds.maxX &&
          segment.y >= minimapBounds.minY && segment.y < minimapBounds.maxY
        )
        .map((segment, index) => ({ snake, segment, segmentIndex: index }))
    );

    return { visibleFoods, visibleSnakeSegments };
  };

  const { visibleFoods, visibleSnakeSegments } = getVisibleItems();
  const { visibleFoods: minimapFoods, visibleSnakeSegments: minimapSnakeSegments } = getMinimapItems();

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="relative">
        {/* Game Title */}
        <div className="text-center mb-6">
          <h2 className="text-4xl font-bold text-cyber-cyan neon-text mb-2">
            NEON ARENA
          </h2>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
            <span>Grid: {gridSize}x{gridSize}</span>
            <span>•</span>
            <span>View: {viewportSize}x{viewportSize}</span>
            <span>•</span>
            <span>Players: {snakes.filter(s => s.isAlive).length}/{snakes.length}</span>
            <span>•</span>
            <span>Food: {foods.length}</span>
            {playerHead && (
              <>
                <span>•</span>
                <span>Pos: ({playerHead.x}, {playerHead.y})</span>
              </>
            )}
          </div>
        </div>

        {/* Game Board */}
        <div 
          className="relative game-area cyber-grid border-2 border-cyber-cyan/50 neon-border"
          style={{ 
            width: containerSize, 
            height: containerSize,
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.3), inset 0 0 20px rgba(0, 255, 255, 0.1)'
          }}
        >
          {/* Grid Lines */}
          <svg 
            className="absolute inset-0 pointer-events-none animate-grid-pulse"
            width={containerSize} 
            height={containerSize}
          >
            {/* Vertical lines */}
            {Array.from({ length: viewportSize + 1 }).map((_, i) => (
              <line
                key={`v-${i}`}
                x1={i * cellSize}
                y1={0}
                x2={i * cellSize}
                y2={containerSize}
                stroke="rgba(0, 255, 255, 0.2)"
                strokeWidth="0.5"
              />
            ))}
            {/* Horizontal lines */}
            {Array.from({ length: viewportSize + 1 }).map((_, i) => (
              <line
                key={`h-${i}`}
                x1={0}
                y1={i * cellSize}
                x2={containerSize}
                y2={i * cellSize}
                stroke="rgba(0, 255, 255, 0.2)"
                strokeWidth="0.5"
              />
            ))}
          </svg>

          {/* Enhanced Minimap - Larger Area */}
          <div 
            className="absolute top-4 right-4 border border-cyber-cyan/60 bg-black/80 backdrop-blur-sm rounded"
            style={{ 
              width: minimapSize, 
              height: minimapSize,
              boxShadow: '0 0 10px rgba(0, 255, 255, 0.4)'
            }}
          >
            {/* Minimap title */}
            <div className="absolute -top-6 left-0 text-xs text-cyber-cyan font-bold">
              TACTICAL RADAR
            </div>
            
            {/* Minimap grid */}
            <svg 
              className="absolute inset-0"
              width={minimapSize} 
              height={minimapSize}
            >
              {/* Grid lines */}
              {Array.from({ length: 16 }).map((_, i) => (
                <g key={i}>
                  <line
                    x1={0}
                    y1={i * (minimapSize / 15)}
                    x2={minimapSize}
                    y2={i * (minimapSize / 15)}
                    stroke="rgba(0, 255, 255, 0.3)"
                    strokeWidth="0.5"
                  />
                  <line
                    x1={i * (minimapSize / 15)}
                    y1={0}
                    x2={i * (minimapSize / 15)}
                    y2={minimapSize}
                    stroke="rgba(0, 255, 255, 0.3)"
                    strokeWidth="0.5"
                  />
                </g>
              ))}
            </svg>

            {/* Minimap food */}
            {minimapFoods.map((food, index) => (
              <div
                key={`minimap-food-${index}`}
                className="absolute rounded-full"
                style={{
                  left: (food.position.x - minimapBounds.minX) * minimapCellSize - 1,
                  top: (food.position.y - minimapBounds.minY) * minimapCellSize - 1,
                  width: 2,
                  height: 2,
                  backgroundColor: food.type === 'bonus' ? '#ff8000' : '#00ff41'
                }}
              />
            ))}

            {/* Minimap snakes */}
            {minimapSnakeSegments.map(({ snake, segment, segmentIndex }, index) => {
              const isHead = segmentIndex === 0;
              const isPlayer = snake.isPlayer;
              
              return (
                <div
                  key={`minimap-${snake.id}-${segmentIndex}-${index}`}
                  className="absolute"
                  style={{
                    left: (segment.x - minimapBounds.minX) * minimapCellSize - (isHead ? 1.5 : 1),
                    top: (segment.y - minimapBounds.minY) * minimapCellSize - (isHead ? 1.5 : 1),
                    width: isHead ? 3 : 2,
                    height: isHead ? 3 : 2,
                    backgroundColor: snake.color,
                    opacity: snake.isAlive ? (isPlayer ? 1 : 0.7) : 0.3,
                    borderRadius: isHead ? '50%' : '0%',
                    border: isPlayer && isHead ? `1px solid ${snake.color}` : 'none',
                    boxShadow: isPlayer && isHead ? `0 0 4px ${snake.color}` : 'none'
                  }}
                />
              );
            })}

            {/* Player center indicator */}
            {playerSnake && playerSnake.isAlive && playerHead && (
              <div 
                className="absolute animate-pulse"
                style={{
                  left: (playerHead.x - minimapBounds.minX) * minimapCellSize - 3,
                  top: (playerHead.y - minimapBounds.minY) * minimapCellSize - 3,
                  width: 6,
                  height: 6,
                  border: '1px solid #00ffff',
                  borderRadius: '50%',
                  backgroundColor: 'transparent'
                }}
              />
            )}

            {/* Center crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-4 h-4">
                <svg width="16" height="16" viewBox="0 0 16 16">
                  <line x1="8" y1="0" x2="8" y2="16" stroke="rgba(0, 255, 255, 0.5)" strokeWidth="1" />
                  <line x1="0" y1="8" x2="16" y2="8" stroke="rgba(0, 255, 255, 0.5)" strokeWidth="1" />
                </svg>
              </div>
            </div>

            {/* Viewport indicator */}
            <div 
              className="absolute border border-white/50"
              style={{
                left: (viewportBounds.minX - minimapBounds.minX) * minimapCellSize,
                top: (viewportBounds.minY - minimapBounds.minY) * minimapCellSize,
                width: (viewportBounds.maxX - viewportBounds.minX) * minimapCellSize,
                height: (viewportBounds.maxY - viewportBounds.minY) * minimapCellSize,
                pointerEvents: 'none'
              }}
            />
          </div>

          {/* Food Items */}
          {visibleFoods.map((food, index) => (
            <div
              key={index}
              className={`absolute food-item ${
                food.type === 'bonus' 
                  ? 'bg-cyber-orange border border-cyber-orange' 
                  : 'bg-cyber-green border border-cyber-green'
              }`}
              style={{
                left: (food.position.x - viewportBounds.minX) * cellSize + 2,
                top: (food.position.y - viewportBounds.minY) * cellSize + 2,
                width: cellSize - 4,
                height: cellSize - 4,
                color: food.type === 'bonus' ? '#ff8000' : '#00ff41'
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-black">
                {food.type === 'bonus' ? '★' : '•'}
              </div>
            </div>
          ))}

          {/* Snake Bodies */}
          {visibleSnakeSegments.map(({ snake, segment, segmentIndex }) => {
            const isHead = segmentIndex === 0;
            const opacity = snake.isAlive ? 1 : 0.3;
            
            return (
              <div
                key={`${snake.id}-${segmentIndex}`}
                className={`absolute snake-segment transition-all duration-150 ${
                  isHead ? 'animate-snake-move z-10' : ''
                }`}
                style={{
                  left: (segment.x - viewportBounds.minX) * cellSize + 1,
                  top: (segment.y - viewportBounds.minY) * cellSize + 1,
                  width: cellSize - 2,
                  height: cellSize - 2,
                  backgroundColor: snake.color,
                  opacity,
                  color: snake.color,
                  transform: isHead ? 'scale(1.1)' : 'scale(1)',
                  border: isHead ? `2px solid ${snake.color}` : `1px solid ${snake.color}`
                }}
              >
                {/* Snake Head Eyes */}
                {isHead && snake.isAlive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                    </div>
                  </div>
                )}
                
                {/* Segment Index for debugging */}
                {segmentIndex === 0 && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-white bg-black/50 px-1 rounded">
                    {snake.name.slice(0, 3)}
                  </div>
                )}
              </div>
            );
          })}

          {/* Game Over Overlay */}
          {snakes.every(snake => !snake.isAlive) && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-6xl font-bold text-cyber-pink neon-text mb-4">GAME OVER</h3>
                <p className="text-xl text-cyber-cyan">All snakes have been terminated</p>
              </div>
            </div>
          )}
        </div>

        {/* Game Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          {snakes.slice(0, 3).map((snake) => (
            <div key={snake.id} className="cyber-panel p-3 rounded">
              <div 
                className="w-4 h-4 rounded mx-auto mb-2 snake-segment"
                style={{ backgroundColor: snake.color, color: snake.color }}
              ></div>
              <div className="text-xs text-gray-300">{snake.name}</div>
              <div className="text-lg font-bold" style={{ color: snake.color }}>
                {snake.score}
              </div>
              <div className={`text-xs ${snake.isAlive ? 'text-cyber-green' : 'text-cyber-pink'}`}>
                {snake.isAlive ? 'ACTIVE' : 'TERMINATED'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
