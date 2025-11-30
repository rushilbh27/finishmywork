'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRealtime } from '@/hooks/useRealtime'
import { useToast } from '@/components/ui/use-toast'
import { ToastAction } from '@/components/ui/toast'
import Link from 'next/link'

interface Notification {
  id: string
  userId: string
  type: string
  title: string
  body: string
  link?: string | null
  readAt?: Date | null
  createdAt: Date | string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  markAllAsRead: () => Promise<void>
  refreshNotifications: () => Promise<void>
  pushNotification?: (n: Notification) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { connected, on } = useRealtime()
  const { toast } = useToast()

  const fetchNotifications = async () => {
    if (!session?.user?.id) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        // Ensure data is always an array
        setNotifications(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setNotifications([]) // Set empty array on error
    } finally {
      setIsLoading(false)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read', {
        method: 'PATCH',
      })
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, readAt: new Date() }))
        )
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  const refreshNotifications = async () => {
    await fetchNotifications()
  }

const unreadCount = Array.isArray(notifications)
  ? notifications.filter(n => !n.readAt).length
  : 0

  // Fetch notifications once when SSE connects for the first time.
  useEffect(() => {
    if (!session?.user?.id) return
    if (connected) {
      // Load existing notifications once on connect
      fetchNotifications()
    }
  }, [session?.user?.id, connected])

  // NOTE: No polling — rely on SSE for real-time updates. If you want a fallback,
  // reintroduce a poller here. Current behavior: load once on SSE connect, then
  // live updates via realtime events.

  // Real-time listeners for notifications and major events
  useEffect(() => {
    if (!session?.user?.id) return

    const unsubscribes: Array<() => void> = []

    // Notification events (explicit server-side created notifications)
    unsubscribes.push(
      on('notification', (event) => {
        if (event.type !== 'notification') return
        const notification = event.data as Notification
        setNotifications(prev => [notification, ...prev].slice(0, 30))
        const action = notification.link ? (
          <ToastAction altText="View notification" asChild>
            <a href={notification.link} className="inline-flex items-center rounded-md bg-[color:var(--accent-from)] px-3 py-1 text-sm font-medium text-white">View</a>
          </ToastAction>
        ) : undefined
        toast({ title: notification.title, description: notification.body, duration: 5000, action })
      })
    )

    // Task created (listen for both possible event names)
    const handleTaskCreated = (event: any) => {
      const data = event.data?.task || event.data
      const title = `🆕 New task posted: ${data?.title ?? 'New task'}`
      const body = 'Click to view task details'
      const link = `/tasks/${data?.id}`
      const notification = {
        id: `task-created-${Date.now()}`,
        userId: session.user.id,
        type: 'TASK_CREATED',
        title,
        body,
        link,
        createdAt: new Date(),
      }
      setNotifications(prev => [notification as Notification, ...prev].slice(0, 30))
      const action = (
        <ToastAction altText="View task" asChild>
          <a href={link} className="inline-flex items-center rounded-md bg-[color:var(--accent-from)] px-3 py-1 text-sm font-medium text-white">View</a>
        </ToastAction>
      )
      toast({ title, description: body, duration: 5000, action })
    }

    unsubscribes.push(on('task:created', handleTaskCreated))
    unsubscribes.push(on('created', handleTaskCreated))

    // Task accepted — notify poster
    const handleTaskAccepted = (event: any) => {
      const payload = event.data?.task || event.data
      const accepter = payload?.accepter || payload?.data?.accepter
      const poster = payload?.poster || payload?.data?.poster
      const title = `✅ ${accepter?.name || 'Someone'} accepted your task!`
      const body = 'You can now chat and collaborate.'
      const link = `/tasks/${payload?.id || payload?.taskId}`
      const notification = {
        id: `task-accepted-${Date.now()}`,
        userId: poster?.id || poster?.userId || session.user.id,
        type: 'TASK_ACCEPTED',
        title,
        body,
        link,
        createdAt: new Date(),
      }
      setNotifications(prev => [notification as Notification, ...prev].slice(0, 30))
      const action = (
        <ToastAction altText="View task" asChild>
          <a href={link} className="inline-flex items-center rounded-md bg-[color:var(--accent-from)] px-3 py-1 text-sm font-medium text-white">View</a>
        </ToastAction>
      )
      toast({ title, description: body, duration: 5000, action })
    }

    unsubscribes.push(on('task:accepted', handleTaskAccepted))
    unsubscribes.push(on('accepted', handleTaskAccepted))

    // Task completed — notify both parties
    const handleTaskCompleted = (event: any) => {
      const payload = event.data?.task || event.data
      const title = `🎯 Task completed successfully!`
      const body = 'You can now leave a review.'
      const link = `/tasks/${payload?.id || payload?.taskId}`
      const notification = {
        id: `task-completed-${Date.now()}`,
        userId: session.user.id,
        type: 'TASK_COMPLETED',
        title,
        body,
        link,
        createdAt: new Date(),
      }
      setNotifications(prev => [notification as Notification, ...prev].slice(0, 30))
      const action = (
        <ToastAction altText="View task" asChild>
          <a href={link} className="inline-flex items-center rounded-md bg-[color:var(--accent-from)] px-3 py-1 text-sm font-medium text-white">View</a>
        </ToastAction>
      )
      toast({ title, description: body, duration: 5000, action })
    }

    unsubscribes.push(on('task:completed', handleTaskCompleted))
    unsubscribes.push(on('completed', handleTaskCompleted))

    // New message (task participants)
    const handleMessage = (event: any) => {
      const payload = event.data?.message || event.data
      const sender = payload?.sender || payload?.data?.sender
      
      // Don't notify if this is your own message
      if (sender?.id === session.user.id || payload?.senderId === session.user.id) {
        return
      }
      
      const title = `💬 New message from ${sender?.name || 'Someone'}`
      const body = 'Tap to open chat.'
      const link = `/messages?task=${payload?.taskId}`
      const notification = {
        id: `message-${Date.now()}`,
        userId: session.user.id,
        type: 'NEW_MESSAGE',
        title,
        body,
        link,
        createdAt: new Date(),
      }
      setNotifications(prev => [notification as Notification, ...prev].slice(0, 30))
      const action = (
        <ToastAction altText="Open chat" asChild>
          <a href={link} className="inline-flex items-center rounded-md bg-[color:var(--accent-from)] px-3 py-1 text-sm font-medium text-white">Open</a>
        </ToastAction>
      )
      toast({ title, description: body, duration: 5000, action })
    }

    unsubscribes.push(on('message', handleMessage))
    unsubscribes.push(on('message:created', handleMessage))

    // Review created — notify receiver
    const handleReviewCreated = (event: any) => {
      const payload = event.data || event.data?.review || event
      const rating = payload?.review?.rating || payload?.rating
      const reviewerName = payload?.reviewer?.name || payload?.reviewerName || 'Someone'
      const title = `⭐ You received a ${rating}-star review from ${reviewerName}!`
      const body = 'Check your profile to see it.'
      const link = `/profile`
      const notification = {
        id: `review-${Date.now()}`,
        userId: session.user.id,
        type: 'TASK_REVIEW',
        title,
        body,
        link,
        createdAt: new Date(),
      }
      setNotifications(prev => [notification as Notification, ...prev].slice(0, 30))
      const action = (
        <ToastAction altText="View profile" asChild>
          <a href={link} className="inline-flex items-center rounded-md bg-[color:var(--accent-from)] px-3 py-1 text-sm font-medium text-white">View</a>
        </ToastAction>
      )
      toast({ title, description: body, duration: 5000, action })
    }

    unsubscribes.push(on('review:created', handleReviewCreated))

    // Waitlist approved (admin) — notify approved user
    const handleWaitlistApproved = (event: any) => {
      const payload = event.data || {}
      const title = `🎟️ You’ve been invited to join FinishMyWork!`
      const body = 'Click to set up your account.'
      const link = '/auth/signup'
      const notification = {
        id: `waitlist-${Date.now()}`,
        userId: session.user.id,
        type: 'SYSTEM_ALERT',
        title,
        body,
        link,
        createdAt: new Date(),
      }
      setNotifications(prev => [notification as Notification, ...prev].slice(0, 30))
      const action = (
        <ToastAction altText="Set up account" asChild>
          <a href={link} className="inline-flex items-center rounded-md bg-[color:var(--accent-from)] px-3 py-1 text-sm font-medium text-white">Set up</a>
        </ToastAction>
      )
      toast({ title, description: body, duration: 5000, action })
    }

    unsubscribes.push(on('waitlist:approved', handleWaitlistApproved))

    return () => {
      unsubscribes.forEach((unsub) => unsub())
    }
  }, [session?.user?.id, on, toast, connected])

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    markAllAsRead,
    refreshNotifications,
    pushNotification: (n: Notification) => setNotifications((prev) => [n, ...prev].slice(0, 30)),
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}