'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  UserIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import { getLocationLabel } from '@/lib/constants'
import { InlineTaskChat } from '@/components/chat/InlineTaskChat'
import { GradientText } from '@/components/ui/gradient-text'
import { ReviewForm } from '@/components/ReviewForm'
import { ReviewList } from '@/components/ReviewList'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { StatusChip } from '@/components/ui/status-chip'

interface Task {
  id: number
  title: string
  description: string
  subject: string
  deadline: string
  budget: number
  status: string
  location?: string
  latitude?: number
  longitude?: number
  createdAt: string
  poster: {
    id: number
    name: string
    university: string
    rating: number
    reviewCount: number
  }
  accepter?: {
    id: number
    name: string
    university: string
    rating: number
    reviewCount: number
  }
}

interface Review {
  id: string
  rating: number
  comment: string
  createdAt: string
  reviewer: {
    name: string
  }
}

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [acceptingTask, setAcceptingTask] = useState(false)
  const [completingTask, setCompletingTask] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [averageRating, setAverageRating] = useState<number>(0)
  const [totalReviews, setTotalReviews] = useState<number>(0)
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)
  const isAdmin = session?.user?.role === 'ADMIN'
  const [unassigningTask, setUnassigningTask] = useState(false)
  const [deletingTask, setDeletingTask] = useState(false)
  const [showUnassignConfirm, setShowUnassignConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  // PATCH: Optimistic Accept UX - local-only flags
  const [acceptedOptimistic, setAcceptedOptimistic] = useState(false)
  const [chatForceOpen, setChatForceOpen] = useState(false)
  
  const handleUnassignTask = () => {
    setShowUnassignConfirm(true)
  }

  const confirmUnassignTask = async () => {
    if (unassigningTask) return
    setUnassigningTask(true)
    setShowUnassignConfirm(false)
    
    // Determine if current user is accepter
    const sessionUserId = session?.user?.id ? parseInt(String(session.user.id)) : null
    const userIsAccepter = sessionUserId === task?.accepter?.id
    
    try {
      const response = await fetch(`/api/tasks/${params.id}/unassign`, {
        method: 'PATCH',
      })
      if (response.ok) {
        if (userIsAccepter) {
          toast.success('You have withdrawn from the task. It is now open for others to accept.')
        } else {
          // exact poster message per spec
          toast.success('Task was unassigned by poster')
        }
        await fetchTask()
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to unassign task' }))
        toast.error(errorData.message || 'Failed to unassign task')
        console.error('Unassign task error:', errorData)
      }
    } catch (error) {
      console.error('Unassign task error:', error)
      toast.error('Network error. Please check your connection and try again.')
    } finally {
      setUnassigningTask(false)
    }
  }

  const handleDeleteTask = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDeleteTask = async () => {
    if (deletingTask) return
    setDeletingTask(true)
    setShowDeleteConfirm(false)
    try {
      const url = isAdmin ? `/api/admin/tasks/${params.id}` : `/api/tasks/${params.id}`
      const response = await fetch(url, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Task deleted successfully!')
        window.location.href = isAdmin ? '/admin/tasks' : '/tasks'
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete task' }))
        toast.error(errorData.message || 'Failed to delete task')
        console.error('Delete task error:', errorData)
      }
    } catch (error) {
      console.error('Delete task error:', error)
      toast.error('Network error. Please check your connection and try again.')
    } finally {
      setDeletingTask(false)
    }
  }

  useEffect(() => {
    fetchTask()
  }, [params.id])

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setTask(data)
      }
    } catch (error) {
      console.error('Error fetching task:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptTask = () => {
    if (!session?.user?.id) {
      router.push('/auth/signin')
      return
    }
    setShowAcceptConfirm(true)
  }

  const confirmAcceptTask = async () => {
    if (acceptingTask) return // Prevent double clicks

    // PATCH: Optimistic Accept UX — instant feedback and chat open, no wait
    setAcceptingTask(true)
    setShowAcceptConfirm(false)
    setAcceptedOptimistic(true)
    setChatForceOpen(true)
    toast.success('Task accepted — chat opened')

    try {
      const response = await fetch(`/api/tasks/${params.id}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        // Revert on failure
        setAcceptedOptimistic(false)
        setChatForceOpen(false)
        const errorData = await response.json().catch(() => ({ message: 'Failed to accept task' }))
        toast.error(errorData.message || 'Failed to accept task')
        console.error('Accept task error:', errorData)
        return
      }

      // Sync actual task in background (no UI wait)
      fetchTask()
    } catch (error) {
      console.error('Accept task error:', error)
      setAcceptedOptimistic(false)
      setChatForceOpen(false)
      toast.error('Network error. Please check your connection and try again.')
    } finally {
      setAcceptingTask(false)
    }
  }

  const handleCompleteTask = () => {
    setShowCompleteConfirm(true)
  }

  const confirmCompleteTask = async () => {
    if (completingTask) return // Prevent double clicks

    setCompletingTask(true)
    setShowCompleteConfirm(false)
    try {
      const response = await fetch(`/api/tasks/${params.id}/complete`, {
        method: 'PATCH',
      })

      if (response.ok) {
        toast.success('Task marked as completed!')
        await fetchTask()
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to complete task' }))
        toast.error(errorData.message || 'Failed to complete task')
        console.error('Complete task error:', errorData)
      }
    } catch (error) {
      console.error('Complete task error:', error)
      toast.error('Network error. Please check your connection and try again.')
    } finally {
      setCompletingTask(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-[color:var(--accent-from)]" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Task not found</h1>
          <Link
            href="/tasks"
            className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card px-5 py-3 text-sm font-medium text-foreground transition hover:border-[color:var(--accent-from)]/60 hover:text-[color:var(--accent-from)]"
          >
            Back to tasks
          </Link>
        </div>
      </div>
    )
  }

  // Convert session user ID to number for comparison (NextAuth stores ID as string)
  const sessionUserId = session?.user?.id ? parseInt(String(session.user.id)) : null
  const isPoster = sessionUserId === task.poster.id
  const isAccepter = sessionUserId === task.accepter?.id
  const canAccept = !isAdmin && !isPoster && !task.accepter && task.status === 'OPEN'
  const canComplete = !isAdmin && isPoster && task.status === 'IN_PROGRESS'
  // Unassign: both poster AND accepter can unassign when task is IN_PROGRESS
  const canUnassign = !isAdmin && (isPoster || isAccepter) && task.status === 'IN_PROGRESS'
  // Edit/Delete: only poster when task is OPEN
  const canEdit = !isAdmin && isPoster && task.status === 'OPEN'
  const canDelete = !isAdmin && isPoster && task.status === 'OPEN'
  const canReview = (isPoster || isAccepter) && task.status === 'COMPLETED'
  const canOpenChat =
    (isPoster || isAccepter) && ['IN_PROGRESS', 'COMPLETED'].includes(task.status) && !!task.accepter
  // PATCH: Optimistic Accept UX — allow forced chat open during optimistic state
  const chatOpen = canOpenChat || chatForceOpen
  const partnerName = isPoster ? (task.accepter?.name ?? null) : (task.poster.name ?? null)

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-background">
  {/* PATCH: tighten top spacing to match browse page (pt-2) */}
  <div className="mx-auto max-w-6xl px-4 pb-16 pt-2 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href={isAdmin ? '/admin/tasks' : '/tasks'}
            className="inline-flex items-center text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to {isAdmin ? 'admin tasks' : 'tasks'}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Details */}
            <div className="rounded-2xl border border-border/60 bg-card/85 p-8 shadow-card backdrop-blur-2xl">
              <div className="mb-6 flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="mb-4 text-3xl font-semibold text-foreground">{task.title}</h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center rounded-full border border-border/70 bg-surface/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                      {task.subject}
                    </span>
                    <StatusChip status={task.status} />
                  </div>
                </div>

                <div className="ml-6 flex flex-col items-end rounded-xl bg-surface/40 px-4 py-3">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Budget</span>
                  <GradientText className="text-3xl font-semibold">
                    ₹{task.budget}
                  </GradientText>
                </div>
              </div>

              <div className="mb-6 rounded-xl border border-border/60 bg-surface/70 p-6">
                <h3 className="mb-3 text-lg font-semibold text-foreground">Description</h3>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{task.description}</p>
              </div>

              <div className="flex flex-col gap-4 border-t border-border/60 pt-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="w-full flex flex-col items-center">
                  <div className="flex flex-wrap items-center justify-center gap-6 mb-4 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 mr-2" />
                      <span>Posted by {task.poster.name}</span>
                    </div>
                    {task.location && (
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-2" />
                        <span>{getLocationLabel(task.location)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap w-full justify-center gap-4">
                  {
                    // PATCH: Optimistic Accept UX — show disabled "Accepted ✓" immediately
                    (acceptedOptimistic || (isAccepter && task.status === 'IN_PROGRESS')) ? (
                      <Button
                        disabled
                        variant="gradient"
                        className="flex items-center justify-center gap-2 min-w-[180px] max-w-[240px] rounded-xl px-6 py-3 text-base font-semibold"
                      >
                        Accepted ✓
                      </Button>
                    ) : (
                      canAccept && (
                        <Button
                          onClick={handleAcceptTask}
                          disabled={acceptingTask}
                          variant="gradient"
                          className="flex items-center justify-center gap-2 min-w-[180px] max-w-[240px] rounded-xl px-6 py-3 text-base font-semibold"
                        >
                          {acceptingTask ? (
                            <>
                              <div className="mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-current" />
                              Accepting…
                            </>
                          ) : (
                            'Accept Task'
                          )}
                        </Button>
                      )
                    )
                  }

                  {canComplete && (
                    <Button
                      onClick={handleCompleteTask}
                      disabled={completingTask}
                      variant="gradient"
                      className="flex items-center justify-center gap-2 min-w-[180px] max-w-[240px] rounded-xl px-6 py-3 text-base font-semibold"
                    >
                      {completingTask ? (
                        <>
                          <div className="mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-current" />
                          Completing…
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="mr-3 h-5 w-5" />
                          Mark as completed
                        </>
                      )}
                    </Button>
                  )}

                  {canUnassign && (
                    <Button
                      onClick={handleUnassignTask}
                      disabled={unassigningTask}
                      variant="destructive"
                      className="flex items-center justify-center gap-2 min-w-[180px] max-w-[240px] rounded-xl px-6 py-3 text-base font-semibold"
                    >
                      {unassigningTask ? (
                        <>
                          <div className="mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-current" />
                          {isAccepter ? 'Withdrawing…' : 'Unassigning…'}
                        </>
                      ) : (
                        isAccepter ? 'Withdraw' : 'Unassign Task'
                      )}
                    </Button>
                  )}

                  {canEdit && (
                    <Button
                      onClick={() => window.location.href = `/tasks/${task.id}/edit`}
                      variant="outline"
                      className="flex items-center justify-center gap-2 min-w-[180px] max-w-[240px] rounded-xl px-6 py-3 text-base font-semibold"
                    >
                      Edit Task
                    </Button>
                  )}

                  {canDelete && (
                    <Button
                      onClick={handleDeleteTask}
                      disabled={deletingTask}
                      variant="destructive"
                      className="flex items-center justify-center gap-2 min-w-[180px] max-w-[240px] rounded-xl px-6 py-3 text-base font-semibold"
                    >
                      {deletingTask ? (
                        <>
                          <div className="mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-current" />
                          Deleting…
                        </>
                      ) : (
                        'Delete task'
                      )}
                    </Button>
                  )}

                  {/* CORE UX FIX 3: Remove "Open Chat" button since chat auto-opens inline when IN_PROGRESS */}
                </div>
              </div>
            </div>
            </div>

            {/* CORE UX FIX 3: Auto-show chat when task is IN_PROGRESS - seamless UX like Fiverr */}
            {chatOpen && (
              <div className="rounded-2xl border border-border/60 bg-card/85 p-6 shadow-card backdrop-blur-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Chat with {partnerName}</h3>
                  <Link
                    href={`/messages?taskId=${task.id}`}
                    className="text-sm font-medium text-[color:var(--accent-from)] transition hover:text-[color:var(--accent-to)]"
                  >
                    Open full chat →
                  </Link>
                </div>
                <InlineTaskChat taskId={task.id} partnerName={partnerName} preview />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/60 bg-card/85 p-5 shadow-card backdrop-blur-2xl">
              <h3 className="text-sm font-semibold text-foreground mb-3">Task poster</h3>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-border/60 bg-surface/70 text-lg font-semibold text-foreground">
                  {task.poster.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-semibold text-foreground truncate">{task.poster.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{task.poster.university}</div>
                  <div className="mt-1 flex items-center text-xs text-muted-foreground">
                    <span className="text-yellow-400">★</span>
                    <span className="ml-1">
                      {task.poster.rating.toFixed(1)} ({task.poster.reviewCount} reviews)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {task.accepter && (
              <div className="rounded-2xl border border-border/60 bg-card/85 p-5 shadow-card backdrop-blur-2xl">
                <h3 className="text-sm font-semibold text-foreground mb-3">Task accepter</h3>
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-border/60 bg-surface/70 text-lg font-semibold text-foreground">
                    {task.accepter.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-semibold text-foreground truncate">{task.accepter.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{task.accepter.university}</div>
                    <div className="mt-1 flex items-center text-xs text-muted-foreground">
                      <span className="text-yellow-400">★</span>
                      <span className="ml-1">
                        {task.accepter.rating.toFixed(1)} ({task.accepter.reviewCount} reviews)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {reviews.length > 0 && (
              <div className="rounded-2xl border border-border/60 bg-card/85 p-6 shadow-card backdrop-blur-2xl">
                <ReviewList reviews={reviews} averageRating={averageRating} totalReviews={totalReviews} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unassign Task Confirmation */}
      <ConfirmDialog
        isOpen={showUnassignConfirm}
        onClose={() => setShowUnassignConfirm(false)}
        onConfirm={confirmUnassignTask}
        title={isPoster ? "Unassign Task" : "Withdraw from Task"}
        message={isPoster
          ? "This will remove current accepter and reopen task for others. This action cannot be undone."
          : "Are you sure you want to withdraw from this task? It will be reopened for others to accept."}
        confirmText={isPoster ? "Unassign Task" : "Withdraw"}
        variant="danger"
        isLoading={unassigningTask}
      />

      {/* Delete Task Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteTask}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete Task"
        variant="danger"
        isLoading={deletingTask}
      />

      {/* Accept Task Confirmation */}
      <ConfirmDialog
        isOpen={showAcceptConfirm}
        onClose={() => setShowAcceptConfirm(false)}
        onConfirm={confirmAcceptTask}
        title="Accept Task"
        message="Are you sure you want to accept this task? You will be responsible for completing it by the deadline."
        confirmText="Accept Task"
        variant="info"
        isLoading={acceptingTask}
      />

      {/* Complete Task Confirmation */}
      <ConfirmDialog
        isOpen={showCompleteConfirm}
        onClose={() => setShowCompleteConfirm(false)}
        onConfirm={confirmCompleteTask}
        title="Mark Task Complete"
        message="Are you sure you want to mark this task as completed? This action cannot be undone."
        confirmText="Mark Complete"
        variant="info"
        isLoading={completingTask}
      />
    </div>
  )
}
