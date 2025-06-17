
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWeb3Auth } from './Web3AuthContext';
import { useRoomsTogether } from '../hooks/useRoomsTogether';

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

interface RoomContextType {
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  currentRoom: Room | null;
  setCurrentRoom: React.Dispatch<React.SetStateAction<Room | null>>;
  currentPlayerName: string;
  setCurrentPlayerName: React.Dispatch<React.SetStateAction<string>>;
  createRoom: (roomName: string, isPrivate: boolean) => Promise<string | null>;
  joinRoom: (roomId: string) => Promise<boolean>;
  leaveRoom: () => Promise<void>;
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
    setRooms, 
    addRoom, 
    updateRoom, 
    removeRoom, 
    addPlayerToRoom, 
    removePlayerFromRoom 
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

  // Load rooms from database and sync with react-together
  const loadRooms = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch rooms with player counts
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          *,
          room_players(player_address),
          host_user:web3_users!rooms_host_address_fkey(address, username)
        `)
        .order('created_at', { ascending: false });

      if (roomsError) throw roomsError;

      const formattedRooms: Room[] = roomsData.map(room => ({
        id: room.id,
        name: room.name,
        host: room.host_user?.username || 
              `${room.host_address.slice(0, 6)}...${room.host_address.slice(-4)}`,
        players: room.room_players.map((p: any) => p.player_address),
        maxPlayers: room.max_players,
        isPrivate: room.is_private,
        status: room.status as 'waiting' | 'playing' | 'finished',
        createdAt: new Date(room.created_at)
      }));

      // Update the shared state with react-together
      setRooms(formattedRooms);
    } catch (err) {
      console.error('Error loading rooms:', err);
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  // Load rooms on mount and when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      loadRooms();
    } else {
      setRooms([]);
      setCurrentRoom(null);
    }
  }, [isAuthenticated]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!isAuthenticated) return;

    const roomsChannel = supabase
      .channel('rooms-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'rooms' }, 
        () => loadRooms()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'room_players' }, 
        () => loadRooms()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomsChannel);
    };
  }, [isAuthenticated]);

  const createRoom = async (roomName: string, isPrivate: boolean): Promise<string | null> => {
    if (!user?.address) {
      setError('Must be authenticated to create room');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      // Create room in database
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert({
          name: roomName,
          host_address: user.address,
          is_private: isPrivate,
          max_players: 8,
          status: 'waiting'
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add host as first player
      const { error: playerError } = await supabase
        .from('room_players')
        .insert({
          room_id: roomData.id,
          player_address: user.address
        });

      if (playerError) throw playerError;

      // Create new room object
      const newRoom: Room = {
        id: roomData.id,
        name: roomData.name,
        host: currentPlayerName,
        players: [user.address],
        maxPlayers: roomData.max_players,
        isPrivate: roomData.is_private,
        status: roomData.status as 'waiting' | 'playing' | 'finished',
        createdAt: new Date(roomData.created_at)
      };

      // Add to shared state via react-together
      addRoom(newRoom);
      setCurrentRoom(newRoom);

      return roomData.id;
    } catch (err) {
      console.error('Error creating room:', err);
      setError('Failed to create room');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (roomId: string): Promise<boolean> => {
    if (!user?.address) {
      setError('Must be authenticated to join room');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      // Check if room exists and has space
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select(`
          *,
          room_players(player_address),
          host_user:web3_users!rooms_host_address_fkey(address, username)
        `)
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;

      if (roomData.status === 'playing') {
        setError('Game is already in progress');
        return false;
      }

      if (roomData.room_players.length >= roomData.max_players) {
        setError('Room is full');
        return false;
      }

      // Check if already in room
      const isAlreadyInRoom = roomData.room_players.some(
        (p: any) => p.player_address === user.address
      );

      if (!isAlreadyInRoom) {
        // Add player to room in database
        const { error: joinError } = await supabase
          .from('room_players')
          .insert({
            room_id: roomId,
            player_address: user.address
          });

        if (joinError) throw joinError;

        // Update shared state via react-together
        addPlayerToRoom(roomId, user.address);
      }

      // Set as current room
      const room: Room = {
        id: roomData.id,
        name: roomData.name,
        host: roomData.host_user?.username || 
              `${roomData.host_address.slice(0, 6)}...${roomData.host_address.slice(-4)}`,
        players: [...roomData.room_players.map((p: any) => p.player_address), 
                 ...(isAlreadyInRoom ? [] : [user.address])],
        maxPlayers: roomData.max_players,
        isPrivate: roomData.is_private,
        status: roomData.status as 'waiting' | 'playing' | 'finished',
        createdAt: new Date(roomData.created_at)
      };

      setCurrentRoom(room);
      return true;
    } catch (err) {
      console.error('Error joining room:', err);
      setError('Failed to join room');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const leaveRoom = async (): Promise<void> => {
    if (!currentRoom || !user?.address) return;

    try {
      setLoading(true);
      setError(null);

      // Remove player from room in database
      const { error: leaveError } = await supabase
        .from('room_players')
        .delete()
        .eq('room_id', currentRoom.id)
        .eq('player_address', user.address);

      if (leaveError) throw leaveError;

      // Update shared state via react-together
      removePlayerFromRoom(currentRoom.id, user.address);

      // Check if room is empty and delete if so
      const { data: remainingPlayers, error: checkError } = await supabase
        .from('room_players')
        .select('player_address')
        .eq('room_id', currentRoom.id);

      if (checkError) throw checkError;

      if (remainingPlayers.length === 0) {
        // Delete empty room from database
        const { error: deleteError } = await supabase
          .from('rooms')
          .delete()
          .eq('id', currentRoom.id);

        if (deleteError) throw deleteError;

        // Remove from shared state via react-together
        removeRoom(currentRoom.id);
      } else if (currentRoom.host === currentPlayerName) {
        // If host left, assign new host
        const newHostAddress = remainingPlayers[0].player_address;
        const { error: updateError } = await supabase
          .from('rooms')
          .update({ host_address: newHostAddress })
          .eq('id', currentRoom.id);

        if (updateError) throw updateError;

        // Update shared state via react-together
        updateRoom(currentRoom.id, { host: `${newHostAddress.slice(0, 6)}...${newHostAddress.slice(-4)}` });
      }

      setCurrentRoom(null);
    } catch (err) {
      console.error('Error leaving room:', err);
      setError('Failed to leave room');
    } finally {
      setLoading(false);
    }
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
      leaveRoom,
      loading,
      error
    }}>
      {children}
    </RoomContext.Provider>
  );
};
