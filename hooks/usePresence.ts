'use client'

import { useEffect, useState } from 'react'
import { useRealtime } from './useRealtime'

export function usePresence() {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const { on } = useRealtime()

  useEffect(() => {
    const unsubscribe = on('presence', (event) => {
      if (event.type !== 'presence') return

      const { userId, status } = event.data

      setOnlineUsers(prev => {
        const next = new Set(prev)
        if (status === 'online') {
          next.add(userId)
        } else {
          next.delete(userId)
        }
        return next
      })
    })

    return unsubscribe
  }, [on])

  const isOnline = (userId: string) => onlineUsers.has(userId)

  return {
    onlineUsers: Array.from(onlineUsers),
    isOnline,
  }
}
