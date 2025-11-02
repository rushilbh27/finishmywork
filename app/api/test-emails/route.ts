import { NextRequest, NextResponse } from 'next/server'
import { sendMail } from '@/lib/email'
import { AccountVerificationEmail } from '@/lib/email/templates/AccountVerificationEmail'
import { PasswordResetEmail } from '@/lib/email/templates/PasswordResetEmail'

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ message: 'Disabled in production' }, { status: 403 })
    }

    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ message: 'Email required' }, { status: 400 })
    }

    const origin = req.nextUrl.origin || process.env.APP_URL || process.env.NEXTAUTH_URL || ''
    const logoUrl = process.env.EMAIL_LOGO_URL || (origin ? `${origin}/logo.png` : undefined)

    // 1) Magic-link verification email
    const verifyUrl = `${origin}/api/auth/email/verify?token=TEST_TOKEN&email=${encodeURIComponent(email)}`
    const verificationHTML = AccountVerificationEmail({ url: verifyUrl, logoUrl })
    await sendMail({
      to: email,
      subject: '[TEST] Verify your FinishMyWork email',
      html: verificationHTML,
      text: `Verify: ${verifyUrl}`,
    })

    // 2) Password reset OTP email (uses a fake code for preview)
    const resetHTML = PasswordResetEmail({ otp: '123456' })
    await sendMail({
      to: email,
      subject: '[TEST] Your FinishMyWork verification code',
      html: resetHTML,
      text: `OTP: 123456`,
    })

    // 3) Admin OTP email (simple inline HTML consistent with brand)
    const adminHTML = `<div style="font-family:Inter,system-ui,sans-serif;color:#e5e7eb;background:#0b0f19;padding:24px"><h1 style="color:#fff;margin:0 0 12px">Admin Login Verification</h1><p style="color:#cbd5e1;margin:0 0 12px">Use the following OTP to continue:</p><div style="font-size:28px;letter-spacing:6px;color:#a78bfa;background:rgba(139,92,246,.12);border:1px solid rgba(139,92,246,.35);padding:12px 18px;border-radius:12px;display:inline-block">654321</div><p style="color:#94a3b8;margin:16px 0 0">This code expires in 10 minutes.</p></div>`
    await sendMail({
      to: email,
      subject: '[TEST] Your FinishMyWork admin OTP',
      html: adminHTML,
      text: 'Admin OTP: 654321',
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Server error' }, { status: 500 })
  }
}
