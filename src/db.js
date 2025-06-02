const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const db = new Database(path.join(dataDir, 'sessions.db'));

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    share_token TEXT PRIMARY KEY,
    created INTEGER NOT NULL,
    base_url TEXT NOT NULL,
    working_dir TEXT NOT NULL,
    description TEXT NOT NULL,
    message_count INTEGER NOT NULL,
    total_tokens INTEGER
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_token TEXT NOT NULL,
    created INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    FOREIGN KEY (session_token) REFERENCES sessions(share_token)
  );
`);

// Prepare statements
const statements = {
  createSession: db.prepare(`
    INSERT INTO sessions (
      share_token, created, base_url, working_dir, 
      description, message_count, total_tokens
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `),

  createMessage: db.prepare(`
    INSERT INTO messages (
      session_token, created, role, content
    ) VALUES (?, ?, ?, ?)
  `),

  getSession: db.prepare(`
    SELECT * FROM sessions WHERE share_token = ?
  `),

  getMessages: db.prepare(`
    SELECT created, role, content 
    FROM messages 
    WHERE session_token = ?
    ORDER BY created ASC
  `),

  listSessions: db.prepare(`
    SELECT * FROM sessions ORDER BY created DESC
  `)
};

module.exports = {
  db,
  statements
};