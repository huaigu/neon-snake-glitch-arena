
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomContext } from '../contexts/RoomContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Users, Plus, Crown, Lock, Clock, Play } from 'lucide-react';

export const RoomList: React.FC = () => {
  const navigate = useNavigate();
  const { rooms, currentPlayerName, createRoom, joinRoom } = useRoomContext();
  const [newRoomName, setNewRoomName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return;
    
    const roomId = createRoom(newRoomName.trim(), false);
    setNewRoomName('');
    setIsDialogOpen(false);
    navigate(`/room/${roomId}`);
  };

  const handleJoinRoom = (roomId: string) => {
    const success = joinRoom(roomId);
    if (success) {
      navigate(`/room/${roomId}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-green-500';
      case 'playing': return 'bg-red-500';
      case 'full': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return '等待中';
      case 'playing': return '游戏中';
      case 'full': return '已满员';
      default: return '未知';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-cyber-cyan neon-text mb-2">
            游戏大厅
          </h1>
          <p className="text-cyber-cyan/70">
            选择房间开始你的冒险，当前玩家：{currentPlayerName}
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyber-cyan hover:bg-cyber-cyan/80 text-cyber-darker">
              <Plus className="w-4 h-4 mr-2" />
              创建房间
            </Button>
          </DialogTrigger>
          <DialogContent className="cyber-panel">
            <DialogHeader>
              <DialogTitle className="text-cyber-cyan">创建新房间</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-cyber-cyan/70 mb-2 block">
                  房间名称
                </label>
                <Input
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="输入房间名称..."
                  className="bg-cyber-darker border-cyber-cyan/30 text-cyber-cyan"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateRoom}
                  disabled={!newRoomName.trim()}
                  className="flex-1 bg-cyber-cyan hover:bg-cyber-cyan/80 text-cyber-darker"
                >
                  创建房间
                </Button>
                <Button
                  onClick={() => setIsDialogOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  取消
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Room Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="cyber-panel">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyber-cyan" />
              <div>
                <div className="text-2xl font-bold text-cyber-cyan">
                  {rooms.length}
                </div>
                <div className="text-sm text-cyber-cyan/70">活跃房间</div>
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
                <div className="text-sm text-cyber-cyan/70">等待房间</div>
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
                  {rooms.filter(r => r.status === 'playing').length}
                </div>
                <div className="text-sm text-cyber-cyan/70">游戏中</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rooms Grid */}
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
                    <span>{room.host}</span>
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
                  <span className="text-cyber-cyan/70">玩家数量</span>
                  <span className="text-cyber-cyan">
                    {room.players.length}/{room.maxPlayers}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {room.players.slice(0, 3).map((player, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {player}
                    </Badge>
                  ))}
                  {room.players.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{room.players.length - 3}
                    </Badge>
                  )}
                </div>

                <Button
                  onClick={() => handleJoinRoom(room.id)}
                  disabled={room.status === 'playing' || room.status === 'full'}
                  className="w-full"
                  variant={room.status === 'waiting' ? 'default' : 'outline'}
                >
                  {room.status === 'playing' ? '游戏进行中' :
                   room.status === 'full' ? '房间已满' : '加入房间'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-cyber-cyan/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-cyber-cyan/70 mb-2">
            暂无活跃房间
          </h3>
          <p className="text-cyber-cyan/50 mb-6">
            创建第一个房间开始游戏吧！
          </p>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-cyber-cyan hover:bg-cyber-cyan/80 text-cyber-darker"
          >
            <Plus className="w-4 h-4 mr-2" />
            创建房间
          </Button>
        </div>
      )}
    </div>
  );
};
