import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // NOTE: The User model in Prisma schema does not currently include
    // fields for email verification tokens or an 'emailVerified' flag.
    // Implementing persistent email verification requires adding those
    // fields to the Prisma schema and running a migration.
    // For now, generate a token and (in development) return it so
    // the developer can simulate verification.

    const verificationToken = randomBytes(32).toString('hex')
    console.log(`Verification token for ${user.email}: ${verificationToken}`)

    return NextResponse.json({ 
      message: 'Verification token generated (not persisted). Add schema fields to persist.',
      ...(process.env.NODE_ENV === 'development' && { token: verificationToken }),
    })
  } catch (error) {
    console.error('Email verification send error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Verification token required' }, { status: 400 })
    }

    // Email verification persistence is not implemented because the
    // Prisma schema lacks the necessary fields (verificationToken,
    // verificationTokenExpiry, emailVerified). To enable this endpoint,
    // add those fields to the `User` model and run a migration.
    return NextResponse.json({ error: 'Email verification not implemented' }, { status: 501 })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}