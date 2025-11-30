import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // ✅ Admin auth check
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const waitlist = await prisma.waitlist.findMany({
      orderBy: { joinedAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        city: true,
        college: true,
        status: true,
        joinedAt: true,
      }
    })
    
    return NextResponse.json(waitlist)
  } catch (error) {
    console.error('Waitlist fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch waitlist' }, { status: 500 })
  }
}
