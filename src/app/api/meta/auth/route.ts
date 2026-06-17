// ImmiScale Meta Engine v5 - OAuth Flow Endpoints
// Endpoints para conectar/desconectar Meta a través de OAuth y credenciales manuales
// Todos los comentarios y textos en español

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { MetaAPIService, invalidateMetaAPICache } from '@/lib/meta-api'
import { v4 as uuidv4 } from 'uuid'

// =============================================
// CONFIGURACIÓN OAUTH
// =============================================

/** Scope requerido para la integración de Meta Ads */
const OAUTH_SCOPE = [
  'ads_management',
  'ads_read',
  'business_management',
  'pages_read_engagement',
  'pages_manage_ads',
].join(',')

/** URL base de OAuth de Facebook */
const OAUTH_BASE_URL = 'https://www.facebook.com/v21.0/dialog/oauth'

/**
 * Obtener el URI de redirección dinámico basado en el host de la petición.
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
 * Sin parámetros: Inicia el flujo OAuth redirigiendo al usuario a Facebook.
 * Con ?code=xxx: Callback de OAuth que intercambia el código por tokens.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const codigo = searchParams.get('code')
  const estadoRecibido = searchParams.get('state')

  // =============================================
  // CALLBACK OAUTH - Intercambio de código por token
  // =============================================
  if (codigo) {
    try {
      // Verificar parámetro state para protección CSRF
      const estadoEsperado = process.env.META_OAUTH_STATE
      if (estadoEsperado && estadoRecibido !== estadoEsperado) {
        console.error('[MetaAuth] Estado CSRF no coincide. Posible ataque.')
        return NextResponse.json(
          { exito: false, error: 'Verificación de estado CSRF fallida' },
          { status: 403 }
        )
      }

      const appId = process.env.META_APP_ID
      const appSecret = process.env.META_APP_SECRET

      if (!appId || !appSecret) {
        return NextResponse.json(
          { exito: false, error: 'META_APP_ID y META_APP_SECRET deben estar configurados en variables de entorno' },
          { status: 500 }
        )
      }

      const redirectUri = obtenerRedirectUri(request)

      // Paso 1: Intercambiar código de autorización por token de corta duración
      console.log('[MetaAuth] Intercambiando código de autorización por token de corta duración...')
      const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?` +
        `client_id=${appId}&` +
        `client_secret=${appSecret}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `code=${encodeURIComponent(codigo)}`

      const respuestaToken = await fetch(tokenUrl, { method: 'GET' })
      const datosToken = await respuestaToken.json()

      if (datosToken.error) {
        console.error('[MetaAuth] Error al intercambiar código:', datosToken.error.message)
        return NextResponse.json(
          { exito: false, error: `Error de OAuth: ${datosToken.error.message}` },
          { status: 400 }
        )
      }

      const tokenCortaDuracion = datosToken.access_token

      // Paso 2: Intercambiar token de corta duración por token de larga duración (60 días)
      console.log('[MetaAuth] Intercambiando por token de larga duración...')
      const servicioMeta = new MetaAPIService({
        accessToken: tokenCortaDuracion,
        adAccountId: '',
        pixelId: '',
        appId,
        appSecret,
      })

      const resultadoIntercambio = await servicioMeta.exchangeToken(tokenCortaDuracion)
      const tokenLargaDuracion = resultadoIntercambio.access_token

      // Paso 3: Depurar el token para obtener información del usuario y scopes
      console.log('[MetaAuth] Obteniendo información del token...')
      const infoToken = await servicioMeta.debugToken(tokenLargaDuracion)
      const scopes = infoToken.data.scopes || []
      const userId = infoToken.data.user_id

      // Paso 4: Obtener cuentas de anuncios del usuario
      let adAccountId = process.env.META_AD_ACCOUNT_ID || ''
      try {
        const cuentasResp = await fetch(
          `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name&access_token=${tokenLargaDuracion}`,
          { method: 'GET' }
        )
        const cuentasDatos = await cuentasResp.json()
        if (cuentasDatos.data && cuentasDatos.data.length > 0 && !adAccountId) {
          // Usar la primera cuenta de anuncios disponible
          adAccountId = cuentasDatos.data[0].id
        }
      } catch (error) {
        console.warn('[MetaAuth] No se pudieron obtener las cuentas de anuncios:', error)
      }

      // Paso 5: Calcular fecha de expiración del token
      const fechaExpiracion = new Date()
      fechaExpiracion.setSeconds(fechaExpiracion.getSeconds() + (resultadoIntercambio.expires_in || 5184000)) // 60 días por defecto

      // Paso 6: Guardar o actualizar credenciales en la base de datos
      const credencialExistente = await db.metaCredential.findFirst()

      if (credencialExistente) {
        // Actualizar credenciales existentes
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
            errorMessage: null,
          },
        })
      } else {
        // Crear nuevas credenciales
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
            graphApiVersion: 'v21.0',
          },
        })
      }

      // Invalidar caché del singleton para que recargue las credenciales
      invalidateMetaAPICache()

      console.log('[MetaAuth] OAuth exitoso. Credenciales guardadas en la base de datos.')

      return NextResponse.json({
        exito: true,
        message: 'Conexión con Meta establecida exitosamente',
        datos: {
          userId,
          scopes,
          adAccountId,
          tokenExpiresAt: fechaExpiracion.toISOString(),
        },
      })
    } catch (error) {
      console.error('[MetaAuth] Error en callback de OAuth:', error)
      return NextResponse.json(
        { exito: false, error: `Error en OAuth: ${error instanceof Error ? error.message : 'Error desconocido'}` },
        { status: 500 }
      )
    }
  }

  // =============================================
  // INICIO DE FLUJO OAUTH - Generar URL de autorización
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

    // Construir URL de OAuth
    const redirectUri = obtenerRedirectUri(request)
    const oauthUrl = `${OAUTH_BASE_URL}?` +
      `client_id=${appId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(OAUTH_SCOPE)}&` +
      `state=${estado}&` +
      `response_type=code`

    console.log('[MetaAuth] URL de OAuth generada exitosamente')

    return NextResponse.json({
      exito: true,
      oauthUrl,
      state: estado,
      scope: OAUTH_SCOPE,
      redirectUri,
    })
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
 *
 * Body: { appId, appSecret, accessToken, accountId, pixelId, businessId }
 */
export async function POST(request: NextRequest) {
  try {
    const cuerpo = await request.json()

    // Validar campos requeridos
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
    const credencialExistente = await db.metaCredential.findFirst()

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

    // Invalidar caché del singleton
    invalidateMetaAPICache()

    console.log('[MetaAuth] Credenciales manuales guardadas exitosamente')

    // No retornar el appSecret ni accessToken por seguridad
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
      createdAt: credencialGuardada.createdAt,
      updatedAt: credencialGuardada.updatedAt,
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

/**
 * DELETE /api/meta/auth
 * Elimina las credenciales de Meta de la base de datos, desconectando la integración.
 */
export async function DELETE() {
  try {
    // Buscar y eliminar la credencial existente
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

    // Invalidar caché del singleton
    invalidateMetaAPICache()

    console.log('[MetaAuth] Credenciales de Meta eliminadas. Integración desconectada.')

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
