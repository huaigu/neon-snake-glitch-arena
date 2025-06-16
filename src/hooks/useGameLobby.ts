
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameContext, Player } from '../contexts/GameContext';

const BOT_NAMES = [
  'NEON_HUNTER',
  'CYBER_VIPER', 
  'DIGITAL_SNAKE',
  'MATRIX_CRAWLER',
  'BINARY_SERPENT',
  'QUANTUM_COIL',
  'ELECTRIC_EEL'
];

const BOT_COLORS = [
  '#ff0080',
  '#8000ff', 
  '#00ff41',
  '#ff8000',
  '#0080ff',
  '#ff4000',
  '#40ff00'
];

export const useGameLobby = () => {
  const navigate = useNavigate();
  const { players, setPlayers, currentPlayerId } = useGameContext();
  const [isGameStarting, setIsGameStarting] = useState(false);

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  
  const toggleReady = useCallback(() => {
    setPlayers(prev => prev.map(player => 
      player.id === currentPlayerId 
        ? { ...player, isReady: !player.isReady }
        : player
    ));
  }, [setPlayers, currentPlayerId]);

  const addBot = useCallback(() => {
    if (players.length >= 8) return;

    const botIndex = players.filter(p => p.isBot).length;
    if (botIndex >= BOT_NAMES.length) return;

    const newBot: Player = {
      id: `bot_${botIndex}`,
      name: BOT_NAMES[botIndex],
      color: BOT_COLORS[botIndex],
      isReady: true, // Bots are always ready
      isBot: true
    };

    setPlayers(prev => [...prev, newBot]);
  }, [players, setPlayers]);

  const removeBot = useCallback(() => {
    setPlayers(prev => {
      // Replace findLastIndex with a compatible approach
      let botIndex = -1;
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].isBot) {
          botIndex = i;
          break;
        }
      }
      if (botIndex === -1) return prev;
      return prev.filter((_, index) => index !== botIndex);
    });
  }, [setPlayers]);

  const canStartGame = players.length >= 2 && players.every(p => p.isReady);

  const startGame = useCallback(() => {
    if (!canStartGame) return;
    
    setIsGameStarting(true);
    
    // Simulate loading time
    setTimeout(() => {
      navigate('/game');
    }, 2000);
  }, [canStartGame, navigate]);

  // Auto-fill with bots to make testing easier
  useEffect(() => {
    if (players.length === 1 && players[0].id === currentPlayerId) {
      // Add 3 bots by default for testing
      for (let i = 0; i < 3; i++) {
        setTimeout(() => addBot(), 100 * (i + 1));
      }
    }
  }, [players.length, addBot, currentPlayerId]);

  return {
    players,
    currentPlayer,
    isGameStarting,
    canStartGame,
    toggleReady,
    startGame,
    addBot,
    removeBot
  };
};
