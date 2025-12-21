"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Search, Play, Clock, Eye, RefreshCw, ExternalLink, AlertCircle, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCourseSocket } from "@/hooks/use-socket"
import API_BASE_URL from "@/lib/api"

interface Course {
  id: string
  title: string
  description: string
  thumbnail: string
  channelTitle: string
  publishedAt: string
  duration?: string
  viewCount?: string
  url: string
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { courseUpdates, progressUpdates, sendCourseUpdate, isConnected } = useCourseSocket()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      generateCourses(parsedUser.selectedCareerField || 'Programming')
    } else {
      setLoading(false)
      setError('Please log in to view personalized courses')
    }
  }, [])

  // Handle real-time course updates
  useEffect(() => {
    if (courseUpdates.length > 0) {
      const latestUpdate = courseUpdates[0]
      // Add the new course to the list if it's not already there
      setCourses(prevCourses => {
        const exists = prevCourses.some(course => course.id === latestUpdate.id)
        if (!exists) {
          return [latestUpdate, ...prevCourses]
        }
        return prevCourses
      })
    }
  }, [courseUpdates])

  // Handle real-time progress updates
  useEffect(() => {
    if (progressUpdates.length > 0) {
      const latestProgress = progressUpdates[0]
      // Update course progress if applicable
      console.log('Course progress update:', latestProgress)
    }
  }, [progressUpdates])

  const generateCourses = async (field: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/generate-courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('API Response:', data)
      
      if (data.courses && Array.isArray(data.courses)) {
        setCourses(data.courses)
      } else {
        setCourses([])
        setError('No courses found for this field')
      }
    } catch (error) {
      console.error('Failed to generate courses:', error)
      setCourses([])
      setError('Failed to load courses. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const searchCourses = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/search-courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.trim() })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.courses && Array.isArray(data.courses)) {
        setCourses(data.courses)
      } else {
        setCourses([])
        setError('No courses found for your search')
      }
    } catch (error) {
      console.error('Failed to search courses:', error)
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const regenerateCourses = () => {
    setRegenerating(true)
    generateCourses(user?.selectedCareerField || 'Programming')
      .finally(() => setRegenerating(false))
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen md:pt-0 pb-20 md:pb-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Recommended Courses
              </h1>
              <p className="text-gray-600 text-lg">
                {user?.selectedCareerField 
                  ? `YouTube courses curated for ${user.selectedCareerField}` 
                  : "Discover the best YouTube courses for your career"
                }
              </p>
              {user?.selectedCareerField && (
                <div className="mt-3">
                  <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
                    {user.selectedCareerField}
                  </span>
                </div>
              )}
            </div>
            {user && (
              <div className="flex gap-2">
                <Button
                  onClick={regenerateCourses}
                  disabled={regenerating || loading}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
                  {regenerating ? 'Generating...' : 'New Courses'}
                </Button>
                {isConnected && (
                  <Button
                    onClick={() => sendCourseUpdate({
                      id: `test-course-${Date.now()}`,
                      title: "Test Real-time Course Update",
                      description: "This is a test course sent via socket for real-time demonstration.",
                      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
                      channelTitle: "Real-time Test Channel",
                      publishedAt: new Date().toISOString(),
                      url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
                      duration: "10:00",
                      viewCount: "1000"
                    })}
                    variant="outline"
                    className="flex items-center gap-2 px-4 py-3"
                  >
                    <Zap className="w-4 h-4" />
                    Test Live Update
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="flex gap-3 mb-8 max-w-2xl">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for specific courses..."
                className="pl-12 h-14 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchCourses()}
              />
            </div>
            <Button 
              onClick={searchCourses}
              disabled={!searchQuery.trim() || loading}
              className="h-14 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Search
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-center gap-3 shadow-sm">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Courses Grid */}
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
              <p className="text-gray-600 text-lg">Finding the best courses for you...</p>
            </div>
          ) : courses.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : !error && (
            <div className="text-center py-16">
              <p className="text-gray-600 mb-6 text-lg">No courses found. Try searching for something else.</p>
              {user && (
                <Button onClick={regenerateCourses} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                  Generate New Courses
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  )
}

function CourseCard({ course }: { course: Course }) {
  const openCourse = () => {
    window.open(course.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
      <div className="relative cursor-pointer" onClick={openCourse}>
        <img 
          src={course.thumbnail}
          alt={course.title}
          onError={(e) => {
            console.error('Thumbnail failed to load:', e.currentTarget.src)
            if (e.currentTarget.src.includes('mqdefault')) {
              e.currentTarget.src = e.currentTarget.src.replace('mqdefault', 'hqdefault')
            } else if (e.currentTarget.src.includes('hqdefault')) {
              e.currentTarget.src = e.currentTarget.src.replace('hqdefault', 'default')
            }
          }}
          style={{
            width: "100%",
            height: "200px",
            objectFit: "cover",
            borderRadius: "0",
            backgroundColor: "#f3f4f6"
          }}
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-8 h-8 text-white" />
          </div>
        </div>
        
        {course.duration && (
          <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium">
            {course.duration}
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="font-semibold text-lg mb-3 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors leading-tight" onClick={openCourse}>
          {course.title}
        </h3>
        <p className="text-sm text-gray-600 mb-2 font-medium">{course.channelTitle}</p>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">{course.description}</p>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
          <div className="flex items-center gap-4">
            {course.viewCount && (
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{course.viewCount}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{new Date(course.publishedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <Button 
          onClick={openCourse}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-200 rounded-xl h-12 shadow-lg hover:shadow-xl"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Watch on YouTube
        </Button>
      </div>
    </div>
  )
}
