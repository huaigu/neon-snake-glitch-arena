import { supabase } from '@/integrations/supabase/client';

export interface GameConfig {
  test_mode: boolean;
  default_players: number;
}

let cachedConfig: GameConfig | null = null;
let configLoadPromise: Promise<GameConfig> | null = null;

export async function getGameConfig(): Promise<GameConfig> {
  // Return cached config if available
  if (cachedConfig) {
    return cachedConfig;
  }

  // Return existing promise if one is in progress
  if (configLoadPromise) {
    return configLoadPromise;
  }

  // Create new promise to load config
  configLoadPromise = loadGameConfig();
  return configLoadPromise;
}

async function loadGameConfig(): Promise<GameConfig> {
  try {
    const { data, error } = await supabase
      .from('game_config')
      .select('key, value');

    if (error) {
      console.error('Error loading game config:', error);
      // Return default values if loading fails
      return getDefaultConfig();
    }

    if (!data || data.length === 0) {
      console.warn('No game config found, using defaults');
      return getDefaultConfig();
    }

    // Convert array of key-value pairs to object
    const config: Partial<GameConfig> = {};
    for (const item of data) {
      switch (item.key) {
        case 'test_mode':
          config.test_mode = item.value === true || item.value === 'true';
          break;
        case 'default_players':
          config.default_players = parseInt(item.value as string) || 2;
          break;
      }
    }

    // Ensure all required config values are present
    const finalConfig = {
      test_mode: config.test_mode ?? true,
      default_players: config.default_players ?? 2
    };

    // Cache the loaded config
    cachedConfig = finalConfig;
    console.log('Game config loaded:', finalConfig);
    
    return finalConfig;
  } catch (error) {
    console.error('Unexpected error loading game config:', error);
    return getDefaultConfig();
  }
}

function getDefaultConfig(): GameConfig {
  return {
    test_mode: true,
    default_players: 2
  };
}

// Clear cache function for when config might have changed
export function clearConfigCache() {
  cachedConfig = null;
  configLoadPromise = null;
}

// Game configuration constants
export const GAME_CONFIG = {
  GRID_SIZE: 20,
  INITIAL_SNAKE_LENGTH: 3,
  GAME_SPEED: 200, // milliseconds
  COUNTDOWN_DURATION: 3, // seconds
  MAX_PLAYERS: 8,
} as const;

// 预定义的玩家颜色 - 按照加入房间的顺序分配
export const PLAYER_COLORS = [
  '#00ffff', // cyan - 青色
  '#ff00ff', // magenta - 洋红
  '#ffff00', // yellow - 黄色
  '#ff8800', // orange - 橙色
  '#00ff00', // green - 绿色
  '#8800ff', // purple - 紫色
  '#ff0088', // pink - 粉色
  '#88ff00', // lime - 青柠色
] as const;

// 根据玩家索引获取颜色
export const getPlayerColor = (playerIndex: number): string => {
  return PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
};

// 为玩家数组分配颜色（保持原有顺序）
export const assignPlayerColors = <T extends { color?: string }>(
  players: T[], 
  getPlayerKey: (player: T) => string
): (T & { color: string })[] => {
  // 创建一个稳定的排序，基于玩家的唯一标识
  const sortedPlayers = [...players].sort((a, b) => 
    getPlayerKey(a).localeCompare(getPlayerKey(b))
  );
  
  return players.map(player => {
    // 找到这个玩家在排序后数组中的索引
    const sortedIndex = sortedPlayers.findIndex(p => getPlayerKey(p) === getPlayerKey(player));
    return {
      ...player,
      color: getPlayerColor(sortedIndex)
    };
  });
};
