// ImmiScale Meta Engine v5 - OAuth Flow Endpoints
// Facebook Login for Business — Direct OAuth (no Supabase dependency)
// Incluye config_id para apps Business y redirecciona al dashboard tras éxito

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { MetaAPIService, invalidateMetaAPICache } from '@/lib/meta-api'
import { v4 as uuidv4 } from 'uuid'

// =============================================
// CONFIGURACIÓN OAUTH — FACEBOOK LOGIN FOR BUSINESS
// =============================================

/** Scopes requeridos para Facebook Login for Business */
const OAUTH_SCOPE = 'ads_management,ads_read,business_management'

/** URL base de OAuth de Facebook (v21.0) */
const OAUTH_BASE_URL = 'https://www.facebook.com/v21.0/dialog/oauth'

/** Graph API base */
const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0'

/**
 * Obtener el URI de redirección dinámico basado en el host de la petición.
 * Para Facebook Login for Business, el redirect_uri DEBE estar registrado en
 * Facebook Developers > Tu App > Facebook Login > Settings > Valid OAuth Redirect URIs
 */
function obtenerRedirectUri(request: NextRequest): string {
  const host = request.headers.get('host') || 'localhost:3000'
  const protocolo = request.headers.get('x-forwarded-proto') || 'https'
  return `${protocolo}://${host}/api/meta/auth`
}

// =============================================
// GET - Iniciar flujo OAuth / Callback
// =============================================

/**
 * GET /api/meta/auth
 *
 * Sin parámetros: Inicia el flujo OAuth redirigiendo al usuario a Facebook Login for Business.
 * Con ?code=xxx: Callback de OAuth que intercambia el código por tokens y redirige al dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const codigo = searchParams.get('code')
  const estadoRecibido = searchParams.get('state')
  const errorParam = searchParams.get('error')

  // =============================================
  // ERROR DE FACEBOOK — El usuario denegó permisos o hubo error
  // =============================================
  if (errorParam) {
    const errorReason = searchParams.get('error_reason') || errorParam
    console.error('[MetaAuth] Facebook OAuth error:', errorReason)
    const host = request.headers.get('host') || 'localhost:3000'
    const protocolo = request.headers.get('x-forwarded-proto') || 'https'
    return NextResponse.redirect(
      `${protocolo}://${host}/dashboard?error=meta_auth_denied&reason=${encodeURIComponent(errorReason)}`
    )
  }

  // =============================================
  // CALLBACK OAUTH - Intercambio de código por token
  // =============================================
  if (codigo) {
    try {
      const appId = process.env.META_APP_ID
      const appSecret = process.env.META_APP_SECRET

      if (!appId || !appSecret) {
        console.error('[MetaAuth] META_APP_ID o META_APP_SECRET no configurados')
        const host = request.headers.get('host') || 'localhost:3000'
        const protocolo = request.headers.get('x-forwarded-proto') || 'https'
        return NextResponse.redirect(
          `${protocolo}://${host}/dashboard?error=meta_auth_config`
        )
      }

      const redirectUri = obtenerRedirectUri(request)

      // Paso 1: Intercambiar código de autorización por token de corta duración
      console.log('[MetaAuth] Intercambiando código de autorización por token...')
      const tokenUrl = `${GRAPH_API_BASE}/oauth/access_token?` +
        `client_id=${appId}&` +
        `client_secret=${appSecret}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `code=${encodeURIComponent(codigo)}`

      const respuestaToken = await fetch(tokenUrl, { method: 'GET' })
      const datosToken = await respuestaToken.json()

      if (datosToken.error) {
        console.error('[MetaAuth] Error al intercambiar código:', datosToken.error.message)
        const host = request.headers.get('host') || 'localhost:3000'
        const protocolo = request.headers.get('x-forwarded-proto') || 'https'
        return NextResponse.redirect(
          `${protocolo}://${host}/dashboard?error=meta_token_exchange&reason=${encodeURIComponent(datosToken.error.message)}`
        )
      }

      const tokenCortaDuracion = datosToken.access_token

      // Paso 2: Intercambiar por token de larga duración (60 días)
      console.log('[MetaAuth] Intercambiando por token de larga duración...')
      const longLivedUrl = `${GRAPH_API_BASE}/oauth/access_token?` +
        `grant_type=fb_exchange_token&` +
        `client_id=${appId}&` +
        `client_secret=${appSecret}&` +
        `fb_exchange_token=${tokenCortaDuracion}`

      const longLivedRes = await fetch(longLivedUrl)
      const longLivedData = await longLivedRes.json()

      const tokenLargaDuracion = longLivedData.access_token || tokenCortaDuracion
      const expiresIn = longLivedData.expires_in || 5184000 // 60 días por defecto

      // Paso 3: Auto-detectar Ad Account, Pixel, Business ID
      console.log('[MetaAuth] Auto-detectando Ad Account, Pixel, Business Manager...')

      let adAccountId = ''
      let pixelId: string | null = null
      let businessId: string | null = null
      let scopes: string[] = []

      // Obtener scopes via debug_token
      try {
        const debugUrl = `${GRAPH_API_BASE}/debug_token?input_token=${tokenLargaDuracion}&access_token=${appId}|${appSecret}`
        const debugRes = await fetch(debugUrl)
        const debugData = await debugRes.json()
        if (debugData.data) {
          scopes = debugData.data.scopes || []
        }
      } catch (e) {
        console.warn('[MetaAuth] No se pudieron obtener scopes:', e)
      }

      // Detectar Ad Accounts
      try {
        const accountsRes = await fetch(
          `${GRAPH_API_BASE}/me/adaccounts?fields=id,name,account_status&limit=5&access_token=${tokenLargaDuracion}`
        )
        const accountsData = await accountsRes.json()
        if (accountsData.data && accountsData.data.length > 0) {
          // Preferir cuentas activas
          const activeAccount = accountsData.data.find(
            (acc: { account_status?: number }) => acc.account_status === 1
          )
          adAccountId = (activeAccount || accountsData.data[0]).id
          console.log('[MetaAuth] Ad Account detectado:', adAccountId)
        }
      } catch (e) {
        console.warn('[MetaAuth] No se pudieron obtener ad accounts:', e)
      }

      // Detectar Pixel
      if (adAccountId) {
        try {
          const pixelsRes = await fetch(
            `${GRAPH_API_BASE}/${adAccountId}/adspixels?fields=id,name&limit=5&access_token=${tokenLargaDuracion}`
          )
          const pixelsData = await pixelsRes.json()
          if (pixelsData.data && pixelsData.data.length > 0) {
            pixelId = pixelsData.data[0].id
            console.log('[MetaAuth] Pixel detectado:', pixelId)
          }
        } catch (e) {
          console.warn('[MetaAuth] No se pudo detectar pixel:', e)
        }
      }

      // Detectar Business Manager
      try {
        const businessRes = await fetch(
          `${GRAPH_API_BASE}/me/businesses?fields=id,name&limit=5&access_token=${tokenLargaDuracion}`
        )
        const businessData = await businessRes.json()
        if (businessData.data && businessData.data.length > 0) {
          businessId = businessData.data[0].id
          console.log('[MetaAuth] Business Manager detectado:', businessId)
        }
      } catch (e) {
        console.warn('[MetaAuth] No se pudo detectar business manager:', e)
      }

      // Paso 4: Calcular fecha de expiración
      const fechaExpiracion = new Date()
      fechaExpiracion.setSeconds(fechaExpiracion.getSeconds() + expiresIn)

      // Paso 5: Guardar credenciales en la base de datos (Prisma)
      const credencialExistente = await db.metaCredential.findFirst().catch(() => null)

      try {
        if (credencialExistente) {
          await db.metaCredential.update({
            where: { id: credencialExistente.id },
            data: {
              appId,
              appSecret,
              accessToken: tokenLargaDuracion,
              tokenExpiresAt: fechaExpiracion,
              scope: JSON.stringify(scopes),
              isConnected: true,
              connectionStatus: 'CONNECTED',
              accountId: adAccountId,
              pixelId: pixelId,
              businessId: businessId,
              errorMessage: null,
              lastSyncAt: new Date(),
            },
          })
        } else {
          await db.metaCredential.create({
            data: {
              appId,
              appSecret,
              accessToken: tokenLargaDuracion,
              tokenExpiresAt: fechaExpiracion,
              scope: JSON.stringify(scopes),
              isConnected: true,
              connectionStatus: 'CONNECTED',
              accountId: adAccountId,
              pixelId: pixelId,
              businessId: businessId,
              graphApiVersion: 'v21.0',
              lastSyncAt: new Date(),
            },
          })
        }

        // Invalidar caché del singleton
        invalidateMetaAPICache()
        console.log('[MetaAuth] OAuth exitoso. Credenciales guardadas.')
      } catch (dbError) {
        console.error('[MetaAuth] Error al guardar en DB (non-fatal):', dbError)
        // No bloquear el redirect por error de DB
      }

      // Paso 6: Redirigir al dashboard con éxito
      const host = request.headers.get('host') || 'localhost:3000'
      const protocolo = request.headers.get('x-forwarded-proto') || 'https'
      return NextResponse.redirect(
        `${protocolo}://${host}/dashboard?meta_connected=true&account=${encodeURIComponent(adAccountId)}&pixel=${encodeURIComponent(pixelId || '')}`
      )

    } catch (error) {
      console.error('[MetaAuth] Error en callback de OAuth:', error)
      const host = request.headers.get('host') || 'localhost:3000'
      const protocolo = request.headers.get('x-forwarded-proto') || 'https'
      return NextResponse.redirect(
        `${protocolo}://${host}/dashboard?error=meta_auth_failed&reason=${encodeURIComponent(error instanceof Error ? error.message : 'Error desconocido')}`
      )
    }
  }

  // =============================================
  // INICIO DE FLUJO OAUTH - Redirigir a Facebook Login for Business
  // =============================================
  try {
    const appId = process.env.META_APP_ID

    if (!appId) {
      return NextResponse.json(
        { exito: false, error: 'META_APP_ID no está configurado en variables de entorno' },
        { status: 500 }
      )
    }

    // Generar estado aleatorio para protección CSRF
    const estado = uuidv4()

    // Construir URL de OAuth — FACEBOOK LOGIN FOR BUSINESS
    const redirectUri = obtenerRedirectUri(request)
    const configId = process.env.NEXT_PUBLIC_META_CONFIG_ID || ''

    // Build the OAuth URL with all required parameters
    let oauthUrl = `${OAUTH_BASE_URL}?` +
      `client_id=${appId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(OAUTH_SCOPE)}&` +
      `state=${estado}&` +
      `response_type=code&` +
      `auth_type=rerequest`

    // CRITICAL: config_id is required for Facebook Login for Business apps
    // Without it, Facebook returns "Content not found" error
    if (configId) {
      oauthUrl += `&config_id=${encodeURIComponent(configId)}`
      console.log('[MetaAuth] Facebook Login for Business — config_id incluido:', configId)
    } else {
      console.warn('[MetaAuth] ⚠️ NEXT_PUBLIC_META_CONFIG_ID no configurado. Facebook Login for Business requiere config_id.')
    }

    console.log('[MetaAuth] Redirigiendo a Facebook OAuth (Business Login)...')

    // REDIRECT directly to Facebook OAuth (not return JSON — user needs to navigate there)
    return NextResponse.redirect(oauthUrl)

  } catch (error) {
    console.error('[MetaAuth] Error al generar URL de OAuth:', error)
    return NextResponse.json(
      { exito: false, error: 'Error al generar URL de autorización' },
      { status: 500 }
    )
  }
}

// =============================================
// POST - Guardar credenciales manualmente
// =============================================

/**
 * POST /api/meta/auth
 * Permite guardar credenciales manualmente (para usuarios que prefieren pegar tokens).
 * Verifica el token antes de guardar.
 */
export async function POST(request: NextRequest) {
  try {
    const cuerpo = await request.json()

    const { appId, appSecret, accessToken, accountId, pixelId, businessId } = cuerpo

    if (!accessToken) {
      return NextResponse.json(
        { exito: false, error: 'El campo "accessToken" es obligatorio' },
        { status: 400 }
      )
    }

    if (!appId) {
      return NextResponse.json(
        { exito: false, error: 'El campo "appId" es obligatorio' },
        { status: 400 }
      )
    }

    // Crear servicio temporal para verificar el token
    const servicioTemporal = new MetaAPIService({
      accessToken,
      adAccountId: accountId || '',
      pixelId: pixelId || '',
      appId,
      appSecret: appSecret || '',
    })

    // Verificar la validez del token
    console.log('[MetaAuth] Verificando token de acceso manual...')
    const verificacion = await servicioTemporal.verifyToken()

    if (!verificacion.valid) {
      return NextResponse.json(
        { exito: false, error: `Token inválido: ${verificacion.error || 'No se pudo verificar el token'}` },
        { status: 401 }
      )
    }

    // Depurar el token para obtener información detallada
    let scopes: string[] = []
    let fechaExpiracion: Date | null = null

    try {
      const infoToken = await servicioTemporal.debugToken(accessToken)
      scopes = infoToken.data.scopes || []

      if (infoToken.data.expires_at) {
        fechaExpiracion = new Date(infoToken.data.expires_at * 1000)
      }
    } catch (error) {
      console.warn('[MetaAuth] No se pudo depurar el token:', error)
    }

    // Guardar o actualizar credenciales en la base de datos
    const credencialExistente = await db.metaCredential.findFirst().catch(() => null)

    let credencialGuardada

    if (credencialExistente) {
      credencialGuardada = await db.metaCredential.update({
        where: { id: credencialExistente.id },
        data: {
          appId,
          appSecret: appSecret || credencialExistente.appSecret,
          accessToken,
          tokenExpiresAt: fechaExpiracion,
          accountId: accountId || credencialExistente.accountId,
          pixelId: pixelId || credencialExistente.pixelId,
          businessId: businessId || credencialExistente.businessId,
          scope: JSON.stringify(scopes),
          isConnected: true,
          connectionStatus: 'CONNECTED',
          errorMessage: null,
        },
      })
    } else {
      credencialGuardada = await db.metaCredential.create({
        data: {
          appId,
          appSecret: appSecret || '',
          accessToken,
          tokenExpiresAt: fechaExpiracion,
          accountId: accountId || '',
          pixelId: pixelId || '',
          businessId: businessId || null,
          scope: JSON.stringify(scopes),
          isConnected: true,
          connectionStatus: 'CONNECTED',
          graphApiVersion: 'v21.0',
        },
      })
    }

    invalidateMetaAPICache()
    console.log('[MetaAuth] Credenciales manuales guardadas exitosamente')

    const credencialSegura = {
      id: credencialGuardada.id,
      appId: credencialGuardada.appId,
      accountId: credencialGuardada.accountId,
      pixelId: credencialGuardada.pixelId,
      businessId: credencialGuardada.businessId,
      isConnected: credencialGuardada.isConnected,
      connectionStatus: credencialGuardada.connectionStatus,
      tokenExpiresAt: credencialGuardada.tokenExpiresAt,
      scope: credencialGuardada.scope,
      graphApiVersion: credencialGuardada.graphApiVersion,
    }

    return NextResponse.json({
      exito: true,
      message: 'Credenciales guardadas exitosamente',
      datos: credencialSegura,
    }, { status: credencialExistente ? 200 : 201 })
  } catch (error) {
    console.error('[MetaAuth] Error al guardar credenciales manuales:', error)
    return NextResponse.json(
      { exito: false, error: `Error al guardar credenciales: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    )
  }
}

// =============================================
// DELETE - Desconectar Meta
// =============================================

export async function DELETE() {
  try {
    const credencial = await db.metaCredential.findFirst()

    if (!credencial) {
      return NextResponse.json(
        { exito: false, error: 'No hay credenciales de Meta para eliminar' },
        { status: 404 }
      )
    }

    await db.metaCredential.delete({
      where: { id: credencial.id },
    })

    invalidateMetaAPICache()
    console.log('[MetaAuth] Credenciales de Meta eliminadas.')

    return NextResponse.json({
      exito: true,
      message: 'Conexión con Meta desconectada exitosamente',
    })
  } catch (error) {
    console.error('[MetaAuth] Error al desconectar Meta:', error)
    return NextResponse.json(
      { exito: false, error: 'Error al desconectar la integración con Meta' },
      { status: 500 }
    )
  }
}
