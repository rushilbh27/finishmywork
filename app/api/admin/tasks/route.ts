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

    // Fetch tasks with just IDs (no relations)
    const tasks = await prisma.task.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        budget: true,
        createdAt: true,
        posterId: true,
        accepterId: true,
        description: true,
        subject: true,
        deadline: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    // Fetch all unique user IDs
    const userIds = Array.from(new Set([
      ...tasks.map(t => t.posterId),
      ...tasks.filter(t => t.accepterId).map(t => t.accepterId!)
    ]))

    // Fetch users separately
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true }
    })

    // Create a map for quick lookup
    const userMap = new Map(users.map(u => [u.id, u]))

    // Combine data
    const tasksWithUsers = tasks.map(task => ({
      ...task,
      poster: userMap.get(task.posterId),
      accepter: task.accepterId ? userMap.get(task.accepterId) : null
    }))

    return NextResponse.json(tasksWithUsers)
  } catch (error) {
    console.error('Admin tasks error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}