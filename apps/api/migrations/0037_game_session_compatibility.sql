-- Repair the original game_sessions CHECK constraint: the API and mobile game
-- registry have long supported additional game modes not permitted in 0001.
-- Preserve IDs/history and all existing legacy types. SQLite cannot ALTER CHECK.
CREATE TABLE game_sessions_rebuilt (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL CHECK (game_type IN (
    'match', 'speed_match', 'fill_blank', 'stroke',
    'translate', 'sentence', 'writer'
  )),
  score INTEGER NOT NULL DEFAULT 0,
  accuracy REAL NOT NULL DEFAULT 0.0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  words_practiced INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  session_id TEXT
);
INSERT INTO game_sessions_rebuilt
  (id,user_id,game_type,score,accuracy,duration_seconds,
   words_practiced,xp_earned,created_at,session_id)
SELECT
  id,user_id,game_type,score,accuracy,duration_seconds,
  words_practiced,xp_earned,created_at,session_id
FROM game_sessions;
DROP TABLE game_sessions;
ALTER TABLE game_sessions_rebuilt RENAME TO game_sessions;
CREATE INDEX idx_game_sessions_user ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_type ON game_sessions(game_type);
CREATE UNIQUE INDEX unique_game_submission
  ON game_sessions(user_id,session_id) WHERE session_id IS NOT NULL;
-- Normalize old ISO values once; new timestamps may still arrive in ISO format.
-- Query code handles both formats to protect old and new mobile clients.
