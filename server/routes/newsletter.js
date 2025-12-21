const express = require('express');
const router = express.Router();

// Subscribe to newsletter
router.post('/subscribe', async (req, res) => {
  try {
    const { email, field, preferences } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Valid email is required' });
    }
    
    // In a real app, you would save this to a database
    // and integrate with an email service like SendGrid, Mailchimp, etc.
    
    console.log('Newsletter subscription:', {
      email,
      field,
      preferences,
      subscribedAt: new Date().toISOString()
    });
    
    res.json({
      message: 'Successfully subscribed to newsletter',
      email,
      field,
      subscriptionId: Date.now().toString()
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({ message: 'Subscription failed', error: error.message });
  }
});

// Unsubscribe from newsletter
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email, subscriptionId } = req.body;
    
    // In a real app, you would remove from database
    console.log('Newsletter unsubscription:', { email, subscriptionId });
    
    res.json({
      message: 'Successfully unsubscribed from newsletter',
      email
    });
  } catch (error) {
    console.error('Newsletter unsubscription error:', error);
    res.status(500).json({ message: 'Unsubscription failed', error: error.message });
  }
});

// Get newsletter preferences
router.get('/preferences/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    // Mock preferences - in real app, fetch from database
    const preferences = {
      email,
      frequency: 'weekly',
      categories: ['industry-news', 'career-tips', 'skill-updates'],
      personalizedContent: true,
      jobAlerts: true
    };
    
    res.json({ preferences });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ message: 'Failed to get preferences', error: error.message });
  }
});

module.exports = router;