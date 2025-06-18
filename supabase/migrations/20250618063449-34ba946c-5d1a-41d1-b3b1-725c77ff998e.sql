
-- 创建游戏配置表
CREATE TABLE public.game_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 插入默认配置
INSERT INTO public.game_config (key, value, description) VALUES 
  ('test_mode', 'true', '测试模式：true时游戏不会在只剩1个玩家时结束'),
  ('default_players', '2', '默认最少玩家数量');

-- 启用行级安全 (RLS)
ALTER TABLE public.game_config ENABLE ROW LEVEL SECURITY;

-- 创建公共读取策略 (所有人都可以读取配置)
CREATE POLICY "Anyone can read game config" 
  ON public.game_config 
  FOR SELECT 
  USING (true);

-- 添加更新时间戳触发器
CREATE TRIGGER update_game_config_updated_at
  BEFORE UPDATE ON public.game_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
