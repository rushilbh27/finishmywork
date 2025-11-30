import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Get all reports (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status')
    const typeFilter = searchParams.get('type')

    const reports = await prisma.report.findMany({
      where: {
        ...(statusFilter && { status: statusFilter as any }),
        ...(typeFilter && { type: typeFilter as any }),
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        reported: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            isSuspended: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Fetch reviewer names separately and task info if needed
    const reportsWithExtras = await Promise.all(
      reports.map(async (report) => {
        const reviewer = report.reviewedBy
          ? await prisma.user.findUnique({
              where: { id: report.reviewedBy },
              select: { id: true, name: true },
            })
          : null

        const task = report.taskId
          ? await prisma.task.findUnique({
              where: { id: report.taskId },
              select: { id: true, title: true, description: true },
            })
          : null

        return {
          ...report,
          reviewer,
          task,
        }
      })
    )

    return NextResponse.json(reportsWithExtras)
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
