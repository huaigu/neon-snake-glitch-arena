
import React from 'react';
import { Snake, Food } from '../hooks/useSnakeGame';

interface GameAreaProps {
  snakes: Snake[];
  foods: Food[];
  gridSize: number;
}

export const GameArea: React.FC<GameAreaProps> = ({ snakes, foods, gridSize }) => {
  const cellSize = 18;
  const containerSize = gridSize * cellSize;

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
            <span>Players: {snakes.filter(s => s.isAlive).length}/{snakes.length}</span>
            <span>•</span>
            <span>Food: {foods.length}</span>
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
            {Array.from({ length: gridSize + 1 }).map((_, i) => (
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
            {Array.from({ length: gridSize + 1 }).map((_, i) => (
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

          {/* Food Items */}
          {foods.map((food, index) => (
            <div
              key={index}
              className={`absolute food-item ${
                food.type === 'bonus' 
                  ? 'bg-cyber-orange border border-cyber-orange' 
                  : 'bg-cyber-green border border-cyber-green'
              }`}
              style={{
                left: food.position.x * cellSize + 2,
                top: food.position.y * cellSize + 2,
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
          {snakes.map((snake) => 
            snake.segments.map((segment, segmentIndex) => {
              const isHead = segmentIndex === 0;
              const opacity = snake.isAlive ? 1 : 0.3;
              
              return (
                <div
                  key={`${snake.id}-${segmentIndex}`}
                  className={`absolute snake-segment transition-all duration-150 ${
                    isHead ? 'animate-snake-move z-10' : ''
                  }`}
                  style={{
                    left: segment.x * cellSize + 1,
                    top: segment.y * cellSize + 1,
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
            })
          )}

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
