import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendMail } from '@/lib/email'

interface RouteContext {
  params: {
    id: string
  }
}

// Update report (admin only)
export async function PATCH(req: NextRequest, { params }: RouteContext) {
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

    const { status, action, notes } = await req.json()
    const reportId = params.id

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Update the report
    const report = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        action,
        notes,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
      include: {
        reported: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    // If action is SUSPEND_USER, suspend the reported user
    if (action === 'SUSPEND_USER' && report.reportedId) {
      await prisma.user.update({
        where: { id: report.reportedId },
        data: {
          isSuspended: true,
          suspendedAt: new Date(),
          suspensionReason: `Report #${report.id}: ${notes || 'Violation of community guidelines'}`,
        },
      })

      // Auto-send suspension email
      if (report.reported?.email) {
        try {
          await sendMail({
            to: report.reported.email,
            subject: 'Important: Your FinishMyWork Account Has Been Suspended',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #ef4444;">Account Suspended</h2>
                <p>Dear ${report.reported.name || 'User'},</p>
                <p>Your FinishMyWork account has been suspended due to a violation of our community guidelines.</p>
                
                <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0;">
                  <p style="margin: 0; font-weight: bold;">Reason:</p>
                  <p style="margin: 8px 0 0 0;">${notes || 'Violation of community guidelines'}</p>
                </div>

                <p><strong>Report Type:</strong> ${report.type}</p>
                <p><strong>Category:</strong> ${report.category}</p>
                <p><strong>Reviewed on:</strong> ${new Date().toLocaleString()}</p>

                <p>If you believe this action was taken in error, please contact our support team.</p>
                
                <p style="margin-top: 30px;">
                  Best regards,<br>
                  The FinishMyWork Team
                </p>
              </div>
            `,
          })
        } catch (emailError) {
          console.error('Failed to send suspension email:', emailError)
        }
      }
    }

    // If action is DELETE_TASK, delete the reported task
    if (action === 'DELETE_TASK' && report.taskId) {
      // Get task details before updating
      const task = await prisma.task.findUnique({
        where: { id: report.taskId },
        include: {
          poster: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      })

      await prisma.task.update({
        where: { id: report.taskId },
        data: {
          status: 'CANCELLED',
        },
      })

      // Auto-send task deletion email
      if (task?.poster?.email) {
        try {
          await sendMail({
            to: task.poster.email,
            subject: 'Your Task Has Been Removed from FinishMyWork',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #f59e0b;">Task Removed</h2>
                <p>Dear ${task.poster.name || 'User'},</p>
                <p>Your task "${task.title}" has been removed from FinishMyWork.</p>
                
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
                  <p style="margin: 0; font-weight: bold;">Reason:</p>
                  <p style="margin: 8px 0 0 0;">${notes || 'Task violated community guidelines'}</p>
                </div>

                <p><strong>Category:</strong> ${report.category}</p>
                <p><strong>Reviewed on:</strong> ${new Date().toLocaleString()}</p>

                <p>Please ensure future tasks comply with our community guidelines. Repeated violations may result in account suspension.</p>
                
                <p style="margin-top: 30px;">
                  Best regards,<br>
                  The FinishMyWork Team
                </p>
              </div>
            `,
          })
        } catch (emailError) {
          console.error('Failed to send task deletion email:', emailError)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Report reviewed successfully',
      report 
    })
  } catch (error) {
    console.error('Error updating report:', error)
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
  }
}
