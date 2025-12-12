-- =========================================
-- Fix Free Plan Generation Limits
-- Date: 2025-12-12
-- Issue: Free users have 25 generations instead of 5
-- =========================================

-- STEP 1: Check current state
-- =========================================
SELECT
  plan_id,
  generations_limit,
  COUNT(*) as user_count,
  SUM(generations_used) as total_used
FROM subscriptions
WHERE plan_id = 'free'
GROUP BY plan_id, generations_limit
ORDER BY generations_limit;

-- Expected output:
-- plan_id | generations_limit | user_count | total_used
-- free    | 25                | X          | Y          <- These need fixing
-- free    | 5                 | Z          | W          <- These are correct


-- STEP 2: Identify affected users
-- =========================================
SELECT
  id,
  user_id,
  plan_id,
  generations_limit,
  generations_used,
  created_at
FROM subscriptions
WHERE
  plan_id = 'free'
  AND generations_limit = 25
ORDER BY created_at DESC;

-- Review these users before proceeding


-- STEP 3: Update generation limits (PRODUCTION FIX)
-- =========================================

-- Option A: Simple update (recommended if users haven't exceeded 5)
-- This updates all free users to 5-generation limit
UPDATE subscriptions
SET
  generations_limit = 5,
  updated_at = NOW()
WHERE
  plan_id = 'free'
  AND generations_limit = 25;


-- Option B: Preserve usage for users who already generated 6+ (optional)
-- This grandfathers in users who already used their "bonus" credits
/*
UPDATE subscriptions
SET
  generations_limit = CASE
    WHEN generations_used <= 5 THEN 5
    ELSE generations_used  -- Let them keep what they've used
  END,
  updated_at = NOW()
WHERE
  plan_id = 'free'
  AND generations_limit = 25;
*/


-- STEP 4: Verify the fix
-- =========================================
SELECT
  plan_id,
  generations_limit,
  COUNT(*) as user_count,
  AVG(generations_used) as avg_used,
  MAX(generations_used) as max_used
FROM subscriptions
WHERE plan_id = 'free'
GROUP BY plan_id, generations_limit;

-- Expected output after fix:
-- plan_id | generations_limit | user_count | avg_used | max_used
-- free    | 5                 | ALL        | X        | Y


-- STEP 5: Check for any users over limit
-- =========================================
SELECT
  id,
  user_id,
  plan_id,
  generations_limit,
  generations_used,
  (generations_used - generations_limit) as over_limit
FROM subscriptions
WHERE
  plan_id = 'free'
  AND generations_used > generations_limit
ORDER BY over_limit DESC;

-- These users generated more than allowed
-- Consider:
-- 1. Let them keep current usage (no action)
-- 2. Reset to 5/5 on next period
-- 3. Send notification about plan update


-- STEP 6: Add database constraint (optional - prevents future issues)
-- =========================================
-- This constraint ensures generation limits match plan configuration

/*
ALTER TABLE subscriptions
ADD CONSTRAINT check_free_plan_limit
CHECK (
  (plan_id != 'free') OR
  (plan_id = 'free' AND generations_limit = 5)
);

-- Note: This will prevent any inserts/updates with wrong limits
-- Remove this if you need flexibility for promotions/testing
*/


-- STEP 7: Audit log (optional - track what was changed)
-- =========================================
/*
CREATE TABLE IF NOT EXISTS subscription_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL,
  user_id UUID NOT NULL,
  change_type TEXT NOT NULL,
  old_limit INTEGER,
  new_limit INTEGER,
  changed_by TEXT DEFAULT 'system',
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log the changes made
INSERT INTO subscription_audit_log (
  subscription_id,
  user_id,
  change_type,
  old_limit,
  new_limit,
  changed_by
)
SELECT
  id,
  user_id,
  'free_plan_limit_fix',
  25,
  5,
  'admin_script_2025_12_12'
FROM subscriptions
WHERE
  plan_id = 'free'
  AND generations_limit = 25;
*/


-- =========================================
-- ROLLBACK PLAN (if needed)
-- =========================================

-- If you need to rollback (not recommended)
/*
UPDATE subscriptions
SET
  generations_limit = 25,
  updated_at = NOW()
WHERE
  plan_id = 'free'
  AND generations_limit = 5
  AND updated_at > '2025-12-12 00:00:00'; -- Today's date
*/


-- =========================================
-- SUMMARY QUERY (run after all changes)
-- =========================================

SELECT
  'Free Plan Stats' as report,
  COUNT(*) as total_free_users,
  COUNT(CASE WHEN generations_limit = 5 THEN 1 END) as correct_limit,
  COUNT(CASE WHEN generations_limit != 5 THEN 1 END) as incorrect_limit,
  SUM(generations_used) as total_generations_used,
  AVG(generations_used) as avg_generations_per_user
FROM subscriptions
WHERE plan_id = 'free';

-- Expected after fix:
-- report            | total_free_users | correct_limit | incorrect_limit | total_used | avg_used
-- Free Plan Stats   | X                | X             | 0              | Y          | Z
