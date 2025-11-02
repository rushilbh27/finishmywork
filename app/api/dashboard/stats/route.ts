import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id as string, 10)
    if (isNaN(userId)) {
      return NextResponse.json({ message: 'Invalid user id' }, { status: 400 })
    }

    // ✅ Fetch counts and aggregates
    const [postedTasks, acceptedTasks, completedTasks, reviews] = await Promise.all([
      prisma.task.count({ where: { posterId: userId } }),
      prisma.task.count({ where: { accepterId: userId } }),
      prisma.task.findMany({
        where: { accepterId: userId, status: 'COMPLETED' },
        select: { budget: true },
      }),
      prisma.review.findMany({
        where: { receiverId: userId },
        select: { rating: true },
      }),
    ])

    const totalEarnings = completedTasks.reduce(
      (sum, task) => sum + Number(task.budget),
      0
    )

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0

    return NextResponse.json({
      postedTasks,
      acceptedTasks,
      totalEarnings,
      averageRating,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
