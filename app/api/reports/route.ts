import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Create a report
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, reportedId, taskId, category, reason } = await req.json()

    if (!type || !category || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (type === 'USER' && !reportedId) {
      return NextResponse.json({ error: 'Reported user ID required' }, { status: 400 })
    }

    if (type === 'TASK' && !taskId) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 })
    }

    const report = await prisma.report.create({
      data: {
        reporterId: session.user.id,
        reportedId: type === 'USER' ? reportedId : null,
        taskId: type === 'TASK' ? taskId : null,
        type,
        category,
        reason,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Report submitted successfully. Our team will review it shortly.',
      reportId: report.id 
    })
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
  }
}

// Get user's reports
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reports = await prisma.report.findMany({
      where: {
        reporterId: session.user.id,
      },
      include: {
        reported: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
