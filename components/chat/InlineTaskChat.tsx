"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { SendIcon, SignalIcon } from 'lucide-react'

import { useTaskChat } from '@/hooks/useTaskChat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface InlineTaskChatProps {
  taskId: number
  partnerName?: string | null
  preview?: boolean // If true, show only last 4–5 messages
}

export function InlineTaskChat({ taskId, partnerName, preview = false }: InlineTaskChatProps) {
  const { data: session } = useSession()
  const userId = session?.user?.id ? Number.parseInt(String(session.user.id), 10) : null

  const [message, setMessage] = useState('')
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null)

  const {
    messages,
    loading,
    error,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    isConnected,
  } = useTaskChat({ taskId, userId })

  // Only show last 4–5 messages in preview mode
  const displayedMessages = preview ? messages.slice(-5) : messages

  useEffect(() => {
    if (scrollAnchorRef.current) {
      scrollAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages.length])

  const handleSend = async () => {
    const trimmed = message.trim()
    if (!trimmed) return
    await sendMessage(trimmed)
    setMessage('')
    stopTyping()
  }

  const handleInputChange = (value: string) => {
    setMessage(value)
    startTyping()
    if (typingTimeout) clearTimeout(typingTimeout)
    setTypingTimeout(
      setTimeout(() => {
        stopTyping()
        setTypingTimeout(null)
      }, 1500),
    )
  }

  useEffect(() => {
    return () => {
      if (typingTimeout) clearTimeout(typingTimeout)
      stopTyping()
    }
  }, [typingTimeout, stopTyping])

  const typingLabel = useMemo(() => {
    if (!typingUsers.length || typingUsers.includes(userId ?? -1)) return null
    return typingUsers.length > 1 ? 'Several people are typing…' : `${partnerName ?? 'Partner'} is typing…`
  }, [partnerName, typingUsers, userId])

  const stateLabel = useMemo(() => {
    if (!userId) return 'Sign in to chat'
    if (loading) return 'Loading conversation…'
    if (error) return 'You do not have access to this conversation.'
    return null
  }, [error, loading, userId])

  return (
    <div className="flex flex-1 min-h-0 flex-col h-full bg-background">
      <div className="flex-1 flex flex-col min-h-0 h-full">
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0 h-full">
          {stateLabel ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {stateLabel}
            </div>
          ) : (
            <>
              {/* Connection Status Inside Chat */}
              <div className="flex justify-center py-2">
                <span className={cn('inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full', isConnected ? 'text-emerald-400 bg-emerald-400/10' : 'text-amber-400 bg-amber-400/10')}>
                  <div className={cn('h-1.5 w-1.5 rounded-full', isConnected ? 'bg-emerald-400' : 'bg-amber-400')}></div>
                  {isConnected ? 'Connected' : 'Connecting'}
                </span>
              </div>
              
              <AnimatePresence initial={false}>
                {displayedMessages.map((msg) => {
                  const isSelf = msg.senderId === userId
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className={cn('flex items-end gap-2', isSelf ? 'justify-end' : 'justify-start')}
                    >
                      {!isSelf && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-accent text-white text-xs font-semibold mb-1">
                          {partnerName?.charAt(0).toUpperCase() || 'P'}
                        </div>
                      )}
                      <div className="flex flex-col max-w-[75%]">
                        <div
                          className={cn(
                            'relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                            isSelf
                              ? 'rounded-br-md bg-gradient-accent text-white shadow-sm'
                              : 'rounded-bl-md border border-border/40 bg-card/80 text-foreground shadow-sm backdrop-blur-sm',
                          )}
                        >
                          <p className="break-words">{msg.content}</p>
                        </div>
                        <span className={cn(
                          "mt-1 text-[10px] px-1",
                          isSelf ? "text-right text-muted-foreground/60" : "text-left text-muted-foreground/60"
                        )}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              {typingLabel ? (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-accent text-white text-xs font-semibold">
                    {partnerName?.charAt(0).toUpperCase() || 'P'}
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl bg-card/80 px-4 py-2 border border-border/40">
                    <div className="flex gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"></div>
                    </div>
                    <span className="ml-2 text-xs text-muted-foreground">typing...</span>
                  </div>
                </motion.div>
              ) : null}
              <div ref={scrollAnchorRef} />
            </>
          )}
        </div>
        
        {!preview && (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              handleSend()
            }}
            className="border-t border-border/40 px-4 py-3 bg-card/30 backdrop-blur-sm"
          >
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <Input
                  value={message}
                  onChange={(event) => handleInputChange(event.target.value)}
                  placeholder={error ? 'You cannot send messages in this task' : 'Type your message...'}
                  disabled={!!error || !userId}
                  className="rounded-2xl border-border/40 bg-surface/60 px-4 py-3 text-sm resize-none min-h-[44px] pr-12"
                />
              </div>
              <Button
                type="submit"
                disabled={!message.trim() || !!error || !userId}
                variant="gradient"
                size="icon"
                className="rounded-2xl h-11 w-11 shrink-0"
              >
                <SendIcon className="size-4" />
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
