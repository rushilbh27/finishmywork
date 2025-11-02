import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ message: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Update payment status in database
        await prisma.payment.update({
          where: {
            stripePaymentId: paymentIntent.id,
          },
          data: {
            status: 'COMPLETED',
          },
        })

        // Update task status to completed
        const payment = await prisma.payment.findUnique({
          where: {
            stripePaymentId: paymentIntent.id,
          },
          include: {
            task: true,
          },
        })

        if (payment) {
          await prisma.task.update({
            where: {
              id: payment.taskId,
            },
            data: {
              status: 'COMPLETED',
            },
          })
        }

        break
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Update payment status to failed
        await prisma.payment.update({
          where: {
            stripePaymentId: paymentIntent.id,
          },
          data: {
            status: 'FAILED',
          },
        })
        break
      }
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { message: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
