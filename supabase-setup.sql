-- Run this in Supabase SQL Editor
-- Creates comments table with proper structure

CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_slug ON comments(slug);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments
CREATE POLICY "Anyone can read comments" ON comments
  FOR SELECT USING (true);

-- Authenticated users can insert their own comments
CREATE POLICY "Users can insert comments" ON comments
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own comments
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
