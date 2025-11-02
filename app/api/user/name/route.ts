import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateNameSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
})

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = updateNameSchema.parse(body)

    // Optional: Check if name is already taken (uncomment if you want unique names)
    // const existingUser = await prisma.user.findFirst({
    //   where: { 
    //     name: { equals: name, mode: 'insensitive' },
    //     id: { not: parseInt(session.user.id as string) }
    //   },
    // })
    
    // if (existingUser) {
    //   return NextResponse.json({ error: 'Name already taken' }, { status: 400 })
    // }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(session.user.id as string) },
      data: { name },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Name update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}