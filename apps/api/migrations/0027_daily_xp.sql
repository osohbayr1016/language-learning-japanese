-- Migration 0027: make the daily goal reflect XP earned today, not lifetime XP modulo the goal.
ALTER TABLE user_daily_activity ADD COLUMN xp_earned INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_user_daily_activity_user_date_xp
  ON user_daily_activity(user_id, activity_date, xp_earned);
