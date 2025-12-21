const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token required' });
  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Mock storage for chat sessions (in production, use MongoDB)
const chatSessions = new Map();

// Get user's chat sessions
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const userSessions = chatSessions.get(req.user.userId) || [];
    res.json({ sessions: userSessions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch chat sessions', error: error.message });
  }
});

// Save chat session
router.post('/save-session', authenticateToken, async (req, res) => {
  try {
    const { session } = req.body;
    const userSessions = chatSessions.get(req.user.userId) || [];
    
    // Update existing session or add new one
    const existingIndex = userSessions.findIndex(s => s.id === session.id);
    if (existingIndex >= 0) {
      userSessions[existingIndex] = session;
    } else {
      userSessions.unshift(session);
    }
    
    // Keep only last 50 sessions
    if (userSessions.length > 50) {
      userSessions.splice(50);
    }
    
    chatSessions.set(req.user.userId, userSessions);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save chat session', error: error.message });
  }
});

module.exports = router;