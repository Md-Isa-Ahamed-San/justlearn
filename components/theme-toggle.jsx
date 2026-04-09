"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Palette } from "lucide-react"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {/* Main button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
      >
        <Palette className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-secondary animate-pulse" />
      </button>

      {/* Theme options */}
      <div
        className={cn(
          "absolute bottom-20 left-0 flex flex-col gap-3 transition-all duration-300",
          isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-5 pointer-events-none",
        )}
      >
        <button
          onClick={() => {
            setTheme("light")
            setIsOpen(false)
          }}
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-90",
            theme === "light" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          <Sun className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            setTheme("dark")
            setIsOpen(false)
          }}
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-90",
            theme === "dark" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          <Moon className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
