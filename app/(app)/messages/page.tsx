"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { ChevronLeftIcon, MessageSquareIcon, SearchIcon } from "lucide-react"

import { InlineTaskChat } from "@/components/chat/InlineTaskChat"
import { Input } from "@/components/ui/input"
import { StatusChip } from "@/components/ui/status-chip"
import { cn } from "@/lib/utils"
import { useSocket } from "@/hooks/useSocket"

interface TaskThread {
  id: number
  title: string
  status: string
  lastMessage?: {
    content: string
    createdAt: string
    isOwn: boolean
  } | null
  partner: {
    id: number
    name: string
  }
  isPoster: boolean
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const initialTaskId = searchParams.get("taskId")

  const [threads, setThreads] = useState<TaskThread[]>([])
  const [activeTaskId, setActiveTaskId] = useState<number | null>(
    initialTaskId ? parseInt(initialTaskId, 10) : null,
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [showListOnMobile, setShowListOnMobile] = useState(true)
  const { socket, connected } = useSocket(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000')

  useEffect(() => {
    if (session?.user?.id) void fetchThreads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id])

  const fetchThreads = async () => {
    try {
      const res = await fetch("/api/chat/threads", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load threads")
      const data = (await res.json()) as TaskThread[]
      setThreads(Array.isArray(data) ? data : [])
      if (!activeTaskId && data.length > 0) {
        setActiveTaskId(data[0].id)
        setShowListOnMobile(false)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Live updates for threads: remove if user is no longer participant, update status otherwise
  useEffect(() => {
    if (!socket || !connected || !session?.user?.id) return
    const userId = parseInt(String(session.user.id), 10)

    const onTaskUpdated = (payload: { task?: any }) => {
      const updated = payload?.task
      if (!updated) return
      setThreads((prev) => {
        const isParticipant = updated.posterId === userId || updated.accepterId === userId
        const exists = prev.some((t) => t.id === updated.id)
        if (!exists) return prev
        if (!isParticipant) {
          // If we lost access (e.g., unassigned as accepter), remove the thread
          const next = prev.filter((t) => t.id !== updated.id)
          if (activeTaskId === updated.id) {
            setActiveTaskId(null)
            setShowListOnMobile(true)
          }
          return next
        }
        // Still a participant: update status and title if changed
        return prev.map((t) => (t.id === updated.id ? { ...t, status: updated.status, title: updated.title ?? t.title } : t))
      })
    }

    const onTaskDeleted = (payload: { taskId?: number | string }) => {
      const idVal = payload?.taskId
      if (idVal == null) return
      const id = typeof idVal === 'string' ? parseInt(idVal, 10) : idVal
      setThreads((prev) => {
        const next = prev.filter((t) => t.id !== id)
        if (activeTaskId === id) {
          setActiveTaskId(null)
          setShowListOnMobile(true)
        }
        return next
      })
    }

    socket.on('task:updated', onTaskUpdated)
    socket.on('task:deleted', onTaskDeleted)

    return () => {
      socket.off('task:updated', onTaskUpdated)
      socket.off('task:deleted', onTaskDeleted)
    }
  }, [socket, connected, session?.user?.id, activeTaskId])

  const filteredThreads = useMemo(() => {
    if (!searchQuery) return threads
    const q = searchQuery.toLowerCase()
    return threads.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.partner.name.toLowerCase().includes(q) ||
        (t.lastMessage?.content || "").toLowerCase().includes(q),
    )
  }, [threads, searchQuery])

  const activeThread = threads.find((t) => t.id === activeTaskId) || null

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-[color:var(--accent-from)]" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex bg-background overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: !showListOnMobile && typeof window !== "undefined" && window.innerWidth < 1024 ? 0 : 320,
          opacity: !showListOnMobile && typeof window !== "undefined" && window.innerWidth < 1024 ? 0 : 1,
        }}
        className={cn("flex flex-col h-full min-h-0 overflow-auto border-r border-border/40 bg-card/80 backdrop-blur-xl")}
      >
        <div className="space-y-3 border-b border-border/40 p-4">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold text-foreground">Messages</h1>
          </div>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="rounded-xl border-border/40 bg-surface/50 pl-9 text-sm"
            />
          </div>
        </div>
        
  <div className="flex-1 min-h-0 overflow-auto">
          {filteredThreads.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="mb-3 rounded-full bg-surface/60 p-4">
                <MessageSquareIcon className="size-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No conversations yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Accept a task to start chatting</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredThreads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => {
                    setActiveTaskId(thread.id)
                    setShowListOnMobile(false)
                  }}
                  className={cn(
                    "w-full rounded-xl p-3 mb-2 text-left transition-all duration-200",
                    "hover:bg-surface/60",
                    activeTaskId === thread.id ? "bg-gradient-accent/20 border border-[color:var(--accent-from)]/30" : "hover:bg-surface/40",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-accent text-white text-sm font-semibold">
                        {thread.partner.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-green-400"></div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-semibold text-foreground">{thread.partner.name}</p>
                        <StatusChip status={thread.status} size="sm" />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{thread.title}</p>
                      {thread.lastMessage && (
                        <div className="mt-1 flex items-center gap-2">
                          <p className="flex-1 truncate text-xs text-muted-foreground">
                            {thread.lastMessage.isOwn && "You: "}
                            {thread.lastMessage.content}
                          </p>
                          <time className="text-[10px] text-muted-foreground/70">
                            {new Date(thread.lastMessage.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                          </time>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.aside>

      {/* Chat Area */}
      <main className="flex flex-1 flex-col min-h-0 h-full overflow-hidden">
        {activeThread ? (
          <>
            <header className="border-b border-border/40 bg-card/80 px-6 py-4 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowListOnMobile(true)}
                  className="-ml-2 rounded-xl p-2 transition hover:bg-surface/60 lg:hidden"
                >
                  <ChevronLeftIcon className="size-5 text-foreground" />
                </button>
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-accent text-white text-sm font-semibold">
                    {activeThread.partner.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{activeThread.partner.name}</p>
                  </div>
                </div>
                <StatusChip status={activeThread.status} />
              </div>
            </header>
            <div className="flex-1 flex min-h-0 h-full bg-gradient-to-b from-background/50 to-background">
              <InlineTaskChat taskId={activeThread.id} partnerName={activeThread.partner.name} />
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-6 rounded-2xl bg-gradient-accent/10 p-8">
              <MessageSquareIcon className="size-16 text-[color:var(--accent-from)]" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-foreground">Welcome to Messages</h2>
            <p className="max-w-sm text-sm text-muted-foreground">Select a conversation from the sidebar to start chatting with your study partners.</p>
          </div>
        )}
      </main>
    </div>
  )
}
