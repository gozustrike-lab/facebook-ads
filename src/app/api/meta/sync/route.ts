// ImmiScale Meta Engine v5 - Sincronización de Datos Meta
// Endpoints para sincronizar campañas e insights desde Meta a la base de datos local
// Todos los comentarios y textos en español

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMetaAPI } from '@/lib/meta-api'

// =============================================
// POST - Ejecutar sincronización
// =============================================

/**
 * POST /api/meta/sync
 *
 * Sincroniza datos desde Meta Graph API a la base de datos local.
 *
 * Body: {
 *   type: "campaigns" | "insights" | "all",
 *   dateRange?: { from: string, to: string }  // Requerido para insights
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const cuerpo = await request.json()
    const { type, dateRange } = cuerpo

    // Validar tipo de sincronización
    if (!type || !['campaigns', 'insights', 'all'].includes(type)) {
      return NextResponse.json(
        { exito: false, error: 'Tipo de sincronización inválido. Usar: "campaigns", "insights" o "all"' },
        { status: 400 }
      )
    }

    // Validar rango de fechas para insights
    if ((type === 'insights' || type === 'all') && (!dateRange?.from || !dateRange?.to)) {
      return NextResponse.json(
        { exito: false, error: 'Se requiere dateRange (from, to) para sincronizar insights' },
        { status: 400 }
      )
    }

    // Obtener instancia del servicio Meta API
    const servicioMeta = await getMetaAPI()

    if (!servicioMeta) {
      return NextResponse.json(
        { exito: false, error: 'No hay conexión con Meta configurada. Conecte su cuenta primero.' },
        { status: 403 }
      )
    }

    // Verificar que la conexión esté activa
    const verificacion = await servicioMeta.verifyToken()
    if (!verificacion.valid) {
      return NextResponse.json(
        { exito: false, error: `Token de acceso inválido: ${verificacion.error || 'Token expirado'}` },
        { status: 401 }
      )
    }

    const resultados: Record<string, unknown> = {}

    // =============================================
    // Sincronización de Campañas
    // =============================================
    if (type === 'campaigns' || type === 'all') {
      console.log('[MetaSync] Iniciando sincronización de campañas...')
      const resultadoCampanas = await servicioMeta.syncCampaignsToDb()
      resultados.campaigns = resultadoCampanas
    }

    // =============================================
    // Sincronización de Insights
    // =============================================
    if (type === 'insights' || type === 'all') {
      console.log('[MetaSync] Iniciando sincronización de insights...')
      const resultadoInsights = await servicioMeta.syncInsightsToDb(dateRange)
      resultados.insights = resultadoInsights
    }

    // Registrar la sincronización en la credencial
    const credencial = await db.metaCredential.findFirst()
    if (credencial) {
      await db.metaCredential.update({
        where: { id: credencial.id },
        data: {
          lastSyncAt: new Date(),
          errorMessage: null,
        },
      })
    }

    console.log('[MetaSync] Sincronización completada exitosamente')

    return NextResponse.json({
      exito: true,
      message: `Sincronización de tipo "${type}" completada exitosamente`,
      datos: resultados,
      sincronizadoEn: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[MetaSync] Error durante la sincronización:', error)

    // Registrar error en la credencial
    try {
      const credencial = await db.metaCredential.findFirst()
      if (credencial) {
        await db.metaCredential.update({
          where: { id: credencial.id },
          data: {
            connectionStatus: 'ERROR',
            errorMessage: error instanceof Error ? error.message : 'Error de sincronización desconocido',
          },
        })
      }
    } catch (errorBD) {
      console.error('[MetaSync] Error adicional al actualizar estado en BD:', errorBD)
    }

    return NextResponse.json(
      {
        exito: false,
        error: `Error de sincronización: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      },
      { status: 500 }
    )
  }
}

// =============================================
// GET - Obtener estado de última sincronización
// =============================================

/**
 * GET /api/meta/sync
 *
 * Retorna información sobre la última sincronización realizada.
 */
export async function GET() {
  try {
    const credencial = await db.metaCredential.findFirst()

    if (!credencial) {
      return NextResponse.json({
        connected: false,
        lastSyncAt: null,
        connectionStatus: 'DISCONNECTED',
        message: 'No hay credenciales de Meta configuradas',
      })
    }

    // Obtener conteos de datos locales para contexto
    const totalCampanas = await db.campaign.count()
    const campanasConMetaId = await db.campaign.count({
      where: { metaCampaignId: { not: null } },
    })
    const totalMetricas = await db.metric.count()
    const totalAdsets = await db.adSet.count()
    const adsetsConMetaId = await db.adSet.count({
      where: { metaAdSetId: { not: null } },
    })

    return NextResponse.json({
      connected: credencial.isConnected,
      lastSyncAt: credencial.lastSyncAt?.toISOString() || null,
      connectionStatus: credencial.connectionStatus,
      errorMessage: credencial.errorMessage,
      accountId: credencial.accountId,
      pixelId: credencial.pixelId,
      datosLocales: {
        campanas: {
          total: totalCampanas,
          sincronizadas: campanasConMetaId,
        },
        adsets: {
          total: totalAdsets,
          sincronizados: adsetsConMetaId,
        },
        metricas: totalMetricas,
      },
      graphApiVersion: credencial.graphApiVersion,
    })
  } catch (error) {
    console.error('[MetaSync] Error al obtener estado de sincronización:', error)
    return NextResponse.json(
      { exito: false, error: 'Error al obtener estado de sincronización' },
      { status: 500 }
    )
  }
}
