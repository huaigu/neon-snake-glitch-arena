// 游戏核心配置常量
export const GAME_CONFIG = {
  // 玩家相关配置
  PLAYERS: {
    MIN_PLAYERS: 2,          // 最少需要多少玩家才能开始游戏
    MAX_PLAYERS: 8,          // 房间最大玩家数量
    MIN_FORCE_START: 1,      // 强制开始游戏的最少玩家数
  },
  
  // 游戏棋盘配置
  BOARD: {
    SIZE: 200,                // 游戏棋盘大小 (60x60)
    GRID_SIZE: 20,           // 每个格子的像素大小
  },
  
  // 游戏时间配置
  TIMING: {
    GAME_TICK_RATE: 800,    // 游戏tick速率 (毫秒)
    COUNTDOWN_DURATION: 5,   // 游戏开始倒计时 (秒)
    FORCE_START_DELAY: 3,    // 强制开始的延迟时间 (秒)
    ROOM_JOIN_TIMEOUT: 5,    // 房间加入超时时间 (秒)
    GAME_END_RESULT_DURATION: 10,  // 游戏结束后显示结果的时间 (秒)
  },
  
  // UI 相关配置
  UI: {
    PLAYER_SLOTS_DISPLAY: 8, // 玩家列表显示的槽位数量
    TOAST_DURATION: 3000,    // Toast 消息显示时长 (毫秒)
  },
  
  // NFT 相关配置
  NFT: {
    SCORE_MULTIPLIER: 1,     // NFT持有者的分数倍数
  }
} as const;

// 导出常用的常量，方便直接使用
export const {
  MIN_PLAYERS,
  MAX_PLAYERS,
  MIN_FORCE_START
} = GAME_CONFIG.PLAYERS;

export const {
  SIZE: BOARD_SIZE,
  GRID_SIZE
} = GAME_CONFIG.BOARD;

export const {
  GAME_TICK_RATE,
  COUNTDOWN_DURATION,
  FORCE_START_DELAY,
  ROOM_JOIN_TIMEOUT,
  GAME_END_RESULT_DURATION
} = GAME_CONFIG.TIMING;

export const {
  PLAYER_SLOTS_DISPLAY,
  TOAST_DURATION
} = GAME_CONFIG.UI;

export const {
  SCORE_MULTIPLIER
} = GAME_CONFIG.NFT;

// 类型定义
export type GameConfigType = typeof GAME_CONFIG; 