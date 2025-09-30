-- Supabase Database Migration for Piktor
-- This file contains the complete database schema for migrating from Firebase to Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage JSONB DEFAULT '{"creditsUsed": 0, "creditsTotal": 50, "resetDate": null}',
  preferences JSONB DEFAULT '{"language": "fr", "notifications": true, "theme": "auto"}',
  subscription JSONB DEFAULT NULL
);

-- Create trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'product',
  product_info JSONB,
  default_style TEXT DEFAULT 'modern',
  default_environment TEXT DEFAULT 'neutral',
  preferred_formats TEXT[] DEFAULT ARRAY['instagram_post'],
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  is_public BOOLEAN DEFAULT false,
  total_visuals INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_downloads INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for projects table
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- VISUALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS visuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  visual_id TEXT NOT NULL, -- Custom visual identifier
  original_url TEXT NOT NULL,
  thumbnail_url TEXT,
  metadata JSONB DEFAULT '{}', -- Contains all visual metadata (prompt, style, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id, visual_id)
);

-- Create trigger for visuals table
DROP TRIGGER IF EXISTS update_visuals_updated_at ON visuals;
CREATE TRIGGER update_visuals_updated_at
  BEFORE UPDATE ON visuals
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- USAGE RECORDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('generation', 'download', 'view', 'share')),
  visual_id UUID REFERENCES visuals(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  credits_used INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- USER STATS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- e.g., '2024-09', 'daily-2024-09-12'
  stats JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, period)
);

-- Create trigger for user_stats table
DROP TRIGGER IF EXISTS update_user_stats_updated_at ON user_stats;
CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_last_activity ON projects(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Visuals indexes
CREATE INDEX IF NOT EXISTS idx_visuals_user_id ON visuals(user_id);
CREATE INDEX IF NOT EXISTS idx_visuals_project_id ON visuals(project_id);
CREATE INDEX IF NOT EXISTS idx_visuals_created_at ON visuals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visuals_user_project ON visuals(user_id, project_id);

-- Usage records indexes
CREATE INDEX IF NOT EXISTS idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_timestamp ON usage_records(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usage_records_type ON usage_records(type);
CREATE INDEX IF NOT EXISTS idx_usage_records_visual_id ON usage_records(visual_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_project_id ON usage_records(project_id);

-- User stats indexes
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_period ON user_stats(period);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE visuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects policies
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

DROP POLICY IF EXISTS "Users can create own projects" ON projects;
CREATE POLICY "Users can create own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Visuals policies
DROP POLICY IF EXISTS "Users can view own visuals or public project visuals" ON visuals;
CREATE POLICY "Users can view own visuals or public project visuals" ON visuals
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = visuals.project_id
      AND projects.is_public = true
    )
  );

DROP POLICY IF EXISTS "Users can create own visuals" ON visuals;
CREATE POLICY "Users can create own visuals" ON visuals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own visuals" ON visuals;
CREATE POLICY "Users can update own visuals" ON visuals
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own visuals" ON visuals;
CREATE POLICY "Users can delete own visuals" ON visuals
  FOR DELETE USING (auth.uid() = user_id);

-- Usage records policies
DROP POLICY IF EXISTS "Users can view own usage records" ON usage_records;
CREATE POLICY "Users can view own usage records" ON usage_records
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own usage records" ON usage_records;
CREATE POLICY "Users can create own usage records" ON usage_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User stats policies
DROP POLICY IF EXISTS "Users can view own stats" ON user_stats;
CREATE POLICY "Users can view own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own stats" ON user_stats;
CREATE POLICY "Users can create own stats" ON user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own stats" ON user_stats;
CREATE POLICY "Users can update own stats" ON user_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- ============================================================================

-- Function to increment project statistics
CREATE OR REPLACE FUNCTION increment_project_stats(
  project_uuid UUID,
  visuals_delta INTEGER DEFAULT 0,
  views_delta INTEGER DEFAULT 0,
  downloads_delta INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  UPDATE projects
  SET
    total_visuals = GREATEST(0, total_visuals + visuals_delta),
    total_views = GREATEST(0, total_views + views_delta),
    total_downloads = GREATEST(0, total_downloads + downloads_delta),
    last_activity_at = NOW()
  WHERE id = project_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user usage stats
CREATE OR REPLACE FUNCTION update_user_usage(
  user_uuid UUID,
  credits_used_delta INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET
    usage = jsonb_set(
      usage,
      '{creditsUsed}',
      ((COALESCE((usage->>'creditsUsed')::INTEGER, 0) + credits_used_delta))::text::jsonb
    )
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================================================

-- Uncomment the following lines if you want to insert sample data for testing

/*
-- Insert a sample user (you'll need to replace with actual auth.uid())
INSERT INTO users (id, email, display_name)
VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com', 'Test User')
ON CONFLICT (id) DO NOTHING;

-- Insert a sample project
INSERT INTO projects (id, user_id, name, category)
VALUES ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Sample Project', 'product')
ON CONFLICT (id) DO NOTHING;

-- Insert a sample visual
INSERT INTO visuals (user_id, project_id, visual_id, original_url, metadata)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'sample_visual_1',
  'https://example.com/sample.jpg',
  '{"name": "Sample Visual", "prompt": "A beautiful sample image", "style": "modern"}'
)
ON CONFLICT (user_id, project_id, visual_id) DO NOTHING;
*/

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Supabase migration completed successfully!';
  RAISE NOTICE 'Tables created: users, projects, visuals, usage_records, user_stats';
  RAISE NOTICE 'RLS policies enabled and configured';
  RAISE NOTICE 'Indexes created for optimal performance';
  RAISE NOTICE 'Helper functions available: increment_project_stats, update_user_usage';
END $$;