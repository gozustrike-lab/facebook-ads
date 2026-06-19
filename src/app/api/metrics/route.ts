// API de Métricas - ImmiScale Meta Engine v5
// Métricas diarias por región con resúmenes agregados
// SAFE: Returns empty data on DB error instead of 500

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Empty response structure for graceful fallback
const emptyMetricsResponse = {
  exito: true,
  datos: [],
  resumen: {
    totalSpend: 0,
    totalLeads: 0,
    totalQualified: 0,
    totalPaid: 0,
    totalRevenue: 0,
    avgCpl: 0,
    avgCpql: 0,
    avgMatchScore: 0,
    dias: 0,
  },
  desglosePorRegion: {},
  filtros: { regionId: null, from: null, to: null },
  _warning: 'La base de datos no está disponible. Ejecuta /api/init-db para inicializar.',
}

// GET - Obtener métricas con filtros y resumen agregado
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Construir filtros dinámicamente
    const filtros: Record<string, unknown> = {}

    const regionId = searchParams.get('regionId')
    if (regionId) filtros.regionId = regionId

    // Filtro de rango de fechas
    const desde = searchParams.get('from')
    const hasta = searchParams.get('to')
    if (desde || hasta) {
      filtros.date = {}
      if (desde) {
        (filtros.date as Record<string, unknown>).gte = new Date(desde)
      }
      if (hasta) {
        // Incluir todo el día final
        const fechaHasta = new Date(hasta)
        fechaHasta.setHours(23, 59, 59, 999)
        (filtros.date as Record<string, unknown>).lte = fechaHasta
      }
    }

    // Obtener métricas con relación de región
    const metricas = await db.metric.findMany({
      where: filtros,
      include: {
        region: true,
      },
      orderBy: { date: 'desc' },
    })

    // Calcular resumen agregado
    const resumen = {
      totalSpend: 0,
      totalLeads: 0,
      totalQualified: 0,
      totalPaid: 0,
      totalRevenue: 0,
      avgCpl: 0,
      avgCpql: 0,
      avgMatchScore: 0,
      dias: metricas.length,
    }

    if (metricas.length > 0) {
      resumen.totalSpend = metricas.reduce((acc, m) => acc + m.totalSpend, 0)
      resumen.totalLeads = metricas.reduce((acc, m) => acc + m.leadCount, 0)
      resumen.totalQualified = metricas.reduce((acc, m) => acc + m.qualifiedCount, 0)
      resumen.totalPaid = metricas.reduce((acc, m) => acc + m.paidCount, 0)
      resumen.totalRevenue = metricas.reduce((acc, m) => acc + m.revenue, 0)
      resumen.avgCpl = metricas.reduce((acc, m) => acc + m.cpl, 0) / metricas.length
      resumen.avgCpql = metricas.reduce((acc, m) => acc + m.cpql, 0) / metricas.length
      resumen.avgMatchScore = metricas.reduce((acc, m) => acc + m.matchScore, 0) / metricas.length

      // Redondear valores
      resumen.totalSpend = Math.round(resumen.totalSpend * 100) / 100
      resumen.totalRevenue = Math.round(resumen.totalRevenue * 100) / 100
      resumen.avgCpl = Math.round(resumen.avgCpl * 100) / 100
      resumen.avgCpql = Math.round(resumen.avgCpql * 100) / 100
      resumen.avgMatchScore = Math.round(resumen.avgMatchScore * 100) / 100
    }

    // Desglose por región
    const desglosePorRegion: Record<string, {
      nombre: string
      codigo: string
      moneda: string
      totalSpend: number
      totalLeads: number
      totalQualified: number
      totalRevenue: number
      avgCpl: number
      dias: number
    }> = {}

    for (const metrica of metricas) {
      const rId = metrica.regionId
      if (!desglosePorRegion[rId]) {
        desglosePorRegion[rId] = {
          nombre: metrica.region.name,
          codigo: metrica.region.code,
          moneda: metrica.region.currency,
          totalSpend: 0,
          totalLeads: 0,
          totalQualified: 0,
          totalRevenue: 0,
          avgCpl: 0,
          dias: 0,
        }
      }
      desglosePorRegion[rId].totalSpend += metrica.totalSpend
      desglosePorRegion[rId].totalLeads += metrica.leadCount
      desglosePorRegion[rId].totalQualified += metrica.qualifiedCount
      desglosePorRegion[rId].totalRevenue += metrica.revenue
      desglosePorRegion[rId].avgCpl += metrica.cpl
      desglosePorRegion[rId].dias += 1
    }

    // Calcular promedios por región
    for (const clave of Object.keys(desglosePorRegion)) {
      const dr = desglosePorRegion[clave]
      dr.avgCpl = dr.dias > 0 ? Math.round((dr.avgCpl / dr.dias) * 100) / 100 : 0
      dr.totalSpend = Math.round(dr.totalSpend * 100) / 100
      dr.totalRevenue = Math.round(dr.totalRevenue * 100) / 100
    }

    return NextResponse.json({
      exito: true,
      datos: metricas,
      resumen,
      desglosePorRegion,
      filtros: {
        regionId: regionId || null,
        from: desde || null,
        to: hasta || null,
      },
    })
  } catch (error) {
    console.error('Error al obtener métricas:', error)
    // Graceful fallback: return empty metrics instead of 500
    return NextResponse.json(emptyMetricsResponse)
  }
}
