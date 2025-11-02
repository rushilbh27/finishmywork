import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        console.log('✅ Auth - Prisma client initialized:', !!prisma)
        console.log('✅ Auth - Prisma.user exists:', !!prisma.user)

        if (!credentials?.email || !credentials?.password) {
          console.warn('❌ Missing credentials')
          return null
        }

        // ✅ FIXED: use prisma.user (singular)
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          console.warn('❌ User not found:', credentials.email)
          return null
        }

        // Credentials validation continues; emailVerified will be enforced in callbacks.signIn

        // Validate password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password ?? ''
        )

        if (!isPasswordValid) {
          console.warn('❌ Invalid password for:', user.email)
          return null
        }

        console.log('✅ Authenticated:', user.email)

        // Don’t include password in session
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

  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/auth/signin',
  },

  callbacks: {
    async signIn({ user, account, credentials }) {
      // Only enforce for credentials logins
      if (account?.provider === 'credentials') {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
        if (!dbUser?.emailVerified) {
          // Block sign-in until verified
          // NextAuth can't redirect from here in API, but we can signal an error
          throw new Error('EMAIL_NOT_VERIFIED')
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.avatar = user.avatar
      }
      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.avatar = token.avatar as string
      }
      return session
    },
  },
}
