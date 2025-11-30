'use client'

import { useEffect, useState } from 'react'
import { useRealtime } from './useRealtime'

interface UserStatus {
  userId: string
  status: 'online' | 'offline'
  lastSeen: number
}

export function useUserPresence(userIds: string[]) {
  const [userStatuses, setUserStatuses] = useState<Map<string, UserStatus>>(new Map())
  const { on, connected } = useRealtime()

  // Initialize all users as online when component mounts (assume online if connected)
  useEffect(() => {
    if (!userIds.length || !connected) return
    
    setUserStatuses(prev => {
      const next = new Map(prev)
      userIds.forEach(userId => {
        if (!next.has(userId)) {
          // Default to online for active chat partners
          next.set(userId, { userId, status: 'online', lastSeen: Date.now() })
        }
      })
      return next
    })
  }, [userIds, connected])

  useEffect(() => {
    if (!userIds.length) return

    const unsubscribe = on('presence', (event) => {
      if (event.type !== 'presence') return
      
      const { userId, status, timestamp } = event.data
      
      setUserStatuses(prev => {
        const next = new Map(prev)
        next.set(userId, { userId, status, lastSeen: timestamp })
        return next
      })
    })

    return unsubscribe
  }, [userIds, on])

  const isOnline = (userId: string) => {
    const status = userStatuses.get(userId)
    return status?.status === 'online'
  }

  const getStatus = (userId: string): 'online' | 'offline' | 'unknown' => {
    const status = userStatuses.get(userId)
    return status?.status || 'online' // Default to online for better UX
  }

  return {
    userStatuses,
    isOnline,
    getStatus,
  }
}
