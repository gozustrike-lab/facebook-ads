// API de Campañas - ImmiScale Meta Engine v5
// Gestión de campañas publicitarias de Meta Ads con sincronización

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMetaAPI } from '@/lib/meta-api'

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

// POST - Crear una nueva campaña (localmente y en Meta si está conectada)
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

    let metaCampaignId = cuerpo.metaCampaignId || null

    // Crear la campaña en la base de datos local
    const nuevaCampana = await db.campaign.create({
      data: {
        metaCampaignId,
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

    // Intentar crear la campaña en Meta si la API está conectada
    // Solo si no se proporcionó ya un metaCampaignId
    if (!metaCampaignId) {
      try {
        const metaAPI = await getMetaAPI()
        if (metaAPI) {
          const respuestaMeta = await metaAPI.crearCampana({
            nombre: cuerpo.name,
            objetivo: cuerpo.objective || 'LEAD_GENERATION',
            estado: cuerpo.status || 'PAUSED', // En Meta se crea pausada por seguridad
            presupuestoTotal: cuerpo.totalBudget || undefined,
          })

          // Guardar el metaCampaignId devuelto por Meta
          metaCampaignId = respuestaMeta.id

          await db.campaign.update({
            where: { id: nuevaCampana.id },
            data: { metaCampaignId },
          })

          // Actualizar el objeto de respuesta con el metaCampaignId
          nuevaCampana.metaCampaignId = metaCampaignId
        }
      } catch (errorMeta) {
        // Error al crear en Meta: mantener registro local, registrar error
        console.error('Error al crear campaña en Meta:', errorMeta)
        // No revirtir la creación local, solo loguear
      }
    }

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
