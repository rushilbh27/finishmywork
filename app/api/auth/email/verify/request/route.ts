import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createToken, hashToken, addMinutes } from '@/lib/tokens'

import { sendMail } from '@/lib/email'
import { AccountVerificationEmail } from '@/lib/email/templates/AccountVerificationEmail'

// naive in-memory rate limit (per IP)
const rl = new Map<string, { count: number; resetAt: number }>()
function rateLimit(ip: string, limit = 5, windowMs = 15 * 60_000) {
  const now = Date.now()
  const entry = rl.get(ip) ?? { count: 0, resetAt: now + windowMs }
  if (now > entry.resetAt) {
    entry.count = 0
    entry.resetAt = now + windowMs
  }
  entry.count++
  rl.set(ip, entry)
  if (entry.count > limit) throw new Error('Too many requests')
}

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get('x-forwarded-for') ?? 'local').split(',')[0].trim()
    rateLimit(ip)

    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ message: 'Email required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // To avoid user enumeration:
      return NextResponse.json({ ok: true })
    }

  // Generate secure token (magic link)
  const token = createToken()
  const tokenHash = hashToken(token)
  const expiry = addMinutes(new Date(), 15) // 15 minutes expiry

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: tokenHash as unknown as string,
        verificationTokenExpiry: expiry as unknown as Date,
      } as any,
    })

  const origin = new URL(req.url).origin || process.env.APP_URL || process.env.NEXTAUTH_URL || ''
  const url = `${origin}/api/auth/email/verify?token=${token}&email=${encodeURIComponent(email)}`
  const logoUrl = process.env.EMAIL_LOGO_URL || (origin ? `${origin}/logo.png` : undefined)
  const html = AccountVerificationEmail({ url, logoUrl })

    await sendMail({
      to: email,
      subject: 'Verify your FinishMyWork email',
      html,
      text: `Verify your FinishMyWork account: ${url} (link expires in 15 minutes)`,
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    const msg = e?.message || 'Server error'
    const code = msg.includes('Too many') ? 429 : 500
    return NextResponse.json({ message: msg }, { status: code })
  }
}
