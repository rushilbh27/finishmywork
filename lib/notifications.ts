import { prisma } from '@/lib/prisma'
import { broadcastNotification } from '@/lib/realtime'

export type NotificationType = 
  | 'TASK_ACCEPTED'
  | 'TASK_UNASSIGNED'
  | 'TASK_COMPLETED'
  | 'NEW_MESSAGE'
  | 'TASK_REVIEW'
  | 'SYSTEM_ALERT'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  body: string
  link?: string
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        link: params.link
      }
    })

    // Broadcast to user via SSE
    broadcastNotification(params.userId, notification)

    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

// Convenience functions for common notification types
export async function notifyTaskAccepted(ownerId: string, taskTitle: string, taskId: string) {
  return createNotification({
    userId: ownerId,
    type: 'TASK_ACCEPTED',
    title: 'Task Accepted',
    body: `Your task "${taskTitle}" has been accepted!`,
    link: `/tasks/${taskId}`
  })
}

export async function notifyTaskUnassigned(ownerId: string, taskTitle: string, taskId: string) {
  return createNotification({
    userId: ownerId,
    type: 'TASK_UNASSIGNED',
    title: 'Task Unassigned',
    body: `Your task "${taskTitle}" is now available again.`,
    link: `/tasks/${taskId}`
  })
}

export async function notifyTaskCompleted(ownerId: string, taskTitle: string, taskId: string) {
  return createNotification({
    userId: ownerId,
    type: 'TASK_COMPLETED',
    title: 'Task Completed',
    body: `Your task "${taskTitle}" has been completed. Please leave a review!`,
    link: `/tasks/${taskId}`
  })
}

export async function notifyTaskCreated(task: any) {
  try {
    // Find nearby users (same university or same location) excluding poster
    const candidates = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: task.posterId } },
          { isSuspended: false },
          {
            OR: [
              { university: task.poster?.university || undefined },
              { location: task.location || undefined },
            ],
          },
        ],
      },
      select: { id: true },
    })

    const title = `🆕 New task posted: ${task.title}`
    const body = 'Click to view task details'
    const link = `/tasks/${task.id}`

    for (const c of candidates) {
      await createNotification({
        userId: c.id,
        type: 'SYSTEM_ALERT',
        title,
        body,
        link,
      })
    }

    return true
  } catch (error) {
    console.error('Error notifying task created:', error)
    return false
  }
}

export async function notifyWaitlistApproved(email: string) {
  try {
    // If a user already exists with this email, notify them as well
    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      await createNotification({
        userId: user.id,
        type: 'SYSTEM_ALERT',
        title: `🎟️ You’ve been invited to join FinishMyWork!`,
        body: 'Click to set up your account',
        link: '/auth/signup',
      })
      // Also emit a specific waitlist:approved event for realtime listeners
      try {
        const { realtimeEmitter } = await import('@/lib/realtime')
        realtimeEmitter.emit('waitlist:approved', { userId: user.id, email })
      } catch (emitErr) {
        console.error('Failed to emit waitlist:approved event:', emitErr)
      }
    }
    return true
  } catch (error) {
    console.error('Error notifying waitlist approved:', error)
    return false
  }
}

export async function notifyNewMessage(userId: string, senderName: string, taskId: string) {
  return createNotification({
    userId,
    type: 'NEW_MESSAGE',
    title: 'New Message',
    body: `${senderName} sent you a message about your task.`,
    link: `/messages?task=${taskId}`
  })
}