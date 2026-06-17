import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const regionId = searchParams.get('regionId')

    const whereClause = regionId ? { regionId } : {}

    const [totalSpendResult, leadCountResult, paidLeadsResult, paymentStatsResult, avgMatchScoreResult] = await Promise.all([
      db.metric.aggregate({ _sum: { totalSpend: true }, where: whereClause }),
      db.lead.count({ where: { ...whereClause } }),
      db.lead.count({ where: { status: 'PAID', ...whereClause } }),
      db.payment.aggregate({ _sum: { amountUsd: true }, _count: true, where: { status: 'COMPLETED' } }),
      db.campaign.aggregate({ _avg: { matchScore: true } }),
    ])

    const totalSpend = totalSpendResult._sum.totalSpend || 0
    const totalLeads = leadCountResult
    const paidConsultations = paidLeadsResult
    const totalRevenue = paymentStatsResult._sum.amountUsd || 0
    const completedPayments = paymentStatsResult._count
    const matchScore = avgMatchScoreResult._avg.matchScore || 0
    const avgCpql = totalLeads > 0 ? totalSpend / totalLeads : 0
    const conversionRate = totalLeads > 0 ? (paidConsultations / totalLeads) * 100 : 0

    return NextResponse.json({
      totalSpend,
      totalLeads,
      avgCpql: Math.round(avgCpql * 100) / 100,
      paidConsultations,
      matchScore: Math.round(matchScore * 10) / 10,
      totalRevenue,
      completedPayments,
      conversionRate: Math.round(conversionRate * 100) / 100,
    })
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return NextResponse.json({ message: 'Error al obtener métricas del dashboard' }, { status: 500 })
  }
}
