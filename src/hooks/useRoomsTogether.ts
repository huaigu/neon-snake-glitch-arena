
import { useStateTogether } from 'react-together';

export interface Room {
  id: string;
  name: string;
  host: string;
  players: string[];
  maxPlayers: number;
  isPrivate: boolean;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Date;
}

export const useRoomsTogether = () => {
  const [rooms, setRooms] = useStateTogether<Room[]>('lobby-rooms', []);
  
  const addRoom = (room: Room) => {
    setRooms(prev => [...prev, room]);
  };

  const updateRoom = (roomId: string, updates: Partial<Room>) => {
    setRooms(prev => prev.map(room => 
      room.id === roomId ? { ...room, ...updates } : room
    ));
  };

  const removeRoom = (roomId: string) => {
    setRooms(prev => prev.filter(room => room.id !== roomId));
  };

  const addPlayerToRoom = (roomId: string, playerAddress: string) => {
    setRooms(prev => prev.map(room => 
      room.id === roomId 
        ? { ...room, players: [...room.players, playerAddress] }
        : room
    ));
  };

  const removePlayerFromRoom = (roomId: string, playerAddress: string) => {
    setRooms(prev => prev.map(room => 
      room.id === roomId 
        ? { ...room, players: room.players.filter(p => p !== playerAddress) }
        : room
    ));
  };

  const createRoom = (roomName: string, hostName: string, hostAddress: string): string => {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRoom: Room = {
      id: roomId,
      name: roomName,
      host: hostName,
      players: [hostAddress],
      maxPlayers: 8,
      isPrivate: false,
      status: 'waiting',
      createdAt: new Date()
    };
    addRoom(newRoom);
    return roomId;
  };

  const joinRoom = (roomId: string, playerAddress: string): boolean => {
    const room = rooms.find(r => r.id === roomId);
    if (!room || room.players.length >= room.maxPlayers || room.status !== 'waiting') {
      return false;
    }
    
    if (!room.players.includes(playerAddress)) {
      addPlayerToRoom(roomId, playerAddress);
    }
    return true;
  };

  const leaveRoom = (roomId: string, playerAddress: string, hostName: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    removePlayerFromRoom(roomId, playerAddress);
    
    const updatedRoom = rooms.find(r => r.id === roomId);
    if (updatedRoom && updatedRoom.players.length === 0) {
      removeRoom(roomId);
    } else if (room.host === hostName && updatedRoom && updatedRoom.players.length > 0) {
      // Assign new host if current host leaves
      const newHostAddress = updatedRoom.players[0];
      const newHostName = `${newHostAddress.slice(0, 6)}...${newHostAddress.slice(-4)}`;
      updateRoom(roomId, { host: newHostName });
    }
  };

  return {
    rooms,
    setRooms,
    addRoom,
    updateRoom,
    removeRoom,
    addPlayerToRoom,
    removePlayerFromRoom,
    createRoom,
    joinRoom,
    leaveRoom
  };
};
