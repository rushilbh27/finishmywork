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

    const userId = String(session.user.id)

    // Get blocked user IDs
    const blockedRelations = await prisma.blockedUser.findMany({
      where: {
        OR: [
          { blockerId: userId },
          { blockedId: userId },
        ],
      },
      select: {
        blockerId: true,
        blockedId: true,
      },
    })
    
    const blockedUserIds = blockedRelations.map(rel => 
      rel.blockerId === userId ? rel.blockedId : rel.blockerId
    )

    const tasks = await prisma.task.findMany({
      where: {
        OR: [{ posterId: userId }, { accepterId: userId }],
        status: { in: ['IN_PROGRESS', 'COMPLETED'] },
        // Exclude tasks where the other participant is blocked
        ...(blockedUserIds.length > 0 && {
          AND: [
            { posterId: { notIn: blockedUserIds } },
            { 
              OR: [
                { accepterId: null },
                { accepterId: { notIn: blockedUserIds } },
              ],
            },
          ],
        }),
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
      const role = task.posterId?.toString() === userId ? 'poster' : 'accepter'
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
