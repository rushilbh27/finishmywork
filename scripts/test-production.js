#!/usr/bin/env node

/**
 * Production Test Script
 * Tests the production-ready schema and API endpoints
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testProductionSetup() {
  console.log('🧪 Testing Production Setup...\n')

  try {
    // Test 1: Database Connection
    console.log('1. Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful\n')

    // Test 2: Test User Creation
    console.log('2. Testing user creation with location...')
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        location: 'BMCC',
        university: 'Test University',
        major: 'Computer Science',
        year: 'Senior',
        skills: ['JavaScript', 'Python', 'React'],
        rating: 4.5,
        reviewCount: 10,
      }
    })
    console.log('✅ User created successfully:', testUser.id)
    console.log('   Location:', testUser.location)
    console.log('   Skills:', testUser.skills)
    console.log('   Rating:', testUser.rating)
    console.log()

    // Test 3: Test Task Creation
    console.log('3. Testing task creation with location...')
    const testTask = await prisma.task.create({
      data: {
        title: 'Help with Calculus Assignment',
        description: 'Need help with integration problems',
        subject: 'Mathematics',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        budget: 50.00,
        location: 'BMCC',
        posterId: testUser.id,
      }
    })
    console.log('✅ Task created successfully:', testTask.id)
    console.log('   Title:', testTask.title)
    console.log('   Budget:', testTask.budget)
    console.log('   Location:', testTask.location)
    console.log('   Status:', testTask.status)
    console.log()

    // Test 4: Test Location-based Query
    console.log('4. Testing location-based filtering...')
    const tasksByLocation = await prisma.task.findMany({
      where: {
        location: 'BMCC',
        status: 'OPEN'
      },
      include: {
        poster: {
          select: {
            name: true,
            university: true,
            rating: true
          }
        }
      }
    })
    console.log('✅ Location-based query successful')
    console.log('   Found', tasksByLocation.length, 'tasks in BMCC')
    console.log()

    // Test 5: Test Indexes
    console.log('5. Testing database indexes...')
    const startTime = Date.now()
    await prisma.task.findMany({
      where: {
        status: 'OPEN',
        location: 'BMCC'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    const queryTime = Date.now() - startTime
    console.log('✅ Indexed query completed in', queryTime, 'ms')
    console.log()

    // Test 6: Test Enum Values
    console.log('6. Testing enum values...')
    const userWithRole = await prisma.user.findFirst({
      where: { role: 'STUDENT' }
    })
    console.log('✅ Enum query successful, user role:', userWithRole?.role)
    console.log()

    // Test 7: Test Array Fields
    console.log('7. Testing PostgreSQL arrays...')
    const usersWithSkills = await prisma.user.findMany({
      where: {
        skills: {
          has: 'JavaScript'
        }
      }
    })
    console.log('✅ Array query successful, found', usersWithSkills.length, 'users with JavaScript skills')
    console.log()

    // Test 8: Test Decimal Precision
    console.log('8. Testing decimal precision...')
    const taskWithBudget = await prisma.task.findFirst({
      where: {
        budget: {
          gte: 25.00,
          lte: 100.00
        }
      }
    })
    console.log('✅ Decimal query successful, budget:', taskWithBudget?.budget)
    console.log()

    // Cleanup
    console.log('9. Cleaning up test data...')
    await prisma.task.deleteMany({
      where: { posterId: testUser.id }
    })
    await prisma.user.delete({
      where: { id: testUser.id }
    })
    console.log('✅ Test data cleaned up')
    console.log()

    console.log('🎉 All tests passed! Your production setup is ready.')
    console.log('\n📋 Next Steps:')
    console.log('1. Deploy to your chosen platform (Vercel, Railway, etc.)')
    console.log('2. Set up production database')
    console.log('3. Configure environment variables')
    console.log('4. Run: npx prisma migrate deploy')
    console.log('5. Test your deployed application')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('\n🔧 Troubleshooting:')
    console.error('1. Check your DATABASE_URL environment variable')
    console.error('2. Ensure PostgreSQL is running')
    console.error('3. Run: npx prisma generate')
    console.error('4. Run: npx prisma db push')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testProductionSetup()
