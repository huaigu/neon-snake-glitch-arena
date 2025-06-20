import * as Multisynq from '@multisynq/client';
import { GameRoomModel } from './GameRoomModel';
import { PlayerModel } from './PlayerModel';
import { LeaderboardModel } from './LeaderboardModel';

export class LobbyModel extends Multisynq.Model {
  gameRooms!: Map<string, GameRoomModel>;
  players!: Map<string, PlayerModel>;
  leaderboard!: LeaderboardModel;

  init() {
    console.log('LobbyModel: Initializing lobby model');
    
    // Initialize properties
    this.gameRooms = new Map();
    this.players = new Map();
    
    // Create leaderboard model
    this.leaderboard = LeaderboardModel.create();

    // Subscribe to system events
    this.subscribe(this.sessionId, "view-join", this.handlePlayerJoin);
    this.subscribe(this.sessionId, "view-exit", this.handlePlayerLeave);

    // Subscribe to view events
    this.subscribe("lobby", "create-room", this.handleCreateRoom);
    this.subscribe("lobby", "join-room", this.handleJoinRoom);
    this.subscribe("lobby", "leave-room", this.handleLeaveRoom);
    this.subscribe("lobby", "set-player-ready", this.handleSetPlayerReady);

    console.log('LobbyModel: Initialization complete');
  }

  handlePlayerJoin(viewId: string) {
    console.log('LobbyModel: Player joining with viewId:', viewId);
    
    // Guard against undefined viewId
    if (!viewId) {
      console.error('LobbyModel: handlePlayerJoin called with undefined viewId, skipping');
      return;
    }

    // Guard against non-string viewId
    if (typeof viewId !== 'string') {
      console.error('LobbyModel: handlePlayerJoin called with non-string viewId:', typeof viewId, viewId);
      return;
    }

    // Guard against empty string viewId
    if (viewId.trim() === '') {
      console.error('LobbyModel: handlePlayerJoin called with empty viewId, skipping');
      return;
    }
    
    // Check if this is a spectator connection (don't create player model for spectators)
    if (viewId.includes('spectator_')) {
      console.log('LobbyModel: Spectator connection detected, skipping player creation');
      return;
    }

    // Check if player already exists
    if (this.players.has(viewId)) {
      console.log('LobbyModel: Player already exists, ignoring duplicate join:', viewId);
      return;
    }
    
    try {
      // Create player model with viewId as both viewId and address
      const player = PlayerModel.create({
        viewId: viewId,
        name: `Player_${viewId.slice(0, 6)}`,
        address: viewId // Use viewId as address for now, will be updated when they create/join rooms
      });
      
      this.players.set(viewId, player);
      
      // Publish lobby update
      this.publishLobbyState();
      
      console.log('LobbyModel: Player joined successfully, total players:', this.players.size);
    } catch (error) {
      console.error('LobbyModel: Error creating player:', error);
    }
  }

  handlePlayerLeave(viewId: string) {
    console.log('LobbyModel: Player leaving with viewId:', viewId);
    
    if (!viewId || typeof viewId !== 'string') {
      console.error('LobbyModel: handlePlayerLeave called with invalid viewId:', viewId);
      return;
    }
    
    const player = this.players.get(viewId);
    
    if (player) {
      // Remove player from any room they're in
      if (player.currentRoomId) {
        const room = this.gameRooms.get(player.currentRoomId);
        if (room) {
          room.removePlayer(viewId);
        }
      }
      
      // Remove player from lobby
      player.destroy();
      this.players.delete(viewId);
      
      this.publishLobbyState();
      console.log('LobbyModel: Player left, remaining players:', this.players.size);
    } else {
      console.log('LobbyModel: Player not found for leaving:', viewId);
    }
  }

  handleCreateRoom(payload: { roomName: string; playerName: string; hostAddress: string; hasNFT?: boolean }) {
    console.log('LobbyModel: Creating room:', payload);
    
    // 服务端安全检查：确保玩家不会创建多个房间（作为客户端检查的后备）
    const existingHostedRoom = Array.from(this.gameRooms.values()).find(room => 
      room.hostAddress === payload.hostAddress
    );
    
    if (existingHostedRoom) {
      console.log('LobbyModel: Server-side check: Player already hosts a room:', {
        hostAddress: payload.hostAddress,
        existingRoomId: existingHostedRoom.id,
        existingRoomName: existingHostedRoom.name
      });
      
      // 这种情况理论上不应该发生，因为客户端已经检查过了
      // 但为了安全起见，服务端仍然拒绝请求
      console.warn('LobbyModel: This should not happen - client should have prevented this request');
      return;
    }
    
    const roomId = `room_${this.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Find the host player - check both by address and viewId
    let hostPlayer = Array.from(this.players.values()).find(p => 
      p.address === payload.hostAddress || p.viewId === payload.hostAddress
    );
    
    if (!hostPlayer) {
      console.log('LobbyModel: Host player not found by address, checking all players:', {
        hostAddress: payload.hostAddress,
        allPlayers: Array.from(this.players.values()).map(p => ({
          viewId: p.viewId,
          address: p.address,
          name: p.name
        }))
      });
      
      // 如果还是找不到，创建新玩家，但使用hostAddress作为address，并保持现有的viewId映射
      hostPlayer = PlayerModel.create({
        viewId: payload.hostAddress, // 临时使用address作为viewId
        name: payload.playerName,
        address: payload.hostAddress,
        hasNFT: payload.hasNFT || false
      });
      this.players.set(payload.hostAddress, hostPlayer);
      console.log('LobbyModel: Created new host player with address as viewId');
    } else {
      console.log('LobbyModel: Found existing host player:', {
        viewId: hostPlayer.viewId,
        address: hostPlayer.address,
        name: hostPlayer.name
      });
      
      // 更新玩家的address为提供的hostAddress（如果不同的话）
      if (hostPlayer.address !== payload.hostAddress) {
        console.log('LobbyModel: Updating player address from', hostPlayer.address, 'to', payload.hostAddress);
        hostPlayer.address = payload.hostAddress;
      }
      
      // Update player name if provided
      if (payload.playerName && payload.playerName !== hostPlayer.name) {
        hostPlayer.name = payload.playerName;
        console.log('LobbyModel: Updated player name to:', payload.playerName);
      }
      
      // Update NFT status if provided
      if (payload.hasNFT !== undefined) {
        hostPlayer.setNFTStatus(payload.hasNFT);
        console.log('LobbyModel: Updated player NFT status to:', payload.hasNFT);
      }
      
      // 检查玩家是否已经在其他房间中，如果是则先退出
      if (hostPlayer.currentRoomId) {
        console.log('LobbyModel: Player is in another room, leaving current room:', hostPlayer.currentRoomId);
        const currentRoom = this.gameRooms.get(hostPlayer.currentRoomId);
        if (currentRoom) {
          const wasHost = currentRoom.hostAddress === payload.hostAddress;
          
          currentRoom.removePlayer(hostPlayer.viewId);
          
          // 如果是房主离开且房间还有其他玩家，转移房主权限
          if (wasHost && currentRoom.players.size > 0) {
            const firstPlayer = Array.from(currentRoom.players.values())[0];
            console.log('LobbyModel: Transferring host from', payload.hostAddress, 'to', firstPlayer.address);
            currentRoom.transferHost(firstPlayer.address);
          }
          
          // 如果房间空了，删除房间
          if (currentRoom.players.size === 0) {
            currentRoom.destroy();
            this.gameRooms.delete(hostPlayer.currentRoomId);
            console.log('LobbyModel: Removed empty room:', hostPlayer.currentRoomId);
          }
        }
      }
    }
    
    // Create room model
    const room = GameRoomModel.create({
      id: roomId,
      name: payload.roomName,
      hostAddress: payload.hostAddress
    });
    
    this.gameRooms.set(roomId, room);
    
    // Add host to room
    console.log('LobbyModel: Adding host player to room:', {
      viewId: hostPlayer.viewId,
      address: hostPlayer.address,
      roomId: roomId
    });
    room.addPlayer(hostPlayer);
    
    this.publishLobbyState();
    
    // 发布房间创建成功事件，用于直接导航
    this.publish("lobby", "room-created", {
      roomId: roomId,
      roomName: payload.roomName,
      hostAddress: payload.hostAddress,
      hostViewId: hostPlayer.viewId
    });
    
    // Notify the creator that room was created (保持兼容性)
    this.publish("player", "joined-room", {
      viewId: hostPlayer.viewId,
      roomId: roomId
    });
    
    console.log('LobbyModel: Room created and host added:', roomId);
  }

  handleJoinRoom(payload: { roomId: string; address: string; playerName: string; hasNFT?: boolean }) {
    console.log('LobbyModel: Player joining room:', payload);
    
    const room = this.gameRooms.get(payload.roomId);
    let player = Array.from(this.players.values()).find(p => p.address === payload.address);
    
    if (!player) {
      console.log('LobbyModel: Player not found, creating new player for room join');
      player = PlayerModel.create({
        viewId: payload.address, // Use address as viewId temporarily
        name: payload.playerName,
        address: payload.address,
        hasNFT: payload.hasNFT || false
      });
      this.players.set(payload.address, player);
    } else {
      // 更新现有玩家的NFT状态
      if (payload.hasNFT !== undefined) {
        player.setNFTStatus(payload.hasNFT);
        console.log('LobbyModel: Updated existing player NFT status to:', payload.hasNFT);
      }
    }
    
    if (room && player) {
      // 检查玩家是否已经在其他房间中，如果是则先退出
      if (player.currentRoomId && player.currentRoomId !== payload.roomId) {
        console.log('LobbyModel: Player is in another room, leaving current room:', player.currentRoomId);
        const currentRoom = this.gameRooms.get(player.currentRoomId);
        if (currentRoom) {
          const wasHost = currentRoom.hostAddress === payload.address;
          
          currentRoom.removePlayer(player.viewId);
          
          // 如果是房主离开且房间还有其他玩家，转移房主权限
          if (wasHost && currentRoom.players.size > 0) {
            const firstPlayer = Array.from(currentRoom.players.values())[0];
            console.log('LobbyModel: Transferring host from', payload.address, 'to', firstPlayer.address);
            currentRoom.transferHost(firstPlayer.address);
          }
          
          // 如果房间空了，删除房间
          if (currentRoom.players.size === 0) {
            currentRoom.destroy();
            this.gameRooms.delete(player.currentRoomId);
            console.log('LobbyModel: Removed empty room:', player.currentRoomId);
          }
        }
      }
      
      // 尝试加入新房间
      const joinSuccess = room.addPlayer(player);
      
      if (joinSuccess) {
        this.publishLobbyState();
        
        // Notify the player that they joined the room
        this.publish("player", "joined-room", {
          viewId: player.viewId,
          roomId: payload.roomId
        });
        
        console.log('LobbyModel: Player joined room successfully');
      } else {
        console.log('LobbyModel: Failed to join room - room may not be in waiting state');
        
        // Notify the player that join failed
        this.publish("player", "join-room-failed", {
          viewId: player.viewId,
          roomId: payload.roomId,
          reason: "Room is not accepting new players"
        });
      }
    } else {
      console.error('LobbyModel: Failed to join room - room or player not found');
    }
  }

  handleLeaveRoom(payload: { roomId: string; address: string }) {
    console.log('LobbyModel: Player leaving room:', payload);
    
    const room = this.gameRooms.get(payload.roomId);
    const player = Array.from(this.players.values()).find(p => p.address === payload.address);
    
    if (room && player) {
      const wasHost = room.hostAddress === payload.address;
      
      room.removePlayer(player.viewId);
      
      // If the host left and there are still players, transfer host to first player
      if (wasHost && room.players.size > 0) {
        const firstPlayer = Array.from(room.players.values())[0];
        console.log('LobbyModel: Transferring host from', payload.address, 'to', firstPlayer.address);
        room.transferHost(firstPlayer.address);
      }
      
      // If room is empty, remove it
      if (room.players.size === 0) {
        room.destroy();
        this.gameRooms.delete(payload.roomId);
      }
      
      this.publishLobbyState();
    }
  }

  handleSetPlayerReady(payload: { roomId: string; playerAddress: string; isReady: boolean }) {
    console.log('LobbyModel: Setting player ready state:', payload);
    
    const room = this.gameRooms.get(payload.roomId);
    if (room) {
      room.setPlayerReady(payload.playerAddress, payload.isReady);
      this.publishLobbyState();
    }
  }

  getLobbyState() {
    const rooms = Array.from(this.gameRooms.values()).map(room => room.getRoomState());
    const connectedPlayers = this.players.size;
    
    return {
      rooms,
      connectedPlayers
    };
  }

  publishLobbyState() {
    const lobbyState = this.getLobbyState();
    this.publish("lobby", "updated", lobbyState);
    console.log('LobbyModel: Published lobby state:', lobbyState);
  }
}

LobbyModel.register("LobbyModel");
