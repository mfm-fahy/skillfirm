"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Search, Play, Clock, Eye, RefreshCw, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      generateCourses(parsedUser.selectedCareerField || 'Programming')
    }
  }, [])

  const generateCourses = async (field: string) => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/ai/generate-courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field })
      })
      const data = await response.json()
      console.log('API Response:', data) // Debug log
      setCourses(data.courses || [])
    } catch (error) {
      console.error('Failed to generate courses:', error)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const searchCourses = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/ai/search-courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.trim() })
      })
      const data = await response.json()
      setCourses(data.courses || [])
    } catch (error) {
      console.error('Failed to search courses:', error)
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
      <main className="min-h-screen md:pt-0 pb-20 md:pb-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2" style={{ color: "#5170ff" }}>
                Recommended Courses
              </h1>
              <p className="text-gray-600">
                {user?.selectedCareerField 
                  ? `YouTube courses curated for ${user.selectedCareerField}` 
                  : "Discover the best YouTube courses for your career"
                }
              </p>
            </div>
            <button
              onClick={regenerateCourses}
              disabled={regenerating}
              className="flex items-center gap-2 px-4 py-2 bg-[#5170ff] text-white rounded-lg hover:bg-[#4160ef] disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
              {regenerating ? 'Generating...' : 'New Courses'}
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2 mb-8 max-w-2xl">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for specific courses..."
                className="pl-10 h-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchCourses()}
              />
            </div>
            <Button 
              onClick={searchCourses}
              disabled={!searchQuery.trim()}
              className="h-12 px-6 bg-[#5170ff] hover:bg-[#4160ef]"
            >
              Search
            </Button>
          </div>

          {/* Courses Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5170ff] mx-auto mb-4"></div>
              <p className="text-gray-600">Finding the best courses for you...</p>
            </div>
          ) : courses.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No courses found. Try searching for something else.</p>
              <Button onClick={regenerateCourses} className="bg-[#5170ff] hover:bg-[#4160ef]">
                Generate New Courses
              </Button>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

function CourseCard({ course }: { course: Course }) {
  const openCourse = () => {
    window.open(course.url, '_blank')
  }

  console.log('Course thumbnail:', course.thumbnail) // Debug log

  return (
    <div className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative cursor-pointer bg-gray-100" onClick={openCourse}>
        <img 
          src={course.thumbnail} 
          alt={course.title} 
          className="w-full h-48 object-cover block"
          style={{ display: 'block', width: '100%', height: '192px' }}
          onLoad={() => console.log('Image loaded:', course.thumbnail)}
          onError={(e) => {
            console.log('Image error:', course.thumbnail)
            const target = e.currentTarget;
            if (target.src.includes('maxresdefault')) {
              target.src = `https://img.youtube.com/vi/${course.id}/hqdefault.jpg`;
            } else if (target.src.includes('hqdefault')) {
              target.src = `https://img.youtube.com/vi/${course.id}/mqdefault.jpg`;
            } else {
              target.src = 'https://via.placeholder.com/320x180/cccccc/666666?text=Video';
            }
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center">
          <Play className="w-12 h-12 text-white opacity-0 hover:opacity-100 transition-opacity" />
        </div>
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {course.duration || 'Video'}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 cursor-pointer hover:text-[#5170ff]" onClick={openCourse}>
          {course.title}
        </h3>
        <p className="text-sm text-gray-600 mb-2">{course.channelTitle}</p>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{course.description}</p>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
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
          className="w-full bg-[#5170ff] hover:bg-[#4160ef] text-white"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Watch on YouTube
        </Button>
      </div>
    </div>
  )
}
