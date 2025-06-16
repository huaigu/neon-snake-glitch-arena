
-- Create table for Web3 users
CREATE TABLE public.web3_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL UNIQUE,
  username TEXT,
  nonce TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Add Row Level Security
ALTER TABLE public.web3_users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own data
CREATE POLICY "Users can view their own data" 
  ON public.web3_users 
  FOR SELECT 
  USING (address = current_setting('request.jwt.claims', true)::json->>'address');

-- Allow public access for authentication
CREATE POLICY "Public read access for auth" 
  ON public.web3_users 
  FOR SELECT 
  USING (true);

-- Allow users to update their own data
CREATE POLICY "Users can update their own data" 
  ON public.web3_users 
  FOR UPDATE 
  USING (address = current_setting('request.jwt.claims', true)::json->>'address');

-- Allow insert for new users
CREATE POLICY "Allow insert for new users" 
  ON public.web3_users 
  FOR INSERT 
  WITH CHECK (true);
