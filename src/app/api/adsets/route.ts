// API de AdSets - ImmiScale Meta Engine v5
// Gestión de conjuntos de anuncios con sincronización Meta
// SAFE: Returns [] on empty DB instead of 500

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMetaAPI } from '@/lib/meta-api'

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
    // Graceful fallback: return empty array instead of 500
    return NextResponse.json({
      exito: true,
      datos: [],
      total: 0,
      _warning: 'La base de datos no está disponible. Ejecuta /api/init-db para inicializar.',
    })
  }
}

// POST - Crear un nuevo adset (localmente y en Meta si está conectada)
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

    let metaAdSetId = cuerpo.metaAdSetId || null

    // Crear adset en la base de datos local
    const nuevoAdset = await db.adSet.create({
      data: {
        metaAdSetId,
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

    // Intentar crear el adset en Meta si la API está conectada y la campaña tiene metaCampaignId
    if (!metaAdSetId && campana.metaCampaignId) {
      try {
        const metaAPI = await getMetaAPI()
        if (metaAPI) {
          const respuestaMeta = await metaAPI.crearAdSet({
            nombre: cuerpo.name,
            campaignId: campana.metaCampaignId,
            presupuestoDiario: cuerpo.budget,
            moneda: cuerpo.budgetCurrency || region.currency,
            estado: cuerpo.status === 'LEARNING' ? 'ACTIVE' : (cuerpo.status || 'ACTIVE'),
            targeting: cuerpo.targetingJson ? JSON.parse(cuerpo.targetingJson) : undefined,
            audienceType: cuerpo.audienceType || 'BROAD',
          })

          // Guardar el metaAdSetId devuelto por Meta
          metaAdSetId = respuestaMeta.id

          await db.adSet.update({
            where: { id: nuevoAdset.id },
            data: { metaAdSetSetId: metaAdSetId },
          })

          // Actualizar el objeto de respuesta con el metaAdSetId
          nuevoAdset.metaAdSetId = metaAdSetId
        }
      } catch (errorMeta) {
        // Error al crear en Meta: mantener registro local, registrar error
        console.error('Error al crear adset en Meta:', errorMeta)
      }
    }

    return NextResponse.json(
      { exito: true, datos: nuevoAdset },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al crear adset:', error)
    return NextResponse.json(
      { exito: false, error: 'Error al crear adset. Verifica que la base de datos esté inicializada.' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un adset (presupuesto, estado, etc.) y sincronizar con Meta
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
      include: { campaign: true, region: true },
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

    // Actualizar en la base de datos local
    const adsetActualizado = await db.adSet.update({
      where: { id: cuerpo.id },
      data: datosActualizacion,
      include: {
        campaign: true,
        region: true,
      },
    })

    // Intentar sincronizar cambios con Meta si el adset tiene metaAdSetId
    if (adsetExistente.metaAdSetId) {
      try {
        const metaAPI = await getMetaAPI()
        if (metaAPI) {
          // Construir datos de actualización para Meta
          const datosMeta: { presupuestoDiario?: number; estado?: string; nombre?: string } = {}

          if (cuerpo.budget !== undefined) {
            datosMeta.presupuestoDiario = cuerpo.budget
          }

          // Mapear estados locales a estados de Meta
          if (cuerpo.status !== undefined) {
            const mapeoEstados: Record<string, string> = {
              'ACTIVE': 'ACTIVE',
              'PAUSED': 'PAUSED',
              'KILLED': 'PAUSED', // KILLED en local se mapea a PAUSED en Meta
              'LEARNING': 'ACTIVE', // LEARNING en local se mapea a ACTIVE en Meta
            }
            datosMeta.estado = mapeoEstados[cuerpo.status] || cuerpo.status
          }

          if (cuerpo.name !== undefined) {
            datosMeta.nombre = cuerpo.name
          }

          // Solo llamar a Meta si hay cambios que sincronizar
          if (Object.keys(datosMeta).length > 0) {
            await metaAPI.actualizarAdSet(adsetExistente.metaAdSetId, datosMeta)
          }
        }
      } catch (errorMeta) {
        // Error al actualizar en Meta: mantener cambio local, registrar error
        console.error(`Error al actualizar adset en Meta (${adsetExistente.metaAdSetId}):`, errorMeta)
      }
    }

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
