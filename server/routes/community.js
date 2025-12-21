const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
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

// Get all posts
router.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch posts', error: error.message });
  }
});

// Create new post
router.post('/posts', authenticateToken, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    
    if (!title || !content || !category) {
      return res.status(400).json({ message: 'Title, content, and category are required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const post = new Post({
      title,
      content,
      category,
      author: {
        id: user._id,
        name: user.name,
        avatar: user.avatar,
        field: user.selectedCareerField
      }
    });

    await post.save();
    // Emit real-time post creation
    const io = req.app.get('io');
    io.emit('post-created', { ...post.toObject(), timestamp: new Date().toISOString() });

    res.status(201).json({ message: 'Post created successfully', post });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create post', error: error.message });
  }
});

// Like/unlike post
router.post('/posts/:id/like', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user.userId;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    // Emit like update
    const io = req.app.get('io');
    io.emit('post-like-updated', { postId: post._id.toString(), likes: post.likes.length, userId });

    res.json({ message: isLiked ? 'Post unliked' : 'Post liked', likes: post.likes.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to like post', error: error.message });
  }
});

// Add comment to post
router.post('/posts/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const comment = {
      author: {
        id: user._id,
        name: user.name,
        avatar: user.avatar
      },
      content: content.trim()
    };

    post.comments.push(comment);
    await post.save();

    // Emit comment added event
    const io = req.app.get('io');
    io.emit('post-comment-added', { postId: post._id.toString(), comment, timestamp: new Date().toISOString() });

    res.status(201).json({ message: 'Comment added successfully', comment });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
});

// Get community statistics
router.get('/stats', async (req, res) => {
  try {
    const totalPosts = await Post.countDocuments();
    const totalMembers = 1250; // Mock data
    const activeToday = 89; // Mock data
    
    const topContributors = [
      { name: 'Sarah Chen', avatar: '/placeholder-user.jpg', posts: 24, reputation: 95, level: 'Expert' },
      { name: 'Mike Johnson', avatar: '/placeholder-user.jpg', posts: 18, reputation: 87, level: 'Advanced' },
      { name: 'Lisa Wang', avatar: '/placeholder-user.jpg', posts: 15, reputation: 82, level: 'Advanced' }
    ];
    
    res.json({
      totalPosts,
      totalMembers,
      activeToday,
      topContributors,
      weeklyGrowth: 12,
      engagementRate: 78,
      trendingTopics: ['AI Career Transition', 'Remote Work Tips', 'Salary Negotiation'],
      mentorshipConnections: 156,
      skillExchanges: 89,
      careerMilestones: 234
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
});

// Get live discussions
router.get('/live-discussions', async (req, res) => {
  try {
    const discussions = [
      { title: 'Career Transition Strategies', participants: 12, active: true },
      { title: 'Tech Industry Insights', participants: 8, active: true },
      { title: 'Networking Best Practices', participants: 15, active: true }
    ];
    
    res.json({ discussions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch discussions', error: error.message });
  }
});

// Get expert sessions
router.get('/expert-sessions', async (req, res) => {
  try {
    const sessions = [
      {
        expert: { name: 'Dr. Amanda Rodriguez', avatar: '/placeholder-user.jpg' },
        topic: 'AI in Healthcare Careers',
        scheduledTime: 'Today 3:00 PM'
      },
      {
        expert: { name: 'James Liu', avatar: '/placeholder-user.jpg' },
        topic: 'Fintech Career Opportunities',
        scheduledTime: 'Tomorrow 2:00 PM'
      }
    ];
    
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sessions', error: error.message });
  }
});

// Get community events
router.get('/events', async (req, res) => {
  try {
    const events = [
      {
        title: 'Virtual Career Fair',
        description: 'Connect with top employers in tech, finance, and healthcare',
        date: 'Dec 15, 2024',
        time: '10:00 AM - 4:00 PM',
        attendees: 245
      },
      {
        title: 'Resume Workshop',
        description: 'Get expert feedback on your resume from industry professionals',
        date: 'Dec 18, 2024',
        time: '6:00 PM - 8:00 PM',
        attendees: 89
      }
    ];
    
    res.json({ events });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch events', error: error.message });
  }
});

// Get skill exchanges
router.get('/skill-exchanges', async (req, res) => {
  try {
    const exchanges = [
      {
        user: 'Sarah Chen',
        type: 'Teaching',
        skill: 'React Development',
        description: 'Experienced React developer offering mentorship',
        level: 'Advanced'
      },
      {
        user: 'Mike Johnson',
        type: 'Learning',
        skill: 'Data Science',
        description: 'Looking to learn Python for data analysis',
        level: 'Beginner'
      }
    ];
    
    res.json({ exchanges });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch skill exchanges', error: error.message });
  }
});

// Get career milestones
router.get('/milestones', async (req, res) => {
  try {
    const milestones = [
      {
        user: 'Lisa Wang',
        achievement: 'Promoted to Senior Developer',
        company: 'Tech Corp',
        date: '2024-12-01'
      },
      {
        user: 'John Doe',
        achievement: 'Completed AWS Certification',
        company: 'Self-Study',
        date: '2024-11-28'
      }
    ];
    
    res.json({ milestones });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch milestones', error: error.message });
  }
});

// Create skill exchange
router.post('/skill-exchanges', authenticateToken, async (req, res) => {
  try {
    const { skill, type, description, level } = req.body;
    
    // In a real app, save to database
    const exchange = {
      id: Date.now().toString(),
      userId: req.user.userId,
      skill,
      type,
      description,
      level,
      createdAt: new Date().toISOString()
    };
    
    // Emit real-time update (client listens for 'new-skill-exchange')
    const io = req.app.get('io');
    io.emit('new-skill-exchange', exchange);
    
    res.status(201).json({ message: 'Skill exchange created', exchange });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create skill exchange', error: error.message });
  }
});

// Create community event
router.post('/events', authenticateToken, async (req, res) => {
  try {
    const { title, description, date, time } = req.body;
    
    if (!title || !date || !time) {
      return res.status(400).json({ message: 'Title, date, and time are required' });
    }
    
    const event = {
      _id: Date.now().toString(),
      title,
      description,
      date,
      time,
      attendees: 1,
      createdAt: new Date().toISOString(),
      createdBy: req.user.userId
    };
    
    // In production, save to MongoDB
    // const savedEvent = await Event.create(event);
    
    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create event', error: error.message });
  }
});

// Join community event
router.post('/events/:id/join', authenticateToken, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.userId;
    
    // In a real app, save to database
    const io = req.app.get('io');
    io.emit('event-joined', { eventId, userId });
    
    res.json({ message: 'Successfully joined event' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to join event', error: error.message });
  }
});

module.exports = router;