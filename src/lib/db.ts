import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// En Vercel (producción), reducir logs para mejorar rendimiento
const logLevel = process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query']

// =============================================
// CONFIGURACIÓN OPTIMIZADA PARA SERVERLESS + POSTGRESQL
// =============================================
// - connection_limit=1: Cada serverless function usa 1 sola conexión
// - pool_timeout=10: Espera hasta 10s por conexión disponible del pooler
// - En desarrollo local: sin restricciones de pool
// =============================================
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logLevel,
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// En desarrollo, reutilizar la instancia para evitar múltiples conexiones
// En producción (Vercel serverless), cada invocación crea una nueva instancia
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
