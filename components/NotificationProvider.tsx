'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface Notification {
  id: number
  userId: number
  type: string
  title: string
  body: string
  link?: string | null
  readAt?: Date | null
  createdAt: Date
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  markAllAsRead: () => Promise<void>
  refreshNotifications: () => Promise<void>
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

  const fetchNotifications = async () => {
    if (!session?.user?.id) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
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

  const unreadCount = notifications.filter(n => !n.readAt).length

  // Fetch notifications on mount and when session changes
  useEffect(() => {
    fetchNotifications()
  }, [session?.user?.id])

  // TODO: Add socket listener for real-time notifications
  // useEffect(() => {
  //   if (!session?.user?.id) return
  //   
  //   const socket = getSocket()
  //   socket.emit('join-user', session.user.id)
  //   
  //   socket.on('notification:created', (notification) => {
  //     setNotifications(prev => [notification, ...prev].slice(0, 30))
  //   })
  //   
  //   return () => {
  //     socket.off('notification:created')
  //   }
  // }, [session?.user?.id])

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    markAllAsRead,
    refreshNotifications,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}