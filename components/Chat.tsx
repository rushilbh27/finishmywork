'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useSocket } from '@/hooks/useSocket'
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'

interface Message {
  id: string
  content: string
  createdAt: string
  sender: {
    name: string
    avatar?: string
  }
}

interface ChatProps {
  taskId: string
  receiverId: string
}

export function Chat({ taskId, receiverId }: ChatProps) {
  const { data: session } = useSession()
  const { socket, connected } = useSocket(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000')
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (socket && connected) {
      socket.emit('join-task', taskId)
      
      // Load existing messages
      fetchMessages()
    }
  }, [socket, connected, taskId])

  useEffect(() => {
    if (socket) {
      socket.on('new-message', (message: Message) => {
        setMessages(prev => [...prev, message])
      })

      socket.on('user-typing', (data: { userId: string; isTyping: boolean }) => {
        if (data.userId !== session?.user?.id) {
          if (data.isTyping) {
            setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId])
          } else {
            setTypingUsers(prev => prev.filter(id => id !== data.userId))
          }
        }
      })
    }

    return () => {
      if (socket) {
        socket.off('new-message')
        socket.off('user-typing')
      }
    }
  }, [socket, session?.user?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages?taskId=${taskId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !socket || !session?.user?.id) return

    const messageData = {
      taskId,
      senderId: session.user.id,
      receiverId,
      content: newMessage.trim(),
    }

    socket.emit('send-message', messageData)
    setNewMessage('')
    
    // Stop typing indicator
    socket.emit('typing-stop', { taskId, userId: session.user.id })
    setIsTyping(false)
  }

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    
    if (!isTyping && socket && session?.user?.id) {
      setIsTyping(true)
      socket.emit('typing-start', { taskId, userId: session.user.id })
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (socket && session?.user?.id) {
        socket.emit('typing-stop', { taskId, userId: session.user.id })
        setIsTyping(false)
      }
    }, 1000)
  }

  if (!connected) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Connecting to chat...</p>
        </div>
      </div>
    )
  }

  return (
  <div className="flex flex-col h-[60vh] max-h-[80vh] min-h-0 bg-card/80 backdrop-blur-xl border border-border/60 rounded-2xl shadow-card">
      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-border/60 scrollbar-track-transparent">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender.name === session?.user?.name ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl border ${
                message.sender.name === session?.user?.name
                  ? 'rounded-br-sm bg-gradient-accent text-white shadow-glow border-transparent'
                  : 'rounded-bl-sm bg-surface/80 text-foreground border-border/60'
              }`}
            >
              <p className="text-sm leading-relaxed break-words">{message.content}</p>
              <p className="text-[10px] mt-1 text-right opacity-70">
                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-surface/80 text-muted-foreground px-4 py-2 rounded-2xl border border-border/60 text-xs italic animate-pulse">
              {typingUsers.length === 1 ? 'Someone is typing...' : 'Multiple people are typing...'}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
  <form onSubmit={handleSendMessage} className="border-t border-border/60 p-4 mt-auto">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 min-w-0 border border-border/60 bg-surface/70 rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-from)] focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-2xl text-white bg-gradient-accent shadow-glow hover:shadow-glow-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  )
}