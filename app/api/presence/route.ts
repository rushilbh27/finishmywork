import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { activeUsers } from '@/lib/realtime'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userIds = req.nextUrl.searchParams.get('userIds')?.split(',') || []
    
    const statuses = userIds.map(userId => ({
      userId,
      status: activeUsers.has(userId) ? 'online' : 'offline',
      timestamp: Date.now()
    }))

    return NextResponse.json({ statuses })
  } catch (error) {
    console.error('Error fetching presence:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, status } = await req.json()

    if (status === 'online') {
      activeUsers.add(userId)
    } else {
      activeUsers.delete(userId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating presence:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
