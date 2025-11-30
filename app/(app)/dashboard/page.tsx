'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  PlusIcon,
  StarIcon,
} from '@heroicons/react/24/outline'

import { PostTaskDialog } from '@/components/ui/post-task-dialog'
import { Button } from '@/components/ui/button'
import { GradientText } from '@/components/ui/gradient-text'
import { MetricAnimate } from '@/components/ui/metric-animate'

interface DashboardStats {
  postedTasks: number
  acceptedTasks: number
  totalEarnings: number
  averageRating: number
}

interface Task {
  id: number
  title: string
  description: string
  budget: number
  status: string
  deadline: string
  createdAt: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'working' | 'posted'>('working')
  const [tasks, setTasks] = useState<Task[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [router, status])

  useEffect(() => {
    if (session?.user?.id) {
      fetchStats()
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (session?.user?.id) {
      fetchTasks()
    }
  }, [session?.user?.id, activeTab])

  function pickTaskFields(src: any): Task {
    return {
      id: src.id,
      title: src.title,
      description: src.description,
      budget: src.budget,
      status: src.status,
      deadline: typeof src.deadline === 'string' ? src.deadline : new Date(src.deadline).toISOString(),
      createdAt: typeof src.createdAt === 'string' ? src.createdAt : new Date(src.createdAt).toISOString(),
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/user/stats')
      if (!response.ok) return
      const data = await response.json()
      setStats({
        postedTasks: data.tasksPosted,
        acceptedTasks: data.tasksCompleted,
        totalEarnings: data.totalEarnings,
        averageRating: data.avgRating,
      })
    } catch (error) {
      console.error('Failed to load dashboard stats', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTasks = async () => {
    setTasksLoading(true)
    try {
      const endpoint = activeTab === 'working' ? '/api/tasks/accepted' : '/api/tasks/posted'
      const response = await fetch(endpoint)
      if (!response.ok) {
        setTasks([])
        return
      }
      const data = await response.json()
      setTasks(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load tasks', error)
      setTasks([])
    } finally {
      setTasksLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-[color:var(--accent-from)]" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-background pb-16 pt-2">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <header className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">My Dashboard</h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Track your tasks, earnings, and progress
          </p>
        </header>

        {/* Metric Cards */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 md:gap-4">
          {[
            {
              label: 'Total Earnings',
              value: `₹${(stats?.totalEarnings ?? 0).toLocaleString('en-IN')}`,
              sublabel: 'From 0 completed tasks',
              icon: CurrencyDollarIcon,
            },
            {
              label: 'Tasks Completed',
              value: stats?.acceptedTasks ?? 0,
              sublabel: '24 reviews received',
              icon: ClipboardDocumentListIcon,
            },
            {
              label: 'In Progress',
              value: stats?.postedTasks ?? 0,
              sublabel: 'Active tasks',
              icon: ChatBubbleLeftRightIcon,
            },
            {
              label: 'Rating',
              value: stats?.averageRating ? stats.averageRating.toFixed(1) : '0.0',
              sublabel: 'Out of 5.0 stars',
              icon: StarIcon,
            },
          ].map(({ label, value, sublabel, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl border border-border/60 bg-card/95 p-5 md:p-6 shadow-card backdrop-blur-2xl transition hover:border-[color:var(--accent-from)]/40"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs md:text-sm font-medium text-foreground">{label}</p>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-2xl md:text-3xl font-semibold text-foreground">
                {typeof value === 'number' ? <MetricAnimate value={value} /> : value}
              </p>
              <p className="mt-1 text-[11px] md:text-xs text-muted-foreground">{sublabel}</p>
            </div>
          ))}
        </section>

        {/* Tasks Section */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <button
              onClick={() => setActiveTab('working')}
              className={`rounded-full px-3 md:px-4 py-2 text-sm font-medium transition ${
                activeTab === 'working'
                  ? 'bg-surface/80 text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tasks I'm Working On
            </button>
            <button
              onClick={() => setActiveTab('posted')}
              className={`rounded-full px-3 md:px-4 py-2 text-sm font-medium transition ${
                activeTab === 'posted'
                  ? 'bg-surface/80 text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tasks I Posted
            </button>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/95 p-4 md:p-6 shadow-card backdrop-blur-2xl">
            {tasksLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-[color:var(--accent-from)]" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'working'
                    ? "You haven't accepted any tasks yet. Browse available tasks to get started."
                    : "You haven't posted any tasks yet. Need help with an assignment?"}
                </p>
                {activeTab === 'posted' && (
                  <PostTaskDialog
                    trigger={
                      <Button variant="gradient" className="mt-4 rounded-xl px-5 md:px-6 py-2 font-semibold">
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Post a Task
                      </Button>
                    }
                  />
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 rounded-xl border border-border/60 bg-surface/70 p-4 transition hover:border-[color:var(--accent-from)]/60 hover:bg-surface/90"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{task.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {task.description}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 md:gap-4 text-xs text-muted-foreground">
                        <span>Deadline: {new Date(task.deadline).toLocaleDateString()}</span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-surface/60 px-2 py-0.5">
                          {task.status.toLowerCase().replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-base md:text-lg font-semibold text-[color:var(--accent-from)]">
                        ₹{task.budget.toLocaleString('en-IN')}
                      </p>
                      <span className="mt-1 inline-block text-xs text-muted-foreground">View Details</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
