
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWeb3Auth } from './Web3AuthContext';
import { useMultisynq } from './MultisynqContext';
import { Room } from '../models/GameModel';

interface RoomContextType {
  rooms: Room[];
  currentRoom: Room | null;
  setCurrentRoom: React.Dispatch<React.SetStateAction<Room | null>>;
  currentPlayerName: string;
  setCurrentPlayerName: React.Dispatch<React.SetStateAction<string>>;
  createRoom: (roomName: string) => Promise<string | null>;
  joinRoom: (roomId: string) => boolean;
  leaveRoom: () => void;
  setPlayerReady: (roomId: string, playerAddress: string, isReady: boolean) => void;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  connectedPlayersCount: number;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const useRoomContext = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoomContext must be used within a RoomProvider');
  }
  return context;
};

interface RoomProviderProps {
  children: ReactNode;
}

export const RoomProvider: React.FC<RoomProviderProps> = ({ children }) => {
  const { gameView, isConnected } = useMultisynq();
  const { user } = useWeb3Auth();
  
  // 状态管理
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentPlayerName, setCurrentPlayerName] = useState('PLAYER_01');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedPlayersCount, setConnectedPlayersCount] = useState(0);

  // 从用户地址生成显示名称
  useEffect(() => {
    if (user?.address) {
      const shortAddress = `${user.address.slice(0, 6)}...${user.address.slice(-4)}`;
      setCurrentPlayerName(user.username || shortAddress);
    }
  }, [user]);

  // 设置 GameView 回调函数（只设置一次）
  useEffect(() => {
    if (!gameView || !isConnected) {
      return;
    }

    console.log('RoomContext: Setting up GameView lobby callback');
    
    // 设置大厅回调函数
    const lobbyCallback = (lobbyData: { rooms: Room[]; connectedPlayers: number }) => {
      console.log('RoomContext: Received lobby data from GameView:', {
        roomsCount: lobbyData.rooms.length,
        connectedPlayers: lobbyData.connectedPlayers,
        rooms: lobbyData.rooms.map(r => ({
          id: r.id,
          name: r.name,
          playersCount: r.players.length,
          players: r.players.map(p => ({ name: p.name, isReady: p.isReady, address: p.address }))
        }))
      });
      
      setRooms(lobbyData.rooms);
      setConnectedPlayersCount(lobbyData.connectedPlayers);
    };
    
    gameView.setLobbyCallback(lobbyCallback);

    // 获取初始数据
    if (gameView.model) {
      console.log('RoomContext: Setting initial data from GameView model');
      const initialRooms = gameView.model.rooms || [];
      const initialConnectedCount = gameView.model.connectedPlayers?.size || 0;
      
      console.log('RoomContext: Initial rooms data:', {
        roomsCount: initialRooms.length,
        rooms: initialRooms.map(r => ({
          id: r.id,
          name: r.name,
          playersCount: r.players.length,
          players: r.players.map(p => ({ name: p.name, isReady: p.isReady, address: p.address }))
        }))
      });
      
      setRooms(initialRooms);
      setConnectedPlayersCount(initialConnectedCount);
    }

    return () => {
      console.log('RoomContext: Cleaning up GameView callbacks');
      // 清理回调函数
      gameView.setLobbyCallback(() => {});
    };
  }, [gameView, isConnected]);

  // 更新当前房间
  useEffect(() => {
    setCurrentRoom(prevCurrentRoom => {
      if (prevCurrentRoom) {
        const updatedRoom = rooms.find(r => r.id === prevCurrentRoom.id);
        if (updatedRoom) {
          console.log('RoomContext: Updating current room with new data:', {
            roomId: prevCurrentRoom.id,
            oldPlayersCount: prevCurrentRoom.players.length,
            newPlayersCount: updatedRoom.players.length,
            oldPlayersData: prevCurrentRoom.players.map(p => ({ name: p.name, isReady: p.isReady, address: p.address })),
            newPlayersData: updatedRoom.players.map(p => ({ name: p.name, isReady: p.isReady, address: p.address })),
            dataChanged: JSON.stringify(prevCurrentRoom.players) !== JSON.stringify(updatedRoom.players)
          });
          // 强制创建新的对象引用以触发 React 重新渲染
          return { ...updatedRoom };
        } else {
          console.log('RoomContext: Current room no longer exists, clearing currentRoom');
          return null;
        }
      }
      return prevCurrentRoom;
    });
  }, [rooms]);

  // 房间管理方法
  const createRoom = async (roomName: string): Promise<string | null> => {
    if (!user?.address || !gameView) {
      console.error('createRoom: Missing user address or gameView');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('RoomContext: Creating room via GameView');
      gameView.createRoom(roomName, currentPlayerName, user.address);
      
      // 等待房间创建完成
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          setLoading(false);
          resolve(null);
        }, 5000);

        const checkForRoom = () => {
          const newRoom = rooms.find(r => r.hostAddress === user.address);
          if (newRoom) {
            clearTimeout(timeout);
            setCurrentRoom(newRoom);
            setLoading(false);
            resolve(newRoom.id);
          } else {
            setTimeout(checkForRoom, 100);
          }
        };
        
        setTimeout(checkForRoom, 100);
      });
    } catch (err) {
      console.error('Error creating room:', err);
      setError('Failed to create room');
      setLoading(false);
      return null;
    }
  };

  const joinRoom = (roomId: string): boolean => {
    if (!user?.address || !gameView) {
      console.error('joinRoom: Missing user address or gameView');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('RoomContext: Joining room via GameView');
      gameView.joinRoom(roomId, user.address, currentPlayerName);
      
      // 设置当前房间
      const room = rooms.find(r => r.id === roomId);
      if (room) {
        setCurrentRoom(room);
      }
      
      return true;
    } catch (err) {
      console.error('Error joining room:', err);
      setError('Failed to join room');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const leaveRoom = (): void => {
    if (!currentRoom || !user?.address || !gameView) {
      console.error('leaveRoom: Missing currentRoom, user address, or gameView');
      return;
    }

    console.log('RoomContext: Leaving room via GameView:', currentRoom.id);
    gameView.leaveRoom(currentRoom.id, user.address);
    setCurrentRoom(null);
  };

  const setPlayerReady = (roomId: string, playerAddress: string, isReady: boolean): void => {
    if (!gameView) {
      console.error('setPlayerReady: No gameView available');
      return;
    }

    try {
      console.log('RoomContext: Setting player ready via GameView:', { 
        roomId, 
        playerAddress, 
        isReady,
        timestamp: new Date().toISOString()
      });
      gameView.setPlayerReady(roomId, playerAddress, isReady);
      
      // 添加日志来验证事件是否被发送
      console.log('RoomContext: setPlayerReady call completed, waiting for model update...');
    } catch (err) {
      console.error('Error setting player ready state:', err);
      setError('Failed to set ready state');
    }
  };

  return (
    <RoomContext.Provider value={{
      rooms,
      currentRoom,
      setCurrentRoom,
      currentPlayerName,
      setCurrentPlayerName,
      createRoom,
      joinRoom,
      leaveRoom,
      setPlayerReady,
      loading,
      error,
      isConnected,
      connectedPlayersCount
    }}>
      {children}
    </RoomContext.Provider>
  );
};
