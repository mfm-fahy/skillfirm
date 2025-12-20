const express = require('express');
const axios = require('axios');

const router = express.Router();

// Analyze field value and future prospects
router.post('/analyze-field', async (req, res) => {
  try {
    const { field } = req.body;
    
    if (!field || field.trim() === '') {
      return res.status(400).json({ message: 'Field name is required' });
    }
    
    const prompt = `Analyze the career field "${field}" and provide:
1. Future value and job prospects (High/Medium/Low)
2. Growth potential in next 5-10 years
3. Average salary range
4. Required skills
5. If low value, suggest 3 alternative related fields
Format response as JSON with keys: value, growth, salary, skills, alternatives`;

    const response = await callOpenRouter(prompt);
    
    res.json({
      field,
      analysis: response
    });
  } catch (error) {
    console.error('Field analysis error:', error);
    res.status(500).json({ message: 'AI analysis failed', error: error.message });
  }
});

// Generate psychometric test
router.get('/generate-psychometric-test', async (req, res) => {
  try {
    const prompt = `Generate a 10-question psychometric test for career guidance. Each question should help determine personality traits, interests, and aptitudes.
Format as JSON:
{
  "questions": [
    {
      "id": 1,
      "question": "question text",
      "options": ["option1", "option2", "option3", "option4"],
      "category": "interests/personality/skills/values"
    }
  ]
}`;

    const response = await callOpenRouter(prompt);
    
    res.json({ test: response });
  } catch (error) {
    res.status(500).json({ message: 'Test generation failed', error: error.message });
  }
});

// Analyze psychometric test results
router.post('/analyze-psychometric-results', async (req, res) => {
  try {
    const { answers } = req.body;
    
    const prompt = `Based on these psychometric test answers: ${JSON.stringify(answers)}
Analyze the responses and suggest 3-5 suitable career fields with explanations.
Consider personality traits, interests, and aptitudes.
Format as JSON with: suggestedFields (array of objects with field, reason, suitability_score)`;

    const response = await callOpenRouter(prompt);
    
    res.json({
      results: response
    });
  } catch (error) {
    res.status(500).json({ message: 'Results analysis failed', error: error.message });
  }
});

// Suggest career alternatives for employees
router.post('/suggest-career-alternatives', async (req, res) => {
  try {
    const { currentField, experience, skills } = req.body;
    
    const prompt = `For someone working in "${currentField}" with ${experience} years experience and skills: ${skills}
Suggest 5 alternative career paths they could transition to.
Consider transferable skills and market demand.
Format as JSON with: alternatives (array of objects with field, transition_difficulty, required_skills, timeline)`;

    const response = await callOpenRouter(prompt);
    
    res.json({
      alternatives: response
    });
  } catch (error) {
    res.status(500).json({ message: 'Career alternatives failed', error: error.message });
  }
});

// Suggest field development for current career
router.post('/suggest-field-development', async (req, res) => {
  try {
    const { currentField, experience, goals } = req.body;
    
    const prompt = `For someone in "${currentField}" with ${experience} years experience wanting to grow in their current field.
Goals: ${goals}
Suggest development paths, skills to acquire, certifications, and growth opportunities.
Format as JSON with: development_paths (array of objects with path, skills_needed, timeline, potential_roles)`;

    const response = await callOpenRouter(prompt);
    
    res.json({
      development: response
    });
  } catch (error) {
    res.status(500).json({ message: 'Field development failed', error: error.message });
  }
});

// Helper function to call OpenRouter API
async function callOpenRouter(prompt) {
  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'openai/gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a career counselor and psychometric analyst. Provide accurate, helpful career guidance based on current market trends and psychological principles.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const content = response.data.choices[0].message.content;
    
    // Try to parse as JSON, fallback to text
    try {
      return JSON.parse(content);
    } catch {
      return { response: content };
    }
  } catch (error) {
    console.error('OpenRouter API error:', error.response?.data || error.message);
    throw new Error('AI service unavailable');
  }
}

// Suggest multiple courses based on career field
router.post('/suggest-course', async (req, res) => {
  try {
    const { field } = req.body;
    
    if (!field || field.trim() === '') {
      return res.status(400).json({ message: 'Field name is required' });
    }
    
    // Search YouTube directly for field-related courses
    const courses = await searchYouTube(`${field} course tutorial beginner`);
    
    res.json({
      field,
      course: courses.slice(0, 6) // Return top 6 courses
    });
  } catch (error) {
    console.error('Course suggestion error:', error);
    res.status(500).json({ message: 'Course suggestion failed', error: error.message });
  }
});

// Generate courses from YouTube based on career field
router.post('/generate-courses', async (req, res) => {
  try {
    const { field } = req.body;
    
    if (!field || field.trim() === '') {
      return res.status(400).json({ message: 'Field name is required' });
    }
    
    // First, get AI suggestions for course topics
    const prompt = `For someone learning "${field}", suggest 5-8 specific course topics that would be essential for beginners to advanced learners. Focus on practical, hands-on topics that are commonly taught on YouTube.

Respond with JSON:
{
  "topics": [
    "topic 1",
    "topic 2",
    "topic 3"
  ]
}

Make topics specific and searchable (e.g., "React.js Tutorial", "Python for Beginners", "Digital Marketing Fundamentals").`;

    const aiResponse = await callOpenRouter(prompt);
    const topics = aiResponse.topics || [`${field} tutorial`, `${field} for beginners`, `${field} course`];
    
    // Search YouTube for each topic
    const allCourses = [];
    
    for (const topic of topics.slice(0, 3)) { // Limit to 3 topics to avoid API limits
      try {
        const courses = await searchYouTube(topic);
        allCourses.push(...courses);
      } catch (error) {
        console.error(`Error searching for ${topic}:`, error);
      }
    }
    
    // Remove duplicates and limit results
    const uniqueCourses = allCourses.filter((course, index, self) => 
      index === self.findIndex(c => c.id === course.id)
    ).slice(0, 12);
    
    res.json({
      field,
      courses: uniqueCourses
    });
  } catch (error) {
    console.error('Course generation error:', error);
    res.status(500).json({ message: 'Course generation failed', error: error.message });
  }
});

// Search courses on YouTube
router.post('/search-courses', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const courses = await searchYouTube(query);
    
    res.json({
      query,
      courses: courses.slice(0, 15)
    });
  } catch (error) {
    console.error('Course search error:', error);
    res.status(500).json({ message: 'Course search failed', error: error.message });
  }
});

// Helper function to search YouTube
async function searchYouTube(query) {
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: `${query} tutorial course`,
        type: 'video',
        maxResults: 6,
        order: 'relevance',
        videoDuration: 'medium', // Filter for longer videos (4-20 minutes)
        key: process.env.YOUTUBE_API_KEY
      }
    });
    
    const videoIds = response.data.items.map(item => item.id.videoId).join(',');
    
    // Get additional video details
    const detailsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'contentDetails,statistics',
        id: videoIds,
        key: process.env.YOUTUBE_API_KEY
      }
    });
    
    const courses = response.data.items.map((item, index) => {
      const details = detailsResponse.data.items[index];
      const duration = details ? formatDuration(details.contentDetails.duration) : null;
      const viewCount = details ? formatViewCount(details.statistics.viewCount) : null;
      
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: `https://img.youtube.com/vi/${item.id.videoId}/maxresdefault.jpg`,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        duration,
        viewCount,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`
      };
    });
    
    return courses;
  } catch (error) {
    console.error('YouTube API error:', error.response?.data || error.message);
    return [];
  }
}

// Helper function to format YouTube duration
function formatDuration(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return null;
  
  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '').replace('M', '');
  const seconds = (match[3] || '').replace('S', '');
  
  let formatted = '';
  if (hours) formatted += `${hours}:`;
  formatted += `${minutes.padStart(2, '0')}:`;
  formatted += `${seconds.padStart(2, '0')}`;
  
  return formatted;
}

// Helper function to format view count
function formatViewCount(count) {
  const num = parseInt(count);
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M views`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K views`;
  }
  return `${num} views`;
}

// Generate news based on career field
router.post('/generate-news', async (req, res) => {
  try {
    const { field } = req.body;
    
    if (!field || field.trim() === '') {
      return res.status(400).json({ message: 'Field name is required' });
    }
    
    const news = await fetchNews(field);
    
    res.json({
      field,
      news: news.slice(0, 10)
    });
  } catch (error) {
    console.error('News generation error:', error);
    res.status(500).json({ message: 'News generation failed', error: error.message });
  }
});

// Helper function to fetch news
async function fetchNews(field) {
  try {
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: `${field} career jobs industry trends`,
        sortBy: 'publishedAt',
        pageSize: 15,
        language: 'en',
        apiKey: process.env.NEWS_API_KEY
      }
    });
    
    return response.data.articles.map(article => ({
      title: article.title,
      description: article.description,
      url: article.url,
      urlToImage: article.urlToImage,
      publishedAt: article.publishedAt,
      source: article.source.name,
      author: article.author
    }));
  } catch (error) {
    console.error('News API error:', error.response?.data || error.message);
    return [];
  }
}

// AI Chat for personalized guidance
router.post('/chat', async (req, res) => {
  try {
    const { message, userField, userName } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message is required' });
    }
    
    const systemPrompt = `You are an expert career coach and mentor. You provide personalized, actionable career guidance.

User Context:
- Name: ${userName || 'User'}
- Career Field: ${userField || 'General'}

Guidelines:
- Be conversational, supportive, and encouraging
- Provide specific, actionable advice
- Ask follow-up questions when helpful
- Reference their field when relevant
- Keep responses concise but comprehensive
- Be empathetic and understanding`;

    const response = await callOpenRouter(message, systemPrompt);
    
    // Handle both object and string responses
    const responseText = typeof response === 'object' 
      ? response.response || JSON.stringify(response)
      : response;
    
    res.json({
      response: responseText,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      message: 'Chat failed', 
      response: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
      error: error.message 
    });
  }
});

// Generate field updates and insights
router.post('/generate-field-updates', async (req, res) => {
  try {
    const { field } = req.body;
    
    if (!field || field.trim() === '') {
      return res.status(400).json({ message: 'Field name is required' });
    }
    
    const prompt = `Generate 3-4 brief, current updates about the "${field}" industry. Include recent trends, opportunities, market changes, or important developments. Each update should be 1-2 sentences and actionable/relevant for career development.

Respond with JSON:
{
  "updates": [
    {
      "title": "Brief headline",
      "content": "1-2 sentence description",
      "type": "trend/opportunity/news/skill"
    }
  ]
}

Focus on current 2024 developments and practical career implications.`;

    const response = await callOpenRouter(prompt);
    
    // Get related news as well
    const news = await fetchNews(field);
    
    res.json({
      field,
      updates: response.updates || [],
      latestNews: news.slice(0, 2)
    });
  } catch (error) {
    console.error('Field updates error:', error);
    res.status(500).json({ message: 'Field updates failed', error: error.message });
  }
});

// Generate daily tasks based on career field
router.post('/generate-daily-tasks', async (req, res) => {
  try {
    const { field } = req.body;
    
    if (!field || field.trim() === '') {
      return res.status(400).json({ message: 'Field name is required' });
    }
    
    const prompt = `Generate 5 specific daily tasks for someone pursuing a career in "${field}". Each task should be actionable, realistic, and help with career development. Include a mix of learning, networking, skill-building, and practical activities.

Respond with JSON in this format:
{
  "tasks": [
    {
      "id": 1,
      "title": "Task title",
      "description": "Brief description of what to do",
      "category": "Learning/Networking/Skill Development/Portfolio/Planning",
      "completed": false
    }
  ]
}

Make tasks specific to ${field} field and current industry trends.`;

    const response = await callOpenRouter(prompt);
    
    // Ensure proper structure
    if (!response.tasks || !Array.isArray(response.tasks)) {
      const fallbackTasks = [
        { id: 1, title: `Study ${field} fundamentals`, description: "Review core concepts and principles", category: "Learning", completed: false },
        { id: 2, title: "Practice key skills", description: "Spend time improving technical abilities", category: "Skill Development", completed: false },
        { id: 3, title: "Read industry news", description: "Stay updated with latest trends", category: "Learning", completed: false },
        { id: 4, title: "Network with professionals", description: "Connect with people in your field", category: "Networking", completed: false },
        { id: 5, title: "Work on portfolio", description: "Add or improve your professional portfolio", category: "Portfolio", completed: false }
      ];
      return res.json({ tasks: fallbackTasks });
    }
    
    res.json({
      field,
      tasks: response.tasks.map((task, index) => ({
        ...task,
        id: index + 1,
        completed: false
      }))
    });
  } catch (error) {
    console.error('Daily tasks generation error:', error);
    res.status(500).json({ message: 'Task generation failed', error: error.message });
  }
});

module.exports = router;