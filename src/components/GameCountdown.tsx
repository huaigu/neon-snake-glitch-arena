
import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';

interface GameCountdownProps {
  onCountdownEnd: () => void;
}

export const GameCountdown: React.FC<GameCountdownProps> = ({ onCountdownEnd }) => {
  const [count, setCount] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prevCount) => {
        if (prevCount <= 1) {
          clearInterval(timer);
          onCountdownEnd();
          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onCountdownEnd]);

  return (
    <div className="min-h-screen bg-cyber-darker flex items-center justify-center">
      <Card className="cyber-panel p-12 text-center">
        <h1 className="text-4xl font-bold text-cyber-cyan neon-text mb-8">
          GAME STARTING
        </h1>
        <div className="text-8xl font-bold text-cyber-green neon-text animate-pulse">
          {count}
        </div>
        <p className="text-cyber-cyan/70 mt-4">
          Get ready to play!
        </p>
      </Card>
    </div>
  );
};
