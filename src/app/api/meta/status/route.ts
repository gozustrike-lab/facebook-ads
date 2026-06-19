// ImmiScale Meta Engine v5 - Estado de Conexión Meta
// Endpoint para verificar el estado de la conexión con Meta Graph API
// Todos los comentarios y textos en español
// v2 - Regenerado con modelo MetaCredential

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMetaAPI } from '@/lib/meta-api'

/**
 * GET /api/meta/status
 *
 * Verifica el estado de la conexión con Meta.
 * Retorna información sobre: conexión, cuenta, pixel, expiración del token,
 * scopes otorgados y última sincronización.
 */
export async function GET() {
  try {
    // Buscar credenciales en la base de datos
    const credencial = await db.metaCredential.findFirst()

    // Si no hay credenciales, retornar estado desconectado
    if (!credencial) {
      return NextResponse.json({
        connected: false,
        accountId: null,
        businessId: null,
        pixelId: null,
        tokenExpiresAt: null,
        scopes: [],
        lastSyncAt: null,
        error: 'No hay credenciales de Meta configuradas',
      })
    }

    // Intentar obtener la instancia del servicio Meta API
    const servicioMeta = await getMetaAPI()

    if (!servicioMeta) {
      // Hay credenciales pero no se pudo crear la instancia
      return NextResponse.json({
        connected: false,
        accountId: credencial.accountId,
        businessId: credencial.businessId,
        pixelId: credencial.pixelId,
        tokenExpiresAt: credencial.tokenExpiresAt?.toISOString() || null,
        scopes: parsearScopes(credencial.scope),
        lastSyncAt: credencial.lastSyncAt?.toISOString() || null,
        connectionStatus: credencial.connectionStatus,
        error: credencial.errorMessage || 'No se pudo inicializar el servicio de Meta API',
      })
    }

    // Verificar la validez del token haciendo una llamada a /me
    const verificacion = await servicioMeta.verifyToken()

    if (!verificacion.valid) {
      // Token inválido o expirado
      await db.metaCredential.update({
        where: { id: credencial.id },
        data: {
          isConnected: false,
          connectionStatus: 'EXPIRED',
          errorMessage: verificacion.error || 'Token inválido',
        },
      })

      return NextResponse.json({
        connected: false,
        accountId: credencial.accountId,
        businessId: credencial.businessId,
        pixelId: credencial.pixelId,
        tokenExpiresAt: credencial.tokenExpiresAt?.toISOString() || null,
        scopes: parsearScopes(credencial.scope),
        lastSyncAt: credencial.lastSyncAt?.toISOString() || null,
        connectionStatus: 'EXPIRED',
        error: verificacion.error || 'Token de acceso inválido o expirado',
      })
    }

    // Probar la conexión para obtener información de la cuenta
    const pruebaConexion = await servicioMeta.testConnection()

    // Actualizar estado en la base de datos si estaba marcado como error
    if (credencial.connectionStatus !== 'CONNECTED' || !credencial.isConnected) {
      await db.metaCredential.update({
        where: { id: credencial.id },
        data: {
          isConnected: true,
          connectionStatus: 'CONNECTED',
          errorMessage: null,
        },
      })
    }

    // Construir respuesta con toda la información del estado
    return NextResponse.json({
      connected: true,
      accountId: credencial.accountId,
      businessId: credencial.businessId,
      pixelId: credencial.pixelId,
      tokenExpiresAt: credencial.tokenExpiresAt?.toISOString() || null,
      scopes: parsearScopes(credencial.scope),
      lastSyncAt: credencial.lastSyncAt?.toISOString() || null,
      connectionStatus: 'CONNECTED',
      accountInfo: pruebaConexion.connected ? {
        id: pruebaConexion.accountId,
        name: pruebaConexion.accountName,
        currency: pruebaConexion.currency,
        timezone: pruebaConexion.timezone,
      } : null,
      graphApiVersion: credencial.graphApiVersion,
    })
  } catch (error) {
    console.error('[MetaStatus] Error al verificar estado de conexión:', error)
    // Graceful fallback: retornar desconectado sin error 500
    // En serverless, la DB puede estar temporalmente no disponible
    return NextResponse.json({
      connected: false,
      accountId: null,
      businessId: null,
      pixelId: null,
      tokenExpiresAt: null,
      scopes: [],
      lastSyncAt: null,
      error: 'No se pudo conectar a la base de datos. Si el problema persiste, verifica DATABASE_URL en Vercel.',
    })
  }
}

// =============================================
// UTILIDADES
// =============================================

/**
 * Parsear el campo de scopes desde JSON o string separado por comas.
 */
function parsearScopes(scope: string | null): string[] {
  if (!scope) return []

  try {
    const parseado = JSON.parse(scope)
    if (Array.isArray(parseado)) return parseado
    return []
  } catch {
    // Si no es JSON válido, intentar como string separado por comas
    return scope.split(',').map((s) => s.trim()).filter(Boolean)
  }
}
