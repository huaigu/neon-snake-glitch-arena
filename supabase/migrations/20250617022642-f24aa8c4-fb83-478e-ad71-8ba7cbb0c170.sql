
-- Drop existing RLS policies for rooms table
DROP POLICY IF EXISTS "Everyone can view rooms" ON public.rooms;
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.rooms;
DROP POLICY IF EXISTS "Host can update their rooms" ON public.rooms;
DROP POLICY IF EXISTS "Host can delete their rooms" ON public.rooms;

-- Drop existing RLS policies for room_players table
DROP POLICY IF EXISTS "Everyone can view room players" ON public.room_players;
DROP POLICY IF EXISTS "Authenticated users can join rooms" ON public.room_players;
DROP POLICY IF EXISTS "Players can leave rooms" ON public.room_players;

-- Create new RLS policies that allow public access for our Web3 authentication
-- Since we're handling authentication at the application level with wallet signatures

-- RLS Policies for rooms table - allow public access
CREATE POLICY "Public can view rooms" 
  ON public.rooms 
  FOR SELECT 
  USING (true);

CREATE POLICY "Public can create rooms" 
  ON public.rooms 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Public can update rooms" 
  ON public.rooms 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Public can delete rooms" 
  ON public.rooms 
  FOR DELETE 
  USING (true);

-- RLS Policies for room_players table - allow public access
CREATE POLICY "Public can view room players" 
  ON public.room_players 
  FOR SELECT 
  USING (true);

CREATE POLICY "Public can join rooms" 
  ON public.room_players 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Public can leave rooms" 
  ON public.room_players 
  FOR DELETE 
  USING (true);
