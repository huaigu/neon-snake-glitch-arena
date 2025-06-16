
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Player {
  id: string;
  name: string;
  color: string;
  isReady: boolean;
  isBot: boolean;
}

interface GameContextType {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  currentPlayerId: string;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  // Initialize with current player immediately
  const [players, setPlayers] = useState<Player[]>(() => {
    const currentPlayer: Player = {
      id: 'player',
      name: 'PLAYER_01',
      color: '#00ffff',
      isReady: false,
      isBot: false
    };
    return [currentPlayer];
  });

  const currentPlayerId = 'player';

  return (
    <GameContext.Provider value={{ players, setPlayers, currentPlayerId }}>
      {children}
    </GameContext.Provider>
  );
};
