
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

  init() {
    console.log('LobbyModel initialized');
    // 监听玩家进入和离开事件
    this.subscribe(this.sessionId, "view-join", this.onViewJoin);
    this.subscribe(this.sessionId, "view-exit", this.onViewExit);
    
    // 监听房间相关事件
    this.subscribe("lobby", "create-room", this.createRoom);
    this.subscribe("lobby", "join-room", this.joinRoom);
    this.subscribe("lobby", "leave-room", this.leaveRoom);
    this.subscribe("lobby", "toggle-ready", this.togglePlayerReady);
  }

  onViewJoin(viewInfo: any) {
    console.log('Player joined lobby:', viewInfo);
    this.publish("lobby", "player-joined", viewInfo);
  }

  onViewExit(viewInfo: any) {
    console.log('Player left lobby:', viewInfo);
    // 从所有房间中移除该玩家
    this.rooms = this.rooms.map(room => ({
      ...room,
      players: room.players.filter(p => p.address !== viewInfo.viewId)
    })).filter(room => room.players.length > 0 || room.hostAddress !== viewInfo.viewId);
    
    this.publish("lobby", "rooms-updated", this.rooms);
  }

  createRoom = (data: { roomName: string; hostName: string; hostAddress: string }) => {
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
  };

  joinRoom = (data: { roomId: string; playerAddress: string; playerName: string }) => {
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
  };

  leaveRoom = (data: { roomId: string; playerAddress: string }) => {
    const roomIndex = this.rooms.findIndex(r => r.id === data.roomId);
    if (roomIndex === -1) return;

    const room = this.rooms[roomIndex];
    const updatedPlayers = room.players.filter(p => p.address !== data.playerAddress);

    if (updatedPlayers.length === 0) {
      // 删除空房间
      this.rooms.splice(roomIndex, 1);
    } else {
      // 如果离开的是房主，指定新房主
      let newHost = room.host;
      let newHostAddress = room.hostAddress;
      
      if (room.hostAddress === data.playerAddress && updatedPlayers.length > 0) {
        newHost = updatedPlayers[0].name;
        newHostAddress = updatedPlayers[0].address;
      }

      this.rooms[roomIndex] = {
        ...room,
        host: newHost,
        hostAddress: newHostAddress,
        players: updatedPlayers
      };
    }

    this.publish("lobby", "rooms-updated", this.rooms);
  };

  togglePlayerReady = (data: { roomId: string; playerAddress: string }) => {
    const roomIndex = this.rooms.findIndex(r => r.id === data.roomId);
    if (roomIndex === -1) return;

    const room = this.rooms[roomIndex];
    const playerIndex = room.players.findIndex(p => p.address === data.playerAddress);
    if (playerIndex === -1) return;

    this.rooms[roomIndex].players[playerIndex].isReady = !this.rooms[roomIndex].players[playerIndex].isReady;
    this.publish("lobby", "rooms-updated", this.rooms);
  };
}

LobbyModel.register("LobbyModel");
