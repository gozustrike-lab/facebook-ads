import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// En Vercel (producción), reducir logs para mejorar rendimiento
const logLevel = process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query']

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logLevel,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
