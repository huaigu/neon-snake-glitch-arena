
import { useStateTogether } from 'react-together';
import { Room } from '../contexts/RoomContext';

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

  return {
    rooms,
    setRooms,
    addRoom,
    updateRoom,
    removeRoom,
    addPlayerToRoom,
    removePlayerFromRoom
  };
};
