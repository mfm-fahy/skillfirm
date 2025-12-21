const express = require('express');
const jwt = require('jsonwebtoken');
const Notification = require('../models/Notification');
const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Get user notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const query = { userId: req.user.userId };
    
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      userId: req.user.userId, 
      read: false 
    });

    res.json({
      notifications,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      },
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});

// Create notification
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, message, type, data, priority, targetUsers, expiresAt } = req.body;
    const io = req.app.get('io');

    // If targetUsers is provided, create notifications for specific users
    if (targetUsers && Array.isArray(targetUsers)) {
      const notifications = await Promise.all(
        targetUsers.map(async (userId) => {
          const notification = new Notification({
            userId,
            title,
            message,
            type: type || 'info',
            data: data || {},
            priority: priority || 'normal',
            expiresAt: expiresAt ? new Date(expiresAt) : null
          });
          
          const saved = await notification.save();
          
          // Send real-time notification
          io.to(userId).emit('notification', {
            id: saved._id,
            title: saved.title,
            message: saved.message,
            type: saved.type,
            data: saved.data,
            priority: saved.priority,
            read: saved.read,
            timestamp: saved.createdAt
          });
          
          return saved;
        })
      );
      
      res.status(201).json({ 
        success: true, 
        message: 'Notifications created', 
        notifications 
      });
    } else {
      // Create notification for the requesting user
      const notification = new Notification({
        userId: req.user.userId,
        title,
        message,
        type: type || 'info',
        data: data || {},
        priority: priority || 'normal',
        expiresAt: expiresAt ? new Date(expiresAt) : null
      });

      const saved = await notification.save();
      
      // Send real-time notification
      io.to(req.user.userId).emit('notification', {
        id: saved._id,
        title: saved.title,
        message: saved.message,
        type: saved.type,
        data: saved.data,
        priority: saved.priority,
        read: saved.read,
        timestamp: saved.createdAt
      });

      res.status(201).json({ success: true, notification: saved });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error creating notification', error: error.message });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification', error: error.message });
  }
});

// Mark all notifications as read
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.userId, read: false },
      { read: true }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notifications', error: error.message });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting notification', error: error.message });
  }
});

// Broadcast notification to all users
router.post('/broadcast', authenticateToken, async (req, res) => {
  try {
    const { title, message, type, data, priority, expiresAt } = req.body;
    const io = req.app.get('io');

    // Create system notification (no specific user)
    const broadcastNotification = {
      id: Date.now().toString(),
      title,
      message,
      type: type || 'system',
      data: data || {},
      priority: priority || 'normal',
      timestamp: new Date().toISOString(),
      broadcast: true
    };

    // Broadcast to all connected users
    io.emit('notification', broadcastNotification);

    res.json({ 
      success: true, 
      message: 'Notification broadcasted', 
      notification: broadcastNotification 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error broadcasting notification', error: error.message });
  }
});

// Get unread count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.userId,
      read: false
    });

    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread count', error: error.message });
  }
});

module.exports = router;