// API de Leads - ImmiScale Meta Engine v5
// Gestión de leads pre-calificados con filtrado avanzado
// SAFE: Returns [] on empty DB instead of 500

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar leads con región y pagos, soporta filtros por query params
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Construir filtros dinámicamente
    const filtros: Record<string, unknown> = {}

    const estado = searchParams.get('status')
    if (estado) filtros.status = estado

    const ruta = searchParams.get('route')
    if (ruta) filtros.route = ruta

    const regionId = searchParams.get('regionId')
    if (regionId) filtros.regionId = regionId

    const leads = await db.lead.findMany({
      where: filtros,
      include: {
        region: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      exito: true,
      datos: leads,
      total: leads.length,
      filtros: {
        status: estado || null,
        route: ruta || null,
        regionId: regionId || null,
      },
    })
  } catch (error) {
    console.error('Error al obtener leads:', error)
    // Graceful fallback: return empty array instead of 500
    return NextResponse.json({
      exito: true,
      datos: [],
      total: 0,
      filtros: { status: null, route: null, regionId: null },
      _warning: 'La base de datos no está disponible. Ejecuta /api/init-db para inicializar.',
    })
  }
}

// POST - Crear un nuevo lead
export async function POST(request: NextRequest) {
  try {
    const cuerpo = await request.json()

    // Validar campos requeridos
    if (!cuerpo.country || !cuerpo.regionId || !cuerpo.route) {
      return NextResponse.json(
        { exito: false, error: 'Los campos "country", "regionId" y "route" son obligatorios' },
        { status: 400 }
      )
    }

    // Verificar que la región existe
    const region = await db.region.findUnique({
      where: { id: cuerpo.regionId },
    })
    if (!region) {
      return NextResponse.json(
        { exito: false, error: 'La región especificada no existe' },
        { status: 404 }
      )
    }

    const nuevoLead = await db.lead.create({
      data: {
        firstName: cuerpo.firstName || null,
        lastName: cuerpo.lastName || null,
        email: cuerpo.email || null,
        phone: cuerpo.phone || null,
        country: cuerpo.country,
        regionId: cuerpo.regionId,
        route: cuerpo.route,
        visaType: cuerpo.visaType || null,
        hasCriminalRecord: cuerpo.hasCriminalRecord ?? null,
        investmentCapacity: cuerpo.investmentCapacity || null,
        hasUniversityDegree: cuerpo.hasUniversityDegree ?? null,
        hasUsFamily: cuerpo.hasUsFamily ?? null,
        solvencyVerified: cuerpo.solvencyVerified ?? null,
        qualificationScore: cuerpo.qualificationScore || 0,
        status: cuerpo.status || 'NEW',
        chatSessionId: cuerpo.chatSessionId || null,
        source: cuerpo.source || 'META_ADS',
        metaAdId: cuerpo.metaAdId || null,
        notes: cuerpo.notes || null,
      },
      include: {
        region: true,
        payments: true,
      },
    })

    return NextResponse.json(
      { exito: true, datos: nuevoLead },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al crear lead:', error)
    return NextResponse.json(
      { exito: false, error: 'Error al crear lead. Verifica que la base de datos esté inicializada.' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un lead (cambio de estado, etc.)
export async function PUT(request: NextRequest) {
  try {
    const cuerpo = await request.json()

    if (!cuerpo.id) {
      return NextResponse.json(
        { exito: false, error: 'El campo "id" es obligatorio para actualizar' },
        { status: 400 }
      )
    }

    // Verificar que el lead existe
    const leadExistente = await db.lead.findUnique({
      where: { id: cuerpo.id },
    })
    if (!leadExistente) {
      return NextResponse.json(
        { exito: false, error: 'El lead especificado no existe' },
        { status: 404 }
      )
    }

    // Construir objeto de actualización solo con campos proporcionados
    const datosActualizacion: Record<string, unknown> = {}

    if (cuerpo.firstName !== undefined) datosActualizacion.firstName = cuerpo.firstName
    if (cuerpo.lastName !== undefined) datosActualizacion.lastName = cuerpo.lastName
    if (cuerpo.email !== undefined) datosActualizacion.email = cuerpo.email
    if (cuerpo.phone !== undefined) datosActualizacion.phone = cuerpo.phone
    if (cuerpo.country !== undefined) datosActualizacion.country = cuerpo.country
    if (cuerpo.regionId !== undefined) datosActualizacion.regionId = cuerpo.regionId
    if (cuerpo.route !== undefined) datosActualizacion.route = cuerpo.route
    if (cuerpo.visaType !== undefined) datosActualizacion.visaType = cuerpo.visaType
    if (cuerpo.hasCriminalRecord !== undefined) datosActualizacion.hasCriminalRecord = cuerpo.hasCriminalRecord
    if (cuerpo.investmentCapacity !== undefined) datosActualizacion.investmentCapacity = cuerpo.investmentCapacity
    if (cuerpo.hasUniversityDegree !== undefined) datosActualizacion.hasUniversityDegree = cuerpo.hasUniversityDegree
    if (cuerpo.hasUsFamily !== undefined) datosActualizacion.hasUsFamily = cuerpo.hasUsFamily
    if (cuerpo.solvencyVerified !== undefined) datosActualizacion.solvencyVerified = cuerpo.solvencyVerified
    if (cuerpo.qualificationScore !== undefined) datosActualizacion.qualificationScore = cuerpo.qualificationScore
    if (cuerpo.status !== undefined) datosActualizacion.status = cuerpo.status
    if (cuerpo.chatSessionId !== undefined) datosActualizacion.chatSessionId = cuerpo.chatSessionId
    if (cuerpo.source !== undefined) datosActualizacion.source = cuerpo.source
    if (cuerpo.metaAdId !== undefined) datosActualizacion.metaAdId = cuerpo.metaAdId
    if (cuerpo.notes !== undefined) datosActualizacion.notes = cuerpo.notes

    const leadActualizado = await db.lead.update({
      where: { id: cuerpo.id },
      data: datosActualizacion,
      include: {
        region: true,
        payments: true,
      },
    })

    return NextResponse.json({
      exito: true,
      datos: leadActualizado,
    })
  } catch (error) {
    console.error('Error al actualizar lead:', error)
    return NextResponse.json(
      { exito: false, error: 'Error al actualizar lead' },
      { status: 500 }
    )
  }
}
