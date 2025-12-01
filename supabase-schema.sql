-- Create post_stats table for tracking views and likes
CREATE TABLE IF NOT EXISTS post_stats (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_post_stats_slug ON post_stats(slug);

-- Enable Row Level Security
ALTER TABLE post_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read post stats
CREATE POLICY "Anyone can view post stats"
  ON post_stats
  FOR SELECT
  TO public
  USING (true);

-- Policy: Anyone can insert new post stats
CREATE POLICY "Anyone can insert post stats"
  ON post_stats
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Anyone can update post stats
CREATE POLICY "Anyone can update post stats"
  ON post_stats
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_post_stats_updated_at
  BEFORE UPDATE ON post_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
