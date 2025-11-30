import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ message: 'Email required' }, { status: 400 })

  const normalized = email.trim().toLowerCase()

  const existing = await prisma.waitlist.findUnique({ where: { email: normalized } })
  if (!existing) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  // Create user if not exists
  const user = await prisma.user.upsert({
    where: { email: normalized },
    update: {},
    create: {
      email: normalized,
      name: existing.name || normalized.split('@')[0],
      location: existing.city || 'Unknown',
      role: 'STUDENT',
    },
  })

  await prisma.waitlist.update({
    where: { email: normalized },
    data: { status: 'approved' },
  })

  return NextResponse.json({ success: true, user })
}
