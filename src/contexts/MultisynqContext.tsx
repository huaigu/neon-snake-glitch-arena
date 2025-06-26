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
        
        // 尝试从存储中恢复之前的会话数据
        const savedSessionData = localStorage.getItem('multisynq-session-data');
        const sessionOptions = {
          apiKey: '2xcA0rsGvIAtP7cMpnboj1GiOVwN8YXr2trmiwtsrU',
          appId: 'io.multisynq.cyber-snake-arena.game',
          model: GameModel,
          view: GameView,
          name: 'game-session',
          password: 'game-password',
          fromSaveData: undefined as unknown
        };

        // 如果有保存的会话数据，使用fromSaveData恢复
        if (savedSessionData) {
          try {
            const parsedData = JSON.parse(savedSessionData);
            (sessionOptions as any).fromSaveData = parsedData;
            console.log('MultisynqContext: Restoring session from saved data', {
              dataSize: savedSessionData.length,
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            console.warn('MultisynqContext: Failed to parse saved session data, starting fresh:', error);
            localStorage.removeItem('multisynq-session-data');
          }
        }

        const newSession = await Multisynq.Session.join(sessionOptions);

        // 创建 GameView 实例
        const newGameView = newSession.view as GameView;
        
        console.log('MultisynqContext: New GameView instance created, callbacks need to be re-registered', {
          newGameViewInstance: !!newGameView,
          timestamp: new Date().toISOString()
        });
        
        setSession(newSession);
        setGameView(newGameView);
        setIsConnected(true);
        setError(null);
        
        console.log('Successfully joined Multisynq session with GameModel and GameView');
        
        // 立即触发一个自定义事件，通知需要重新设置callbacks
        // 这样可以避免等待React渲染周期
        setTimeout(() => {
          console.log('🚀 MultisynqContext: Dispatching multisynq-gameview-ready event');
          window.dispatchEvent(new CustomEvent('multisynq-gameview-ready', {
            detail: { gameView: newGameView }
          }));
        }, 0);
        
        // 额外的强制callback重设机制 - 延迟一点再触发一次
        setTimeout(() => {
          console.log('🚀 MultisynqContext: Dispatching delayed multisynq-gameview-ready event (backup)');
          window.dispatchEvent(new CustomEvent('multisynq-gameview-ready', {
            detail: { gameView: newGameView }
          }));
        }, 100);
        
        // 设置页面卸载时自动保存会话数据
        const handleBeforeUnload = () => {
          if (newSession && (newSession as any).saveSession && typeof (newSession as any).saveSession === 'function') {
            try {
              const sessionData = (newSession as any).saveSession();
              localStorage.setItem('multisynq-session-data', JSON.stringify(sessionData));
              console.log('MultisynqContext: Session data auto-saved on page unload');
            } catch (error) {
              console.error('MultisynqContext: Failed to auto-save session data:', error);
            }
          }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        
        // 注册清理函数到组件卸载时执行
        const cleanup = () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
        };
        
        // 将清理函数存储到session对象以便后续调用
        (newSession as any)._cleanup = cleanup;
        
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
        // 在离开会话前保存数据以实现持久化
        if ((session as any).saveSession && typeof (session as any).saveSession === 'function') {
          const sessionData = (session as any).saveSession();
          localStorage.setItem('multisynq-session-data', JSON.stringify(sessionData));
          console.log('MultisynqContext: Session data saved for persistence', {
            dataSize: JSON.stringify(sessionData).length,
            timestamp: new Date().toISOString()
          });
        }
        
        // 清理beforeunload事件监听器
        if ((session as any)._cleanup && typeof (session as any)._cleanup === 'function') {
          (session as any)._cleanup();
        }
        
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
