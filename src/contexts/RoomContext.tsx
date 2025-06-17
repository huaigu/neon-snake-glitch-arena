import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWeb3Auth } from './Web3AuthContext';
import { useMultisynqRooms } from '../hooks/useMultisynqRooms';
import { Room } from '../models/LobbyModel';

interface RoomContextType {
  rooms: Room[];
  currentRoom: Room | null;
  setCurrentRoom: React.Dispatch<React.SetStateAction<Room | null>>;
  currentPlayerName: string;
  setCurrentPlayerName: React.Dispatch<React.SetStateAction<string>>;
  createRoom: (roomName: string) => Promise<string | null>;
  joinRoom: (roomId: string) => boolean;
  leaveRoom: () => void;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
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
  const { 
    rooms, 
    loading,
    error,
    isConnected,
    createRoom: createRoomMultisynq,
    joinRoom: joinRoomMultisynq,
    leaveRoom: leaveRoomMultisynq
  } = useMultisynqRooms();
  
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentPlayerName, setCurrentPlayerName] = useState('PLAYER_01');

  const { user, isAuthenticated } = useWeb3Auth();

  // Generate a display name from wallet address
  useEffect(() => {
    if (user?.address) {
      const shortAddress = `${user.address.slice(0, 6)}...${user.address.slice(-4)}`;
      setCurrentPlayerName(user.username || shortAddress);
    }
  }, [user]);

  const createRoom = async (roomName: string): Promise<string | null> => {
    if (!user?.address) {
      return null;
    }

    const roomId = await createRoomMultisynq(roomName, currentPlayerName, user.address);
    
    // 如果房间创建成功，查找并设置为当前房间
    if (roomId) {
      // 等待一小段时间让房间出现在 rooms 列表中
      setTimeout(() => {
        const newRoom = rooms.find(r => r.id === roomId);
        if (newRoom) {
          setCurrentRoom(newRoom);
        }
      }, 100);
    }
    
    return roomId;
  };

  const joinRoom = (roomId: string): boolean => {
    if (!user?.address) {
      return false;
    }

    const success = joinRoomMultisynq(roomId, user.address, currentPlayerName);
    
    // 如果加入成功，设置为当前房间
    if (success) {
      const room = rooms.find(r => r.id === roomId);
      if (room) {
        setCurrentRoom(room);
      }
    }
    
    return success;
  };

  const leaveRoom = (): void => {
    if (!currentRoom || !user?.address) return;

    console.log('Leaving room:', currentRoom.id, 'User:', user.address);
    leaveRoomMultisynq(currentRoom.id, user.address);
    setCurrentRoom(null);
  };

  // Update current room when rooms change
  useEffect(() => {
    if (currentRoom) {
      const updatedRoom = rooms.find(r => r.id === currentRoom.id);
      if (updatedRoom) {
        console.log('RoomContext: Updating current room with new data:', {
          roomId: currentRoom.id,
          oldPlayersCount: currentRoom.players.length,
          newPlayersCount: updatedRoom.players.length,
          playersReady: updatedRoom.players.map(p => ({ name: p.name, isReady: p.isReady }))
        });
        setCurrentRoom(updatedRoom);
      } else {
        console.log('RoomContext: Current room no longer exists, clearing currentRoom');
        setCurrentRoom(null);
      }
    }
  }, [rooms, currentRoom]);

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
      loading,
      error,
      isConnected
    }}>
      {children}
    </RoomContext.Provider>
  );
};
