-- Migration: Mark existing free users with 25 generations as grandfathered
-- Date: 2025-01-15
-- Purpose: Distinguish between grandfathered users (25 gens) and new free users (5 gens)

-- Update all free plan users with 25 generations to be marked as grandfathered
UPDATE subscriptions
SET
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{grandfathered}',
    'true'::jsonb
  ),
  updated_at = NOW()
WHERE
  plan_id = 'free'
  AND generations_limit = 25;

-- Log the number of grandfathered users
DO $$
DECLARE
  grandfathered_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO grandfathered_count
  FROM subscriptions
  WHERE plan_id = 'free'
    AND generations_limit = 25
    AND (metadata->>'grandfathered')::boolean = true;

  RAISE NOTICE 'Marked % existing free users as grandfathered (25 generations)', grandfathered_count;
END $$;

-- Verify the update
SELECT
  plan_id,
  generations_limit,
  (metadata->>'grandfathered')::boolean as is_grandfathered,
  COUNT(*) as user_count
FROM subscriptions
WHERE plan_id = 'free'
GROUP BY plan_id, generations_limit, (metadata->>'grandfathered')::boolean
ORDER BY generations_limit DESC;
