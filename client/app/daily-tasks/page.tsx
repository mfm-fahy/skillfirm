"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { CheckCircle, Circle, RefreshCw, Target, Calendar, Clock, Zap, Trophy, Star, TrendingUp, Brain, Lightbulb, Users, BookOpen, Briefcase, Award, Flame, BarChart3, Settings, Plus, Filter, Search, Eye, ThumbsUp, MessageCircle, Share2, Bookmark, BookmarkCheck, AlertCircle, CheckCircle2, Timer, PlayCircle, PauseCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import API_BASE_URL from "@/lib/api"

interface Task {
  _id?: string
  id?: number
  title: string
  description: string
  completed: boolean
  category: string
  priority?: 'high' | 'medium' | 'low'
  difficulty?: 'easy' | 'medium' | 'hard'
  estimatedTime?: number // in minutes
  actualTime?: number
  dueDate?: string
  tags?: string[]
  skillsGained?: string[]
  careerImpact?: 'high' | 'medium' | 'low'
  isBookmarked?: boolean
  notes?: string
  subtasks?: Array<{
    id: string
    title: string
    completed: boolean
  }>
  streak?: number
  completedAt?: Date
  startedAt?: Date
  aiGenerated?: boolean
  customTask?: boolean
  recurringType?: 'daily' | 'weekly' | 'monthly' | 'none'
  nextDue?: Date
  completionRate?: number
  feedback?: {
    rating: number
    comment: string
  }
}

interface TaskStats {
  totalCompleted: number
  streakDays: number
  weeklyProgress: number
  monthlyGoal: number
  productivityScore: number
  averageCompletionTime: number
  favoriteCategory: string
  skillsLearned: string[]
  careerGrowthPoints: number
  timeSpentLearning: number
  consistencyRating: number
  challengesCompleted: number
}

export default function DailyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [regenerating, setRegenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('today')
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    estimatedTime: 30,
    tags: '',
    dueDate: new Date().toISOString().split('T')[0]
  })
  const [timerActive, setTimerActive] = useState<string | null>(null)
  const [timeSpent, setTimeSpent] = useState<Record<string, number>>({})
  const [showCompleted, setShowCompleted] = useState(true)
  const [aiCoach, setAiCoach] = useState<any>(null)
  const [weeklyChallenge, setWeeklyChallenge] = useState<any>(null)
  const [taskRecommendations, setTaskRecommendations] = useState<Task[]>([])
  const [productivityInsights, setProductivityInsights] = useState<any>(null)
  const [habitTracking, setHabitTracking] = useState<any[]>([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      
      // Always generate tasks for now
      generateNewTasks()
    }
  }, [])

  const loadTodaysTasks = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/today`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (data.tasks.length === 0) {
        await generateNewTasks()
      } else {
        setTasks(data.tasks)
        setLoading(false)
      }
    } catch (error) {
      console.error('Failed to load tasks:', error)
      await generateNewTasks()
    }
  }

  const loadTaskStats = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setTaskStats(data)
    } catch (error) {
      console.error('Failed to load task stats:', error)
    }
  }

  const generateNewTasks = async () => {
    const userData = localStorage.getItem('user')
    if (!userData) return
    
    const user = JSON.parse(userData)
    const field = user.selectedCareerField || 'General Career Development'
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/generate-daily-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          field,
          enhancedTasks: true,
          includeSkills: true,
          difficulty: 'mixed'
        })
      })
      const data = await response.json()
      
      if (data.tasks) {
        const enhancedTasks = data.tasks.map((task: Task, index: number) => ({
          ...task,
          priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
          difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as 'easy' | 'medium' | 'hard',
          estimatedTime: Math.floor(Math.random() * 60) + 15,
          careerImpact: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
          skillsGained: generateSkillsForTask(task.title, task.description),
          tags: generateTagsForTask(task.title, task.description),
          aiGenerated: true,
          recurringType: 'none' as 'daily' | 'weekly' | 'monthly' | 'none'
        }))
        
        await saveTasks(enhancedTasks)
        setTasks(enhancedTasks)
        // Save to localStorage
        localStorage.setItem('dailyTasks', JSON.stringify(enhancedTasks))
      }
    } catch (error) {
      console.error('Failed to generate tasks:', error)
      setTasks(getFallbackTasks(field))
      // Save fallback tasks to localStorage
      localStorage.setItem('dailyTasks', JSON.stringify(getFallbackTasks(field)))
    } finally {
      setLoading(false)
    }
  }

  const generateSkillsForTask = (title: string, description: string): string[] => {
    const text = `${title} ${description}`.toLowerCase()
    const skills: string[] = []
    
    if (text.includes('read') || text.includes('research')) skills.push('Research Skills')
    if (text.includes('network') || text.includes('connect')) skills.push('Networking')
    if (text.includes('practice') || text.includes('skill')) skills.push('Technical Skills')
    if (text.includes('portfolio') || text.includes('project')) skills.push('Portfolio Development')
    if (text.includes('plan') || text.includes('goal')) skills.push('Strategic Planning')
    if (text.includes('learn') || text.includes('course')) skills.push('Continuous Learning')
    
    return skills.slice(0, 2)
  }

  const generateTagsForTask = (title: string, description: string): string[] => {
    const text = `${title} ${description}`.toLowerCase()
    const tags: string[] = []
    
    if (text.includes('daily')) tags.push('daily')
    if (text.includes('skill')) tags.push('skill-building')
    if (text.includes('career')) tags.push('career-growth')
    if (text.includes('network')) tags.push('networking')
    if (text.includes('learn')) tags.push('learning')
    if (text.includes('practice')) tags.push('practice')
    
    return tags.slice(0, 3)
  }

  const saveTasks = async (tasksToSave: Task[]) => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      await fetch(`${API_BASE_URL}/api/tasks/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tasks: tasksToSave })
      })
    } catch (error) {
      console.error('Failed to save tasks:', error)
    }
  }

  const createCustomTask = async () => {
    if (!newTask.title || !newTask.description) return
    
    const customTask: Task = {
      id: Date.now(),
      title: newTask.title,
      description: newTask.description,
      category: newTask.category || 'Custom',
      priority: newTask.priority,
      estimatedTime: newTask.estimatedTime,
      tags: newTask.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      dueDate: newTask.dueDate,
      completed: false,
      customTask: true,
      aiGenerated: false,
      careerImpact: 'medium',
      difficulty: 'medium',
      recurringType: 'none'
    }
    
    const updatedTasks = [...tasks, customTask]
    setTasks(updatedTasks)
    localStorage.setItem('dailyTasks', JSON.stringify(updatedTasks))
    await saveTasks(updatedTasks)
    
    setNewTask({
      title: '',
      description: '',
      category: '',
      priority: 'medium',
      estimatedTime: 30,
      tags: '',
      dueDate: new Date().toISOString().split('T')[0]
    })
    setIsCreateTaskOpen(false)
    
    toast({
      title: "Task Created",
      description: "Your custom task has been added successfully.",
    })
  }

  const getFallbackTasks = (field: string): Task[] => [
    { 
      id: 1, 
      title: `Read industry news about ${field}`, 
      description: "Stay updated with latest trends", 
      completed: false, 
      category: "Learning",
      priority: 'medium',
      difficulty: 'easy',
      estimatedTime: 20,
      careerImpact: 'medium',
      skillsGained: ['Industry Knowledge', 'Research Skills'],
      tags: ['daily', 'learning', 'industry'],
      aiGenerated: true
    },
    { 
      id: 2, 
      title: "Practice a key skill", 
      description: "Spend 30 minutes improving your expertise", 
      completed: false, 
      category: "Skill Development",
      priority: 'high',
      difficulty: 'medium',
      estimatedTime: 30,
      careerImpact: 'high',
      skillsGained: ['Technical Skills', 'Problem Solving'],
      tags: ['skill-building', 'practice'],
      aiGenerated: true
    },
    { 
      id: 3, 
      title: "Network with professionals", 
      description: "Connect with someone in your field", 
      completed: false, 
      category: "Networking",
      priority: 'medium',
      difficulty: 'medium',
      estimatedTime: 25,
      careerImpact: 'high',
      skillsGained: ['Networking', 'Communication'],
      tags: ['networking', 'career-growth'],
      aiGenerated: true
    },
    { 
      id: 4, 
      title: "Update your portfolio", 
      description: "Add recent work or achievements", 
      completed: false, 
      category: "Portfolio",
      priority: 'high',
      difficulty: 'medium',
      estimatedTime: 45,
      careerImpact: 'high',
      skillsGained: ['Portfolio Development', 'Self-Marketing'],
      tags: ['portfolio', 'career-growth'],
      aiGenerated: true
    },
    { 
      id: 5, 
      title: "Plan tomorrow's goals", 
      description: "Set clear objectives for the next day", 
      completed: false, 
      category: "Planning",
      priority: 'low',
      difficulty: 'easy',
      estimatedTime: 15,
      careerImpact: 'medium',
      skillsGained: ['Strategic Planning', 'Goal Setting'],
      tags: ['planning', 'daily'],
      aiGenerated: true
    }
  ]

  const toggleTask = async (taskId: string | number) => {
    const task = tasks.find(t => t._id === taskId || t.id === taskId)
    if (!task) return
    
    const updatedTask = {
      ...task,
      completed: !task.completed,
      completedAt: !task.completed ? new Date() : undefined
    }
    
    // Update UI immediately
    setTasks(prevTasks => prevTasks.map(t => 
      (t._id === taskId || t.id === taskId) ? updatedTask : t
    ))
    
    // Update in database
    const token = localStorage.getItem('token')
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/tasks/${taskId}/toggle`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ completed: !task.completed })
        })
      } catch (error) {
        console.error('Failed to update task:', error)
      }
    }
    
    if (!task.completed) {
      toast({
        title: "Task Completed! 🎉",
        description: `Great job completing "${task.title}"`,
      })
    }
  }

  const toggleBookmark = (taskId: string | number) => {
    setTasks(tasks.map(task => 
      (task._id === taskId || task.id === taskId) 
        ? { ...task, isBookmarked: !task.isBookmarked }
        : task
    ))
  }

  const startTimer = (taskId: string | number) => {
    setTimerActive(taskId.toString())
    const startTime = Date.now()
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000 / 60)
      setTimeSpent(prev => ({ ...prev, [taskId.toString()]: elapsed }))
    }, 60000)
    
    // Store interval ID for cleanup
    ;(window as any)[`timer_${taskId}`] = interval
  }

  const stopTimer = (taskId: string | number) => {
    setTimerActive(null)
    const interval = (window as any)[`timer_${taskId}`]
    if (interval) {
      clearInterval(interval)
      delete (window as any)[`timer_${taskId}`]
    }
  }

  const regenerateTasks = async () => {
    setRegenerating(true)
    await generateNewTasks()
    setRegenerating(false)
  }

  const filteredTasks = tasks.filter(task => {
    if (!showCompleted && task.completed) return false
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterCategory !== 'all' && task.category !== filterCategory) return false
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false
    return true
  })

  const completedCount = tasks.filter(task => task.completed).length
  const progressPercentage = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getDifficultyIcon = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return <Circle className="w-4 h-4 text-green-500" />
      case 'medium': return <Target className="w-4 h-4 text-yellow-500" />
      case 'hard': return <Zap className="w-4 h-4 text-red-500" />
      default: return <Circle className="w-4 h-4 text-gray-500" />
    }
  }

  const getCareerImpactIcon = (impact?: string) => {
    switch (impact) {
      case 'high': return <Trophy className="w-4 h-4 text-gold-500" />
      case 'medium': return <Star className="w-4 h-4 text-blue-500" />
      case 'low': return <Lightbulb className="w-4 h-4 text-gray-500" />
      default: return <Lightbulb className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen md:pt-0 pb-20 md:pb-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Smart Task Manager
              </h1>
              <p className="text-gray-600 mb-2">
                {user?.selectedCareerField 
                  ? `AI-powered tasks for your ${user.selectedCareerField} career` 
                  : "Intelligent daily tasks to accelerate your career growth"
                }
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  {taskStats?.totalCompleted || 0} completed
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="w-4 h-4" />
                  {taskStats?.streakDays || 0} day streak
                </span>
                <span className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  {taskStats?.productivityScore || 0}% productivity
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create Custom Task</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Task title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    />
                    <Textarea
                      placeholder="Task description"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Select value={newTask.category} onValueChange={(value) => setNewTask({ ...newTask, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Learning">Learning</SelectItem>
                          <SelectItem value="Skill Development">Skill Development</SelectItem>
                          <SelectItem value="Networking">Networking</SelectItem>
                          <SelectItem value="Portfolio">Portfolio</SelectItem>
                          <SelectItem value="Planning">Planning</SelectItem>
                          <SelectItem value="Custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={newTask.priority} onValueChange={(value: 'high' | 'medium' | 'low') => setNewTask({ ...newTask, priority: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High Priority</SelectItem>
                          <SelectItem value="medium">Medium Priority</SelectItem>
                          <SelectItem value="low">Low Priority</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      type="number"
                      placeholder="Estimated time (minutes)"
                      value={newTask.estimatedTime}
                      onChange={(e) => setNewTask({ ...newTask, estimatedTime: parseInt(e.target.value) || 30 })}
                    />
                    <Input
                      placeholder="Tags (comma separated)"
                      value={newTask.tags}
                      onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })}
                    />
                    <Button onClick={createCustomTask} className="w-full">
                      Create Task
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                onClick={regenerateTasks}
                disabled={regenerating}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
                {regenerating ? 'Generating...' : 'AI Tasks'}
              </Button>
            </div>
          </div>

          {/* AI Coach Card */}
          {aiCoach && (
            <Card className="mb-6 bg-gradient-to-r from-green-500 to-teal-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="w-6 h-6" />
                  <h3 className="text-xl font-semibold">AI Productivity Coach</h3>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-green-100">Today's Focus</p>
                    <p className="font-semibold">{aiCoach.todaysFocus}</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-100">Productivity Tip</p>
                    <p className="font-semibold">{aiCoach.productivityTip}</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-100">Energy Level</p>
                    <p className="font-semibold">{aiCoach.energyRecommendation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weekly Challenge */}
          {weeklyChallenge && (
            <Card className="mb-6 bg-gradient-to-r from-orange-500 to-red-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-6 h-6" />
                    <h3 className="text-xl font-semibold">Weekly Challenge</h3>
                  </div>
                  <Badge className="bg-white text-orange-600">
                    {weeklyChallenge.daysLeft} days left
                  </Badge>
                </div>
                <p className="text-orange-100 mb-3">{weeklyChallenge.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-100">Progress</p>
                    <p className="font-semibold">{weeklyChallenge.progress}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-orange-100">Reward</p>
                    <p className="font-semibold">{weeklyChallenge.reward}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Progress Card */}
          <Card className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Today's Progress</h2>
                  <p className="text-blue-100">Keep up the momentum!</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{completedCount}/{tasks.length}</div>
                  <div className="text-sm text-blue-100">tasks completed</div>
                </div>
              </div>
              <Progress value={progressPercentage} className="h-3 bg-blue-400" />
              <div className="flex justify-between mt-4 text-sm text-blue-100">
                <span>{Math.round(progressPercentage)}% complete</span>
                <span>{tasks.length - completedCount} remaining</span>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="w-full flex flex-wrap gap-2 h-auto p-2 bg-transparent">
              <TabsTrigger value="today" className="flex items-center gap-1 text-xs px-3 py-2">
                <Calendar className="w-3 h-3" />
                Today
              </TabsTrigger>
              <TabsTrigger value="smart" className="flex items-center gap-1 text-xs px-3 py-2">
                <Brain className="w-3 h-3" />
                Smart
              </TabsTrigger>
              <TabsTrigger value="habits" className="flex items-center gap-1 text-xs px-3 py-2">
                <Target className="w-3 h-3" />
                Habits
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1 text-xs px-3 py-2">
                <BarChart3 className="w-3 h-3" />
                Stats
              </TabsTrigger>
              <TabsTrigger value="skills" className="flex items-center gap-1 text-xs px-3 py-2">
                <Brain className="w-3 h-3" />
                Skills
              </TabsTrigger>
              <TabsTrigger value="achievements" className="flex items-center gap-1 text-xs px-3 py-2">
                <Award className="w-3 h-3" />
                Awards
              </TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="mt-6">
              {/* Filters */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="w-full md:w-48">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="Learning">Learning</SelectItem>
                        <SelectItem value="Skill Development">Skill Development</SelectItem>
                        <SelectItem value="Networking">Networking</SelectItem>
                        <SelectItem value="Portfolio">Portfolio</SelectItem>
                        <SelectItem value="Planning">Planning</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="low">Low Priority</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => setShowCompleted(!showCompleted)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      {showCompleted ? 'Hide' : 'Show'} Completed
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Task List */}
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Generating your personalized tasks...</p>
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <EnhancedTaskCard
                      key={task._id || task.id}
                      task={task}
                      onToggle={toggleTask}
                      onBookmark={toggleBookmark}
                      onStartTimer={startTimer}
                      onStopTimer={stopTimer}
                      isTimerActive={timerActive === (task._id || task.id)?.toString()}
                      timeSpent={timeSpent[(task._id || task.id)?.toString()] || 0}
                    />
                  ))
                )}
              </div>

              {tasks.length > 0 && (
                <div className="mt-8 text-center">
                  <p className="text-gray-600 mb-4">
                    {completedCount === tasks.length 
                      ? "🎉 Outstanding! You've completed all tasks for today!" 
                      : `Great progress! ${tasks.length - completedCount} tasks remaining.`
                    }
                  </p>
                  {completedCount === tasks.length && (
                    <Button onClick={regenerateTasks} className="bg-gradient-to-r from-green-500 to-blue-500">
                      <Trophy className="w-4 h-4 mr-2" />
                      Generate Tomorrow's Tasks
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="smart" className="mt-6">
              <SmartTaskManager 
                tasks={taskRecommendations} 
                onToggle={toggleTask}
                onBookmark={toggleBookmark}
                insights={productivityInsights}
              />
            </TabsContent>

            <TabsContent value="habits" className="mt-6">
              <HabitTracker habits={habitTracking} tasks={tasks} />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <TaskAnalytics stats={taskStats} tasks={tasks} />
            </TabsContent>

            <TabsContent value="skills" className="mt-6">
              <SkillsProgress tasks={tasks} />
            </TabsContent>

            <TabsContent value="achievements" className="mt-6">
              <AchievementsView stats={taskStats} tasks={tasks} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  )
}

function EnhancedTaskCard({ task, onToggle, onBookmark, onStartTimer, onStopTimer, isTimerActive, timeSpent }: {
  task: Task
  onToggle: (id: string | number) => void
  onBookmark: (id: string | number) => void
  onStartTimer: (id: string | number) => void
  onStopTimer: (id: string | number) => void
  isTimerActive: boolean
  timeSpent: number
}) {
  const taskId = task._id || task.id!
  
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getDifficultyIcon = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return <Circle className="w-4 h-4 text-green-500" />
      case 'medium': return <Target className="w-4 h-4 text-yellow-500" />
      case 'hard': return <Zap className="w-4 h-4 text-red-500" />
      default: return <Circle className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 ${
      task.priority === 'high' ? 'border-l-red-500' : 
      task.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
    } ${task.completed ? 'opacity-75 bg-gray-50' : 'bg-white'}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="mt-1">
            <div onClick={() => onToggle(taskId)} className="cursor-pointer">
              {task.completed ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <Circle className="w-6 h-6 text-gray-400 hover:text-blue-500" />
              )}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className={`text-lg font-semibold mb-2 ${
                  task.completed ? 'line-through text-gray-500' : ''
                }`}>
                  {task.title}
                </h3>
                <p className={`text-gray-600 mb-3 ${
                  task.completed ? 'line-through' : ''
                }`}>
                  {task.description}
                </p>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => onBookmark(taskId)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  {task.isBookmarked ? (
                    <BookmarkCheck className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Bookmark className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Task Metadata */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge className={getPriorityColor(task.priority)}>
                {task.priority} priority
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                {getDifficultyIcon(task.difficulty)}
                {task.difficulty}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {task.estimatedTime}min
              </Badge>
              <Badge variant="outline">
                {task.category}
              </Badge>
              {task.careerImpact && (
                <Badge variant="outline" className={
                  task.careerImpact === 'high' ? 'text-orange-600 border-orange-200' :
                  task.careerImpact === 'medium' ? 'text-blue-600 border-blue-200' :
                  'text-gray-600 border-gray-200'
                }>
                  {task.careerImpact} impact
                </Badge>
              )}
            </div>

            {/* Skills and Tags */}
            {(task.skillsGained && task.skillsGained.length > 0) && (
              <div className="mb-3">
                <p className="text-sm text-gray-500 mb-1">Skills you'll gain:</p>
                <div className="flex flex-wrap gap-1">
                  {task.skillsGained.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      <Brain className="w-3 h-3 mr-1" />
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {(task.tags && task.tags.length > 0) && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {task.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Timer and Actions */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-4">
                {!task.completed && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => isTimerActive ? onStopTimer(taskId) : onStartTimer(taskId)}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      {isTimerActive ? (
                        <>
                          <PauseCircle className="w-4 h-4" />
                          Stop Timer
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-4 h-4" />
                          Start Timer
                        </>
                      )}
                    </button>
                    {timeSpent > 0 && (
                      <span className="text-sm text-gray-500">
                        {timeSpent}min elapsed
                      </span>
                    )}
                  </div>
                )}
                
                {task.aiGenerated && (
                  <Badge variant="outline" className="text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    AI Generated
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {task.completed && task.completedAt && (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Completed {new Date(task.completedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TaskAnalytics({ stats, tasks }: { stats: TaskStats | null; tasks: Task[] }) {
  const completedTasks = tasks.filter(t => t.completed)
  const categoryStats = tasks.reduce((acc, task) => {
    acc[task.category] = (acc[task.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Productivity Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Completion Rate</span>
            <span className="font-semibold">{Math.round((completedTasks.length / tasks.length) * 100)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Total Completed</span>
            <span className="font-semibold">{stats?.totalCompleted || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Current Streak</span>
            <span className="font-semibold">{stats?.streakDays || 0} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Productivity Score</span>
            <span className="font-semibold">{stats?.productivityScore || 0}%</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Category Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(categoryStats).map(([category, count]) => (
            <div key={category} className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{category}</span>
              <div className="flex items-center gap-2">
                <Progress value={(count / tasks.length) * 100} className="w-16 h-2" />
                <span className="text-sm font-medium">{count}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Time Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Avg. Task Time</span>
            <span className="font-semibold">{stats?.averageCompletionTime || 25} min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Time Learning</span>
            <span className="font-semibold">{Math.round((stats?.timeSpentLearning || 0) / 60)} hrs</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Consistency</span>
            <span className="font-semibold">{stats?.consistencyRating || 0}%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SkillsProgress({ tasks }: { tasks: Task[] }) {
  const allSkills = tasks.flatMap(task => task.skillsGained || [])
  const skillCounts = allSkills.reduce((acc, skill) => {
    acc[skill] = (acc[skill] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topSkills = Object.entries(skillCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Skills Development
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topSkills.map(([skill, count]) => (
            <div key={skill} className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">{skill}</span>
                <span className="text-sm text-gray-500">{count} tasks</span>
              </div>
              <Progress value={(count / Math.max(...Object.values(skillCounts))) * 100} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Learning Path
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              Based on your completed tasks, you're developing expertise in:
            </div>
            <div className="flex flex-wrap gap-2">
              {topSkills.slice(0, 5).map(([skill]) => (
                <Badge key={skill} className="bg-blue-100 text-blue-800">
                  {skill}
                </Badge>
              ))}
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">Recommended next skills:</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Advanced Analytics</Badge>
                <Badge variant="outline">Leadership</Badge>
                <Badge variant="outline">Project Management</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AchievementsView({ stats, tasks }: { stats: TaskStats | null; tasks: Task[] }) {
  const achievements = [
    {
      title: "First Steps",
      description: "Complete your first task",
      icon: <Star className="w-6 h-6" />,
      unlocked: (stats?.totalCompleted || 0) >= 1,
      progress: Math.min((stats?.totalCompleted || 0), 1)
    },
    {
      title: "Consistent Learner",
      description: "Maintain a 7-day streak",
      icon: <Flame className="w-6 h-6" />,
      unlocked: (stats?.streakDays || 0) >= 7,
      progress: Math.min((stats?.streakDays || 0) / 7, 1)
    },
    {
      title: "Task Master",
      description: "Complete 50 tasks",
      icon: <Trophy className="w-6 h-6" />,
      unlocked: (stats?.totalCompleted || 0) >= 50,
      progress: Math.min((stats?.totalCompleted || 0) / 50, 1)
    },
    {
      title: "Skill Builder",
      description: "Learn 10 different skills",
      icon: <Brain className="w-6 h-6" />,
      unlocked: (stats?.skillsLearned?.length || 0) >= 10,
      progress: Math.min((stats?.skillsLearned?.length || 0) / 10, 1)
    },
    {
      title: "Productivity Pro",
      description: "Achieve 90% productivity score",
      icon: <Zap className="w-6 h-6" />,
      unlocked: (stats?.productivityScore || 0) >= 90,
      progress: Math.min((stats?.productivityScore || 0) / 90, 1)
    },
    {
      title: "Challenge Champion",
      description: "Complete 25 challenging tasks",
      icon: <Award className="w-6 h-6" />,
      unlocked: (stats?.challengesCompleted || 0) >= 25,
      progress: Math.min((stats?.challengesCompleted || 0) / 25, 1)
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {achievements.map((achievement, index) => (
        <Card key={index} className={`${achievement.unlocked ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' : 'bg-gray-50'}`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-full ${achievement.unlocked ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-400'}`}>
                {achievement.icon}
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold ${achievement.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                  {achievement.title}
                </h3>
                <p className="text-sm text-gray-600">{achievement.description}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Progress value={achievement.progress * 100} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{achievement.unlocked ? 'Unlocked!' : 'In Progress'}</span>
                <span>{Math.round(achievement.progress * 100)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function SmartTaskManager({ tasks, onToggle, onBookmark, insights }: {
  tasks: Task[]
  onToggle: (id: string | number) => void
  onBookmark: (id: string | number) => void
  insights: any
}) {
  const [smartTasks, setSmartTasks] = useState<Task[]>([])
  const [scheduleInsights, setScheduleInsights] = useState<any>(null)
  const [showInsights, setShowInsights] = useState(false)

  const generateSmartTasks = () => {
    const newSmartTasks: Task[] = [
      {
        id: Date.now() + 1,
        title: "AI-Recommended: Review Industry Trends",
        description: "Based on your productivity patterns, this is optimal for morning focus",
        category: "Learning",
        priority: 'high',
        difficulty: 'medium',
        estimatedTime: 25,
        completed: false,
        aiGenerated: true,
        careerImpact: 'high',
        skillsGained: ['Market Analysis', 'Strategic Thinking'],
        tags: ['ai-recommended', 'morning-optimal']
      },
      {
        id: Date.now() + 2,
        title: "Smart Break: Network Connection",
        description: "AI suggests this during your high-energy afternoon period",
        category: "Networking",
        priority: 'medium',
        difficulty: 'easy',
        estimatedTime: 15,
        completed: false,
        aiGenerated: true,
        careerImpact: 'medium',
        skillsGained: ['Networking', 'Communication'],
        tags: ['ai-recommended', 'afternoon-optimal']
      }
    ]
    setSmartTasks(newSmartTasks)
  }

  const viewScheduleInsights = () => {
    setScheduleInsights({
      optimalTimes: {
        morning: "9:00 AM - 11:00 AM: High focus tasks",
        afternoon: "2:00 PM - 4:00 PM: Collaborative work",
        evening: "6:00 PM - 7:00 PM: Learning & reflection"
      },
      productivity: {
        peakHours: "9:00 AM - 11:00 AM",
        lowEnergyPeriod: "1:00 PM - 2:00 PM",
        bestForCreative: "10:00 AM - 12:00 PM"
      },
      recommendations: [
        "Schedule challenging tasks during morning peak hours",
        "Use afternoon for networking and meetings",
        "Reserve evenings for learning and skill development"
      ]
    })
    setShowInsights(true)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-6 h-6" />
            <h3 className="text-xl font-semibold">AI-Powered Task Intelligence</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-purple-100">Optimal Time</p>
              <p className="font-semibold">{insights?.optimalTime || '9:00 AM - 11:00 AM'}</p>
            </div>
            <div>
              <p className="text-sm text-purple-100">Focus Score</p>
              <p className="font-semibold">{insights?.focusScore || 85}%</p>
            </div>
            <div>
              <p className="text-sm text-purple-100">Recommendation</p>
              <p className="font-semibold">{insights?.recommendation || 'Start with high-priority tasks'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Smart Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              AI-generated tasks based on your productivity patterns and career goals
            </p>
            <Button onClick={generateSmartTasks} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
              Generate Smart Tasks
            </Button>
            {smartTasks.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Generated Tasks:</p>
                {smartTasks.map(task => (
                  <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-sm">{task.title}</p>
                    <p className="text-xs text-gray-600">{task.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Schedule Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              AI suggests the best times for different task types
            </p>
            <Button onClick={viewScheduleInsights} variant="outline" className="w-full mb-4">
              View Schedule Insights
            </Button>
            {showInsights && scheduleInsights && (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Optimal Times:</p>
                  <div className="space-y-1 text-xs">
                    <p><strong>Morning:</strong> {scheduleInsights.optimalTimes.morning}</p>
                    <p><strong>Afternoon:</strong> {scheduleInsights.optimalTimes.afternoon}</p>
                    <p><strong>Evening:</strong> {scheduleInsights.optimalTimes.evening}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Recommendations:</p>
                  <ul className="text-xs space-y-1">
                    {scheduleInsights.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="text-gray-600">• {rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function HabitTracker({ habits, tasks }: { habits: any[]; tasks: Task[] }) {
  const defaultHabits = [
    { name: 'Daily Learning', target: 30, current: 25, unit: 'minutes' },
    { name: 'Skill Practice', target: 7, current: 5, unit: 'days/week' },
    { name: 'Network Building', target: 3, current: 2, unit: 'connections/week' },
    { name: 'Portfolio Updates', target: 2, current: 1, unit: 'updates/week' }
  ]
  
  const habitsToShow = habits.length > 0 ? habits : defaultHabits
  
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-teal-500 to-green-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6" />
            <h3 className="text-xl font-semibold">Career Habit Tracker</h3>
          </div>
          <p className="text-teal-100">
            Build consistent habits that accelerate your career growth
          </p>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2">
        {habitsToShow.map((habit, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{habit.name}</h3>
                <Badge variant={habit.current >= habit.target ? 'default' : 'secondary'}>
                  {habit.current}/{habit.target} {habit.unit}
                </Badge>
              </div>
              <Progress value={(habit.current / habit.target) * 100} className="mb-3" />
              <div className="flex justify-between text-sm text-gray-500">
                <span>Progress: {Math.round((habit.current / habit.target) * 100)}%</span>
                <span>{habit.target - habit.current} {habit.unit} to go</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Habit Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">78%</div>
              <div className="text-sm text-gray-500">Consistency Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">12</div>
              <div className="text-sm text-gray-500">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">4</div>
              <div className="text-sm text-gray-500">Active Habits</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}