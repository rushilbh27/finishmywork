'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRealtime } from './useRealtime'

export interface ChatUser {
  id: string
  name: string | null
  avatar?: string | null
}

export interface ChatMessage {
  id: string
  taskId: string
  senderId: string
  receiverId: string
  content: string
  type?: string
  mediaUrl?: string | null
  createdAt: string
  sender?: ChatUser | null
}

interface UseTaskChatOptions {
  taskId: string | null
  userId: string | null
}

interface UseTaskChatReturn {
  messages: ChatMessage[]
  loading: boolean
  error: string | null
  typingUsers: string[]
  sendMessage: (content: string, type?: string, mediaUrl?: string) => Promise<void>
  startTyping: () => void
  stopTyping: () => void
  isConnected: boolean
}

export function useTaskChat({ taskId, userId }: UseTaskChatOptions): UseTaskChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const typingSetRef = useRef<Set<string>>(new Set())

  const { connected, on } = useRealtime()

  // Fetch initial messages
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

  // Listen for new messages
  useEffect(() => {
    if (!taskId) return

    const unsubscribe = on('message', (event) => {
      if (event.type !== 'message') return
      
      const { taskId: msgTaskId, message } = event.data
      if (String(msgTaskId) !== String(taskId)) return

      setMessages((prev) => {
        const exists = prev.some((existing) => existing.id === message.id)
        if (exists) return prev
        const next = [...prev, message]
        return next.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      })
    })

    return unsubscribe
  }, [taskId, on])

  // Listen for typing indicators
  useEffect(() => {
    if (!taskId || !userId) return

    const unsubscribe = on('typing', (event) => {
      if (event.type !== 'typing') return
      
      const { taskId: typingTaskId, userId: typingUserId, isTyping } = event.data
      if (String(typingTaskId) !== String(taskId)) return
      if (typingUserId === userId) return // Ignore own typing

      const typingSet = typingSetRef.current
      if (isTyping) {
        typingSet.add(typingUserId)
      } else {
        typingSet.delete(typingUserId)
      }
      setTypingUsers(Array.from(typingSet))
    })

    return () => {
      unsubscribe()
      typingSetRef.current.clear()
      setTypingUsers([])
    }
  }, [taskId, userId, on])

  const sendMessage = useCallback(
    async (content: string, type: string = 'text', mediaUrl?: string) => {
      if (!taskId) throw new Error('Task ID is required to send a message')

      const trimmed = content.trim()
      if (!trimmed) return

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          taskId, 
          content: trimmed,
          type,
          mediaUrl,
        }),
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
    isConnected: connected,
  }
}
