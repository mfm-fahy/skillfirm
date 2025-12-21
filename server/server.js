const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');
const communityRoutes = require('./routes/community');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const newsletterRoutes = require('./routes/newsletter');
const coursesRoutes = require('./routes/courses');
const realtimeRoutes = require('./routes/realtime');
const notificationRoutes = require('./routes/notifications');
const chatRoutes = require('./routes/chat');

const app = express();
const server = http.createServer(app);

// Configure allowed origins for CORS
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      process.env.FRONTEND_URL,
      'https://skillfarm-v9.vercel.app',
      'https://skillfarm-v9-*.vercel.app', // Allow preview deployments
      'https://*.vercel.app' // Allow all Vercel preview deployments
    ].filter(Boolean)
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io available to routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || 
        (process.env.NODE_ENV === 'production' && origin.endsWith('.vercel.app'))) {
      return callback(null, true);
    }
    
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', environment: process.env.NODE_ENV || 'development' });
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'SkillFarm API is running!', status: 'OK' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/realtime', realtimeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);

// Socket.IO real-time functionality
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join user to their personal room
  socket.on('join-user', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
    
    // Send welcome message with current stats
    socket.emit('connection-established', {
      socketId: socket.id,
      timestamp: new Date().toISOString(),
      activeUsers: io.engine.clientsCount
    });
  });
  
  // Handle news updates
  socket.on('news-update', (data) => {
    socket.broadcast.emit('news-updated', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle course updates
  socket.on('course-update', (data) => {
    socket.broadcast.emit('courses-updated', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle community post updates
  socket.on('new-post', (post) => {
    socket.broadcast.emit('post-created', {
      ...post,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle post likes
  socket.on('post-liked', (data) => {
    socket.broadcast.emit('post-like-updated', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle course progress updates
  socket.on('course-progress', (data) => {
    socket.to(data.userId).emit('progress-updated', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle chat messages
  socket.on('chat-message', (data) => {
    if (data.targetUser) {
      // Direct message
      socket.to(data.targetUser).emit('new-chat-message', {
        ...data,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    } else {
      // Broadcast message
      socket.broadcast.emit('new-chat-message', {
        ...data,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Handle task updates
  socket.on('task-update', (data) => {
    socket.to(data.userId).emit('task-updated', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle task completion
  socket.on('task-completed', (data) => {
    socket.to(data.userId).emit('task-completion-celebration', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle live discussions
  socket.on('join-discussion', (discussionId) => {
    socket.join(`discussion-${discussionId}`);
    socket.to(`discussion-${discussionId}`).emit('user-joined-discussion', {
      socketId: socket.id,
      discussionId,
      timestamp: new Date().toISOString()
    });
  });
  
  socket.on('leave-discussion', (discussionId) => {
    socket.leave(`discussion-${discussionId}`);
    socket.to(`discussion-${discussionId}`).emit('user-left-discussion', {
      socketId: socket.id,
      discussionId,
      timestamp: new Date().toISOString()
    });
  });
  
  socket.on('discussion-message', (data) => {
    socket.to(`discussion-${data.discussionId}`).emit('new-discussion-message', {
      ...data,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle typing indicators
  socket.on('typing-start', (data) => {
    if (data.targetUser) {
      socket.to(data.targetUser).emit('user-typing', {
        userId: data.userId,
        isTyping: true,
        timestamp: new Date().toISOString()
      });
    } else if (data.discussionId) {
      socket.to(`discussion-${data.discussionId}`).emit('user-typing', {
        userId: data.userId,
        discussionId: data.discussionId,
        isTyping: true,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  socket.on('typing-stop', (data) => {
    if (data.targetUser) {
      socket.to(data.targetUser).emit('user-typing', {
        userId: data.userId,
        isTyping: false,
        timestamp: new Date().toISOString()
      });
    } else if (data.discussionId) {
      socket.to(`discussion-${data.discussionId}`).emit('user-typing', {
        userId: data.userId,
        discussionId: data.discussionId,
        isTyping: false,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Handle skill exchange requests
  socket.on('skill-exchange-request', (data) => {
    socket.broadcast.emit('new-skill-exchange', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle mentorship requests
  socket.on('mentorship-request', (data) => {
    if (data.targetMentor) {
      socket.to(data.targetMentor).emit('new-mentorship-request', {
        ...data,
        timestamp: new Date().toISOString()
      });
    } else {
      socket.broadcast.emit('new-mentorship-request', {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Handle career milestone celebrations
  socket.on('career-milestone', (data) => {
    socket.broadcast.emit('milestone-celebration', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle AI insights sharing
  socket.on('ai-insight-generated', (data) => {
    socket.to(data.userId).emit('new-ai-insight', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle newsletter subscriptions
  socket.on('newsletter-subscribed', (data) => {
    socket.emit('subscription-confirmed', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle real-time notifications
  socket.on('send-notification', (data) => {
    if (data.targetUsers && data.targetUsers.length > 0) {
      data.targetUsers.forEach(userId => {
        socket.to(userId).emit('notification', {
          ...data,
          timestamp: new Date().toISOString()
        });
      });
    } else {
      socket.broadcast.emit('notification', {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Handle user status updates
  socket.on('status-update', (data) => {
    socket.broadcast.emit('user-status-changed', {
      ...data,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle connection errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
    socket.emit('connection-error', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log('User disconnected:', socket.id, 'Reason:', reason);
    
    // Notify others about disconnection if needed
    socket.broadcast.emit('user-disconnected', {
      socketId: socket.id,
      reason,
      timestamp: new Date().toISOString()
    });
  });
  
  // Periodic heartbeat to maintain connection
  const heartbeat = setInterval(() => {
    socket.emit('heartbeat', {
      timestamp: new Date().toISOString(),
      activeUsers: io.engine.clientsCount
    });
  }, 30000); // Every 30 seconds
  
  socket.on('disconnect', () => {
    clearInterval(heartbeat);
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Socket.IO enabled for real-time features`);
});