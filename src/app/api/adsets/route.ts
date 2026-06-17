// API de AdSets - ImmiScale Meta Engine v5
// Gestión de conjuntos de anuncios con escalado automático

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar todos los adsets con campaña y región
export async function GET() {
  try {
    const adsets = await db.adSet.findMany({
      include: {
        campaign: true,
        region: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      exito: true,
      datos: adsets,
      total: adsets.length,
    })
  } catch (error) {
    console.error('Error al obtener adsets:', error)
    return NextResponse.json(
      { exito: false, error: 'Error al obtener adsets' },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo adset
export async function POST(request: NextRequest) {
  try {
    const cuerpo = await request.json()

    // Validar campos requeridos
    if (!cuerpo.name || !cuerpo.campaignId || !cuerpo.regionId || cuerpo.budget === undefined) {
      return NextResponse.json(
        { exito: false, error: 'Los campos "name", "campaignId", "regionId" y "budget" son obligatorios' },
        { status: 400 }
      )
    }

    // Verificar que la campaña existe
    const campana = await db.campaign.findUnique({
      where: { id: cuerpo.campaignId },
    })
    if (!campana) {
      return NextResponse.json(
        { exito: false, error: 'La campaña especificada no existe' },
        { status: 404 }
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

    const nuevoAdset = await db.adSet.create({
      data: {
        metaAdSetId: cuerpo.metaAdSetId || null,
        name: cuerpo.name,
        campaignId: cuerpo.campaignId,
        regionId: cuerpo.regionId,
        budget: cuerpo.budget,
        budgetCurrency: cuerpo.budgetCurrency || region.currency,
        dailySpend: cuerpo.dailySpend || 0,
        cpl: cuerpo.cpl || 0,
        leadCount: cuerpo.leadCount || 0,
        audienceType: cuerpo.audienceType || 'BROAD',
        targetingJson: cuerpo.targetingJson || null,
        status: cuerpo.status || 'ACTIVE',
        scaleDirection: cuerpo.scaleDirection || null,
        lastBudgetInc: cuerpo.lastBudgetInc || null,
        killSwitchTriggered: cuerpo.killSwitchTriggered || false,
      },
      include: {
        campaign: true,
        region: true,
      },
    })

    return NextResponse.json(
      { exito: true, datos: nuevoAdset },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al crear adset:', error)
    return NextResponse.json(
      { exito: false, error: 'Error al crear adset' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un adset (presupuesto, estado, etc.)
export async function PUT(request: NextRequest) {
  try {
    const cuerpo = await request.json()

    if (!cuerpo.id) {
      return NextResponse.json(
        { exito: false, error: 'El campo "id" es obligatorio para actualizar' },
        { status: 400 }
      )
    }

    // Verificar que el adset existe
    const adsetExistente = await db.adSet.findUnique({
      where: { id: cuerpo.id },
    })
    if (!adsetExistente) {
      return NextResponse.json(
        { exito: false, error: 'El adset especificado no existe' },
        { status: 404 }
      )
    }

    // Construir objeto de actualización solo con campos proporcionados
    const datosActualizacion: Record<string, unknown> = {}

    if (cuerpo.name !== undefined) datosActualizacion.name = cuerpo.name
    if (cuerpo.budget !== undefined) datosActualizacion.budget = cuerpo.budget
    if (cuerpo.budgetCurrency !== undefined) datosActualizacion.budgetCurrency = cuerpo.budgetCurrency
    if (cuerpo.dailySpend !== undefined) datosActualizacion.dailySpend = cuerpo.dailySpend
    if (cuerpo.cpl !== undefined) datosActualizacion.cpl = cuerpo.cpl
    if (cuerpo.leadCount !== undefined) datosActualizacion.leadCount = cuerpo.leadCount
    if (cuerpo.audienceType !== undefined) datosActualizacion.audienceType = cuerpo.audienceType
    if (cuerpo.targetingJson !== undefined) datosActualizacion.targetingJson = cuerpo.targetingJson
    if (cuerpo.status !== undefined) datosActualizacion.status = cuerpo.status
    if (cuerpo.scaleDirection !== undefined) datosActualizacion.scaleDirection = cuerpo.scaleDirection
    if (cuerpo.lastBudgetInc !== undefined) datosActualizacion.lastBudgetInc = cuerpo.lastBudgetInc
    if (cuerpo.killSwitchTriggered !== undefined) datosActualizacion.killSwitchTriggered = cuerpo.killSwitchTriggered
    if (cuerpo.metaAdSetId !== undefined) datosActualizacion.metaAdSetId = cuerpo.metaAdSetId

    const adsetActualizado = await db.adSet.update({
      where: { id: cuerpo.id },
      data: datosActualizacion,
      include: {
        campaign: true,
        region: true,
      },
    })

    return NextResponse.json({
      exito: true,
      datos: adsetActualizado,
    })
  } catch (error) {
    console.error('Error al actualizar adset:', error)
    return NextResponse.json(
      { exito: false, error: 'Error al actualizar adset' },
      { status: 500 }
    )
  }
}
