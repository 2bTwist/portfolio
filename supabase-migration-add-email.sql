-- Migration: Add user_display_name column to comments table
-- Run this in Supabase SQL Editor

-- Add the column
ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_display_name TEXT;

-- Update existing comments (if any) with a placeholder
-- You may want to manually update these or delete test data
UPDATE comments SET user_display_name = 'Anonymous' WHERE user_display_name IS NULL;

-- Make it required for future inserts
ALTER TABLE comments ALTER COLUMN user_display_name SET NOT NULL;
