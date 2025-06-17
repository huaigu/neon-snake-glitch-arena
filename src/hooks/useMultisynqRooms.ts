import { useState, useEffect, useCallback, useRef } from 'react';
import { useMultisynq } from '../contexts/MultisynqContext';
import { Room } from '../models/LobbyModel';
import * as Multisynq from '@multisynq/client';

// 创建一个 Multisynq View 来处理与模型的通信
class LobbyView extends Multisynq.View {
  private roomsCallback: ((rooms: Room[]) => void) | null = null;
  private errorCallback: ((error: string) => void) | null = null;
  private roomCreatedCallback: ((roomId: string | null, room: Room | null) => void) | null = null;
  public model: any;

  constructor(model: any) {
    super(model);
    this.model = model;
    this.setupSubscriptions();
  }

  setupSubscriptions() {
    this.subscribe("lobby", "rooms-updated", this.onRoomsUpdated.bind(this));
    this.subscribe("lobby", "room-created", this.onRoomCreated.bind(this));
    this.subscribe("lobby", "room-creation-failed", this.onRoomCreationFailed.bind(this));
    this.subscribe("lobby", "join-room-success", this.onJoinSuccess.bind(this));
    this.subscribe("lobby", "join-room-failed", this.onJoinFailed.bind(this));
  }

  onRoomsUpdated(rooms: Room[]) {
    console.log('LobbyView: Rooms updated event received');
    console.log('Updated rooms count:', rooms.length);
    console.log('Rooms data:', rooms.map(r => ({
      id: r.id,
      name: r.name,
      playersCount: r.players.length,
      playersReady: r.players.map(p => ({ name: p.name, isReady: p.isReady }))
    })));
    if (this.roomsCallback) {
      this.roomsCallback(rooms);
      console.log('LobbyView: Rooms callback executed');
    } else {
      console.log('LobbyView: No rooms callback set');
    }
  }

  onRoomCreated({ roomId, room }: { roomId: string; room: Room }) {
    console.log('Room created:', roomId);
    if (this.roomCreatedCallback) {
      this.roomCreatedCallback(roomId, room);
    }
  }

  onRoomCreationFailed({ error }: { error: string }) {
    console.error('Room creation failed:', error);
    if (this.errorCallback) {
      this.errorCallback(error);
    }
    if (this.roomCreatedCallback) {
      this.roomCreatedCallback(null, null);
    }
  }

  onJoinSuccess({ roomId }: { roomId: string }) {
    console.log('Successfully joined room:', roomId);
    if (this.errorCallback) {
      this.errorCallback('');
    }
  }

  onJoinFailed({ error }: { error: string }) {
    console.error('Failed to join room:', error);
    if (this.errorCallback) {
      this.errorCallback(error);
    }
  }

  setRoomsCallback(callback: (rooms: Room[]) => void) {
    this.roomsCallback = callback;
  }

  setErrorCallback(callback: (error: string) => void) {
    this.errorCallback = callback;
  }

  setRoomCreatedCallback(callback: (roomId: string | null, room: Room | null) => void) {
    this.roomCreatedCallback = callback;
  }

  createRoom(roomName: string, hostName: string, hostAddress: string) {
    this.publish("lobby", "create-room", { roomName, hostName, hostAddress });
  }

  joinRoom(roomId: string, playerAddress: string, playerName: string) {
    this.publish("lobby", "join-room", { roomId, playerAddress, playerName });
  }

  leaveRoom(roomId: string, playerAddress: string) {
    this.publish("lobby", "leave-room", { roomId, playerAddress });
  }

  toggleReady(roomId: string, playerAddress: string) {
    console.log('LobbyView.toggleReady called:', { roomId, playerAddress });
    this.publish("lobby", "toggle-ready", { roomId, playerAddress });
    console.log('Published toggle-ready event');
  }
}

export const useMultisynqRooms = () => {
  const { session, isConnected } = useMultisynq();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lobbyViewRef = useRef<LobbyView | null>(null);
  const [pendingRoomCreation, setPendingRoomCreation] = useState<{
    resolve: (roomId: string | null) => void;
    reject: (error: any) => void;
  } | null>(null);
  const pendingRoomCreationRef = useRef(pendingRoomCreation);

  // 更新 ref 值
  useEffect(() => {
    pendingRoomCreationRef.current = pendingRoomCreation;
  }, [pendingRoomCreation]);

  useEffect(() => {
    if (!session || !isConnected || !session.model) {
      console.log('useMultisynqRooms: Session not ready', {
        hasSession: !!session,
        isConnected,
        hasModel: !!session?.model
      });
      if (lobbyViewRef.current) {
        // 清理现有的 LobbyView
        lobbyViewRef.current.unsubscribeAll();
        lobbyViewRef.current = null;
      }
      return;
    }

    // 如果已经有 LobbyView 实例且模型相同，不需要重新创建
    if (lobbyViewRef.current && lobbyViewRef.current.model === session.model) {
      console.log('useMultisynqRooms: LobbyView already exists for this model');
      return;
    }

    // 清理旧的 LobbyView
    if (lobbyViewRef.current) {
      console.log('useMultisynqRooms: Cleaning up old LobbyView');
      lobbyViewRef.current.unsubscribeAll();
    }

    // 创建新的 LobbyView 实例
    console.log('useMultisynqRooms: Creating new LobbyView instance');
    lobbyViewRef.current = new LobbyView(session.model);
    
    // 设置回调函数
    console.log('useMultisynqRooms: Setting up callbacks');
    lobbyViewRef.current.setRoomsCallback((updatedRooms) => {
      console.log('useMultisynqRooms: Rooms callback triggered with', updatedRooms.length, 'rooms');
      setRooms(updatedRooms);
    });
    lobbyViewRef.current.setErrorCallback((err) => {
      console.log('useMultisynqRooms: Error callback triggered:', err);
      if (err) setError(err);
      else setError(null);
    });
    
    // 设置房间创建成功的回调
    lobbyViewRef.current.setRoomCreatedCallback((roomId, room) => {
      console.log('useMultisynqRooms: Room created callback triggered:', roomId);
      const pending = pendingRoomCreationRef.current;
      if (pending) {
        pending.resolve(roomId);
        setPendingRoomCreation(null);
      }
      setLoading(false);
    });

    // 获取初始房间数据
    const initialRooms = session.model.rooms || [];
    console.log('useMultisynqRooms: Setting initial rooms:', initialRooms.length);
    setRooms(initialRooms);

    return () => {
      console.log('useMultisynqRooms: Cleanup effect triggered');
      if (lobbyViewRef.current) {
        lobbyViewRef.current.unsubscribeAll();
        lobbyViewRef.current = null;
      }
    };
  }, [session, isConnected]);

  const createRoom = useCallback((roomName: string, hostName: string, hostAddress: string): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      if (!lobbyViewRef.current) {
        setError('Not connected to session');
        resolve(null);
        return;
      }

      // 防止重复创建
      if (pendingRoomCreationRef.current) {
        setError('A room creation is already in progress');
        resolve(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // 设置 pending 状态，等待房间创建完成
        setPendingRoomCreation({ resolve, reject });
        
        // 发送创建房间的请求
        lobbyViewRef.current.createRoom(roomName, hostName, hostAddress);
        
        // 设置超时
        setTimeout(() => {
          if (pendingRoomCreationRef.current) {
            setPendingRoomCreation(null);
            setLoading(false);
            setError('Room creation timeout');
            resolve(null);
          }
        }, 5000);
        
      } catch (err) {
        console.error('Error creating room:', err);
        setError('Failed to create room');
        setLoading(false);
        resolve(null);
      }
    });
  }, []);

  const joinRoom = useCallback((roomId: string, playerAddress: string, playerName: string): boolean => {
    if (!lobbyViewRef.current) {
      setError('Not connected to session');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      lobbyViewRef.current.joinRoom(roomId, playerAddress, playerName);
      return true;
    } catch (err) {
      console.error('Error joining room:', err);
      setError('Failed to join room');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const leaveRoom = useCallback((roomId: string, playerAddress: string): void => {
    if (!lobbyViewRef.current) return;

    try {
      setLoading(true);
      setError(null);

      lobbyViewRef.current.leaveRoom(roomId, playerAddress);
    } catch (err) {
      console.error('Error leaving room:', err);
      setError('Failed to leave room');
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleReady = useCallback((roomId: string, playerAddress: string): void => {
    if (!lobbyViewRef.current) {
      console.error('toggleReady failed: lobbyViewRef.current is null');
      return;
    }

    try {
      console.log('toggleReady called with:', { roomId, playerAddress });
      console.log('lobbyViewRef.current exists:', !!lobbyViewRef.current);
      lobbyViewRef.current.toggleReady(roomId, playerAddress);
      console.log('toggleReady request sent successfully');
    } catch (err) {
      console.error('Error toggling ready state:', err);
      setError('Failed to toggle ready state');
    }
  }, []);

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
