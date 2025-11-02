import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('AdminRB7210', 10)
  await prisma.user.upsert({
    where: { email: 'adminrb@finishmywork' },
    update: {},
    create: {
      name: 'Admin RB',
      email: 'adminrb@finishmywork',
      password,
      role: 'ADMIN',
      university: 'Admin',
      location: 'Pune',
      emailVerified: true,
    },
  })
  console.log('Admin user ensured.')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
}).finally(() => prisma.$disconnect())
