import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(String(session.user.id), 10)
    
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: [
        { readAt: 'asc' }, // unread first (readAt: null)
        { createdAt: 'desc' }
      ],
      take: 30
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}