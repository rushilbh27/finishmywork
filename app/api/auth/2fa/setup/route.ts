import { NextResponse } from 'next/server'
import { authenticator } from 'otplib'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  // Generate TOTP secret
  const secret = authenticator.generateSecret()
  const otpauthUrl = authenticator.keyuri(session.user.email, 'FinishMyWork', secret)

  // Optionally: store secret in session or temp cache (not DB yet)
  return NextResponse.json({ otpauthUrl, secret })
}
