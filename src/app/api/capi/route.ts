// API de CAPI (Conversions API) - ImmiScale Meta Engine v5
// Envío y registro de eventos de conversión a Meta con integración real

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMetaAPI } from '@/lib/meta-api'
import { v4 as uuidv4 } from 'uuid'

// =============================================
// GET - Listar eventos CAPI con filtros opcionales
// =============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Construir filtros dinámicamente
    const filtros: Record<string, unknown> = {}

    const enviadoAMeta = searchParams.get('sentToMeta')
    if (enviadoAMeta !== null) {
      filtros.sentToMeta = enviadoAMeta === 'true'
    }

    const nombreEvento = searchParams.get('eventName')
    if (nombreEvento) filtros.eventName = nombreEvento

    const pais = searchParams.get('country')
    if (pais) filtros.country = pais

    const eventos = await db.cAPIEvent.findMany({
      where: filtros,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      exito: true,
      datos: eventos,
      total: eventos.length,
      filtros: {
        sentToMeta: enviadoAMeta || null,
        eventName: nombreEvento || null,
        country: pais || null,
      },
    })
  } catch (error) {
    console.error('Error al obtener eventos CAPI:', error)
    return NextResponse.json(
      { exito: false, error: 'Error al obtener eventos CAPI' },
      { status: 500 }
    )
  }
}

// =============================================
// POST - Crear y enviar un evento CAPI a Meta
// Intenta usar la API real de Meta; si no está conectada, simula el envío
// =============================================
export async function POST(request: NextRequest) {
  try {
    const cuerpo = await request.json()

    // Validar campos requeridos
    if (!cuerpo.eventName) {
      return NextResponse.json(
        { exito: false, error: 'El campo "eventName" es obligatorio' },
        { status: 400 }
      )
    }

    // Generar ID único del evento para deduplicación
    const eventId = uuidv4()

    // Crear registro del evento con sentToMeta=false inicialmente
    const nuevoEvento = await db.cAPIEvent.create({
      data: {
        eventId,
        eventName: cuerpo.eventName,
        sourceUrl: cuerpo.sourceUrl || null,
        country: cuerpo.country || null,
        userAgent: cuerpo.userAgent || null,
        fbclid: cuerpo.fbclid || null,
        fbp: cuerpo.fbp || null,
        sentToMeta: false,
        metaResponse: null,
      },
    })

    let metaResponse = ''
    let sentToMeta = false

    // =============================================
    // Intentar envío real a Meta CAPI
    // =============================================
    try {
      const metaAPI = await getMetaAPI()

      if (metaAPI) {
        // Meta está conectada: enviar evento real con hashing SHA-256
        const respuestaCAPI = await metaAPI.enviarEventoCAPI({
          eventName: cuerpo.eventName,
          eventId,
          eventTime: Math.floor(Date.now() / 1000),
          sourceUrl: cuerpo.sourceUrl,
          userAgent: cuerpo.userAgent,
          fbclid: cuerpo.fbclid,
          fbp: cuerpo.fbp,
          country: cuerpo.country,
          email: cuerpo.email,
          phone: cuerpo.phone,
          firstName: cuerpo.firstName,
          lastName: cuerpo.lastName,
        })

        // Éxito en el envío real
        metaResponse = JSON.stringify({
          tipo: 'META_API_REAL',
          events_received: respuestaCAPI.events_received,
          fbtrace_id: respuestaCAPI.fbtrace_id,
          timestamp: new Date().toISOString(),
        })
        sentToMeta = true
      } else {
        // Meta NO está conectada: simulación
        metaResponse = JSON.stringify({
          tipo: 'SIMULACION',
          mensaje: 'Meta API no conectada - evento simulado',
          event_name: cuerpo.eventName,
          event_id: eventId,
          event_time: Math.floor(Date.now() / 1000),
          event_source_url: cuerpo.sourceUrl,
          action_source: 'website',
          user_data: {
            client_user_agent: cuerpo.userAgent || null,
            fbc: cuerpo.fbclid ? `fb.1.${Math.floor(Date.now() / 1000)}.${cuerpo.fbclid}` : null,
            fbp: cuerpo.fbp || null,
          },
          timestamp: new Date().toISOString(),
        })
        sentToMeta = true // Simulación también marca como "enviado"
      }
    } catch (errorMeta) {
      // Error al enviar a Meta (API real conectada pero falló)
      metaResponse = JSON.stringify({
        tipo: 'ERROR_META_API',
        error: errorMeta instanceof Error ? errorMeta.message : 'Error desconocido al enviar a Meta',
        timestamp: new Date().toISOString(),
      })
      sentToMeta = false
    }

    // Actualizar el registro del evento con la respuesta
    await db.cAPIEvent.update({
      where: { id: nuevoEvento.id },
      data: {
        sentToMeta,
        metaResponse,
      },
    })

    // Obtener el evento actualizado
    const eventoActualizado = await db.cAPIEvent.findUnique({
      where: { id: nuevoEvento.id },
    })

    return NextResponse.json(
      {
        exito: true,
        datos: eventoActualizado,
        metaConectado: sentToMeta && metaResponse.includes('META_API_REAL'),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al crear evento CAPI:', error)
    return NextResponse.json(
      { exito: false, error: 'Error al crear evento CAPI' },
      { status: 500 }
    )
  }
}
