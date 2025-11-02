import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { messageBroadcaster } from '@/lib/messageBroadcaster'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id ? parseInt(String(session.user.id)) : null

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { taskId, isTyping } = await request.json()

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 })
    }

    // Broadcast typing status to all clients connected to this task
    messageBroadcaster.broadcast(String(taskId), {
      type: 'typing',
      userId: String(userId),
      isTyping: Boolean(isTyping),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error handling typing indicator:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}