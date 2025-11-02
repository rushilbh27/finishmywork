'use client'

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { formatDistanceToNow, isThisWeek, isToday, isYesterday } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell } from 'lucide-react'
import { useNotifications } from '@/components/NotificationProvider'

interface NotificationPanelProps {
  onClose: () => void
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { notifications, unreadCount, isLoading, markAllAsRead } = useNotifications()
  const panelRef = useRef<HTMLDivElement>(null)

  // Close panel when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  // Auto-mark as read when panel opens
  useEffect(() => {
    if (unreadCount > 0) {
      const timer = setTimeout(() => {
        markAllAsRead()
      }, 1000) // Mark as read after 1 second of viewing

      return () => clearTimeout(timer)
    }
  }, [unreadCount, markAllAsRead])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_ACCEPTED':
        return { emoji: '✅', color: 'from-green-500/20 to-emerald-500/20 border-green-500/30' }
      case 'TASK_UNASSIGNED':
        return { emoji: '📋', color: 'from-orange-500/20 to-amber-500/20 border-orange-500/30' }
      case 'TASK_COMPLETED':
        return { emoji: '🎉', color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30' }
      case 'NEW_MESSAGE':
        return { emoji: '💬', color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30' }
      case 'TASK_REVIEW':
        return { emoji: '⭐', color: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30' }
      case 'TASK_CREATED':
        return { emoji: '📝', color: 'from-indigo-500/20 to-blue-500/20 border-indigo-500/30' }
      case 'PAYMENT_RECEIVED':
        return { emoji: '💰', color: 'from-green-500/20 to-teal-500/20 border-green-500/30' }
      default:
        return { emoji: '🔔', color: 'from-gray-500/20 to-slate-500/20 border-gray-500/30' }
    }
  }

  const groupNotificationsByTime = (notifications: any[]) => {
    const groups: { [key: string]: any[] } = {
      'Today': [],
      'Yesterday': [],
      'This week': [],
      'Earlier': []
    }

    notifications.forEach(notification => {
      const date = new Date(notification.createdAt)
      if (isToday(date)) {
        groups['Today'].push(notification)
      } else if (isYesterday(date)) {
        groups['Yesterday'].push(notification)
      } else if (isThisWeek(date)) {
        groups['This week'].push(notification)
      } else {
        groups['Earlier'].push(notification)
      }
    })

    return Object.entries(groups).filter(([_, items]) => items.length > 0)
  }

  const groupedNotifications = groupNotificationsByTime(notifications)

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="absolute top-full right-0 mt-3 w-[420px] max-h-[600px] bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
        role="dialog"
        aria-labelledby="notifications-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
          <h3 id="notifications-title" className="font-semibold text-base text-white">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {unreadCount} new
            </span>
          )}
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/80"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-8 w-8 text-white/60 mb-2" />
              <p className="text-sm text-white/90">No notifications yet</p>
              <p className="text-xs text-white/70 mt-1">
                We'll let you know when something happens!
              </p>
            </div>
          ) : (
            <div>
              {groupedNotifications.map(([timeGroup, groupNotifications]) => (
                <div key={timeGroup}>
                  {/* Time Group Header */}
                  <div className="px-4 py-2 text-xs font-medium text-white/70 bg-white/10">
                    {timeGroup}
                  </div>
                  
                  {/* Notifications in Group */}
                  {groupNotifications.map((notification) => {
                    const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
                    const iconData = getNotificationIcon(notification.type)
                    const isUnread = !notification.readAt

                    return (
                      <div
                        key={notification.id}
                        className={`group flex items-start gap-3 p-4 hover:bg-white/10 transition-all cursor-pointer border-b border-white/5 last:border-b-0 ${isUnread ? 'bg-white/5' : ''}`}
                        onClick={() => {
                          if (notification.link) {
                            window.location.href = notification.link
                            onClose()
                          }
                        }}
                      >
                        {/* Avatar/Icon with gradient */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${iconData.color} backdrop-blur-sm border flex items-center justify-center text-lg shadow-lg`}>
                          {iconData.emoji}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`font-medium text-sm leading-tight ${isUnread ? 'text-white' : 'text-white/80'}`}>
                              {notification.title}
                            </p>
                            {isUnread && (
                              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-purple-500"></div>
                            )}
                          </div>
                          <p className="text-xs text-white/70 mt-1.5 leading-relaxed">
                            {notification.body}
                          </p>
                          <p className="text-xs text-white/50 mt-2">
                            {timeAgo}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}