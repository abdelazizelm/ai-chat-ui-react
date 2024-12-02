import express from 'express';
import cors from 'cors';
import db from './database.js';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/test', (req, res) => {
  try {
    // Test database write
    const timestamp = new Date().toISOString();
    const testResult = db.prepare('INSERT INTO conversations (title, timestamp) VALUES (?, ?)').run('Test Conversation', timestamp);
    
    // Test database read
    const testConversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(testResult.lastInsertRowid);
    
    // Clean up test data
    db.prepare('DELETE FROM conversations WHERE id = ?').run(testResult.lastInsertRowid);
    
    res.json({
      success: true,
      message: 'SQLite is working correctly',
      testData: {
        inserted: testResult,
        retrieved: testConversation
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all conversations
app.get('/api/conversations', (req, res) => {
  const conversations = db.prepare('SELECT * FROM conversations ORDER BY timestamp DESC').all();
  res.json(conversations);
});

// Get conversation by id
app.get('/api/conversations/:id', (req, res) => {
  try {
    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC').all(req.params.id);
    
    res.json({
      ...conversation,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }))
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new conversation
app.post('/api/conversations', (req, res) => {
  const { title, messages } = req.body;
  const timestamp = new Date().toISOString();

  try {
    const result = db.prepare('INSERT INTO conversations (title, timestamp) VALUES (?, ?)').run(title, timestamp);
    const conversationId = result.lastInsertRowid;

    const insertMessage = db.prepare('INSERT INTO messages (conversation_id, role, content, timestamp) VALUES (?, ?, ?, ?)');
    
    messages.forEach(message => {
      insertMessage.run(conversationId, message.role, message.content, timestamp);
    });

    res.json({ id: conversationId, title, timestamp });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update conversation
app.put('/api/conversations/:id', (req, res) => {
  const { messages } = req.body;
  const timestamp = new Date().toISOString();

  try {
    // Delete existing messages
    db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(req.params.id);

    // Insert all messages
    const insertMessage = db.prepare('INSERT INTO messages (conversation_id, role, content, timestamp) VALUES (?, ?, ?, ?)');
    
    messages.forEach(message => {
      insertMessage.run(req.params.id, message.role, message.content, timestamp);
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete conversation
app.delete('/api/conversations/:id', (req, res) => {
  db.prepare('DELETE FROM conversations WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
