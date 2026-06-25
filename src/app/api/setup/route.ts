// /api/setup — Creates all tables + seeds default org via pooler
// Uses raw SQL DDL through $executeRawUnsafe (works with pgbouncer)

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const results: string[] = []

  try {
    await db.$queryRaw`SELECT 1`
    results.push('✅ PostgreSQL connection verified (via pooler)')

    const createTables = [
      `CREATE TABLE IF NOT EXISTS "Organization" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "industry" TEXT NOT NULL,
        "brandName" TEXT NOT NULL,
        "logoUrl" TEXT,
        "primaryColor" TEXT,
        "domain" TEXT,
        "nicheConfig" JSONB,
        "slug" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Organization_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Organization_slug_key" UNIQUE ("slug")
      )`,
      `CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL,
        "organizationId" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "name" TEXT,
        "avatarUrl" TEXT,
        "role" TEXT NOT NULL DEFAULT 'member',
        "authProvider" TEXT NOT NULL DEFAULT 'supabase',
        "authProviderId" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "lastLoginAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "User_email_key" UNIQUE ("email")
      )`,
      `CREATE TABLE IF NOT EXISTS "WhiteLabelConfig" (
        "id" TEXT NOT NULL,
        "organizationId" TEXT NOT NULL,
        "appName" TEXT NOT NULL,
        "logoUrl" TEXT,
        "faviconUrl" TEXT,
        "domain" TEXT,
        "primaryColor" TEXT,
        "accentColor" TEXT,
        "supportEmail" TEXT,
        "smtpConfig" JSONB,
        "landingConfig" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "WhiteLabelConfig_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "WhiteLabelConfig_organizationId_key" UNIQUE ("organizationId")
      )`,
      `CREATE TABLE IF NOT EXISTS "PipelineStage" (
        "id" TEXT NOT NULL,
        "organizationId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "order" INTEGER NOT NULL,
        "color" TEXT,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "PipelineStage_pkey" PRIMARY KEY ("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "Template" (
        "id" TEXT NOT NULL,
        "organizationId" TEXT,
        "industry" TEXT NOT NULL,
        "objective" TEXT NOT NULL,
        "funnelType" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "config" JSONB,
        "isPublic" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "Region" (
        "id" TEXT NOT NULL,
        "organizationId" TEXT NOT NULL,
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
        CONSTRAINT "Region_organizationId_code_key" UNIQUE ("organizationId", "code")
      )`,
      `CREATE TABLE IF NOT EXISTS "Campaign" (
        "id" TEXT NOT NULL,
        "organizationId" TEXT NOT NULL,
        "metaCampaignId" TEXT,
        "name" TEXT NOT NULL,
        "objective" TEXT NOT NULL DEFAULT 'LEAD_GENERATION',
        "industry" TEXT,
        "templateId" TEXT,
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
        "organizationId" TEXT NOT NULL,
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
        "organizationId" TEXT NOT NULL,
        "name" TEXT,
        "firstName" TEXT,
        "lastName" TEXT,
        "email" TEXT,
        "phone" TEXT,
        "country" TEXT,
        "regionId" TEXT,
        "stage" TEXT NOT NULL DEFAULT 'NEW',
        "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "customFields" JSONB,
        "source" TEXT NOT NULL DEFAULT 'META_ADS',
        "metaAdId" TEXT,
        "chatSessionId" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "Payment" (
        "id" TEXT NOT NULL,
        "organizationId" TEXT NOT NULL,
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
      `CREATE TABLE IF NOT EXISTS "Metric" (
        "id" TEXT NOT NULL,
        "organizationId" TEXT NOT NULL,
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
        CONSTRAINT "Metric_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Metric_regionId_date_key" UNIQUE ("regionId", "date")
      )`,
      `CREATE TABLE IF NOT EXISTS "ChatSession" (
        "id" TEXT NOT NULL,
        "organizationId" TEXT NOT NULL,
        "visitorId" TEXT NOT NULL,
        "country" TEXT,
        "currentStep" TEXT NOT NULL DEFAULT 'GREETING',
        "answersJson" TEXT,
        "qualificationResult" TEXT,
        "leadId" TEXT,
        "completedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "CAPIEvent" (
        "id" TEXT NOT NULL,
        "organizationId" TEXT NOT NULL,
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
        "organizationId" TEXT NOT NULL,
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
        results.push(`✅ Table ${tableName} created`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('already exists')) {
          results.push(`⏭️ Table ${tableName} already exists`)
        } else {
          results.push(`⚠️ ${tableName}: ${msg.substring(0, 120)}`)
        }
      }
    }

    // Foreign keys
    const constraints = [
      `ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_organizationId_fkey"`,
      `ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "WhiteLabelConfig" DROP CONSTRAINT IF EXISTS "WhiteLabelConfig_organizationId_fkey"`,
      `ALTER TABLE "WhiteLabelConfig" ADD CONSTRAINT "WhiteLabelConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "PipelineStage" DROP CONSTRAINT IF EXISTS "PipelineStage_organizationId_fkey"`,
      `ALTER TABLE "PipelineStage" ADD CONSTRAINT "PipelineStage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "Template" DROP CONSTRAINT IF EXISTS "Template_organizationId_fkey"`,
      `ALTER TABLE "Template" ADD CONSTRAINT "Template_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "Region" DROP CONSTRAINT IF EXISTS "Region_organizationId_fkey"`,
      `ALTER TABLE "Region" ADD CONSTRAINT "Region_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "Campaign" DROP CONSTRAINT IF EXISTS "Campaign_organizationId_fkey"`,
      `ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "AdSet" DROP CONSTRAINT IF EXISTS "AdSet_organizationId_fkey"`,
      `ALTER TABLE "AdSet" ADD CONSTRAINT "AdSet_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "AdSet" DROP CONSTRAINT IF EXISTS "AdSet_campaignId_fkey"`,
      `ALTER TABLE "AdSet" ADD CONSTRAINT "AdSet_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "AdSet" DROP CONSTRAINT IF EXISTS "AdSet_regionId_fkey"`,
      `ALTER TABLE "AdSet" ADD CONSTRAINT "AdSet_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
      `ALTER TABLE "Lead" DROP CONSTRAINT IF EXISTS "Lead_organizationId_fkey"`,
      `ALTER TABLE "Lead" ADD CONSTRAINT "Lead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "Lead" DROP CONSTRAINT IF EXISTS "Lead_regionId_fkey"`,
      `ALTER TABLE "Lead" ADD CONSTRAINT "Lead_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
      `ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_organizationId_fkey"`,
      `ALTER TABLE "Payment" ADD CONSTRAINT "Payment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_leadId_fkey"`,
      `ALTER TABLE "Payment" ADD CONSTRAINT "Payment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "Metric" DROP CONSTRAINT IF EXISTS "Metric_organizationId_fkey"`,
      `ALTER TABLE "Metric" ADD CONSTRAINT "Metric_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "Metric" DROP CONSTRAINT IF EXISTS "Metric_regionId_fkey"`,
      `ALTER TABLE "Metric" ADD CONSTRAINT "Metric_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
      `ALTER TABLE "ChatSession" DROP CONSTRAINT IF EXISTS "ChatSession_organizationId_fkey"`,
      `ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "CAPIEvent" DROP CONSTRAINT IF EXISTS "CAPIEvent_organizationId_fkey"`,
      `ALTER TABLE "CAPIEvent" ADD CONSTRAINT "CAPIEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "MetaCredential" DROP CONSTRAINT IF EXISTS "MetaCredential_organizationId_fkey"`,
      `ALTER TABLE "MetaCredential" ADD CONSTRAINT "MetaCredential_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    ]

    for (const sql of constraints) {
      try {
        await db.$executeRawUnsafe(sql)
      } catch {
        // Ignore duplicate constraints
      }
    }
    results.push('✅ Foreign keys configured')

    // Create indexes
    const indexes = [
      `CREATE INDEX IF NOT EXISTS "Organization_industry_idx" ON "Organization"("industry")`,
      `CREATE INDEX IF NOT EXISTS "Organization_slug_idx" ON "Organization"("slug")`,
      `CREATE INDEX IF NOT EXISTS "User_organizationId_idx" ON "User"("organizationId")`,
      `CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email")`,
      `CREATE INDEX IF NOT EXISTS "PipelineStage_organizationId_idx" ON "PipelineStage"("organizationId")`,
      `CREATE INDEX IF NOT EXISTS "Template_industry_idx" ON "Template"("industry")`,
      `CREATE INDEX IF NOT EXISTS "Template_objective_idx" ON "Template"("objective")`,
      `CREATE INDEX IF NOT EXISTS "Region_organizationId_idx" ON "Region"("organizationId")`,
      `CREATE INDEX IF NOT EXISTS "Campaign_organizationId_idx" ON "Campaign"("organizationId")`,
      `CREATE INDEX IF NOT EXISTS "Campaign_status_idx" ON "Campaign"("status")`,
      `CREATE INDEX IF NOT EXISTS "AdSet_organizationId_idx" ON "AdSet"("organizationId")`,
      `CREATE INDEX IF NOT EXISTS "AdSet_campaignId_idx" ON "AdSet"("campaignId")`,
      `CREATE INDEX IF NOT EXISTS "AdSet_regionId_idx" ON "AdSet"("regionId")`,
      `CREATE INDEX IF NOT EXISTS "Lead_organizationId_idx" ON "Lead"("organizationId")`,
      `CREATE INDEX IF NOT EXISTS "Lead_regionId_idx" ON "Lead"("regionId")`,
      `CREATE INDEX IF NOT EXISTS "Lead_stage_idx" ON "Lead"("stage")`,
      `CREATE INDEX IF NOT EXISTS "Lead_source_idx" ON "Lead"("source")`,
      `CREATE INDEX IF NOT EXISTS "Payment_organizationId_idx" ON "Payment"("organizationId")`,
      `CREATE INDEX IF NOT EXISTS "Payment_leadId_idx" ON "Payment"("leadId")`,
      `CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status")`,
      `CREATE INDEX IF NOT EXISTS "Metric_organizationId_idx" ON "Metric"("organizationId")`,
      `CREATE INDEX IF NOT EXISTS "Metric_regionId_idx" ON "Metric"("regionId")`,
      `CREATE INDEX IF NOT EXISTS "Metric_date_idx" ON "Metric"("date")`,
      `CREATE INDEX IF NOT EXISTS "ChatSession_organizationId_idx" ON "ChatSession"("organizationId")`,
      `CREATE INDEX IF NOT EXISTS "ChatSession_visitorId_idx" ON "ChatSession"("visitorId")`,
      `CREATE INDEX IF NOT EXISTS "CAPIEvent_organizationId_idx" ON "CAPIEvent"("organizationId")`,
      `CREATE INDEX IF NOT EXISTS "CAPIEvent_eventName_idx" ON "CAPIEvent"("eventName")`,
      `CREATE INDEX IF NOT EXISTS "CAPIEvent_sentToMeta_idx" ON "CAPIEvent"("sentToMeta")`,
      `CREATE INDEX IF NOT EXISTS "MetaCredential_organizationId_idx" ON "MetaCredential"("organizationId")`,
    ]

    for (const sql of indexes) {
      try {
        await db.$executeRawUnsafe(sql)
      } catch {
        // Ignore duplicate indexes
      }
    }
    results.push('✅ Indexes created')

    // Seed default organization
    const existingOrg = await db.organization.findFirst()
    if (!existingOrg) {
      const org = await db.organization.create({
        data: {
          name: 'My Business',
          industry: 'local_services',
          brandName: 'AdScale OS',
          slug: 'default',
          primaryColor: '#6366f1',
        },
      })

      // Seed default regions for the org
      const defaultRegions = [
        { code: 'US', name: 'Estados Unidos', currency: 'USD', cplTarget: 25.0, cplKillSwitch: 37.5, language: 'es' },
        { code: 'PE', name: 'Perú', currency: 'PEN', cplTarget: 15.0, cplKillSwitch: 22.5, language: 'es' },
        { code: 'CO', name: 'Colombia', currency: 'COP', cplTarget: 18.0, cplKillSwitch: 27.0, language: 'es' },
        { code: 'MX', name: 'México', currency: 'MXN', cplTarget: 20.0, cplKillSwitch: 30.0, language: 'es' },
        { code: 'GLOBAL', name: 'Global / Otros', currency: 'USD', cplTarget: 30.0, cplKillSwitch: 45.0, language: 'es' },
      ]

      for (const region of defaultRegions) {
        await db.region.create({
          data: { ...region, organizationId: org.id },
        })
      }

      results.push(`🌍 Default org created: ${org.name} (${org.id})`)
      results.push('🌍 5 default regions seeded')
    } else {
      results.push('⏭️ Organization already exists')
    }

    return NextResponse.json({
      exito: true,
      message: 'Database configured successfully',
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
