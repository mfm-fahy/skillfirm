const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Authentication middleware
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

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users (for admin purposes)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user activity
router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const activities = [
      { type: 'task', title: 'Completed daily learning task', time: '2 hours ago', icon: 'CheckCircle', color: 'text-green-500' },
      { type: 'chat', title: 'Had AI coaching session', time: '1 day ago', icon: 'MessageSquare', color: 'text-blue-500' },
      { type: 'community', title: 'Joined community discussion', time: '2 days ago', icon: 'Users', color: 'text-purple-500' },
      { type: 'achievement', title: 'Earned "Quick Learner" badge', time: '3 days ago', icon: 'Award', color: 'text-yellow-500' }
    ];
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch activity', error: error.message });
  }
});

// Get user achievements
router.get('/achievements', authenticateToken, async (req, res) => {
  try {
    const achievements = [
      { name: 'Early Bird', description: '7-day learning streak', icon: '🌅', earned: true },
      { name: 'Task Master', description: 'Completed 10 tasks', icon: '✅', earned: true },
      { name: 'AI Enthusiast', description: 'Had 5 AI conversations', icon: '🤖', earned: true },
      { name: 'Knowledge Seeker', description: 'Completed 5 courses', icon: '📚', earned: false },
      { name: 'Community Star', description: 'Active in discussions', icon: '⭐', earned: false }
    ];
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch achievements', error: error.message });
  }
});

// Get weekly goal
router.get('/weekly-goal', authenticateToken, async (req, res) => {
  try {
    const goal = { current: 3, target: 5 };
    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch weekly goal', error: error.message });
  }
});

// Get learning streak
router.get('/learning-streak', authenticateToken, async (req, res) => {
  try {
    const streak = { streak: 7 };
    res.json(streak);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch learning streak', error: error.message });
  }
});

module.exports = router;