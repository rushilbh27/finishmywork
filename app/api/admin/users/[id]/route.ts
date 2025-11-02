import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(params.id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        university: true,
        major: true,
        year: true,
        location: true,
        bio: true,
        rating: true,
        reviewCount: true,
        createdAt: true,
        _count: { select: { postedTasks: true, acceptedTasks: true } },
        postedTasks: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, status: true, budget: true, createdAt: true }
        },
        acceptedTasks: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, status: true, budget: true, createdAt: true }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Admin get user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(params.id)
    
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Check if trying to delete another admin
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (userToDelete.role === 'ADMIN') {
      return NextResponse.json({ error: 'Cannot delete admin users' }, { status: 403 })
    }

    // Delete user and related data (similar to the user delete route)
    await prisma.$transaction(async (tx) => {
      // Delete related records first
      await tx.review.deleteMany({ 
        where: { 
          OR: [
            { reviewerId: userId }, 
            { receiverId: userId },
            { task: { posterId: userId } }
          ]
        } 
      })
      
      await tx.message.deleteMany({ 
        where: { 
          OR: [
            { senderId: userId }, 
            { receiverId: userId },
            { task: { posterId: userId } }
          ]
        } 
      })
      
      await tx.payment.deleteMany({ 
        where: { 
          OR: [
            { userId },
            { task: { posterId: userId } }
          ]
        } 
      })
      
      // Remove user as accepter
      await tx.task.updateMany({
        where: { accepterId: userId },
        data: { accepterId: null }
      })
      
      // Delete all tasks posted by this user
      await tx.task.deleteMany({
        where: { posterId: userId }
      })
      
      // Finally delete the user
      await tx.user.delete({ where: { id: userId } })
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Admin delete user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}