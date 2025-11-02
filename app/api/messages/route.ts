import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { messageBroadcaster } from '@/lib/messageBroadcaster'
import { notifyNewMessage } from '@/lib/notifications'

const parseId = (value: unknown) => {
  if (typeof value === 'number' && Number.isInteger(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    if (!Number.isNaN(parsed)) return parsed
  }
  return null
}

async function requireTaskWithAccess(taskId: number, userId: number) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      posterId: true,
      accepterId: true,
    },
  })

  if (!task) {
    return { task: null, authorized: false }
  }

  const isPoster = task.posterId === userId
  const isAccepter = task.accepterId === userId

  return { task, authorized: isPoster || isAccepter }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = parseId(session?.user?.id)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = parseId(searchParams.get('taskId'))
    if (!taskId) {
      return NextResponse.json({ error: 'taskId query parameter is required' }, { status: 400 })
    }

    const { task, authorized } = await requireTaskWithAccess(taskId, userId)

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const messages = await prisma.message.findMany({
      where: { taskId: task.id },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    console.log(`📨 User ${userId} fetched ${messages.length} messages for task ${taskId}`)
    return NextResponse.json(messages)
  } catch (error) {
    console.error('Messages GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = parseId(session?.user?.id)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null) as { taskId?: number | string; content?: string } | null
    const taskId = parseId(body?.taskId)
    const content = body?.content?.trim()

    if (!taskId || !content) {
      return NextResponse.json({ error: 'taskId and content are required' }, { status: 400 })
    }

    if (content.length === 0) {
      return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 })
    }

    const { task, authorized } = await requireTaskWithAccess(taskId, userId)

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const receiverId =
      userId === task.posterId ? task.accepterId ?? null : task.posterId

    if (!receiverId) {
      return NextResponse.json(
        { error: 'Cannot send a message until the task has an accepted participant' },
        { status: 400 },
      )
    }

    const message = await prisma.message.create({
      data: {
        taskId: task.id,
        senderId: userId,
        receiverId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    console.log(`✅ message created by user ${userId} in task ${taskId}`)

    // Broadcast the new message to all connected clients for this task
    try {
      messageBroadcaster.broadcast(String(taskId), {
        type: 'message',
        message: message,
      })
      
      // Notify the receiver about the new message
      await notifyNewMessage(receiverId, message.sender.name || 'Someone', taskId)
    } catch (broadcastError) {
      console.error('Error broadcasting new message:', broadcastError)
    }

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Messages POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
