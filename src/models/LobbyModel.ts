
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

  handleCreateRoom(payload: { roomName: string; playerName: string; hostAddress: string }) {
    console.log('LobbyModel: Creating room:', payload);
    
    const roomId = `room_${this.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create room model
    const room = GameRoomModel.create({
      id: roomId,
      name: payload.roomName,
      hostAddress: payload.hostAddress
    });
    
    this.gameRooms.set(roomId, room);
    
    // Add host to room
    const hostPlayer = Array.from(this.players.values()).find(p => p.address === payload.hostAddress);
    if (hostPlayer) {
      room.addPlayer(hostPlayer);
    }
    
    this.publishLobbyState();
    
    // Notify the creator that room was created
    this.publish("player", "joined-room", {
      viewId: hostPlayer?.viewId,
      roomId: roomId
    });
    
    console.log('LobbyModel: Room created:', roomId);
  }

  handleJoinRoom(payload: { roomId: string; address: string; playerName: string }) {
    console.log('LobbyModel: Player joining room:', payload);
    
    const room = this.gameRooms.get(payload.roomId);
    const player = Array.from(this.players.values()).find(p => p.address === payload.address);
    
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
      room.removePlayer(player.viewId);
      
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
