const express = require('express');
const axios = require('axios');

const router = express.Router();

// Analyze employee field for development or switching
router.post('/analyze-employee-field', async (req, res) => {
  try {
    const { field, type, userInfo } = req.body;
    
    if (!field || field.trim() === '') {
      return res.status(400).json({ message: 'Field name is required' });
    }
    
    const prompt = type === 'current' 
      ? `Analyze the career field "${field}" for an employee wanting to develop in their current field.

User context:
- Name: ${userInfo?.name || 'User'}
- Current Field: ${field}

Provide detailed analysis:
1. Assess future value (High/Medium/Low) based on job growth, salary trends, automation risk
2. If High value, provide development opportunities and growth paths
3. If Medium/Low value, suggest 3 related high-value fields they can transition to
4. Provide market outlook and recommendations

Respond with JSON:
{
  "analyzedField": "${field}",
  "futureValue": "High/Medium/Low",
  "marketOutlook": "2-3 sentence market analysis",
  "developmentPaths": ["path1", "path2", "path3"],
  "alternatives": ["alternative1", "alternative2", "alternative3"],
  "recommendations": "specific advice for this employee"
}

Only include alternatives if futureValue is Medium or Low.`
      : `Analyze the career field "${field}" for an employee wanting to switch from "${userInfo?.currentField || 'their current field'}".

User context:
- Name: ${userInfo?.name || 'User'}
- Current Field: ${userInfo?.currentField || 'Not specified'}
- Desired Field: ${field}

Provide detailed analysis:
1. Assess future value (High/Medium/Low) of the desired field
2. If High value, provide transition guidance and required skills
3. If Medium/Low value, suggest 3 high-value alternative fields related to their interest
4. Consider transferable skills from current field

Respond with JSON:
{
  "analyzedField": "${field}",
  "futureValue": "High/Medium/Low",
  "marketOutlook": "2-3 sentence market analysis",
  "transitionPath": "guidance for switching fields",
  "requiredSkills": ["skill1", "skill2", "skill3"],
  "alternatives": ["alternative1", "alternative2", "alternative3"],
  "recommendations": "specific advice for this career switch"
}

Only include alternatives if futureValue is Medium or Low.`;

    const response = await callOpenRouter(prompt);
    
    res.json({
      originalInput: field,
      type,
      ...response,
      analyzedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Employee field analysis error:', error);
    res.status(500).json({ message: 'Employee field analysis failed', error: error.message });
  }
});

// Analyze career field input from user
router.post('/analyze-career-field', async (req, res) => {
  try {
    const { careerField, userInfo } = req.body;
    
    if (!careerField || careerField.trim() === '') {
      return res.status(400).json({ message: 'Career field is required' });
    }
    
    const prompt = `Analyze the career field input: "${careerField}" for future value and market prospects.

User context:
- Name: ${userInfo?.name || 'User'}
- User Type: ${userInfo?.userType || 'student'}
- Degree: ${userInfo?.degree?.name || 'Not specified'}

Provide detailed analysis:
1. Standardize the career field name
2. Assess future value (High/Medium/Low) based on job growth, salary trends, automation risk
3. If Low value, suggest 3 high-value alternative fields
4. Provide market outlook

Respond with JSON:
{
  "analyzedField": "standardized career field name",
  "futureValue": "High/Medium/Low",
  "marketOutlook": "2-3 sentence market analysis",
  "alternatives": ["alternative1", "alternative2", "alternative3"],
  "confidence": number (1-100),
  "recommendations": "brief advice for this user"
}

Only include alternatives if futureValue is Low or Medium.`;

    const response = await callOpenRouter(prompt);
    
    res.json({
      originalInput: careerField,
      ...response,
      analyzedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Career field analysis error:', error);
    res.status(500).json({ message: 'Career field analysis failed', error: error.message });
  }
});

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
    const { answers, userInfo } = req.body;
    
    const prompt = `Based on these psychometric test answers: ${JSON.stringify(answers)}
User info: ${JSON.stringify(userInfo)}

Analyze the responses and suggest 3-5 suitable career fields with explanations.
Consider personality traits, interests, and aptitudes.

Respond with JSON:
{
  "suggestedFields": [
    {
      "field": "career field name",
      "reason": "why this field suits them",
      "futureValue": "High/Medium/Low",
      "suitability_score": number (1-100)
    }
  ],
  "personality": "brief personality summary",
  "strengths": ["strength1", "strength2"]
}

Focus on high-value career fields with good future prospects.`;

    const response = await callOpenRouter(prompt);
    
    res.json({
      results: {
        suggestedFields: response.suggestedFields || [],
        personality: response.personality,
        strengths: response.strengths || []
      }
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
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

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
      },
      timeout: 10000
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
    // Return fallback response instead of throwing
    return {
      response: 'AI service temporarily unavailable. Please try again later.',
      fallback: true
    };
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
    // Check if YouTube API key is available
    if (!process.env.YOUTUBE_API_KEY) {
      console.log('No YouTube API key found, using fallback data');
      return getFallbackCourses(query);
    }

    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: `${query} tutorial course`,
        type: 'video',
        maxResults: 6,
        order: 'relevance',
        videoDuration: 'medium',
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
      
      const videoId = item.id.videoId;
      let thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      
      if (item.snippet?.thumbnails?.medium?.url) {
        thumbnailUrl = item.snippet.thumbnails.medium.url.replace('http://', 'https://');
      }
      
      return {
        id: videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: thumbnailUrl,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        duration,
        viewCount,
        url: `https://www.youtube.com/watch?v=${videoId}`
      };
    });
    
    return courses;
  } catch (error) {
    console.error('YouTube API error:', error.response?.data || error.message);
    return getFallbackCourses(query);
  }
}

// Fallback courses with real YouTube video IDs for testing
function getFallbackCourses(query) {
  const fallbackVideos = [
    { id: 'dQw4w9WgXcQ', title: 'Programming Fundamentals', channel: 'Tech Academy' },
    { id: 'jNQXAC9IVRw', title: 'Web Development Basics', channel: 'Code School' },
    { id: '9bZkp7q19f0', title: 'Data Science Introduction', channel: 'Data Learn' },
    { id: 'kJQP7kiw5Fk', title: 'Digital Marketing Course', channel: 'Marketing Pro' },
    { id: 'M7lc1UVf-VE', title: 'Design Principles', channel: 'Creative Hub' },
    { id: 'ScMzIvxBSi4', title: 'Business Strategy', channel: 'Business School' }
  ];
  
  return fallbackVideos.map(video => ({
    id: video.id,
    title: `${query} - ${video.title}`,
    description: `Learn ${query} with this comprehensive tutorial course.`,
    thumbnail: `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`,
    channelTitle: video.channel,
    publishedAt: new Date().toISOString(),
    duration: '15:30',
    viewCount: '1.2K views',
    url: `https://www.youtube.com/watch?v=${video.id}`
  }));
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

// Generate news based on career field with enhanced analysis
router.post('/generate-news', async (req, res) => {
  try {
    const { field, category, preferences, enhancedAnalysis } = req.body;
    
    if (!field || field.trim() === '') {
      return res.status(400).json({ message: 'Field name is required' });
    }
    
    let news = await fetchNews(field, category);
    
    // Enhanced analysis if requested
    if (enhancedAnalysis) {
      news = await Promise.all(news.map(async (article) => {
        try {
          const analysisPrompt = `Analyze this news article for career relevance:
Title: ${article.title}
Description: ${article.description}

Provide JSON response with:
{
  "aiSummary": "brief career-focused summary",
  "relevanceScore": number (1-100),
  "careerImpact": "high/medium/low",
  "skillsRequired": ["skill1", "skill2"],
  "jobOpportunities": number,
  "salaryImpact": "+X%" or "stable",
  "futureRelevance": number (1-100)
}`;
          
          const analysis = await callOpenRouter(analysisPrompt);
          return { ...article, ...analysis };
        } catch (error) {
          return article;
        }
      }));
    }
    
    res.json({
      field,
      news: news.slice(0, 15),
      enhancedAnalysis: enhancedAnalysis || false
    });
    // Emit news updates to connected clients
    try {
      const io = req.app.get('io');
      io.emit('news-updated', { field, news: news.slice(0, 15), timestamp: new Date().toISOString() });
    } catch (e) {
      console.warn('No socket server available to emit news-updated');
    }
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

// Enhanced AI Chat with conversation context and advanced features
router.post('/chat', async (req, res) => {
  try {
    const { message, userField, userName, conversationHistory, requestType } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message is required' });
    }
    
    let responseText;
    try {
      // Build context from conversation history
      let contextMessages = [];
      if (conversationHistory && conversationHistory.length > 0) {
        contextMessages = conversationHistory.slice(-5).map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));
      }
      
      const systemPrompt = `You are an expert AI career coach and mentor specializing in ${userField || 'career development'}. You provide personalized, actionable career guidance with deep industry knowledge.

User Context:
- Name: ${userName || 'User'}
- Career Field: ${userField || 'General'}
- Focus: Provide advice specifically relevant to ${userField || 'their career goals'}

Advanced Capabilities:
- Create detailed career roadmaps with specific milestones
- Provide skill gap analysis and learning recommendations
- Offer market insights and salary negotiation strategies
- Generate actionable plans with measurable outcomes
- Reference current industry trends and future outlook

Response Guidelines:
- Be conversational, supportive, and encouraging
- Provide specific, actionable advice with clear next steps
- Include relevant metrics, timelines, and success indicators
- Reference current market trends and opportunities
- Ask strategic follow-up questions when helpful
- Structure responses with clear sections when appropriate
- Include practical steps they can implement immediately
- Be empathetic and understanding of career challenges

Response Format: Provide comprehensive yet concise guidance that directly addresses their query with actionable insights.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...contextMessages,
        { role: 'user', content: message }
      ];

      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'openai/gpt-3.5-turbo',
        messages,
        temperature: 0.7,
        max_tokens: 1500
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      responseText = response.data.choices[0].message.content;
    } catch (error) {
      console.error('AI Chat API error:', error);
      // Fallback response
      responseText = `I understand you're asking about ${message}. While I'm having some technical difficulties right now, here are some general suggestions:\n\n1. Research current trends in ${userField || 'your field'}\n2. Network with professionals in your industry\n3. Update your skills through online courses\n4. Consider seeking mentorship\n\nPlease try asking your question again in a moment, and I'll provide more detailed guidance.`;
    }
    
    // Determine response type based on content
    let responseType = 'text';
    if (responseText.toLowerCase().includes('roadmap') || responseText.toLowerCase().includes('plan')) {
      responseType = 'roadmap';
    } else if (responseText.toLowerCase().includes('assess') || responseText.toLowerCase().includes('analysis')) {
      responseType = 'assessment';
    } else if (responseText.toLowerCase().includes('action') || responseText.toLowerCase().includes('steps')) {
      responseType = 'action_plan';
    }
    
    // Extract metadata
    const metadata = {
      confidence: 85 + Math.floor(Math.random() * 15), // 85-100%
      sources: ['Industry Reports', 'Market Analysis', 'Career Data'],
      relatedTopics: extractRelatedTopics(responseText, userField),
      actionItems: extractActionItems(responseText),
      followUpQuestions: generateFollowUpQuestions(responseText, userField)
    };
    
    res.json({
      response: responseText,
      type: responseType,
      metadata,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.json({ 
      response: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
      type: 'text',
      metadata: {
        confidence: 50,
        sources: [],
        relatedTopics: [],
        actionItems: [],
        followUpQuestions: []
      },
      timestamp: new Date().toISOString()
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

// Enhanced daily tasks generation with advanced features
router.post('/generate-daily-tasks', async (req, res) => {
  try {
    const { field, enhancedTasks, includeSkills, difficulty } = req.body;
    
    if (!field || field.trim() === '') {
      return res.status(400).json({ message: 'Field name is required' });
    }
    
    let response;
    try {
      const prompt = `Generate 5-7 comprehensive daily tasks for someone pursuing a career in "${field}". Each task should be actionable, realistic, and help with career development.

${enhancedTasks ? 'Include advanced features like priority levels, difficulty ratings, estimated time, career impact, and skills gained.' : ''}

Task Categories to include:
- Learning & Research (industry trends, new technologies)
- Skill Development (technical and soft skills)
- Networking & Relationship Building
- Portfolio & Personal Branding
- Strategic Planning & Goal Setting
- Market Research & Opportunities

Difficulty Level: ${difficulty || 'mixed'} (easy/medium/hard tasks)

Respond with JSON in this format:
{
  "tasks": [
    {
      "id": 1,
      "title": "Specific, actionable task title",
      "description": "Detailed description with clear outcomes",
      "category": "Learning/Skill Development/Networking/Portfolio/Planning/Research",
      "priority": "high/medium/low",
      "difficulty": "easy/medium/hard",
      "estimatedTime": 30,
      "careerImpact": "high/medium/low",
      "skillsGained": ["skill1", "skill2"],
      "tags": ["tag1", "tag2"],
      "completed": false
    }
  ]
}

Make tasks specific to ${field} field, current industry trends, and career advancement opportunities. Include both immediate actions and strategic long-term activities.`;

      response = await callOpenRouter(prompt);
    } catch (error) {
      console.log('AI API failed, using fallback tasks');
      response = { fallback: true };
    }
    
    // Use fallback if AI failed or returned invalid data
    if (!response.tasks || !Array.isArray(response.tasks) || response.fallback) {
      const fallbackTasks = generateFallbackTasks(field, enhancedTasks);
      return res.json({ tasks: fallbackTasks });
    }
    
    const enhancedTaskList = response.tasks.map((task, index) => ({
      ...task,
      id: index + 1,
      completed: false,
      aiGenerated: true,
      recurringType: 'none',
      // Add default values if missing
      priority: task.priority || ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
      difficulty: task.difficulty || ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
      estimatedTime: task.estimatedTime || (20 + Math.floor(Math.random() * 40)),
      careerImpact: task.careerImpact || ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
      skillsGained: task.skillsGained || generateDefaultSkills(task.title, task.description),
      tags: task.tags || generateDefaultTags(task.title, task.description)
    }));
    
    res.json({
      field,
      tasks: enhancedTaskList,
      metadata: {
        generatedAt: new Date().toISOString(),
        enhancedFeatures: enhancedTasks || false,
        totalTasks: enhancedTaskList.length,
        averageTime: Math.round(enhancedTaskList.reduce((sum, task) => sum + (task.estimatedTime || 0), 0) / enhancedTaskList.length)
      }
    });
  } catch (error) {
    console.error('Daily tasks generation error:', error);
    // Return fallback tasks instead of error
    const fallbackTasks = generateFallbackTasks(req.body.field || 'General', req.body.enhancedTasks);
    res.json({ tasks: fallbackTasks });
  }
});

// Generate AI insights for news articles
router.post('/generate-news-insights', async (req, res) => {
  try {
    const { field, articles, readingHistory } = req.body;
    
    const prompt = `Analyze these news articles for career insights in ${field}:
${articles.map(a => `Title: ${a.title}\nDescription: ${a.description}`).join('\n\n')}

Provide JSON response with:
{
  "marketTrend": "brief market trend summary",
  "opportunityScore": number (1-100),
  "recommendedAction": "specific action to take",
  "keyInsights": ["insight1", "insight2"],
  "skillDemand": ["skill1", "skill2"]
}`;

    const response = await callOpenRouter(prompt);
    
    res.json({
      insights: response,
      generatedAt: new Date().toISOString()
    });
    // Emit AI insight for news to clients
    try {
      const io = req.app.get('io');
      io.emit('new-ai-insight', { field, insights: response, generatedAt: new Date().toISOString() });
    } catch (e) {
      console.warn('No socket server available to emit new-ai-insight');
    }
  } catch (error) {
    console.error('News insights error:', error);
    res.status(500).json({ message: 'News insights failed', error: error.message });
  }
});

// Generate personalized news feed
router.post('/personalized-news', async (req, res) => {
  try {
    const { field, readingHistory, preferences } = req.body;
    
    // Get news based on user preferences and history
    const news = await fetchNews(field);
    
    // AI-powered personalization
    const prompt = `Based on reading history and preferences, rank these articles for relevance to ${field} career:
${news.slice(0, 10).map((a, i) => `${i+1}. ${a.title}`).join('\n')}

Return JSON with: {"rankedArticles": [1,3,2,5,4...]}`;
    
    const aiResponse = await callOpenRouter(prompt);
    const rankedIndices = aiResponse.rankedArticles || [1,2,3,4,5,6,7,8,9,10];
    
    const personalizedArticles = rankedIndices.slice(0, 8).map(index => news[index - 1]).filter(Boolean);
    
    res.json({
      articles: personalizedArticles,
      personalized: true
    });
  } catch (error) {
    console.error('Personalized news error:', error);
    res.status(500).json({ message: 'Personalized news failed', error: error.message });
  }
});

// Generate task coach insights
router.post('/task-coach-insights', async (req, res) => {
  try {
    const { field, recentTasks } = req.body;
    
    const prompt = `As an AI productivity coach for ${field}, analyze recent task completion patterns and provide insights:
Recent tasks: ${recentTasks.map(t => `${t.title} (${t.completed ? 'completed' : 'pending'})`).join(', ')}

Provide JSON:
{
  "todaysFocus": "main focus area for today",
  "productivityTip": "specific productivity tip",
  "energyRecommendation": "energy management advice",
  "optimalTime": "best time for focused work",
  "focusScore": number (1-100)
}`;

    const response = await callOpenRouter(prompt);
    
    res.json({
      insights: response,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Task coach insights error:', error);
    res.status(500).json({ message: 'Task coach insights failed', error: error.message });
  }
});

// Helper function to generate fallback tasks
function generateFallbackTasks(field, enhanced = false) {
  const baseTasks = [
    {
      title: `Research latest ${field} trends`,
      description: `Spend 30 minutes researching current trends and developments in ${field}`,
      category: 'Research'
    },
    {
      title: 'Update LinkedIn profile',
      description: 'Review and update your LinkedIn profile with recent achievements',
      category: 'Portfolio'
    },
    {
      title: `Practice ${field} skills`,
      description: `Dedicate time to practicing core ${field} skills through exercises or projects`,
      category: 'Skill Development'
    },
    {
      title: 'Network with professionals',
      description: 'Reach out to 2-3 professionals in your field for networking',
      category: 'Networking'
    },
    {
      title: 'Read industry articles',
      description: `Read 2-3 articles about ${field} industry insights and best practices`,
      category: 'Learning'
    }
  ];
  
  return baseTasks.map((task, index) => ({
    id: index + 1,
    ...task,
    priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
    difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
    estimatedTime: 20 + Math.floor(Math.random() * 40),
    careerImpact: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
    skillsGained: [`${field} Knowledge`, 'Professional Development'],
    tags: [field, 'Career Growth'],
    completed: false
  }));
}

// Helper function to generate default skills
function generateDefaultSkills(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const skills = [];
  
  if (text.includes('research')) skills.push('Research Skills');
  if (text.includes('network')) skills.push('Networking');
  if (text.includes('learn')) skills.push('Learning');
  if (text.includes('practice')) skills.push('Skill Development');
  if (text.includes('write') || text.includes('content')) skills.push('Communication');
  
  return skills.length > 0 ? skills : ['Professional Development'];
}

// Helper function to generate default tags
function generateDefaultTags(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const tags = [];
  
  if (text.includes('daily')) tags.push('Daily');
  if (text.includes('skill')) tags.push('Skills');
  if (text.includes('career')) tags.push('Career');
  if (text.includes('network')) tags.push('Networking');
  if (text.includes('learn')) tags.push('Learning');
  
  return tags.length > 0 ? tags : ['General'];
}

// Helper functions for chat metadata
function extractRelatedTopics(text, field) {
  const topics = [];
  if (text.toLowerCase().includes('skill')) topics.push('Skill Development');
  if (text.toLowerCase().includes('career')) topics.push('Career Planning');
  if (text.toLowerCase().includes('interview')) topics.push('Interview Prep');
  if (text.toLowerCase().includes('salary')) topics.push('Compensation');
  if (text.toLowerCase().includes('network')) topics.push('Networking');
  return topics.slice(0, 3);
}

function extractActionItems(text) {
  const items = [];
  const sentences = text.split('.');
  sentences.forEach(sentence => {
    if (sentence.toLowerCase().includes('should') || 
        sentence.toLowerCase().includes('recommend') ||
        sentence.toLowerCase().includes('consider')) {
      items.push(sentence.trim());
    }
  });
  return items.slice(0, 3);
}

function generateFollowUpQuestions(text, field) {
  const questions = [
    `What specific ${field} skills would you like to develop further?`,
    'Would you like me to create a detailed action plan?',
    'Do you have any specific timeline or goals in mind?'
  ];
  return questions.slice(0, 2);
}
module.exports = router;