const express = require('express');
const cors = require('cors');
const { customAlphabet } = require('nanoid/non-secure');
const { statements } = require('./db');

// Create a nanoid generator with a custom alphabet
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 21);

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/_status', (req, res) => {
  res.json({
    ok: true,
    status: 'healthy'
  });
});

// Simple ping endpoint
app.get('/api/ping', (req, res) => {
  res.json({
    message: 'pong'
  });
});

// Share a session
app.post('/api/sessions/share', (req, res) => {
  try {
    const { messages, working_dir, description, base_url, total_tokens } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages array' });
    }

    const share_token = nanoid();
    const created = Date.now();
    const message_count = messages.length;

    // Start a transaction
    const db = statements.createSession.database;
    const transaction = db.transaction(() => {
      // Create session
      statements.createSession.run(
        share_token,
        created,
        base_url,
        working_dir,
        description,
        message_count,
        total_tokens || null
      );

      // Create messages
      for (const msg of messages) {
        statements.createMessage.run(
          share_token,
          msg.created,
          msg.role,
          JSON.stringify(msg.content)
        );
      }
    });

    // Execute transaction
    transaction();

    res.json({ share_token });
  } catch (error) {
    console.error('Error sharing session:', error);
    res.status(500).json({ error: 'Failed to share session' });
  }
});

// Get a shared session
app.get('/api/sessions/share/:share_token', (req, res) => {
  try {
    const { share_token } = req.params;
    
    // Get session
    const session = statements.getSession.get(share_token);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get messages
    const messages = statements.getMessages.all(share_token).map(msg => ({
      created: msg.created,
      role: msg.role,
      content: JSON.parse(msg.content)
    }));

    res.json({
      ...session,
      messages
    });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// List all shared sessions
app.get('/api/sessions', (req, res) => {
  try {
    const sessions = statements.listSessions.all();
    res.json(sessions);
  } catch (error) {
    console.error('Error listing sessions:', error);
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});