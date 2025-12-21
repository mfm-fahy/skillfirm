"use client"

import { useState, useEffect, useCallback } from "react"
import { Navbar } from "@/components/navbar"
import { ExternalLink, Clock, RefreshCw, Search, Bookmark, BookmarkCheck, Filter, TrendingUp, Globe, Briefcase, Share2, Eye, ThumbsUp, MessageCircle, Bell, Settings, Rss, Star, Calendar, ArrowUp, Zap, Brain, Target, Newspaper, Users, BarChart3, Lightbulb, AlertCircle, CheckCircle2, Flame, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { useNewsSocket } from "@/hooks/use-socket"
import API_BASE_URL from "@/lib/api"

interface NewsArticle {
  id: string
  title: string
  description: string
  url: string
  urlToImage: string
  publishedAt: string
  source: string
  author: string
  category?: string
  readTime?: string
  isBookmarked?: boolean
  views?: number
  likes?: number
  comments?: number
  readProgress?: number
  sentiment?: 'positive' | 'neutral' | 'negative'
  tags?: string[]
  priority?: 'high' | 'medium' | 'low'
  aiSummary?: string
  relevanceScore?: number
  trending?: boolean
  careerImpact?: 'high' | 'medium' | 'low'
  skillsRequired?: string[]
  jobOpportunities?: number
  salaryImpact?: string
  futureRelevance?: number
}

interface NewsPreferences {
  autoRefresh: boolean
  notifications: boolean
  categories: string[]
  sources: string[]
  refreshInterval: number
}

interface ReadingStats {
  articlesRead: number
  timeSpent: number
  favoriteCategory: string
  streak: number
  weeklyGoal: number
  monthlyProgress: number
  knowledgeScore: number
  trendsFollowed: string[]
  expertiseAreas: string[]
  careerGrowthPoints: number
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsArticle[]>([])
  const [filteredNews, setFilteredNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [regenerating, setRegenerating] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [bookmarkedArticles, setBookmarkedArticles] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("trending")
  const [preferences, setPreferences] = useState<NewsPreferences>({
    autoRefresh: false,
    notifications: true,
    categories: [],
    sources: [],
    refreshInterval: 300000
  })
  const [readingStats, setReadingStats] = useState<ReadingStats>({
    articlesRead: 0,
    timeSpent: 0,
    favoriteCategory: '',
    streak: 0,
    weeklyGoal: 10,
    monthlyProgress: 0,
    knowledgeScore: 0,
    trendsFollowed: [],
    expertiseAreas: [],
    careerGrowthPoints: 0
  })
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'date' | 'relevance' | 'popularity'>('date')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [aiInsights, setAiInsights] = useState<any>(null)
  const [personalizedFeed, setPersonalizedFeed] = useState<NewsArticle[]>([])
  const [trendingTopics, setTrendingTopics] = useState<string[]>([])
  const [readingHistory, setReadingHistory] = useState<string[]>([])
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false)
  const [smartFilters, setSmartFilters] = useState({
    sentiment: 'all',
    careerImpact: 'all',
    readingTime: 'all',
    trending: false,
    aiRecommended: false
  })

  // Socket integration for real-time updates
  const { newsUpdates, sendNewsUpdate, isConnected } = useNewsSocket()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    const savedBookmarks = localStorage.getItem('bookmarkedArticles')
    const savedPreferences = localStorage.getItem('newsPreferences')
    const savedStats = localStorage.getItem('readingStats')
    
    if (token && userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      
      if (savedBookmarks) {
        setBookmarkedArticles(JSON.parse(savedBookmarks))
      }
      
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences))
      }
      
      if (savedStats) {
        setReadingStats(JSON.parse(savedStats))
      }
      
      generateNews(parsedUser.selectedCareerField || 'Technology')
    }
    
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (preferences.autoRefresh && user) {
      const interval = setInterval(() => {
        generateNews(user.selectedCareerField || 'Technology', undefined, true)
      }, preferences.refreshInterval)
      
      return () => clearInterval(interval)
    }
  }, [preferences.autoRefresh, preferences.refreshInterval, user])

  const filterNews = useCallback(() => {
    let filtered = news
    
    if (searchQuery) {
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory)
    }
    
    if (selectedSources.length > 0) {
      filtered = filtered.filter(article => selectedSources.includes(article.source))
    }
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        case 'popularity':
          return (b.views || 0) - (a.views || 0)
        case 'relevance':
          const aScore = (a.priority === 'high' ? 3 : a.priority === 'medium' ? 2 : 1)
          const bScore = (b.priority === 'high' ? 3 : b.priority === 'medium' ? 2 : 1)
          return bScore - aScore
        default:
          return 0
      }
    })
    
    setFilteredNews(filtered)
  }, [news, searchQuery, selectedCategory, selectedSources, sortBy])

  useEffect(() => {
    filterNews()
  }, [filterNews])

  const generateNews = async (field: string, category?: string, silent = false) => {
    if (!silent) setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/generate-news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          field, 
          category,
          preferences: {
            sources: selectedSources,
            categories: preferences.categories
          },
          enhancedAnalysis: true
        })
      })
      const data = await response.json()
      let newsData = data.news || []
      
      // If no news found for the specific field, fetch job-related news as fallback
      if (newsData.length === 0) {
        const fallbackResponse = await fetch(`${API_BASE_URL}/api/ai/generate-news`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            field: 'jobs careers employment', 
            category,
            preferences: {
              sources: selectedSources,
              categories: preferences.categories
            },
            enhancedAnalysis: true
          })
        })
        const fallbackData = await fallbackResponse.json()
        newsData = fallbackData.news || []
      }
      
      const enhancedNews = newsData.map((article: NewsArticle, index: number) => ({
        ...article,
        id: article.url || `article-${index}`,
        category: categorizeArticle(article.title, article.description),
        readTime: estimateReadTime(article.description),
        isBookmarked: bookmarkedArticles.includes(article.url),
        views: Math.floor(Math.random() * 10000) + 100,
        likes: Math.floor(Math.random() * 500) + 10,
        comments: Math.floor(Math.random() * 100) + 5,
        sentiment: analyzeSentiment(article.title, article.description),
        tags: generateTags(article.title, article.description),
        priority: determinePriority(article.title, article.description),
        aiSummary: generateAISummary(article.title, article.description),
        relevanceScore: calculateRelevanceScore(article.title, article.description, field),
        trending: Math.random() > 0.7,
        careerImpact: determineCareerImpact(article.title, article.description),
        skillsRequired: extractSkills(article.title, article.description),
        jobOpportunities: Math.floor(Math.random() * 1000) + 50,
        salaryImpact: generateSalaryImpact(),
        futureRelevance: Math.floor(Math.random() * 100) + 1
      }))
      setNews(enhancedNews)
      
      if (!silent && enhancedNews.length > 0) {
        toast({
          title: "News Updated",
          description: `Found ${enhancedNews.length} articles${newsData !== data.news ? ' (showing job-related news)' : ` for ${field}`}`,
        })
      }
    } catch (error) {
      console.error('Failed to generate news:', error)
      setNews([])
      toast({
        title: "Error",
        description: "Failed to load news. Please try again.",
        variant: "destructive"
      })
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const categorizeArticle = (title: string, description: string): string => {
    const text = `${title} ${description}`.toLowerCase()
    if (text.includes('job') || text.includes('career') || text.includes('hiring')) return 'Jobs'
    if (text.includes('skill') || text.includes('learn') || text.includes('course')) return 'Skills'
    if (text.includes('trend') || text.includes('future') || text.includes('innovation')) return 'Trends'
    if (text.includes('salary') || text.includes('market') || text.includes('industry')) return 'Market'
    return 'General'
  }

  const estimateReadTime = (text: string): string => {
    const words = text?.split(' ').length || 0
    const minutes = Math.ceil(words / 200)
    return `${minutes} min read`
  }

  const analyzeSentiment = (title: string, description: string): 'positive' | 'neutral' | 'negative' => {
    const text = `${title} ${description}`.toLowerCase()
    const positiveWords = ['growth', 'opportunity', 'success', 'increase', 'boost', 'improve', 'advance']
    const negativeWords = ['decline', 'loss', 'decrease', 'crisis', 'problem', 'issue', 'concern']
    
    const positiveCount = positiveWords.filter(word => text.includes(word)).length
    const negativeCount = negativeWords.filter(word => text.includes(word)).length
    
    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  const generateTags = (title: string, description: string): string[] => {
    const text = `${title} ${description}`.toLowerCase()
    const tags: string[] = []
    
    if (text.includes('ai') || text.includes('artificial intelligence')) tags.push('AI')
    if (text.includes('remote') || text.includes('work from home')) tags.push('Remote Work')
    if (text.includes('startup')) tags.push('Startup')
    if (text.includes('tech') || text.includes('technology')) tags.push('Technology')
    if (text.includes('finance') || text.includes('fintech')) tags.push('Finance')
    if (text.includes('health') || text.includes('medical')) tags.push('Healthcare')
    
    return tags.slice(0, 3)
  }

  const generateAISummary = (title: string, description: string): string => {
    const text = `${title} ${description}`.toLowerCase()
    if (text.includes('ai') || text.includes('automation')) {
      return "AI and automation trends are reshaping job markets and skill requirements."
    }
    if (text.includes('remote') || text.includes('hybrid')) {
      return "Remote work continues to influence career opportunities and workplace dynamics."
    }
    if (text.includes('skill') || text.includes('training')) {
      return "Continuous learning and skill development remain crucial for career advancement."
    }
    return "Stay informed about industry developments that could impact your career trajectory."
  }

  const calculateRelevanceScore = (title: string, description: string, field: string): number => {
    const text = `${title} ${description}`.toLowerCase()
    const fieldLower = field.toLowerCase()
    let score = 50
    
    if (text.includes(fieldLower)) score += 30
    if (text.includes('career') || text.includes('job')) score += 20
    if (text.includes('skill') || text.includes('training')) score += 15
    if (text.includes('salary') || text.includes('growth')) score += 10
    
    return Math.min(score, 100)
  }

  const determineCareerImpact = (title: string, description: string): 'high' | 'medium' | 'low' => {
    const text = `${title} ${description}`.toLowerCase()
    const highImpactWords = ['breakthrough', 'revolution', 'major shift', 'industry change', 'new standard']
    const mediumImpactWords = ['trend', 'growth', 'opportunity', 'development', 'advancement']
    
    if (highImpactWords.some(word => text.includes(word))) return 'high'
    if (mediumImpactWords.some(word => text.includes(word))) return 'medium'
    return 'low'
  }

  const determinePriority = (title: string, description: string): 'high' | 'medium' | 'low' => {
    const text = `${title} ${description}`.toLowerCase()
    const highPriorityWords = ['urgent', 'breaking', 'critical', 'major', 'important', 'alert']
    const mediumPriorityWords = ['update', 'news', 'report', 'analysis', 'trend']
    
    if (highPriorityWords.some(word => text.includes(word))) return 'high'
    if (mediumPriorityWords.some(word => text.includes(word))) return 'medium'
    return 'low'
  }

  const extractSkills = (title: string, description: string): string[] => {
    const text = `${title} ${description}`.toLowerCase()
    const skills: string[] = []
    
    const skillKeywords = {
      'python': 'Python',
      'javascript': 'JavaScript',
      'react': 'React',
      'ai': 'Artificial Intelligence',
      'machine learning': 'Machine Learning',
      'data analysis': 'Data Analysis',
      'cloud': 'Cloud Computing',
      'cybersecurity': 'Cybersecurity',
      'blockchain': 'Blockchain',
      'ux': 'UX Design',
      'project management': 'Project Management',
      'digital marketing': 'Digital Marketing'
    }
    
    Object.entries(skillKeywords).forEach(([keyword, skill]) => {
      if (text.includes(keyword)) skills.push(skill)
    })
    
    return skills.slice(0, 3)
  }

  const generateSalaryImpact = (): string => {
    const impacts = ['+5-10%', '+10-15%', '+15-20%', '+3-8%', 'Stable', '+20-30%']
    return impacts[Math.floor(Math.random() * impacts.length)]
  }

  const toggleBookmark = (articleUrl: string) => {
    const newBookmarks = bookmarkedArticles.includes(articleUrl)
      ? bookmarkedArticles.filter(url => url !== articleUrl)
      : [...bookmarkedArticles, articleUrl]
    
    setBookmarkedArticles(newBookmarks)
    localStorage.setItem('bookmarkedArticles', JSON.stringify(newBookmarks))
    
    setNews(news.map(article => 
      article.url === articleUrl 
        ? { ...article, isBookmarked: !article.isBookmarked }
        : article
    ))
    
    toast({
      title: newBookmarks.includes(articleUrl) ? "Bookmarked" : "Removed from bookmarks",
      description: "Article saved to your reading list",
    })
  }

  const likeArticle = (articleId: string) => {
    setNews(news.map(article => 
      article.id === articleId 
        ? { ...article, likes: (article.likes || 0) + 1 }
        : article
    ))
    
    setReadingStats(prev => ({
      ...prev,
      articlesRead: prev.articlesRead + 1
    }))
  }

  const shareArticle = async (article: NewsArticle) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description,
          url: article.url
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(article.url)
      toast({
        title: "Link copied",
        description: "Article link copied to clipboard",
      })
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const regenerateNews = () => {
    setRegenerating(true)
    generateNews(user?.selectedCareerField || 'Technology')
      .finally(() => setRegenerating(false))
  }

  const generateAIInsights = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/generate-news-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          field: user?.selectedCareerField,
          articles: news.slice(0, 10),
          readingHistory
        })
      })
      const data = await response.json()
      setAiInsights(data.insights)
    } catch (error) {
      console.error('Failed to generate AI insights:', error)
    }
  }

  const generatePersonalizedFeed = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/personalized-news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          field: user?.selectedCareerField,
          readingHistory,
          preferences: {
            categories: preferences.categories,
            sources: selectedSources
          }
        })
      })
      const data = await response.json()
      setPersonalizedFeed(data.articles || [])
    } catch (error) {
      console.error('Failed to generate personalized feed:', error)
    }
  }

  const trackReadingActivity = (articleUrl: string) => {
    const newHistory = [articleUrl, ...readingHistory.filter(url => url !== articleUrl)].slice(0, 50)
    setReadingHistory(newHistory)
    localStorage.setItem('newsReadingHistory', JSON.stringify(newHistory))
    
    // Update reading stats
    setReadingStats(prev => ({
      ...prev,
      articlesRead: prev.articlesRead + 1,
      timeSpent: prev.timeSpent + (Math.random() * 5 + 2) // Simulate reading time
    }))
  }

  const subscribeToNewsletter = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: user?.email,
          field: user?.selectedCareerField,
          preferences
        })
      })
      setNewsletterSubscribed(true)
      toast({
        title: "Subscribed!",
        description: "You'll receive personalized news updates via email.",
      })
    } catch (error) {
      console.error('Newsletter subscription failed:', error)
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen md:pt-0 pb-20 md:pb-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with Stats */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Industry News Hub
              </h1>
              <p className="text-gray-600">
                {user?.selectedCareerField 
                  ? `Latest news and trends in ${user.selectedCareerField}` 
                  : "Stay updated with the latest industry trends"
                }
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {readingStats.articlesRead} articles read
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  {readingStats.streak} day streak
                </span>
                <span className={`flex items-center gap-1 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-600' : 'bg-red-600'}`}></div>
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={regenerateNews}
                disabled={regenerating}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
                {regenerating ? 'Loading...' : 'Refresh'}
              </Button>
              {isConnected && (
                <Button
                  onClick={() => sendNewsUpdate({
                    title: "Test Real-time Update",
                    description: "This is a test article sent via socket for real-time demonstration.",
                    url: "https://example.com/test-article",
                    source: "Real-time Test",
                    publishedAt: new Date().toISOString()
                  })}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Test Live Update
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Enhanced Search and Filter Bar */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search news articles, tags, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Jobs">Jobs & Careers</SelectItem>
                    <SelectItem value="Skills">Skills & Learning</SelectItem>
                    <SelectItem value="Trends">Trends & Innovation</SelectItem>
                    <SelectItem value="Market">Market & Industry</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(value: 'date' | 'relevance' | 'popularity') => setSortBy(value)}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Latest</SelectItem>
                    <SelectItem value="popularity">Most Popular</SelectItem>
                    <SelectItem value="relevance">Most Relevant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Preferences Toggle */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-refresh"
                      checked={preferences.autoRefresh}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({ ...prev, autoRefresh: checked }))
                      }
                    />
                    <Label htmlFor="auto-refresh" className="text-sm">Auto-refresh</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="notifications"
                      checked={preferences.notifications}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({ ...prev, notifications: checked }))
                      }
                    />
                    <Label htmlFor="notifications" className="text-sm">Notifications</Label>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {filteredNews.length} articles found
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights Card */}
          {aiInsights && (
            <Card className="mb-6 bg-gradient-to-r from-purple-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="w-6 h-6" />
                  <h3 className="text-xl font-semibold">AI Career Insights</h3>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-purple-100">Market Trend</p>
                    <p className="font-semibold">{aiInsights.marketTrend}</p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-100">Opportunity Score</p>
                    <p className="font-semibold">{aiInsights.opportunityScore}/100</p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-100">Recommended Action</p>
                    <p className="font-semibold">{aiInsights.recommendedAction}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced News Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="w-full flex flex-wrap gap-2 h-auto p-2 bg-transparent">
              <TabsTrigger value="trending" className="flex items-center gap-1 text-xs px-3 py-2">
                <TrendingUp className="w-3 h-3" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="personalized" className="flex items-center gap-1 text-xs px-3 py-2">
                <Sparkles className="w-3 h-3" />
                For You
              </TabsTrigger>
              <TabsTrigger value="bookmarks" className="flex items-center gap-1 text-xs px-3 py-2">
                <Bookmark className="w-3 h-3" />
                Saved
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-1 text-xs px-3 py-2">
                <Globe className="w-3 h-3" />
                Topics
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1 text-xs px-3 py-2">
                <Calendar className="w-3 h-3" />
                Stats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trending" className="mt-6">
              <NewsGrid 
                articles={filteredNews} 
                loading={loading} 
                onBookmark={toggleBookmark}
                onLike={likeArticle}
                onShare={shareArticle}
                onRead={trackReadingActivity}
                showBookmarked={false}
              />
            </TabsContent>

            <TabsContent value="personalized" className="mt-6">
              {personalizedFeed.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Generate your personalized news feed</p>
                    <Button onClick={generatePersonalizedFeed} className="bg-gradient-to-r from-purple-600 to-blue-600">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create AI Feed
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <NewsGrid 
                  articles={personalizedFeed} 
                  loading={false} 
                  onBookmark={toggleBookmark}
                  onLike={likeArticle}
                  onShare={shareArticle}
                  onRead={trackReadingActivity}
                  showBookmarked={false}
                />
              )}
            </TabsContent>

            <TabsContent value="bookmarks" className="mt-6">
              <NewsGrid 
                articles={news.filter(article => article.isBookmarked)} 
                loading={false} 
                onBookmark={toggleBookmark}
                onLike={likeArticle}
                onShare={shareArticle}
                showBookmarked={true}
              />
            </TabsContent>

            <TabsContent value="categories" className="mt-6">
              <CategoryView articles={filteredNews} onBookmark={toggleBookmark} onLike={likeArticle} onShare={shareArticle} />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <ReadingAnalytics stats={readingStats} articles={news} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <Button
            onClick={scrollToTop}
            className="fixed bottom-24 right-6 rounded-full w-12 h-12 shadow-lg bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
        )}
      </main>
    </>
  )
}

function NewsGrid({ articles, loading, onBookmark, onLike, onShare, onRead, showBookmarked }: {
  articles: NewsArticle[]
  loading: boolean
  onBookmark: (url: string) => void
  onLike: (id: string) => void
  onShare: (article: NewsArticle) => void
  onRead?: (articleUrl: string) => void
  showBookmarked: boolean
}) {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="bg-white rounded-lg border overflow-hidden">
            <div className="animate-pulse">
              <div className="bg-gray-300 h-48 w-full"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          {showBookmarked ? (
            <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          ) : (
            <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          )}
        </div>
        <p className="text-gray-600 mb-4">
          {showBookmarked ? "No bookmarked articles yet." : "No news found for your search."}
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {articles.map((article, index) => (
        <EnhancedNewsCard 
          key={index} 
          article={article} 
          onBookmark={onBookmark}
          onLike={onLike}
          onShare={onShare}
        />
      ))}
    </div>
  )
}

function EnhancedNewsCard({ article, onBookmark, onLike, onShare }: { 
  article: NewsArticle
  onBookmark: (url: string) => void
  onLike: (id: string) => void
  onShare: (article: NewsArticle) => void
}) {
  const openArticle = () => {
    window.open(article.url, '_blank')
  }

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation()
    onBookmark(article.url)
  }

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    onLike(article.id)
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    onShare(article)
  }

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100'
      case 'negative': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500'
      case 'medium': return 'border-l-yellow-500'
      default: return 'border-l-green-500'
    }
  }

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group border-l-4 ${getPriorityColor(article.priority)}`}>
      <div onClick={openArticle}>
        {article.urlToImage && (
          <div className="relative">
            <img 
              src={article.urlToImage} 
              alt={article.title}
              className="w-full h-48 object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <div className="absolute top-2 left-2 flex gap-2">
              {article.category && (
                <Badge className="bg-blue-600 text-white">
                  {article.category}
                </Badge>
              )}
              {article.sentiment && (
                <Badge className={getSentimentColor(article.sentiment)}>
                  {article.sentiment}
                </Badge>
              )}
            </div>
            {article.readProgress && (
              <Progress value={article.readProgress} className="absolute bottom-0 left-0 right-0 h-1" />
            )}
          </div>
        )}
        
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-blue-600 group-hover:text-blue-600 transition-colors">
              {article.title}
            </h3>
          </div>
          
          {article.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-3">
              {article.description}
            </p>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {article.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">{article.source}</span>
              {article.readTime && (
                <span className="text-gray-400">• {article.readTime}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Engagement Stats */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors"
              >
                <ThumbsUp className="w-4 h-4" />
                <span className="text-xs">{article.likes}</span>
              </button>
              <div className="flex items-center gap-1 text-gray-500">
                <Eye className="w-4 h-4" />
                <span className="text-xs">{article.views}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">{article.comments}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Share2 className="w-4 h-4 text-gray-400 hover:text-blue-600" />
              </button>
              <button
                onClick={handleBookmark}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                {article.isBookmarked ? (
                  <BookmarkCheck className="w-4 h-4 text-blue-600" />
                ) : (
                  <Bookmark className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                )}
              </button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}

function CategoryView({ articles, onBookmark, onLike, onShare }: {
  articles: NewsArticle[]
  onBookmark: (url: string) => void
  onLike: (id: string) => void
  onShare: (article: NewsArticle) => void
}) {
  const categories = ['Jobs', 'Skills', 'Trends', 'Market', 'General']
  
  return (
    <div className="space-y-8">
      {categories.map(category => {
        const categoryArticles = articles.filter(article => article.category === category)
        if (categoryArticles.length === 0) return null
        
        return (
          <div key={category}>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              {category}
              <Badge variant="secondary">{categoryArticles.length}</Badge>
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categoryArticles.slice(0, 6).map((article, index) => (
                <EnhancedNewsCard 
                  key={index} 
                  article={article} 
                  onBookmark={onBookmark}
                  onLike={onLike}
                  onShare={onShare}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ReadingAnalytics({ stats, articles }: {
  stats: ReadingStats
  articles: NewsArticle[]
}) {
  const categoryStats = articles.reduce((acc, article) => {
    const category = article.category || 'General'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Reading Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Articles Read</span>
            <span className="font-semibold">{stats.articlesRead}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Reading Streak</span>
            <span className="font-semibold">{stats.streak} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Time Spent</span>
            <span className="font-semibold">{Math.round(stats.timeSpent / 60)} min</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Category Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(categoryStats).map(([category, count]) => (
            <div key={category} className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{category}</span>
              <div className="flex items-center gap-2">
                <Progress value={(count / articles.length) * 100} className="w-16 h-2" />
                <span className="text-sm font-medium">{count}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600">Today: {articles.filter(a => new Date(a.publishedAt).toDateString() === new Date().toDateString()).length} articles</p>
            <p className="text-gray-600">This week: {articles.length} articles</p>
            <p className="text-gray-600">Bookmarked: {articles.filter(a => a.isBookmarked).length} articles</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}