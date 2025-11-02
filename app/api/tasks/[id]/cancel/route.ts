import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const taskId = parseInt(params.id)
    if (isNaN(taskId)) {
      return NextResponse.json(
        { message: 'Invalid task ID' },
        { status: 400 }
      )
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

    const userId = parseInt(String(session.user.id))

    // Validation: Only poster or accepter can cancel
    const isPoster = existingTask.posterId === userId
    const isAccepter = existingTask.accepterId === userId

    if (!isPoster && !isAccepter) {
      return NextResponse.json(
        { message: 'Forbidden: You can only cancel tasks you posted or accepted' },
        { status: 403 }
      )
    }

    // Validation: Can only cancel tasks that are OPEN or IN_PROGRESS
    if (!['OPEN', 'IN_PROGRESS'].includes(existingTask.status)) {
      return NextResponse.json(
        { message: 'Cannot cancel completed or already cancelled tasks' },
        { status: 400 }
      )
    }

    // If accepter cancels IN_PROGRESS task, reset to OPEN. If poster cancels, set to CANCELLED.
    const newStatus = isAccepter && existingTask.status === 'IN_PROGRESS' ? 'OPEN' : 'CANCELLED'
    
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { 
        status: newStatus,
        // If accepter cancels, remove them from the task so it can be accepted again
        ...(isAccepter && { accepterId: null })
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
          type: 'task:cancelled',
          task: updatedTask
        })
      })
    } catch (error) {
      console.error('Error emitting task cancel update:', error)
    }

    return NextResponse.json({
      message: 'Task cancelled successfully',
      task: updatedTask
    })
  } catch (error) {
    console.error('Error cancelling task:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}