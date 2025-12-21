const express = require('express');
const Task = require('../models/Task');
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

// Get today's tasks
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tasks = await Task.find({ userId: req.user.userId, date: today });
    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
  }
});

// Save tasks
router.post('/save', authenticateToken, async (req, res) => {
  try {
    const { tasks } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    await Task.deleteMany({ userId: req.user.userId, date: today });
    
    const savedTasks = await Task.insertMany(
      tasks.map(task => ({
        ...task,
        userId: req.user.userId,
        date: today
      }))
    );
    
    res.json({ tasks: savedTasks });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save tasks', error: error.message });
  }
});

// Toggle task completion
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date() : null;
    await task.save();
    
    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update task', error: error.message });
  }
});

// Get task statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tasks = await Task.find({ userId: req.user.userId, date: today });
    
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    
    res.json({ completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
});

// Get overall progress statistics
router.get('/progress', authenticateToken, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    
    const recentTasks = await Task.find({ 
      userId: req.user.userId, 
      date: { $gte: sevenDaysAgoStr }
    });
    
    const totalTasks = recentTasks.length;
    const completedTasks = recentTasks.filter(t => t.completed).length;
    const overallPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Calculate daily completion rates
    const dailyStats = {};
    recentTasks.forEach(task => {
      if (!dailyStats[task.date]) {
        dailyStats[task.date] = { total: 0, completed: 0 };
      }
      dailyStats[task.date].total++;
      if (task.completed) {
        dailyStats[task.date].completed++;
      }
    });
    
    const activeDays = Object.keys(dailyStats).length;
    const averageCompletion = activeDays > 0 ? 
      Object.values(dailyStats).reduce((sum, day) => 
        sum + (day.total > 0 ? (day.completed / day.total) * 100 : 0), 0
      ) / activeDays : 0;
    
    res.json({ 
      overall: overallPercentage,
      totalTasks,
      completedTasks,
      activeDays,
      averageCompletion: Math.round(averageCompletion),
      dailyStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch progress', error: error.message });
  }
});

// Get task statistics with enhanced metrics
router.get('/enhanced-stats', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tasks = await Task.find({ userId: req.user.userId, date: today });
    
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    
    // Enhanced stats
    const stats = {
      totalCompleted: completed,
      streakDays: 7, // Mock data - would calculate from historical data
      weeklyProgress: 85,
      monthlyGoal: 100,
      productivityScore: Math.round((completed / total) * 100) || 0,
      averageCompletionTime: 25,
      favoriteCategory: 'Learning',
      skillsLearned: ['JavaScript', 'React', 'Node.js', 'Python', 'Data Analysis'],
      careerGrowthPoints: 450,
      timeSpentLearning: 1200, // minutes
      consistencyRating: 78,
      challengesCompleted: 12
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
});

// Get weekly challenge
router.get('/weekly-challenge', async (req, res) => {
  try {
    const challenge = {
      title: 'Skill Builder Challenge',
      description: 'Complete 5 skill-building tasks this week to unlock the Learning Champion badge',
      progress: 60,
      daysLeft: 3,
      reward: 'Learning Champion Badge + 100 XP',
      currentCount: 3,
      targetCount: 5
    };
    
    res.json({ challenge });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch challenge', error: error.message });
  }
});

module.exports = router;