'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCampaigns, fetchRegions, updateAdSet, executeAutomation } from '@/lib/api'
import { StatusBadge } from './StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Megaphone,
  TrendingUp,
  Copy,
  OctagonX,
  Zap,
  DollarSign,
  Target,
  Users,
  Loader2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export function CampaignsTab() {
  const queryClient = useQueryClient()
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null)

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: fetchCampaigns,
  })

  const { data: regions } = useQuery({
    queryKey: ['regions'],
    queryFn: fetchRegions,
  })

  const automationMutation = useMutation({
    mutationFn: executeAutomation,
    onSuccess: (data) => {
      toast.success('Automatización ejecutada exitosamente')
      if (data.resultados) {
        for (const resultado of data.resultados) {
          for (const detalle of resultado.detalles) {
            toast.info(detalle)
          }
        }
      }
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
    onError: () => {
      toast.error('Error al ejecutar la automatización')
    },
  })

  const updateAdSetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateAdSet(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
    onError: () => {
      toast.error('Error al actualizar adset')
    },
  })

  const handleScaleVertical = (adSetId: string, currentBudget: number) => {
    const newBudget = Math.round(currentBudget * 1.15 * 100) / 100
    updateAdSetMutation.mutate(
      { id: adSetId, data: { budget: newBudget, scaleDirection: 'V', lastBudgetInc: new Date().toISOString() } },
      {
        onSuccess: () => {
          toast.success(`Escalado vertical: Presupuesto → $${newBudget.toFixed(2)}`)
        },
      }
    )
  }

  const handleKillSwitch = (adSetId: string) => {
    updateAdSetMutation.mutate(
      { id: adSetId, data: { status: 'KILLED', killSwitchTriggered: true } },
      {
        onSuccess: () => {
          toast.error('Kill Switch activado - AdSet eliminado')
        },
      }
    )
  }

  const handleScaleHorizontal = (adSetId: string) => {
    updateAdSetMutation.mutate(
      { id: adSetId, data: { scaleDirection: 'H' } },
      {
        onSuccess: () => {
          toast.success('Escalado horizontal marcado - Se duplicará la configuración')
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-5 bg-muted rounded w-1/3" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const activeCampaigns = campaigns?.filter((c) => c.status === 'ACTIVE') || []
  const pausedCampaigns = campaigns?.filter((c) => c.status !== 'ACTIVE') || []

  return (
    <div className="space-y-6">
      {/* Header with automation button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Campañas Activas</h2>
          <p className="text-sm text-muted-foreground">{activeCampaigns.length} campañas en ejecución</p>
        </div>
        <Button
          onClick={() => automationMutation.mutate()}
          disabled={automationMutation.isPending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          {automationMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          Ejecutar Automatización
        </Button>
      </div>

      {/* Campaign Cards */}
      <div className="space-y-4">
        <AnimatePresence>
          {(campaigns || []).map((campaign) => {
            const isExpanded = expandedCampaign === campaign.id
            const adSets = campaign.adSets || []
            const totalLeads = adSets.reduce((sum, as) => sum + as.leadCount, 0)
            const totalBudgetUsed = campaign.totalBudget > 0
              ? Math.round((campaign.totalSpend / campaign.totalBudget) * 100)
              : 0

            return (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="overflow-hidden">
                  <CardHeader
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedCampaign(isExpanded ? null : campaign.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Megaphone className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-semibold">{campaign.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <StatusBadge status={campaign.status} />
                            {campaign.autoScale && (
                              <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400">
                                Auto-Escala
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400">
                              Match: {campaign.matchScore}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">${campaign.totalSpend.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">de ${campaign.totalBudget.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Progress value={totalBudgetUsed} className="h-1.5" />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">{totalBudgetUsed}% utilizado</span>
                        <span className="text-xs text-muted-foreground">{totalLeads} leads</span>
                      </div>
                    </div>
                  </CardHeader>

                  <AnimatePresence>
                    {isExpanded && adSets.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Separator />
                        <CardContent className="p-0">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-muted/50">
                                  <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">AdSet</th>
                                  <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">Región</th>
                                  <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">Presupuesto</th>
                                  <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">CPL</th>
                                  <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">Leads</th>
                                  <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">Estado</th>
                                  <th className="text-right py-2 px-3 font-medium text-muted-foreground text-xs">Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {adSets.map((adSet) => (
                                  <tr key={adSet.id} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                                    <td className="py-2.5 px-3">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-xs">{adSet.name.split(' - ').pop()}</span>
                                        {adSet.scaleDirection && (
                                          <Badge variant="outline" className="text-[9px] px-1 py-0">
                                            {adSet.scaleDirection === 'V' ? '↕ Vertical' : '↔ Horizontal'}
                                          </Badge>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-3 text-xs text-muted-foreground">
                                      {adSet.region?.code || '—'}
                                    </td>
                                    <td className="py-2.5 px-3 text-xs">
                                      <span className="font-medium">${adSet.budget.toFixed(2)}</span>
                                      <span className="text-muted-foreground ml-1">{adSet.budgetCurrency}</span>
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span className={adSet.cpl > (adSet.region?.cplTarget || 999) ? 'text-red-600 font-semibold' : 'text-emerald-600'}>
                                        ${adSet.cpl.toFixed(2)}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-xs">{adSet.leadCount}</td>
                                    <td className="py-2.5 px-3">
                                      <div className="flex items-center gap-1">
                                        <StatusBadge status={adSet.status} />
                                        {adSet.killSwitchTriggered && (
                                          <span className="text-red-500 text-xs">🛑</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <div className="flex items-center justify-end gap-1">
                                        {adSet.status === 'ACTIVE' && (
                                          <>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                                              onClick={() => handleScaleVertical(adSet.id, adSet.budget)}
                                              disabled={updateAdSetMutation.isPending}
                                              title="Escalar Vertical +15%"
                                            >
                                              <TrendingUp className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-7 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
                                              onClick={() => handleScaleHorizontal(adSet.id)}
                                              disabled={updateAdSetMutation.isPending}
                                              title="Escalar Horizontal (Duplicar)"
                                            >
                                              <Copy className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                              onClick={() => handleKillSwitch(adSet.id)}
                                              disabled={updateAdSetMutation.isPending}
                                              title="Kill Switch"
                                            >
                                              <OctagonX className="h-3.5 w-3.5" />
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Paused campaigns summary */}
      {pausedCampaigns.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Campañas Pausadas/Finalizadas ({pausedCampaigns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {pausedCampaigns.map((c) => (
                <Badge key={c.id} variant="outline" className="text-xs">
                  {c.name} — <StatusBadge status={c.status} />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
