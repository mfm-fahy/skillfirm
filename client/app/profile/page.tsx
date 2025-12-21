"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Mail, Briefcase, Building, Award, Target, Edit, Calendar, CheckCircle, TrendingUp, Clock } from "lucide-react"

interface TaskStats {
  totalTasks: number
  completedTasks: number
  activeDays: number
  averageCompletion: number
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchUserProfile = async (token: string) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const userData = await response.json()
        console.log('Fresh user data from server:', userData)
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (!token || !userData) {
      router.push("/login")
      return
    }
    const parsedUser = JSON.parse(userData)
    console.log('Profile user data:', parsedUser)
    console.log('selectedCareerField:', parsedUser.selectedCareerField)
    console.log('currentField:', parsedUser.currentField)
    console.log('All user keys:', Object.keys(parsedUser))
    setUser(parsedUser)
    fetchTaskStats(token)
    fetchUserProfile(token) // Fetch fresh user data
  }, [router])

  const fetchTaskStats = async (token: string) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const response = await fetch(`${API_BASE_URL}/api/tasks/progress`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setTaskStats(data)
    } catch (error) {
      console.error('Failed to fetch task stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  const skillsList = user.skills ? user.skills.split(",").map((s: string) => s.trim()) : []

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Profile Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gradient-to-r from-blue-500 to-purple-500 p-1">
                <div className="w-full h-full rounded-full overflow-hidden bg-white">
                  <Image
                    src={user.avatar || "/placeholder-user.jpg"}
                    alt={user.name}
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{user.name}</h1>
                    {user.selectedCareerField && (
                      <p className="text-lg text-gray-600 mt-2">
                        {user.selectedCareerField} Enthusiast
                      </p>
                    )}
                  </div>
                  <Button 
                    onClick={() => router.push('/profile/edit')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>

                <p className="text-gray-700 leading-relaxed text-lg">
                  {user.userType === 'school' && 'School Student exploring career opportunities'}
                  {user.userType === 'college' && 'College Student building skills for the future'}
                  {user.userType === 'employee' && 'Professional advancing in their career'}
                </p>
              </div>
            </div>
          </div>

          {/* Career Progress & Task Statistics */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Career Progress */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Career Progress</h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Overall Progress</span>
                  <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {taskStats ? `${taskStats.overall}%` : '0%'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${taskStats?.overall || 0}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500">
                  Based on completed daily tasks
                </p>
              </div>
            </div>

            {/* Lifetime Tasks */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Tasks Completed</h2>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent mb-2">
                  {taskStats?.completedTasks || 0}
                </div>
                <p className="text-gray-600 mb-3">out of {taskStats?.totalTasks || 0} total</p>
                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {taskStats?.averageCompletion || 0}% completion rate
                </div>
              </div>
            </div>

            {/* Active Days */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Active Days</h2>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent mb-2">
                  {taskStats?.activeDays || 0}
                </div>
                <p className="text-gray-600 mb-3">days with tasks</p>
                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  Last 7 days
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Contact Information</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">{user.email}</span>
                </div>
              </div>
            </div>

            {/* Career Information */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Career Information</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  <Target className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-700">{user.selectedCareerField || user.currentField || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  <Award className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-700 capitalize">{user.userType || 'Student'}</span>
                </div>
                {user.degree && typeof user.degree === 'object' && (
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                    <Building className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700">{user.degree.name || user.degree.status || 'Degree information available'}</span>
                  </div>
                )}
                {user.degree && typeof user.degree === 'string' && (
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                    <Building className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700">{user.degree}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl p-6 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Career Focus & Goals</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Selected Career Field</h3>
                  <div className="inline-block px-6 py-3 bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 rounded-xl">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">
                      {user.selectedCareerField || user.currentField || 'Not specified'}
                    </span>
                  </div>
                </div>
                {user.fieldAnalysis && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Field Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">Market Value</p>
                        <p className="font-semibold text-gray-800">{user.fieldAnalysis.value || 'N/A'}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">Growth Potential</p>
                        <p className="font-semibold text-gray-800">{user.fieldAnalysis.growth || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl p-6 mt-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Account Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Member Since</p>
                <p className="font-semibold text-gray-800">
                  {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">User Type</p>
                <p className="font-semibold text-gray-800 capitalize">{user.userType}</p>
              </div>
              {user.schoolGroup && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">School Group</p>
                  <p className="font-semibold text-gray-800">{user.schoolGroup}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
