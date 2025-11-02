'use client'

import React, { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/components/NotificationProvider'
import { NotificationPanel } from '@/components/NotificationPanel'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const { unreadCount } = useNotifications()

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative h-8 w-8 p-0 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-200"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-4 w-4 fill-current" />
        {unreadCount > 0 && (
          <div 
            className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full"
            style={{ backgroundColor: 'var(--accent-from)' }}
          />
        )}
      </Button>

      {isOpen && (
        <NotificationPanel onClose={() => setIsOpen(false)} />
      )}
    </div>
  )
}