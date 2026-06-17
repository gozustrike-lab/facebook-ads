// ImmiScale Meta Engine v5 - Webhook de Meta (Real-Time Updates)
// Maneja la verificación de webhooks y eventos en tiempo real de Meta
// Todos los comentarios y textos en español

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createHmac } from 'crypto'

// =============================================
// CONFIGURACIÓN DE WEBHOOK
// =============================================

/** Token de verificación configurado en Meta Developer Portal */
const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'immiscale_webhook_verify_2024'

/** App Secret para verificar la firma del webhook */
const APP_SECRET = process.env.META_APP_SECRET || ''

// =============================================
// GET - Verificación del Webhook
// =============================================

/**
 * GET /api/meta/webhook
 *
 * Meta envía una solicitud de verificación cuando se configura el webhook
 * en el Meta Developer Portal. Se debe responder con el challenge si el
 * verify_token coincide.
 *
 * Parámetros esperados:
 * - hub.mode = "subscribe"
 * - hub.verify_token = token configurado en Meta Developer Portal
 * - hub.challenge = valor a retornar como respuesta
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const modo = searchParams.get('hub.mode')
    const tokenVerificacion = searchParams.get('hub.verify_token')
    const desafio = searchParams.get('hub.challenge')

    console.log('[MetaWebhook] Solicitud de verificación recibida', {
      modo,
      token: tokenVerificacion ? '***' : 'vacío',
      desafio: desafio ? 'presente' : 'ausente',
    })

    // Verificar que sea una solicitud de suscripción válida
    if (modo === 'subscribe' && tokenVerificacion === VERIFY_TOKEN) {
      console.log('[MetaWebhook] Verificación exitosa. Webhook confirmado.')
      // Meta espera recibir el challenge como respuesta de texto plano
      return new NextResponse(desafio, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    // Verificación fallida
    console.warn('[MetaWebhook] Verificación fallida. Token o modo incorrectos.')
    return NextResponse.json(
      { error: 'Verificación fallida. Token o modo incorrectos.' },
      { status: 403 }
    )
  } catch (error) {
    console.error('[MetaWebhook] Error en verificación de webhook:', error)
    return NextResponse.json(
      { error: 'Error interno en verificación de webhook' },
      { status: 500 }
    )
  }
}

// =============================================
// POST - Manejador de Eventos del Webhook
// =============================================

/**
 * POST /api/meta/webhook
 *
 * Recibe eventos en tiempo real de Meta (actualizaciones de adsets, campañas,
 * leads, etc.). Debe responder rápidamente (200) para que Meta no reintente.
 *
 * Estructura del payload de Meta:
 * {
 *   "object": "page" | "ad_account" | "user",
 *   "entry": [
 *     {
 *       "id": "object_id",
 *       "time": timestamp,
 *       "changes": [
 *         {
 *           "field": "campo_cambiado",
 *           "value": { ... datos del cambio ... }
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // =============================================
    // Verificar firma del webhook (seguridad)
    // =============================================
    let cuerpo: Record<string, unknown>

    if (APP_SECRET) {
      const firmaEsperada = request.headers.get('x-hub-signature-256')
      const cuerpoRaw = await request.text()

      if (!firmaEsperada) {
        console.warn('[MetaWebhook] Solicitud sin firma de verificación')
        return NextResponse.json(
          { error: 'Firma de verificación ausente' },
          { status: 401 }
        )
      }

      // Calcular firma HMAC-SHA256 con el app_secret
      const firmaCalculada = 'sha256=' + createHmac('sha256', APP_SECRET)
        .update(cuerpoRaw)
        .digest('hex')

      if (firmaEsperada !== firmaCalculada) {
        console.warn('[MetaWebhook] Firma de verificación inválida')
        return NextResponse.json(
          { error: 'Firma de verificación inválida' },
          { status: 401 }
        )
      }

      // Parsear el cuerpo ya verificado
      cuerpo = JSON.parse(cuerpoRaw)
    } else {
      // Sin APP_SECRET configurado, parsear directamente (solo para desarrollo)
      console.warn('[MetaWebhook] Advertencia: Verificación de firma deshabilitada (APP_SECRET no configurado)')
      cuerpo = await request.json() as Record<string, unknown>
    }

    console.log('[MetaWebhook] Evento recibido:', {
      objeto: cuerpo.object,
      entradas: cuerpo.entry?.length || 0,
    })

    // =============================================
    // Procesar cada entrada del evento
    // =============================================
    if (cuerpo.entry && Array.isArray(cuerpo.entry)) {
      for (const entrada of cuerpo.entry) {
        await procesarEntradaWebhook(entrada)
      }
    }

    // Responder 200 inmediatamente (Meta espera respuesta rápida)
    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (error) {
    console.error('[MetaWebhook] Error al procesar evento:', error)
    // Aún así responder 200 para evitar reintentos de Meta
    return NextResponse.json({ status: 'error_procesando' }, { status: 200 })
  }
}

// =============================================
// PROCESAMIENTO DE EVENTOS
// =============================================

/**
 * Procesar una entrada individual del webhook.
 * Dependiendo del tipo de objeto y campo, actualiza la base de datos.
 */
async function procesarEntradaWebhook(entrada: {
  id: string
  time: number
  changes?: Array<{
    field: string
    value: Record<string, unknown>
  }>
  messaging?: Array<Record<string, unknown>>
}): Promise<void> {
  const objetoId = entrada.id
  const timestamp = new Date(entrada.time * 1000)

  // =============================================
  // Procesar cambios (ad_account, page updates)
  // =============================================
  if (entrada.changes && Array.isArray(entrada.changes)) {
    for (const cambio of entrada.changes) {
      const campo = cambio.field
      const valor = cambio.value

      console.log(`[MetaWebhook] Procesando cambio: campo="${campo}", objeto="${objetoId}"`)

      switch (campo) {
        // Cambios en estado de adset
        case 'adset_status':
          await procesarCambioAdset(objetoId, valor, timestamp)
          break

        // Cambios en estado de campaña
        case 'campaign_status':
          await procesarCambioCampana(objetoId, valor, timestamp)
          break

        // Evento de generación de lead
        case 'leadgen':
          await procesarLeadGen(objetoId, valor, timestamp)
          break

        // Cambios en presupuesto
        case 'adset_budget':
          await procesarCambioPresupuesto(objetoId, valor, timestamp)
          break

        // Otros campos - solo registrar
        default:
          console.log(`[MetaWebhook] Campo no manejado: "${campo}". Registrando para referencia.`)
          break
      }
    }
  }

  // =============================================
  // Procesar mensajes (para lead gen de Messenger)
  // =============================================
  if (entrada.messaging && Array.isArray(entrada.messaging)) {
    for (const mensaje of entrada.messaging) {
      console.log('[MetaWebhook] Mensaje de Messenger recibido para página:', objetoId)
      // Los mensajes de Messenger con lead gen se procesan aquí
      if (mensaje.postback?.payload) {
        await procesarPostbackMessenger(objetoId, mensaje)
      }
    }
  }
}

/**
 * Procesar cambio de estado de un adset.
 * Actualiza el estado en la base de datos local.
 */
async function procesarCambioAdset(
  objetoId: string,
  valor: Record<string, unknown>,
  _timestamp: Date
): Promise<void> {
  try {
    const adsetId = String(valor.adset_id || valor.id || objetoId)
    const nuevoEstado = String(valor.status || valor.effective_status || '')

    if (!nuevoEstado) return

    // Buscar adset local por metaAdSetId
    const adsetLocal = await db.adSet.findFirst({
      where: { metaAdSetId: adsetId },
    })

    if (adsetLocal) {
      await db.adSet.update({
        where: { id: adsetLocal.id },
        data: { status: nuevoEstado },
      })
      console.log(`[MetaWebhook] Adset "${adsetId}" actualizado a estado: ${nuevoEstado}`)
    } else {
      console.log(`[MetaWebhook] Adset "${adsetId}" no encontrado en BD local. Cambio registrado pero no aplicado.`)
    }
  } catch (error) {
    console.error('[MetaWebhook] Error al procesar cambio de adset:', error)
  }
}

/**
 * Procesar cambio de estado de una campaña.
 * Actualiza el estado en la base de datos local.
 */
async function procesarCambioCampana(
  objetoId: string,
  valor: Record<string, unknown>,
  _timestamp: Date
): Promise<void> {
  try {
    const campanaId = String(valor.campaign_id || valor.id || objetoId)
    const nuevoEstado = String(valor.status || valor.effective_status || '')

    if (!nuevoEstado) return

    // Buscar campaña local por metaCampaignId
    const campanaLocal = await db.campaign.findFirst({
      where: { metaCampaignId: campanaId },
    })

    if (campanaLocal) {
      await db.campaign.update({
        where: { id: campanaLocal.id },
        data: { status: nuevoEstado },
      })
      console.log(`[MetaWebhook] Campaña "${campanaId}" actualizada a estado: ${nuevoEstado}`)
    } else {
      console.log(`[MetaWebhook] Campaña "${campanaId}" no encontrada en BD local. Cambio registrado pero no aplicado.`)
    }
  } catch (error) {
    console.error('[MetaWebhook] Error al procesar cambio de campaña:', error)
  }
}

/**
 * Procesar evento de generación de lead.
 * Crea un nuevo lead en la base de datos local con los datos recibidos.
 */
async function procesarLeadGen(
  objetoId: string,
  valor: Record<string, unknown>,
  _timestamp: Date
): Promise<void> {
  try {
    const leadgenId = String(valor.leadgen_id || valor.id || '')
    const adId = String(valor.ad_id || '')
    const formularioId = String(valor.form_id || '')

    console.log(`[MetaWebhook] Lead generado: leadgen_id=${leadgenId}, ad_id=${adId}, form_id=${formularioId}`)

    // Buscar región por defecto para el lead
    let region = await db.region.findFirst({ where: { code: 'GLOBAL' } })
    if (!region) {
      region = await db.region.create({
        data: {
          code: 'GLOBAL',
          name: 'Global',
          currency: 'USD',
        },
      })
    }

    // Obtener los datos del lead de Meta (si hay field_data)
    const datosCampo = valor.field_data as Array<{ name: string; values: string[] }> | undefined
    let email: string | null = null
    let telefono: string | null = null
    let nombre: string | null = null
    let apellido: string | null = null

    if (datosCampo && Array.isArray(datosCampo)) {
      for (const campo of datosCampo) {
        const valores = campo.values || []
        switch (campo.name) {
          case 'email':
          case 'correo_electrónico':
            email = valores[0] || null
            break
          case 'phone_number':
          case 'teléfono':
            telefono = valores[0] || null
            break
          case 'first_name':
          case 'nombre':
            nombre = valores[0] || null
            break
          case 'last_name':
          case 'apellido':
            apellido = valores[0] || null
            break
        }
      }
    }

    // Crear lead en la base de datos
    await db.lead.create({
      data: {
        firstName: nombre,
        lastName: apellido,
        email,
        phone: telefono,
        country: 'UNKNOWN',
        regionId: region.id,
        route: 'OUT_COUNTRY_GLOBAL',
        source: 'META_ADS',
        metaAdId: adId || objetoId,
        status: 'NEW',
        qualificationScore: 0,
      },
    })

    console.log('[MetaWebhook] Lead creado exitosamente en la base de datos')
  } catch (error) {
    console.error('[MetaWebhook] Error al procesar lead gen:', error)
  }
}

/**
 * Procesar cambio de presupuesto de un adset.
 * Actualiza el presupuesto en la base de datos local.
 */
async function procesarCambioPresupuesto(
  objetoId: string,
  valor: Record<string, unknown>,
  _timestamp: Date
): Promise<void> {
  try {
    const adsetId = String(valor.adset_id || valor.id || objetoId)
    const nuevoPresupuesto = valor.daily_budget
      ? parseFloat(String(valor.daily_budget)) / 100 // Meta envía presupuesto en centavos
      : null

    if (nuevoPresupuesto === null) return

    // Buscar adset local por metaAdSetId
    const adsetLocal = await db.adSet.findFirst({
      where: { metaAdSetId: adsetId },
    })

    if (adsetLocal) {
      await db.adSet.update({
        where: { id: adsetLocal.id },
        data: { budget: nuevoPresupuesto },
      })
      console.log(`[MetaWebhook] Presupuesto de adset "${adsetId}" actualizado a: ${nuevoPresupuesto}`)
    } else {
      console.log(`[MetaWebhook] Adset "${adsetId}" no encontrado para actualización de presupuesto.`)
    }
  } catch (error) {
    console.error('[MetaWebhook] Error al procesar cambio de presupuesto:', error)
  }
}

/**
 * Procesar postback de Messenger (para leads de chat).
 */
async function procesarPostbackMessenger(
  _paginaId: string,
  mensaje: Record<string, unknown>
): Promise<void> {
  try {
    const postback = mensaje.postback as { payload: string; title?: string } | undefined
    if (!postback?.payload) return

    console.log(`[MetaWebhook] Postback de Messenger: ${postback.payload}`)

    // Registrar el postback como evento CAPI para tracking
    const remitente = mensaje.sender as { id: string } | undefined
    if (remitente?.id) {
      // Verificar si ya existe una región GLOBAL
      let region = await db.region.findFirst({ where: { code: 'GLOBAL' } })
      if (!region) {
        region = await db.region.create({
          data: {
            code: 'GLOBAL',
            name: 'Global',
            currency: 'USD',
          },
        })
      }

      // Crear evento CAPI para el postback
      await db.cAPIEvent.create({
        data: {
          eventId: `msg_${remitente.id}_${Date.now()}`,
          eventName: 'MessengerPostback',
          country: null,
          sentToMeta: false,
          metaResponse: null,
        },
      })
    }
  } catch (error) {
    console.error('[MetaWebhook] Error al procesar postback de Messenger:', error)
  }
}
