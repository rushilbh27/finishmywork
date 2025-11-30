import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { broadcastTaskUpdate } from '@/lib/realtime'
import { Prisma } from '@prisma/client'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id ? String(session.user.id) : null

    // Get blocked user IDs if user is logged in
    let blockedUserIds: string[] = []
    if (userId) {
      const blockedRelations = await prisma.blockedUser.findMany({
        where: {
          OR: [
            { blockerId: userId },
            { blockedId: userId },
          ],
        },
        select: {
          blockerId: true,
          blockedId: true,
        },
      })
      
      blockedUserIds = blockedRelations.map(rel => 
        rel.blockerId === userId ? rel.blockedId : rel.blockerId
      )
    }

    const tasks = await prisma.task.findMany({
      where: { 
        status: 'OPEN',
        // Hide tasks from blocked users
        ...(blockedUserIds.length > 0 && {
          posterId: { notIn: blockedUserIds },
        }),
      },
      include: {
        poster: {
          select: { name: true, university: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, subject, deadline, budget, location: taskLocation, mediaUrls } = body
    console.log('Task creation request:', body)

    const posterId = String(session.user.id)

    // Email verification guard (schema fields exist at runtime)
    const dbUser = (await prisma.user.findUnique({
      where: { id: posterId },
    })) as any
    if (!dbUser?.emailVerified) {
      return NextResponse.json({ message: 'Email not verified' }, { status: 403 })
    }

    if (!title || !description || !subject || !budget || !deadline) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    const deadlineDate = new Date(deadline)
    if (isNaN(deadlineDate.getTime())) {
      return NextResponse.json({ message: 'Invalid deadline date' }, { status: 400 })
    }

    // ✅ use prisma.user (matches model User)
    const poster = await prisma.user.findUnique({
      where: { id: posterId },
      select: { location: true, latitude: true, longitude: true },
    })

    if (!poster) {
      return NextResponse.json({ message: 'Poster not found' }, { status: 404 })
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        subject,
        deadline: deadlineDate,
        budget: new Prisma.Decimal(budget), // ✅ fixed reference
        posterId,
        // Use task location if provided, otherwise fall back to user location
        location: taskLocation || poster.location || 'Not specified',
        latitude: poster.latitude,
        longitude: poster.longitude,
        mediaUrls: mediaUrls || [],
      },
      include: {
        poster: {
          select: { name: true, university: true },
        },
      },
    })

    try {
      broadcastTaskUpdate('created', task.id, task)

      // Create notifications for nearby students (same college/location)
      try {
        const { notifyTaskCreated } = await import('@/lib/notifications')
        // Fire-and-forget
        notifyTaskCreated(task).catch((err: any) => console.error('notifyTaskCreated error:', err))
      } catch (err) {
        console.error('Failed to import notifyTaskCreated:', err)
      }
    } catch (error) {
      console.error('Broadcast error:', error)
    }

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
