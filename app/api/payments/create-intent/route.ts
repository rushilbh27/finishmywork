import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { taskId: taskIdRaw, amount } = await request.json()
    const taskId = String(taskIdRaw)
    const userId = String(session.user.id)

    // Verify task exists and user is the poster
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        posterId: userId,
        status: 'IN_PROGRESS'
      }
    })

    if (!task) {
      return NextResponse.json(
        { message: 'Task not found or not in progress' },
        { status: 404 }
      )
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        taskId: String(taskId),
        userId: String(userId),
      },
    })

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        amount,
        taskId,
        userId,
        stripePaymentId: paymentIntent.id,
        status: 'PENDING',
      }
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
