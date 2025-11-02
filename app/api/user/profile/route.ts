import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  bio: z.string().max(500).optional(),
  university: z.string().max(100).optional(),
  major: z.string().max(100).optional(),
  year: z.string().optional(),
  location: z.string().min(2).max(100),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id as string) },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        university: true,
        major: true,
        year: true,
        location: true,
        rating: true,
        reviewCount: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Check if email is being changed and if it's already taken
    if (validatedData.email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      })
      
      if (existingUser) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(session.user.id as string) },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        university: true,
        major: true,
        year: true,
        location: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Profile update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}