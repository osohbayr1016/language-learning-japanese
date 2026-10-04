-- Migration 0029: idempotency ledger for lesson completion/reward submissions.
CREATE TABLE IF NOT EXISTS lesson_completion_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completion_id TEXT NOT NULL,
  accuracy REAL NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  mastered INTEGER NOT NULL DEFAULT 0 CHECK(mastered IN (0,1)),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, completion_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_completion_events_user_lesson
  ON lesson_completion_events(user_id, lesson_id, created_at);
