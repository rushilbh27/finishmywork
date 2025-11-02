"use client"

import Link from "next/link"
import { Github, Instagram, Twitter } from "lucide-react"
import { useSession } from 'next-auth/react'

export function Footer() {
  const { data: session } = useSession()
  return (
    <footer className="mt-8">
      <div className="mx-auto max-w-6xl px-4 py-6 glass">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 text-sm">
          <div className="text-center md:text-left">
            <div className="font-semibold">
              <span className="gradient-text">FinishMyWork</span>
            </div>
            <p className="text-muted-foreground mt-1">Learn together. Earn together.</p>
          </div>

          <ul className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground">
            <li>
              <Link href="/tasks" className="hover:text-foreground transition-colors">
                Browse Tasks
              </Link>
            </li>
            <li>
              <Link href={session?.user?.id ? "/tasks/new" : "/auth/signin"} className="hover:text-foreground transition-colors">
                Post Task
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-foreground transition-colors">
                About
              </Link>
            </li>
            <li>
              <Link href="/help" className="hover:text-foreground transition-colors">
                Help
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </li>
          </ul>

          <div className="flex items-center gap-3">
            <Link
              href="https://twitter.com"
              aria-label="Twitter"
              className="p-2 rounded-lg hover:glow transition-shadow"
            >
              <Twitter className="h-4 w-4" />
            </Link>
            <Link href="https://github.com" aria-label="GitHub" className="p-2 rounded-lg hover:glow transition-shadow">
              <Github className="h-4 w-4" />
            </Link>
            <Link
              href="https://instagram.com"
              aria-label="Instagram"
              className="p-2 rounded-lg hover:glow transition-shadow"
            >
              <Instagram className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
