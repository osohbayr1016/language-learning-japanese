CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  used_at TEXT
);
CREATE INDEX IF NOT EXISTS password_resets_user ON password_resets(user_id);
CREATE TABLE IF NOT EXISTS request_limits (
  bucket_key TEXT PRIMARY KEY,
  hits INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS request_limits_expiry ON request_limits(expires_at);
CREATE INDEX IF NOT EXISTS course_event_kind ON course_events(user_id, json_extract(payload,'$.kind'));
ALTER TABLE users ADD COLUMN auth_version INTEGER NOT NULL DEFAULT 0;
