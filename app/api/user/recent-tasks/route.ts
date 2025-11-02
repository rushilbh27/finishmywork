import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userIdRaw = session.user.id
    const userId = typeof userIdRaw === 'string' ? Number.parseInt(userIdRaw, 10) : userIdRaw
    if (!Number.isInteger(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tasks = await prisma.task.findMany({
      where: {
        OR: [{ posterId: userId }, { accepterId: userId }],
        status: { in: ['IN_PROGRESS', 'COMPLETED'] },
      },
      include: {
        poster: {
          select: { id: true, name: true, avatar: true },
        },
        accepter: {
          select: { id: true, name: true, avatar: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 25,
    })

    const threads = tasks.map((task) => {
      const role = task.posterId === userId ? 'poster' : 'accepter'
      const otherUser = role === 'poster' ? task.accepter : task.poster
      const lastMessage = task.messages[0]

      return {
        id: task.id,
        title: task.title,
        status: task.status,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        role,
        poster: task.poster,
        accepter: task.accepter,
        otherUser,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              createdAt: lastMessage.createdAt.toISOString(),
              senderId: lastMessage.senderId,
            }
          : null,
      }
    })

    return NextResponse.json(threads)
  } catch (error) {
    console.error('Recent tasks error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
