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

    const userId = String(session.user.id)

    const tasks = await prisma.task.findMany({
      where: { 
        posterId: userId 
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        budget: true,
        status: true,
        deadline: true,
        createdAt: true,
      },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching posted tasks:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
