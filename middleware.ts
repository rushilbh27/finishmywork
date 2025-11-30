import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1️⃣ Coming-soon redirect (production only)
  if (process.env.NODE_ENV === "production" && pathname === "/") {
    const url = request.nextUrl.clone()
    url.pathname = "/coming-soon"
    return NextResponse.redirect(url)
  }

  // Allow root in dev
  if (process.env.NODE_ENV === "development" && pathname === "/") {
    return NextResponse.next()
  }

  // 2️⃣ Get current session (used for both user + admin protection)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // 3️⃣ User routes — require login
  const protectedPaths = [
    "/dashboard",
    "/messages",
    "/tasks",
    "/profile",
    "/settings",
  ]

  if (protectedPaths.some((p) => pathname.startsWith(p))) {
    if (!token) {
      const signInUrl = request.nextUrl.clone()
      signInUrl.pathname = "/auth/signin"
      signInUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(signInUrl)
    }
  }

  // 4️⃣ Admin routes — require login
  if (pathname.startsWith("/admin")) {
    // Allow access to login page without authentication
    if (pathname === "/admin/login") {
      return NextResponse.next()
    }

    // All other admin routes require authentication
    if (!token) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = "/admin/login"
      return NextResponse.redirect(loginUrl)
    }

    // Must have ADMIN role
    if (token.role !== "ADMIN") {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = "/admin/login"
      return NextResponse.redirect(loginUrl)
    }
  }

  // 5️⃣ Default pass-through
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/dashboard/:path*",
    "/messages/:path*",
    "/tasks/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/api/:path*",
  ],
}
