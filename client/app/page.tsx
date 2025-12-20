"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { ExternalLink, Play } from "lucide-react"

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

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      router.push('/login')
      return
    }
    
    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      if (parsedUser.selectedCareerField) {
        getSuggestedCourse(parsedUser.selectedCareerField)
        getSuggestedNews(parsedUser.selectedCareerField)
        getFieldUpdates(parsedUser.selectedCareerField)
      }
      getTaskStats()
      getOverallProgress()
    } catch (error) {
      router.push('/login')
      return
    }
    
    setLoading(false)
  }, [router])

  // Refresh task stats when user returns to the page
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        getTaskStats()
        getOverallProgress()
        if (user.selectedCareerField) {
          getFieldUpdates(user.selectedCareerField)
        }
      }
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user])

  const getFieldUpdates = async (field: string) => {
    setUpdatesLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/ai/generate-field-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field })
      })
      const data = await response.json()
      setFieldUpdates(data)
    } catch (error) {
      console.error('Failed to get field updates:', error)
    } finally {
      setUpdatesLoading(false)
    }
  }

  const getSuggestedNews = async (field: string) => {
    setNewsLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/ai/generate-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field })
      })
      const data = await response.json()
      setSuggestedNews(data.news?.slice(0, 3) || [])
    } catch (error) {
      console.error('Failed to get news suggestions:', error)
    } finally {
      setNewsLoading(false)
    }
  }

  const getOverallProgress = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      const response = await fetch('http://localhost:5000/api/tasks/progress', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setOverallProgress(data)
    } catch (error) {
      console.error('Failed to get overall progress:', error)
    } finally {
      setProgressLoading(false)
    }
  }

  const getTaskStats = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      const response = await fetch('http://localhost:5000/api/tasks/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setTaskStats(data)
    } catch (error) {
      console.error('Failed to get task stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const getSuggestedCourse = async (field: string) => {
    setCourseLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/ai/suggest-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field })
      })
      const data = await response.json()
      setSuggestedCourse(data.course)
    } catch (error) {
      console.error('Failed to get course suggestion:', error)
    } finally {
      setCourseLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5170ff] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen md:pt-0 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2" style={{ color: "#5170ff" }}>
              Welcome back, {user.name}!
            </h1>
            <p className="text-gray-600">
              {user.selectedCareerField 
                ? `Continue your journey in ${user.selectedCareerField}` 
                : "Continue your professional career journey"
              }
            </p>
          </div>

          {/* Field Updates */}
          {user.selectedCareerField && (
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">Latest in {user.selectedCareerField}</h2>
              {updatesLoading ? (
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                  {[1,2].map(i => (
                    <div key={i} className="bg-white p-4 rounded-lg border">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-300 rounded mb-2 w-3/4"></div>
                        <div className="h-3 bg-gray-300 rounded w-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                  {fieldUpdates.updates?.slice(0, 2).map((update: any, index: number) => (
                    <div key={index} className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm text-[#5170ff]">{update.title}</h3>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {update.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{update.content}</p>
                    </div>
                  ))}
                  {fieldUpdates.latestNews?.slice(0, 2).map((article: any, index: number) => (
                    <div key={`news-${index}`} className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                         onClick={() => window.open(article.url, '_blank')}>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm text-[#5170ff] line-clamp-2">{article.title}</h3>
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                          news
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{article.description}</p>
                      <p className="text-xs text-gray-400 mt-2">{article.source}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mb-6 grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <div className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => router.push('/daily-tasks')}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Tasks</h2>
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-300 h-6 w-12 rounded"></div>
                ) : (
                  <span className="text-xl font-bold" style={{ color: "#5170ff" }}>
                    {taskStats.completed}/{taskStats.total}
                  </span>
                )}
              </div>
              <div className="flex gap-1 mb-2">
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-300 h-1.5 w-full rounded-full"></div>
                ) : (
                  Array.from({ length: Math.max(taskStats.total, 1) }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 h-1.5 rounded-full"
                      style={{
                        backgroundColor: i < taskStats.completed ? "#5170ff" : "#e5e7eb",
                      }}
                    />
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500">
                {statsLoading ? (
                  <span className="animate-pulse bg-gray-300 h-3 w-20 rounded inline-block"></span>
                ) : taskStats.total === 0 ? (
                  "Get started!"
                ) : taskStats.completed === taskStats.total ? (
                  "🎉 Complete!"
                ) : (
                  `${taskStats.total - taskStats.completed} left`
                )}
              </p>
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => router.push('/daily-tasks')}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Today</h2>
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-300 h-6 w-8 rounded"></div>
                ) : (
                  <span className="text-xl font-bold" style={{ color: "#5170ff" }}>
                    {taskStats.percentage}%
                  </span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-2">
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-300 h-2 w-full rounded-full"></div>
                ) : (
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${taskStats.percentage}%`,
                      backgroundColor: "#5170ff",
                    }}
                  />
                )}
              </div>
              <p className="text-xs text-gray-500">
                {statsLoading ? (
                  <span className="animate-pulse bg-gray-300 h-3 w-16 rounded inline-block"></span>
                ) : taskStats.percentage >= 75 ? (
                  "Great work!"
                ) : taskStats.percentage >= 50 ? (
                  "Keep going!"
                ) : taskStats.percentage > 0 ? (
                  "In progress"
                ) : (
                  "Start now"
                )}
              </p>
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => router.push('/daily-tasks')}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Weekly</h2>
                {progressLoading ? (
                  <div className="animate-pulse bg-gray-300 h-6 w-8 rounded"></div>
                ) : (
                  <span className="text-xl font-bold" style={{ color: "#5170ff" }}>
                    {overallProgress.overall}%
                  </span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-2">
                {progressLoading ? (
                  <div className="animate-pulse bg-gray-300 h-2 w-full rounded-full"></div>
                ) : (
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${overallProgress.overall}%`,
                      backgroundColor: "#5170ff",
                    }}
                  />
                )}
              </div>
              <p className="text-xs text-gray-500">
                {progressLoading ? (
                  <span className="animate-pulse bg-gray-300 h-3 w-16 rounded inline-block"></span>
                ) : (
                  `${overallProgress.activeDays} active days`
                )}
              </p>
            </div>
          </div>

          {/* Suggested Courses */}
          {user.selectedCareerField && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Recommended Courses for {user.selectedCareerField}</h2>
              {courseLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="bg-white p-4 rounded-lg border">
                      <div className="animate-pulse">
                        <div className="bg-gray-300 h-32 w-full rounded mb-3"></div>
                        <div className="h-4 bg-gray-300 rounded mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : suggestedCourse && suggestedCourse.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {suggestedCourse.map((course: any) => (
                    <div key={course.id} className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                         onClick={() => window.open(course.url, '_blank')}>
                      <div className="relative">
                        <img 
                          src={course.thumbnail} 
                          alt={course.title}
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://img.youtube.com/vi/${course.id}/hqdefault.jpg`;
                            target.onerror = () => {
                              target.src = '/placeholder.svg?height=128&width=200';
                            };
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center">
                          <Play className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                        </div>
                        {course.duration && (
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                            {course.duration}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-sm mb-1 line-clamp-2 hover:text-[#5170ff]">
                          {course.title}
                        </h3>
                        <p className="text-xs text-gray-600 mb-2">{course.channelTitle}</p>
                        {course.viewCount && (
                          <p className="text-xs text-gray-500">{course.viewCount}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-6 rounded-lg border text-center">
                  <p className="text-gray-600">No courses found for your field. Try updating your career field in your profile.</p>
                </div>
              )}
            </div>
          )}

          {/* Suggested News */}
          {user.selectedCareerField && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Latest Industry News</h2>
                <button
                  onClick={() => router.push('/news')}
                  className="text-[#5170ff] hover:underline text-sm"
                >
                  View All News
                </button>
              </div>
              {newsLoading ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="bg-white rounded-lg border overflow-hidden">
                      <div className="animate-pulse">
                        <div className="bg-gray-300 h-32 w-full"></div>
                        <div className="p-4 space-y-2">
                          <div className="h-4 bg-gray-300 rounded"></div>
                          <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : suggestedNews.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {suggestedNews.map((article: any, index: number) => (
                    <div key={index} className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                         onClick={() => window.open(article.url, '_blank')}>
                      {article.urlToImage && (
                        <img 
                          src={article.urlToImage} 
                          alt={article.title}
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-sm mb-2 line-clamp-2 hover:text-[#5170ff]">
                          {article.title}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{article.source}</span>
                          <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => router.push('/courses')}>
              <h2 className="text-lg font-semibold mb-2">Career Planning</h2>
              <p className="text-sm text-gray-600">Get personalized guidance for your career path</p>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => router.push('/daily-tasks')}>
              <h2 className="text-lg font-semibold mb-2">Daily Tasks</h2>
              <p className="text-sm text-gray-600">Track your progress with daily actionable tasks</p>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => router.push('/community')}>
              <h2 className="text-lg font-semibold mb-2">Community</h2>
              <p className="text-sm text-gray-600">Connect with others on similar career paths</p>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => router.push('/chat-ai')}>
              <h2 className="text-lg font-semibold mb-2">AI Career Coach</h2>
              <p className="text-sm text-gray-600">Get instant career advice from our AI assistant</p>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => router.push('/news')}>
              <h2 className="text-lg font-semibold mb-2">Industry News</h2>
              <p className="text-sm text-gray-600">Stay updated with the latest industry trends</p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
