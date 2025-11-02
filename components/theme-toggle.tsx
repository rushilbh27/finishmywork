"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const root = document.documentElement
    if (isDark) root.classList.add("dark")
    else root.classList.remove("dark")
  }, [isDark])

  return (
    <Button
      variant="ghost"
      className="h-10 w-10 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setIsDark((v) => !v)}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-gray-700 dark:text-gray-300" />
      ) : (
        <Moon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
      )}
    </Button>
  )
}
