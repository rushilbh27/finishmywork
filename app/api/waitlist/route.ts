import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { email, phone, city, college } = await req.json()

    // Basic validation
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    if (!city || typeof city !== 'string') {
      return NextResponse.json({ error: 'City is required.' }, { status: 400 })
    }

    // Create new entry
    const waitlistEntry = await prisma.waitlist.create({
      data: {
        email,
        phone: phone && typeof phone === 'string' ? phone : undefined,
        city,
        college: college && typeof college === 'string' ? college : undefined,
      },
    })

    return NextResponse.json({ success: true, entry: waitlistEntry })
  } catch (error: any) {
    console.error('❌ Error adding to waitlist:', error)

    if (error.code === 'P2002') {
      // Unique constraint failed (duplicate email)
      return NextResponse.json(
        { error: 'This email is already on the waitlist.' },
        { status: 409 }
      )
    }

    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
