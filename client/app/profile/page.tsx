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

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (!token || !userData) {
      router.push("/login")
      return
    }
    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    fetchTaskStats(token)
  }, [router])

  const fetchTaskStats = async (token: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/tasks/progress', {
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
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow p-8 mb-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#5170ff]">
                <Image
                  src={user.profilePicture || "/placeholder.svg?height=128&width=128"}
                  alt={user.name}
                  width={128}
                  height={128}
                  className="object-cover"
                />
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold">{user.name}</h1>
                    {user.selectedCareerField && (
                      <p className="text-lg text-gray-600 mt-1">
                        {user.selectedCareerField} Enthusiast
                      </p>
                    )}
                  </div>
                  <Button className="bg-[#5170ff] hover:bg-[#4160ef] text-white">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>

                <p className="text-gray-700 leading-relaxed">
                  {user.userType === 'school' && 'School Student exploring career opportunities'}
                  {user.userType === 'college' && 'College Student building skills for the future'}
                  {user.userType === 'employee' && 'Professional advancing in their career'}
                </p>
              </div>
            </div>
          </div>

          {/* Career Progress & Task Statistics */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {/* Career Progress */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-[#5170ff]" />
                <h2 className="text-xl font-semibold">Career Progress</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Overall Progress</span>
                  <span className="font-semibold text-[#5170ff]">
                    {taskStats ? `${taskStats.overall}%` : '0%'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#5170ff] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${taskStats?.overall || 0}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500">
                  Based on completed daily tasks
                </p>
              </div>
            </div>

            {/* Lifetime Tasks */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h2 className="text-xl font-semibold">Tasks Completed</h2>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500 mb-2">
                  {taskStats?.completedTasks || 0}
                </div>
                <p className="text-gray-600">out of {taskStats?.totalTasks || 0} total</p>
                <div className="mt-3 text-sm text-gray-500">
                  {taskStats?.averageCompletion || 0}% average completion rate
                </div>
              </div>
            </div>

            {/* Active Days */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-semibold">Active Days</h2>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500 mb-2">
                  {taskStats?.activeDays || 0}
                </div>
                <p className="text-gray-600">days with tasks</p>
                <div className="mt-3 text-sm text-gray-500">
                  Last 7 days
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#5170ff]" />
                  <span className="text-gray-700">{user.email}</span>
                </div>
              </div>
            </div>

            {/* Career Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Career Information</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-[#5170ff]" />
                  <span className="text-gray-700">{user.selectedCareerField || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-[#5170ff]" />
                  <span className="text-gray-700 capitalize">{user.userType || 'Student'}</span>
                </div>
                {user.degree && (
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-[#5170ff]" />
                    <span className="text-gray-700">{user.degree}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Career Focus & Goals</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Selected Career Field</h3>
                  <span className="px-4 py-2 bg-[#5170ff] bg-opacity-10 text-[#5170ff] rounded-lg text-sm font-medium">
                    {user.selectedCareerField || 'Not specified'}
                  </span>
                </div>
                {user.fieldAnalysis && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Field Analysis</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Market Value: <span className="font-medium">{user.fieldAnalysis.value || 'N/A'}</span></p>
                      <p>Growth Potential: <span className="font-medium">{user.fieldAnalysis.growth || 'N/A'}</span></p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-[#5170ff]" />
              <h2 className="text-xl font-semibold">Account Details</h2>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Member since {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
              <p className="text-sm text-gray-600">
                User Type: <span className="capitalize font-medium">{user.userType}</span>
              </p>
              {user.schoolGroup && (
                <p className="text-sm text-gray-600">
                  School Group: <span className="font-medium">{user.schoolGroup}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
