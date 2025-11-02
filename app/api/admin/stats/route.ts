import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // ✅ Fetch all counts in parallel
    const [totalUsers, totalTasks, activeUsers, completedTasks, pendingTasks, revenueResult] =
      await Promise.all([
        prisma.user.count(),
        prisma.task.count(),
        prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.task.count({ where: { status: 'COMPLETED' } }),
        prisma.task.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
        prisma.task.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { budget: true },
        }),
      ])

    const totalRevenue = Number(revenueResult._sum.budget) || 0

    return NextResponse.json({
      totalUsers,
      totalTasks,
      totalRevenue,
      activeUsers,
      completedTasks,
      pendingTasks,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
