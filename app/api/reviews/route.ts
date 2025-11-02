import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { taskId, receiverId, rating, comment } = await request.json()

    // Ensure numeric IDs for Prisma (schema uses Int)
    const receiverIdNum = typeof receiverId === 'string' ? parseInt(receiverId, 10) : receiverId
    const taskIdNum = typeof taskId === 'string' ? parseInt(taskId, 10) : taskId
    const reviewerIdRaw = session.user?.id
    const reviewerIdNum = typeof reviewerIdRaw === 'string' ? parseInt(reviewerIdRaw, 10) : reviewerIdRaw

    if (!Number.isInteger(receiverIdNum) || !Number.isInteger(taskIdNum) || !Number.isInteger(reviewerIdNum)) {
      return NextResponse.json({ message: 'Invalid IDs provided' }, { status: 400 })
    }

    // Verify task exists and user is involved
    const task = await prisma.task.findFirst({
      where: {
        id: taskIdNum,
        OR: [
          { posterId: reviewerIdNum },
          { accepterId: reviewerIdNum }
        ],
        status: 'COMPLETED'
      }
    })

    if (!task) {
      return NextResponse.json(
        { message: 'Task not found or not completed' },
        { status: 404 }
      )
    }

    // Check if user has already reviewed this task
    const existingReview = await prisma.review.findFirst({
      where: {
        taskId: taskIdNum,
        reviewerId: reviewerIdNum
      }
    })

    if (existingReview) {
      return NextResponse.json(
        { message: 'You have already reviewed this task' },
        { status: 400 }
      )
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        taskId: taskIdNum,
        reviewerId: reviewerIdNum,
        receiverId: receiverIdNum,
        rating,
        comment,
      },
      include: {
        reviewer: {
          select: {
            name: true,
            avatar: true,
          }
        }
      }
    })

    // Update user's average rating
    const userReviews = await prisma.review.findMany({
      where: { receiverId: receiverIdNum },
      select: { rating: true }
    })

    const averageRating = userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length

    await prisma.user.update({
      where: { id: receiverIdNum },
      data: {
        rating: averageRating,
        reviewCount: userReviews.length,
      }
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      )
    }

    const userIdNum = parseInt(userId, 10)
    if (!Number.isInteger(userIdNum)) {
      return NextResponse.json({ message: 'Invalid userId' }, { status: 400 })
    }

    const reviews = await prisma.review.findMany({
      where: { receiverId: userIdNum },
      include: {
        reviewer: {
          select: {
            name: true,
            avatar: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const user = await prisma.user.findUnique({
      where: { id: userIdNum },
      select: {
        rating: true,
        reviewCount: true,
      }
    })

    return NextResponse.json({
      reviews,
      averageRating: user?.rating || 0,
      totalReviews: user?.reviewCount || 0,
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
