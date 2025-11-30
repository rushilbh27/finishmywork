import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import type { Prisma } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    console.log('✅ POST /api/auth/register - Prisma client initialized:', !!prisma)
    console.log('✅ Prisma.user exists:', !!prisma.user)
    
    const body = await request.json()
    const { name, email, password, university, major, year, location } = body
    
    console.log('Registration request body:', body)

    // Basic validation
    if (!name || !email) {
      console.log('Validation failed: missing name or email', { name, email })
      return NextResponse.json({ message: 'Name and email are required' }, { status: 400 })
    }

    if (!password || password.length < 6) {
      console.log('Validation failed: invalid password')
      return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Business rule: location is required (non-empty)
    if (!location || String(location).trim().length === 0) {
      console.log('Validation failed: missing location')
      return NextResponse.json({ message: 'Location is required' }, { status: 400 })
    }

    console.log('✅ Prisma client initialized successfully')

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log('User already exists:', email)
      // If user exists but is not verified, resend verification link and return verifyPending
      if (!existingUser.emailVerified) {
        const { createToken, hashToken, addMinutes } = await import('@/lib/tokens')
        const token = createToken()
        const tokenHash = hashToken(token)
        const expiry = addMinutes(new Date(), 15)

        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            verificationToken: tokenHash as unknown as string,
            verificationTokenExpiry: expiry as unknown as Date,
          } as any,
        })

  const { AccountVerificationEmail } = await import('@/lib/email/templates/AccountVerificationEmail')
  const { sendMail } = await import('@/lib/email')
  const origin = request.nextUrl.origin || process.env.APP_URL || process.env.NEXTAUTH_URL || ''
  const url = `${origin}/api/auth/email/verify?token=${token}&email=${encodeURIComponent(existingUser.email)}`
  const logoUrl = process.env.EMAIL_LOGO_URL || (origin ? `${origin}/logo.png` : undefined)
  const html = AccountVerificationEmail({ url, logoUrl })
        await sendMail({
          to: existingUser.email,
          subject: 'Verify your FinishMyWork email',
          html,
          text: `Verify your FinishMyWork account: ${url} (link expires in 15 minutes)`,
        })

        return NextResponse.json({ verifyPending: true, email: existingUser.email, resent: true }, { status: 200 })
      }

      // User exists and is verified
      return NextResponse.json(
        { message: 'User already exists with this email. Please sign in instead.' },
        { status: 409 }
      )
    }

    // Hash password on the server (if provided). Use a reasonable salt rounds.
    let hashed: string | null = null
    if (password) {
      // bcrypt.hash is synchronous in bcryptjs but returns a promise when called via util.promisify; to be safe use hashSync is also acceptable.
      // We'll use the asynchronous API via a small wrapper to avoid blocking the event loop.
      hashed = await new Promise<string>((resolve, reject) => {
        bcrypt.hash(password, 12, (err, hash) => {
          if (err) return reject(err)
          resolve(hash)
        })
      })
    }

    // Build create input and assert the Prisma type. We assert because the generated
    // Prisma types in the workspace may be out-of-sync with the local schema during
    // development; this keeps the runtime shape strict while avoiding excess-property
    // compile errors.
    const createData = {
      name,
      email,
      password: hashed,
      university: university ?? null,
      major: major ?? null,
      year: year ?? null,
      location: location ?? '',
      updatedAt: new Date(), // Required field
    }

    const user = await prisma.user.create({ data: createData })

    // Generate secure token for email verification
  const { createToken, hashToken, addMinutes } = await import('@/lib/tokens')
    const token = createToken()
    const tokenHash = hashToken(token)
  const expiry = addMinutes(new Date(), 15)

    // Store token and expiry on user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: tokenHash as unknown as string,
        verificationTokenExpiry: expiry as unknown as Date,
        emailVerified: null,
      } as any,
    })

    // Send verification email
  const { AccountVerificationEmail } = await import('@/lib/email/templates/AccountVerificationEmail')
  const { sendMail } = await import('@/lib/email')
  const origin = request.nextUrl.origin || process.env.APP_URL || process.env.NEXTAUTH_URL || ''
  const url = `${origin}/api/auth/email/verify?token=${token}&email=${encodeURIComponent(user.email)}`
  const logoUrl = process.env.EMAIL_LOGO_URL || (origin ? `${origin}/logo.png` : undefined)
  const html = AccountVerificationEmail({ url, logoUrl })
    await sendMail({
      to: user.email,
      subject: 'Verify your FinishMyWork email',
      html,
      text: `Verify your FinishMyWork account: ${url} (link expires in 15 minutes)`,
    })

    // Do not return password field to client
    const { password: _pw, ...safeUser } = user as unknown as { password?: string }

    // Return user but do NOT log in; frontend should redirect to /auth/verify-pending
    return NextResponse.json({ user: safeUser, verifyPending: true }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
