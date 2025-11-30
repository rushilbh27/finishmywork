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

    // ✅ User info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { rating: true, reviewCount: true, createdAt: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // ✅ Counts
    const [tasksPosted, tasksCompleted, earningsResult] = await Promise.all([
      prisma.task.count({ where: { posterId: userId } }),
      prisma.task.count({ where: { accepterId: userId, status: 'COMPLETED' } }),
      prisma.task.aggregate({
        where: { accepterId: userId, status: 'COMPLETED' },
        _sum: { budget: true },
      }),
    ])

    const totalEarnings = Number(earningsResult._sum.budget) || 0

    const stats = {
      tasksPosted,
      tasksCompleted,
      totalEarnings,
      avgRating: user.rating,
      reviewCount: user.reviewCount,
      joinDate: user.createdAt.toISOString(),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('User stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
