"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { ArrowLeft, Save } from "lucide-react"

export default function EditProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    selectedCareerField: ""
  })

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
      setFormData({
        name: parsedUser.name || "",
        email: parsedUser.email || "",
        selectedCareerField: parsedUser.selectedCareerField || ""
      })
    } catch (error) {
      router.push('/login')
      return
    }
    
    setLoading(false)
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        router.push('/profile')
      } else {
        alert(data.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5170ff]"></div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen md:pt-0 pb-20 md:pb-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold" style={{ color: "#5170ff" }}>
              Edit Profile
            </h1>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5170ff] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5170ff] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Career Field
                </label>
                <select
                  value={formData.selectedCareerField}
                  onChange={(e) => setFormData({ ...formData, selectedCareerField: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5170ff] focus:border-transparent"
                >
                  <option value="">Select a career field</option>
                  <option value="Software Development">Software Development</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Digital Marketing">Digital Marketing</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                  <option value="Project Management">Project Management</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Business Analysis">Business Analysis</option>
                  <option value="DevOps Engineering">DevOps Engineering</option>
                  <option value="Product Management">Product Management</option>
                  <option value="Machine Learning">Machine Learning</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#5170ff] text-white rounded-lg hover:bg-[#4160ef] disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  )
}