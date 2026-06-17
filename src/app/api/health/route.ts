// API Health Check - ImmiScale Meta Engine v5
// Verifica el estado de todos los servicios del sistema

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const startTime = Date.now()
  const checks: Record<string, { status: string; latency?: number; details?: string }> = {}

  // 1. Verificar Base de Datos
  try {
    const dbStart = Date.now()
    await db.$queryRaw`SELECT 1`
    checks.database = {
      status: 'healthy',
      latency: Date.now() - dbStart,
      details: 'SQLite conectada',
    }
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      details: error instanceof Error ? error.message : 'Error de conexión',
    }
  }

  // 2. Verificar Meta API
  try {
    const cred = await db.metaCredential.findFirst()
    if (cred?.isConnected) {
      checks.metaApi = {
        status: 'healthy',
        details: `Conectada - ${cred.accountId || 'Sin Account ID'}`,
      }
    } else {
      checks.metaApi = {
        status: 'degraded',
        details: cred ? 'Token expirado o inválido' : 'No configurada',
      }
    }
  } catch {
    checks.metaApi = { status: 'unhealthy', details: 'Error al verificar' }
  }

  // 3. Contar registros principales
  try {
    const [campaigns, leads, payments, events] = await Promise.all([
      db.campaign.count(),
      db.lead.count(),
      db.payment.count(),
      db.cAPIEvent.count(),
    ])
    checks.data = {
      status: 'healthy',
      details: `${campaigns} campañas, ${leads} leads, ${payments} pagos, ${events} eventos CAPI`,
    }
  } catch {
    checks.data = { status: 'unhealthy', details: 'Error al contar registros' }
  }

  // Determinar estado general
  const statuses = Object.values(checks).map(c => c.status)
  const overallStatus = statuses.includes('unhealthy')
    ? 'unhealthy'
    : statuses.includes('degraded')
      ? 'degraded'
      : 'healthy'

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503

  return NextResponse.json(
    {
      status: overallStatus,
      version: '5.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      latency: Date.now() - startTime,
      checks,
    },
    { status: statusCode }
  )
}
