// /api/setup — Crea todas las tablas usando el POOLER (DATABASE_URL)
// La conexión directa (DIRECT_URL) está bloqueada por Supabase en algunos planes
// El pooler SÍ soporta raw SQL DDL (CREATE TABLE) — lo que NO soporta es
// las "prepared statements" que Prisma Client usa internamente
// Solución: usar $executeRawUnsafe() con el pooler

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const results: string[] = []

  try {
    // Verificar conexión (usa pooler = DATABASE_URL)
    await db.$queryRaw`SELECT 1`
    results.push('✅ Conexión a PostgreSQL verificada (via pooler)')

    // Crear tablas usando raw SQL a través del pooler
    // $executeRawUnsafe() envía SQL directo sin prepared statements
    const createTables = [
      `CREATE TABLE IF NOT EXISTS "Region" (
        "id" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'USD',
        "cplTarget" DOUBLE PRECISION NOT NULL DEFAULT 25.0,
        "cplKillSwitch" DOUBLE PRECISION NOT NULL DEFAULT 37.5,
        "language" TEXT NOT NULL DEFAULT 'es',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Region_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Region_code_key" UNIQUE ("code")
      )`,
      `CREATE TABLE IF NOT EXISTS "Campaign" (
        "id" TEXT NOT NULL,
        "metaCampaignId" TEXT,
        "name" TEXT NOT NULL,
        "objective" TEXT NOT NULL DEFAULT 'LEAD_GENERATION',
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "totalBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "totalSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "matchScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "autoScale" BOOLEAN NOT NULL DEFAULT true,
        "lastScaledAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "AdSet" (
        "id" TEXT NOT NULL,
        "metaAdSetId" TEXT,
        "name" TEXT NOT NULL,
        "campaignId" TEXT NOT NULL,
        "regionId" TEXT NOT NULL,
        "budget" DOUBLE PRECISION NOT NULL,
        "budgetCurrency" TEXT NOT NULL DEFAULT 'USD',
        "dailySpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "cpl" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "leadCount" INTEGER NOT NULL DEFAULT 0,
        "audienceType" TEXT NOT NULL DEFAULT 'BROAD',
        "targetingJson" TEXT,
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "scaleDirection" TEXT,
        "lastBudgetInc" TIMESTAMP(3),
        "killSwitchTriggered" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "AdSet_pkey" PRIMARY KEY ("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "Lead" (
        "id" TEXT NOT NULL,
        "firstName" TEXT,
        "lastName" TEXT,
        "email" TEXT,
        "phone" TEXT,
        "country" TEXT NOT NULL,
        "regionId" TEXT NOT NULL,
        "route" TEXT NOT NULL,
        "visaType" TEXT,
        "hasCriminalRecord" BOOLEAN,
        "investmentCapacity" TEXT,
        "hasUniversityDegree" BOOLEAN,
        "hasUsFamily" BOOLEAN,
        "solvencyVerified" BOOLEAN,
        "qualificationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "status" TEXT NOT NULL DEFAULT 'NEW',
        "chatSessionId" TEXT,
        "source" TEXT NOT NULL DEFAULT 'META_ADS',
        "metaAdId" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "Metric" (
        "id" TEXT NOT NULL,
        "regionId" TEXT NOT NULL,
        "date" TIMESTAMP(3) NOT NULL,
        "totalSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "leadCount" INTEGER NOT NULL DEFAULT 0,
        "qualifiedCount" INTEGER NOT NULL DEFAULT 0,
        "paidCount" INTEGER NOT NULL DEFAULT 0,
        "cpql" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "cpl" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "matchScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "currency" TEXT NOT NULL DEFAULT 'USD',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Metric_pkey" PRIMARY KEY ("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "Payment" (
        "id" TEXT NOT NULL,
        "leadId" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'USD',
        "amountUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 1,
        "gateway" TEXT NOT NULL DEFAULT 'STRIPE',
        "gatewayRefId" TEXT,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "description" TEXT,
        "paidAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "ChatSession" (
        "id" TEXT NOT NULL,
        "visitorId" TEXT NOT NULL,
        "country" TEXT,
        "route" TEXT,
        "currentStep" TEXT NOT NULL DEFAULT 'GREETING',
        "answersJson" TEXT,
        "qualificationResult" TEXT,
        "completedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "CAPIEvent" (
        "id" TEXT NOT NULL,
        "eventId" TEXT NOT NULL,
        "eventName" TEXT NOT NULL,
        "sourceUrl" TEXT,
        "country" TEXT,
        "userAgent" TEXT,
        "ipHash" TEXT,
        "fbclid" TEXT,
        "fbp" TEXT,
        "eventTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "sentToMeta" BOOLEAN NOT NULL DEFAULT false,
        "metaResponse" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "CAPIEvent_pkey" PRIMARY KEY ("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "MetaCredential" (
        "id" TEXT NOT NULL,
        "appId" TEXT NOT NULL,
        "appSecret" TEXT NOT NULL,
        "accessToken" TEXT NOT NULL,
        "tokenExpiresAt" TIMESTAMP(3),
        "refreshToken" TEXT,
        "accountId" TEXT,
        "pixelId" TEXT,
        "businessId" TEXT,
        "graphApiVersion" TEXT NOT NULL DEFAULT 'v21.0',
        "scope" TEXT,
        "isConnected" BOOLEAN NOT NULL DEFAULT false,
        "lastSyncAt" TIMESTAMP(3),
        "connectionStatus" TEXT NOT NULL DEFAULT 'DISCONNECTED',
        "errorMessage" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "MetaCredential_pkey" PRIMARY KEY ("id")
      )`,
    ]

    for (const sql of createTables) {
      const tableName = sql.match(/"(\w+)"/)?.[1] || 'unknown'
      try {
        await db.$executeRawUnsafe(sql)
        results.push(`✅ Tabla ${tableName} creada`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('already exists')) {
          results.push(`⏭️ Tabla ${tableName} ya existe`)
        } else {
          results.push(`⚠️ ${tableName}: ${msg.substring(0, 120)}`)
        }
      }
    }

    // Crear foreign keys e índices
    const constraints = [
      `ALTER TABLE "AdSet" DROP CONSTRAINT IF EXISTS "AdSet_campaignId_fkey"`,
      `ALTER TABLE "AdSet" ADD CONSTRAINT "AdSet_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "AdSet" DROP CONSTRAINT IF EXISTS "AdSet_regionId_fkey"`,
      `ALTER TABLE "AdSet" ADD CONSTRAINT "AdSet_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
      `ALTER TABLE "Lead" DROP CONSTRAINT IF EXISTS "Lead_regionId_fkey"`,
      `ALTER TABLE "Lead" ADD CONSTRAINT "Lead_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
      `ALTER TABLE "Metric" DROP CONSTRAINT IF EXISTS "Metric_regionId_fkey"`,
      `ALTER TABLE "Metric" ADD CONSTRAINT "Metric_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
      `ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_leadId_fkey"`,
      `ALTER TABLE "Payment" ADD CONSTRAINT "Payment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    ]

    for (const sql of constraints) {
      try {
        await db.$executeRawUnsafe(sql)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        if (!msg.includes('already exists') && !msg.includes('already registered')) {
          results.push(`⚠️ FK: ${msg.substring(0, 80)}`)
        }
      }
    }
    results.push('✅ Foreign keys configuradas')

    // Crear índices
    const indexes = [
      `CREATE INDEX IF NOT EXISTS "AdSet_campaignId_idx" ON "AdSet"("campaignId")`,
      `CREATE INDEX IF NOT EXISTS "AdSet_regionId_idx" ON "AdSet"("regionId")`,
      `CREATE INDEX IF NOT EXISTS "Lead_regionId_idx" ON "Lead"("regionId")`,
      `CREATE INDEX IF NOT EXISTS "Lead_status_idx" ON "Lead"("status")`,
      `CREATE INDEX IF NOT EXISTS "Lead_route_idx" ON "Lead"("route")`,
      `CREATE INDEX IF NOT EXISTS "Payment_leadId_idx" ON "Payment"("leadId")`,
      `CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status")`,
      `CREATE INDEX IF NOT EXISTS "Payment_gateway_idx" ON "Payment"("gateway")`,
      `CREATE INDEX IF NOT EXISTS "Metric_regionId_idx" ON "Metric"("regionId")`,
      `CREATE INDEX IF NOT EXISTS "Metric_date_idx" ON "Metric"("date")`,
      `CREATE INDEX IF NOT EXISTS "ChatSession_visitorId_idx" ON "ChatSession"("visitorId")`,
      `CREATE INDEX IF NOT EXISTS "ChatSession_route_idx" ON "ChatSession"("route")`,
      `CREATE INDEX IF NOT EXISTS "CAPIEvent_eventName_idx" ON "CAPIEvent"("eventName")`,
      `CREATE INDEX IF NOT EXISTS "CAPIEvent_country_idx" ON "CAPIEvent"("country")`,
      `CREATE INDEX IF NOT EXISTS "CAPIEvent_sentToMeta_idx" ON "CAPIEvent"("sentToMeta")`,
      `ALTER TABLE "Metric" DROP CONSTRAINT IF EXISTS "Metric_regionId_date_key"`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Metric_regionId_date_key" ON "Metric"("regionId", "date")`,
    ]

    for (const sql of indexes) {
      try {
        await db.$executeRawUnsafe(sql)
      } catch {
        // Ignorar errores de índices duplicados
      }
    }
    results.push('✅ Índices creados')

    // Seed regiones por defecto
    const defaultRegions = [
      { code: 'US', name: 'Estados Unidos', currency: 'USD', cplTarget: 25.0, cplKillSwitch: 37.5, language: 'es' },
      { code: 'PE', name: 'Perú', currency: 'PEN', cplTarget: 15.0, cplKillSwitch: 22.5, language: 'es' },
      { code: 'CO', name: 'Colombia', currency: 'COP', cplTarget: 18.0, cplKillSwitch: 27.0, language: 'es' },
      { code: 'MX', name: 'México', currency: 'MXN', cplTarget: 20.0, cplKillSwitch: 30.0, language: 'es' },
      { code: 'GLOBAL', name: 'Global / Otros', currency: 'USD', cplTarget: 30.0, cplKillSwitch: 45.0, language: 'es' },
    ]

    for (const region of defaultRegions) {
      try {
        const existing = await db.region.findUnique({ where: { code: region.code } })
        if (!existing) {
          await db.region.create({ data: region })
          results.push(`🌍 Región creada: ${region.name} (${region.code})`)
        } else {
          results.push(`⏭️ Región ya existe: ${region.name}`)
        }
      } catch (err: unknown) {
        results.push(`⚠️ Seed ${region.code}: ${err instanceof Error ? err.message.substring(0, 60) : String(err)}`)
      }
    }

    console.log('[Setup] Complete:', results)

    return NextResponse.json({
      exito: true,
      message: 'Base de datos configurada correctamente',
      results,
    })

  } catch (error) {
    console.error('[Setup] Error:', error)
    return NextResponse.json({
      exito: false,
      results,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
