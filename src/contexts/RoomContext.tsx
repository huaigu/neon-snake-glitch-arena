import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useWeb3Auth } from './Web3AuthContext';
import { useMultisynq } from './MultisynqContext';
import { Room } from '../models/GameModel';
import { checkUserHasNFT } from '../utils/nftUtils';

// 添加类型定义来解决linter错误
interface PendingRoomCreation {
  resolve: (roomId: string | null) => void;
  timeout: NodeJS.Timeout;
  userAddress: string;
}

interface JoinAttempt {
  timeoutId: NodeJS.Timeout;
  roomId: string;
  userAddress: string;
  startTime: number;
}

declare global {
  interface Window {
    pendingRoomCreation?: PendingRoomCreation;
    spectatorUpdateInterval?: NodeJS.Timeout;
    currentJoinAttempt?: JoinAttempt;
  }
}

interface RoomContextType {
  rooms: Room[];
  currentRoom: Room | null;
  setCurrentRoom: React.Dispatch<React.SetStateAction<Room | null>>;
  currentPlayerName: string;
  setCurrentPlayerName: React.Dispatch<React.SetStateAction<string>>;
  createRoom: (roomName: string) => Promise<string | null>;
  joinRoom: (roomId: string) => Promise<boolean>;
  leaveRoom: () => void;
  setPlayerReady: (roomId: string, playerAddress: string, isReady: boolean) => void;
  forceStartGame: (roomId: string) => void;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  connectedPlayersCount: number;
  // 观察者模式相关
  isSpectator: boolean;
  spectatorRoom: Room | null;  // 独立的观察者房间状态
  spectateRoom: (roomId: string) => boolean;
  leaveSpectator: () => void;
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
  
  // 观察者模式状态
  const [isSpectator, setIsSpectator] = useState(false);
  const [spectatorRoom, setSpectatorRoom] = useState<Room | null>(null);
  const [spectatorRoomId, setSpectatorRoomId] = useState<string | null>(null);

  // 稳定的用户地址引用，避免无限循环
  const stableUserAddress = useMemo(() => user?.address, [user?.address]);
  const stableUserHasNFT = useMemo(() => user?.hasNFT, [user?.hasNFT]);

  // 从用户地址生成显示名称
  useEffect(() => {
    if (user?.address) {
      const shortAddress = `${user.address.slice(0, 6)}...${user.address.slice(-4)}`;
      setCurrentPlayerName(user.username || shortAddress);
    }
  }, [user?.address, user?.username]); // 只依赖实际需要的属性

  // 设置 GameView 回调函数（立即设置，不等待连接）
  useEffect(() => {
    if (!gameView) {
      return;
    }

    console.log('RoomContext: Setting up GameView lobby callback for new model architecture');
    
    const lobbyCallback = (lobbyData: { rooms: Room[]; connectedPlayers: number }) => {
      console.log('🔄 RoomContext: Lobby update received:', {
        roomsCount: lobbyData.rooms.length,
        connectedPlayers: lobbyData.connectedPlayers,
        roomsData: lobbyData.rooms.map(r => ({
          id: r.id,
          name: r.name,
          status: r.status,
          playersCount: r.players.length,
          playerAddresses: r.players.map(p => p.address)
        })),
        timestamp: new Date().toISOString()
      });
      
      setRooms(lobbyData.rooms);
      setConnectedPlayersCount(lobbyData.connectedPlayers);
    };
    
    gameView.setLobbyCallback(lobbyCallback);

    // 设置房间创建成功的回调，用于直接导航 (新的直接方式)
    const roomCreatedCallback = (data: { roomId: string; roomName: string; hostAddress: string; hostViewId: string }) => {
      console.log('RoomContext: Room created successfully via direct event:', data);
      console.log('RoomContext: Comparing addresses - user.address:', stableUserAddress, 'data.hostAddress:', data.hostAddress);
      
      if (stableUserAddress && data.hostAddress === stableUserAddress) {
        console.log('RoomContext: Current user created room, handling navigation directly');
        
        // 处理待处理的房间创建Promise
        const pendingCreation = window.pendingRoomCreation;
        console.log('RoomContext: Checking pending creation:', {
          hasPendingCreation: !!pendingCreation,
          pendingUserAddress: pendingCreation?.userAddress,
          currentUserAddress: stableUserAddress
        });
        
        if (pendingCreation && pendingCreation.userAddress === stableUserAddress) {
          console.log('RoomContext: Resolving pending room creation promise directly');
          clearTimeout(pendingCreation.timeout);
          delete window.pendingRoomCreation;
          
          // 直接从最新的lobby状态获取房间数据
          if (gameView.model?.lobby) {
            const currentState = gameView.model.lobby.getLobbyState();
            console.log('RoomContext: Current lobby state rooms:', currentState.rooms.map(r => ({ id: r.id, name: r.name })));
            const room = currentState.rooms.find(r => r.id === data.roomId);
            if (room) {
              console.log('RoomContext: Found room data, setting currentRoom and resolving promise:', room);
              setCurrentRoom({ ...room });
              setLoading(false);
              setError(null); // 清除任何之前的错误
              pendingCreation.resolve(data.roomId);
            } else {
              console.log('RoomContext: Room not found in lobby state, but room was created successfully');
              // 即使房间在lobby状态中暂时找不到，也要resolve promise，让UI继续
              setLoading(false);
              setError(null);
              pendingCreation.resolve(data.roomId);
              
              // 延迟一点再尝试获取房间数据
              setTimeout(() => {
                if (gameView.model?.lobby) {
                  const retryState = gameView.model.lobby.getLobbyState();
                  const retryRoom = retryState.rooms.find(r => r.id === data.roomId);
                  if (retryRoom) {
                    console.log('RoomContext: Found room data on retry:', retryRoom);
                    setCurrentRoom({ ...retryRoom });
                  }
                }
              }, 500);
            }
          } else {
            console.log('RoomContext: No lobby model available, but resolving promise anyway');
            setLoading(false);
            setError(null);
            pendingCreation.resolve(data.roomId);
          }
        } else {
          console.log('RoomContext: No matching pending creation found, but room was created successfully');
          // 即使没有待处理的Promise，也要确保UI状态正确更新
          if (gameView.model?.lobby) {
            const currentState = gameView.model.lobby.getLobbyState();
            const room = currentState.rooms.find(r => r.id === data.roomId);
            if (room) {
              setCurrentRoom({ ...room });
              setLoading(false);
              setError(null);
            }
          }
        }
      } else {
        console.log('RoomContext: Room created by different user, ignoring');
      }
    };

    // 设置房间加入成功的回调，用于处理普通房间加入（保持兼容性）
    const roomJoinedCallback = (data: { viewId: string; roomId: string }) => {
      console.log('📨 RoomContext: Room joined callback received:', data);
      if (stableUserAddress && (data.viewId === stableUserAddress)) {
        console.log('📨 RoomContext: Current user successfully joined room via callback');
        
        // 清除当前加入尝试的超时
        const joinAttempt = window.currentJoinAttempt;
        if (joinAttempt && joinAttempt.userAddress === stableUserAddress) {
          const callbackTime = Date.now() - joinAttempt.startTime;
          console.log(`📨 RoomContext: Callback received after ${callbackTime}ms`);
          clearTimeout(joinAttempt.timeoutId);
          delete window.currentJoinAttempt;
        }
        
        // 只处理普通的房间加入，创建房间已由上面的roomCreatedCallback处理
        const pendingCreation = window.pendingRoomCreation;
        if (!pendingCreation) {
          // 检查是否已经通过状态检测设置了房间
          if (currentRoom && currentRoom.id === data.roomId) {
            console.log('📨 RoomContext: Room already set via state detection, skipping callback processing');
            // 即使已经设置，也要确保loading状态被重置
            setLoading(false);
            setError(null);
            return;
          }
          
          // 普通的房间加入（非创建）
          if (gameView.model?.lobby) {
            const currentState = gameView.model.lobby.getLobbyState();
            const room = currentState.rooms.find(r => r.id === data.roomId);
            if (room) {
              console.log('📨 RoomContext: Found joined room data via callback, setting currentRoom:', {
                roomId: room.id,
                roomName: room.name,
                playersCount: room.players.length
              });
              setCurrentRoom({ ...room });
              setLoading(false);
              setError(null);
            } else {
              console.error('📨 RoomContext: Room not found after successful join:', data.roomId);
              setError('Room joined but data not found');
              setLoading(false);
            }
          } else {
            console.error('📨 RoomContext: No lobby model available after room join');
            setError('Unable to load room data');
            setLoading(false);
          }
        }
      }
    };

    // 房间创建失败回调
    const roomCreationFailedCallback = (data: { hostAddress: string; reason: string }) => {
      if (stableUserAddress === data.hostAddress) {
        console.log('RoomContext: Received create room error:', data.reason);
        setError(data.reason);
        setLoading(false);
        
        const pendingCreation = window.pendingRoomCreation;
        if (pendingCreation && pendingCreation.userAddress === stableUserAddress) {
          clearTimeout(pendingCreation.timeout);
          delete window.pendingRoomCreation;
          pendingCreation.resolve(null);
        }
      }
    };

    // 房间加入失败回调
    const roomJoinFailedCallback = (data: { viewId: string; reason: string }) => {
      if (stableUserAddress && (data.viewId === stableUserAddress)) {
        console.log('RoomContext: Room join failed:', data.reason);
        
        // 清除当前加入尝试的超时
        const joinAttempt = window.currentJoinAttempt;
        if (joinAttempt && joinAttempt.userAddress === stableUserAddress) {
          clearTimeout(joinAttempt.timeoutId);
          delete window.currentJoinAttempt;
        }
        
        setError(data.reason || 'Failed to join room');
        setLoading(false);
      }
    };

    gameView.setRoomCreatedCallback(roomCreatedCallback);
    gameView.setRoomJoinedCallback(roomJoinedCallback);
    gameView.setRoomJoinFailedCallback(roomJoinFailedCallback);
    gameView.setRoomCreationFailedCallback(roomCreationFailedCallback);

    // Subscribe to room creation errors
    gameView.subscribe("player", "create-room-error", (errorData: { address: string; error: string }) => {
      if (stableUserAddress === errorData.address) {
        console.log('RoomContext: Received create room error:', errorData.error);
        setError(errorData.error);
        setLoading(false);
      }
    });

    // Get initial state if connected
    if (isConnected && gameView.model?.lobby) {
      console.log('RoomContext: Getting initial data from new lobby model');
      const initialState = gameView.model.lobby.getLobbyState();
      lobbyCallback(initialState);
    }

    return () => {
      console.log('RoomContext: Cleaning up GameView callbacks');
      
      // 清理未完成的加入尝试超时
      const joinAttempt = window.currentJoinAttempt;
      if (joinAttempt) {
        clearTimeout(joinAttempt.timeoutId);
        delete window.currentJoinAttempt;
      }
    };
  }, [gameView, isConnected, stableUserAddress]); // 使用稳定的地址引用

  // 检测房间加入成功 - 通过监控房间列表变化
  useEffect(() => {
    const joinAttempt = window.currentJoinAttempt;
    if (!joinAttempt || !stableUserAddress || !loading) {
      return;
    }

    // 检查用户是否已经成功加入目标房间
    const targetRoom = rooms.find(r => r.id === joinAttempt.roomId);
    if (targetRoom) {
      const userInRoom = targetRoom.players.some(player => player.address === stableUserAddress);
      if (userInRoom) {
        const joinTime = Date.now() - joinAttempt.startTime;
        console.log(`🎉 RoomContext: Quick join detection - User successfully joined room in ${joinTime}ms`, {
          roomId: joinAttempt.roomId,
          roomName: targetRoom.name,
          playersCount: targetRoom.players.length,
          playersList: targetRoom.players.map(p => p.address)
        });
        
        // 清除超时和加入尝试
        clearTimeout(joinAttempt.timeoutId);
        delete window.currentJoinAttempt;
        
        // 设置当前房间并重置loading状态
        setCurrentRoom({ ...targetRoom });
        setLoading(false);
        setError(null);
      } else {
        // 调试信息：房间存在但用户不在其中
        const timeSinceStart = Date.now() - joinAttempt.startTime;
        if (timeSinceStart > 500) { // 只在超过500ms后才记录，避免日志污染
          console.log(`⏳ RoomContext: Still waiting for join (${timeSinceStart}ms) - Room found but user not in players list`, {
            roomId: joinAttempt.roomId,
            roomPlayersCount: targetRoom.players.length,
            roomPlayersList: targetRoom.players.map(p => p.address),
            waitingForUser: stableUserAddress
          });
        }
      }
    } else {
      // 调试信息：房间不存在
      const timeSinceStart = Date.now() - joinAttempt.startTime;
      if (timeSinceStart > 500) {
        console.log(`⏳ RoomContext: Still waiting for join (${timeSinceStart}ms) - Target room not found`, {
          targetRoomId: joinAttempt.roomId,
          availableRooms: rooms.map(r => r.id),
          totalRooms: rooms.length
        });
      }
    }
  }, [rooms, stableUserAddress, loading]);

  // 更新当前房间
  useEffect(() => {
    // console.log('=== CURRENT ROOM UPDATE EFFECT ===');
    
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
      const hostChanged = prevCurrentRoom.hostAddress !== updatedRoom.hostAddress;
      const anyChange = roomStatusChanged || playersDataChanged || hostChanged;
      
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
    if (!stableUserAddress || !gameView) {
      console.error('createRoom: Missing user address or gameView');
      return null;
    }

    // 首先检查用户是否已经主持了其他房间
    if (gameView.model?.lobby) {
      const currentState = gameView.model.lobby.getLobbyState();
      const existingHostedRoom = currentState.rooms.find(room => 
        room.hostAddress === stableUserAddress
      );
      
      if (existingHostedRoom) {
        console.log('RoomContext: User already hosts a room:', {
          userAddress: stableUserAddress,
          existingRoomId: existingHostedRoom.id,
          existingRoomName: existingHostedRoom.name
        });
        
        setError('You can only create one room at a time. Please leave your current room first.');
        return null;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // 重新检查NFT状态（除非是游客用户）
      let currentNFTStatus = stableUserHasNFT || false;
      if (!user?.isGuest && stableUserAddress) {
        console.log('RoomContext: Re-checking NFT status before creating room...');
        try {
          currentNFTStatus = await checkUserHasNFT(stableUserAddress);
          console.log('RoomContext: Fresh NFT check result for room creation:', currentNFTStatus);
        } catch (error) {
          console.warn('RoomContext: Failed to check NFT status, using cached value:', error);
          currentNFTStatus = stableUserHasNFT || false;
        }
      }

      console.log('RoomContext: Creating room via GameView', {
        roomName,
        currentPlayerName, 
        stableUserAddress,
        stableUserHasNFT,
        userHasNFT: user?.hasNFT,
        freshNFTCheck: currentNFTStatus,
        isGuest: user?.isGuest
      });
      gameView.createRoom(roomName, currentPlayerName, stableUserAddress, currentNFTStatus);
      
      // 等待房间创建完成或错误
      return new Promise((resolve) => {
        // 设置超时保护
        const timeout = setTimeout(() => {
          console.log('RoomContext: Room creation timeout after 10 seconds');
          setLoading(false);
          setError('Room creation timeout. Please try again.');
          resolve(null);
        }, 10000);

        // 临时存储resolve函数，当房间加入成功回调触发时使用
        window.pendingRoomCreation = {
          resolve,
          timeout,
          userAddress: stableUserAddress
        };
      });
    } catch (err) {
      console.error('Error creating room:', err);
      setError('Failed to create room');
      setLoading(false);
      return null;
    }
  };

  const joinRoom = async (roomId: string): Promise<boolean> => {
    if (!stableUserAddress || !gameView) {
      console.error('joinRoom: Missing user address or gameView');
      return false;
    }

    // 防止重复调用
    if (loading) {
      console.log('RoomContext: joinRoom called while already loading, ignoring');
      return false;
    }

    try {
      console.log(`🚀 RoomContext: Starting join room process`, {
        roomId,
        userAddress: stableUserAddress,
        currentlyLoading: loading,
        timestamp: new Date().toISOString()
      });
      
      setLoading(true);
      setError(null);

      // 重新检查NFT状态（除非是游客用户），但避免频繁检查
      let currentNFTStatus = stableUserHasNFT || false;
      if (!user?.isGuest && stableUserAddress && typeof stableUserHasNFT === 'undefined') {
        console.log('RoomContext: Re-checking NFT status before joining room...');
        try {
          currentNFTStatus = await checkUserHasNFT(stableUserAddress);
          console.log('RoomContext: Fresh NFT check result:', currentNFTStatus);
        } catch (error) {
          console.warn('RoomContext: Failed to check NFT status, using cached value:', error);
          currentNFTStatus = false;
        }
      } else if (stableUserHasNFT !== undefined) {
        currentNFTStatus = stableUserHasNFT;
        console.log('RoomContext: Using cached NFT status:', currentNFTStatus);
      }

      console.log('RoomContext: Joining room via GameView', {
        roomId,
        userAddress: stableUserAddress,
        currentPlayerName,
        stableUserHasNFT,
        userHasNFT: user?.hasNFT,
        freshNFTCheck: currentNFTStatus,
        isGuest: user?.isGuest
      });
      
      gameView.joinRoom(roomId, stableUserAddress, currentPlayerName, currentNFTStatus);
      
      // 不要立即设置房间，等待房间加入成功的回调
      console.log('RoomContext: joinRoom call sent, waiting for callback...');
      
      // 添加超时保护，防止loading状态卡住
      // 使用 setTimeout 而不是依赖 loading 状态检查，以避免竞态条件
      const timeoutId = setTimeout(() => {
        console.warn('RoomContext: Join room timeout after 2 seconds, forcing reset');
        setError('Join room timeout. Please check your connection and try again.');
        setLoading(false);
        
        // 清除加入尝试记录
        delete window.currentJoinAttempt;
      }, 2000);

      // 存储 timeout ID 以便在成功/失败回调中清除
      const currentJoinAttempt = { timeoutId, roomId, userAddress: stableUserAddress, startTime: Date.now() };
      window.currentJoinAttempt = currentJoinAttempt;
      
      return true;
    } catch (err) {
      console.error('Error joining room:', err);
      setError('Failed to join room');
      setLoading(false);
      return false;
    }
  };

  const leaveRoom = (): void => {
    if (!currentRoom || !stableUserAddress || !gameView) {
      console.error('leaveRoom: Missing currentRoom, user address, or gameView');
      return;
    }

    console.log('RoomContext: Leaving room via GameView:', currentRoom.id);
    gameView.leaveRoom(currentRoom.id, stableUserAddress);
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

  // 观察者模式方法 - 纯观察，不修改任何model状态
  const spectateRoom = (roomId: string): boolean => {
    if (!gameView) {
      console.error('spectateRoom: No gameView available');
      return false;
    }

    // 防止重复调用
    if (loading || isSpectator) {
      console.log('RoomContext: spectateRoom called while already loading or in spectator mode, ignoring');
      return false;
    }

    try {
      console.log('RoomContext: Starting pure spectator mode for room:', roomId);
      
      // 设置观察者状态
      setIsSpectator(true);
      setSpectatorRoomId(roomId);
      setLoading(true);
      setError(null);
      
      // 纯观察模式：直接从lobby状态获取房间数据，不触发任何model变更
      if (gameView.model?.lobby) {
        const currentState = gameView.model.lobby.getLobbyState();
        const room = currentState.rooms.find(r => r.id === roomId);
        if (room) {
          console.log('RoomContext: Found room for pure spectating:', room);
          
          // 使用独立的spectatorRoom状态，不修改currentRoom
          setSpectatorRoom({ 
            ...room,
            isSpectatorView: true // 标记这是观察者视图
          });
          
          setLoading(false);
          
          console.log('RoomContext: Pure spectator mode activated - watching room without joining model');
          
          // 设置定时器定期更新房间状态（用于观察者实时更新）
          const spectatorUpdateInterval = setInterval(() => {
            if (gameView.model?.lobby) {
              const updatedState = gameView.model.lobby.getLobbyState();
              const updatedRoom = updatedState.rooms.find(r => r.id === roomId);
              if (updatedRoom) {
                // 只在房间状态实际改变时更新，避免不必要的重新渲染
                setSpectatorRoom(prevRoom => {
                  if (!prevRoom || 
                      prevRoom.status !== updatedRoom.status || 
                      JSON.stringify(prevRoom.players) !== JSON.stringify(updatedRoom.players)) {
                    return {
                      ...updatedRoom,
                      isSpectatorView: true
                    };
                  }
                  return prevRoom;
                });
              }
            }
          }, 2000); // 降低更新频率到每2秒一次
          
          // 保存interval ID以便清理
          window.spectatorUpdateInterval = spectatorUpdateInterval;
          
          return true;
        } else {
          console.error('RoomContext: Room not found for spectating:', roomId);
          setError('Room not found or no longer exists');
          setLoading(false);
          setIsSpectator(false);
          setSpectatorRoomId(null);
          return false;
        }
      }
      
      setError('Unable to access room data - connection issue');
      setLoading(false);
      setIsSpectator(false);
      setSpectatorRoomId(null);
      return false;
    } catch (err) {
      console.error('Error starting pure spectator mode:', err);
      setError('Failed to start spectator mode');
      setLoading(false);
      setIsSpectator(false);
      setSpectatorRoomId(null);
      return false;
    }
  };

  const leaveSpectator = (): void => {
    console.log('RoomContext: Leaving spectator mode');
    
    // 清理观察者更新定时器
    if (window.spectatorUpdateInterval) {
      clearInterval(window.spectatorUpdateInterval);
      delete window.spectatorUpdateInterval;
      console.log('RoomContext: Cleared spectator update interval');
    }
    
    setIsSpectator(false);
    setSpectatorRoomId(null);
    setSpectatorRoom(null);  // 清理观察者房间状态，不影响currentRoom
  };

  const forceStartGame = (roomId: string): void => {
    console.log('RoomContext: Force starting game for room:', roomId);
    
    if (!gameView?.publish) {
      console.error('RoomContext: Cannot force start game - no gameView available');
      return;
    }

    if (!stableUserAddress) {
      console.error('RoomContext: Cannot force start game - no user address');
      return;
    }

    try {
      gameView.publish("lobby", "force-start-game", {
        hostAddress: stableUserAddress,
        roomId: roomId
      });
      console.log('RoomContext: Force start game event published successfully');
    } catch (error) {
      console.error('RoomContext: Error force starting game:', error);
      setError('Failed to force start game');
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
      forceStartGame,
      loading,
      error,
      isConnected,
      connectedPlayersCount,
      // 观察者模式
      isSpectator,
      spectatorRoom,
      spectateRoom,
      leaveSpectator
    }}>
      {children}
    </RoomContext.Provider>
  );
};
