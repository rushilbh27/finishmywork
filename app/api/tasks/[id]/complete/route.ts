import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyTaskCompleted } from '@/lib/notifications'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const taskId = parseInt(params.id, 10)
    
    if (isNaN(taskId)) {
      return NextResponse.json(
        { message: 'Invalid task ID' },
        { status: 400 }
      )
    }

    const userId = parseInt(String(session.user.id))

    // Email verification guard
    // Email verification guard (schema fields exist at runtime)
    const dbUser = (await prisma.user.findUnique({
      where: { id: userId },
    })) as any
    if (!dbUser?.emailVerified) {
      return NextResponse.json({ message: 'Email not verified' }, { status: 403 })
    }

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: { 
        id: true, 
        posterId: true, 
        accepterId: true, 
        status: true, 
        title: true,
        poster: { select: { name: true } },
        accepter: { select: { name: true } }
      }
    })

    if (!existingTask) {
      return NextResponse.json(
        { message: 'Task not found' },
        { status: 404 }
      )
    }

    // Validation: Only poster can mark task as completed
    if (existingTask.posterId !== userId) {
      return NextResponse.json(
        { message: 'Forbidden: Only the task poster can mark tasks as completed' },
        { status: 403 }
      )
    }

    // Validation: Can only complete tasks that are IN_PROGRESS
    if (existingTask.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { message: 'Cannot complete tasks that are not in progress' },
        { status: 400 }
      )
    }

    // Update task status
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
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
      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/socket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'task:completed',
          task: updatedTask
        })
      })
      
      // Notify both poster and accepter about task completion
      if (existingTask.accepterId) {
        await notifyTaskCompleted(existingTask.accepterId, existingTask.title, taskId)
      }
    } catch (error) {
      console.error('Error emitting task complete update:', error)
    }

    return NextResponse.json({
      message: 'Task completed successfully',
      task: updatedTask
    })
  } catch (error) {
    console.error('Error completing task:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
