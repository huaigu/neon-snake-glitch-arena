# 游戏结束后用户选择功能

## 功能概述

游戏结束后，为用户提供两个明确的选择：
1. **留在房间** - 继续与相同玩家进行下一轮游戏
2. **离开房间** - 退出当前房间并返回大厅

## 实现细节

### UI 界面修改

**位置**: `src/components/SnakeGame.tsx` - 游戏结束覆盖层

**原始设计**:
- 单一按钮："Return to Lobby"
- 直接导航到大厅页面

**新设计**:
```tsx
{/* Action Buttons */}
<div className="flex flex-col sm:flex-row gap-3 justify-center">
  <button 
    onClick={() => {
      // Simply close the game over overlay and return to room lobby
      navigate('/room/' + (currentRoom?.id || ''));
    }}
    className="bg-cyber-green hover:bg-cyber-green/80 text-cyber-darker font-bold py-2 px-4 rounded neon-border transition-all text-sm"
  >
    Stay in Room
  </button>
  
  <button 
    onClick={() => {
      // Leave room and return to main lobby
      if (currentRoom && user?.address && gameView) {
        gameView.leaveRoom(currentRoom.id, user.address);
      }
      navigate('/lobby');
    }}
    className="bg-cyber-red hover:bg-cyber-red/80 text-white font-bold py-2 px-4 rounded neon-border transition-all text-sm"
  >
    Leave Room
  </button>
</div>

<p className="text-cyber-cyan/50 text-xs text-center">
  💡 Stay in room to play another round with the same players
</p>
```

### 按钮功能说明

#### 1. Stay in Room (留在房间)
- **颜色**: 绿色 (`cyber-green`)
- **功能**: 导航回房间大厅页面 (`/room/{roomId}`)
- **结果**: 
  - 用户留在当前房间
  - 返回到房间大厅界面，可以准备下一轮游戏
  - 其他玩家也会看到用户仍在房间中

#### 2. Leave Room (离开房间)
- **颜色**: 红色 (`cyber-red`)
- **功能**: 
  - 调用 `gameView.leaveRoom(currentRoom.id, user.address)` 
  - 导航到主大厅 (`/lobby`)
- **结果**:
  - 用户从当前房间中移除
  - 其他玩家会看到用户已离开
  - 如果用户是房主且有其他玩家，房主权限会转移
  - 如果房间空了，房间会被删除

### 技术依赖

#### 新增导入
```tsx
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { useMultisynq } from '../contexts/MultisynqContext';
```

#### 新增状态获取
```tsx
const { currentRoom, isSpectator: isExternalSpectator } = useRoomContext();
const { user } = useWeb3Auth();
const { gameView } = useMultisynq();
```

### 响应式设计

- **桌面端**: 按钮水平排列 (`sm:flex-row`)
- **移动端**: 按钮垂直排列 (`flex-col`)
- **间距**: 统一的 `gap-3` 确保良好的视觉效果

## 用户体验流程

### 场景 1: 留在房间
1. 游戏结束 → 显示结果和按钮选择
2. 用户点击 "Stay in Room"
3. 导航到房间大厅页面
4. 用户状态重置为未准备
5. 可以立即开始准备下一轮游戏

### 场景 2: 离开房间
1. 游戏结束 → 显示结果和按钮选择
2. 用户点击 "Leave Room"
3. 从房间玩家列表中移除
4. 导航到主大厅
5. 可以选择加入其他房间或创建新房间

## 与现有系统的集成

### 房间管理系统
- 复用现有的 `leaveRoom` 功能
- 与房间状态管理系统完全兼容
- 支持房主转移逻辑

### 游戏状态重置
- 游戏结束后房间自动重置为 `waiting` 状态（1秒后）
- 所有玩家的准备状态重置为 `false`
- 留在房间的用户可以立即开始新的准备流程

### 导航系统
- 使用 React Router 的 `navigate` 函数
- 路径构建：`/room/${roomId}` 和 `/lobby`
- 与现有路由系统完全兼容

## 优势

1. **用户选择自由度**: 用户可以根据情况选择最合适的操作
2. **社交体验优化**: 鼓励与相同玩家继续游戏，增强社交粘性
3. **快速重新开始**: 留在房间可以快速开始下一轮，减少等待时间
4. **清晰的用户意图**: 两个按钮的功能和后果都很明确
5. **响应式设计**: 在各种设备上都有良好的用户体验

## 测试要点

### 功能测试
- [ ] "Stay in Room" 按钮正确导航到房间页面
- [ ] "Leave Room" 按钮正确调用离开房间逻辑
- [ ] 房主离开时房主权限正确转移
- [ ] 最后一个玩家离开时房间正确删除

### UI 测试
- [ ] 桌面端按钮水平排列
- [ ] 移动端按钮垂直排列
- [ ] 按钮悬停效果正常
- [ ] 颜色主题符合赛博朋克风格

### 集成测试
- [ ] 与现有游戏流程无冲突
- [ ] 房间状态正确更新
- [ ] 其他玩家能看到用户选择的结果
- [ ] 导航系统工作正常

这个功能大大提升了游戏的用户体验，给予玩家更多的选择自由度，同时鼓励了连续游戏和社交互动。 