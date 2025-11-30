import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { broadcastReviewCreated } from '@/lib/realtime'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { taskId, receiverId, rating, comment } = await request.json()

    // All IDs are now strings (CUID)
    const reviewerId = String(session.user.id)
    const receiverIdStr = String(receiverId)
    const taskIdStr = String(taskId)

    // Verify task exists and user is involved
    const task = await prisma.task.findFirst({
      where: {
        id: taskIdStr,
        OR: [
          { posterId: reviewerId },
          { accepterId: reviewerId }
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
        taskId: taskIdStr,
        reviewerId: reviewerId
      }
    })

    if (existingReview) {
      return NextResponse.json(
        { message: 'You have already reviewed this task' },
        { status: 400 }
      )
    }

    // Use a transaction to create review and update receiver's rating atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create the review
      const created = await tx.review.create({
        data: {
          taskId: taskIdStr,
          reviewerId: reviewerId,
          receiverId: receiverIdStr,
          rating,
          comment,
        },
        include: {
          reviewer: {
            select: { id: true, name: true, avatar: true }
          }
        }
      })

      // Fetch current receiver stats
      const receiver = await tx.user.findUnique({ where: { id: receiverIdStr }, select: { rating: true, reviewCount: true } })

      const oldRating = receiver?.rating ?? 0
      const oldCount = receiver?.reviewCount ?? 0

      const newCount = oldCount + 1
      const newAverage = newCount === 0 ? rating : ((oldRating * oldCount) + rating) / newCount

      await tx.user.update({
        where: { id: receiverIdStr },
        data: {
          rating: newAverage,
          reviewCount: newCount,
        }
      })

      return created
    })

    // After transaction: create notifications and broadcast via SSE
    try {
      // Notify the receiver that they got a new review
      await createNotification({
        userId: receiverIdStr,
        type: 'TASK_REVIEW',
        title: 'New review received',
        body: `${result.reviewer.name} left a review for your task.`,
        link: `/tasks/${taskIdStr}`,
      })

      // Prompt the other party to leave a review if they haven't already
      const partnerId = reviewerId === String(task.posterId) ? String(task.accepterId ?? '') : String(task.posterId)
      if (partnerId) {
        const partnerAlreadyReviewed = await prisma.review.findFirst({ where: { taskId: taskIdStr, reviewerId: partnerId } })
        if (!partnerAlreadyReviewed) {
          await createNotification({
            userId: partnerId,
            type: 'TASK_REVIEW',
            title: 'How was your experience?',
            body: `${result.reviewer.name} left a review — please rate your experience with them.`,
            link: `/tasks/${taskIdStr}`,
          })
        }
      }

      // Broadcast review_created event so connected clients can refresh in real-time
      broadcastReviewCreated(taskIdStr, { review: result, reviewerId: reviewerId, receiverId: receiverIdStr })
    } catch (err) {
      console.error('Error creating notifications/broadcasting for review:', err)
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    // Handle unique constraint (user already reviewed concurrently)
    // Prisma unique constraint error code is P2002
    // @ts-ignore
    if (error && (error.code === 'P2002' || error.meta?.target?.includes('taskId_reviewerId'))) {
      return NextResponse.json({ message: 'You have already reviewed this task' }, { status: 409 })
    }

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

    const userIdStr = String(userId)

    const reviews = await prisma.review.findMany({
      where: { receiverId: userIdStr },
      include: {
        reviewer: {
          select: {
            id: true,
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
      where: { id: userIdStr },
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
