"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Home, Newspaper, ListChecks, Users, MessageSquare, BookOpen, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { UserMenu } from "./user-menu"

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Courses", href: "/courses", icon: BookOpen },
  { name: "News", href: "/news", icon: Newspaper },
  { name: "Daily Tasks", href: "/daily-tasks", icon: ListChecks },
  { name: "Community", href: "/community", icon: Users },
  { name: "AI Coach", href: "/chat-ai", icon: MessageSquare },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Top Bar */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between h-16 px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Image src="/logo.png" alt="SkillFirm" width={20} height={20} className="rounded" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SkillFirm
            </span>
          </Link>
          <UserMenu />
        </div>
      </nav>

      {/* Desktop Navbar */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Image src="/logo.png" alt="SkillFirm" width={24} height={24} className="rounded" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  SkillFirm
                </span>
                <div className="flex items-center gap-1 -mt-1">
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  <span className="text-xs text-gray-500 font-medium">AI-Powered</span>
                </div>
              </div>
            </Link>
            <div className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                    pathname === item.href 
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
              <div className="ml-4">
                <UserMenu />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-6 h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center transition-all duration-200",
                  pathname === item.href 
                    ? "text-blue-600" 
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 mb-1",
                  pathname === item.href && "drop-shadow-sm"
                )} />
                <span className="text-xs font-medium">{item.name === "AI Coach" ? "AI" : item.name}</span>
                {pathname === item.href && (
                  <div className="absolute bottom-0 w-8 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-full" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-16" />
    </>
  )
}
