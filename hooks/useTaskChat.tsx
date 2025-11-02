'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export interface ChatUser {
  id: number
  name: string | null
  avatar?: string | null
}

export interface ChatMessage {
  id: number
  taskId: number
  senderId: number
  receiverId: number
  content: string
  createdAt: string
  sender?: ChatUser | null
}

interface UseTaskChatOptions {
  taskId: number | null
  userId: number | null
}

interface UseTaskChatReturn {
  messages: ChatMessage[]
  loading: boolean
  error: string | null
  typingUsers: number[]
  sendMessage: (content: string) => Promise<void>
  startTyping: () => void
  stopTyping: () => void
  isConnected: boolean
}

export function useTaskChat({ taskId, userId }: UseTaskChatOptions): UseTaskChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [typingUsers, setTypingUsers] = useState<number[]>([])
  const [isConnected, setIsConnected] = useState(false)

  const eventSourceRef = useRef<EventSource | null>(null)
  const typingSetRef = useRef<Set<number>>(new Set())

  const taskChannel = useMemo(() => (taskId ? `task-${taskId}` : null), [taskId])

  useEffect(() => {
    if (!taskId) return

    let cancelled = false

    setLoading(true)
    setError(null)
    setMessages([])

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages?taskId=${taskId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to load messages')
        }

        const data: ChatMessage[] = await response.json()
        if (!cancelled) {
          setMessages(
            data.slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
          )
        }
      } catch (fetchError: unknown) {
        if (cancelled) return
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load messages')
        setMessages([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchMessages()

    return () => {
      cancelled = true
    }
  }, [taskId])

  useEffect(() => {
    if (!taskId) return

    // Close existing EventSource connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    // Set up real-time connection using Server-Sent Events
    const eventSource = new EventSource(`/api/chat/events?taskId=${taskId}`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('🔗 SSE connected for task', taskId)
      setIsConnected(true)
    }

    eventSource.onerror = (error) => {
      console.error('❌ SSE connection error:', error)
      setIsConnected(false)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'message') {
          const message = data.message
          if (!message || message.taskId !== taskId) return
          
          setMessages((prev) => {
            const exists = prev.some((existing) => existing.id === message.id)
            if (exists) return prev
            const next = [...prev, message]
            return next.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          })
        } else if (data.type === 'typing') {
          const { userId: typingUserId, isTyping } = data
          if (!typingUserId || typingUserId === userId) return
          
          const typingId = Number.parseInt(typingUserId, 10)
          if (Number.isNaN(typingId)) return

          const typingSet = typingSetRef.current
          if (isTyping) {
            typingSet.add(typingId)
          } else {
            typingSet.delete(typingId)
          }
          setTypingUsers(Array.from(typingSet))
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error)
      }
    }

    return () => {
      eventSource.close()
      eventSourceRef.current = null
      typingSetRef.current.clear()
      setTypingUsers([])
      setIsConnected(false)
    }
  }, [taskId, userId])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!taskId) throw new Error('Task ID is required to send a message')

      const trimmed = content.trim()
      if (!trimmed) return

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, content: trimmed }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to send message')
      }

      const message: ChatMessage = await response.json()
      setMessages((prev) => {
        const exists = prev.some((existing) => existing.id === message.id)
        if (exists) return prev
        const next = [...prev, message]
        return next.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      })
    },
    [taskId],
  )

  const emitTyping = useCallback(
    async (isTyping: boolean) => {
      if (!taskId || !userId) return
      try {
        await fetch('/api/chat/typing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, userId, isTyping }),
        })
      } catch (error) {
        console.error('Error sending typing indicator:', error)
      }
    },
    [taskId, userId],
  )

  const startTyping = useCallback(() => emitTyping(true), [emitTyping])
  const stopTyping = useCallback(() => emitTyping(false), [emitTyping])

  return {
    messages,
    loading,
    error,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    isConnected,
  }
}
