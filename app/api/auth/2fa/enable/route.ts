import { NextResponse } from 'next/server'
import { authenticator } from 'otplib'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { code, secret } = await req.json()
  if (!code || !secret) return NextResponse.json({ message: 'Missing code or secret' }, { status: 400 })

  // Verify TOTP code
  const valid = authenticator.check(code, secret)
  if (!valid) return NextResponse.json({ message: 'Invalid code' }, { status: 400 })

  // Save secret and enable 2FA
  await prisma.user.update({
    where: { id: String(session.user.id) },
    data: {
      twoFactorEnabled: true,
      totpSecret: secret,
    },
  })

  return NextResponse.json({ ok: true })
}
