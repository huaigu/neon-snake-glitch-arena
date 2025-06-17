
import React, { createContext, useContext, useState, ReactNode } from 'react';
import * as Multisynq from '@multisynq/client';
import { LobbyModel } from '../models/LobbyModel';

interface MultisynqContextType {
  session: any | null;
  isConnected: boolean;
  joinSession: () => Promise<void>;
  leaveSession: () => void;
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
  const [isConnected, setIsConnected] = useState(false);

  const joinSession = async () => {
    try {
      console.log('Joining Multisynq session...');
      
      const newSession = await Multisynq.Session.join({
        apiKey: '234567_Paste_Your_Own_API_Key_Here_7654321',
        appId: 'io.multisynq.cyber-snake-arena',
        model: LobbyModel,
        name: 'lobby-session',
        password: 'lobby-password'
      });

      setSession(newSession);
      setIsConnected(true);
      console.log('Successfully joined Multisynq session');
    } catch (error) {
      console.error('Failed to join Multisynq session:', error);
      setIsConnected(false);
    }
  };

  const leaveSession = () => {
    if (session) {
      session.leave();
      setSession(null);
      setIsConnected(false);
      console.log('Left Multisynq session');
    }
  };

  return (
    <MultisynqContext.Provider value={{
      session,
      isConnected,
      joinSession,
      leaveSession
    }}>
      {children}
    </MultisynqContext.Provider>
  );
};
