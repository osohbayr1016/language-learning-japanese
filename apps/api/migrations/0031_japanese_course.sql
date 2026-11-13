-- Independent Japanese course: append-only learner events, idempotent across devices.
CREATE TABLE course_events (
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 event_id TEXT NOT NULL,
 payload TEXT NOT NULL CHECK(json_valid(payload)),
 received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(user_id,event_id)
);
CREATE INDEX idx_course_events_user_received ON course_events(user_id,received_at,event_id);
CREATE TABLE course_settings (
 user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 preferences TEXT NOT NULL CHECK(json_valid(preferences)),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
