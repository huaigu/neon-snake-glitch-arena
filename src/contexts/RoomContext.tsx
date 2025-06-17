
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
  createRoom: (roomName: string) => string | null;
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

  const createRoom = (roomName: string): string | null => {
    if (!user?.address) {
      return null;
    }

    return createRoomMultisynq(roomName, currentPlayerName, user.address);
  };

  const joinRoom = (roomId: string): boolean => {
    if (!user?.address) {
      return false;
    }

    return joinRoomMultisynq(roomId, user.address, currentPlayerName);
  };

  const leaveRoom = (): void => {
    if (!currentRoom || !user?.address) return;

    leaveRoomMultisynq(currentRoom.id, user.address);
    setCurrentRoom(null);
  };

  // Update current room when rooms change
  useEffect(() => {
    if (currentRoom) {
      const updatedRoom = rooms.find(r => r.id === currentRoom.id);
      if (updatedRoom) {
        setCurrentRoom(updatedRoom);
      } else {
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
