import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomContext } from '../contexts/RoomContext';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { useMultisynq } from '../contexts/MultisynqContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Users, Plus, Crown, Lock, Clock, Play, Loader2, AlertCircle, Wifi, WifiOff, Eye } from 'lucide-react';

export const RoomList: React.FC = () => {
  const navigate = useNavigate();
  const { 
    rooms, 
    currentPlayerName, 
    createRoom, 
    joinRoom, 
    loading, 
    error,
    isConnected
  } = useRoomContext();
  const { user } = useWeb3Auth();
  const { gameView } = useMultisynq();
  const [newRoomName, setNewRoomName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    
    setIsCreating(true);
    const roomId = await createRoom(newRoomName.trim());
    setIsCreating(false);
    
    if (roomId) {
      setNewRoomName('');
      setIsDialogOpen(false);
      navigate(`/room/${roomId}`);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    const success = await joinRoom(roomId);
    if (success) {
      navigate(`/room/${roomId}`);
    }
  };

  const handleWatchRoom = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-green-500';
      case 'countdown': return 'bg-yellow-500';
      case 'playing': return 'bg-red-500';
      case 'finished': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'Waiting';
      case 'countdown': return 'Starting';
      case 'playing': return 'Playing';
      case 'finished': return 'Finished';
      default: return 'Unknown';
    }
  };

  const truncateName = (name: string, maxLength: 12) => {
    if (name.length <= maxLength) {
      return name;
    }
    const frontChars = 6;
    const backChars = 6;
    return `${name.slice(0, frontChars)}...${name.slice(-backChars)}`;
  };

  // Check if current player already hosts a room - 直接从model读取最新状态
  const currentPlayerHostsRoom = React.useMemo(() => {
    if (!user?.address || !gameView?.model?.lobby) {
      return false;
    }
    
    const currentState = gameView.model.lobby.getLobbyState();
    const existingHostedRoom = currentState.rooms.find(room => 
      room.hostAddress === user.address
    );
    
    const hostsRoom = !!existingHostedRoom;
    
    // 添加调试信息
    console.log('RoomList: Host room check (from model):', {
      userAddress: user.address,
      roomsWithHosts: currentState.rooms.map(r => ({ id: r.id, name: r.name, hostAddress: r.hostAddress })),
      existingHostedRoom: existingHostedRoom ? { id: existingHostedRoom.id, name: existingHostedRoom.name } : null,
      currentPlayerHostsRoom: hostsRoom
    });
    
    return hostsRoom;
  }, [user?.address, gameView?.model?.lobby, rooms.length]); // 依赖rooms.length来触发重新计算

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-cyber-cyan neon-text">
              Game Lobby
            </h1>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="w-5 h-5 text-green-400" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-400" />
              )}
              <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          <p className="text-cyber-cyan/70">
            Choose a room to start your adventure • Current player: {currentPlayerName}
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-cyber-cyan hover:bg-cyber-cyan/80 text-cyber-darker"
              disabled={loading || !isConnected || currentPlayerHostsRoom}
              title={currentPlayerHostsRoom ? "You can only create one room at a time" : ""}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Room
            </Button>
          </DialogTrigger>
          <DialogContent className="cyber-panel">
            <DialogHeader>
              <DialogTitle className="text-cyber-cyan">Create New Room</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-cyber-cyan/70 mb-2 block">
                  Room Name
                </label>
                <Input
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Enter room name..."
                  className="bg-cyber-darker border-cyber-cyan/30 text-cyber-cyan"
                  onKeyDown={(e) => e.key === 'Enter' && !isCreating && handleCreateRoom()}
                  disabled={isCreating}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateRoom}
                  disabled={!newRoomName.trim() || isCreating || !isConnected}
                  className="flex-1 bg-cyber-cyan hover:bg-cyber-cyan/80 text-cyber-darker"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Room'
                  )}
                </Button>
                <Button
                  onClick={() => setIsDialogOpen(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={isCreating}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Connection Status Alert */}
      {!isConnected && (
        <Alert className="mb-6 border-red-500/50 bg-red-500/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-400">
            Not connected to lobby session. Some features may not work properly.
          </AlertDescription>
        </Alert>
      )}

      {/* Host Room Limit Alert */}
      {currentPlayerHostsRoom && (
        <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-yellow-400">
            You can only create one room at a time. Leave your current room to create a new one.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 border-red-500/50 bg-red-500/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-400">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Room Stats */}
      {rooms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="cyber-panel">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyber-cyan" />
                <div>
                  <div className="text-2xl font-bold text-cyber-cyan">
                    {rooms.length}
                  </div>
                  <div className="text-sm text-cyber-cyan/70">Active Rooms</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cyber-panel">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {rooms.filter(r => r.status === 'waiting').length}
                  </div>
                  <div className="text-sm text-cyber-cyan/70">Waiting</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cyber-panel">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-red-400" />
                <div>
                  <div className="text-2xl font-bold text-red-400">
                    {rooms.filter(r => r.status === 'playing' || r.status === 'countdown').length}
                  </div>
                  <div className="text-sm text-cyber-cyan/70">Active Games</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rooms Grid */}
      {rooms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <Card key={room.id} className="cyber-panel hover:border-cyber-cyan/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-cyber-cyan text-lg mb-1">
                      {room.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-cyber-cyan/70">
                      <Crown className="w-4 h-4" />
                      <span>{truncateName(room.host || '', 12)}</span>
                      {room.isPrivate && <Lock className="w-4 h-4" />}
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(room.status)} text-white`}>
                    {getStatusText(room.status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-cyber-cyan/70">Player Count</span>
                    <span className="text-cyber-cyan">
                      {room.players.length}/{room.maxPlayers}
                    </span>
                  </div>

                  <Button
                    onClick={() => {
                      if (room.status === 'playing' || room.status === 'countdown' || room.status === 'finished') {
                        handleWatchRoom(room.id);
                      } else {
                        handleJoinRoom(room.id);
                      }
                    }}
                    disabled={
                      (room.status === 'waiting' && room.players.length >= room.maxPlayers) ||
                      loading ||
                      !isConnected
                    }
                    className="w-full"
                    variant={
                      room.status === 'playing' || room.status === 'countdown' || room.status === 'finished' 
                        ? 'outline' 
                        : 'default'
                    }
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : room.status === 'playing' ? (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Watch Game
                      </>
                    ) : room.status === 'countdown' ? (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Watch Game
                      </>
                    ) : room.status === 'finished' ? (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        View Results
                      </>
                    ) : room.players.length >= room.maxPlayers ? (
                      'Room Full'
                    ) : (
                      'Join Room'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && rooms.length === 0 && isConnected && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-cyber-cyan/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-cyber-cyan/70 mb-2">
            No Active Rooms
          </h3>
          <p className="text-cyber-cyan/50 mb-6">
            Create the first room to start playing!
          </p>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-cyber-cyan hover:bg-cyber-cyan/80 text-cyber-darker"
            disabled={loading || currentPlayerHostsRoom}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Room
          </Button>
        </div>
      )}
    </div>
  );
};
