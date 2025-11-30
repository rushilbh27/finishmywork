"use client"

import { useState, useEffect } from 'react'
import { useRealtime } from '@/hooks/useRealtime'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeftIcon,
  UserIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  MapPinIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { getLocationLabel } from '@/lib/constants'
import { InlineTaskChat } from '@/components/chat/InlineTaskChat'
import { GradientText } from '@/components/ui/gradient-text'
import { ReviewForm } from '@/components/ReviewForm'
import ReviewModal from '@/components/ReviewModal'
import { ReviewList } from '@/components/ReviewList'
import { useToast } from '@/components/ui/use-toast'
import { ToastAction } from '@/components/ui/toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { StatusChip } from '@/components/ui/status-chip'
import Lightbox from 'yet-another-react-lightbox'
import Download from 'yet-another-react-lightbox/plugins/download'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'
import { motion } from 'framer-motion'
import { isImage, fileIcon } from '@/lib/fileIcons'
import { ReportDialog } from '@/components/ReportDialog'
import { BlockUserButton } from '@/components/BlockUserButton'

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
  mediaUrls?: string[]
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
  const { toast } = useToast()
  const router = useRouter()
  const { on: onRealtime } = useRealtime() // Move hook to top before any conditional returns
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [acceptingTask, setAcceptingTask] = useState(false)
  const [completingTask, setCompletingTask] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [shouldPromptReview, setShouldPromptReview] = useState(false)
  const [promptToastShown, setPromptToastShown] = useState(false)
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
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  
  const handleUnassignTask = () => {
    setShowUnassignConfirm(true)
  }

  const confirmUnassignTask = async () => {
    if (unassigningTask) return
    setUnassigningTask(true)
    setShowUnassignConfirm(false)
    
    // Determine if current user is accepter
    const sessionUserId = session?.user?.id ? String(session.user.id) : null
    const userIsAccepter = task?.accepter?.id?.toString() === sessionUserId
    
    try {
      const response = await fetch(`/api/tasks/${params.id}/unassign`, {
        method: 'PATCH',
      })
      if (response.ok) {
        if (userIsAccepter) {
          toast({ title: 'You have withdrawn from the task. It is now open for others to accept.', variant: 'success' })
        } else {
          // exact poster message per spec
          toast({ title: 'Task was unassigned by poster', variant: 'success' })
        }
        await fetchTask()
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to unassign task' }))
        toast({ title: errorData.message || 'Failed to unassign task', variant: 'destructive' })
        console.error('Unassign task error:', errorData)
      }
    } catch (error) {
      console.error('Unassign task error:', error)
      toast({ title: 'Network error. Please check your connection and try again.', variant: 'destructive' })
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
        toast({ title: 'Task deleted successfully!', variant: 'success' })
        window.location.href = isAdmin ? '/admin/tasks' : '/tasks'
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete task' }))
        toast({ title: errorData.message || 'Failed to delete task', variant: 'destructive' })
        console.error('Delete task error:', errorData)
      }
    } catch (error) {
      console.error('Delete task error:', error)
  toast({ title: 'Network error. Please check your connection and try again.', variant: 'destructive' })
    } finally {
      setDeletingTask(false)
    }
  }

  useEffect(() => {
    fetchTask()
  }, [params.id])

  // Fetch reviews for poster/accepter (partner) when task loads
  useEffect(() => {
    const fetchReviewsForPartner = async () => {
      if (!task) return
      const currentUserId = session?.user?.id ? String(session.user.id) : null
      // Determine partnerId based on who the current user is in the task
      let partnerId: string | null = null
      if (currentUserId) {
        if (String(task.poster.id) === currentUserId) {
          partnerId = task.accepter?.id ? String(task.accepter.id) : null
        } else if (task.accepter && String(task.accepter.id) === currentUserId) {
          partnerId = String(task.poster.id)
        }
      }

      if (!partnerId) {
        // nothing to fetch
        setShowReviewForm(false)
        return
      }

      try {
        const response = await fetch(`/api/reviews?userId=${partnerId}`)
        if (!response.ok) return
        const data = await response.json()
        setReviews(data.reviews || [])
        setAverageRating(data.averageRating ?? 0)
        setTotalReviews(data.totalReviews ?? 0)

        // Determine if current user already left a review for this task
        if (currentUserId) {
          const already = (data.reviews || []).some((r: any) => r.reviewer?.id === currentUserId && String(r.taskId) === String(task.id))
          const eligible = (task.status === 'COMPLETED') && (String(task.poster.id) === currentUserId || (task.accepter && String(task.accepter.id) === currentUserId))
          // Instead of auto-opening the modal, set a prompt flag so we can show a toast-first CTA
          setShouldPromptReview(Boolean(eligible && !already))
        } else {
          setShouldPromptReview(false)
        }
      } catch (err) {
        console.error('Failed to fetch reviews for partner:', err)
      }
    }

    fetchReviewsForPartner()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task, session])

  // Show a one-time toast-first prompt when eligible to review
  useEffect(() => {
    if (shouldPromptReview && !promptToastShown) {
      setPromptToastShown(true)

      const partnerName = task ? (String(task.poster.id) === String(session?.user?.id) ? (task.accepter?.name ?? null) : (task.poster.name ?? null)) : null

      const t = toast({
        title: '🎯 Task complete!',
        description: `Share feedback with ${partnerName ?? 'your partner'}`,
        action: (
          <ToastAction altText="Leave review" asChild>
            <button
              onClick={() => {
                setShowReviewForm(true)
                t.dismiss()
              }}
              className="inline-flex items-center rounded-md bg-[color:var(--accent-from)] px-3 py-1 text-sm font-medium text-white"
            >
              Leave review
            </button>
          </ToastAction>
        ),
        variant: 'default',
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldPromptReview, promptToastShown, task, session])

  // Listen for review-created events and refresh reviews in real-time
  useEffect(() => {
    if (!task) return
    const unsubscribe = onRealtime('review:created', (event) => {
      // event has shape: { type: 'review:created', data: { taskId, review, ... } }
      // accept both string/number comparison
      // @ts-ignore
      const taskId = event?.data?.taskId
      if (!taskId) return
      if (String(taskId) === String(task.id)) {
        ;(async () => {
          try {
            const currentUserId = session?.user?.id ? String(session.user.id) : null
            let partnerToFetch: string | null = null
            if (currentUserId) {
              if (String(task.poster.id) === currentUserId) {
                partnerToFetch = task.accepter?.id ? String(task.accepter.id) : null
              } else {
                partnerToFetch = String(task.poster.id)
              }
            }
            if (!partnerToFetch) return
            const res = await fetch(`/api/reviews?userId=${partnerToFetch}`)
            if (res.ok) {
              const d = await res.json()
              setReviews(d.reviews || [])
              setAverageRating(d.averageRating ?? 0)
              setTotalReviews(d.totalReviews ?? 0)
            }
          } catch (err) {
            console.error('Error fetching reviews after realtime event', err)
          }
        })()
      }
    })

    return unsubscribe
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task, onRealtime])

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
  toast({ title: 'Task accepted — chat opened', variant: 'success' })

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
  toast({ title: errorData.message || 'Failed to accept task', variant: 'destructive' })
        console.error('Accept task error:', errorData)
        return
      }

      // Sync actual task in background (no UI wait)
      fetchTask()
    } catch (error) {
      console.error('Accept task error:', error)
      setAcceptedOptimistic(false)
      setChatForceOpen(false)
  toast({ title: 'Network error. Please check your connection and try again.', variant: 'destructive' })
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
  toast({ title: 'Task marked as completed!', variant: 'success' })
        await fetchTask()
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to complete task' }))
  toast({ title: errorData.message || 'Failed to complete task', variant: 'destructive' })
        console.error('Complete task error:', errorData)
      }
    } catch (error) {
      console.error('Complete task error:', error)
  toast({ title: 'Network error. Please check your connection and try again.', variant: 'destructive' })
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
  const sessionUserId = session?.user?.id ? String(session.user.id) : null
  const isPoster = task.poster.id?.toString() === sessionUserId
  const isAccepter = task.accepter?.id?.toString() === sessionUserId
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
  const partnerId = isPoster ? (task.accepter?.id?.toString() ?? null) : (task.poster.id?.toString() ?? null)

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
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-semibold text-foreground">{task.title}</h1>
                    {!isPoster && session?.user && (
                      <ReportDialog 
                        type="TASK" 
                        taskId={task.id.toString()} 
                        triggerLabel="Report task" 
                        triggerVariant="ghost" 
                      />
                    )}
                  </div>
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

              {/* Attachments Section */}
              {task.mediaUrls && task.mediaUrls.length > 0 && (
                <div className="mb-6 rounded-xl border border-border/60 bg-surface/70 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-foreground">Attachments ({task.mediaUrls.length})</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {task.mediaUrls.map((url, idx) => {
                      const imageUrl = isImage(url) ? url : null
                      const imageIndex = imageUrl ? (task.mediaUrls || []).filter(isImage).indexOf(url) : -1
                      
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: idx * 0.05 }}
                          className="group relative aspect-square rounded-lg overflow-hidden border border-border/50 bg-surface/60 cursor-pointer hover:ring-2 hover:ring-purple-500/50 transition-all"
                          onClick={() => {
                            if (imageUrl) {
                              setLightboxIndex(imageIndex)
                              setLightboxOpen(true)
                            } else {
                              window.open(url, '_blank')
                            }
                          }}
                        >
                          {imageUrl ? (
                            <>
                              <img
                                src={url}
                                alt={`Attachment ${idx + 1}`}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">View</span>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                              <span className="text-4xl">{fileIcon(url)}</span>
                              <span className="text-xs text-muted-foreground px-2 text-center">Click to view</span>
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const link = document.createElement('a')
                              link.href = url
                              link.download = url.split('/').pop() || 'download'
                              link.target = '_blank'
                              link.rel = 'noopener noreferrer'
                              document.body.appendChild(link)
                              link.click()
                              document.body.removeChild(link)
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                            title="Download"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                          </button>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )}

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
                <InlineTaskChat taskId={String(task.id)} partnerName={partnerName} partnerId={partnerId} preview />
              </div>
            )}
          </div>

            {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/60 bg-card/85 p-5 shadow-card backdrop-blur-2xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Task poster</h3>
                {!isPoster && session?.user && (
                  <div className="flex items-center gap-2">
                    <ReportDialog type="USER" reportedId={task.poster.id.toString()} triggerLabel="" triggerVariant="ghost" />
                    <BlockUserButton userId={task.poster.id.toString()} userName={task.poster.name} variant="ghost" />
                  </div>
                )}
              </div>
              <Link href={`/users/${task.poster.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-border/60 bg-surface/70 text-lg font-semibold text-foreground">
                  {task.poster.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-semibold text-foreground truncate hover:text-purple-400 transition-colors">{task.poster.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{task.poster.university}</div>
                  <div className="mt-1 flex items-center text-xs text-muted-foreground">
                    <span className="text-yellow-400">★</span>
                    <span className="ml-1">
                      {task.poster.rating.toFixed(1)} ({task.poster.reviewCount} reviews)
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {task.accepter && (
              <div className="rounded-2xl border border-border/60 bg-card/85 p-5 shadow-card backdrop-blur-2xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">Task accepter</h3>
                  {!isAccepter && session?.user && (
                    <div className="flex items-center gap-2">
                      <ReportDialog type="USER" reportedId={task.accepter.id.toString()} triggerLabel="" triggerVariant="ghost" />
                      <BlockUserButton userId={task.accepter.id.toString()} userName={task.accepter.name} variant="ghost" />
                    </div>
                  )}
                </div>
                <Link href={`/users/${task.accepter.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-border/60 bg-surface/70 text-lg font-semibold text-foreground">
                    {task.accepter.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-semibold text-foreground truncate hover:text-purple-400 transition-colors">{task.accepter.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{task.accepter.university}</div>
                    <div className="mt-1 flex items-center text-xs text-muted-foreground">
                      <span className="text-yellow-400">★</span>
                      <span className="ml-1">
                        {task.accepter.rating.toFixed(1)} ({task.accepter.reviewCount} reviews)
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {reviews.length > 0 && (
              <div className="rounded-2xl border border-border/60 bg-card/85 p-6 shadow-card backdrop-blur-2xl">
                <ReviewList reviews={reviews} averageRating={averageRating} totalReviews={totalReviews} />
              </div>
            )}
            {/* Show modal review prompt for poster/accepter when task completed and they haven't reviewed the partner yet */}
            {partnerId && (
              <ReviewModal
                open={Boolean(showReviewForm)}
                onOpenChange={(v) => setShowReviewForm(v)}
                taskId={task.id.toString()}
                receiverId={partnerId}
                partnerName={partnerName ?? ''}
                onSubmitted={async () => {
                  // Refresh reviews and hide form
                  try {
                    const res = await fetch(`/api/reviews?userId=${partnerId}`)
                    if (res.ok) {
                      const d = await res.json()
                      setReviews(d.reviews || [])
                      setAverageRating(d.averageRating ?? 0)
                      setTotalReviews(d.totalReviews ?? 0)
                    }
                  } catch (err) {
                    console.error('Error refreshing reviews after submit', err)
                  }
                  setShowReviewForm(false)
                }}
              />
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

      {/* Lightbox for viewing images */}
      {task?.mediaUrls && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          index={lightboxIndex}
          slides={task.mediaUrls.filter(isImage).map(url => ({ src: url }))}
          plugins={[Download, Zoom]}
          zoom={{
            maxZoomPixelRatio: 3,
            scrollToZoom: true
          }}
          download={{
            download: async ({ slide }) => {
              const a = document.createElement('a')
              a.href = slide.src
              a.download = slide.src.split('/').pop() || 'download'
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
            }
          }}
        />
      )}
    </div>
  )
}
