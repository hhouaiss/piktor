-- =====================================================
-- Piktor - Image Edits Feature Migration
-- =====================================================
-- This migration adds support for post-generation image editing
-- with version tracking, edit history, and edit parameters
-- =====================================================

-- Create image_edits table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.image_edits (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edit_id TEXT UNIQUE NOT NULL, -- Human-readable ID like 'edit_abc123_v1'

  -- Relationships
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_visual_id TEXT NOT NULL, -- References visuals.visual_id
  parent_edit_id UUID NULL REFERENCES public.image_edits(id) ON DELETE SET NULL,

  -- Image data
  edited_image_url TEXT NOT NULL, -- Supabase Storage URL
  thumbnail_url TEXT NULL,

  -- Edit parameters stored as JSONB
  -- Structure: {
  --   aspectRatio: '16:9' | '1:1' | '9:16' | '4:3' | '3:2',
  --   viewAngle: 'frontal' | '45-degree' | 'top-down' | 'perspective',
  --   lighting: 'soft' | 'dramatic' | 'natural' | 'studio' | 'golden-hour',
  --   style: 'photorealistic' | 'minimalist' | 'artistic' | 'vintage' | 'modern',
  --   customPrompt: string (optional)
  -- }
  edit_params JSONB NOT NULL DEFAULT '{}',

  -- Generation metadata
  prompt TEXT NOT NULL, -- Full prompt sent to Gemini API
  metadata JSONB NOT NULL DEFAULT '{}',
  -- Structure: {
  --   model: 'gemini-2.5-flash-image',
  --   timestamp: ISO timestamp,
  --   processingTime: number (milliseconds),
  --   creditsUsed: number,
  --   variation: number,
  --   originalDimensions: { width: number, height: number },
  --   editedDimensions: { width: number, height: number }
  -- }

  -- Version tracking
  version_number INTEGER NOT NULL DEFAULT 1, -- Version in the edit chain
  is_latest_version BOOLEAN NOT NULL DEFAULT true,

  -- Analytics
  views INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance optimization
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_image_edits_user_id
  ON public.image_edits(user_id);

CREATE INDEX IF NOT EXISTS idx_image_edits_original_visual_id
  ON public.image_edits(original_visual_id);

CREATE INDEX IF NOT EXISTS idx_image_edits_parent_edit_id
  ON public.image_edits(parent_edit_id);

CREATE INDEX IF NOT EXISTS idx_image_edits_created_at
  ON public.image_edits(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_image_edits_is_latest
  ON public.image_edits(is_latest_version)
  WHERE is_latest_version = true;

-- Index for querying edit parameters
CREATE INDEX IF NOT EXISTS idx_image_edits_edit_params
  ON public.image_edits USING gin(edit_params);

-- Row Level Security (RLS)
-- =====================================================
ALTER TABLE public.image_edits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own edits
CREATE POLICY "Users can view own edits"
  ON public.image_edits FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own edits
CREATE POLICY "Users can insert own edits"
  ON public.image_edits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own edits
CREATE POLICY "Users can update own edits"
  ON public.image_edits FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own edits
CREATE POLICY "Users can delete own edits"
  ON public.image_edits FOR DELETE
  USING (auth.uid() = user_id);

-- Triggers and Functions
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_image_edits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
CREATE TRIGGER image_edits_updated_at
  BEFORE UPDATE ON public.image_edits
  FOR EACH ROW
  EXECUTE FUNCTION update_image_edits_updated_at();

-- Function to update version numbers when creating new edits from parent
CREATE OR REPLACE FUNCTION set_image_edit_version()
RETURNS TRIGGER AS $$
BEGIN
  -- If this edit has a parent, set version to parent_version + 1
  IF NEW.parent_edit_id IS NOT NULL THEN
    SELECT version_number + 1 INTO NEW.version_number
    FROM public.image_edits
    WHERE id = NEW.parent_edit_id;

    -- Mark parent as not latest version
    UPDATE public.image_edits
    SET is_latest_version = false
    WHERE id = NEW.parent_edit_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for version management
CREATE TRIGGER set_edit_version
  BEFORE INSERT ON public.image_edits
  FOR EACH ROW
  EXECUTE FUNCTION set_image_edit_version();

-- Extend visuals table with edit tracking
-- =====================================================
ALTER TABLE public.visuals
ADD COLUMN IF NOT EXISTS edit_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_edits BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS latest_edit_id UUID NULL REFERENCES public.image_edits(id) ON DELETE SET NULL;

-- Add comment to explain new columns
COMMENT ON COLUMN public.visuals.edit_count IS 'Total number of edits created from this visual';
COMMENT ON COLUMN public.visuals.has_edits IS 'Quick flag to check if visual has any edits';
COMMENT ON COLUMN public.visuals.latest_edit_id IS 'Reference to the most recent edit';

-- Create index for edit queries on visuals
CREATE INDEX IF NOT EXISTS idx_visuals_has_edits
  ON public.visuals(has_edits)
  WHERE has_edits = true;

CREATE INDEX IF NOT EXISTS idx_visuals_latest_edit_id
  ON public.visuals(latest_edit_id);

-- Function to automatically update visual edit counts
CREATE OR REPLACE FUNCTION update_visual_edit_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment edit count and mark has_edits
    UPDATE public.visuals
    SET
      edit_count = edit_count + 1,
      has_edits = true,
      latest_edit_id = NEW.id
    WHERE visual_id = NEW.original_visual_id;

  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement edit count
    UPDATE public.visuals
    SET edit_count = GREATEST(0, edit_count - 1)
    WHERE visual_id = OLD.original_visual_id;

    -- Update has_edits flag
    UPDATE public.visuals
    SET has_edits = (edit_count > 0)
    WHERE visual_id = OLD.original_visual_id;

  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain visual edit counts
CREATE TRIGGER maintain_visual_edit_count
  AFTER INSERT OR DELETE ON public.image_edits
  FOR EACH ROW
  EXECUTE FUNCTION update_visual_edit_count();

-- Usage tracking for edits
-- =====================================================

-- Add edit type to usage_records if not exists
-- This allows tracking edit operations separately from generations
DO $$
BEGIN
  -- Check if type constraint exists and includes 'edit'
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'usage_records_type_check'
    AND conrelid = 'public.usage_records'::regclass
  ) THEN
    -- Add constraint if it doesn't exist
    ALTER TABLE public.usage_records
    ADD CONSTRAINT usage_records_type_check
    CHECK (type IN ('generation', 'download', 'view', 'share', 'edit'));
  END IF;
END $$;

-- Utility Views
-- =====================================================

-- View for getting edit history with original visual information
CREATE OR REPLACE VIEW edit_history_view AS
SELECT
  ie.id,
  ie.edit_id,
  ie.user_id,
  ie.original_visual_id,
  ie.parent_edit_id,
  ie.edited_image_url,
  ie.thumbnail_url,
  ie.edit_params,
  ie.prompt,
  ie.metadata,
  ie.version_number,
  ie.is_latest_version,
  ie.views,
  ie.downloads,
  ie.created_at,
  ie.updated_at,
  v.name as original_name,
  v.original_url as original_image_url,
  v.project_id,
  v.metadata->>'product'->>'name' as product_name
FROM public.image_edits ie
LEFT JOIN public.visuals v ON ie.original_visual_id = v.visual_id
ORDER BY ie.created_at DESC;

COMMENT ON VIEW edit_history_view IS 'Comprehensive view of edit history with original visual details';

-- View for latest edits per visual
CREATE OR REPLACE VIEW latest_edits_view AS
SELECT DISTINCT ON (original_visual_id)
  ie.id,
  ie.edit_id,
  ie.user_id,
  ie.original_visual_id,
  ie.edited_image_url,
  ie.thumbnail_url,
  ie.edit_params,
  ie.version_number,
  ie.created_at,
  v.name as original_name
FROM public.image_edits ie
LEFT JOIN public.visuals v ON ie.original_visual_id = v.visual_id
WHERE ie.is_latest_version = true
ORDER BY ie.original_visual_id, ie.created_at DESC;

COMMENT ON VIEW latest_edits_view IS 'Shows the most recent edit for each original visual';

-- Helper Functions
-- =====================================================

-- Function to get edit chain (all versions from original to current)
CREATE OR REPLACE FUNCTION get_edit_chain(start_edit_id UUID)
RETURNS TABLE (
  id UUID,
  edit_id TEXT,
  version_number INTEGER,
  edit_params JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE edit_chain AS (
    -- Base case: start with the given edit
    SELECT
      ie.id,
      ie.edit_id,
      ie.version_number,
      ie.edit_params,
      ie.created_at,
      ie.parent_edit_id
    FROM public.image_edits ie
    WHERE ie.id = start_edit_id

    UNION ALL

    -- Recursive case: find parent edits
    SELECT
      ie.id,
      ie.edit_id,
      ie.version_number,
      ie.edit_params,
      ie.created_at,
      ie.parent_edit_id
    FROM public.image_edits ie
    INNER JOIN edit_chain ec ON ie.id = ec.parent_edit_id
  )
  SELECT
    ec.id,
    ec.edit_id,
    ec.version_number,
    ec.edit_params,
    ec.created_at
  FROM edit_chain ec
  ORDER BY ec.version_number ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_edit_chain IS 'Retrieves the complete version chain for a given edit';

-- Function to count total edits by user
CREATE OR REPLACE FUNCTION count_user_edits(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  edit_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO edit_count
  FROM public.image_edits
  WHERE user_id = p_user_id;

  RETURN edit_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION count_user_edits IS 'Returns total number of edits created by a user';

-- Analytics Functions
-- =====================================================

-- Function to get popular edit parameters
CREATE OR REPLACE FUNCTION get_popular_edit_params()
RETURNS TABLE (
  param_type TEXT,
  param_value TEXT,
  usage_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'aspectRatio' as param_type,
    edit_params->>'aspectRatio' as param_value,
    COUNT(*) as usage_count
  FROM public.image_edits
  GROUP BY edit_params->>'aspectRatio'

  UNION ALL

  SELECT
    'viewAngle' as param_type,
    edit_params->>'viewAngle' as param_value,
    COUNT(*) as usage_count
  FROM public.image_edits
  GROUP BY edit_params->>'viewAngle'

  UNION ALL

  SELECT
    'lighting' as param_type,
    edit_params->>'lighting' as param_value,
    COUNT(*) as usage_count
  FROM public.image_edits
  GROUP BY edit_params->>'lighting'

  UNION ALL

  SELECT
    'style' as param_type,
    edit_params->>'style' as param_value,
    COUNT(*) as usage_count
  FROM public.image_edits
  GROUP BY edit_params->>'style'

  ORDER BY usage_count DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_popular_edit_params IS 'Returns most frequently used edit parameters for analytics';

-- Grants and Permissions
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_edits TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant view access
GRANT SELECT ON edit_history_view TO authenticated;
GRANT SELECT ON latest_edits_view TO authenticated;

-- Grant function execution
GRANT EXECUTE ON FUNCTION get_edit_chain TO authenticated;
GRANT EXECUTE ON FUNCTION count_user_edits TO authenticated;
GRANT EXECUTE ON FUNCTION get_popular_edit_params TO authenticated;

-- Migration Complete
-- =====================================================
-- Summary:
-- - Created image_edits table with full edit tracking
-- - Added edit tracking to visuals table
-- - Created indexes for performance
-- - Implemented Row Level Security
-- - Added triggers for automatic updates
-- - Created utility views and functions
-- - Set up proper permissions
-- =====================================================

-- Verification Queries (run these to verify migration)
-- =====================================================
-- SELECT * FROM pg_tables WHERE tablename = 'image_edits';
-- SELECT * FROM pg_indexes WHERE tablename = 'image_edits';
-- SELECT * FROM pg_policies WHERE tablename = 'image_edits';
-- SELECT * FROM pg_views WHERE viewname IN ('edit_history_view', 'latest_edits_view');
