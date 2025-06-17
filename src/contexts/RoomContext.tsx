
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWeb3Auth } from './Web3AuthContext';
import { useRoomsTogether, Room } from '../hooks/useRoomsTogether';

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
    createRoom: createRoomTogether,
    joinRoom: joinRoomTogether,
    leaveRoom: leaveRoomTogether
  } = useRoomsTogether();
  
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentPlayerName, setCurrentPlayerName] = useState('PLAYER_01');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError('Must be authenticated to create room');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const roomId = createRoomTogether(roomName, currentPlayerName, user.address);
      
      const newRoom = rooms.find(r => r.id === roomId);
      if (newRoom) {
        setCurrentRoom(newRoom);
      }

      return roomId;
    } catch (err) {
      console.error('Error creating room:', err);
      setError('Failed to create room');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = (roomId: string): boolean => {
    if (!user?.address) {
      setError('Must be authenticated to join room');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const success = joinRoomTogether(roomId, user.address);
      
      if (success) {
        const room = rooms.find(r => r.id === roomId);
        if (room) {
          setCurrentRoom(room);
        }
        return true;
      } else {
        setError('Failed to join room - room may be full or in progress');
        return false;
      }
    } catch (err) {
      console.error('Error joining room:', err);
      setError('Failed to join room');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const leaveRoom = (): void => {
    if (!currentRoom || !user?.address) return;

    try {
      setLoading(true);
      setError(null);

      leaveRoomTogether(currentRoom.id, user.address, currentPlayerName);
      setCurrentRoom(null);
    } catch (err) {
      console.error('Error leaving room:', err);
      setError('Failed to leave room');
    } finally {
      setLoading(false);
    }
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
      error
    }}>
      {children}
    </RoomContext.Provider>
  );
};
