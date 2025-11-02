import { prisma } from '@/lib/prisma'
import { emitNotification } from '@/lib/socketServer'

export type NotificationType = 
  | 'TASK_ACCEPTED'
  | 'TASK_UNASSIGNED'
  | 'TASK_COMPLETED'
  | 'NEW_MESSAGE'
  | 'TASK_REVIEW'
  | 'SYSTEM_ALERT'

interface CreateNotificationParams {
  userId: number
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

    // Emit to user via socket
    emitNotification(params.userId, notification)

    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

// Convenience functions for common notification types
export async function notifyTaskAccepted(ownerId: number, taskTitle: string, taskId: number) {
  return createNotification({
    userId: ownerId,
    type: 'TASK_ACCEPTED',
    title: 'Task Accepted',
    body: `Your task "${taskTitle}" has been accepted!`,
    link: `/tasks/${taskId}`
  })
}

export async function notifyTaskUnassigned(ownerId: number, taskTitle: string, taskId: number) {
  return createNotification({
    userId: ownerId,
    type: 'TASK_UNASSIGNED',
    title: 'Task Unassigned',
    body: `Your task "${taskTitle}" is now available again.`,
    link: `/tasks/${taskId}`
  })
}

export async function notifyTaskCompleted(ownerId: number, taskTitle: string, taskId: number) {
  return createNotification({
    userId: ownerId,
    type: 'TASK_COMPLETED',
    title: 'Task Completed',
    body: `Your task "${taskTitle}" has been completed. Please leave a review!`,
    link: `/tasks/${taskId}`
  })
}

export async function notifyNewMessage(userId: number, senderName: string, taskId: number) {
  return createNotification({
    userId,
    type: 'NEW_MESSAGE',
    title: 'New Message',
    body: `${senderName} sent you a message about your task.`,
    link: `/messages?task=${taskId}`
  })
}