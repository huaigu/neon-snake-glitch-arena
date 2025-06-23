# 大厅房间状态更新修复

## 问题描述
游戏结束后，返回大厅页面时，房间的状态没有更新，仍然显示为之前的状态（如 `playing` 或 `finished`），而不是重置后的 `waiting` 状态。

## 根本原因
1. **状态发布机制不完整**：
   - `GameRoomModel.publishRoomState()` 只发布到 `"room"` 频道
   - `LobbyModel` 没有监听 `"room"` 频道的事件
   - 大厅页面的状态更新依赖 `LobbyModel.publishLobbyState()`

2. **通信链路断裂**：
   ```
   GameRoomModel 状态变化 → publishRoomState() → "room" 频道
                                                      ↓ (断裂)
   LobbyModel 监听 → lobbyCallback → 大厅页面UI更新
   ```

## 修复方案

### 1. 增强 GameRoomModel.publishRoomState()
在房间状态发布时，同时通知大厅进行状态更新：

```typescript
publishRoomState() {
  // 原有逻辑：发布房间状态
  this.publish("room", "updated", {
    room: roomState,
    game: gameState,
    foods: this.foods,
    segments: []
  });
  
  // 新增：通知大厅状态更新
  this.publish("lobby", "room-state-changed", {
    roomId: this.roomId,
    status: this.status
  });
}
```

### 2. LobbyModel 监听房间状态变化
添加新的事件监听器和处理方法：

```typescript
// 在 init() 中添加监听
this.subscribe("lobby", "room-state-changed", this.handleRoomStateChanged);

// 新增处理方法
handleRoomStateChanged(payload: { roomId: string; status: string }) {
  const room = this.gameRooms.get(payload.roomId);
  if (room) {
    console.log('LobbyModel: Publishing lobby state due to room state change');
    this.publishLobbyState(); // 立即发布大厅状态更新
  }
}
```

### 3. 完整的状态更新流程
```
游戏结束 → endGame() → status: 'finished' → publishRoomState()
   ↓
1秒后 → resetToWaiting() → status: 'waiting' → publishRoomState()
   ↓
room-state-changed 事件 → LobbyModel.handleRoomStateChanged()
   ↓
publishLobbyState() → "lobby" "updated" 事件 → lobbyCallback()
   ↓
大厅页面UI更新 → 显示正确的 waiting 状态
```

## 触发点
所有调用 `publishRoomState()` 的地方都会触发大厅状态更新：

1. ✅ **游戏结束**: `endGame()` → `publishRoomState()`
2. ✅ **状态重置**: `resetToWaiting()` → `publishRoomState()`
3. ✅ **玩家加入/离开**: `addPlayer()` / `removePlayer()` → `publishRoomState()`
4. ✅ **准备状态变化**: `setPlayerReady()` → `publishRoomState()`
5. ✅ **游戏开始**: `startGame()` → `publishRoomState()`
6. ✅ **倒计时**: `countdownTick()` → `publishRoomState()`

## 验证方法

### 测试步骤：
1. 创建一个房间，开始游戏
2. 游戏进行中，大厅显示房间状态为 `playing`
3. 游戏结束，等待1秒状态重置
4. 返回大厅页面
5. **期望结果**：房间状态显示为 `waiting`（绿色）

### 调试日志检查：
```
GameRoomModel: Game ended, showing results briefly then resetting to waiting state
GameRoomModel: Publishing room state: {..., status: 'finished'}
LobbyModel: Room state changed notification: {roomId: '...', status: 'finished'}
LobbyModel: Publishing lobby state due to room state change

[1秒后]

GameRoomModel: Room fully reset to waiting state
GameRoomModel: Publishing room state: {..., status: 'waiting'}  
LobbyModel: Room state changed notification: {roomId: '...', status: 'waiting'}
LobbyModel: Publishing lobby state due to room state change
RoomContext: Received lobby data: {..., rooms: [{status: 'waiting'}]}
```

## 优势

1. **实时同步**：房间状态变化立即反映在大厅
2. **解耦设计**：保持现有架构，只添加必要的通信机制
3. **完整覆盖**：所有房间状态变化都会触发大厅更新
4. **调试友好**：详细的日志记录便于问题排查

## 兼容性

此修复不会影响现有功能：
- 保持所有现有的事件发布机制
- 只是增加了额外的通知机制
- UI组件无需修改 