'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchDashboardMetrics, fetchMetrics, fetchLeads, fetchCampaigns, fetchRegions } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { KpiCard } from './KpiCard'
import { StatusBadge } from './StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import {
  DollarSign,
  Users,
  Target,
  CheckCircle,
  BarChart3,
  TrendingUp,
} from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { format } from 'date-fns'
import { useIsMobile } from '@/hooks/use-mobile'

const lineChartConfig: ChartConfig = {
  gasto: { label: 'Gasto ($)', color: 'oklch(0.596 0.145 163.225)' },
  leads: { label: 'Leads', color: 'oklch(0.769 0.188 70.08)' },
}

const barChartConfig: ChartConfig = {
  cpql: { label: 'CPQL ($)', color: 'oklch(0.596 0.145 163.225)' },
}

export function OverviewTab() {
  const { selectedRegion } = useAppStore()
  const isMobile = useIsMobile()

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['dashboard-metrics', selectedRegion],
    queryFn: () => fetchDashboardMetrics(selectedRegion),
  })

  const { data: dailyMetrics } = useQuery({
    queryKey: ['metrics', selectedRegion],
    queryFn: () => fetchMetrics(selectedRegion),
  })

  const { data: leads } = useQuery({
    queryKey: ['leads-recent'],
    queryFn: () => fetchLeads(),
  })

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: fetchCampaigns,
  })

  const { data: regions } = useQuery({
    queryKey: ['regions'],
    queryFn: fetchRegions,
  })

  // Process daily metrics for chart
  const chartData = (() => {
    if (!dailyMetrics || dailyMetrics.length === 0) return []
    const grouped: Record<string, { date: string; gasto: number; leads: number }> = {}
    for (const m of dailyMetrics) {
      const dateKey = format(new Date(m.date), 'dd/MM')
      if (!grouped[dateKey]) {
        grouped[dateKey] = { date: dateKey, gasto: 0, leads: 0 }
      }
      grouped[dateKey].gasto += m.totalSpend
      grouped[dateKey].leads += m.leadCount
    }
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date))
  })()

  // Process CPQL by region
  const cpqlByRegion = (() => {
    if (!dailyMetrics || !regions) return []
    const grouped: Record<string, { region: string; cpql: number; count: number }> = {}
    for (const m of dailyMetrics) {
      const region = regions.find((r) => r.id === m.regionId)
      const name = region?.code || 'Otro'
      if (!grouped[name]) {
        grouped[name] = { region: name, cpql: 0, count: 0 }
      }
      grouped[name].cpql += m.cpql
      grouped[name].count += 1
    }
    return Object.values(grouped).map((g) => ({
      region: g.region,
      cpql: Math.round((g.cpql / g.count) * 100) / 100,
    }))
  })()

  // Active alerts
  const alerts: { type: 'danger' | 'warning'; message: string }[] = []
  if (campaigns) {
    for (const campaign of campaigns) {
      if (campaign.adSets) {
        for (const adSet of campaign.adSets) {
          if (adSet.killSwitchTriggered) {
            alerts.push({
              type: 'danger',
              message: `🛑 Kill Switch: "${adSet.name}" fue eliminado automáticamente`,
            })
          } else if (adSet.cpl > 0 && adSet.region && adSet.cpl > adSet.region.cplTarget * 1.2) {
            alerts.push({
              type: 'warning',
              message: `⚠️ CPL alto: "${adSet.name}" - $${adSet.cpl.toFixed(2)} (objetivo: $${adSet.region.cplTarget.toFixed(2)})`,
            })
          }
        }
      }
    }
  }

  const recentLeads = (leads || []).slice(0, 5)

  // Accordion defaults: on mobile everything collapsed, on desktop everything open
  const accordionDefaultValue = isMobile ? [] : ['charts', 'leads', 'alerts']

  return (
    <div className="space-y-4">
      {/* KPI Cards - 2 columns on mobile, 5 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
        <KpiCard
          title="Gasto Total"
          value={`$${(metrics?.totalSpend || 0).toLocaleString('es', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          loading={metricsLoading}
          trend={{ value: 8.5, positive: false }}
        />
        <KpiCard
          title="Leads Totales"
          value={metrics?.totalLeads || 0}
          icon={Users}
          loading={metricsLoading}
          trend={{ value: 12.3, positive: true }}
        />
        <KpiCard
          title="CPQL Promedio"
          value={`$${metrics?.avgCpql.toFixed(2) || '0.00'}`}
          icon={Target}
          loading={metricsLoading}
          trend={{ value: 3.2, positive: false }}
        />
        <KpiCard
          title="Consultas Pagadas"
          value={metrics?.paidConsultations || 0}
          icon={CheckCircle}
          loading={metricsLoading}
          trend={{ value: 15.7, positive: true }}
        />
        <KpiCard
          title="Match Score"
          value={metrics?.matchScore || 0}
          subtitle="de 100"
          icon={BarChart3}
          loading={metricsLoading}
          trend={{ value: 2.1, positive: true }}
        />
      </div>

      {/* Collapsible sections */}
      <Accordion
        type="multiple"
        defaultValue={accordionDefaultValue}
        className="space-y-2"
      >
        {/* Charts Section */}
        <AccordionItem value="charts" className="border rounded-lg px-2 sm:px-4">
          <AccordionTrigger className="text-sm font-semibold py-3 hover:no-underline">
            <span className="flex items-center gap-2">
              📊 Gasto y Leads
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-2">
              {/* Line Chart - Gasto y Leads */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Gasto y Leads - Últimos 7 días
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ChartContainer config={lineChartConfig} className={cn('w-full', isMobile ? 'h-[200px]' : 'h-[280px]')}>
                      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                        <YAxis yAxisId="left" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="gasto"
                          stroke="var(--color-gasto)"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="leads"
                          stroke="var(--color-leads)"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    <div className={cn('flex items-center justify-center text-muted-foreground text-sm', isMobile ? 'h-[200px]' : 'h-[280px]')}>
                      Sin datos disponibles. Poblar datos de demostración para ver el gráfico.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bar Chart - CPQL por Región */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    CPQL por Región
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cpqlByRegion.length > 0 ? (
                    <ChartContainer config={barChartConfig} className={cn('w-full', isMobile ? 'h-[200px]' : 'h-[280px]')}>
                      <BarChart data={cpqlByRegion} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                        <XAxis dataKey="region" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                        <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="cpql" fill="var(--color-cpql)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className={cn('flex items-center justify-center text-muted-foreground text-sm', isMobile ? 'h-[200px]' : 'h-[280px]')}>
                      Sin datos disponibles
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Recent Leads Section */}
        <AccordionItem value="leads" className="border rounded-lg px-2 sm:px-4">
          <AccordionTrigger className="text-sm font-semibold py-3 hover:no-underline">
            <span className="flex items-center gap-2">
              👥 Leads Recientes
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {recentLeads.length > 0 ? (
              <>
                {/* Mobile: compact card list */}
                <div className="space-y-2 md:hidden pb-2">
                  {recentLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {lead.firstName} {lead.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {lead.country} · Score: <span className={
                            lead.qualificationScore >= 70 ? 'text-emerald-600 font-semibold' :
                            lead.qualificationScore >= 40 ? 'text-amber-600' : 'text-red-600'
                          }>{lead.qualificationScore}</span>
                        </p>
                      </div>
                      <StatusBadge status={lead.status} />
                    </div>
                  ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden md:block overflow-x-auto pb-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Nombre</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">País</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Stage</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Score</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Estado</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentLeads.map((lead) => (
                        <tr key={lead.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                          <td className="py-2 px-2 font-medium">
                            {lead.firstName} {lead.lastName}
                          </td>
                          <td className="py-2 px-2 text-muted-foreground">{lead.country}</td>
                          <td className="py-2 px-2 text-xs">
                            <span className={lead.route === 'IN_COUNTRY_US' ? 'text-teal-600 dark:text-teal-400' : 'text-amber-600 dark:text-amber-400'}>
                              {lead.route === 'IN_COUNTRY_US' ? '📍 In-Market' : '🌐 Out-of-Market'}
                            </span>
                          </td>
                          <td className="py-2 px-2">
                            <span className={lead.qualificationScore >= 70 ? 'text-emerald-600 font-semibold' : lead.qualificationScore >= 40 ? 'text-amber-600' : 'text-red-600'}>
                              {lead.qualificationScore}
                            </span>
                          </td>
                          <td className="py-2 px-2"><StatusBadge status={lead.status} /></td>
                          <td className="py-2 px-2 text-xs text-muted-foreground">
                            {format(new Date(lead.createdAt), 'dd/MM HH:mm')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm pb-2">
                Sin leads recientes
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Alerts Section */}
        <AccordionItem value="alerts" className="border rounded-lg px-2 sm:px-4">
          <AccordionTrigger className="text-sm font-semibold py-3 hover:no-underline">
            <span className="flex items-center gap-2">
              🔔 Alertas Activas
              {alerts.length > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                  {alerts.length}
                </span>
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {alerts.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pb-2">
                {alerts.slice(0, 10).map((alert, idx) => (
                  <Alert key={idx} variant={alert.type === 'danger' ? 'destructive' : 'default'} className="py-2 px-3">
                    <AlertDescription className="text-xs">{alert.message}</AlertDescription>
                  </Alert>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm pb-2">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                Sin alertas activas
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
