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

    const { userEmail, userName } = await req.json()
    const blockId = params.id

    // Get block details
    const block = await prisma.blockedUser.findUnique({
      where: { id: blockId },
      include: {
        blocker: {
          select: {
            name: true,
            email: true,
          },
        },
        blocked: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!block) {
      return NextResponse.json({ error: 'Block record not found' }, { status: 404 })
    }

    // Determine if this user is the blocker or the blocked
    const isBlocker = block.blocker.email === userEmail
    const otherParty = isBlocker ? block.blocked : block.blocker

    const subject = 'User Interaction Notice - FinishMyWork'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">User Interaction Notice</h2>
        <p>Dear ${userName},</p>
        <p>This is a notification regarding a user blocking action on FinishMyWork.</p>
        
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold;">Block Details:</p>
          ${isBlocker ? (
            `<p style="margin: 8px 0 0 0;">You blocked <strong>${otherParty.name}</strong> (${otherParty.email})</p>`
          ) : (
            `<p style="margin: 8px 0 0 0;">You were blocked by <strong>${otherParty.name}</strong></p>`
          )}
          ${block.reason ? `<p style="margin: 8px 0 0 0;"><strong>Reason:</strong> ${block.reason}</p>` : ''}
          <p style="margin: 8px 0 0 0;"><strong>Date:</strong> ${new Date(block.createdAt).toLocaleString()}</p>
        </div>

        ${!isBlocker ? `
          <p><strong>What this means:</strong></p>
          <ul style="line-height: 1.8;">
            <li>You won't see tasks from this user</li>
            <li>This user won't see your tasks</li>
            <li>You cannot send messages to each other</li>
          </ul>
        ` : ''}

        <p>If you have concerns about this interaction, please review our community guidelines or contact support.</p>
        
        <p style="margin-top: 30px;">
          Best regards,<br>
          The FinishMyWork Team
        </p>
      </div>
    `

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
    console.error('Error sending block notification email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
