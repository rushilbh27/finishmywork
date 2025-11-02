import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashOTP } from '@/lib/tokens'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json()
    if (!email || !otp || !newPassword) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 })
    }

    // Verify OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json({ message: 'Invalid OTP format' }, { status: 400 })
    }

    const otpHash = hashOTP(otp)
    // @ts-ignore - model exists in runtime schema
    const record = await (prisma as any).passwordResetToken.findUnique({ where: { tokenHash: otpHash } })
    if (!record || record.email !== email) {
      return NextResponse.json({ message: 'Invalid OTP' }, { status: 400 })
    }
    if (record.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ message: 'OTP expired' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(String(newPassword), 12)
    await prisma.user.update({ where: { email }, data: { password: hashed } })

    // @ts-ignore - model exists in runtime schema
    await (prisma as any).passwordResetToken.delete({ where: { tokenHash: otpHash } })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Server error' }, { status: 500 })
  }
}
