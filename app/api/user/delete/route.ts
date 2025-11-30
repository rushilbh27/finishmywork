import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { Server as ServerIO } from 'socket.io'

declare global {
  // eslint-disable-next-line no-var
  var io: ServerIO | undefined
}

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  forceDelete: z.boolean().optional().default(false),
})

export async function DELETE(request: NextRequest) {
  try {
    console.log('DELETE /api/user/delete - Request received')
    
    const session = await getServerSession(authOptions)
    console.log('Session:', session)
    
    if (!session?.user?.id) {
      console.log('No session or user ID found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Request body:', body)
    
    const { password, forceDelete } = deleteAccountSchema.parse(body)
    console.log('Password validation passed')

    const userId = String(session.user.id)
    console.log('User ID:', userId)

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    })

    if (!user || !user.password) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      console.error('Account deletion failed: Incorrect password for user', userId)
      return NextResponse.json({ error: 'Incorrect password' }, { status: 400 })
    }

    // Check for active tasks (posted tasks that are not completed/cancelled)
    const activePostedTasks = await prisma.task.count({
      where: { 
        posterId: userId, 
        status: { in: ['OPEN', 'IN_PROGRESS'] } 
      },
    })

    const activeAcceptedTasks = await prisma.task.count({
      where: { 
        accepterId: userId, 
        status: 'IN_PROGRESS' 
      },
    })

    console.log(`Account deletion check for user ${userId}:`, {
      activePostedTasks,
      activeAcceptedTasks,
      totalActive: activePostedTasks + activeAcceptedTasks
    })

    if ((activePostedTasks > 0 || activeAcceptedTasks > 0) && !forceDelete) {
      // Get the actual task details to show to user
      const postedTasks = await prisma.task.findMany({
        where: { 
          posterId: userId, 
          status: { in: ['OPEN', 'IN_PROGRESS'] } 
        },
        select: { id: true, title: true, status: true }
      })

      const acceptedTasks = await prisma.task.findMany({
        where: { 
          accepterId: userId, 
          status: 'IN_PROGRESS' 
        },
        select: { id: true, title: true, status: true }
      })

      console.error('Account deletion failed: Active tasks found', {
        userId,
        postedTasks,
        acceptedTasks
      })

      return NextResponse.json({ 
        error: 'ACTIVE_TASKS_FOUND',
        postedTasks,
        acceptedTasks,
        message: 'You have active tasks that must be handled before account deletion.'
      }, { status: 400 })
    }

    // If forceDelete is enabled, handle active tasks
    if (forceDelete && (activePostedTasks > 0 || activeAcceptedTasks > 0)) {
      console.log('Force delete enabled, handling active tasks for user', userId)
      
      // Get full details of tasks that will be affected for notifications
      const tasksToCancel = await prisma.task.findMany({
        where: {
          posterId: userId,
          status: { in: ['OPEN', 'IN_PROGRESS'] }
        },
        include: {
          accepter: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      const tasksToWithdrawFrom = await prisma.task.findMany({
        where: {
          accepterId: userId,
          status: 'IN_PROGRESS'
        },
        include: {
          poster: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      // Get user info for notifications
      const deletingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true }
      })

      // Cancel posted tasks that are OPEN or IN_PROGRESS
      if (activePostedTasks > 0) {
        const cancelledTasks = await prisma.task.updateMany({
          where: {
            posterId: userId,
            status: { in: ['OPEN', 'IN_PROGRESS'] }
          },
          data: {
            status: 'CANCELLED'
          }
        })
        console.log(`Cancelled ${cancelledTasks.count} posted tasks for user ${userId}`)

        // Notify accepters that their accepted tasks have been cancelled
        for (const task of tasksToCancel) {
          if (task.accepter && task.status === 'IN_PROGRESS') {
            // Send Socket.IO notification to accepter
            if (global.io) {
              global.io.emit('task-cancelled-due-to-account-deletion', {
                userId: task.accepter.id,
                taskId: task.id,
                taskTitle: task.title,
                posterName: deletingUser?.name,
                message: `Task "${task.title}" has been cancelled because the poster deleted their account.`,
                type: 'task_cancelled'
              })
            }
            console.log(`Notified user ${task.accepter.id} that task "${task.title}" was cancelled due to account deletion`)
          }
        }
      }

      // Withdraw from accepted tasks by setting accepterId to null and status back to OPEN
      if (activeAcceptedTasks > 0) {
        const withdrawnTasks = await prisma.task.updateMany({
          where: {
            accepterId: userId,
            status: 'IN_PROGRESS'
          },
          data: {
            accepterId: null,
            status: 'OPEN'
          }
        })
        console.log(`Withdrew from ${withdrawnTasks.count} accepted tasks for user ${userId}`)

        // Notify task posters that the accepter has withdrawn due to account deletion
        for (const task of tasksToWithdrawFrom) {
          if (task.poster) {
            // Send Socket.IO notification to poster
            if (global.io) {
              global.io.emit('task-accepter-withdrawn-due-to-account-deletion', {
                userId: task.poster.id,
                taskId: task.id,
                taskTitle: task.title,
                accepterName: deletingUser?.name,
                message: `${deletingUser?.name} has withdrawn from task "${task.title}" due to account deletion. The task is now open for new applications.`,
                type: 'accepter_withdrawn'
              })
            }
            console.log(`Notified user ${task.poster.id} that ${deletingUser?.name} withdrew from task "${task.title}" due to account deletion`)
          }
        }
      }
    }

    // Start transaction to delete user and related data
    await prisma.$transaction(async (tx) => {
      // Get all tasks posted by this user for cleanup
      const allPostedTasks = await tx.task.findMany({
        where: { posterId: userId },
        select: { id: true }
      })

      // Delete related records first (due to foreign key constraints)
      // Delete reviews for tasks posted by this user
      await tx.review.deleteMany({ 
        where: { 
          OR: [
            { reviewerId: userId }, 
            { receiverId: userId },
            { task: { posterId: userId } }
          ]
        } 
      })
      
      // Delete messages for tasks posted by this user
      await tx.message.deleteMany({ 
        where: { 
          OR: [
            { senderId: userId }, 
            { receiverId: userId },
            { task: { posterId: userId } }
          ]
        } 
      })
      
      // Delete payments related to tasks posted by this user
      await tx.payment.deleteMany({ 
        where: { 
          OR: [
            { userId },
            { task: { posterId: userId } }
          ]
        } 
      })
      
      // Remove user as accepter from tasks where they accepted
      await tx.task.updateMany({
        where: { 
          accepterId: userId
        },
        data: { accepterId: null },
      })
      
      // Delete ALL tasks posted by this user (since posterId is required)
      await tx.task.deleteMany({
        where: { posterId: userId }
      })
      
      // Finally delete the user
      await tx.user.delete({ where: { id: userId } })
    })

    return NextResponse.json({ message: 'Account deleted successfully' })
  } catch (error) {
    console.error('Account deletion error:', error)
    
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors)
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}