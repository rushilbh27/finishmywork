import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureSocketIO, emitTaskCreated } from '@/lib/socketServer'
import { Prisma } from '@prisma/client' // ✅ FIXED: Added this import

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      where: { status: 'OPEN' },
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
    const { title, description, subject, deadline, budget, location: taskLocation } = body
    console.log('Task creation request:', body)

    const posterId = parseInt(String(session.user.id), 10)
    if (!Number.isInteger(posterId)) {
      return NextResponse.json({ message: 'Invalid posterId' }, { status: 400 })
    }

    // Email verification guard
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
      },
      include: {
        poster: {
          select: { name: true, university: true },
        },
      },
    })

    try {
      ensureSocketIO()
      emitTaskCreated(task)
    } catch (error) {
      console.error('Socket emit error:', error)
    }

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
