import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ twoFactorEnabled: false })
  }

  const user = await prisma.user.findUnique({
    where: { id: String(session.user.id) },
    select: { twoFactorEnabled: true },
  })

  return NextResponse.json({ twoFactorEnabled: user?.twoFactorEnabled || false })
}
