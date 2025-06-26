import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useWeb3Auth } from './Web3AuthContext';
import { useMultisynq } from './MultisynqContext';
import { Room } from '../models/GameModel';
import { checkUserHasNFT } from '../utils/nftUtils';
import { GameView } from '../views/GameView';

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

// 全局callback设置函数，供GameView构造函数调用
export const setupGameViewCallbacks = (gameViewInstance: GameView) => {
  console.log('🔧 Global: Setting up GameView callbacks from global function');
  
  // 获取当前的用户信息 - 从localStorage或其他全局状态获取
  const userDataStr = localStorage.getItem('web3auth_user_data');
  let stableUserAddress = '';
  
  if (userDataStr) {
    try {
      const userData = JSON.parse(userDataStr);
      stableUserAddress = userData.address || userData.guestId || '';
    } catch (error) {
      console.warn('Failed to parse user data from localStorage:', error);
    }
  }
  
  console.log('🔧 Global: Setting up callbacks', {
    hasUserAddress: !!stableUserAddress,
    userAddress: stableUserAddress || 'Not available yet'
  });
  
  // 设置lobby回调
  const lobbyCallback = (lobbyData: { rooms: Room[]; connectedPlayers: number }) => {
    console.log('🔄 Global: Lobby update received via global callback:', {
      roomsCount: lobbyData.rooms.length,
      connectedPlayers: lobbyData.connectedPlayers
    });
    
    // 触发自定义事件，通知RoomContext更新状态
    window.dispatchEvent(new CustomEvent('global-lobby-update', {
      detail: lobbyData
    }));
  };
  
  // 设置房间加入成功回调
  const roomJoinedCallback = (data: { viewId: string; roomId: string }) => {
    console.log('📨 Global: Room joined callback received:', data);
    
    // 在运行时获取最新的用户地址
    const userDataStr = localStorage.getItem('web3auth_user_data');
    let currentUserAddress = '';
    
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        currentUserAddress = userData.address || userData.guestId || '';
      } catch (error) {
        console.warn('Failed to parse user data in callback:', error);
      }
    }
    
    if (currentUserAddress && (data.viewId === currentUserAddress)) {
      console.log('📨 Global: Current user successfully joined room via global callback');
      
      // 触发自定义事件，通知RoomContext处理房间加入
      window.dispatchEvent(new CustomEvent('global-room-joined', {
        detail: data
      }));
    } else {
      console.log('📨 Global: Room joined by different user or no user address available', {
        dataViewId: data.viewId,
        currentUserAddress: currentUserAddress || 'Not available'
      });
    }
  };
  
  // 设置其他必要的回调
  const roomCreatedCallback = (data: { roomId: string; roomName: string; hostAddress: string; hostViewId: string }) => {
    console.log('📨 Global: Room created callback received:', data);
    
    // 在运行时获取最新的用户地址 - 添加详细调试
    console.log('📨 Global: Checking localStorage for user data...');
    const userDataStr = localStorage.getItem('web3auth_user_data');
    console.log('📨 Global: localStorage web3auth_user_data:', userDataStr);
    
    // 也检查其他可能的键名
    const allLocalStorageKeys = Object.keys(localStorage);
    console.log('📨 Global: All localStorage keys:', allLocalStorageKeys);
    
    let currentUserAddress = '';
    
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        currentUserAddress = userData.address || userData.guestId || '';
        console.log('📨 Global: Parsed user data:', {
          address: userData.address,
          guestId: userData.guestId,
          finalAddress: currentUserAddress
        });
      } catch (error) {
        console.warn('Failed to parse user data in room created callback:', error);
      }
    } else {
      console.warn('📨 Global: No user data found in localStorage');
    }
    
    console.log('📨 Global: Address comparison:', {
      currentUserAddress,
      dataHostAddress: data.hostAddress,
      matches: currentUserAddress === data.hostAddress
    });
    
    if (currentUserAddress && data.hostAddress === currentUserAddress) {
      console.log('📨 Global: User addresses match, dispatching global-room-created event');
      window.dispatchEvent(new CustomEvent('global-room-created', {
        detail: data
      }));
    } else {
      console.log('📨 Global: User addresses do not match or no address available');
    }
  };
  
  const roomJoinFailedCallback = (data: { viewId: string; reason: string }) => {
    console.log('📨 Global: Room join failed callback received:', data);
    
    // 在运行时获取最新的用户地址
    const userDataStr = localStorage.getItem('web3auth_user_data');
    let currentUserAddress = '';
    
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        currentUserAddress = userData.address || userData.guestId || '';
      } catch (error) {
        console.warn('Failed to parse user data in join failed callback:', error);
      }
    }
    
    if (currentUserAddress && (data.viewId === currentUserAddress)) {
      window.dispatchEvent(new CustomEvent('global-room-join-failed', {
        detail: data
      }));
    }
  };
  
  const roomCreationFailedCallback = (data: { hostAddress: string; reason: string }) => {
    console.log('📨 Global: Room creation failed callback received:', data);
    
    // 在运行时获取最新的用户地址
    const userDataStr = localStorage.getItem('web3auth_user_data');
    let currentUserAddress = '';
    
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        currentUserAddress = userData.address || userData.guestId || '';
      } catch (error) {
        console.warn('Failed to parse user data in creation failed callback:', error);
      }
    }
    
    if (currentUserAddress === data.hostAddress) {
      window.dispatchEvent(new CustomEvent('global-room-creation-failed', {
        detail: data
      }));
    }
  };
  
  // 设置所有回调
  gameViewInstance.setLobbyCallback(lobbyCallback);
  gameViewInstance.setRoomJoinedCallback(roomJoinedCallback);
  gameViewInstance.setRoomCreatedCallback(roomCreatedCallback);
  gameViewInstance.setRoomJoinFailedCallback(roomJoinFailedCallback);
  gameViewInstance.setRoomCreationFailedCallback(roomCreationFailedCallback);
  
  console.log('✅ Global: All GameView callbacks set successfully via global function');
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

  // 监听自定义事件（callbacks现在由全局函数在GameView构造函数中设置）
  useEffect(() => {
    if (!gameView) {
      console.log('RoomContext: No gameView available, skipping event listener setup');
      return;
    }
    
    console.log('RoomContext: Setting up event listeners (callbacks handled by global function)');

    // 监听自定义事件，当新的GameView实例创建时立即重新设置callbacks
    const handleGameViewReady = (event: CustomEvent) => {
      console.log('🚀 RoomContext: Received multisynq-gameview-ready event (callbacks now handled by global function)');
      const newGameView = event.detail.gameView;
      if (newGameView) {
        console.log('🚀 RoomContext: New GameView instance received, callbacks should already be set');
      }
    };
    
    // 监听全局callback事件
    const handleGlobalLobbyUpdate = (event: CustomEvent) => {
      console.log('🔄 RoomContext: Received global-lobby-update event');
      const lobbyData = event.detail;
      setRooms(lobbyData.rooms);
      setConnectedPlayersCount(lobbyData.connectedPlayers);
    };
    
    const handleGlobalRoomCreated = (event: CustomEvent) => {
      console.log('📨 RoomContext: Received global-room-created event');
      const data = event.detail;
      
      // 处理房间创建成功事件
      const pendingCreation = window.pendingRoomCreation;
      if (pendingCreation && pendingCreation.userAddress === stableUserAddress) {
        console.log('📨 RoomContext: Found matching pending creation, resolving...');
        clearTimeout(pendingCreation.timeout);
        delete window.pendingRoomCreation;
        
        // 设置当前房间
        if (gameView?.model?.lobby) {
          const currentState = gameView.model.lobby.getLobbyState();
          const room = currentState.rooms.find(r => r.id === data.roomId);
          if (room) {
            console.log('📨 RoomContext: Found created room data, setting currentRoom:', room);
            setCurrentRoom({ ...room });
          }
        }
        
        pendingCreation.resolve(data.roomId);
      } else {
        console.log('📨 RoomContext: No matching pending creation found or user mismatch');
      }
    };
    
    const handleGlobalRoomJoined = (event: CustomEvent) => {
      console.log('📨 RoomContext: Received global-room-joined event');
      const data = event.detail;
      
      // 清除当前加入尝试的超时
      const joinAttempt = window.currentJoinAttempt;
      if (joinAttempt && joinAttempt.userAddress === stableUserAddress) {
        const callbackTime = Date.now() - joinAttempt.startTime;
        console.log(`📨 RoomContext: Global callback received after ${callbackTime}ms`);
        clearTimeout(joinAttempt.timeoutId);
        delete window.currentJoinAttempt;
      }
      
      // 设置当前房间
      if (gameView?.model?.lobby) {
        const currentState = gameView.model.lobby.getLobbyState();
        const room = currentState.rooms.find(r => r.id === data.roomId);
        if (room) {
          console.log('📨 RoomContext: Found joined room data via global callback, setting currentRoom:', {
            roomId: room.id,
            roomName: room.name,
            playersCount: room.players.length
          });
          setCurrentRoom({ ...room });
        }
      }
    };

    window.addEventListener('multisynq-gameview-ready', handleGameViewReady as EventListener);
    window.addEventListener('global-lobby-update', handleGlobalLobbyUpdate as EventListener);
    window.addEventListener('global-room-created', handleGlobalRoomCreated as EventListener);
    window.addEventListener('global-room-joined', handleGlobalRoomJoined as EventListener);

    return () => {
      console.log('RoomContext: Cleaning up GameView callbacks and subscriptions', {
        gameViewInstance: !!gameView,
        timestamp: new Date().toISOString()
      });
      
      // 清理未完成的加入尝试超时
      const joinAttempt = window.currentJoinAttempt;
      if (joinAttempt) {
        clearTimeout(joinAttempt.timeoutId);
        delete window.currentJoinAttempt;
      }

      // 移除事件监听器
      window.removeEventListener('multisynq-gameview-ready', handleGameViewReady as EventListener);
      window.removeEventListener('global-lobby-update', handleGlobalLobbyUpdate as EventListener);
      window.removeEventListener('global-room-created', handleGlobalRoomCreated as EventListener);
      window.removeEventListener('global-room-joined', handleGlobalRoomJoined as EventListener);
    };
  }, [gameView, isConnected, stableUserAddress]); // 使用稳定的地址引用

  // 检测房间加入成功 - 通过监控房间列表变化
  useEffect(() => {
    const joinAttempt = window.currentJoinAttempt;
    if (!joinAttempt || !stableUserAddress) {
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
  }, [rooms, stableUserAddress]);

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
        
        return null;
      }
    }

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
      return null;
    }
  };

  const joinRoom = async (roomId: string): Promise<boolean> => {
    if (!stableUserAddress || !gameView) {
      console.error('joinRoom: Missing user address or gameView');
      return false;
    }

    try {
      console.log(`🚀 RoomContext: Starting join room process`, {
        roomId,
        userAddress: stableUserAddress,
        timestamp: new Date().toISOString()
      });
      
      // 检查callbacks状态（用于调试重连后callback丢失问题）
      console.log('🔧 RoomContext: Checking callbacks status before join...', {
        hasSetRoomJoinedCallback: typeof gameView.setRoomJoinedCallback === 'function',
        hasModel: !!gameView.model,
        hasLobby: !!gameView.model?.lobby,
        gameViewInstance: gameView.constructor.name
      });
      
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
      }, 2000);

      // 存储 timeout ID 以便在成功/失败回调中清除
      const currentJoinAttempt = { timeoutId, roomId, userAddress: stableUserAddress, startTime: Date.now() };
      window.currentJoinAttempt = currentJoinAttempt;
      
      return true;
    } catch (err) {
      console.error('Error joining room:', err);
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
    }
  };

  // 观察者模式方法 - 纯观察，不修改任何model状态
  const spectateRoom = (roomId: string): boolean => {
    if (!gameView) {
      console.error('spectateRoom: No gameView available');
      return false;
    }

    // 防止重复调用 - 只检查isSpectator状态
    if (isSpectator) {
      console.log('RoomContext: spectateRoom called while already in spectator mode, ignoring');
      return false;
    }

    try {
      console.log('RoomContext: Starting pure spectator mode for room:', roomId);
      
      // 设置观察者状态
      setIsSpectator(true);
      setSpectatorRoomId(roomId);
      
      // 纯观察模式：直接从lobby状态获取房间数据，不触发任何model变更
      if (gameView.model?.lobby) {
        const currentState = gameView.model.lobby.getLobbyState();
        const room = currentState.rooms.find(r => r.id === roomId);
        if (room) {
          console.log('RoomContext: Found room for pure spectating:', room);
          
          // 添加调试信息
          console.log('RoomContext: Initial spectator room data:', {
            id: room.id,
            name: room.name,
            createdAt: room.createdAt,
            createdAtType: typeof room.createdAt,
            allKeys: Object.keys(room)
          });
          
          // 使用独立的spectatorRoom状态，不修改currentRoom
          const spectatorRoomData = { 
            ...room,
            isSpectatorView: true // 标记这是观察者视图
          };
          
          console.log('RoomContext: Setting spectator room with data:', {
            id: spectatorRoomData.id,
            createdAt: spectatorRoomData.createdAt,
            createdAtType: typeof spectatorRoomData.createdAt,
            allKeys: Object.keys(spectatorRoomData)
          });
          
          setSpectatorRoom(spectatorRoomData);
          
          console.log('RoomContext: Pure spectator mode activated - watching room without joining model');
          
          // 设置定时器定期更新房间状态（用于观察者实时更新）
          const spectatorUpdateInterval = setInterval(() => {
            if (gameView.model?.lobby) {
              const updatedState = gameView.model.lobby.getLobbyState();
              const updatedRoom = updatedState.rooms.find(r => r.id === roomId);
              if (updatedRoom) {
                // 添加调试信息
                console.log('RoomContext: Spectator room update - updatedRoom data:', {
                  id: updatedRoom.id,
                  createdAt: updatedRoom.createdAt,
                  createdAtType: typeof updatedRoom.createdAt,
                  allKeys: Object.keys(updatedRoom)
                });
                
                // 只在房间状态实际改变时更新，避免不必要的重新渲染
                setSpectatorRoom(prevRoom => {
                  if (!prevRoom || 
                      prevRoom.status !== updatedRoom.status || 
                      JSON.stringify(prevRoom.players) !== JSON.stringify(updatedRoom.players)) {
                    const newRoom = {
                      ...updatedRoom,
                      isSpectatorView: true // 确保保留观察者标记
                    };
                    
                    console.log('RoomContext: Updating spectator room with new data:', {
                      id: newRoom.id,
                      createdAt: newRoom.createdAt,
                      createdAtType: typeof newRoom.createdAt,
                      allKeys: Object.keys(newRoom)
                    });
                    
                    return newRoom;
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
          setIsSpectator(false);
          setSpectatorRoomId(null);
          return false;
        }
      }
      
      console.error('RoomContext: Unable to access room data - connection issue');
      setIsSpectator(false);
      setSpectatorRoomId(null);
      return false;
    } catch (err) {
      console.error('Error starting pure spectator mode:', err);
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
      error: null,
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
