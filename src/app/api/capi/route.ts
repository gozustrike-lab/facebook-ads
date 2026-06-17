// API de CAPI (Conversions API) - ImmiScale Meta Engine v5
// Envío y registro de eventos de conversión a Meta

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
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

    // =============================================
    // Simulación de envío a Meta CAPI
    // En producción, aquí se llamaría al endpoint de Meta:
    // POST https://graph.facebook.com/v18.0/{pixel_id}/events
    // =============================================
    let metaResponse = 'SIMULATED_SUCCESS'

    try {
      // Simulación: en producción se haría fetch a Meta
      // const response = await fetch(`https://graph.facebook.com/v18.0/${PIXEL_ID}/events`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     data: [{
      //       event_name: cuerpo.eventName,
      //       event_id: eventId,
      //       event_time: Math.floor(Date.now() / 1000),
      //       event_source_url: cuerpo.sourceUrl,
      //       action_source: 'website',
      //       user_data: {
      //         client_user_agent: cuerpo.userAgent,
      //         fbc: cuerpo.fbclid ? `fb.1.${Math.floor(Date.now() / 1000)}.${cuerpo.fbclid}` : undefined,
      //         fbp: cuerpo.fbp,
      //       },
      //     }],
      //     access_token: ACCESS_TOKEN,
      //   }),
      // })

      // Marcar como enviado exitosamente
      await db.cAPIEvent.update({
        where: { id: nuevoEvento.id },
        data: {
          sentToMeta: true,
          metaResponse,
        },
      })
    } catch (errorMeta) {
      // Si falla el envío a Meta, registrar el error
      metaResponse = `ERROR: ${errorMeta instanceof Error ? errorMeta.message : 'Error desconocido'}`
      await db.cAPIEvent.update({
        where: { id: nuevoEvento.id },
        data: {
          sentToMeta: false,
          metaResponse,
        },
      })
    }

    // Obtener el evento actualizado
    const eventoActualizado = await db.cAPIEvent.findUnique({
      where: { id: nuevoEvento.id },
    })

    return NextResponse.json(
      {
        exito: true,
        datos: eventoActualizado,
        simulacion: 'Este es un envío simulado. En producción, se enviaría al endpoint de Meta CAPI.',
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
