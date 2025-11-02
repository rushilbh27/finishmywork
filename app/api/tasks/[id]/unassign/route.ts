import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ensureSocketIO, emitTaskUpdated } from '@/lib/socketServer'
import { notifyTaskUnassigned } from '@/lib/notifications'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const taskId = parseInt(params.id, 10)
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 })
    }

    const userId = parseInt(String(session.user.id), 10)

    // Email verification guard
    // Email verification guard (schema fields exist at runtime)
    const dbUser = (await prisma.user.findUnique({
      where: { id: userId },
    })) as any
    if (!dbUser?.emailVerified) {
      return NextResponse.json({ error: 'Email not verified' }, { status: 403 })
    }

    // Get the task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        poster: true,
        accepter: true,
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Both poster AND accepter can unassign a task
    if (task.posterId !== userId && task.accepterId !== userId) {
      return NextResponse.json(
        { error: 'Only the task poster or accepter can unassign this task' },
        { status: 403 }
      )
    }

    // Can only unassign if task is IN_PROGRESS
    if (task.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Can only unassign tasks that are in progress' },
        { status: 400 }
      )
    }

    // Store accepter ID for notification
    const previousAccepterId = task.accepterId

    // Update task: set status to OPEN, remove accepter
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'OPEN',
        accepterId: null,
      },
      include: {
        poster: true,
        accepter: true,
      },
    })

    try {
      await ensureSocketIO()
      emitTaskUpdated(updatedTask)
      
      // Notify task owner that their task was unassigned
      await notifyTaskUnassigned(task.posterId, task.title, taskId)
    } catch (err) {
      console.error('Error emitting task unassign update:', err)
    }

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error unassigning task:', error)
    return NextResponse.json(
      { error: 'Failed to unassign task' },
      { status: 500 }
    )
  }
}
