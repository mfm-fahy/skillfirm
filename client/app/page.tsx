"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, Play, TrendingUp, Target, CheckCircle, Clock, Sparkles, ArrowRight, BookOpen, Newspaper, ListChecks, Users, MessageSquare, Award, Calendar, Star, Zap, Trophy, Activity, Brain, Lightbulb } from "lucide-react"
import API_BASE_URL from "@/lib/api"

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [suggestedCourse, setSuggestedCourse] = useState<any>(null)
  const [courseLoading, setCourseLoading] = useState(false)
  const [suggestedNews, setSuggestedNews] = useState<any[]>([])
  const [newsLoading, setNewsLoading] = useState(false)
  const [taskStats, setTaskStats] = useState({ completed: 0, total: 0, percentage: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [overallProgress, setOverallProgress] = useState({ overall: 0, activeDays: 0, averageCompletion: 0 })
  const [progressLoading, setProgressLoading] = useState(true)
  const [fieldUpdates, setFieldUpdates] = useState({ updates: [], latestNews: [] })
  const [updatesLoading, setUpdatesLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [weeklyGoal, setWeeklyGoal] = useState({ current: 0, target: 5 })
  const [learningStreak, setLearningStreak] = useState(0)
  const [personalizedTips, setPersonalizedTips] = useState<any[]>([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      setLoading(false)
      return
    }
    
    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      if (parsedUser.selectedCareerField) {
        getSuggestedCourse(parsedUser.selectedCareerField)
        getSuggestedNews(parsedUser.selectedCareerField)
        getFieldUpdates(parsedUser.selectedCareerField)
        getPersonalizedTips(parsedUser.selectedCareerField)
      } else {
        getPersonalizedTips('General')
      }
      getTaskStats()
      getOverallProgress()
      // Load data that depends on other data after a brief delay
      setTimeout(() => {
        getLearningStreak()
        getWeeklyGoal()
        getAchievements()
        getRecentActivity()
      }, 100)
    } catch (error) {
      console.error('Error parsing user data:', error)
    }
    
    setLoading(false)
  }, [router])

  const getFieldUpdates = async (field: string) => {
    setUpdatesLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/generate-field-updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field })
      })
      if (response.ok) {
        const data = await response.json()
        setFieldUpdates(data)
      }
    } catch (error) {
      console.error('Failed to get field updates:', error)
      setFieldUpdates({ updates: [], latestNews: [] })
    } finally {
      setUpdatesLoading(false)
    }
  }

  const getSuggestedNews = async (field: string) => {
    setNewsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/generate-news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field })
      })
      if (response.ok) {
        const data = await response.json()
        setSuggestedNews(data.news?.slice(0, 3) || [])
      }
    } catch (error) {
      console.error('Failed to get news suggestions:', error)
      setSuggestedNews([])
    } finally {
      setNewsLoading(false)
    }
  }

  const getOverallProgress = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setProgressLoading(false)
      return
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/progress`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setOverallProgress(data)
      } else {
        const savedTasks = JSON.parse(localStorage.getItem('dailyTasks') || '[]')
        const completedTasks = savedTasks.filter((task: any) => task.completed)
        setOverallProgress({
          overall: savedTasks.length > 0 ? Math.round((completedTasks.length / savedTasks.length) * 100) : 0,
          activeDays: Math.min(completedTasks.length, 7),
          averageCompletion: savedTasks.length > 0 ? Math.round((completedTasks.length / savedTasks.length) * 100) : 0
        })
      }
    } catch (error) {
      console.error('Failed to get overall progress:', error)
      const savedTasks = JSON.parse(localStorage.getItem('dailyTasks') || '[]')
      const completedTasks = savedTasks.filter((task: any) => task.completed)
      setOverallProgress({
        overall: savedTasks.length > 0 ? Math.round((completedTasks.length / savedTasks.length) * 100) : 0,
        activeDays: Math.min(completedTasks.length, 7),
        averageCompletion: savedTasks.length > 0 ? Math.round((completedTasks.length / savedTasks.length) * 100) : 0
      })
    } finally {
      setProgressLoading(false)
    }
  }

  const getTaskStats = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setStatsLoading(false)
      return
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        const completedTasks = data.filter((task: any) => task.completed)
        setTaskStats({
          completed: completedTasks.length,
          total: data.length,
          percentage: data.length > 0 ? Math.round((completedTasks.length / data.length) * 100) : 0
        })
      }
    } catch (error) {
      console.error('Failed to get task stats:', error)
      setTaskStats({ completed: 0, total: 0, percentage: 0 })
    } finally {
      setStatsLoading(false)
    }
  }

  const getRecentActivity = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/activity`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setRecentActivity(data.slice(0, 4))
      } else {
        setRecentActivity([
          { type: 'welcome', title: 'Welcome to SkillFarm!', time: 'Just now', icon: Sparkles, color: 'text-blue-500' },
          { type: 'setup', title: 'Profile setup completed', time: '1 hour ago', icon: CheckCircle, color: 'text-green-500' }
        ])
      }
    } catch (error) {
      console.error('Failed to get recent activity:', error)
      setRecentActivity([
        { type: 'welcome', title: 'Welcome to SkillFarm!', time: 'Just now', icon: Sparkles, color: 'text-blue-500' }
      ])
    }
  }

  const getAchievements = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/achievements`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setAchievements(data)
      } else {
        setAchievements([
          { name: 'Welcome', description: 'Joined SkillFarm', icon: '🎉', earned: true },
          { name: 'First Steps', description: 'Complete profile setup', icon: '👋', earned: true }
        ])
      }
    } catch (error) {
      console.error('Failed to get achievements:', error)
      setAchievements([])
    }
  }

  const getWeeklyGoal = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/weekly-goal`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setWeeklyGoal(data)
      } else {
        setWeeklyGoal({ current: 0, target: 5 })
      }
    } catch (error) {
      console.error('Failed to get weekly goal:', error)
      setWeeklyGoal({ current: 0, target: 5 })
    }
  }

  const getLearningStreak = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/learning-streak`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setLearningStreak(data.streak)
      } else {
        setLearningStreak(0)
      }
    } catch (error) {
      console.error('Failed to get learning streak:', error)
      setLearningStreak(0)
    }
  }

  const getPersonalizedTips = (field: string) => {
    const fieldTips = {
      'Software Development': [
        { title: 'Practice Daily Coding', description: 'Spend 30 minutes daily on coding challenges', icon: Brain },
        { title: 'Build a Portfolio Project', description: 'Start a project showcasing your skills', icon: Lightbulb },
        { title: 'Contribute to Open Source', description: 'Make your first GitHub contribution', icon: Users }
      ],
      'Data Science': [
        { title: 'Practice with Real Data', description: 'Work on Kaggle competitions', icon: Brain },
        { title: 'Learn New Libraries', description: 'Explore pandas, scikit-learn, or TensorFlow', icon: Lightbulb },
        { title: 'Share Your Analysis', description: 'Write about your data insights', icon: Users }
      ],
      'Digital Marketing': [
        { title: 'Analyze Campaign Data', description: 'Study successful marketing campaigns', icon: Brain },
        { title: 'Create Content', description: 'Start a blog or social media presence', icon: Lightbulb },
        { title: 'Network with Marketers', description: 'Join marketing communities online', icon: Users }
      ]
    }
    
    const tips = fieldTips[field as keyof typeof fieldTips] || [
      { title: 'Set Learning Goals', description: 'Define clear objectives for your career', icon: Brain },
      { title: 'Practice Regularly', description: 'Dedicate time daily to skill development', icon: Lightbulb },
      { title: 'Connect with Peers', description: 'Build your professional network', icon: Users }
    ]
    
    setPersonalizedTips(tips)
  }

  const getSuggestedCourse = async (field: string) => {
    setCourseLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/suggest-course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field })
      })
      if (response.ok) {
        const data = await response.json()
        setSuggestedCourse(data.course)
      }
    } catch (error) {
      console.error('Failed to get course suggestion:', error)
      setSuggestedCourse(null)
    } finally {
      setCourseLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar />
        <main className="pt-8 pb-20 md:pb-8">
          {/* Hero Section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Sparkles className="w-8 h-8 text-purple-600" />
                <span className="text-lg font-semibold text-purple-600">AI-Powered Career Platform</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  Shape Your
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Future Career
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Discover your potential with AI-powered career guidance, personalized learning paths, 
                and expert insights tailored just for you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => router.push('/signup')}
                  className="h-14 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 text-lg"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/login')}
                  className="h-14 px-8 border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 font-semibold rounded-xl transition-all duration-300 text-lg"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Everything You Need to Succeed
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Comprehensive tools and resources to guide your career journey
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: MessageSquare, title: "AI Career Coach", description: "Get personalized career advice from our advanced AI coach", color: "from-blue-500 to-cyan-500" },
                { icon: BookOpen, title: "Curated Courses", description: "Access hand-picked courses tailored to your career goals", color: "from-purple-500 to-pink-500" },
                { icon: ListChecks, title: "Daily Tasks", description: "Stay on track with personalized daily learning tasks", color: "from-green-500 to-emerald-500" },
                { icon: TrendingUp, title: "Progress Tracking", description: "Monitor your growth and celebrate achievements", color: "from-orange-500 to-red-500" },
                { icon: Users, title: "Community", description: "Connect with like-minded professionals and learners", color: "from-indigo-500 to-purple-500" },
                { icon: Newspaper, title: "Industry News", description: "Stay updated with the latest industry trends and news", color: "from-teal-500 to-blue-500" }
              ].map((feature, index) => (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-800">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />
      <main className="pt-8 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white/20">
                <Image
                  src={user.avatar || "/placeholder.svg?height=64&width=64"}
                  alt={user.name}
                  width={64}
                  height={64}
                  className="object-cover"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
                <p className="text-blue-100">
                  {user.selectedCareerField ? `Advancing in ${user.selectedCareerField}` : "Ready to continue your journey?"}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid gap-6 md:grid-cols-4 mb-8">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-orange-600">
                    {learningStreak}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Learning Streak</h3>
                <p className="text-sm text-gray-600">Days in a row</p>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => router.push('/daily-tasks')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {taskStats.completed}/{taskStats.total}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Daily Tasks</h3>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300" style={{ width: `${taskStats.percentage}%` }} />
                </div>
                <p className="text-sm text-gray-600">{taskStats.percentage}% Complete</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => router.push('/profile')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {overallProgress.overall}%
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Weekly Progress</h3>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300" style={{ width: `${overallProgress.overall}%` }} />
                </div>
                <p className="text-sm text-gray-600">{overallProgress.activeDays} active days</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-yellow-600">
                    {weeklyGoal.current}/{weeklyGoal.target}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Weekly Goal</h3>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-300" style={{ width: `${(weeklyGoal.current / weeklyGoal.target) * 100}%` }} />
                </div>
                <p className="text-sm text-gray-600">{Math.round((weeklyGoal.current / weeklyGoal.target) * 100)}% Complete</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {/* Left Column - Recent Activity & Tips */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Activity */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center`}>
                          <activity.icon className={`w-5 h-5 ${activity.color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{activity.title}</p>
                          <p className="text-sm text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Personalized Tips */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-600" />
                    Personalized Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {personalizedTips.map((tip, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                          <tip.icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-1">{tip.title}</h4>
                          <p className="text-sm text-gray-600">{tip.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Achievements & Quick Actions */}
            <div className="space-y-6">
              {/* Achievements */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {achievements.slice(0, 4).map((achievement, index) => (
                      <div key={index} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${achievement.earned ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'bg-gray-50 opacity-60'}`}>
                        <div className="text-2xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <p className={`font-medium ${achievement.earned ? 'text-gray-800' : 'text-gray-500'}`}>
                            {achievement.name}
                          </p>
                          <p className={`text-xs ${achievement.earned ? 'text-gray-600' : 'text-gray-400'}`}>
                            {achievement.description}
                          </p>
                        </div>
                        {achievement.earned && <CheckCircle className="w-5 h-5 text-green-500" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* AI Coach Quick Access */}
              <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => router.push('/chat-ai')}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <Sparkles className="w-6 h-6 text-white/80" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">AI Career Coach</h3>
                  <p className="text-sm text-white/80 mb-4">Get personalized career guidance and insights</p>
                  <Button variant="secondary" className="w-full bg-white/20 hover:bg-white/30 text-white border-0">
                    Start Conversation
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Courses", desc: "Continue learning", href: "/courses", icon: BookOpen, color: "from-purple-500 to-pink-500" },
              { title: "Community", desc: "Connect with peers", href: "/community", icon: Users, color: "from-indigo-500 to-purple-500" },
              { title: "Industry News", desc: "Stay updated", href: "/news", icon: Newspaper, color: "from-teal-500 to-blue-500" }
            ].map((action, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm" onClick={() => router.push(action.href)}>
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1 text-gray-800">{action.title}</h3>
                  <p className="text-gray-600 text-sm">{action.desc}</p>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
