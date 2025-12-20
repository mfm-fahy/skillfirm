"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { CheckCircle, Circle, RefreshCw } from "lucide-react"

interface Task {
  _id?: string
  id?: number
  title: string
  description: string
  completed: boolean
  category: string
}

export default function DailyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      loadTodaysTasks()
    }
  }, [])

  const loadTodaysTasks = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      const response = await fetch('http://localhost:5000/api/tasks/today', {
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

  const generateNewTasks = async () => {
    const userData = localStorage.getItem('user')
    if (!userData) return
    
    const user = JSON.parse(userData)
    const field = user.selectedCareerField || 'General Career Development'
    
    try {
      const response = await fetch('http://localhost:5000/api/ai/generate-daily-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field })
      })
      const data = await response.json()
      
      if (data.tasks) {
        await saveTasks(data.tasks)
        setTasks(data.tasks)
      }
    } catch (error) {
      console.error('Failed to generate tasks:', error)
      setTasks(getFallbackTasks(field))
    } finally {
      setLoading(false)
    }
  }

  const saveTasks = async (tasksToSave: Task[]) => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      await fetch('http://localhost:5000/api/tasks/save', {
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

  const getFallbackTasks = (field: string): Task[] => [
    { id: 1, title: `Read industry news about ${field}`, description: "Stay updated with latest trends", completed: false, category: "Learning" },
    { id: 2, title: "Practice a key skill", description: "Spend 30 minutes improving your expertise", completed: false, category: "Skill Development" },
    { id: 3, title: "Network with professionals", description: "Connect with someone in your field", completed: false, category: "Networking" },
    { id: 4, title: "Update your portfolio", description: "Add recent work or achievements", completed: false, category: "Portfolio" },
    { id: 5, title: "Plan tomorrow's goals", description: "Set clear objectives for the next day", completed: false, category: "Planning" }
  ]

  const toggleTask = async (taskId: string | number) => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    const task = tasks.find(t => t._id === taskId || t.id === taskId)
    if (!task) return
    
    // Update locally first
    setTasks(tasks.map(t => 
      (t._id === taskId || t.id === taskId) ? { ...t, completed: !t.completed } : t
    ))
    
    // Update on server if task has _id (persisted)
    if (task._id) {
      try {
        await fetch(`http://localhost:5000/api/tasks/${task._id}/toggle`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      } catch (error) {
        console.error('Failed to update task:', error)
        // Revert on error
        setTasks(tasks.map(t => 
          (t._id === taskId || t.id === taskId) ? { ...t, completed: task.completed } : t
        ))
      }
    }
  }

  const regenerateTasks = async () => {
    setRegenerating(true)
    await generateNewTasks()
    setRegenerating(false)
  }

  const completedCount = tasks.filter(task => task.completed).length
  const progressPercentage = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0

  return (
    <>
      <Navbar />
      <main className="min-h-screen md:pt-0 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2" style={{ color: "#5170ff" }}>
                Daily Tasks
              </h1>
              <p className="text-gray-600">
                {user?.selectedCareerField 
                  ? `Tasks for your ${user.selectedCareerField} career` 
                  : "Your tasks to achieve your career goals"
                }
              </p>
            </div>
            <button
              onClick={regenerateTasks}
              disabled={regenerating}
              className="flex items-center gap-2 px-4 py-2 bg-[#5170ff] text-white rounded-lg hover:bg-[#4160ef] disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
              {regenerating ? 'Generating...' : 'New Tasks'}
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">Today's Progress</h2>
              <span className="text-sm text-gray-600">{completedCount}/{tasks.length} completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="h-3 rounded-full transition-all duration-300" 
                style={{ width: `${progressPercentage}%`, backgroundColor: "#5170ff" }}
              />
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5170ff] mx-auto"></div>
                <p className="mt-2 text-gray-600">Generating your daily tasks...</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div 
                  key={task._id || task.id} 
                  className={`bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer ${
                    task.completed ? 'opacity-75' : ''
                  }`}
                  onClick={() => toggleTask(task._id || task.id!)}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {task.completed ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`text-lg font-semibold ${
                          task.completed ? 'line-through text-gray-500' : ''
                        }`}>
                          {task.title}
                        </h3>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {task.category}
                        </span>
                      </div>
                      <p className={`text-gray-600 ${
                        task.completed ? 'line-through' : ''
                      }`}>
                        {task.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {tasks.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                {completedCount === tasks.length 
                  ? "🎉 Great job! You've completed all tasks for today!" 
                  : `Keep going! ${tasks.length - completedCount} tasks remaining.`
                }
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
