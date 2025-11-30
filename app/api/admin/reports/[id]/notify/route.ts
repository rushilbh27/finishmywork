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

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, name: true },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { userEmail, emailType } = await req.json()
    const reportId = params.id

    // Get report details
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reported: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Get task details if this is a task report
    let taskTitle = 'Unknown'
    if (report.taskId) {
      const task = await prisma.task.findUnique({
        where: { id: report.taskId },
        select: { title: true },
      })
      taskTitle = task?.title || 'Unknown'
    }

    // Generate email based on selected type
    let subject = ''
    let html = ''

    if (emailType === 'SUSPENDED') {
      // Account Suspended Email
      subject = 'Important: Your FinishMyWork Account Has Been Suspended'
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Account Suspended</h2>
          <p>Dear ${report.reported?.name || 'User'},</p>
          <p>Your FinishMyWork account has been suspended due to a violation of our community guidelines.</p>
          
          <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Reason:</p>
            <p style="margin: 8px 0 0 0;">${report.notes || 'Violation of community guidelines'}</p>
          </div>

          <p><strong>Report Type:</strong> ${report.type}</p>
          <p><strong>Category:</strong> ${report.category}</p>
          ${report.reviewedAt ? `<p><strong>Reviewed on:</strong> ${new Date(report.reviewedAt).toLocaleString()}</p>` : ''}

          <p>If you believe this action was taken in error, please contact our support team.</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            The FinishMyWork Team
          </p>
        </div>
      `
    } else if (emailType === 'TASK_REMOVED') {
      // Task Removed Email
      subject = 'Your Task Has Been Removed from FinishMyWork'
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Task Removed</h2>
          <p>Dear ${report.reported?.name || 'User'},</p>
          <p>Your task "${taskTitle}" has been removed from FinishMyWork.</p>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Reason:</p>
            <p style="margin: 8px 0 0 0;">${report.notes || 'Task violated community guidelines'}</p>
          </div>

          <p><strong>Category:</strong> ${report.category}</p>
          ${report.reviewedAt ? `<p><strong>Reviewed on:</strong> ${new Date(report.reviewedAt).toLocaleString()}</p>` : ''}

          <p>Please ensure future tasks comply with our community guidelines. Repeated violations may result in account suspension.</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            The FinishMyWork Team
          </p>
        </div>
      `
    } else if (emailType === 'WARNING') {
      // Warning Email
      subject = 'Warning: Community Guidelines Violation on FinishMyWork'
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Community Guidelines Warning</h2>
          <p>Dear ${report.reported?.name || 'User'},</p>
          <p>This is a warning regarding your activity on FinishMyWork.</p>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Details:</p>
            <p style="margin: 8px 0 0 0;">${report.notes || 'Please review our community guidelines'}</p>
          </div>

          <p><strong>Report Type:</strong> ${report.type}</p>
          <p><strong>Category:</strong> ${report.category}</p>

          <p>Please take this warning seriously. Continued violations may result in account suspension.</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            The FinishMyWork Team
          </p>
        </div>
      `
    } else if (emailType === 'REPORT_RESOLVED') {
      // Report Resolved Email
      subject = 'Update on Your Report - FinishMyWork'
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8b5cf6;">Report Update</h2>
          <p>Dear ${report.reported?.name || 'User'},</p>
          <p>A report concerning your activity on FinishMyWork has been reviewed.</p>
          
          <div style="background-color: #f3e8ff; border-left: 4px solid #8b5cf6; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Status:</p>
            <p style="margin: 8px 0 0 0;">${report.status}</p>
            ${report.notes ? `<p style="margin: 8px 0 0 0;">${report.notes}</p>` : ''}
          </div>

          <p><strong>Report Type:</strong> ${report.type}</p>
          <p><strong>Category:</strong> ${report.category}</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            The FinishMyWork Team
          </p>
        </div>
      `
    } else {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }

    // Send email
    await sendMail({
      to: userEmail,
      subject,
      html,
    })

    return NextResponse.json({ 
      success: true, 
      message: `Email sent to ${userEmail}`
    })
  } catch (error) {
    console.error('Error sending notification email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
