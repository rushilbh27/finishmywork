import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateOTP, hashOTP, addMinutes } from '@/lib/tokens'
import { sendMail } from '@/lib/email'

// In-memory store (ephemeral); for multi-instance use Redis or DB
const store = global as any
if (!store.__ADMIN_OTP__) store.__ADMIN_OTP__ = new Map<string, { hash: string; expiresAt: number }>()
const OTP_STORE: Map<string, { hash: string; expiresAt: number }> = store.__ADMIN_OTP__

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: parseInt(String(session.user.id)) } })
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const otp = generateOTP()
    const hash = hashOTP(otp)
    const expiresAt = addMinutes(new Date(), 10).getTime()
    OTP_STORE.set(String(user.id), { hash, expiresAt })

    // Email OTP
    const base = process.env.APP_URL || process.env.NEXTAUTH_URL || req.nextUrl.origin
    await sendMail({
      to: user.email,
      subject: 'Your FinishMyWork admin OTP',
      html: `<div style="font-family:Inter,system-ui,sans-serif;color:#e5e7eb;background:#0b0f19;padding:24px"><h1 style="color:#fff;margin:0 0 12px">Admin Login Verification</h1><p style="color:#cbd5e1;margin:0 0 12px">Use the following OTP to continue:</p><div style="font-size:28px;letter-spacing:6px;color:#a78bfa;background:rgba(139,92,246,.12);border:1px solid rgba(139,92,246,.35);padding:12px 18px;border-radius:12px;display:inline-block">${otp}</div><p style="color:#94a3b8;margin:16px 0 0">This code expires in 10 minutes.</p></div>`,
      text: `Admin OTP: ${otp} (expires in 10 minutes)`
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Server error' }, { status: 500 })
  }
}
