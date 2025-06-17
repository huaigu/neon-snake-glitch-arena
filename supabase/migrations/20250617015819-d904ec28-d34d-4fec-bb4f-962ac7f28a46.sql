
-- Create rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  host_address TEXT NOT NULL REFERENCES public.web3_users(address) ON DELETE CASCADE,
  max_players INTEGER NOT NULL DEFAULT 8,
  is_private BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create room_players table for many-to-many relationship
CREATE TABLE public.room_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  player_address TEXT NOT NULL REFERENCES public.web3_users(address) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, player_address)
);

-- Create leaderboard table
CREATE TABLE public.leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_address TEXT NOT NULL REFERENCES public.web3_users(address) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  score INTEGER NOT NULL DEFAULT 0,
  rank_position INTEGER,
  game_duration INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms table
CREATE POLICY "Everyone can view rooms" 
  ON public.rooms 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create rooms" 
  ON public.rooms 
  FOR INSERT 
  TO authenticated
  WITH CHECK (host_address = current_setting('request.jwt.claims', true)::json->>'address');

CREATE POLICY "Host can update their rooms" 
  ON public.rooms 
  FOR UPDATE 
  TO authenticated
  USING (host_address = current_setting('request.jwt.claims', true)::json->>'address');

CREATE POLICY "Host can delete their rooms" 
  ON public.rooms 
  FOR DELETE 
  TO authenticated
  USING (host_address = current_setting('request.jwt.claims', true)::json->>'address');

-- RLS Policies for room_players table
CREATE POLICY "Everyone can view room players" 
  ON public.room_players 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can join rooms" 
  ON public.room_players 
  FOR INSERT 
  TO authenticated
  WITH CHECK (player_address = current_setting('request.jwt.claims', true)::json->>'address');

CREATE POLICY "Players can leave rooms" 
  ON public.room_players 
  FOR DELETE 
  TO authenticated
  USING (player_address = current_setting('request.jwt.claims', true)::json->>'address');

-- RLS Policies for leaderboard table
CREATE POLICY "Everyone can view leaderboard" 
  ON public.leaderboard 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can submit scores" 
  ON public.leaderboard 
  FOR INSERT 
  TO authenticated
  WITH CHECK (player_address = current_setting('request.jwt.claims', true)::json->>'address');

-- Create indexes for better performance
CREATE INDEX idx_rooms_status ON public.rooms(status);
CREATE INDEX idx_rooms_created_at ON public.rooms(created_at DESC);
CREATE INDEX idx_room_players_room_id ON public.room_players(room_id);
CREATE INDEX idx_leaderboard_score ON public.leaderboard(score DESC);
CREATE INDEX idx_leaderboard_created_at ON public.leaderboard(created_at DESC);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at on rooms table
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for all tables
ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.room_players REPLICA IDENTITY FULL;
ALTER TABLE public.leaderboard REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard;
