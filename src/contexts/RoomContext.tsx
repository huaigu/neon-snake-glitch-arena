
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Room {
  id: string;
  name: string;
  host: string;
  players: string[];
  maxPlayers: number;
  isPrivate: boolean;
  status: 'waiting' | 'playing' | 'full';
  createdAt: Date;
}

interface RoomContextType {
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  currentRoom: Room | null;
  setCurrentRoom: React.Dispatch<React.SetStateAction<Room | null>>;
  currentPlayerName: string;
  setCurrentPlayerName: React.Dispatch<React.SetStateAction<string>>;
  createRoom: (roomName: string, isPrivate: boolean) => string;
  joinRoom: (roomId: string) => boolean;
  leaveRoom: () => void;
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
  // Mock data for rooms
  const [rooms, setRooms] = useState<Room[]>([
    {
      id: 'room_1',
      name: '新手训练营',
      host: 'CYBER_MASTER',
      players: ['CYBER_MASTER', 'NEON_HUNTER'],
      maxPlayers: 4,
      isPrivate: false,
      status: 'waiting',
      createdAt: new Date(Date.now() - 300000)
    },
    {
      id: 'room_2',
      name: '高手对决',
      host: 'SNAKE_LORD',
      players: ['SNAKE_LORD', 'DIGITAL_VIPER', 'MATRIX_CRAWLER'],
      maxPlayers: 6,
      isPrivate: false,
      status: 'waiting',
      createdAt: new Date(Date.now() - 180000)
    },
    {
      id: 'room_3',
      name: '终极挑战',
      host: 'QUANTUM_COIL',
      players: ['QUANTUM_COIL', 'ELECTRIC_EEL', 'BINARY_SERPENT', 'CYBER_VIPER'],
      maxPlayers: 4,
      isPrivate: false,
      status: 'full',
      createdAt: new Date(Date.now() - 60000)
    }
  ]);

  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentPlayerName, setCurrentPlayerName] = useState('PLAYER_01');

  const createRoom = (roomName: string, isPrivate: boolean): string => {
    const newRoom: Room = {
      id: `room_${Date.now()}`,
      name: roomName,
      host: currentPlayerName,
      players: [currentPlayerName],
      maxPlayers: 8,
      isPrivate,
      status: 'waiting',
      createdAt: new Date()
    };

    setRooms(prev => [...prev, newRoom]);
    setCurrentRoom(newRoom);
    return newRoom.id;
  };

  const joinRoom = (roomId: string): boolean => {
    const room = rooms.find(r => r.id === roomId);
    if (!room || room.players.length >= room.maxPlayers || room.status === 'playing') {
      return false;
    }

    if (room.players.includes(currentPlayerName)) {
      setCurrentRoom(room);
      return true;
    }

    const updatedRoom = {
      ...room,
      players: [...room.players, currentPlayerName],
      status: room.players.length + 1 >= room.maxPlayers ? 'full' as const : 'waiting' as const
    };

    setRooms(prev => prev.map(r => r.id === roomId ? updatedRoom : r));
    setCurrentRoom(updatedRoom);
    return true;
  };

  const leaveRoom = () => {
    if (!currentRoom) return;

    const updatedRoom = {
      ...currentRoom,
      players: currentRoom.players.filter(p => p !== currentPlayerName),
      status: 'waiting' as const
    };

    if (updatedRoom.players.length === 0) {
      // Remove empty room
      setRooms(prev => prev.filter(r => r.id !== currentRoom.id));
    } else {
      // If host left, assign new host
      if (currentRoom.host === currentPlayerName && updatedRoom.players.length > 0) {
        updatedRoom.host = updatedRoom.players[0];
      }
      setRooms(prev => prev.map(r => r.id === currentRoom.id ? updatedRoom : r));
    }

    setCurrentRoom(null);
  };

  return (
    <RoomContext.Provider value={{
      rooms,
      setRooms,
      currentRoom,
      setCurrentRoom,
      currentPlayerName,
      setCurrentPlayerName,
      createRoom,
      joinRoom,
      leaveRoom
    }}>
      {children}
    </RoomContext.Provider>
  );
};
