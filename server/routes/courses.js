const express = require('express');
const router = express.Router();

// Get all courses
router.get('/', async (req, res) => {
  try {
    const courses = [
      {
        id: 1,
        title: "Full Stack Web Development",
        description: "Learn modern web development with React, Node.js, and MongoDB",
        instructor: "John Doe",
        duration: "12 weeks",
        level: "Beginner",
        price: 299,
        rating: 4.8,
        students: 1250,
        thumbnail: "/web-development-coding.png",
        category: "Programming",
        skills: ["React", "Node.js", "MongoDB", "JavaScript"],
        progress: Math.floor(Math.random() * 100)
      },
      {
        id: 2,
        title: "Digital Marketing Mastery",
        description: "Complete guide to digital marketing strategies and tools",
        instructor: "Jane Smith",
        duration: "8 weeks",
        level: "Intermediate",
        price: 199,
        rating: 4.6,
        students: 890,
        thumbnail: "/digital-marketing-strategy.png",
        category: "Marketing",
        skills: ["SEO", "Social Media", "Analytics", "Content Marketing"],
        progress: Math.floor(Math.random() * 100)
      },
      {
        id: 3,
        title: "UI/UX Design Fundamentals",
        description: "Master the principles of user interface and experience design",
        instructor: "Mike Johnson",
        duration: "10 weeks",
        level: "Beginner",
        price: 249,
        rating: 4.9,
        students: 675,
        thumbnail: "/ui-ux-design-concept.png",
        category: "Design",
        skills: ["Figma", "Prototyping", "User Research", "Design Systems"],
        progress: Math.floor(Math.random() * 100)
      }
    ];
    
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch courses', error: error.message });
  }
});

// Get course by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Mock course details
    const course = {
      id: parseInt(id),
      title: "Full Stack Web Development",
      description: "Learn modern web development with React, Node.js, and MongoDB",
      instructor: "John Doe",
      duration: "12 weeks",
      level: "Beginner",
      price: 299,
      rating: 4.8,
      students: 1250,
      thumbnail: "/web-development-coding.png",
      category: "Programming",
      skills: ["React", "Node.js", "MongoDB", "JavaScript"],
      progress: 45,
      modules: [
        { id: 1, title: "Introduction to Web Development", duration: "2 hours", completed: true },
        { id: 2, title: "HTML & CSS Basics", duration: "3 hours", completed: true },
        { id: 3, title: "JavaScript Fundamentals", duration: "4 hours", completed: false }
      ]
    };
    
    res.json({ course });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch course', error: error.message });
  }
});

// Enroll in course
router.post('/:id/enroll', async (req, res) => {
  try {
    const { id } = req.params;
    res.json({ 
      message: 'Successfully enrolled in course',
      courseId: id,
      enrollmentDate: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: 'Enrollment failed', error: error.message });
  }
});

// Update course (admin or instructor action) - emits course update to clients
router.post('/:id/update', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body || {};

    const io = req.app.get('io');
    io.emit('courses-updated', { courseId: id, update: updateData, timestamp: new Date().toISOString() });

    res.json({ message: 'Course update broadcasted', courseId: id, update: updateData });
  } catch (error) {
    res.status(500).json({ message: 'Failed to broadcast course update', error: error.message });
  }
});

// Report course progress for a user
router.post('/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, progress } = req.body || {};

    const io = req.app.get('io');
    if (userId) {
      io.to(userId).emit('progress-updated', { courseId: id, userId, progress, timestamp: new Date().toISOString() });
    } else {
      io.emit('progress-updated', { courseId: id, progress, timestamp: new Date().toISOString() });
    }

    res.json({ message: 'Progress update emitted', courseId: id, userId, progress });
  } catch (error) {
    res.status(500).json({ message: 'Failed to emit progress update', error: error.message });
  }
});

module.exports = router;