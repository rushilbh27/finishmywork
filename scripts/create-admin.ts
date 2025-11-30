import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'rushilbh27@gmail.com' }
    })

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email)
      return
    }

    // Hash the admin password
    const hashedPassword = await bcrypt.hash('AdminRB7210', 12)

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'rushilbh27@gmail.com',
        name: 'Admin Rushil',
        password: hashedPassword,
        role: 'ADMIN',
        university: 'FinishMyWork Admin',
        major: 'Platform Administration',
        year: 'Admin',
        location: 'Admin Dashboard',
        bio: 'FinishMyWork Platform Administrator'
      }
    })

    console.log('✅ Admin user created successfully:')
    console.log('Email:', adminUser.email)
    console.log('Role:', adminUser.role)
    console.log('ID:', adminUser.id)
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()