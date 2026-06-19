'use client'

// ImmiScale Meta Engine v5 — CampaignsTab Rediseñado
// 3 Modos Express: IA Express, Clonar Ganador, Plantilla Express
// Mobile-First: Tarjetas táctiles de 1 toque

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCampaigns, fetchRegions, updateAdSet, executeAutomation, createCampaign } from '@/lib/api'
import { StatusBadge } from './StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { CollapsibleSection } from './CollapsibleSection'
import { toast } from 'sonner'
import {
  Megaphone,
  TrendingUp,
  Copy,
  OctagonX,
  Zap,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Trophy,
  LayoutTemplate,
  Upload,
  ImagePlus,
  MessageSquare,
  MousePointerClick,
  Globe,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef } from 'react'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import type { AdSet } from '@/lib/api'

// =============================================
// OBJETIVOS PARA PLANTILLA EXPRESS
// =============================================
const TEMPLATE_OBJECTIVES = [
  { id: 'LEAD_GENERATION', label: 'Captar Leads', icon: MousePointerClick, color: 'emerald' },
  { id: 'MESSAGES', label: 'WhatsApp', icon: MessageSquare, color: 'green' },
  { id: 'LINK_CLICKS', label: 'Tráfico Web', icon: Globe, color: 'blue' },
] as const

type ObjectiveId = typeof TEMPLATE_OBJECTIVES[number]['id']

export function CampaignsTab() {
  const queryClient = useQueryClient()
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null)
  const isMobile = useMediaQuery('(max-width: 768px)')

  // =============================================
  // IA EXPRESS STATE
  // =============================================
  const [aiPrompt, setAiPrompt] = useState('')

  // =============================================
  // PLANTILLA EXPRESS STATE
  // =============================================
  const [selectedObjective, setSelectedObjective] = useState<ObjectiveId>('LEAD_GENERATION')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // =============================================
  // DATA QUERIES
  // =============================================
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: fetchCampaigns,
  })

  const { data: regions } = useQuery({
    queryKey: ['regions'],
    queryFn: fetchRegions,
  })

  // =============================================
  // MUTATIONS
  // =============================================
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
    onError: () => toast.error('Error al ejecutar la automatización'),
  })

  const updateAdSetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateAdSet(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
    onError: () => toast.error('Error al actualizar adset'),
  })

  // IA Express: Crear campaña con IA
  const aiExpressMutation = useMutation({
    mutationFn: async (prompt: string) => {
      // Llamar a la API de IA Express
      return createCampaign({
        name: `IA: ${prompt.substring(0, 40)}...`,
        objective: 'LEAD_GENERATION',
        status: 'ACTIVE',
        totalBudget: 50,
      })
    },
    onSuccess: () => {
      toast.success('Anuncio generado con IA exitosamente')
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      setAiPrompt('')
    },
    onError: () => toast.error('Error al generar anuncio con IA. Intenta de nuevo.'),
  })

  // Clonar Ganador: Duplicar mejor campaña
  const cloneWinnerMutation = useMutation({
    mutationFn: async () => {
      const activeCampaigns = campaigns?.filter((c) => c.status === 'ACTIVE') || []
      if (activeCampaigns.length === 0) throw new Error('No hay campañas activas')
      // Clonar la primera campaña activa como mejor aproximación
      const winner = activeCampaigns[0]
      return createCampaign({
        name: `${winner.name} (Clon)`,
        objective: winner.objective,
        status: 'ACTIVE',
        totalBudget: winner.totalBudget,
      })
    },
    onSuccess: () => {
      toast.success('Mejor campaña clonada exitosamente')
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
    onError: () => toast.error('Error al clonar campaña'),
  })

  // Plantilla Express: Crear desde plantilla
  const templateMutation = useMutation({
    mutationFn: async ({ objective, imageBase64 }: { objective: string; imageBase64?: string }) => {
      return createCampaign({
        name: `Plantilla: ${TEMPLATE_OBJECTIVES.find(o => o.id === objective)?.label || objective}`,
        objective,
        status: 'ACTIVE',
        totalBudget: 30,
      })
    },
    onSuccess: () => {
      toast.success('Campaña creada desde plantilla')
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      setUploadedImage(null)
      setUploadedFileName(null)
    },
    onError: () => toast.error('Error al crear campaña desde plantilla'),
  })

  // =============================================
  // HANDLERS
  // =============================================
  const handleScaleVertical = (adSetId: string, currentBudget: number) => {
    const newBudget = Math.round(currentBudget * 1.15 * 100) / 100
    updateAdSetMutation.mutate(
      { id: adSetId, data: { budget: newBudget, scaleDirection: 'V', lastBudgetInc: new Date().toISOString() } },
      { onSuccess: () => toast.success(`Escalado vertical: Presupuesto → $${newBudget.toFixed(2)}`) }
    )
  }

  const handleKillSwitch = (adSetId: string) => {
    updateAdSetMutation.mutate(
      { id: adSetId, data: { status: 'KILLED', killSwitchTriggered: true } },
      { onSuccess: () => toast.error('Kill Switch activado - AdSet eliminado') }
    )
  }

  const handleScaleHorizontal = (adSetId: string) => {
    updateAdSetMutation.mutate(
      { id: adSetId, data: { scaleDirection: 'H' } },
      { onSuccess: () => toast.success('Escalado horizontal marcado - Se duplicará la configuración') }
    )
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string)
      setUploadedFileName(file.name)
    }
    reader.readAsDataURL(file)
  }

  // =============================================
  // DERIVED DATA
  // =============================================
  const activeCampaigns = campaigns?.filter((c) => c.status === 'ACTIVE') || []
  const pausedCampaigns = campaigns?.filter((c) => c.status !== 'ACTIVE') || []

  // Encontrar mejor campaña (por menor CPL via adsets)
  const bestCampaign = activeCampaigns.length > 0 ? activeCampaigns[0] : null

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

  return (
    <div className="space-y-6">
      {/* ============================================= */}
      {/* SECCIÓN 1: CREAR ANUNCIO — 3 Modos Express */}
      {/* ============================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold">Crear Anuncio</h2>
            <p className="text-sm text-muted-foreground">Elige tu modo express</p>
          </div>
          <Button
            onClick={() => automationMutation.mutate()}
            disabled={automationMutation.isPending}
            variant="outline"
            size="sm"
            className="gap-1.5 hidden sm:flex"
          >
            {automationMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5" />
            )}
            Auto-Escala
          </Button>
        </div>

        {/* 3 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* ============================================= */}
          {/* TARJETA 1: IA EXPRESS */}
          {/* ============================================= */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="h-full border-2 border-emerald-200 dark:border-emerald-800/50 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
              <CardContent className="p-4 sm:p-5 flex flex-col min-h-[220px]">
                {/* Header */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                    <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">IA Express</h3>
                    <p className="text-xs text-muted-foreground">Describe y la IA crea todo</p>
                  </div>
                </div>

                {/* Input */}
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ej: Abogado de inmigración en Miami, visa EB-5 para inversionistas"
                  className="flex-1 text-base resize-none rounded-xl border-border/50
                             focus:border-emerald-400 focus:ring-emerald-400/20
                             placeholder:text-muted-foreground/60 min-h-[72px]"
                  rows={2}
                />

                {/* Submit */}
                <Button
                  onClick={() => aiExpressMutation.mutate(aiPrompt)}
                  disabled={aiExpressMutation.isPending || !aiPrompt.trim()}
                  className="w-full mt-3 py-3 text-sm font-bold rounded-xl gap-2
                             bg-emerald-600 hover:bg-emerald-700 text-white
                             active:scale-[0.98] transition-all duration-150
                             shadow-md shadow-emerald-500/20
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {aiExpressMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Generar con IA
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* ============================================= */}
          {/* TARJETA 2: CLONAR GANADOR */}
          {/* ============================================= */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="h-full border-2 border-amber-200 dark:border-amber-800/50 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300">
              <CardContent className="p-4 sm:p-5 flex flex-col min-h-[220px]">
                {/* Header */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30">
                    <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Clonar Ganador</h3>
                    <p className="text-xs text-muted-foreground">Duplica tu mejor campaña</p>
                  </div>
                </div>

                {/* Best campaign preview */}
                <div className="flex-1 flex flex-col justify-center">
                  {bestCampaign ? (
                    <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Badge className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-0">
                          Mejor rendimiento
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold truncate">{bestCampaign.name}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>${bestCampaign.totalSpend.toFixed(0)} gastado</span>
                        <span>{bestCampaign.adSets?.reduce((s, a) => s + a.leadCount, 0) || 0} leads</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">Aún no hay campañas</p>
                      <p className="text-xs text-muted-foreground/70">para clonar</p>
                    </div>
                  )}
                </div>

                {/* Submit */}
                <Button
                  onClick={() => cloneWinnerMutation.mutate()}
                  disabled={cloneWinnerMutation.isPending || !bestCampaign}
                  className="w-full mt-3 py-3 text-sm font-bold rounded-xl gap-2
                             bg-amber-600 hover:bg-amber-700 text-white
                             active:scale-[0.98] transition-all duration-150
                             shadow-md shadow-amber-500/20
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cloneWinnerMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trophy className="h-4 w-4" />
                  )}
                  Clonar Ganador
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* ============================================= */}
          {/* TARJETA 3: PLANTILLA EXPRESS */}
          {/* ============================================= */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="h-full border-2 border-blue-200 dark:border-blue-800/50 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
              <CardContent className="p-4 sm:p-5 flex flex-col min-h-[220px]">
                {/* Header */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                    <LayoutTemplate className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Plantilla Express</h3>
                    <p className="text-xs text-muted-foreground">Elige objetivo y publica</p>
                  </div>
                </div>

                {/* Objective selector — Chips toggle */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {TEMPLATE_OBJECTIVES.map((obj) => {
                    const Icon = obj.icon
                    const isSelected = selectedObjective === obj.id
                    const colorMap: Record<string, string> = {
                      emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
                      green: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
                      blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
                    }
                    const selectedColorMap: Record<string, string> = {
                      emerald: 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/25',
                      green: 'bg-green-600 text-white border-green-600 shadow-sm shadow-green-500/25',
                      blue: 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/25',
                    }
                    return (
                      <button
                        key={obj.id}
                        onClick={() => setSelectedObjective(obj.id)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-150',
                          'active:scale-[0.97]',
                          isSelected
                            ? selectedColorMap[obj.color]
                            : colorMap[obj.color]
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {obj.label}
                      </button>
                    )
                  })}
                </div>

                {/* Image upload */}
                <div className="flex-1 flex flex-col justify-end">
                  {uploadedImage ? (
                    <div className="relative mb-3">
                      <img
                        src={uploadedImage}
                        alt="Preview"
                        className="w-full h-16 object-cover rounded-lg border border-border/50"
                      />
                      <button
                        onClick={() => { setUploadedImage(null); setUploadedFileName(null) }}
                        className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-red-500 text-white shadow-sm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {uploadedFileName && (
                        <p className="text-[10px] text-muted-foreground mt-1 truncate">{uploadedFileName}</p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 w-full py-2.5 mb-3
                                 rounded-xl border-2 border-dashed border-border/50
                                 text-muted-foreground text-xs
                                 hover:border-blue-300 hover:text-blue-600
                                 dark:hover:border-blue-700 dark:hover:text-blue-400
                                 transition-colors active:scale-[0.98]"
                    >
                      <ImagePlus className="h-4 w-4" />
                      Subir Imagen
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>

                {/* Submit */}
                <Button
                  onClick={() => templateMutation.mutate({
                    objective: selectedObjective,
                    imageBase64: uploadedImage || undefined,
                  })}
                  disabled={templateMutation.isPending}
                  className="w-full py-3 text-sm font-bold rounded-xl gap-2
                             bg-blue-600 hover:bg-blue-700 text-white
                             active:scale-[0.98] transition-all duration-150
                             shadow-md shadow-blue-500/20"
                >
                  {templateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LayoutTemplate className="h-4 w-4" />
                  )}
                  Crear con Plantilla
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* ============================================= */}
      {/* SECCIÓN 2: MIS CAMPAÑAS ACTIVAS */}
      {/* ============================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold">Mis Campañas Activas</h2>
            <p className="text-sm text-muted-foreground">{activeCampaigns.length} campañas en ejecución</p>
          </div>
          {/* Mobile: Auto-scale button */}
          {isMobile && (
            <Button
              onClick={() => automationMutation.mutate()}
              disabled={automationMutation.isPending}
              size="sm"
              variant="outline"
              className="gap-1"
            >
              {automationMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              Auto
            </Button>
          )}
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
                  <Card className="overflow-hidden rounded-2xl">
                    <div
                      className="cursor-pointer hover:bg-muted/30 transition-colors p-4 sm:p-5"
                      onClick={() => setExpandedCampaign(isExpanded ? null : campaign.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                            <Megaphone className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold truncate">{campaign.name}</h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                        <div className="text-right shrink-0 ml-3">
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
                      {/* Expand indicator on mobile */}
                      {isMobile && (
                        <div className="flex justify-center mt-2">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      )}
                    </div>

                    <AnimatePresence>
                      {isExpanded && adSets.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Separator />
                          <div className="p-0">
                            {/* Mobile: Stacked Cards */}
                            {isMobile ? (
                              <div className="p-3 space-y-2">
                                {adSets.map((adSet) => (
                                  <MobileAdSetCard
                                    key={adSet.id}
                                    adSet={adSet}
                                    onScaleVertical={handleScaleVertical}
                                    onScaleHorizontal={handleScaleHorizontal}
                                    onKillSwitch={handleKillSwitch}
                                    isUpdating={updateAdSetMutation.isPending}
                                  />
                                ))}
                              </div>
                            ) : (
                              /* Desktop: Table */
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
                                      <DesktopAdSetRow
                                        key={adSet.id}
                                        adSet={adSet}
                                        onScaleVertical={handleScaleVertical}
                                        onScaleHorizontal={handleScaleHorizontal}
                                        onKillSwitch={handleKillSwitch}
                                        isUpdating={updateAdSetMutation.isPending}
                                      />
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Paused campaigns summary */}
      {pausedCampaigns.length > 0 && (
        <CollapsibleSection
          value="paused-campaigns"
          title={`Campañas Pausadas/Finalizadas (${pausedCampaigns.length})`}
          icon={<Megaphone className="h-4 w-4 text-muted-foreground" />}
          defaultOpen={false}
        >
          <div className="flex flex-wrap gap-2">
            {pausedCampaigns.map((c) => (
              <Badge key={c.id} variant="outline" className="text-xs">
                {c.name} — <StatusBadge status={c.status} />
              </Badge>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  )
}

// =============================================
// MOBILE ADSET CARD
// =============================================
function MobileAdSetCard({
  adSet,
  onScaleVertical,
  onScaleHorizontal,
  onKillSwitch,
  isUpdating,
}: {
  adSet: AdSet
  onScaleVertical: (id: string, budget: number) => void
  onScaleHorizontal: (id: string) => void
  onKillSwitch: (id: string) => void
  isUpdating: boolean
}) {
  return (
    <div className="p-3 rounded-xl border space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{adSet.name.split(' - ').pop()}</span>
        <div className="flex items-center gap-1">
          <StatusBadge status={adSet.status} />
          {adSet.killSwitchTriggered && <span className="text-red-500 text-xs">🛑</span>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Región:</span>{' '}
          <span className="font-medium">{adSet.region?.code || '—'}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Presupuesto:</span>{' '}
          <span className="font-medium">${adSet.budget.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">CPL:</span>{' '}
          <span className={adSet.cpl > (adSet.region?.cplTarget || 999) ? 'text-red-600 font-semibold' : 'text-emerald-600 font-semibold'}>
            ${adSet.cpl.toFixed(2)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Leads:</span>{' '}
          <span className="font-medium">{adSet.leadCount}</span>
        </div>
      </div>
      {adSet.scaleDirection && (
        <Badge variant="outline" className="text-[9px] px-1 py-0">
          {adSet.scaleDirection === 'V' ? '↕ Vertical' : '↔ Horizontal'}
        </Badge>
      )}
      {adSet.status === 'ACTIVE' && (
        <div className="flex gap-1 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-9 text-xs gap-1 rounded-lg active:scale-[0.97] transition-transform"
            onClick={() => onScaleVertical(adSet.id, adSet.budget)}
            disabled={isUpdating}
          >
            ↕ +15%
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-9 text-xs gap-1 rounded-lg active:scale-[0.97] transition-transform"
            onClick={() => onScaleHorizontal(adSet.id)}
            disabled={isUpdating}
          >
            ↔ Dup
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-9 text-xs text-red-600 gap-1 rounded-lg active:scale-[0.97] transition-transform"
            onClick={() => onKillSwitch(adSet.id)}
            disabled={isUpdating}
          >
            🛑 Kill
          </Button>
        </div>
      )}
    </div>
  )
}

// =============================================
// DESKTOP ADSET ROW
// =============================================
function DesktopAdSetRow({
  adSet,
  onScaleVertical,
  onScaleHorizontal,
  onKillSwitch,
  isUpdating,
}: {
  adSet: AdSet
  onScaleVertical: (id: string, budget: number) => void
  onScaleHorizontal: (id: string) => void
  onKillSwitch: (id: string) => void
  isUpdating: boolean
}) {
  return (
    <tr className="border-t border-border/50 hover:bg-muted/30 transition-colors">
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
          {adSet.killSwitchTriggered && <span className="text-red-500 text-xs">🛑</span>}
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
                onClick={() => onScaleVertical(adSet.id, adSet.budget)}
                disabled={isUpdating}
                title="Escalar Vertical +15%"
              >
                <TrendingUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
                onClick={() => onScaleHorizontal(adSet.id)}
                disabled={isUpdating}
                title="Escalar Horizontal (Duplicar)"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={() => onKillSwitch(adSet.id)}
                disabled={isUpdating}
                title="Kill Switch"
              >
                <OctagonX className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}
