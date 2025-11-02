import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('✅ Testing Prisma connection and fetching users...')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        university: true,
      },
      take: 10
    })

    console.log(`✅ Found ${users.length} users:`, users)
    
    return NextResponse.json({
      success: true,
      count: users.length,
      users
    })
  } catch (error) {
    console.error('❌ Error fetching users:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
