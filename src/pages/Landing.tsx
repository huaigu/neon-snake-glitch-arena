
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Gamepad2, Users, Zap, Crown } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  const handleEnterLobby = () => {
    navigate('/lobby');
  };

  return (
    <div className="min-h-screen bg-cyber-darker flex items-center justify-center p-4">
      <div className="w-full max-w-4xl text-center">
        {/* Main Title */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold text-cyber-cyan neon-text mb-4">
            CYBER SNAKE
          </h1>
          <h2 className="text-3xl font-bold text-cyber-green neon-text mb-6">
            GLITCH ARENA
          </h2>
          <p className="text-xl text-cyber-cyan/70 mb-8 max-w-2xl mx-auto">
            进入赛博朋克世界的多人贪吃蛇竞技场。与朋友一起战斗，成为终极蛇王！
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="cyber-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyber-cyan">
                <Users className="w-6 h-6" />
                多人对战
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-cyber-cyan/70">
                最多8名玩家同时在线对战，体验刺激的多人竞技
              </p>
            </CardContent>
          </Card>

          <Card className="cyber-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyber-cyan">
                <Zap className="w-6 h-6" />
                智能机器人
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-cyber-cyan/70">
                添加AI机器人填充房间，随时开始游戏挑战
              </p>
            </CardContent>
          </Card>

          <Card className="cyber-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyber-cyan">
                <Crown className="w-6 h-6" />
                房间系统
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-cyber-cyan/70">
                创建自己的房间，邀请朋友加入专属对战
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enter Button */}
        <div className="space-y-4">
          <Button
            onClick={handleEnterLobby}
            size="lg"
            className="bg-cyber-cyan hover:bg-cyber-cyan/80 text-cyber-darker text-xl px-12 py-6 neon-border"
          >
            <Gamepad2 className="w-6 h-6 mr-3" />
            进入游戏大厅
          </Button>
          
          <p className="text-cyber-cyan/50 text-sm">
            准备好征服赛博空间了吗？
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
