import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOTP, hashOTP, addMinutes } from '@/lib/tokens'

import { sendMail } from '@/lib/email'
import { PasswordResetEmail } from '@/lib/email/templates/PasswordResetEmail'

const rl = new Map<string, { count: number; resetAt: number }>()
function rateLimit(ip: string, limit = 5, windowMs = 15 * 60_000) {
  const now = Date.now()
  const entry = rl.get(ip) ?? { count: 0, resetAt: now + windowMs }
  if (now > entry.resetAt) {
    entry.count = 0; entry.resetAt = now + windowMs
  }
  entry.count++; rl.set(ip, entry)
  if (entry.count > limit) throw new Error('Too many requests')
}

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get('x-forwarded-for') ?? 'local').split(',')[0].trim()
    rateLimit(ip)

    const { email } = await req.json()
    if (!email) return NextResponse.json({ message: 'Email required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ ok: true }) // avoid enumeration

    // Generate 6-digit OTP
    const otp = generateOTP()
    const otpHash = hashOTP(otp)
    const expiresAt = addMinutes(new Date(), 10) // 10 minutes expiry

    // @ts-ignore - model exists in runtime schema
    await (prisma as any).passwordResetToken.create({
      data: { email, tokenHash: otpHash, expiresAt },
    })

    const html = PasswordResetEmail({ otp })

    await sendMail({
      to: email,
      subject: 'Your FinishMyWork verification code',
      html,
      text: `Your FinishMyWork password reset code is: ${otp}. This code expires in 10 minutes.`,
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    const msg = e?.message || 'Server error'
    const code = msg.includes('Too many') ? 429 : 500
    return NextResponse.json({ message: msg }, { status: code })
  }
}
