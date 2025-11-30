import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  await prisma.user.update({
    where: { id: String(session.user.id) },
    data: {
      twoFactorEnabled: false,
      totpSecret: null,
    },
  })

  return NextResponse.json({ ok: true })
}
