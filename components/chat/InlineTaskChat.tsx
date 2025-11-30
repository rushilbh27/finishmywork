"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { SendIcon, SignalIcon, ImageIcon, PaperclipIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { useTaskChat } from '@/hooks/useTaskChat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { SmartUpload } from '@/components/uploadthing'
import { useToast } from '@/components/ui/use-toast'
import { fileIcon, isImage } from '@/lib/fileIcons'
import { useUserPresence } from '@/hooks/useUserPresence'

interface InlineTaskChatProps {
  taskId: string
  partnerName?: string | null
  partnerId?: string | null
  preview?: boolean // If true, show only last 4–5 messages
}

export function InlineTaskChat({ taskId, partnerName, partnerId, preview = false }: InlineTaskChatProps) {
  const { data: session } = useSession()
  const userId = session?.user?.id ? String(session.user.id) : null
  const { toast } = useToast()

  const [message, setMessage] = useState('')
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<{ url: string; name: string }[]>([])
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null)

  // Get partner's online status
  const { isOnline, getStatus } = useUserPresence(partnerId ? [partnerId] : [])
  const partnerStatus = partnerId ? getStatus(partnerId) : 'unknown'
  const partnerIsOnline = partnerId ? isOnline(partnerId) : false

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
    
    // Send uploaded files first
    if (uploadedFiles.length > 0) {
      for (const file of uploadedFiles) {
        const isImage = file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)
        await sendMessage(file.url, isImage ? 'image' : 'file', file.url).catch((error) => {
          toast({
            title: 'Failed to send media',
            description: error.message,
            variant: 'destructive',
          })
        })
      }
      setUploadedFiles([])
    }
    
    // Then send text message if any
    if (trimmed) {
      await sendMessage(trimmed)
      setMessage('')
    }
    
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
    if (!typingUsers.length || !userId || typingUsers.includes(userId)) return null
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
              {/* User Status and Connection */}
              <div className="flex justify-between items-center py-2 px-1">
                {partnerName && partnerId && (
                  <Link 
                    href={`/users/${partnerId}`}
                    className={cn('inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full hover:opacity-80 transition-opacity cursor-pointer', 
                      partnerIsOnline ? 'text-emerald-400 bg-emerald-400/10' : 'text-gray-400 bg-gray-400/10'
                    )}
                  >
                    <div className={cn('h-1.5 w-1.5 rounded-full', 
                      partnerIsOnline ? 'bg-emerald-400' : 'bg-gray-400'
                    )}></div>
                    {partnerName} {partnerIsOnline ? 'online' : 'offline'}
                  </Link>
                )}
                <span className={cn('inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full ml-auto', 
                  isConnected ? 'text-emerald-400 bg-emerald-400/10' : 'text-amber-400 bg-amber-400/10'
                )}>
                  <div className={cn('h-1.5 w-1.5 rounded-full', 
                    isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                  )}></div>
                  {isConnected ? 'Connected' : 'Connecting'}
                </span>
              </div>
              
              <AnimatePresence initial={false}>
                {displayedMessages.map((msg) => {
                  const isSelf = msg.senderId?.toString() === userId
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
                        <Link href={`/users/${partnerId}`} className="hover:opacity-80 transition-opacity">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-accent text-white text-xs font-semibold mb-1">
                            {partnerName?.charAt(0).toUpperCase() || 'P'}
                          </div>
                        </Link>
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
                          {msg.type === 'image' || (msg.mediaUrl && isImage(msg.mediaUrl || msg.content)) ? (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2 }}
                              className="relative cursor-pointer"
                              onClick={() => window.open(msg.mediaUrl || msg.content, '_blank')}
                            >
                              <Image 
                                src={msg.mediaUrl || msg.content} 
                                alt="attachment" 
                                width={320}
                                height={240}
                                className="rounded-xl max-w-xs hover:opacity-90 transition-opacity"
                                placeholder="blur"
                                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8X8DwHwAFAAJ/l9t6AAAAAElFTkSuQmCC"
                                style={{ width: 'auto', height: 'auto', maxWidth: '320px' }}
                              />
                            </motion.div>
                          ) : msg.mediaUrl ? (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                              className="flex items-center gap-2 cursor-pointer"
                              onClick={() => msg.mediaUrl && window.open(msg.mediaUrl, '_blank')}
                            >
                              <span className="text-3xl">{fileIcon(msg.mediaUrl)}</span>
                              <span className="text-sm underline">View attachment</span>
                            </motion.div>
                          ) : (
                            <p className="break-words">{msg.content}</p>
                          )}
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
            {/* Upload Preview */}
            {uploadedFiles.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                {uploadedFiles.map((file, idx) => (
                  <motion.div 
                    key={idx} 
                    className="relative flex-shrink-0"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-20 h-20 rounded-lg bg-surface/80 border border-border/40 overflow-hidden">
                      {isImage(file.url) ? (
                        <Image 
                          src={file.url} 
                          alt={file.name} 
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                          placeholder="blur"
                          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8X8DwHwAFAAJ/l9t6AAAAAElFTkSuQmCC"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">
                          {fileIcon(file.url)}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedFiles(files => files.filter((_, i) => i !== idx))}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-black transition-colors"
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
            <div className="flex gap-3 items-end">
              <SmartUpload
                endpoint="chatMedia"
                onUploadComplete={(res: any) => {
                  if (res && res[0]) {
                    const url = res[0].url
                    
                    // Add to preview
                    setUploadedFiles(prev => [...prev, { url, name: res[0].name }])
                    
                    toast({
                      title: 'File uploaded!',
                      description: 'Click send to share the file.',
                    })
                  }
                }}
                onUploadError={(error: Error) => {
                  toast({
                    title: 'Upload failed',
                    description: error.message,
                    variant: 'destructive',
                  })
                }}
                appearance={{
                  button: "!rounded-full !h-9 !w-9 !p-0 !flex !items-center !justify-center !border-0 !bg-gradient-to-r !from-purple-600 !to-indigo-600 !text-white !shadow-lg hover:!shadow-xl !transition-all !cursor-pointer",
                  container: "!flex !items-center",
                  allowedContent: "!hidden"
                }}
                content={{
                  button({ ready }: any) {
                    return <ImageIcon className="size-4" />
                  }
                }}
                className="flex items-center"
              />
              <div className="flex-1 relative">
                <Input
                  value={message}
                  onChange={(event) => handleInputChange(event.target.value)}
                  placeholder={error ? 'You cannot send messages in this task' : 'Type your message...'}
                  disabled={!!error || !userId}
                  className="rounded-2xl border-border/40 bg-surface/60 px-4 py-2 text-sm resize-none min-h-[36px] pr-12"
                />
              </div>
              <Button
                type="submit"
                disabled={(!message.trim() && uploadedFiles.length === 0) || !!error || !userId}
                variant="gradient"
                size="icon"
                className="rounded-full h-9 w-9 shrink-0"
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
