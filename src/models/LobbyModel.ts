import * as Multisynq from '@multisynq/client';

export interface Room {
  id: string;
  name: string;
  host: string;
  hostAddress: string;
  players: Player[];
  maxPlayers: number;
  isPrivate: boolean;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: string;
}

export interface Player {
  id: string;
  address: string;
  name: string;
  isReady: boolean;
  joinedAt: string;
}

export class LobbyModel extends Multisynq.Model {
  rooms: Room[] = [];
  private instanceId: string;

  init() {
    this.instanceId = `lobby_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    console.log(`LobbyModel instance created and initialized: ${this.instanceId}`);
    
    // 监听玩家进入和离开事件
    this.subscribe(this.sessionId, "view-join", this.onViewJoin);
    this.subscribe(this.sessionId, "view-exit", this.onViewExit);
    
    // 监听房间相关事件
    console.log(`LobbyModel ${this.instanceId}: Subscribing to lobby events`);
    this.subscribe("lobby", "create-room", this.createRoom);
    this.subscribe("lobby", "join-room", this.joinRoom);
    this.subscribe("lobby", "leave-room", this.leaveRoom);
    this.subscribe("lobby", "toggle-ready", this.togglePlayerReady);
    console.log(`LobbyModel ${this.instanceId}: Event subscriptions complete`);
  }

  onViewJoin(viewInfo: any) {
    console.log(`Player joined lobby (${this.instanceId}):`, viewInfo);
    this.publish("lobby", "player-joined", viewInfo);
  }

  onViewExit(viewInfo: any) {
    console.log(`Player left lobby (${this.instanceId}):`, viewInfo);
    
    // 查找用户创建的房间，如果用户是房主则删除整个房间
    const userRooms = this.rooms.filter(room => room.hostAddress === viewInfo.viewId);
    if (userRooms.length > 0) {
      // 删除用户创建的所有房间
      this.rooms = this.rooms.filter(room => room.hostAddress !== viewInfo.viewId);
      console.log(`Deleted ${userRooms.length} room(s) created by user ${viewInfo.viewId}`);
    }
    
    // 从其他房间中移除该玩家
    this.rooms = this.rooms.map(room => ({
      ...room,
      players: room.players.filter(p => p.address !== viewInfo.viewId)
    }));
    
    this.publish("lobby", "rooms-updated", this.rooms);
  }

  createRoom(data: { roomName: string; hostName: string; hostAddress: string }) {
    // 检查用户是否已经创建了房间
    const existingRoom = this.rooms.find(room => room.hostAddress === data.hostAddress);
    if (existingRoom) {
      this.publish("lobby", "room-creation-failed", { 
        error: "You can only create one room at a time. Please leave your current room first." 
      });
      return;
    }

    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRoom: Room = {
      id: roomId,
      name: data.roomName,
      host: data.hostName,
      hostAddress: data.hostAddress,
      players: [{
        id: data.hostAddress,
        address: data.hostAddress,
        name: data.hostName,
        isReady: false,
        joinedAt: new Date().toISOString()
      }],
      maxPlayers: 8,
      isPrivate: false,
      status: 'waiting',
      createdAt: new Date().toISOString()
    };

    this.rooms.push(newRoom);
    this.publish("lobby", "room-created", { roomId, room: newRoom });
    this.publish("lobby", "rooms-updated", this.rooms);
  }

  joinRoom(data: { roomId: string; playerAddress: string; playerName: string }) {
    const roomIndex = this.rooms.findIndex(r => r.id === data.roomId);
    if (roomIndex === -1) {
      this.publish("lobby", "join-room-failed", { error: "Room not found" });
      return;
    }

    const room = this.rooms[roomIndex];
    if (room.players.length >= room.maxPlayers || room.status !== 'waiting') {
      this.publish("lobby", "join-room-failed", { error: "Room is full or not available" });
      return;
    }

    if (room.players.some(p => p.address === data.playerAddress)) {
      this.publish("lobby", "join-room-success", { roomId: data.roomId });
      return;
    }

    const newPlayer: Player = {
      id: data.playerAddress,
      address: data.playerAddress,
      name: data.playerName,
      isReady: false,
      joinedAt: new Date().toISOString()
    };

    this.rooms[roomIndex] = {
      ...room,
      players: [...room.players, newPlayer]
    };

    this.publish("lobby", "join-room-success", { roomId: data.roomId });
    this.publish("lobby", "rooms-updated", this.rooms);
  }

  leaveRoom(data: { roomId: string; playerAddress: string }) {
    console.log('leaveRoom called:', data);
    const roomIndex = this.rooms.findIndex(r => r.id === data.roomId);
    if (roomIndex === -1) {
      console.log('Room not found:', data.roomId);
      return;
    }

    const room = this.rooms[roomIndex];
    console.log('Room found:', room);
    console.log('Player leaving:', data.playerAddress, 'Room host:', room.hostAddress);
    
    // 如果离开的是房主，直接删除整个房间
    if (room.hostAddress === data.playerAddress) {
      this.rooms.splice(roomIndex, 1);
      console.log(`Room ${data.roomId} deleted because host ${data.playerAddress} left`);
      console.log('Remaining rooms:', this.rooms.length);
    } else {
      console.log('Player is not the host, removing player from room');
      // 如果离开的是普通成员，只移除该玩家
      const updatedPlayers = room.players.filter(p => p.address !== data.playerAddress);
      
      if (updatedPlayers.length === 0) {
        // 如果没有玩家了，删除房间
        this.rooms.splice(roomIndex, 1);
        console.log(`Room ${data.roomId} deleted because no players left`);
      } else {
        // 更新房间玩家列表
        this.rooms[roomIndex] = {
          ...room,
          players: updatedPlayers
        };
        console.log(`Updated room ${data.roomId}, remaining players:`, updatedPlayers.length);
      }
    }

    console.log('Publishing rooms-updated event with', this.rooms.length, 'rooms');
    this.publish("lobby", "rooms-updated", this.rooms);
  }

  togglePlayerReady(data: { roomId: string; playerAddress: string }) {
    console.log('togglePlayerReady called:', data);
    const roomIndex = this.rooms.findIndex(r => r.id === data.roomId);
    if (roomIndex === -1) {
      console.log('Room not found:', data.roomId);
      return;
    }

    const room = this.rooms[roomIndex];
    const playerIndex = room.players.findIndex(p => p.address === data.playerAddress);
    if (playerIndex === -1) {
      console.log('Player not found in room:', data.playerAddress);
      return;
    }

    const oldReadyState = this.rooms[roomIndex].players[playerIndex].isReady;
    this.rooms[roomIndex].players[playerIndex].isReady = !oldReadyState;
    const newReadyState = this.rooms[roomIndex].players[playerIndex].isReady;
    
    console.log(`Player ${data.playerAddress} ready state changed: ${oldReadyState} -> ${newReadyState}`);
    console.log('Updated room:', this.rooms[roomIndex]);
    
    this.publish("lobby", "rooms-updated", this.rooms);
  }
}

LobbyModel.register("LobbyModel");
