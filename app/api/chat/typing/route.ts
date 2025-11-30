import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { broadcastTyping } from '@/lib/realtime'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { taskId, isTyping } = await req.json()

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 })
    }

    // Broadcast typing indicator to all connected clients
    broadcastTyping(String(taskId), String(session.user.id), Boolean(isTyping))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error handling typing indicator:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
