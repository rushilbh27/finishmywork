import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { authenticator } from 'otplib'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { code } = await req.json()
  if (!code) return NextResponse.json({ message: 'Code required' }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { id: String(session.user.id) },
    select: { totpSecret: true, twoFactorEnabled: true },
  })

  if (!user || !user.twoFactorEnabled || !user.totpSecret) {
    return NextResponse.json({ message: 'Two-factor authentication not enabled' }, { status: 400 })
  }

  const valid = authenticator.check(code, user.totpSecret)
  if (!valid) {
    return NextResponse.json({ message: 'Invalid code' }, { status: 400 })
  }

  // In a production app, you'd set a session flag here to mark 2FA as completed
  // For now, we'll just return success
  return NextResponse.json({ ok: true })
}
