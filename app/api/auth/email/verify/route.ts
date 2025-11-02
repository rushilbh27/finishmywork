import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashToken } from '@/lib/tokens'
import { encode } from 'next-auth/jwt'
import { cookies } from 'next/headers'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { email, token } = await req.json()
    if (!email || !token) {
      return NextResponse.json({ message: 'Missing token or email' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } }) as any
    if (!user?.verificationToken || !user.verificationTokenExpiry) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 400 })
    }

    if (new Date(user.verificationTokenExpiry).getTime() < Date.now()) {
      return NextResponse.json({ message: 'Token expired' }, { status: 400 })
    }

    const tokenHash = hashToken(String(token))
    if (tokenHash !== user.verificationToken) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: user.id },
      // @ts-ignore - fields exist in runtime schema
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        verificationTokenExpiry: null,
      } as any,
    })

    // Return ok:true for frontend to auto-login and redirect
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    const email = url.searchParams.get('email')
    if (!token || !email) {
      return NextResponse.redirect(new URL('/auth/verify-pending?error=expired', url.origin))
    }

    const user = await prisma.user.findUnique({ where: { email } }) as any
    if (!user) {
      return NextResponse.redirect(new URL('/auth/verify-pending?error=expired', url.origin))
    }

    // If already verified, allow idempotent success
    const tokenHash = hashToken(String(token))
    const isExpired = user.verificationTokenExpiry && new Date(user.verificationTokenExpiry).getTime() < Date.now()
    const tokenMatches = user.verificationToken && user.verificationToken === tokenHash

    if (!user.emailVerified) {
      if (!tokenMatches || isExpired) {
        return NextResponse.redirect(new URL('/auth/verify-pending?error=expired', url.origin))
      }
      await prisma.user.update({
        where: { id: user.id },
        // @ts-ignore
        data: { emailVerified: new Date(), verificationToken: null, verificationTokenExpiry: null } as any,
      })
    }

    // Auto-login via NextAuth JWT cookie
    const jwt = await encode({
      token: {
        name: user.name,
        email: user.email,
        picture: user.avatar ?? null,
        sub: String(user.id),
        role: user.role,
        avatar: user.avatar ?? null,
      } as any,
      secret: process.env.NEXTAUTH_SECRET!,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    const res = NextResponse.redirect(new URL('/verified', url.origin))
    const secure = process.env.NODE_ENV !== 'development'
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax' as const,
      path: '/',
      secure,
      maxAge: 60 * 60 * 24 * 30,
    }
    // Set both cookies to be safe across http/https
    res.cookies.set(secure ? '__Secure-next-auth.session-token' : 'next-auth.session-token', jwt, cookieOptions)
    return res
  } catch (e) {
    const url = new URL(req.url)
    return NextResponse.redirect(new URL('/auth/verify-pending?error=expired', url.origin))
  }
}
