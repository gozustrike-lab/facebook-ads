'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchPayments, fetchRegions } from '@/lib/api'
import { KpiCard } from './KpiCard'
import { StatusBadge } from './StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'

const GATEWAY_LABELS: Record<string, string> = {
  STRIPE: 'Stripe',
  MERCADO_PAGO: 'Mercado Pago',
  NIUBIZ: 'Niubiz',
  CULQI: 'Culqi',
}

const COLORS = [
  'oklch(0.596 0.145 163.225)',
  'oklch(0.769 0.188 70.08)',
  'oklch(0.6 0.118 184.704)',
  'oklch(0.828 0.189 84.429)',
]

const pieChartConfig: ChartConfig = {
  stripe: { label: 'Stripe', color: COLORS[0] },
  mercadoPago: { label: 'Mercado Pago', color: COLORS[1] },
  niubiz: { label: 'Niubiz', color: COLORS[2] },
  culqi: { label: 'Culqi', color: COLORS[3] },
}

const barChartConfig: ChartConfig = {
  revenue: { label: 'Ingresos (USD)', color: 'oklch(0.596 0.145 163.225)' },
}

export function PaymentsTab() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: fetchPayments,
  })

  // Payment stats
  const stats = (() => {
    if (!payments) return { totalRevenue: 0, completed: 0, conversionRate: 0 }
    const completed = payments.filter((p) => p.status === 'COMPLETED')
    const totalRevenue = completed.reduce((sum, p) => sum + p.amountUsd, 0)
    const conversionRate = payments.length > 0 ? (completed.length / payments.length) * 100 : 0
    return { totalRevenue, completed: completed.length, conversionRate }
  })()

  // Revenue by gateway
  const gatewayData = (() => {
    if (!payments) return []
    const grouped: Record<string, number> = {}
    const completed = payments.filter((p) => p.status === 'COMPLETED')
    for (const p of completed) {
      const key = GATEWAY_LABELS[p.gateway] || p.gateway
      grouped[key] = (grouped[key] || 0) + p.amountUsd
    }
    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
    }))
  })()

  // Revenue by currency
  const currencyData = (() => {
    if (!payments) return []
    const grouped: Record<string, number> = {}
    const completed = payments.filter((p) => p.status === 'COMPLETED')
    for (const p of completed) {
      grouped[p.currency] = (grouped[p.currency] || 0) + p.amountUsd
    }
    return Object.entries(grouped).map(([currency, revenue]) => ({
      currency,
      revenue: Math.round(revenue * 100) / 100,
    }))
  })()

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Ingresos Totales (USD)"
          value={`$${stats.totalRevenue.toLocaleString('es', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          loading={isLoading}
          trend={{ value: 18.5, positive: true }}
        />
        <KpiCard
          title="Pagos Completados"
          value={stats.completed}
          icon={CreditCard}
          loading={isLoading}
          trend={{ value: 12.0, positive: true }}
        />
        <KpiCard
          title="Tasa de Conversión"
          value={`${stats.conversionRate.toFixed(1)}%`}
          icon={TrendingUp}
          loading={isLoading}
          trend={{ value: 5.3, positive: true }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie Chart - Revenue by Gateway */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Ingresos por Gateway</CardTitle>
          </CardHeader>
          <CardContent>
            {gatewayData.length > 0 ? (
              <ChartContainer config={pieChartConfig} className="h-[280px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={gatewayData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={2}
                  >
                    {gatewayData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                Sin datos de pagos
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart - Revenue by Currency */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Ingresos por Moneda (USD equivalente)</CardTitle>
          </CardHeader>
          <CardContent>
            {currencyData.length > 0 ? (
              <ChartContainer config={barChartConfig} className="h-[280px] w-full">
                <BarChart data={currencyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="currency" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                Sin datos de pagos
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            Historial de Pagos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex gap-4">
                  <div className="h-4 bg-muted rounded w-1/5" />
                  <div className="h-4 bg-muted rounded w-1/6" />
                  <div className="h-4 bg-muted rounded w-1/6" />
                </div>
              ))}
            </div>
          ) : payments && payments.length > 0 ? (
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background z-10">
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs">Lead</th>
                    <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs">Monto</th>
                    <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs">Moneda</th>
                    <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs">Monto USD</th>
                    <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs">Gateway</th>
                    <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs">Estado</th>
                    <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 text-xs font-medium">
                        {payment.lead ? `${payment.lead.firstName || ''} ${payment.lead.lastName || ''}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-xs font-medium">
                        {payment.amount.toLocaleString('es', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-xs">
                        <Badge variant="outline" className="text-[10px]">{payment.currency}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-xs font-medium text-emerald-600">
                        ${payment.amountUsd.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-xs">
                        {GATEWAY_LABELS[payment.gateway] || payment.gateway}
                      </td>
                      <td className="py-2.5 px-3"><StatusBadge status={payment.status} /></td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground">
                        {format(new Date(payment.createdAt), 'dd/MM/yy HH:mm')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">Sin pagos registrados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
