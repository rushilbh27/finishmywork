import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = String(session.user.id)

    // Get all tasks where user is poster or accepter and status allows chat
    const tasks = await prisma.task.findMany({
      where: {
        OR: [{ posterId: userId }, { accepterId: userId }],
        status: { in: ['IN_PROGRESS', 'COMPLETED'] },
        accepterId: { not: null },
      },
      include: {
        poster: {
          select: { id: true, name: true },
        },
        accepter: {
          select: { id: true, name: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            senderId: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    const threads = tasks.map((task) => {
      const isPoster = task.posterId?.toString() === userId
      const partner = isPoster && task.accepter ? task.accepter : task.poster
      const lastMessage = task.messages[0]

      return {
        id: task.id,
        title: task.title,
        status: task.status,
        partner: {
          id: partner.id,
          name: partner.name,
        },
        isPoster,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt.toISOString(),
              isOwn: lastMessage.senderId?.toString() === userId,
            }
          : null,
      }
    })

    return NextResponse.json(threads)
  } catch (error) {
    console.error('Error fetching threads:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
