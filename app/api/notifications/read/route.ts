import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(String(session.user.id), 10)
    
    // Mark all unread notifications as read
    const result = await prisma.notification.updateMany({
      where: { 
        userId,
        readAt: null 
      },
      data: {
        readAt: new Date()
      }
    })

    return NextResponse.json({ 
      message: 'Notifications marked as read',
      count: result.count
    })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}