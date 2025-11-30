import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { realtimeEmitter, broadcastPresence } from '@/lib/realtime'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = session.user.id
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Broadcast user online
      broadcastPresence(userId, 'online')

      // Send initial connection message
      const data = encoder.encode(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`)
      controller.enqueue(data)

      // Message handler
      const messageHandler = (payload: { taskId: string; message: any }) => {
        const msg = encoder.encode(`data: ${JSON.stringify({ type: 'message', data: payload })}\n\n`)
        controller.enqueue(msg)
      }

      // Notification handler (only for this user)
      const notificationHandler = (payload: { userId: string; notification: any }) => {
        if (payload.userId === userId) {
          const msg = encoder.encode(`data: ${JSON.stringify({ type: 'notification', data: payload.notification })}\n\n`)
          controller.enqueue(msg)
        }
      }

      // Task update handlers
      const taskHandler = (type: string) => (payload: { taskId: string; task: any }) => {
        const msg = encoder.encode(`data: ${JSON.stringify({ type, data: payload })}\n\n`)
        controller.enqueue(msg)
      }

      // Review created handler
      const reviewHandler = (payload: { taskId: string; review: any; reviewerId?: string; receiverId?: string }) => {
        const msg = encoder.encode(`data: ${JSON.stringify({ type: 'review:created', data: payload })}\n\n`)
        controller.enqueue(msg)
      }

      // Typing handler
      const typingHandler = (payload: { taskId: string; userId: string; isTyping: boolean }) => {
        const msg = encoder.encode(`data: ${JSON.stringify({ type: 'typing', data: payload })}\n\n`)
        controller.enqueue(msg)
      }

      // Presence handler
      const presenceHandler = (payload: { userId: string; status: 'online' | 'offline'; timestamp: number }) => {
        const msg = encoder.encode(`data: ${JSON.stringify({ type: 'presence', data: payload })}\n\n`)
        controller.enqueue(msg)
      }

      // Register event listeners
      realtimeEmitter.on('message', messageHandler)
      realtimeEmitter.on('notification', notificationHandler)
      realtimeEmitter.on('task:created', taskHandler('task:created'))
      realtimeEmitter.on('task:updated', taskHandler('task:updated'))
      realtimeEmitter.on('task:accepted', taskHandler('task:accepted'))
      realtimeEmitter.on('task:completed', taskHandler('task:completed'))
      realtimeEmitter.on('task:cancelled', taskHandler('task:cancelled'))
      realtimeEmitter.on('typing', typingHandler)
      realtimeEmitter.on('presence', presenceHandler)
  realtimeEmitter.on('review:created', reviewHandler)

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          const ping = encoder.encode(': heartbeat\n\n')
          controller.enqueue(ping)
        } catch (e) {
          clearInterval(heartbeat)
        }
      }, 30000) // Every 30 seconds

      // Cleanup on connection close
      req.signal.addEventListener('abort', () => {
        console.log(`🔴 SSE disconnected: user-${userId}`)
        
        // Broadcast user offline
        broadcastPresence(userId, 'offline')
        
        clearInterval(heartbeat)
        realtimeEmitter.off('message', messageHandler)
        realtimeEmitter.off('notification', notificationHandler)
        realtimeEmitter.off('task:created', taskHandler('task:created'))
        realtimeEmitter.off('task:updated', taskHandler('task:updated'))
        realtimeEmitter.off('task:accepted', taskHandler('task:accepted'))
        realtimeEmitter.off('task:completed', taskHandler('task:completed'))
        realtimeEmitter.off('task:cancelled', taskHandler('task:cancelled'))
        realtimeEmitter.off('typing', typingHandler)
        realtimeEmitter.off('presence', presenceHandler)
  realtimeEmitter.off('review:created', reviewHandler)
        controller.close()
      })

      console.log(`🟢 SSE connected: user-${userId}`)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  })
}
