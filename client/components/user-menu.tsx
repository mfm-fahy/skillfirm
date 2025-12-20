"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { User, Settings, LogOut, Briefcase } from "lucide-react"

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setUser(JSON.parse(userData))
    }

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setIsOpen(false)
    router.push('/login')
  }

  if (!user) {
    return (
      <Link href="/login">
        <button className="px-4 py-2 bg-[#5170ff] text-white rounded-lg hover:bg-[#4160ef] transition-colors text-sm">
          Sign In
        </button>
      </Link>
    )
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#5170ff]">
          <Image
            src={user.avatar || "/placeholder.svg?height=40&width=40"}
            alt={user.name}
            width={40}
            height={40}
            className="object-cover"
          />
        </div>
        <span className="hidden md:block font-medium">{user.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-gray-600">{user.email}</p>
            {user.selectedCareerField && (
              <p className="text-xs text-blue-600 mt-1">{user.selectedCareerField}</p>
            )}
          </div>

          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
          >
            <User className="w-4 h-4" />
            <span>View Profile</span>
          </Link>

          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
          >
            <Briefcase className="w-4 h-4" />
            <span>Change Field</span>
          </Link>

          <Link
            href="/profile/edit"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Edit Profile</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-red-600"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  )
}
