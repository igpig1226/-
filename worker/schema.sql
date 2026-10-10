CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  answers TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS responses_timestamp ON responses(timestamp DESC);
