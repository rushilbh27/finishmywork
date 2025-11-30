// Server-Side Events (SSE) for real-time updates
// Works perfectly with Next.js App Router

import { EventEmitter } from 'events'

class RealtimeEventEmitter extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(100) // Increase for multiple clients
  }
}

// Global event emitter for broadcasting
const globalForRealtime = globalThis as unknown as {
  realtimeEmitter: RealtimeEventEmitter | undefined
  activeUsers: Set<string> | undefined
}

export const realtimeEmitter = globalForRealtime.realtimeEmitter ?? new RealtimeEventEmitter()

// Track active users (in production, use Redis)
export const activeUsers = globalForRealtime.activeUsers ?? new Set<string>()

if (process.env.NODE_ENV !== 'production') {
  globalForRealtime.realtimeEmitter = realtimeEmitter
  globalForRealtime.activeUsers = activeUsers
}

// Event types
export type RealtimeEvent = 
  | { type: 'message'; data: { taskId: string; message: any } }
  | { type: 'notification'; data: { userId: string; notification: any } }
  | { type: 'task:created'; data: { task: any } }
  | { type: 'task:updated'; data: { taskId: string; task: any } }
  | { type: 'task:accepted'; data: { taskId: string; task: any } }
  | { type: 'task:completed'; data: { taskId: string; task: any } }
  | { type: 'task:cancelled'; data: { taskId: string; task: any } }
  | { type: 'typing'; data: { taskId: string; userId: string; isTyping: boolean } }
  | { type: 'presence'; data: { userId: string; status: 'online' | 'offline'; timestamp: number } }

// Broadcast functions
export function broadcastMessage(taskId: string, message: any) {
  realtimeEmitter.emit('message', { taskId, message })
  console.log(`📡 Broadcasted message to task-${taskId}`)
}

export function broadcastNotification(userId: string, notification: any) {
  realtimeEmitter.emit('notification', { userId, notification })
  console.log(`🔔 Broadcasted notification to user-${userId}`)
}

export function broadcastTaskUpdate(type: string, taskId: string, task: any) {
  realtimeEmitter.emit(type, { taskId, task })
  console.log(`📢 Broadcasted ${type} for task-${taskId}`)
}

export function broadcastTyping(taskId: string, userId: string, isTyping: boolean) {
  realtimeEmitter.emit('typing', { taskId, userId, isTyping })
}

export function broadcastPresence(userId: string, status: 'online' | 'offline') {
  // Update active users set
  if (status === 'online') {
    activeUsers.add(userId)
  } else {
    activeUsers.delete(userId)
  }
  
  realtimeEmitter.emit('presence', { userId, status, timestamp: Date.now() })
  console.log(`👤 User ${userId} is now ${status}`)
}

export function broadcastReviewCreated(taskId: string, payload: any) {
  realtimeEmitter.emit('review:created', { taskId, ...payload })
  console.log(`⭐ Broadcasted review_created for task-${taskId}`)
}

// Helper to check if user is online
export function isUserOnline(userId: string): boolean {
  return activeUsers.has(userId)
}

// Helper to get all online users
export function getOnlineUsers(): string[] {
  return Array.from(activeUsers)
}
