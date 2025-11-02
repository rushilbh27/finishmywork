'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  StarIcon,
} from '@heroicons/react/24/outline'

import AuthRequired from '@/components/auth/AuthRequired'
import { PostTaskDialog } from '@/components/ui/post-task-dialog'
import { Button } from '@/components/ui/button'
import { GradientText } from '@/components/ui/gradient-text'
import { MetricAnimate } from '@/components/ui/metric-animate'
import { StatusChip } from '@/components/ui/status-chip'

/* ---------- Types ---------- */

interface UserStats {
  tasksPosted: number
  tasksCompleted: number
  totalEarnings: number
  avgRating: number
  reviewCount: number
  joinDate: string
}

interface RecentTask {
  id: string | number
  title: string
  status: string
  createdAt: string
  budget?: number | null
}

/* ---------- Helpers ---------- */

const formatINR = (n?: number | null) =>
  typeof n === 'number' && !Number.isNaN(n)
    ? n.toLocaleString('en-IN')
    : '—'

/* ---------- Page ---------- */

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([])
  const [loading, setLoading] = useState(true)

  // ❗ All hooks before any early returns
  const initials = useMemo(() => {
    const name = session?.user?.name ?? 'User'
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [session?.user?.name])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [router, status])

  useEffect(() => {
    if (session?.user?.id) void fetchUserData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const [statsRes, tasksRes] = await Promise.all([
        fetch('/api/user/stats', { cache: 'no-store' }),
        fetch('/api/user/recent-tasks', { cache: 'no-store' }),
      ])

      if (statsRes.ok) {
        const stats = (await statsRes.json()) as UserStats
        setUserStats(stats ?? null)
      } else {
        setUserStats(null)
      }

      if (tasksRes.ok) {
        const tasks = (await tasksRes.json()) as RecentTask[]
        setRecentTasks(Array.isArray(tasks) ? tasks : [])
      } else {
        setRecentTasks([])
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      setUserStats(null)
      setRecentTasks([])
    } finally {
      setLoading(false)
    }
  }

  /* ---------- Early loading/auth states ---------- */

  if (status === 'loading') {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-[color:var(--accent-from)]" />
      </div>
    )
  }

  if (!session) {
    return <AuthRequired />
  }

  /* ---------- Main ---------- */

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-background pb-16 pt-2">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        {/* Profile Header Card */}
        <section className="rounded-2xl border border-border/60 bg-card/95 p-8 shadow-card backdrop-blur-2xl">
          <div className="flex items-center gap-4">
            {session.user && (session.user as any).avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={(session.user as any).avatar as string}
                alt={session.user.name ?? 'Profile avatar'}
                className="h-20 w-20 rounded-2xl border border-border/70 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border/70 bg-gradient-accent text-2xl font-semibold text-white">
                {initials}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-foreground">{session.user?.name ?? 'User'}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{session.user?.email ?? ''}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Computer Science major passionate about helping fellow students
              </p>
            </div>
          </div>

          {/* Skills/Tags */}
          <div className="mt-6 flex flex-wrap gap-2">
            {['Programming', 'Mathematics', 'Physics'].map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-border/70 bg-surface/60 px-3 py-1 text-xs font-medium text-foreground"
              >
                {skill}
              </span>
            ))}
          </div>

          {/* Stats Row */}
          {userStats && (
            <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                {
                  icon: StarIcon,
                  value: Number(userStats.avgRating ?? 0).toFixed(1),
                  label: 'Rating',
                },
                {
                  icon: ClipboardDocumentListIcon,
                  value: userStats.tasksCompleted ?? 0,
                  label: 'Tasks Completed',
                },
                {
                  icon: CurrencyDollarIcon,
                  value: `₹${formatINR(userStats.totalEarnings)}`,
                  label: 'Earnings',
                },
                {
                  icon: ChatBubbleLeftRightIcon,
                  value: userStats.reviewCount ?? 0,
                  label: 'Reviews',
                },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="text-center">
                  <div className="mb-2 flex justify-center">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-semibold text-foreground">{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Reviews Section */}
        <section className="rounded-2xl border border-border/60 bg-card/95 p-6 shadow-card backdrop-blur-2xl">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Reviews (3)</h2>
          
          <div className="space-y-4">
            {[
              {
                initials: 'SC',
                name: 'Sarah Chen',
                date: '10/5/2025',
                rating: 5,
                comment: 'Excellent work! Very detailed explanations and completed ahead of schedule.',
              },
              {
                initials: 'MR',
                name: 'Mike Rodriguez',
                date: '9/28/2025',
                rating: 4,
                comment: 'Good help, but could have been more responsive to messages.',
              },
              {
                initials: 'ET',
                name: 'Emma Thompson',
                date: '9/20/2025',
                rating: 5,
                comment: 'Amazing tutor! Really understood the concepts and explained them well.',
              },
            ].map((review) => (
              <div
                key={review.name}
                className="flex gap-4 rounded-xl border border-border/60 bg-surface/70 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-surface text-sm font-semibold text-foreground">
                  {review.initials}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">{review.name}</p>
                    <p className="text-xs text-muted-foreground">{review.date}</p>
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <StarIcon key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
