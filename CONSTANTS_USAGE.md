# 游戏常量配置文档

## 配置文件位置
`src/utils/gameConstants.ts`

## 配置结构

### 1. 玩家相关配置 (GAME_CONFIG.PLAYERS)
- `MIN_PLAYERS: 2` - 最少需要多少玩家才能开始游戏  
- `MAX_PLAYERS: 8` - 房间最大玩家数量
- `MIN_FORCE_START: 1` - 强制开始游戏的最少玩家数

### 2. 游戏棋盘配置 (GAME_CONFIG.BOARD)
- `SIZE: 60` - 游戏棋盘大小 (60x60)
- `GRID_SIZE: 20` - 每个格子的像素大小

### 3. 游戏时间配置 (GAME_CONFIG.TIMING)
- `GAME_TICK_RATE: 5500` - 游戏tick速率 (毫秒)
- `COUNTDOWN_DURATION: 3` - 游戏开始倒计时 (秒)
- `FORCE_START_DELAY: 3` - 强制开始的延迟时间 (秒)
- `ROOM_JOIN_TIMEOUT: 5` - 房间加入超时时间 (秒)

### 4. UI 相关配置 (GAME_CONFIG.UI)
- `PLAYER_SLOTS_DISPLAY: 8` - 玩家列表显示的槽位数量
- `TOAST_DURATION: 3000` - Toast 消息显示时长 (毫秒)

### 5. NFT 相关配置 (GAME_CONFIG.NFT)
- `SCORE_MULTIPLIER: 2` - NFT持有者的分数倍数

## 使用方式

### 直接导入常量
```typescript
import { 
  MIN_PLAYERS, 
  MAX_PLAYERS, 
  BOARD_SIZE, 
  GAME_TICK_RATE,
  TOAST_DURATION 
} from '../utils/gameConstants';
```

### 导入完整配置对象
```typescript
import { GAME_CONFIG } from '../utils/gameConstants';

// 使用方式：
GAME_CONFIG.PLAYERS.MIN_PLAYERS
GAME_CONFIG.BOARD.SIZE
GAME_CONFIG.TIMING.GAME_TICK_RATE
```

## 已更新的文件

### 1. src/models/GameRoomModel.ts
- ✅ 将硬编码的 CONFIG 替换为 GAME_CONFIG
- ✅ 更新 `BOARD_SIZE` → `BOARD.SIZE`
- ✅ 更新 `GAME_TICK_RATE` → `TIMING.GAME_TICK_RATE`
- ✅ 更新 `COUNTDOWN_DURATION` → `TIMING.COUNTDOWN_DURATION`

### 2. src/components/GameLobbyComponent.tsx
- ✅ 使用 `MIN_FORCE_START` 替代硬编码的 1
- ✅ 使用 `TOAST_DURATION` 替代硬编码的 3000
- ✅ 使用 `FORCE_START_DELAY` 替代硬编码的 3

### 3. src/components/PlayerList.tsx
- ✅ 使用 `PLAYER_SLOTS_DISPLAY` 替代硬编码的 8

### 4. src/pages/RoomPage.tsx
- ✅ 使用 `ROOM_JOIN_TIMEOUT` 替代硬编码的 5 秒

## 迁移前后对比

### 迁移前
```typescript
// 各种文件中散布的硬编码值
const maxPlayers = 8;
const boardSize = 60;
const tickRate = 5500;
const timeout = 5000;
```

### 迁移后
```typescript
// 统一的配置管理
import { MAX_PLAYERS, BOARD_SIZE, GAME_TICK_RATE, ROOM_JOIN_TIMEOUT } from '../utils/gameConstants';

// 或者
import { GAME_CONFIG } from '../utils/gameConstants';
```

## 优势

1. **集中管理**: 所有游戏配置参数集中在一个文件中
2. **类型安全**: 使用 TypeScript 类型定义确保类型安全
3. **易于维护**: 修改配置只需要更新一个文件
4. **避免魔法数字**: 所有硬编码值都有明确的语义
5. **开发者友好**: 清晰的注释说明每个参数的作用

## 注意事项

- 所有时间相关的常量都以最小单位（秒或毫秒）为准
- 棋盘大小和网格大小保持一致性
- 玩家数量限制要与UI显示槽位数量协调
- 修改配置前请考虑对游戏平衡性的影响 