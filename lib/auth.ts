import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter' // ✅ use the @auth version (not @next-auth)
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  // ✅ Adapter needed for Google (so users/accounts are stored in DB)
  adapter: PrismaAdapter(prisma),

  providers: [
    // 🟣 Google OAuth — new addition
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // 🟡 Credentials (your existing one)
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        console.log('✅ Auth - Prisma client initialized:', !!prisma)

        if (!credentials?.email || !credentials?.password) {
          console.warn('❌ Missing credentials')
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          console.warn('❌ User not found:', credentials.email)
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password ?? ''
        )

        if (!isPasswordValid) {
          console.warn('❌ Invalid password for:', user.email)
          return null
        }

        console.log('✅ Authenticated:', user.email)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        }
      },
    }),
  ],

  // ✅ Use DB sessions for Google, but JWT also works — choose one:
  // If you want speed and no DB load, keep "jwt".
  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/auth/signin',
  },

  callbacks: {
    async signIn({ user, account }) {
      // ✅ Only block credentials users if not verified
      if (account?.provider === 'credentials') {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        })
        if (!dbUser?.emailVerified) {
          throw new Error('EMAIL_NOT_VERIFIED')
        }
      }

      // ✅ If Google user logs in first time, ensure they're inserted in DB (adapter handles this)
      return true
    },

    async jwt({ token, user, account }) {
      // ✅ Add Google user role + avatar
      if (user) {
        token.role = (user as any).role || 'STUDENT'
        token.avatar = (user as any).avatar || null
      }
      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.avatar = token.avatar as string | null
      }
      return session
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
}
