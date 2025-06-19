
import * as Multisynq from '@multisynq/client';
import { GameRoomModel } from './GameRoomModel';
import { PlayerModel } from './PlayerModel';

export class LobbyModel extends Multisynq.Model {
  gameRooms!: Map<string, GameRoomModel>;
  players!: Map<string, PlayerModel>;

  init() {
    console.log('LobbyModel: Initializing lobby model');
    
    // Initialize properties
    this.gameRooms = new Map();
    this.players = new Map();

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

  handlePlayerJoin(viewInfo: any) {
    console.log('LobbyModel: Player joining:', viewInfo);
    
    const viewId = viewInfo.viewId || viewInfo;
    const playerData = viewInfo.viewData || {};
    
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

  handlePlayerLeave(viewInfo: any) {
    console.log('LobbyModel: Player leaving:', viewInfo);
    
    const viewId = viewInfo.viewId || viewInfo;
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

  // Check if a player already hosts a room
  playerAlreadyHostsRoom(hostAddress: string): boolean {
    for (const room of this.gameRooms.values()) {
      if (room.hostAddress === hostAddress) {
        console.log('LobbyModel: Player already hosts room:', room.roomId);
        return true;
      }
    }
    return false;
  }

  handleCreateRoom(payload: { roomName: string; playerName: string; hostAddress: string }) {
    console.log('LobbyModel: Creating room:', payload);
    
    // Check if player already hosts a room
    if (this.playerAlreadyHostsRoom(payload.hostAddress)) {
      console.log('LobbyModel: Player already hosts a room, cannot create another');
      this.publish("player", "create-room-error", {
        address: payload.hostAddress,
        error: "You can only create one room at a time"
      });
      return;
    }
    
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
      room.addPlayer(player);
      
      this.publishLobbyState();
      
      // Notify the player that they joined the room
      this.publish("player", "joined-room", {
        viewId: player.viewId,
        roomId: payload.roomId
      });
      
      console.log('LobbyModel: Player joined room successfully');
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
