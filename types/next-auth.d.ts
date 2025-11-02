import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface User {
    id?: number | string
    role?: string
    avatar?: string | null
  }

  interface Session {
    user: {
      id?: number | string
      name?: string | null
      email?: string | null
      role?: string
      avatar?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub?: string
    role?: string
    avatar?: string | null
  }
}
