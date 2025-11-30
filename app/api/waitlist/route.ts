import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { email, phone, name, city, college } = await req.json()

    // ✅ Validate required fields
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 })
    }

    const normalized = email.trim().toLowerCase()

    const existing = await prisma.waitlist.findUnique({ where: { email: normalized } })
    if (existing) {
      return NextResponse.json({ message: 'Already joined' }, { status: 200 })
    }

    const waitlistEntry = await prisma.waitlist.create({
      data: {
        email: normalized,
        phone: phone.trim(),
        name: name && typeof name === 'string' ? name : undefined,
        city: city && typeof city === 'string' ? city : undefined,
        college: college && typeof college === 'string' ? college : undefined,
      },
    })

    return NextResponse.json({ success: true, entry: waitlistEntry })
  } catch (error: any) {
    console.error('❌ Error adding to waitlist:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'This email is already on the waitlist.' },
        { status: 409 }
      )
    }

    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
