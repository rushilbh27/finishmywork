import { prisma } from '../lib/prisma'

async function seedSaaSAdmin() {
  const adminEmail = 'rushilbh27@gmail.com'

  try {
    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        isSaaSAdmin: true,
        role: 'ADMIN',
      },
      create: {
        email: adminEmail,
        name: 'Rushil Bhor',
        isSaaSAdmin: true,
        role: 'ADMIN',
        location: 'Unknown',
      },
    })

    console.log('✅ SaaS admin seeded:', user.email, '| isSaaSAdmin:', user.isSaaSAdmin, '| role:', user.role)
  } catch (error) {
    console.error('❌ Error seeding SaaS admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedSaaSAdmin()
