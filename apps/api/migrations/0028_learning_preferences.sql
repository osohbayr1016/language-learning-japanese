-- Migration 0028: server-side learner preferences for cross-device recommendations.
CREATE TABLE IF NOT EXISTS user_learning_preferences (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  self_level TEXT CHECK(self_level IN ('none','n5','n4','n3','n2','n1')),
  learning_reason TEXT CHECK(learning_reason IN ('university','career','travel','culture','fun')),
  daily_xp_goal INTEGER NOT NULL DEFAULT 30 CHECK(daily_xp_goal BETWEEN 10 AND 200),
  kana_foundation_completed INTEGER NOT NULL DEFAULT 0 CHECK(kana_foundation_completed IN (0,1)),
  placement_level TEXT CHECK(placement_level IS NULL OR placement_level IN ('n5','n4','n3','n2','n1')),
  placement_completed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_learning_preferences_level
  ON user_learning_preferences(self_level);
