'use client'

import { useState, useEffect, useRef } from 'react'
import { Navbar } from "@/components/navbar"
import { Send, Bot, User, Mic, MicOff, Copy, Download, Sparkles, MessageSquare, History, Settings, Zap } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useChatSocket } from "@/hooks/use-socket"
import API_BASE_URL from "@/lib/api"

interface Message {
  id: number
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
  type?: 'text' | 'suggestion' | 'analysis' | 'roadmap' | 'assessment' | 'action_plan'
  metadata?: {
    confidence?: number
    sources?: string[]
    relatedTopics?: string[]
    actionItems?: string[]
    followUpQuestions?: string[]
  }
  reactions?: {
    helpful: number
    accurate: number
    actionable: number
  }
  isBookmarked?: boolean
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  category?: string
  tags?: string[]
  summary?: string
  actionItems?: string[]
  isStarred?: boolean
  lastActivity?: Date
}

interface QuickPrompt {
  title: string
  prompt: string
  category: string
  icon?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime?: string
  tags?: string[]
}

export default function ChatAIPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isListening, setIsListening] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('chat')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognition = useRef<any>(null)
  const { messages: socketMessages, typingUsers, isConnected } = useChatSocket()
  const [roadmap, setRoadmap] = useState<any>(null)
  const [insights, setInsights] = useState<any>(null)
  const [marketData, setMarketData] = useState<any>(null)

  const quickPrompts: QuickPrompt[] = [
    { 
      title: "Career Roadmap", 
      prompt: "Create a detailed career roadmap for my field with specific milestones and timelines", 
      category: "Planning",
      icon: "🗺️",
      difficulty: "intermediate",
      estimatedTime: "5-10 min",
      tags: ["roadmap", "planning", "goals"]
    },
    { 
      title: "Skill Gap Analysis", 
      prompt: "Analyze my current skills and identify gaps for my target role", 
      category: "Skills",
      icon: "📊",
      difficulty: "intermediate",
      estimatedTime: "3-7 min",
      tags: ["skills", "assessment", "gaps"]
    },
    { 
      title: "Interview Mastery", 
      prompt: "Help me prepare comprehensive interview strategies for my field including common questions and best practices", 
      category: "Interview",
      icon: "🎯",
      difficulty: "advanced",
      estimatedTime: "10-15 min",
      tags: ["interview", "preparation", "questions"]
    },
    { 
      title: "Salary Negotiation", 
      prompt: "Provide advanced salary negotiation strategies and market insights for my role", 
      category: "Career",
      icon: "💰",
      difficulty: "advanced",
      estimatedTime: "5-8 min",
      tags: ["salary", "negotiation", "market"]
    },
    { 
      title: "Network Building", 
      prompt: "Create a strategic networking plan to build meaningful professional relationships", 
      category: "Networking",
      icon: "🤝",
      difficulty: "beginner",
      estimatedTime: "3-5 min",
      tags: ["networking", "relationships", "strategy"]
    },
    { 
      title: "Resume Optimization", 
      prompt: "Analyze and optimize my resume for maximum impact in my target industry", 
      category: "Resume",
      icon: "📄",
      difficulty: "intermediate",
      estimatedTime: "7-12 min",
      tags: ["resume", "optimization", "ats"]
    },
    { 
      title: "Industry Trends", 
      prompt: "What are the latest trends and future outlook in my industry?", 
      category: "Research",
      icon: "📈",
      difficulty: "beginner",
      estimatedTime: "2-4 min",
      tags: ["trends", "industry", "future"]
    },
    { 
      title: "Personal Branding", 
      prompt: "Help me develop a strong personal brand strategy for my career", 
      category: "Branding",
      icon: "✨",
      difficulty: "intermediate",
      estimatedTime: "8-12 min",
      tags: ["branding", "personal", "strategy"]
    },
    { 
      title: "Career Pivot", 
      prompt: "I want to change careers. Help me create a transition plan", 
      category: "Transition",
      icon: "🔄",
      difficulty: "advanced",
      estimatedTime: "15-20 min",
      tags: ["pivot", "transition", "change"]
    },
    { 
      title: "Leadership Development", 
      prompt: "How can I develop leadership skills and advance to management roles?", 
      category: "Leadership",
      icon: "👑",
      difficulty: "advanced",
      estimatedTime: "10-15 min",
      tags: ["leadership", "management", "development"]
    },
    {
      title: "Market Analysis",
      prompt: "Analyze current job market trends and opportunities in my field",
      category: "Research",
      icon: "📊",
      difficulty: "intermediate",
      estimatedTime: "5-8 min",
      tags: ["market", "analysis", "opportunities"]
    },
    {
      title: "Skill Certification Path",
      prompt: "Recommend the best certifications and courses for my career advancement",
      category: "Learning",
      icon: "🎓",
      difficulty: "intermediate",
      estimatedTime: "6-10 min",
      tags: ["certification", "learning", "advancement"]
    },
    {
      title: "Remote Work Strategy",
      prompt: "Help me develop strategies for effective remote work and career growth",
      category: "Productivity",
      icon: "🏠",
      difficulty: "beginner",
      estimatedTime: "4-7 min",
      tags: ["remote", "productivity", "strategy"]
    },
    {
      title: "Entrepreneurship Guidance",
      prompt: "Guide me through starting my own business in my field",
      category: "Business",
      icon: "🚀",
      difficulty: "advanced",
      estimatedTime: "12-18 min",
      tags: ["entrepreneurship", "business", "startup"]
    },
    {
      title: "Work-Life Balance",
      prompt: "Help me achieve better work-life balance while advancing my career",
      category: "Wellness",
      icon: "⚖️",
      difficulty: "beginner",
      estimatedTime: "3-6 min",
      tags: ["balance", "wellness", "productivity"]
    }
  ]

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      setUser(JSON.parse(userData))
      loadChatSessions()
      
      // Initialize speech recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
        recognition.current = new SpeechRecognition()
        recognition.current.continuous = false
        recognition.current.interimResults = false
        recognition.current.lang = 'en-US'
        
        recognition.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setInput(transcript)
          setIsListening(false)
        }
        
        recognition.current.onerror = () => {
          setIsListening(false)
        }
      }
      
      startNewSession()
    }
  }, [])

  const loadChatSessions = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setChatSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle real-time chat messages
  useEffect(() => {
    if (socketMessages.length > 0) {
      const latestMessage = socketMessages[0]
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: latestMessage.text,
        sender: latestMessage.sender === 'ai' ? 'ai' : 'user',
        timestamp: new Date(latestMessage.timestamp),
        type: latestMessage.type || 'text'
      }])
    }
  }, [socketMessages])

  // Handle typing indicators
  useEffect(() => {
    if (typingUsers.length > 0) {
      console.log('Users typing:', typingUsers)
    }
  }, [typingUsers])

  const startNewSession = () => {
    const sessionId = Date.now().toString()
    const welcomeMessage: Message = {
      id: 1,
      text: `Hello ${user?.name || 'there'}! I'm your AI career coach specialized in ${user?.selectedCareerField || 'career development'}. I can help you with career guidance, skill development, interview preparation, and much more. How can I assist you today?`,
      sender: 'ai',
      timestamp: new Date(),
      type: 'text'
    }
    
    setMessages([welcomeMessage])
    setCurrentSessionId(sessionId)
  }

  const saveCurrentSession = async () => {
    if (currentSessionId && messages.length > 1) {
      const session: ChatSession = {
        id: currentSessionId,
        title: messages[1]?.text.slice(0, 50) + '...' || 'New Chat',
        messages,
        createdAt: new Date()
      }
      
      const updatedSessions = [session, ...chatSessions.filter(s => s.id !== currentSessionId)]
      setChatSessions(updatedSessions)
      
      // Save to MongoDB
      const token = localStorage.getItem('token')
      if (token) {
        try {
          await fetch(`${API_BASE_URL}/api/chat/save-session`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ session })
          })
        } catch (error) {
          console.error('Failed to save chat session:', error)
        }
      }
    }
  }

  const loadSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId)
    if (session) {
      setMessages(session.messages)
      setCurrentSessionId(sessionId)
      setActiveTab('chat')
    }
  }

  const toggleVoiceInput = () => {
    if (isListening) {
      recognition.current?.stop()
      setIsListening(false)
    } else {
      recognition.current?.start()
      setIsListening(true)
    }
  }

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const exportChat = () => {
    const chatText = messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n\n')
    const blob = new Blob([chatText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
  }

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim()
    if (!textToSend || loading) return

    const userMessage: Message = {
      id: messages.length + 1,
      text: textToSend,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: textToSend,
          userField: user?.selectedCareerField,
          userName: user?.name,
          conversationHistory: messages.slice(-5) // Send last 5 messages for context
        })
      })
      
      const data = await response.json()
      
      const aiMessage: Message = {
        id: messages.length + 2,
        text: data.response || 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
        type: data.type || 'text'
      }
      
      setMessages(prev => [...prev, aiMessage])
      saveCurrentSession()
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: messages.length + 2,
        text: 'Sorry, I\'m having trouble connecting right now. Please try again later.',
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const generateRoadmap = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/generate-roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          field: user?.selectedCareerField || 'Technology',
          experience: user?.experience || 'beginner'
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setRoadmap(data.roadmap)
        return
      }
    } catch (error) {
      // Silently handle error
    }
    
    // Fallback roadmap
    setRoadmap({
      milestones: [
        {
          title: "Foundation Skills",
          timeline: "0-3 months",
          description: "Build core competencies in your field",
          skills: ["Communication", "Problem Solving", "Technical Basics"],
          completed: false
        },
        {
          title: "Intermediate Development",
          timeline: "3-12 months",
          description: "Develop specialized skills and gain experience",
          skills: ["Advanced Technical Skills", "Project Management", "Leadership"],
          completed: false
        },
        {
          title: "Advanced Expertise",
          timeline: "1-2 years",
          description: "Become an expert and mentor others",
          skills: ["Strategic Thinking", "Mentorship", "Innovation"],
          completed: false
        }
      ]
    })
  }

  const generateInsights = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/generate-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          field: user?.selectedCareerField || 'Technology',
          chatHistory: messages.slice(-10)
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setInsights(data.insights)
        setMarketData(data.marketData)
        return
      }
    } catch (error) {
      // Silently handle error
    }
    
    // Fallback insights
    setInsights({
      questionsAsked: messages.filter(m => m.sender === 'user').length,
      topicsExplored: Math.min(messages.length / 2, 10),
      actionItems: Math.floor(messages.length / 3),
      skillRecommendation: `Focus on ${user?.selectedCareerField || 'technology'} skills and continuous learning`
    })
    setMarketData({
      trend: `${user?.selectedCareerField || 'Technology'} field is experiencing rapid growth with emerging opportunities`
    })
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen md:pt-0 pb-20 md:pb-8 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI Career Coach
            </h1>
            <p className="text-gray-600">
              {user?.selectedCareerField
                ? `Get personalized guidance for your ${user.selectedCareerField} career`
                : "Get AI-powered career guidance and ask any questions"
              }
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`flex items-center gap-1 text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-600' : 'bg-red-600'}`}></div>
                {isConnected ? 'Live Chat' : 'Offline'}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6">
            {/* Main Chat Area - First on mobile */}
            <div className="lg:col-span-3 order-1">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-4">
                  <TabsTrigger value="chat" className="text-sm">Chat</TabsTrigger>
                  <TabsTrigger value="prompts" className="text-sm">Prompts</TabsTrigger>
                  <TabsTrigger value="roadmap" className="text-sm">Roadmap</TabsTrigger>
                  <TabsTrigger value="insights" className="text-sm">Insights</TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="mt-4">
                  <Card className="h-[60vh] lg:h-[70vh] flex flex-col">
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((message) => (
                        <MessageBubble 
                          key={message.id} 
                          message={message} 
                          onCopy={copyMessage}
                        />
                      ))}
                      
                      {loading && <TypingIndicator />}
                      <div ref={messagesEndRef} />
                    </div>
                    
                    {/* Input Area */}
                    <div className="border-t p-4">
                      <div className="flex gap-2">
                        <Textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Ask me anything about your career..."
                          className="flex-1 resize-none min-h-[60px] max-h-32"
                          disabled={loading}
                        />
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={toggleVoiceInput}
                            variant="outline"
                            size="sm"
                            className={isListening ? 'bg-red-100 text-red-600' : ''}
                          >
                            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                          </Button>
                          <Button
                            onClick={() => sendMessage()}
                            disabled={loading || !input.trim()}
                            size="sm"
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="prompts" className="mt-4">
                  <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                    {quickPrompts.map((prompt, index) => (
                      <Card 
                        key={index} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                          setActiveTab('chat')
                          sendMessage(prompt.prompt)
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-sm">{prompt.title}</h3>
                            <Badge variant="secondary" className="text-xs">{prompt.category}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{prompt.prompt}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="roadmap" className="mt-4">
                  <CareerRoadmapView roadmap={roadmap} user={user} onGenerate={generateRoadmap} />
                </TabsContent>

                <TabsContent value="insights" className="mt-4">
                  <AIInsightsView insights={insights} marketData={marketData} onGenerate={generateInsights} />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar - Second on mobile, hidden by default */}
            <div className="lg:col-span-1 order-2 lg:block hidden">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      onClick={startNewSession} 
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      New Chat
                    </Button>
                    <Button 
                      onClick={exportChat} 
                      variant="outline" 
                      className="w-full justify-start"
                      disabled={messages.length <= 1}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Chat
                    </Button>
                  </CardContent>
                </Card>

                {/* Chat History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <History className="w-5 h-5" />
                      Chat History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                    {chatSessions.length > 0 ? (
                      chatSessions.map((session) => (
                        <div
                          key={session.id}
                          onClick={() => loadSession(session.id)}
                          className={`p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors ${
                            currentSessionId === session.id ? 'bg-blue-100' : ''
                          }`}
                        >
                          <p className="text-sm font-medium truncate">{session.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(session.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No chat history yet</p>
                        <p className="text-xs text-gray-400">Start a conversation to see your chats here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

function MessageBubble({ message, onCopy }: { 
  message: Message
  onCopy: (text: string) => void 
}) {
  return (
    <div
      className={`flex items-start gap-3 ${
        message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        message.sender === 'user' 
          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
          : 'bg-gray-200 text-gray-600'
      }`}>
        {message.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={`max-w-xs lg:max-w-md group ${
        message.sender === 'user' ? 'text-right' : 'text-left'
      }`}>
        <div className={`px-4 py-3 rounded-lg relative ${
          message.sender === 'user'
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
            : 'bg-white border shadow-sm'
        }`}>
          <p className="whitespace-pre-wrap">{message.text}</p>
          {message.sender === 'ai' && (
            <Button
              onClick={() => onCopy(message.text)}
              variant="ghost"
              size="sm"
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
            >
              <Copy className="w-3 h-3" />
            </Button>
          )}
        </div>
        <p className={`text-xs mt-1 opacity-70 ${
          message.sender === 'user' ? 'text-gray-500' : 'text-gray-400'
        }`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
        <Bot className="w-4 h-4" />
      </div>
      <div className="bg-white border shadow-sm px-4 py-3 rounded-lg">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  )
}

function CareerRoadmapView({ roadmap, user, onGenerate }: { roadmap: any; user: any; onGenerate: () => void }) {
  if (!roadmap) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Generate Your Career Roadmap</h3>
          <p className="text-gray-600 mb-4">
            Get a personalized career roadmap with milestones, skills, and timeline for {user?.selectedCareerField || 'your field'}
          </p>
          <Button onClick={onGenerate} className="bg-gradient-to-r from-blue-600 to-purple-600">
            Create Roadmap
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-2">Your Career Roadmap</h2>
          <p className="text-blue-100">{user?.selectedCareerField} Professional Development Path</p>
        </CardContent>
      </Card>
      
      <div className="grid gap-4">
        {roadmap.milestones?.map((milestone: any, index: number) => (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{milestone.title}</h3>
                  <p className="text-sm text-gray-500">{milestone.timeline}</p>
                </div>
                <Badge variant={milestone.completed ? 'default' : 'secondary'}>
                  {milestone.completed ? 'Completed' : 'In Progress'}
                </Badge>
              </div>
              <p className="text-gray-600 mb-3">{milestone.description}</p>
              {milestone.skills && (
                <div className="flex flex-wrap gap-2">
                  {milestone.skills.map((skill: string, skillIndex: number) => (
                    <Badge key={skillIndex} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function AIInsightsView({ insights, marketData, onGenerate }: { insights: any; marketData: any; onGenerate: () => void }) {
  if (!insights) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Generate AI Insights</h3>
          <p className="text-gray-600 mb-4">
            Get personalized career insights and market analysis based on your conversations
          </p>
          <Button onClick={onGenerate} className="bg-gradient-to-r from-purple-600 to-pink-600">
            Generate Insights
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="font-semibold text-green-900">Market Trends</h3>
            </div>
            <p className="text-sm text-green-700">
              {marketData?.trend || "AI and automation are creating new opportunities in your field"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-semibold text-blue-900">Skill Recommendations</h3>
            </div>
            <p className="text-sm text-blue-700">
              {insights?.skillRecommendation || "Focus on developing AI/ML skills and data analysis capabilities"}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Conversation Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{insights?.questionsAsked || 12}</div>
              <div className="text-sm text-gray-500">Questions Asked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{insights?.topicsExplored || 8}</div>
              <div className="text-sm text-gray-500">Topics Explored</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{insights?.actionItems || 5}</div>
              <div className="text-sm text-gray-500">Action Items</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}