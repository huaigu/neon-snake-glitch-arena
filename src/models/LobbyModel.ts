
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

  handlePlayerJoin(viewInfo: { viewId: string; viewData?: { name?: string; address?: string } }) {
    console.log('LobbyModel: Player joining:', viewInfo);
    
    const viewId = viewInfo.viewId;
    const playerData = viewInfo.viewData || {};
    
    // Guard against undefined viewId
    if (!viewId) {
      console.error('LobbyModel: handlePlayerJoin called with undefined viewId, skipping');
      return;
    }
    
    // Check if this is a spectator connection (don't create player model for spectators)
    if (viewId.includes('spectator_') || (playerData.address && playerData.address.includes('spectator_'))) {
      console.log('LobbyModel: Spectator connection detected, skipping player creation');
      return;
    }
    
    // Create player model
    const player = PlayerModel.create({
      viewId: viewId,
      name: playerData.name || `Player_${viewId.slice(0, 6)}`,
      address: playerData.address || viewId
    });
    
    this.players.set(viewId, player);
    
    // Publish lobby update
    this.publishLobbyState();
    
    console.log('LobbyModel: Player joined, total players:', this.players.size);
  }

  handlePlayerLeave(viewInfo: { viewId: string }) {
    console.log('LobbyModel: Player leaving:', viewInfo);
    
    const viewId = viewInfo.viewId;
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
    }
    
    this.publishLobbyState();
    console.log('LobbyModel: Player left, remaining players:', this.players.size);
  }



  handleCreateRoom(payload: { roomName: string; playerName: string; hostAddress: string }) {
    console.log('LobbyModel: Creating room:', payload);
    
    const roomId = `room_${this.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Find or create the host player
    let hostPlayer = Array.from(this.players.values()).find(p => p.address === payload.hostAddress);
    
    if (!hostPlayer) {
      console.log('LobbyModel: Host player not found, creating new player');
      // Create a new player if not found (this handles the case where player joins and immediately creates room)
      hostPlayer = PlayerModel.create({
        viewId: payload.hostAddress, // Use address as viewId temporarily
        name: payload.playerName,
        address: payload.hostAddress
      });
      this.players.set(payload.hostAddress, hostPlayer);
    } else {
      // Update player name if provided
      if (payload.playerName && payload.playerName !== hostPlayer.name) {
        hostPlayer.name = payload.playerName;
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
    console.log('LobbyModel: Adding host player to room:', hostPlayer.viewId);
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

  handleJoinRoom(payload: { roomId: string; address: string; playerName: string }) {
    console.log('LobbyModel: Player joining room:', payload);
    
    const room = this.gameRooms.get(payload.roomId);
    let player = Array.from(this.players.values()).find(p => p.address === payload.address);
    
    if (!player) {
      console.log('LobbyModel: Player not found, creating new player for room join');
      player = PlayerModel.create({
        viewId: payload.address, // Use address as viewId temporarily
        name: payload.playerName,
        address: payload.address
      });
      this.players.set(payload.address, player);
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
