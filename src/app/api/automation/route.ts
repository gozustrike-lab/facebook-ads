// API de Automatización - ImmiScale Meta Engine v5
// Reglas de escalado vertical, horizontal y kill-switch con sincronización Meta

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMetaAPI } from '@/lib/meta-api'

// =============================================
// GET - Obtener resumen del estado de automatización
// =============================================
export async function GET() {
  try {
    // Contar adsets por estado
    const adsetsActivos = await db.adSet.count({ where: { status: 'ACTIVE' } })
    const adsetsPausados = await db.adSet.count({ where: { status: 'PAUSED' } })
    const adsetsKilled = await db.adSet.count({ where: { status: 'KILLED' } })
    const adsetsLearning = await db.adSet.count({ where: { status: 'LEARNING' } })
    const adsetsConKillSwitch = await db.adSet.count({ where: { killSwitchTriggered: true } })

    // Total de adsets
    const totalAdsets = await db.adSet.count()

    // Presupuesto total activo
    const adsetsActivosDatos = await db.adSet.findMany({
      where: { status: 'ACTIVE' },
      select: { budget: true, dailySpend: true, cpl: true },
    })

    const presupuestoTotalActivo = adsetsActivosDatos.reduce((acc, a) => acc + a.budget, 0)
    const gastoTotalDiario = adsetsActivosDatos.reduce((acc, a) => acc + a.dailySpend, 0)
    const cplPromedio = adsetsActivosDatos.length > 0
      ? adsetsActivosDatos.reduce((acc, a) => acc + a.cpl, 0) / adsetsActivosDatos.length
      : 0

    // Últimos adsets que recibieron incremento de presupuesto
    const recientesEscalados = await db.adSet.findMany({
      where: { lastBudgetInc: { not: null } },
      include: { region: true },
      orderBy: { lastBudgetInc: 'desc' },
      take: 5,
    })

    // Últimos adsets con kill-switch activado
    const recientesKilled = await db.adSet.findMany({
      where: { killSwitchTriggered: true },
      include: { region: true },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    })

    return NextResponse.json({
      exito: true,
      datos: {
        resumen: {
          totalAdsets,
          adsetsActivos,
          adsetsPausados,
          adsetsKilled,
          adsetsLearning,
          adsetsConKillSwitch,
          presupuestoTotalActivo: Math.round(presupuestoTotalActivo * 100) / 100,
          gastoTotalDiario: Math.round(gastoTotalDiario * 100) / 100,
          cplPromedio: Math.round(cplPromedio * 100) / 100,
        },
        recientesEscalados,
        recientesKilled,
      },
    })
  } catch (error) {
    console.error('Error al obtener estado de automatización:', error)
    return NextResponse.json(
      { exito: false, error: 'Error al obtener estado de automatización' },
      { status: 500 }
    )
  }
}

// =============================================
// POST - Ejecutar reglas de automatización
// =============================================
interface ResultadoAccion {
  accion: string
  detalles: string[]
  afectados: number
}

export async function POST(request: NextRequest) {
  try {
    const cuerpo = await request.json()
    const { action } = cuerpo as { action: string }

    if (!action) {
      return NextResponse.json(
        { exito: false, error: 'El campo "action" es obligatorio. Valores: SCALE_VERTICAL, SCALE_HORIZONTAL, KILL_SWITCH, RUN_ALL' },
        { status: 400 }
      )
    }

    const resultados: ResultadoAccion[] = []

    switch (action) {
      case 'SCALE_VERTICAL': {
        const resultado = await ejecutarScaleVertical()
        resultados.push(resultado)
        break
      }

      case 'SCALE_HORIZONTAL': {
        const resultado = await ejecutarScaleHorizontal()
        resultados.push(resultado)
        break
      }

      case 'KILL_SWITCH': {
        const resultado = await ejecutarKillSwitch()
        resultados.push(resultado)
        break
      }

      case 'RUN_ALL': {
        // Ejecutar las tres acciones en secuencia
        const resultadoVertical = await ejecutarScaleVertical()
        resultados.push(resultadoVertical)

        const resultadoHorizontal = await ejecutarScaleHorizontal()
        resultados.push(resultadoHorizontal)

        const resultadoKill = await ejecutarKillSwitch()
        resultados.push(resultadoKill)
        break
      }

      default: {
        return NextResponse.json(
          { exito: false, error: `Acción "${action}" no reconocida. Valores válidos: SCALE_VERTICAL, SCALE_HORIZONTAL, KILL_SWITCH, RUN_ALL` },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({
      exito: true,
      datos: {
        accionEjecutada: action,
        resultados,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error al ejecutar automatización:', error)
    return NextResponse.json(
      { exito: false, error: 'Error al ejecutar automatización' },
      { status: 500 }
    )
  }
}

// =============================================
// Escalado Vertical: Incrementar presupuesto en adsets exitosos
// También actualiza el presupuesto en Meta si el adset tiene metaAdSetId
// =============================================
async function ejecutarScaleVertical(): Promise<ResultadoAccion> {
  const detalles: string[] = []
  let afectados = 0

  try {
    // Buscar adsets con autoScale habilitado, estado ACTIVE y último incremento > 24h
    const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Verificar si la campaña tiene autoScale habilitado
    const adsetsCandidatos = await db.adSet.findMany({
      where: {
        status: 'ACTIVE',
        lastBudgetInc: { lt: hace24Horas },
      },
      include: {
        campaign: true,
        region: true,
      },
    })

    // Filtrar solo los que tienen autoScale en la campaña
    const adsetsElegibles = adsetsCandidatos.filter(a => a.campaign.autoScale)

    // Obtener instancia de Meta API si está disponible
    const metaAPI = await getMetaAPI()

    for (const adset of adsetsElegibles) {
      // Incrementar presupuesto en 15%
      const presupuestoAnterior = adset.budget
      const nuevoPresupuesto = Math.round(presupuestoAnterior * 1.15 * 100) / 100
      const incremento = Math.round((nuevoPresupuesto - presupuestoAnterior) * 100) / 100

      // Actualizar presupuesto en la base de datos local
      await db.adSet.update({
        where: { id: adset.id },
        data: {
          budget: nuevoPresupuesto,
          lastBudgetInc: new Date(),
          scaleDirection: 'V',
        },
      })

      // Intentar actualizar presupuesto en Meta si el adset tiene metaAdSetId
      if (adset.metaAdSetId && metaAPI) {
        try {
          await metaAPI.actualizarAdSet(adset.metaAdSetId, {
            presupuestoDiario: nuevoPresupuesto,
          })
          detalles.push(
            `AdSet "${adset.name}" (${adset.region.code}): $${presupuestoAnterior} → $${nuevoPresupuesto} (+$${incremento}) [Meta sincronizado]`
          )
        } catch (errorMeta) {
          // Error en Meta: no revirtir cambio local, solo registrar el error
          console.error(`Error al actualizar presupuesto en Meta para adset ${adset.metaAdSetId}:`, errorMeta)
          detalles.push(
            `AdSet "${adset.name}" (${adset.region.code}): $${presupuestoAnterior} → $${nuevoPresupuesto} (+$${incremento}) [Error Meta: ${errorMeta instanceof Error ? errorMeta.message : 'desconocido'}]`
          )
        }
      } else {
        detalles.push(
          `AdSet "${adset.name}" (${adset.region.code}): $${presupuestoAnterior} → $${nuevoPresupuesto} (+$${incremento}) [Solo local]`
        )
      }

      afectados++
    }

    if (detalles.length === 0) {
      detalles.push('No se encontraron adsets elegibles para escalado vertical')
    }

    return { accion: 'SCALE_VERTICAL', detalles, afectados }
  } catch (error) {
    console.error('Error en escalado vertical:', error)
    detalles.push(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    return { accion: 'SCALE_VERTICAL', detalles, afectados }
  }
}

// =============================================
// Escalado Horizontal: Duplicar adsets exitosos a nuevos públicos
// También crea el adset en Meta si la campaña tiene metaCampaignId
// =============================================
async function ejecutarScaleHorizontal(): Promise<ResultadoAccion> {
  const detalles: string[] = []
  let afectados = 0

  try {
    // Buscar adsets con CPL menor al target de la región
    const adsets = await db.adSet.findMany({
      where: { status: 'ACTIVE' },
      include: {
        campaign: true,
        region: true,
      },
    })

    // Filtrar adsets exitosos (CPL < target de la región)
    const adsetsExitosos = adsets.filter(a => a.cpl > 0 && a.cpl < a.region.cplTarget)

    // Tipos de audiencia disponibles para expansión
    const tiposAudiencia = ['BROAD', 'LOOKALIKE', 'CUSTOM']

    // Obtener instancia de Meta API si está disponible
    const metaAPI = await getMetaAPI()

    for (const adset of adsetsExitosos) {
      // Determinar el tipo de audiencia actual
      const audienciaActual = adset.audienceType

      // Buscar un tipo de audiencia diferente que no exista ya en la misma campaña/región
      const audienciasDisponibles = tiposAudiencia.filter(t => t !== audienciaActual)

      for (const nuevaAudiencia of audienciasDisponibles) {
        // Verificar si ya existe un adset con esta combinación
        const existente = await db.adSet.findFirst({
          where: {
            campaignId: adset.campaignId,
            regionId: adset.regionId,
            audienceType: nuevaAudiencia,
            status: { in: ['ACTIVE', 'LEARNING'] },
          },
        })

        if (!existente) {
          // Duplicar adset con nuevo tipo de audiencia
          const nuevoAdset = await db.adSet.create({
            data: {
              name: `${adset.name} - ${nuevaAudiencia}`,
              campaignId: adset.campaignId,
              regionId: adset.regionId,
              budget: adset.budget,
              budgetCurrency: adset.budgetCurrency,
              dailySpend: 0,
              cpl: 0,
              leadCount: 0,
              audienceType: nuevaAudiencia,
              targetingJson: adset.targetingJson,
              status: 'LEARNING',
              scaleDirection: 'H',
            },
          })

          // Intentar crear el adset en Meta si la campaña tiene metaCampaignId
          if (adset.campaign.metaCampaignId && metaAPI) {
            try {
              const respuestaMeta = await metaAPI.crearAdSet({
                nombre: nuevoAdset.name,
                campaignId: adset.campaign.metaCampaignId,
                presupuestoDiario: nuevoAdset.budget,
                moneda: nuevoAdset.budgetCurrency,
                estado: 'ACTIVE',
                targeting: adset.targetingJson ? JSON.parse(adset.targetingJson) : undefined,
                audienceType: nuevaAudiencia,
              })

              // Guardar el metaAdSetId devuelto por Meta
              await db.adSet.update({
                where: { id: nuevoAdset.id },
                data: { metaAdSetId: respuestaMeta.id },
              })

              detalles.push(
                `Duplicado "${adset.name}" → "${nuevoAdset.name}" (${adset.region.code}, audiencia: ${nuevaAudiencia}) [Meta ID: ${respuestaMeta.id}]`
              )
            } catch (errorMeta) {
              // Error al crear en Meta: mantener registro local, registrar error
              console.error(`Error al crear adset en Meta para campaña ${adset.campaign.metaCampaignId}:`, errorMeta)
              detalles.push(
                `Duplicado "${adset.name}" → "${nuevoAdset.name}" (${adset.region.code}, audiencia: ${nuevaAudiencia}) [Error Meta: ${errorMeta instanceof Error ? errorMeta.message : 'desconocido'}]`
              )
            }
          } else {
            detalles.push(
              `Duplicado "${adset.name}" → "${nuevoAdset.name}" (${adset.region.code}, audiencia: ${nuevaAudiencia}) [Solo local]`
            )
          }

          afectados++
          break // Solo crear una duplicación por adset exitoso
        }
      }
    }

    if (detalles.length === 0) {
      detalles.push('No se encontraron adsets exitosos elegibles para escalado horizontal')
    }

    return { accion: 'SCALE_HORIZONTAL', detalles, afectados }
  } catch (error) {
    console.error('Error en escalado horizontal:', error)
    detalles.push(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    return { accion: 'SCALE_HORIZONTAL', detalles, afectados }
  }
}

// =============================================
// Kill Switch: Desactivar adsets con CPL excesivo
// También pausa el adset en Meta si tiene metaAdSetId
// =============================================
async function ejecutarKillSwitch(): Promise<ResultadoAccion> {
  const detalles: string[] = []
  let afectados = 0

  try {
    // Obtener todos los adsets activos con su región
    const adsets = await db.adSet.findMany({
      where: {
        status: { in: ['ACTIVE', 'LEARNING'] },
        cpl: { gt: 0 },
      },
      include: {
        region: true,
      },
    })

    // Filtrar adsets donde CPL > cplKillSwitch de la región
    const adsetsConCPLExcesivo = adsets.filter(a => a.cpl > a.region.cplKillSwitch)

    // Obtener instancia de Meta API si está disponible
    const metaAPI = await getMetaAPI()

    for (const adset of adsetsConCPLExcesivo) {
      // Marcar como KILLED localmente
      await db.adSet.update({
        where: { id: adset.id },
        data: {
          status: 'KILLED',
          killSwitchTriggered: true,
        },
      })

      // Intentar pausar el adset en Meta si tiene metaAdSetId
      if (adset.metaAdSetId && metaAPI) {
        try {
          await metaAPI.pausarAdSet(adset.metaAdSetId)
          detalles.push(
            `KILL: "${adset.name}" (${adset.region.code}) - CPL: $${adset.cpl} > KillSwitch: $${adset.region.cplKillSwitch} [Meta pausado]`
          )
        } catch (errorMeta) {
          // Error al pausar en Meta: no revirtir cambio local, solo registrar error
          console.error(`Error al pausar adset en Meta ${adset.metaAdSetId}:`, errorMeta)
          detalles.push(
            `KILL: "${adset.name}" (${adset.region.code}) - CPL: $${adset.cpl} > KillSwitch: $${adset.region.cplKillSwitch} [Error Meta: ${errorMeta instanceof Error ? errorMeta.message : 'desconocido'}]`
          )
        }
      } else {
        detalles.push(
          `KILL: "${adset.name}" (${adset.region.code}) - CPL: $${adset.cpl} > KillSwitch: $${adset.region.cplKillSwitch} [Solo local]`
        )
      }

      afectados++
    }

    if (detalles.length === 0) {
      detalles.push('No se encontraron adsets con CPL excesivo para kill-switch')
    }

    return { accion: 'KILL_SWITCH', detalles, afectados }
  } catch (error) {
    console.error('Error en kill-switch:', error)
    detalles.push(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    return { accion: 'KILL_SWITCH', detalles, afectados }
  }
}
