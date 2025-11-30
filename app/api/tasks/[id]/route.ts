import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { broadcastTaskUpdate } from '@/lib/realtime'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      return NextResponse.json(
        { message: 'Task not found' },
        { status: 404 }
      )
    }

    // Fetch poster and accepter information separately
    const poster = await prisma.user.findUnique({
      where: { id: task.posterId },
      select: {
        id: true,
        name: true,
        university: true,
        rating: true,
        reviewCount: true,
      }
    })

    let accepter = null
    if (task.accepterId) {
      accepter = await prisma.user.findUnique({
        where: { id: task.accepterId },
        select: {
          id: true,
          name: true,
          university: true,
          rating: true,
          reviewCount: true,
        }
      })
    }

    // Combine task with user information
    const taskWithUsers = {
      ...task,
      poster,
      accepter
    }

    return NextResponse.json(taskWithUsers)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    const taskId = params.id

    // Check if task exists and user owns it
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, posterId: true, status: true, accepterId: true }
    })

    if (!existingTask) {
      return NextResponse.json(
        { message: 'Task not found' },
        { status: 404 }
      )
    }

    if (existingTask.posterId !== String(session.user.id)) {
      return NextResponse.json(
        { message: 'Forbidden: You can only edit your own tasks' },
        { status: 403 }
      )
    }

    // Validation: Can't edit tasks that have been accepted
    if (existingTask.status !== 'OPEN') {
      return NextResponse.json(
        { message: 'Cannot edit tasks that have been accepted or completed' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { title, description, subject, deadline, budget } = body

    // Validate fields if provided
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (subject !== undefined) updateData.subject = subject
    if (budget !== undefined) {
      updateData.budget = typeof budget === 'string' ? parseFloat(budget) : budget
    }
    if (deadline !== undefined) {
      const deadlineDate = new Date(deadline)
      if (isNaN(deadlineDate.getTime())) {
        return NextResponse.json(
          { message: 'Invalid deadline date' },
          { status: 400 }
        )
      }
      updateData.deadline = deadlineDate
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
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

    try {
      broadcastTaskUpdate('updated', updatedTask.id, updatedTask)
    } catch (error) {
      console.error('Error emitting task update:', error)
    }

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const taskId = params.id

    // Check if task exists and user owns it
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, posterId: true, status: true, accepterId: true, title: true }
    })

    if (!existingTask) {
      return NextResponse.json(
        { message: 'Task not found' },
        { status: 404 }
      )
    }

    if (existingTask.posterId !== String(session.user.id)) {
      return NextResponse.json(
        { message: 'Forbidden: You can only delete your own tasks' },
        { status: 403 }
      )
    }

    // Validation: Can't delete tasks that have been accepted
    if (existingTask.status !== 'OPEN') {
      return NextResponse.json(
        { message: 'Cannot delete tasks that have been accepted or completed' },
        { status: 400 }
      )
    }

    await prisma.task.delete({
      where: { id: taskId }
    })

    try {
      broadcastTaskUpdate('cancelled', taskId, null)
    } catch (error) {
      console.error('Error emitting task delete update:', error)
    }

    return NextResponse.json(
      { message: 'Task deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
