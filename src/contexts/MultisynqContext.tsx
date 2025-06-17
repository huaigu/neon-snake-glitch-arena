import React, { createContext, useContext, useState, useRef, ReactNode, useCallback } from 'react';
import * as Multisynq from '@multisynq/client';
import GameModel from '../models/GameModel';
import { GameView } from '../views/GameView';

interface MultisynqContextType {
  session: any | null;
  gameView: GameView | null;
  isConnected: boolean;
  isConnecting: boolean;
  joinSession: () => Promise<void>;
  leaveSession: () => void;
  error: string | null;
}

const MultisynqContext = createContext<MultisynqContextType | undefined>(undefined);

export const useMultisynq = () => {
  const context = useContext(MultisynqContext);
  if (!context) {
    throw new Error('useMultisynq must be used within a MultisynqProvider');
  }
  return context;
};

interface MultisynqProviderProps {
  children: ReactNode;
}

export const MultisynqProvider: React.FC<MultisynqProviderProps> = ({ children }) => {
  const [session, setSession] = useState<any | null>(null);
  const [gameView, setGameView] = useState<GameView | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const joinAttemptRef = useRef<Promise<void> | null>(null);

  const joinSession = useCallback(async () => {
    // 如果已经连接或正在连接，直接返回
    if (isConnected || isConnecting) {
      console.log('Already connected or connecting to Multisynq session');
      return;
    }

    // 如果已经有一个 join 请求在进行中，返回同一个 Promise
    if (joinAttemptRef.current) {
      console.log('Join session already in progress, waiting...');
      return joinAttemptRef.current;
    }

    // 创建新的 join Promise
    joinAttemptRef.current = (async () => {
      try {
        console.log('Starting to join Multisynq session...');
        setIsConnecting(true);
        setError(null);
        
        const newSession = await Multisynq.Session.join({
          apiKey: '2xcA0rsGvIAtP7cMpnboj1GiOVwN8YXr2trmiwtsrU',
          appId: 'io.multisynq.cyber-snake-arena.snakegame',
          model: GameModel,
          view: GameView,
          name: 'game-session',
          password: 'game-password'
        });

        // 创建 GameView 实例
        const newGameView = newSession.view as GameView;
        
        setSession(newSession);
        setGameView(newGameView);
        setIsConnected(true);
        setError(null);
        console.log('Successfully joined Multisynq session with GameModel and GameView');
      } catch (error) {
        console.error('Failed to join Multisynq session:', error);
        setIsConnected(false);
        setError(error instanceof Error ? error.message : 'Failed to connect');
      } finally {
        setIsConnecting(false);
        joinAttemptRef.current = null;
      }
    })();

    return joinAttemptRef.current;
  }, [isConnected, isConnecting]);

  const leaveSession = useCallback(() => {
    if (session) {
      try {
        session.leave();
        console.log('Left Multisynq session');
      } catch (error) {
        console.error('Error leaving session:', error);
      }
    }
    
    // 重置所有状态
    setSession(null);
    setGameView(null);
    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
    joinAttemptRef.current = null;
  }, [session]);

  return (
    <MultisynqContext.Provider value={{
      session,
      gameView,
      isConnected,
      isConnecting,
      joinSession,
      leaveSession,
      error
    }}>
      {children}
    </MultisynqContext.Provider>
  );
};
