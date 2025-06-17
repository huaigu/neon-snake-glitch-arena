
import { useState, useEffect, useCallback } from 'react';
import { useMultisynq } from '../contexts/MultisynqContext';
import { Room } from '../models/LobbyModel';

export const useMultisynqRooms = () => {
  const { session, isConnected } = useMultisynq();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !isConnected) return;

    // 订阅房间更新事件
    const unsubscribeRoomsUpdated = session.subscribe("lobby", "rooms-updated", (updatedRooms: Room[]) => {
      setRooms(updatedRooms);
    });

    const unsubscribeRoomCreated = session.subscribe("lobby", "room-created", ({ room }: { room: Room }) => {
      console.log('Room created:', room);
    });

    const unsubscribeJoinSuccess = session.subscribe("lobby", "join-room-success", ({ roomId }: { roomId: string }) => {
      console.log('Successfully joined room:', roomId);
      setError(null);
    });

    const unsubscribeJoinFailed = session.subscribe("lobby", "join-room-failed", ({ error }: { error: string }) => {
      console.error('Failed to join room:', error);
      setError(error);
    });

    // 获取初始房间数据
    if (session.model) {
      setRooms(session.model.rooms || []);
    }

    return () => {
      unsubscribeRoomsUpdated();
      unsubscribeRoomCreated();
      unsubscribeJoinSuccess();
      unsubscribeJoinFailed();
    };
  }, [session, isConnected]);

  const createRoom = useCallback((roomName: string, hostName: string, hostAddress: string): string | null => {
    if (!session || !isConnected) {
      setError('Not connected to session');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      session.publish("lobby", "create-room", { roomName, hostName, hostAddress });
      
      return roomId;
    } catch (err) {
      console.error('Error creating room:', err);
      setError('Failed to create room');
      return null;
    } finally {
      setLoading(false);
    }
  }, [session, isConnected]);

  const joinRoom = useCallback((roomId: string, playerAddress: string, playerName: string): boolean => {
    if (!session || !isConnected) {
      setError('Not connected to session');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      session.publish("lobby", "join-room", { roomId, playerAddress, playerName });
      return true;
    } catch (err) {
      console.error('Error joining room:', err);
      setError('Failed to join room');
      return false;
    } finally {
      setLoading(false);
    }
  }, [session, isConnected]);

  const leaveRoom = useCallback((roomId: string, playerAddress: string): void => {
    if (!session || !isConnected) return;

    try {
      setLoading(true);
      setError(null);

      session.publish("lobby", "leave-room", { roomId, playerAddress });
    } catch (err) {
      console.error('Error leaving room:', err);
      setError('Failed to leave room');
    } finally {
      setLoading(false);
    }
  }, [session, isConnected]);

  const toggleReady = useCallback((roomId: string, playerAddress: string): void => {
    if (!session || !isConnected) return;

    try {
      session.publish("lobby", "toggle-ready", { roomId, playerAddress });
    } catch (err) {
      console.error('Error toggling ready state:', err);
      setError('Failed to toggle ready state');
    }
  }, [session, isConnected]);

  return {
    rooms,
    loading,
    error,
    isConnected,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleReady
  };
};
