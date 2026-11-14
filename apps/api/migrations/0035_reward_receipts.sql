-- Award one XP receipt per completed user session, even on network retries.
-- This trigger updates XP, review/game counts and daily activity atomically with
-- the receipt; it does not change any old-session writes until the new API uses it.
CREATE TABLE IF NOT EXISTS reward_receipts (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('study', 'game')),
  session_id TEXT NOT NULL CHECK (length(session_id) BETWEEN 8 AND 100),
  request_hash TEXT NOT NULL,
  xp_earned INTEGER NOT NULL CHECK (xp_earned BETWEEN 0 AND 1000),
  review_count INTEGER NOT NULL DEFAULT 0 CHECK (review_count BETWEEN 0 AND 100),
  game_seconds INTEGER NOT NULL DEFAULT 0 CHECK (game_seconds BETWEEN 0 AND 36000),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, kind, session_id)
);
CREATE TRIGGER reward_receipt_credit AFTER INSERT ON reward_receipts
BEGIN
  INSERT INTO user_stats (user_id, total_xp, total_reviews, games_played)
  VALUES (new.user_id, new.xp_earned, new.review_count, CASE WHEN new.kind='game' THEN 1 ELSE 0 END)
  ON CONFLICT(user_id) DO UPDATE SET
    total_xp = user_stats.total_xp + excluded.total_xp,
    total_reviews = user_stats.total_reviews + excluded.total_reviews,
    games_played = user_stats.games_played + excluded.games_played;
  INSERT INTO user_daily_activity (user_id, activity_date, xp_earned, minutes_studied, sessions_count)
  VALUES (
    new.user_id, date('now'), new.xp_earned,
    CASE WHEN new.kind='game' THEN CAST(ROUND(new.game_seconds/60.0) AS INTEGER) ELSE 0 END,
    CASE WHEN new.kind='game' THEN 1 ELSE 0 END
  )
  ON CONFLICT(user_id, activity_date) DO UPDATE SET
    xp_earned = user_daily_activity.xp_earned + excluded.xp_earned,
    minutes_studied = user_daily_activity.minutes_studied + excluded.minutes_studied,
    sessions_count = user_daily_activity.sessions_count + excluded.sessions_count,
    updated_at = CURRENT_TIMESTAMP;
END;
-- Old sessions have NULL IDs, preserving compatibility with existing rows.
ALTER TABLE game_sessions ADD COLUMN session_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS unique_game_submission
  ON game_sessions(user_id, session_id) WHERE session_id IS NOT NULL;
