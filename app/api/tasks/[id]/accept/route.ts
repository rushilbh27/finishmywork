import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { broadcastTaskUpdate } from '@/lib/realtime'
import { notifyTaskAccepted } from '@/lib/notifications'

export async function PATCH(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Use authenticated user's id as the accepter instead of trusting client input
    const taskId = params.id
    const accepterId = String(session.user.id)

    // Email verification guard
    const dbUser = (await prisma.user.findUnique({
      where: { id: accepterId },
    })) as any
    if (!dbUser?.emailVerified) {
      return NextResponse.json({ message: 'Email not verified' }, { status: 403 })
    }

    // Verify task exists and is open
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      return NextResponse.json(
        { message: 'Task not found' },
        { status: 404 }
      )
    }

    if (task.status !== 'OPEN') {
      return NextResponse.json(
        { message: 'Task is not available' },
        { status: 400 }
      )
    }

    if (task.posterId?.toString() === accepterId) {
      return NextResponse.json(
        { message: 'You cannot accept your own task' },
        { status: 400 }
      )
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        accepterId: accepterId,
        status: 'IN_PROGRESS',
      },
      include: {
        poster: {
          select: {
            id: true,
            name: true,
            university: true,
            rating: true,
            reviewCount: true,
          }
        },
        accepter: {
          select: {
            id: true,
            name: true,
            university: true,
            rating: true,
            reviewCount: true,
          }
        }
      }
    })

    // Emit real-time update and notifications
    try {
      broadcastTaskUpdate('accepted', updatedTask.id, updatedTask)
      
      // Notify task owner that their task was accepted
      await notifyTaskAccepted(task.posterId, task.title, taskId)
    } catch (error) {
      console.error('Error emitting task accept update:', error)
    }

    return NextResponse.json({
      message: 'Task accepted successfully',
      task: updatedTask
    })
  } catch (error) {
    console.error('Error accepting task:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
