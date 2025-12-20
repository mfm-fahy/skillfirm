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

    res.status(201).json({ message: 'Comment added successfully', comment });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
});

module.exports = router;