-- Comments table for blog posts with user authentication
CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by slug
CREATE INDEX IF NOT EXISTS comments_slug_idx ON comments(slug);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS comments_user_idx ON comments(user_id);

-- Enable Row Level Security
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access" ON comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

-- Anyone can read comments
CREATE POLICY "Public read access" ON comments
  FOR SELECT USING (true);

-- Only logged-in users can insert comments
CREATE POLICY "Authenticated users can comment" ON comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only owner can delete their own comment
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
