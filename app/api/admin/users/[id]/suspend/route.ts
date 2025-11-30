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
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { reason, sendEmail: shouldSendEmail } = await req.json()
    const userId = params.id

    // Get user details before suspending
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        isSuspended: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.isSuspended) {
      return NextResponse.json({ error: 'User is already suspended' }, { status: 400 })
    }

    // Suspend the user
    await prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: true,
        suspendedAt: new Date(),
        suspensionReason: reason || 'Account suspended by administrator',
      },
    })

    // Send email if requested
    if (shouldSendEmail && user.email) {
      try {
        await sendMail({
          to: user.email,
          subject: 'Important: Your FinishMyWork Account Has Been Suspended',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #ef4444;">Account Suspended</h2>
              <p>Dear ${user.name || 'User'},</p>
              <p>Your FinishMyWork account has been suspended.</p>
              
              <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold;">Reason:</p>
                <p style="margin: 8px 0 0 0;">${reason || 'Account suspended by administrator'}</p>
              </div>

              <p><strong>Suspended on:</strong> ${new Date().toLocaleString()}</p>

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

    return NextResponse.json({ 
      success: true, 
      message: 'User suspended successfully',
      emailSent: shouldSendEmail
    })
  } catch (error) {
    console.error('Error suspending user:', error)
    return NextResponse.json({ error: 'Failed to suspend user' }, { status: 500 })
  }
}

// Unsuspend user
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const userId = params.id

    // Unsuspend the user
    await prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: false,
        suspendedAt: null,
        suspensionReason: null,
      },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'User unsuspended successfully'
    })
  } catch (error) {
    console.error('Error unsuspending user:', error)
    return NextResponse.json({ error: 'Failed to unsuspend user' }, { status: 500 })
  }
}
