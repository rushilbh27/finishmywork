import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Block a user
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { blockedId, reason } = await req.json()

    if (!blockedId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    if (blockedId === session.user.id) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 })
    }

    // Create mutual block (both sides can't see each other)
    await prisma.blockedUser.create({
      data: {
        blockerId: session.user.id,
        blockedId,
        reason,
      },
    })

    return NextResponse.json({ success: true, message: 'User blocked successfully' })
  } catch (error) {
    console.error('Error blocking user:', error)
    return NextResponse.json({ error: 'Failed to block user' }, { status: 500 })
  }
}

// Unblock a user
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { blockedId } = await req.json()

    if (!blockedId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    await prisma.blockedUser.deleteMany({
      where: {
        blockerId: session.user.id,
        blockedId,
      },
    })

    return NextResponse.json({ success: true, message: 'User unblocked successfully' })
  } catch (error) {
    console.error('Error unblocking user:', error)
    return NextResponse.json({ error: 'Failed to unblock user' }, { status: 500 })
  }
}

// Get blocked users list
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const blocked = await prisma.blockedUser.findMany({
      where: {
        blockerId: session.user.id,
      },
      include: {
        blocked: {
          select: {
            id: true,
            name: true,
            avatar: true,
            university: true,
          },
        },
      },
    })

    // Transform to match frontend expectation
    const formattedBlocked = blocked.map(b => ({
      id: b.id,
      blockedUser: b.blocked,
      reason: b.reason,
      createdAt: b.createdAt.toISOString(),
    }))

    return NextResponse.json(formattedBlocked)
  } catch (error) {
    console.error('Error fetching blocked users:', error)
    return NextResponse.json({ error: 'Failed to fetch blocked users' }, { status: 500 })
  }
}
