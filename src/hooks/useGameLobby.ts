
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameContext, Player } from '../contexts/GameContext';

export const useGameLobby = () => {
  const navigate = useNavigate();
  const { players, setPlayers, currentPlayerId } = useGameContext();

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  
  const toggleReady = useCallback(() => {
    setPlayers(prev => prev.map(player => 
      player.id === currentPlayerId 
        ? { ...player, isReady: !player.isReady }
        : player
    ));
  }, [setPlayers, currentPlayerId]);

  const canStartGame = players.length >= 2 && players.every(p => p.isReady);

  const handleAutoStart = useCallback(() => {
    if (canStartGame) {
      navigate('/game');
    }
  }, [canStartGame, navigate]);

  return {
    players,
    currentPlayer,
    canStartGame,
    toggleReady,
    handleAutoStart
  };
};
