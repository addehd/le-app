-- Migration: Add reactions and comments for properties
-- Description: Creates property_reactions and property_comments tables with RLS policies

-- Create property_reactions table
CREATE TABLE IF NOT EXISTS property_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id TEXT NOT NULL REFERENCES property_links(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  emoji TEXT NOT NULL CHECK (emoji IN ('❤️', '👍', '⭐', '🔥', '😍')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: users can only add each emoji once per property
  UNIQUE(property_id, user_id, emoji)
);

-- Create property_comments table
CREATE TABLE IF NOT EXISTS property_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id TEXT NOT NULL REFERENCES property_links(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES property_comments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_property_reactions_property_id ON property_reactions(property_id);
CREATE INDEX IF NOT EXISTS idx_property_reactions_user_id ON property_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_property_comments_property_id ON property_comments(property_id);
CREATE INDEX IF NOT EXISTS idx_property_comments_parent_id ON property_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_property_comments_created_at ON property_comments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE property_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_reactions

-- Policy: Everyone can view reactions
CREATE POLICY "Public read access for reactions"
  ON property_reactions
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can add reactions with their email
CREATE POLICY "Authenticated users can add their own reactions"
  ON property_reactions
  FOR INSERT
  WITH CHECK (auth.email() = user_id);

-- Policy: Anonymous users can add reactions
CREATE POLICY "Anonymous users can add reactions"
  ON property_reactions
  FOR INSERT
  WITH CHECK (user_id LIKE 'anon-%');

-- Policy: Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions"
  ON property_reactions
  FOR DELETE
  USING (user_id = auth.email() OR user_id LIKE 'anon-%');

-- RLS Policies for property_comments

-- Policy: Everyone can view comments
CREATE POLICY "Public read access for comments"
  ON property_comments
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can add comments with their email
CREATE POLICY "Authenticated users can add their own comments"
  ON property_comments
  FOR INSERT
  WITH CHECK (auth.email() = user_id);

-- Policy: Anonymous users can add comments
CREATE POLICY "Anonymous users can add comments"
  ON property_comments
  FOR INSERT
  WITH CHECK (user_id LIKE 'anon-%');

-- Policy: Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON property_comments
  FOR UPDATE
  USING (user_id = auth.email() OR user_id LIKE 'anon-%')
  WITH CHECK (user_id = auth.email() OR user_id LIKE 'anon-%');

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON property_comments
  FOR DELETE
  USING (user_id = auth.email() OR user_id LIKE 'anon-%');

-- Trigger for updated_at on property_comments (reuse existing function)
DROP TRIGGER IF EXISTS update_property_comments_updated_at ON property_comments;
CREATE TRIGGER update_property_comments_updated_at
  BEFORE UPDATE ON property_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE property_reactions IS 'Stores emoji reactions for properties with multi-user support';
COMMENT ON TABLE property_comments IS 'Stores threaded comments for properties with multi-user support';
COMMENT ON COLUMN property_comments.parent_id IS 'Reference to parent comment for threaded replies (NULL for top-level comments)';
