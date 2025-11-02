"use client"

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useSession } from 'next-auth/react'
import {
  CalendarDaysIcon,
  MapPinIcon,
  MoreHorizontalIcon,
  UserIcon,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { StatusChip } from '@/components/ui/status-chip'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface TaskCardProps {
  task: {
    id: number
    title: string
    description: string
    subject: string
    deadline: string
    budget: number | string
    status: string
    location?: string
    poster?: {
      name?: string
      university?: string
    } | null
    posterId?: number
    accepterId?: number | null
    createdAt?: string
  }
  onTaskUpdate?: () => void
}

export default function TaskCard({ task, onTaskUpdate }: TaskCardProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [confirmOpen, setConfirmOpen] = useState<null | 'unassign' | 'complete' | 'delete'>(null)
  const [pending, setPending] = useState(false)

  // PATCH: Browse page should not accept directly – remove optimistic accept state

  const createdAt = task.createdAt ? new Date(task.createdAt) : null
  const createdLabel =
    createdAt && !Number.isNaN(createdAt.getTime())
      ? formatDistanceToNow(createdAt, { addSuffix: true })
      : 'just now'

  const userId = session?.user?.id ? Number.parseInt(String(session.user.id), 10) : null
  const isOwner = userId != null && task.posterId === userId
  const isAccepter = userId != null && task.accepterId === userId
  // CORE UX FIX 1: Account for optimistic acceptance state
  const canAccept = !isOwner && !isAccepter && task.status === 'OPEN' && !task.accepterId
  const canEdit = isOwner && task.status === 'OPEN'
  const canUnassign = (isOwner || isAccepter) && task.status === 'IN_PROGRESS'
  const canComplete = isOwner && task.status === 'IN_PROGRESS'
  const canDelete = isOwner && task.status === 'OPEN'

    const handleTaskAction = useCallback(
    async (action: 'unassign' | 'complete' | 'delete') => {
      try {
        let endpoint = `/api/tasks/${task.id}`
        let method = 'PATCH'

        switch (action) {
          case 'unassign':
            endpoint += '/unassign'
            break
          case 'complete':
            endpoint += '/complete'
            break
          case 'delete':
            method = 'DELETE'
            break
          default:
            return
        }

        setPending(true)
        const response = await fetch(endpoint, { method })
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.message || `Failed to ${action} task`)
        }
        // Success toasts by action
        if (action === 'unassign') {
          const userId = session?.user?.id ? Number.parseInt(String(session.user.id), 10) : null
          const isAccepterLocal = userId != null && task.accepterId === userId
          toast({
            title: isAccepterLocal ? 'Withdrawn from task' : 'Task was unassigned by poster',
            description: isAccepterLocal
              ? 'You have withdrawn. The task is now open for others.'
              : undefined,
          })
        } else if (action === 'complete') {
          toast({ title: 'Task marked complete' })
        } else if (action === 'delete') {
          toast({ title: 'Task deleted' })
        }
        
        onTaskUpdate?.()
      } catch (error) {
        console.error(error)
        toast({
          title: 'Unable to update task',
          description: error instanceof Error ? error.message : 'Try again later.',
          variant: 'destructive',
        })
      } finally {
        setPending(false)
        setConfirmOpen(null)
      }
    },
    [onTaskUpdate, session?.user?.id, task.accepterId, task.id, toast],
  )

  const renderBudget = () => {
    if (task.budget === 0) return 'Free'
    if (task.budget == null) return '—'
    try {
      return `₹ ${Number(task.budget).toLocaleString('en-IN')}`
    } catch {
      return '—'
    }
  }

  return (
    <Link href={`/tasks/${task.id}`} className="block h-full">
      <motion.article
        layout
        transition={{ type: 'spring', stiffness: 240, damping: 22 }}
        className={cn(
          'group flex h-full flex-col rounded-2xl border border-border/60 bg-card/80 p-6 shadow-card transition-all duration-300 cursor-pointer',
          'hover:-translate-y-1 hover:shadow-[0_40px_80px_-40px_rgba(129,140,248,0.45)]',
        )}
      >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center rounded-full border border-border/70 bg-surface/60 px-3 py-1 text-xs font-medium text-muted-foreground">
          {task.subject}
        </span>
        <StatusChip status={task.status} />
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <h3 className="text-lg font-semibold text-foreground transition group-hover:text-[color:var(--accent-from)]">
          {task.title}
        </h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {task.description || 'No description provided.'}
        </p>
      </div>

      <div className="mt-4 space-y-3 text-sm text-muted-foreground">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            <UserIcon className="size-4" />
            {task.poster?.name ?? 'Anonymous'}
          </span>
          <span className="inline-flex items-center gap-2">
            <CalendarDaysIcon className="size-4" />
            {createdLabel}
          </span>
        </div>

        {task.location && (
          <div className="flex items-center gap-2">
            <MapPinIcon className="size-4" />
            <span>{task.location}</span>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="bg-gradient-accent bg-clip-text text-lg font-semibold text-transparent">
          {renderBudget()}
        </span>

        <div className="flex items-center gap-2">
          {/* CORE UX FIX 1: Show optimistic accepted state or normal accept button */}
          {canAccept ? (
            <Button
              size="sm"
              variant="gradient"
              className="rounded-xl px-4 py-1.5"
              disabled={false}
              // PATCH: Browse page should not accept directly; open task page instead
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = `/tasks/${task.id}`
              }}
            >
              Accept
            </Button>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex size-9 items-center justify-center rounded-xl border border-border/50 bg-surface/60 transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-from)] disabled:pointer-events-none disabled:opacity-50"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              aria-label="Task options"
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[200px] rounded-xl border border-border/60 bg-card/95 backdrop-blur-2xl">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.location.href = `/tasks/${task.id}`
                }}
              >
                View details
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.location.href = `/tasks/${task.id}/edit`
                  }}
                >
                  Edit task
                </DropdownMenuItem>
              )}
              {canComplete && (
                <DropdownMenuItem onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setConfirmOpen('complete')
                }}>
                  Mark completed
                </DropdownMenuItem>
              )}
              {canUnassign && (
                <DropdownMenuItem onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setConfirmOpen('unassign')
                }}>
                  {isAccepter ? 'Withdraw' : 'Unassign task'}
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setConfirmOpen('delete')
                }}>
                  Delete task
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.article>
    {/* Confirm dialog reused for actions */}
    <ConfirmDialog
      isOpen={confirmOpen === 'unassign'}
      onClose={() => setConfirmOpen(null)}
      onConfirm={() => handleTaskAction('unassign')}
      title={isAccepter ? 'Withdraw from Task' : 'Unassign Task'}
      message={isAccepter
        ? 'Are you sure you want to withdraw from this task? It will be reopened for others to accept.'
        : 'This will remove current accepter and reopen task for others. This action cannot be undone.'}
      confirmText={isAccepter ? 'Withdraw' : 'Unassign Task'}
      variant="danger"
      isLoading={pending}
    />
    <ConfirmDialog
      isOpen={confirmOpen === 'complete'}
      onClose={() => setConfirmOpen(null)}
      onConfirm={() => handleTaskAction('complete')}
      title="Mark Task Complete"
      message="Are you sure you want to mark this task as completed? This action cannot be undone."
      confirmText="Mark Complete"
      variant="info"
      isLoading={pending}
    />
    <ConfirmDialog
      isOpen={confirmOpen === 'delete'}
      onClose={() => setConfirmOpen(null)}
      onConfirm={() => handleTaskAction('delete')}
      title="Delete Task"
      message="Are you sure you want to delete this task? This action cannot be undone."
      confirmText="Delete Task"
      variant="danger"
      isLoading={pending}
    />
    </Link>
  )
}
