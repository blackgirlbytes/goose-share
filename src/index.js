const express = require('express');
const cors = require('cors');
const { customAlphabet } = require('nanoid/non-secure');
const { statements } = require('./db');

// Create a nanoid generator with a custom alphabet
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 21);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));  // Increased limit for large sessions

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.method === 'POST') {
    console.log('Request headers:', req.headers);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Health check endpoints
app.get('/_status', (req, res) => {
  res.json({
    ok: true,
    status: 'healthy'
  });
});

// Ping endpoints - support both /ping and /api/ping
app.get('/ping', (req, res) => {
  res.json({
    message: 'pong'
  });
});

app.get('/api/ping/', (req, res) => {
  res.json({
    message: 'pong'
  });
});

// Share a session
app.post('/api/sessions/share', (req, res) => {
  try {
    console.log('Received share request');
    const { messages, working_dir, description, base_url, total_tokens } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      console.log('Invalid messages array:', messages);
      return res.status(400).json({ error: 'Invalid messages array' });
    }

    const share_token = nanoid();
    const created = Date.now();
    const message_count = messages.length;

    console.log('Creating session with token:', share_token);

    // Start a transaction
    const db = statements.createSession.database;
    const transaction = db.transaction(() => {
      // Create session
      statements.createSession.run(
        share_token,
        created,
        base_url || 'unknown',
        working_dir || '/',
        description || 'Shared session',
        message_count,
        total_tokens || null
      );

      // Create messages
      for (const msg of messages) {
        statements.createMessage.run(
          share_token,
          msg.created || Date.now(),
          msg.role || 'unknown',
          JSON.stringify(msg.content || [])
        );
      }
    });

    // Execute transaction
    transaction();
    console.log('Session created successfully');

    res.json({ share_token });
  } catch (error) {
    console.error('Error sharing session:', error);
    res.status(500).json({ error: 'Failed to share session', details: error.message });
  }
});

// Get a shared session
app.get('/api/sessions/share/:share_token', (req, res) => {
  try {
    const { share_token } = req.params;
    console.log('Getting session:', share_token);
    
    // Get session
    const session = statements.getSession.get(share_token);
    if (!session) {
      console.log('Session not found:', share_token);
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get messages
    const messages = statements.getMessages.all(share_token).map(msg => ({
      created: msg.created,
      role: msg.role,
      content: JSON.parse(msg.content)
    }));

    console.log('Session retrieved with', messages.length, 'messages');
    res.json({
      ...session,
      messages
    });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: 'Failed to get session', details: error.message });
  }
});

// List all shared sessions
app.get('/api/sessions', (req, res) => {
  try {
    console.log('Listing all sessions');
    const sessions = statements.listSessions.all();
    console.log('Found', sessions.length, 'sessions');
    res.json(sessions);
  } catch (error) {
    console.error('Error listing sessions:', error);
    res.status(500).json({ error: 'Failed to list sessions', details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});