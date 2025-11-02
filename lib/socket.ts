// Client-side Socket.IO connection for real-time chat
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = (): Socket => {
  if (!socket) {
    // Initialize Socket.IO client
    socket = io(process.env.NODE_ENV === 'production' ? process.env.NEXTAUTH_URL || '' : window.location.origin, {
      path: '/api/socketio',
    })
    
    socket.on('connect', () => {
      console.log('🚀 Connected to Socket.IO server with ID:', socket?.id)
    })
    
    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server')
    })
    
    socket.on('error', (error) => {
      console.error('Socket.IO error:', error)
    })
  }
  
  return socket
}

// Disconnect and cleanup
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// Event types for real-time updates
export interface TaskUpdateEvent {
  type: 'task:created' | 'task:updated' | 'task:accepted' | 'task:cancelled' | 'task:completed' | 'task:deleted'
  task: any
  userId?: number
}

export interface ChatMessageEvent {
  type: 'chat:message'
  message: any
}

// Server-side emit functions (for use in API routes)
export const emitTaskUpdate = async (event: TaskUpdateEvent) => {
  try {
    const io = (globalThis as any).io
    if (!io) {
      console.warn('Socket.IO server not initialized')
      return
    }

    io.emit('task:update', event)
    if (event.task?.posterId) {
      io.to(`user:${event.task.posterId}`).emit('notification', {
        type: event.type,
        taskId: event.task.id,
        message: getTaskNotificationMessage(event),
        timestamp: new Date()
      })
    }
    if (event.task?.accepterId) {
      io.to(`user:${event.task.accepterId}`).emit('notification', {
        type: event.type,
        taskId: event.task.id,
        message: getTaskNotificationMessage(event),
        timestamp: new Date()
      })
    }
    console.log('Task update emitted:', event.type, 'for task:', event.task?.id)
  } catch (error) {
    console.error('Error emitting task update:', error)
  }
}

export const emitChatMessage = async (event: ChatMessageEvent) => {
  try {
    const io = (globalThis as any).io
    if (!io) {
      console.warn('Socket.IO server not initialized')
      return
    }
    
    // Emit to all clients in the task room
    io.emit('chat:message', event)
    console.log('Chat message emitted:', event.message.id)
  } catch (error) {
    console.error('Error emitting chat message:', error)
  }
}

// Helper function to generate notification messages
const getTaskNotificationMessage = (event: TaskUpdateEvent): string => {
  const taskTitle = event.task?.title || 'Unknown Task'
  
  switch (event.type) {
    case 'task:created':
      return `New task "${taskTitle}" has been posted`
    case 'task:updated':
      return `Task "${taskTitle}" has been updated`
    case 'task:accepted':
      return `Task "${taskTitle}" has been accepted`
    case 'task:cancelled':
      return `Task "${taskTitle}" has been cancelled`
    case 'task:completed':
      return `Task "${taskTitle}" has been completed`
    case 'task:deleted':
      return `Task "${taskTitle}" has been deleted`
    default:
      return `Task "${taskTitle}" has been updated`
  }
}
