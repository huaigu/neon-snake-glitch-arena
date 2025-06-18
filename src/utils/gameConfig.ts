
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
