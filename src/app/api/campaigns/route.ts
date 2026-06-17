// API de Campañas - ImmiScale Meta Engine v5
// Gestión de campañas publicitarias de Meta Ads

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar todas las campañas con sus adsets
export async function GET() {
  try {
    const campanas = await db.campaign.findMany({
      include: {
        adSets: {
          include: {
            region: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      exito: true,
      datos: campanas,
      total: campanas.length,
    })
  } catch (error) {
    console.error('Error al obtener campañas:', error)
    return NextResponse.json(
      { exito: false, error: 'Error al obtener campañas' },
      { status: 500 }
    )
  }
}

// POST - Crear una nueva campaña
export async function POST(request: NextRequest) {
  try {
    const cuerpo = await request.json()

    // Validar campos requeridos
    if (!cuerpo.name) {
      return NextResponse.json(
        { exito: false, error: 'El campo "name" es obligatorio' },
        { status: 400 }
      )
    }

    const nuevaCampana = await db.campaign.create({
      data: {
        metaCampaignId: cuerpo.metaCampaignId || null,
        name: cuerpo.name,
        objective: cuerpo.objective || 'LEAD_GENERATION',
        status: cuerpo.status || 'ACTIVE',
        totalBudget: cuerpo.totalBudget || 0,
        totalSpend: cuerpo.totalSpend || 0,
        matchScore: cuerpo.matchScore || 0,
        autoScale: cuerpo.autoScale !== undefined ? cuerpo.autoScale : true,
        lastScaledAt: cuerpo.lastScaledAt || null,
      },
      include: {
        adSets: {
          include: {
            region: true,
          },
        },
      },
    })

    return NextResponse.json(
      { exito: true, datos: nuevaCampana },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al crear campaña:', error)
    return NextResponse.json(
      { exito: false, error: 'Error al crear campaña' },
      { status: 500 }
    )
  }
}
