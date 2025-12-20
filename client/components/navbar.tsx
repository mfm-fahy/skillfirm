"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Newspaper, ListChecks, Users, MessageSquare, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { UserMenu } from "./user-menu"

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Courses", href: "/courses", icon: BookOpen },
  { name: "News", href: "/news", icon: Newspaper },
  { name: "Daily Tasks", href: "/daily-tasks", icon: ListChecks },
  { name: "Community", href: "/community", icon: Users },
  { name: "Chat AI", href: "/chat-ai", icon: MessageSquare },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Top Bar - Avatar only */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-4">
          <Link href="/" className="text-xl font-bold" style={{ color: "#5170ff" }}>
            SkillFirm
          </Link>
          <UserMenu />
        </div>
      </nav>

      {/* Desktop Navbar - Top with text only */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold" style={{ color: "#5170ff" }}>
              SkillFirm
            </Link>
            <div className="flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-[#5170ff]",
                    pathname === item.href ? "text-[#5170ff]" : "text-gray-600",
                  )}
                >
                  {item.name}
                </Link>
              ))}
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navbar - Bottom with icons only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full transition-colors",
                  pathname === item.href ? "text-[#5170ff]" : "text-gray-600",
                )}
              >
                <Icon className="w-6 h-6" />
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
