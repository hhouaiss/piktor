-- Migration: Add Image Edits Feature
-- Description: Creates image_edits table, extends visuals table, and sets up triggers
-- Date: 2025-01-03

-- ========================================
-- 1. CREATE IMAGE_EDITS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.image_edits (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edit_id TEXT UNIQUE NOT NULL,

  -- Relationships
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_visual_id TEXT NOT NULL,
  parent_edit_id UUID NULL REFERENCES public.image_edits(id) ON DELETE SET NULL,

  -- Image data
  edited_image_url TEXT NOT NULL,
  thumbnail_url TEXT NULL,

  -- Edit parameters (JSONB for flexibility)
  edit_params JSONB NOT NULL DEFAULT '{}',
  -- Structure: {
  --   aspectRatio: '16:9' | '1:1' | '9:16' | '4:3' | '3:2',
  --   viewAngle: 'frontal' | '45-degree' | 'top-down' | 'perspective' | 'custom',
  --   lighting: 'soft' | 'dramatic' | 'natural' | 'studio' | 'golden-hour' | 'custom',
  --   style: 'photorealistic' | 'minimalist' | 'artistic' | 'vintage' | 'modern' | 'custom',
  --   customPrompt?: string
  -- }

  -- Generation metadata
  prompt TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  -- Structure: {
  --   model: string,
  --   timestamp: ISO timestamp,
  --   processingTime: number (ms),
  --   creditsUsed: number,
  --   variation: number,
  --   originalDimensions: { width, height },
  --   editedDimensions: { width, height }
  -- }

  -- Version tracking
  version_number INTEGER NOT NULL DEFAULT 1,
  is_latest_version BOOLEAN NOT NULL DEFAULT true,

  -- Analytics
  views INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ========================================

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

CREATE INDEX IF NOT EXISTS idx_image_edits_edit_id
  ON public.image_edits(edit_id);

-- GIN index for JSONB columns for efficient querying
CREATE INDEX IF NOT EXISTS idx_image_edits_edit_params
  ON public.image_edits USING GIN (edit_params);

CREATE INDEX IF NOT EXISTS idx_image_edits_metadata
  ON public.image_edits USING GIN (metadata);

-- ========================================
-- 3. EXTEND VISUALS TABLE
-- ========================================

-- Add columns to track edit counts and relationships
ALTER TABLE public.visuals
ADD COLUMN IF NOT EXISTS edit_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_edits BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS latest_edit_id UUID NULL REFERENCES public.image_edits(id) ON DELETE SET NULL;

-- Create indexes on new columns
CREATE INDEX IF NOT EXISTS idx_visuals_has_edits
  ON public.visuals(has_edits)
  WHERE has_edits = true;

CREATE INDEX IF NOT EXISTS idx_visuals_latest_edit_id
  ON public.visuals(latest_edit_id);

CREATE INDEX IF NOT EXISTS idx_visuals_edit_count
  ON public.visuals(edit_count)
  WHERE edit_count > 0;

-- ========================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on image_edits table
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
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own edits
CREATE POLICY "Users can delete own edits"
  ON public.image_edits FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- 5. TRIGGERS FOR AUTOMATIC UPDATES
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_image_edits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS image_edits_updated_at ON public.image_edits;
CREATE TRIGGER image_edits_updated_at
  BEFORE UPDATE ON public.image_edits
  FOR EACH ROW
  EXECUTE FUNCTION update_image_edits_updated_at();

-- Function to maintain visual edit counts
CREATE OR REPLACE FUNCTION maintain_visual_edit_count()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT: Increment edit count
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.visuals
    SET
      edit_count = edit_count + 1,
      has_edits = true,
      latest_edit_id = NEW.id
    WHERE visual_id = NEW.original_visual_id;
    RETURN NEW;

  -- On DELETE: Decrement edit count
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.visuals v
    SET
      edit_count = GREATEST(edit_count - 1, 0),
      has_edits = (edit_count - 1) > 0,
      latest_edit_id = (
        SELECT id
        FROM public.image_edits
        WHERE original_visual_id = OLD.original_visual_id
          AND id != OLD.id
        ORDER BY created_at DESC
        LIMIT 1
      )
    WHERE visual_id = OLD.original_visual_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to maintain edit counts
DROP TRIGGER IF EXISTS maintain_edit_count_trigger ON public.image_edits;
CREATE TRIGGER maintain_edit_count_trigger
  AFTER INSERT OR DELETE ON public.image_edits
  FOR EACH ROW
  EXECUTE FUNCTION maintain_visual_edit_count();

-- ========================================
-- 6. HELPER FUNCTIONS
-- ========================================

-- Function to get edit history tree for a visual
CREATE OR REPLACE FUNCTION get_edit_history_tree(p_visual_id TEXT, p_user_id UUID)
RETURNS TABLE (
  id UUID,
  edit_id TEXT,
  parent_edit_id UUID,
  version_number INTEGER,
  edit_params JSONB,
  created_at TIMESTAMPTZ,
  is_latest_version BOOLEAN,
  children_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE edit_tree AS (
    -- Base case: root edits (no parent)
    SELECT
      e.id,
      e.edit_id,
      e.parent_edit_id,
      e.version_number,
      e.edit_params,
      e.created_at,
      e.is_latest_version,
      0 as level
    FROM public.image_edits e
    WHERE e.original_visual_id = p_visual_id
      AND e.user_id = p_user_id
      AND e.parent_edit_id IS NULL

    UNION ALL

    -- Recursive case: child edits
    SELECT
      e.id,
      e.edit_id,
      e.parent_edit_id,
      e.version_number,
      e.edit_params,
      e.created_at,
      e.is_latest_version,
      et.level + 1
    FROM public.image_edits e
    INNER JOIN edit_tree et ON e.parent_edit_id = et.id
    WHERE e.user_id = p_user_id
  )
  SELECT
    et.id,
    et.edit_id,
    et.parent_edit_id,
    et.version_number,
    et.edit_params,
    et.created_at,
    et.is_latest_version,
    (
      SELECT COUNT(*)
      FROM public.image_edits child
      WHERE child.parent_edit_id = et.id
    )::INTEGER as children_count
  FROM edit_tree et
  ORDER BY et.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark previous versions as not latest
CREATE OR REPLACE FUNCTION mark_previous_versions_not_latest()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new edit is inserted, mark other edits from the same parent as not latest
  IF (TG_OP = 'INSERT' AND NEW.parent_edit_id IS NOT NULL) THEN
    UPDATE public.image_edits
    SET is_latest_version = false
    WHERE parent_edit_id = NEW.parent_edit_id
      AND id != NEW.id
      AND is_latest_version = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to maintain latest version flag
DROP TRIGGER IF EXISTS mark_versions_trigger ON public.image_edits;
CREATE TRIGGER mark_versions_trigger
  AFTER INSERT ON public.image_edits
  FOR EACH ROW
  EXECUTE FUNCTION mark_previous_versions_not_latest();

-- ========================================
-- 7. GRANTS AND PERMISSIONS
-- ========================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_edits TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute permission on helper functions
GRANT EXECUTE ON FUNCTION get_edit_history_tree(TEXT, UUID) TO authenticated;

-- ========================================
-- 8. ADD COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON TABLE public.image_edits IS
'Stores edit variations of generated images with version tracking and metadata';

COMMENT ON COLUMN public.image_edits.edit_id IS
'Human-readable unique identifier for the edit (e.g., edit_abc123_v1)';

COMMENT ON COLUMN public.image_edits.original_visual_id IS
'References the visual_id from visuals table (not FK due to legacy design)';

COMMENT ON COLUMN public.image_edits.parent_edit_id IS
'References parent edit for version chains (NULL for root edits)';

COMMENT ON COLUMN public.image_edits.edit_params IS
'JSONB storing edit parameters: aspectRatio, viewAngle, lighting, style';

COMMENT ON COLUMN public.image_edits.metadata IS
'JSONB storing generation metadata: model, timestamps, dimensions, credits';

COMMENT ON COLUMN public.image_edits.version_number IS
'Sequential version number in the edit chain (1 for root, increments for children)';

COMMENT ON COLUMN public.image_edits.is_latest_version IS
'Flag indicating if this is the latest version in its edit chain';

COMMENT ON FUNCTION get_edit_history_tree(TEXT, UUID) IS
'Returns hierarchical edit history tree for a visual with parent-child relationships';

COMMENT ON FUNCTION maintain_visual_edit_count() IS
'Automatically maintains edit_count and has_edits flags on visuals table';

COMMENT ON FUNCTION mark_previous_versions_not_latest() IS
'Ensures only the most recent edit in a version chain is marked as latest';

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

-- Verify table was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'image_edits'
  ) THEN
    RAISE NOTICE 'Migration completed successfully: image_edits table created';
  ELSE
    RAISE EXCEPTION 'Migration failed: image_edits table was not created';
  END IF;
END $$;
