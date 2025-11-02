import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not available in production' }, { status: 404 })
  }

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(String(session.user.id), 10)

    // Create sample notifications for testing
    const notifications = await Promise.all([
      prisma.notification.create({
        data: {
          userId,
          type: 'TASK_ACCEPTED',
          title: 'Task Accepted',
          body: 'Your task "Help with React project" has been accepted!',
          link: '/tasks/123'
        }
      }),
      prisma.notification.create({
        data: {
          userId,
          type: 'NEW_MESSAGE',
          title: 'New Message',
          body: 'You have a new message about your tutoring session.',
          link: '/messages/456'
        }
      }),
      prisma.notification.create({
        data: {
          userId,
          type: 'TASK_COMPLETED',
          title: 'Task Completed',
          body: 'Your task has been marked as completed. Please leave a review!',
          link: '/tasks/789'
        }
      })
    ])

    return NextResponse.json({ 
      message: 'Debug notifications created',
      notifications: notifications.length
    })
  } catch (error) {
    console.error('Error creating debug notifications:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}