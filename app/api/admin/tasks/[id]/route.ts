import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const taskId = parseInt(params.id)
    
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 })
    }

    // Delete task and related data
    await prisma.$transaction(async (tx) => {
      // Delete related records first
      await tx.review.deleteMany({ where: { taskId } })
      await tx.message.deleteMany({ where: { taskId } })
      await tx.payment.deleteMany({ where: { taskId } })
      
      // Delete the task
      await tx.task.delete({ where: { id: taskId } })
    })

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Admin delete task error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}