const express = require('express');
const jwt = require('jsonwebtoken');
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

// Real-time endpoints for Socket.IO integration
router.get('/active-users', (req, res) => {
  const io = req.app.get('io');
  const activeUsers = io.engine.clientsCount;
  
  res.json({
    activeUsers,
    timestamp: new Date().toISOString()
  });
});

// Broadcast notification to specific users or all users
router.post('/broadcast-notification', authenticateToken, (req, res) => {
  const { message, type, targetUsers, data } = req.body;
  const io = req.app.get('io');
  
  const notification = {
    id: Date.now().toString(),
    message,
    type: type || 'info',
    data: data || {},
    timestamp: new Date().toISOString(),
    from: req.user.userId
  };
  
  if (targetUsers && targetUsers.length > 0) {
    targetUsers.forEach(userId => {
      io.to(userId).emit('notification', notification);
    });
  } else {
    io.emit('notification', notification);
  }
  
  res.json({ success: true, message: 'Notification sent', notification });
});

// Broadcast news update
router.post('/broadcast-news-update', (req, res) => {
  const { field, articles, updateType } = req.body;
  const io = req.app.get('io');
  
  const newsUpdate = {
    field,
    articles: articles || [],
    updateType: updateType || 'new_articles',
    timestamp: new Date().toISOString()
  };
  
  io.emit('news-updated', newsUpdate);
  
  res.json({ success: true, message: 'News update broadcasted' });
});

// Broadcast course update
router.post('/broadcast-course-update', (req, res) => {
  const { field, courses, updateType } = req.body;
  const io = req.app.get('io');
  
  const courseUpdate = {
    field,
    courses: courses || [],
    updateType: updateType || 'new_courses',
    timestamp: new Date().toISOString()
  };
  
  io.emit('courses-updated', courseUpdate);
  
  res.json({ success: true, message: 'Course update broadcasted' });
});

// Broadcast community activity
router.post('/broadcast-community-activity', authenticateToken, (req, res) => {
  const { activityType, data } = req.body;
  const io = req.app.get('io');
  
  const activity = {
    type: activityType,
    data,
    userId: req.user.userId,
    timestamp: new Date().toISOString()
  };
  
  io.emit('community-activity', activity);
  
  res.json({ success: true, message: 'Community activity broadcasted' });
});

// Join user to their personal room for targeted notifications
router.post('/join-user-room', authenticateToken, (req, res) => {
  const { socketId } = req.body;
  const io = req.app.get('io');
  const userId = req.user.userId;
  
  if (socketId) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.join(userId);
      res.json({ success: true, message: 'Joined user room', userId });
    } else {
      res.status(404).json({ success: false, message: 'Socket not found' });
    }
  } else {
    res.status(400).json({ success: false, message: 'Socket ID required' });
  }
});

// Send real-time task update
router.post('/task-update', authenticateToken, (req, res) => {
  const { taskId, status, progress, data } = req.body;
  const io = req.app.get('io');
  const userId = req.user.userId;
  
  const taskUpdate = {
    taskId,
    status,
    progress,
    data,
    userId,
    timestamp: new Date().toISOString()
  };
  
  // Send to user's personal room
  io.to(userId).emit('task-updated', taskUpdate);
  
  res.json({ success: true, message: 'Task update sent' });
});

// Send real-time chat message
router.post('/chat-message', authenticateToken, (req, res) => {
  const { message, chatType, targetUser, roomId } = req.body;
  const io = req.app.get('io');
  
  const chatMessage = {
    id: Date.now().toString(),
    message,
    sender: req.user.userId,
    chatType: chatType || 'general',
    timestamp: new Date().toISOString()
  };
  
  if (targetUser) {
    // Direct message
    io.to(targetUser).emit('new-chat-message', chatMessage);
    io.to(req.user.userId).emit('new-chat-message', chatMessage);
  } else if (roomId) {
    // Room message
    io.to(roomId).emit('new-chat-message', chatMessage);
  } else {
    // Broadcast to all
    io.emit('new-chat-message', chatMessage);
  }
  
  res.json({ success: true, message: 'Chat message sent', chatMessage });
});

// Join discussion room
router.post('/join-discussion', authenticateToken, (req, res) => {
  const { discussionId, socketId } = req.body;
  const io = req.app.get('io');
  
  if (socketId && discussionId) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.join(`discussion-${discussionId}`);
      
      // Notify others in the discussion
      socket.to(`discussion-${discussionId}`).emit('user-joined-discussion', {
        userId: req.user.userId,
        discussionId,
        timestamp: new Date().toISOString()
      });
      
      res.json({ success: true, message: 'Joined discussion', discussionId });
    } else {
      res.status(404).json({ success: false, message: 'Socket not found' });
    }
  } else {
    res.status(400).json({ success: false, message: 'Discussion ID and Socket ID required' });
  }
});

// Send discussion message
router.post('/discussion-message', authenticateToken, (req, res) => {
  const { discussionId, message, messageType } = req.body;
  const io = req.app.get('io');
  
  const discussionMessage = {
    id: Date.now().toString(),
    discussionId,
    message,
    messageType: messageType || 'text',
    sender: req.user.userId,
    timestamp: new Date().toISOString()
  };
  
  io.to(`discussion-${discussionId}`).emit('new-discussion-message', discussionMessage);
  
  res.json({ success: true, message: 'Discussion message sent' });
});

// Get real-time statistics
router.get('/stats', (req, res) => {
  const io = req.app.get('io');
  
  const stats = {
    activeConnections: io.engine.clientsCount,
    totalRooms: io.sockets.adapter.rooms.size,
    serverUptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
  
  res.json(stats);
});

// Broadcast system announcement
router.post('/system-announcement', (req, res) => {
  const { title, message, priority, expiresAt } = req.body;
  const io = req.app.get('io');
  
  const announcement = {
    id: Date.now().toString(),
    title,
    message,
    priority: priority || 'normal',
    expiresAt: expiresAt || null,
    timestamp: new Date().toISOString()
  };
  
  io.emit('system-announcement', announcement);
  
  res.json({ success: true, message: 'System announcement broadcasted', announcement });
});

// Send progress update
router.post('/progress-update', authenticateToken, (req, res) => {
  const { type, progress, data } = req.body;
  const io = req.app.get('io');
  const userId = req.user.userId;
  
  const progressUpdate = {
    type,
    progress,
    data,
    userId,
    timestamp: new Date().toISOString()
  };
  
  io.to(userId).emit('progress-updated', progressUpdate);
  
  res.json({ success: true, message: 'Progress update sent' });
});

module.exports = router;