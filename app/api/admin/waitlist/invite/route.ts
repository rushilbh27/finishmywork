import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendMail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // ✅ Admin auth check
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email } = await req.json()
    const normalized = email.trim().toLowerCase()

    const entry = await prisma.waitlist.findUnique({ where: { email: normalized } })
    if (!entry) {
      return NextResponse.json({ error: 'Waitlist entry not found' }, { status: 404 })
    }

    if (entry.status === 'invited') {
      return NextResponse.json({ error: 'Already invited' }, { status: 400 })
    }

    const signupLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signup?email=${normalized}`

    await sendMail({
      to: normalized,
      subject: '🎉 You\'re Invited to FinishMyWork!',
      html: getInviteEmailHTML(entry.name || 'there', signupLink),
      text: `Hi ${entry.name || 'there'},\n\nYou're invited to join FinishMyWork - the ultimate student task marketplace!\n\nClick here to create your account: ${signupLink}\n\nWelcome aboard!\n\n- The FinishMyWork Team`,
    })

    await prisma.waitlist.update({
      where: { email: normalized },
      data: { status: 'invited' },
    })

    // If the email already belongs to a user, create an in-app notification as well
    try {
      const { notifyWaitlistApproved } = await import('@/lib/notifications')
      notifyWaitlistApproved(normalized).catch((err: any) => console.error('notifyWaitlistApproved error:', err))
    } catch (err) {
      console.error('Failed to import notifyWaitlistApproved:', err)
    }

    return NextResponse.json({ success: true, message: 'Invite sent successfully' })
  } catch (error) {
    console.error('Invite error:', error)
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 })
  }
}

function getInviteEmailHTML(name: string, signupLink: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to FinishMyWork</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0a;color:#fff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);border-radius:16px;border:1px solid rgba(147,51,234,0.2);">
          
          <!-- Header -->
          <tr>
            <td style="padding:40px 40px 20px;text-align:center;">
              <h1 style="margin:0;font-size:32px;font-weight:700;background:linear-gradient(135deg, #9333EA, #4F46E5);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">
                🎉 You're Invited!
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:0 40px 40px;">
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#e5e5e5;">
                Hi <strong>${name}</strong>,
              </p>
              
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#e5e5e5;">
                Congratulations! You've been selected from our waitlist to join <strong style="background:linear-gradient(135deg, #9333EA, #4F46E5);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">FinishMyWork</strong> — the ultimate student task marketplace.
              </p>
              
              <p style="margin:0 0 30px;font-size:16px;line-height:1.6;color:#e5e5e5;">
                Start posting tasks, earning money, and connecting with peers in your area today!
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:20px 0;">
                    <a href="${signupLink}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg, #9333EA, #4F46E5);color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:16px;box-shadow:0 4px 20px rgba(147,51,234,0.4);">
                      Get Started →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin:30px 0 0;font-size:14px;line-height:1.6;color:#a3a3a3;">
                This invitation is exclusively for you. If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding:30px 40px;border-top:1px solid rgba(255,255,255,0.1);text-align:center;">
              <p style="margin:0;font-size:12px;color:#737373;">
                © ${new Date().getFullYear()} FinishMyWork. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
