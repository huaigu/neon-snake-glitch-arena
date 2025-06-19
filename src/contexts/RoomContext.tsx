
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

  // 设置 GameView 回调函数（立即设置，不等待连接）
  useEffect(() => {
    if (!gameView) {
      return;
    }

    console.log('RoomContext: Setting up GameView lobby callback for new model architecture');
    
    const lobbyCallback = (lobbyData: { rooms: Room[]; connectedPlayers: number }) => {
      console.log('=== LOBBY CALLBACK TRIGGERED (NEW MODEL) ===');
      console.log('RoomContext: Received lobby data from new model:', {
        roomsCount: lobbyData.rooms.length,
        connectedPlayers: lobbyData.connectedPlayers,
        detailedRooms: lobbyData.rooms.map(r => ({
          id: r.id,
          name: r.name,
          playersCount: r.players.length,
          players: r.players.map(p => ({ 
            name: p.name, 
            isReady: p.isReady, 
            address: p.address 
          }))
        })),
        timestamp: new Date().toISOString()
      });
      
      setRooms(lobbyData.rooms);
      setConnectedPlayersCount(lobbyData.connectedPlayers);
    };
    
    gameView.setLobbyCallback(lobbyCallback);

    // Get initial state if connected
    if (isConnected && gameView.model?.lobby) {
      console.log('RoomContext: Getting initial data from new lobby model');
      const initialState = gameView.model.lobby.getLobbyState();
      lobbyCallback(initialState);
    }

    return () => {
      console.log('RoomContext: Cleaning up GameView callbacks');
    };
  }, [gameView, isConnected]);

  // 当连接状态变化时，确保回调仍然有效
  useEffect(() => {
    if (!gameView || !isConnected) {
      return;
    }
    
    console.log('RoomContext: Connection state changed, re-ensuring lobby callback');
    
    const lobbyCallback = (lobbyData: { rooms: Room[]; connectedPlayers: number }) => {
      console.log('=== LOBBY CALLBACK TRIGGERED (CONNECTION CHANGE) ===');
      console.log('RoomContext: Received lobby data after connection change:', {
        roomsCount: lobbyData.rooms.length,
        connectedPlayers: lobbyData.connectedPlayers,
        timestamp: new Date().toISOString()
      });
      
      setRooms(lobbyData.rooms);
      setConnectedPlayersCount(lobbyData.connectedPlayers);
    };
    
    gameView.setLobbyCallback(lobbyCallback);
    
    // 立即获取当前数据 - Updated to use lobby model
    if (gameView.model?.lobby) {
      const currentState = gameView.model.lobby.getLobbyState();
      lobbyCallback(currentState);
    }
  }, [isConnected]); // 只依赖连接状态

  // 更新当前房间
  useEffect(() => {
    console.log('=== CURRENT ROOM UPDATE EFFECT ===');
    
    setCurrentRoom(prevCurrentRoom => {
      if (!prevCurrentRoom) {
        console.log('RoomContext: No previous current room');
        return prevCurrentRoom;
      }

      const updatedRoom = rooms.find(r => r.id === prevCurrentRoom.id);
      
      if (!updatedRoom) {
        console.log('RoomContext: Current room no longer exists, clearing currentRoom:', {
          previousRoomId: prevCurrentRoom.id
        });
        return null;
      }

      // 详细比较房间数据，包括状态和玩家数据
      const roomStatusChanged = prevCurrentRoom.status !== updatedRoom.status;
      const playersDataChanged = JSON.stringify(prevCurrentRoom.players) !== JSON.stringify(updatedRoom.players);
      const anyChange = roomStatusChanged || playersDataChanged;
      
      console.log('RoomContext: Current room update analysis:', {
        roomId: prevCurrentRoom.id,
        roomStatusChanged,
        playersDataChanged,
        anyChange,
        oldStatus: prevCurrentRoom.status,
        newStatus: updatedRoom.status,
        oldPlayersCount: prevCurrentRoom.players.length,
        newPlayersCount: updatedRoom.players.length,
        oldPlayersReady: prevCurrentRoom.players.map(p => ({ name: p.name, isReady: p.isReady })),
        newPlayersReady: updatedRoom.players.map(p => ({ name: p.name, isReady: p.isReady })),
        timestamp: new Date().toISOString()
      });
      
      if (anyChange) {
        console.log('RoomContext: Room data changed, creating new room object reference');
        return { 
          ...updatedRoom,
          players: [...updatedRoom.players] // 确保创建新的玩家数组引用
        };
      } else {
        console.log('RoomContext: Room data unchanged, keeping existing reference');
        return prevCurrentRoom;
      }
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
            console.log('RoomContext: Found newly created room, setting as currentRoom:', {
              roomId: newRoom.id,
              roomName: newRoom.name,
              hostAddress: newRoom.hostAddress,
              timestamp: new Date().toISOString()
            });
            setCurrentRoom({ ...newRoom });
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
        console.log('RoomContext: Setting current room after joining:', {
          roomId: room.id,
          roomName: room.name,
          timestamp: new Date().toISOString()
        });
        setCurrentRoom({ ...room });
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
      console.log('=== SET PLAYER READY CALLED ===');
      console.log('RoomContext: setPlayerReady function entry:', { 
        roomId, 
        playerAddress, 
        isReady,
        timestamp: new Date().toISOString()
      });
      
      console.log('RoomContext: CALLING gameView.setPlayerReady...');
      gameView.setPlayerReady(roomId, playerAddress, isReady);
      console.log('RoomContext: gameView.setPlayerReady call completed');
      
    } catch (err) {
      console.error('RoomContext: Error setting player ready state:', err);
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
