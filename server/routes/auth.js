const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');

const router = express.Router();

// Authentication middleware
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

// Temporary storage for multi-step registration
const tempUsers = new Map();

// Clean up expired temp users (older than 1 hour)
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [email, data] of tempUsers.entries()) {
    if (data.createdAt < oneHourAgo) {
      tempUsers.delete(email);
    }
  }
}, 30 * 60 * 1000); // Run every 30 minutes

// Step 1: Basic Information
router.post('/register/basic', async (req, res) => {
  try {
    const { name, email, phone, degree, schoolGroup, avatar, additionalDetails } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const tempUserData = {
      name, email, phone, degree, schoolGroup, avatar, additionalDetails,
      step: 1, createdAt: Date.now()
    };
    
    tempUsers.set(email, tempUserData);
    
    res.json({ message: 'Basic info saved', tempUserId: email });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Step 2: User Type Selection
router.post('/register/usertype', async (req, res) => {
  try {
    const { tempUserId, userType, password } = req.body;
    
    const tempData = tempUsers.get(tempUserId);
    if (!tempData) {
      return res.status(400).json({ message: 'Session expired' });
    }
    
    tempData.userType = userType;
    tempData.password = password;
    tempData.step = 2;
    tempUsers.set(tempUserId, tempData);
    
    res.json({ message: 'User type saved', userType });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Step 3a: School Student Career Analysis
router.post('/register/school-analysis', async (req, res) => {
  try {
    const { tempUserId, hasCareerIdea, selectedField } = req.body;
    
    const tempData = tempUsers.get(tempUserId);
    if (!tempData) {
      return res.status(400).json({ message: 'Session expired' });
    }
    
    tempData.hasCareerIdea = hasCareerIdea;
    
    if (hasCareerIdea && selectedField) {
      const analysis = await analyzeFieldWithAI(selectedField);
      tempData.fieldAnalysis = analysis;
      tempData.selectedField = selectedField;
      
      res.json({ 
        analysis,
        nextStep: analysis.hasValue ? 'complete' : 'alternatives'
      });
    } else {
      res.json({ nextStep: 'psychometric' });
    }
    
    tempUsers.set(tempUserId, tempData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Step 3b: Psychometric Test
router.post('/register/psychometric-test', async (req, res) => {
  try {
    const { tempUserId, answers } = req.body;
    
    const tempData = tempUsers.get(tempUserId);
    if (!tempData) {
      return res.status(400).json({ message: 'Session expired' });
    }
    
    const results = await analyzePsychometricResults(answers);
    tempData.psychometricResults = { completed: true, results, answers };
    tempUsers.set(tempUserId, tempData);
    
    res.json({ results, nextStep: 'complete' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Step 3c: College Student Analysis
router.post('/register/college-analysis', async (req, res) => {
  try {
    const { tempUserId, selectedField } = req.body;
    
    const tempData = tempUsers.get(tempUserId);
    if (!tempData) {
      return res.status(400).json({ message: 'Session expired' });
    }
    
    const analysis = await analyzeFieldWithAI(selectedField);
    tempData.fieldAnalysis = analysis;
    tempData.selectedField = selectedField;
    tempUsers.set(tempUserId, tempData);
    
    res.json({ 
      analysis,
      nextStep: analysis.hasValue ? 'complete' : 'alternatives'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Step 3d: Employee Field Switch Analysis
router.post('/register/employee-field-switch', async (req, res) => {
  try {
    const { tempUserId, currentField, targetField } = req.body;
    
    const tempData = tempUsers.get(tempUserId);
    if (!tempData) {
      return res.status(400).json({ message: 'Session expired' });
    }
    
    // Analyze the target field and provide switching guidance
    const fieldAnalysis = await analyzeFieldWithAI(targetField);
    const switchingGuidance = await analyzeSwitchingPath(currentField, targetField);
    
    const analysis = {
      targetField: {
        ...fieldAnalysis,
        field: targetField
      },
      switchingPath: switchingGuidance,
      hasValue: fieldAnalysis.hasValue
    };
    
    tempData.selectedField = targetField;
    tempData.employeeInfo = { currentField, wantToSwitch: true, developCurrent: false };
    tempData.fieldAnalysis = analysis;
    tempUsers.set(tempUserId, tempData);
    
    res.json({ analysis, nextStep: 'complete' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to analyze switching path
async function analyzeSwitchingPath(currentField, targetField) {
  const prompt = `Analyze the career switch from "${currentField}" to "${targetField}". Provide:
1. Difficulty level (Easy/Medium/Hard)
2. Timeline for transition
3. Transferable skills from current field
4. Skills needed to develop
5. Recommended transition steps

Format as JSON:
{
  "difficulty": "Medium",
  "timeline": "6-12 months",
  "transferableSkills": ["skill1", "skill2"],
  "skillsToLearn": ["skill1", "skill2"],
  "transitionSteps": ["step1", "step2", "step3"]
}`;
  
  return await callOpenRouter(prompt);
}

// Step 3d: Employee Analysis
router.post('/register/employee-analysis', async (req, res) => {
  try {
    const { tempUserId, currentField, wantToSwitch, developCurrent } = req.body;
    
    const tempData = tempUsers.get(tempUserId);
    if (!tempData) {
      return res.status(400).json({ message: 'Session expired' });
    }
    
    let suggestions;
    if (wantToSwitch) {
      suggestions = await suggestCareerAlternatives(currentField);
    } else {
      suggestions = await suggestFieldDevelopment(currentField);
    }
    
    tempData.employeeInfo = { currentField, wantToSwitch, developCurrent };
    tempData.careerSuggestions = suggestions;
    tempUsers.set(tempUserId, tempData);
    
    res.json({ suggestions, nextStep: 'complete' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Complete Registration
router.post('/register/complete', async (req, res) => {
  try {
    const { tempUserId, selectedOption } = req.body;
    
    const tempData = tempUsers.get(tempUserId);
    if (!tempData) {
      return res.status(400).json({ message: 'Session expired' });
    }
    
    const hashedPassword = await bcrypt.hash(tempData.password, 12);
    
    const userData = {
      name: tempData.name,
      email: tempData.email,
      phone: tempData.phone,
      password: hashedPassword,
      degree: tempData.degree,
      schoolGroup: tempData.schoolGroup,
      avatar: tempData.avatar,
      additionalDetails: tempData.additionalDetails,
      userType: tempData.userType,
      hasCareerIdea: tempData.hasCareerIdea,
      currentField: tempData.selectedField || tempData.employeeInfo?.currentField,
      selectedCareerField: selectedOption || tempData.selectedField || tempData.employeeInfo?.currentField,
      fieldAnalysis: tempData.fieldAnalysis || {},
      psychometricResults: tempData.psychometricResults || {},
      employeeInfo: tempData.employeeInfo || {},
      selectedCareerOption: selectedOption,
      registrationComplete: true
    };
    
    const user = new User(userData);
    await user.save();
    
    // Clean up temp data
    tempUsers.delete(tempUserId);
    
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Registration complete',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        avatar: user.avatar,
        registrationComplete: user.registrationComplete
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// AI Helper Functions
async function callOpenRouter(prompt, systemMessage = 'You are a career counselor providing accurate guidance. Always respond with valid JSON format.') {
  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'openai/gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1500
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'SkillFarm Career Guidance'
      }
    });
    
    const content = response.data.choices[0].message.content.trim();
    
    // Clean up the response to extract JSON
    let jsonContent = content;
    if (content.includes('```json')) {
      jsonContent = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
      jsonContent = content.split('```')[1].split('```')[0].trim();
    }
    
    try {
      return JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', jsonContent);
      return getFallbackResponse(prompt);
    }
  } catch (error) {
    console.error('OpenRouter API error:', error.response?.data || error.message);
    return getFallbackResponse(prompt);
  }
}

function getFallbackResponse(prompt) {
  if (prompt.includes('psychometric')) {
    return {
      personality: "Analytical Thinker",
      suggestedFields: [
        { field: "Data Science", reason: "Strong analytical skills", score: 85 },
        { field: "Software Development", reason: "Problem-solving aptitude", score: 80 }
      ],
      strengths: ["Logical thinking", "Problem solving", "Attention to detail"]
    };
  }
  if (prompt.includes('alternative')) {
    return {
      alternatives: [
        { field: "Digital Marketing", difficulty: "Medium", timeline: "6-12 months", skills: ["Analytics", "Content Creation"] },
        { field: "Data Analysis", difficulty: "Medium", timeline: "8-14 months", skills: ["Statistics", "Excel", "SQL"] }
      ]
    };
  }
  if (prompt.includes('development')) {
    return {
      development: [
        { path: "Senior Developer", skills: ["Leadership", "Architecture"], timeline: "2-3 years", outcome: "Lead technical teams" },
        { path: "Technical Specialist", skills: ["Advanced frameworks", "Cloud"], timeline: "1-2 years", outcome: "Become domain expert" }
      ]
    };
  }
  return {
    hasValue: false,
    value: "Low",
    growth: "Limited growth potential",
    salary: "Below average salary range",
    skills: ["Basic skills", "Communication"],
    alternatives: ["Digital Marketing", "Data Analysis", "Software Development", "Project Management"]
  };
}

async function analyzeFieldWithAI(field) {
  const prompt = `Analyze the career field "${field}" and provide a JSON response with:
{
  "hasValue": true/false (true if High/Medium value, false if Low value),
  "value": "High"/"Medium"/"Low",
  "growth": "growth potential description",
  "salary": "salary range",
  "skills": ["required skills"],
  "alternatives": ["alternative field 1", "alternative field 2", "alternative field 3"]
}

If value is "Low", provide 3-5 related alternative fields with better prospects in the alternatives array.
If value is "High" or "Medium", alternatives array can be empty or contain complementary fields.`;
  
  return await callOpenRouter(prompt);
}

async function analyzePsychometricResults(answers) {
  const prompt = `Based on psychometric test answers: ${JSON.stringify(answers)}
Provide career suggestions in JSON format:
{
  "personality": "personality type",
  "suggestedFields": [
    {"field": "field name", "reason": "why suitable", "score": 0-100}
  ],
  "strengths": ["identified strengths"],
  "recommendations": "detailed recommendations"
}`;
  
  return await callOpenRouter(prompt);
}

async function suggestCareerAlternatives(currentField) {
  const prompt = `For someone currently working in "${currentField}", suggest 3-5 realistic alternative career paths. Consider transferable skills and market demand. 

Respond ONLY with valid JSON in this exact format:
{
  "alternatives": [
    {
      "field": "Digital Marketing",
      "difficulty": "Medium", 
      "timeline": "6-12 months",
      "skills": ["Analytics", "Content Creation", "Social Media"]
    },
    {
      "field": "Data Analysis", 
      "difficulty": "Hard",
      "timeline": "8-14 months", 
      "skills": ["SQL", "Python", "Statistics"]
    }
  ]
}

Ensure difficulty is Easy/Medium/Hard, timeline includes specific months/years, and skills is an array of strings.`;
  
  const result = await callOpenRouter(prompt);
  
  // If AI response doesn't have proper structure, return fallback
  if (!result.alternatives || !Array.isArray(result.alternatives)) {
    return {
      alternatives: [
        { field: "Digital Marketing", difficulty: "Medium", timeline: "6-12 months", skills: ["Analytics", "Content Creation"] },
        { field: "Data Analysis", difficulty: "Medium", timeline: "8-14 months", skills: ["Statistics", "Excel", "SQL"] },
        { field: "Project Management", difficulty: "Easy", timeline: "3-6 months", skills: ["Planning", "Communication", "Leadership"] }
      ]
    };
  }
  
  return result;
}

async function suggestFieldDevelopment(currentField) {
  const prompt = `For career advancement in "${currentField}", provide specific development paths and growth opportunities. Focus on realistic next steps. Respond in JSON format:
{
  "development": [
    {"path": "career advancement path", "skills": ["skills to develop"], "timeline": "time needed", "outcome": "expected career outcome"}
  ]
}`;
  
  return await callOpenRouter(prompt);
}

// Generate psychometric test using AI
router.get('/psychometric-test', async (req, res) => {
  try {
    const prompt = `Generate a comprehensive psychometric test for career guidance with 8-10 questions. Include questions about personality, interests, values, and skills. Respond in JSON format:
{
  "questions": [
    {"id": 1, "question": "question text", "options": ["option1", "option2", "option3", "option4"], "category": "personality/interests/values/skills"}
  ]
}`;
    
    const aiTest = await callOpenRouter(prompt);
    
    // Fallback to static test if AI fails
    const staticTest = {
      questions: [
        {
          id: 1,
          question: "What type of work environment energizes you most?",
          options: ["Collaborative team settings", "Independent focused work", "Dynamic changing environments", "Structured organized spaces"],
          category: "personality"
        },
        {
          id: 2,
          question: "Which activities do you find most engaging?",
          options: ["Solving complex problems", "Creating and designing", "Helping and teaching others", "Analyzing data and patterns"],
          category: "interests"
        },
        {
          id: 3,
          question: "How do you prefer to make decisions?",
          options: ["Based on logical analysis", "Following gut instincts", "Consulting with others", "Considering all possibilities"],
          category: "personality"
        },
        {
          id: 4,
          question: "What drives you most in your career?",
          options: ["Financial security and growth", "Making a positive impact", "Personal achievement and recognition", "Learning and skill development"],
          category: "values"
        },
        {
          id: 5,
          question: "Which skills do you excel at naturally?",
          options: ["Communication and interpersonal", "Technical and analytical", "Creative and artistic", "Leadership and management"],
          category: "skills"
        },
        {
          id: 6,
          question: "How do you handle challenging situations?",
          options: ["Break them down systematically", "Think creatively for solutions", "Seek advice from others", "Take decisive action quickly"],
          category: "personality"
        },
        {
          id: 7,
          question: "What type of tasks do you enjoy most?",
          options: ["Research and investigation", "Building and creating", "Teaching and mentoring", "Planning and organizing"],
          category: "interests"
        },
        {
          id: 8,
          question: "In a team project, you naturally tend to:",
          options: ["Lead and coordinate", "Generate creative ideas", "Analyze and provide insights", "Support and facilitate others"],
          category: "skills"
        }
      ]
    };
    
    res.json({ test: aiTest.questions ? aiTest : staticTest });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate test', error: error.message });
  }
});

// Get career fields list
router.get('/career-fields', (req, res) => {
  const fields = [
    'Software Development', 'Data Science', 'Digital Marketing', 'Graphic Design',
    'Business Management', 'Finance', 'Healthcare', 'Education', 'Engineering',
    'Law', 'Psychology', 'Architecture', 'Journalism', 'Photography',
    'Music', 'Sports', 'Agriculture', 'Environmental Science', 'Biotechnology',
    'Artificial Intelligence', 'Cybersecurity', 'Cloud Computing', 'Mobile Development',
    'Product Management', 'Sales', 'Human Resources', 'Marketing', 'Consulting',
    'Real Estate', 'Banking', 'Insurance', 'Retail', 'Manufacturing',
    'Logistics', 'Tourism', 'Fashion', 'Food & Beverage', 'Automotive'
  ];
  
  res.json({ fields });
});

// Update user profile
router.put('/update-profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, selectedCareerField } = req.body;
    const userId = req.user.userId;
    
    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        ...(name && { name }),
        ...(email && { email }),
        ...(selectedCareerField !== undefined && { selectedCareerField })
      },
      { new: true, select: '-password' }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ 
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;