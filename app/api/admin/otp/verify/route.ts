import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyOTP } from '@/lib/tokens'

const store = global as any
if (!store.__ADMIN_OTP__) store.__ADMIN_OTP__ = new Map<string, { hash: string; expiresAt: number }>()
const OTP_STORE: Map<string, { hash: string; expiresAt: number }> = store.__ADMIN_OTP__

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { otp } = await req.json()
    if (!otp || typeof otp !== 'string') {
      return NextResponse.json({ message: 'OTP required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: parseInt(String(session.user.id)) } })
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const rec = OTP_STORE.get(String(user.id))
    if (!rec || Date.now() > rec.expiresAt) {
      OTP_STORE.delete(String(user.id))
      return NextResponse.json({ message: 'OTP expired' }, { status: 400 })
    }

    if (!verifyOTP(otp, rec.hash)) {
      return NextResponse.json({ message: 'Invalid OTP' }, { status: 400 })
    }

    // Mark validated (set a short-lived cookie)
    const res = NextResponse.json({ ok: true })
    res.cookies.set('admin-otp-validated', 'true', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 10 * 60, // 10 minutes
    })
    OTP_STORE.delete(String(user.id))
    return res
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Server error' }, { status: 500 })
  }
}
