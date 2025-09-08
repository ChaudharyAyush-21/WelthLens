import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Test the connection
prisma.$connect()
  .then(() => console.log('Prisma connected successfully'))
  .catch((error) => console.error('Prisma connection error:', error))