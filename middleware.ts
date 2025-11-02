import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ⛔️ Stop any automatic coming-soon redirect during dev
  if (process.env.NODE_ENV === 'development' && pathname === '/') {
    return NextResponse.next()
  }

  // ✅ Only redirect to /coming-soon in production for root path
  if (process.env.NODE_ENV === 'production' && pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/coming-soon'
    return NextResponse.redirect(url)
  }

  // 🔐 Enforce admin OTP only on /admin protected pages
  if (
    pathname.startsWith('/admin') &&
    !pathname.startsWith('/admin/login') &&
    !pathname.startsWith('/admin/otp')
  ) {
    const ok = request.cookies.get('admin-otp-validated')?.value === 'true'
    if (!ok) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/otp'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/api/auth/:path*',
    '/api/tasks/:path*',
    '/api/messages/:path*',
    '/api/user/:path*',
    '/api/dashboard/:path*',
  ],
}
