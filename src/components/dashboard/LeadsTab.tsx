'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchLeads, fetchRegions, updateLead } from '@/lib/api'
import { StatusBadge } from './StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { CollapsibleSection } from './CollapsibleSection'
import { toast } from 'sonner'
import {
  Users,
  Search,
  Filter,
  Eye,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  UsersRound,
  Gavel,
  Wallet,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { format } from 'date-fns'
import { useMediaQuery } from '@/hooks/use-media-query'
import type { Lead } from '@/lib/api'

const ROUTE_LABELS: Record<string, string> = {
  IN_COUNTRY_US: '📍 In-Market',
  OUT_COUNTRY_GLOBAL: '🌐 Out-of-Market',
}

const CATEGORY_LABELS: Record<string, string> = {
  FAMILY: 'Familia',
  WORK: 'Trabajo',
  INVESTMENT: 'Inversión',
  OTHER: 'Otro',
}

const CAPACITY_LABELS: Record<string, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
}

export function LeadsTab() {
  const queryClient = useQueryClient()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [routeFilter, setRouteFilter] = useState<string>('ALL')
  const [regionFilter, setRegionFilter] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const { data: regions } = useQuery({
    queryKey: ['regions'],
    queryFn: fetchRegions,
  })

  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads', statusFilter, routeFilter, regionFilter, searchTerm],
    queryFn: () => fetchLeads({
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      route: routeFilter !== 'ALL' ? routeFilter : undefined,
      regionId: regionFilter !== 'ALL' ? regionFilter : undefined,
      search: searchTerm || undefined,
    }),
  })

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success('Lead actualizado')
    },
    onError: () => {
      toast.error('Error al actualizar lead')
    },
  })

  const handleStatusChange = (leadId: string, newStatus: string) => {
    updateLeadMutation.mutate({ id: leadId, data: { status: newStatus } })
  }

  // Mobile Lead Card
  const MobileLeadCard = ({ lead }: { lead: Lead }) => (
    <div className="p-3 rounded-lg border space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{lead.firstName} {lead.lastName}</span>
        <StatusBadge status={lead.status} />
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{lead.country}</span>
        <span>·</span>
        <span className={lead.route === 'IN_COUNTRY_US' ? 'text-teal-600' : 'text-amber-600'}>
          {lead.route === 'IN_COUNTRY_US' ? '📍 In' : '🌐 Out'}
        </span>
        <span>·</span>
        <span>Score: <span className={`font-semibold ${
          lead.qualificationScore >= 70 ? 'text-emerald-600' :
          lead.qualificationScore >= 40 ? 'text-amber-600' : 'text-red-600'
        }`}>{lead.qualificationScore}</span></span>
      </div>
      <div className="flex items-center gap-2">
        {lead.visaType && <Badge variant="outline" className="text-[10px]">{CATEGORY_LABELS[lead.visaType] || lead.visaType}</Badge>}
        <span className="text-[10px] text-muted-foreground ml-auto">{format(new Date(lead.createdAt), 'dd/MM/yy HH:mm')}</span>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="w-full h-7 text-xs mt-1"
        onClick={() => setSelectedLead(lead)}
      >
        <Eye className="h-3 w-3 mr-1" /> Ver Detalle
      </Button>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Filter Bar - Collapsible on mobile */}
      {isMobile ? (
        <CollapsibleSection
          value="lead-filters"
          title="Filtros de Búsqueda"
          icon={<Filter className="h-4 w-4 text-primary" />}
          defaultOpen={false}
        >
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o país..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los estados</SelectItem>
                <SelectItem value="NEW">Nuevo</SelectItem>
                <SelectItem value="QUALIFIED">Calificado</SelectItem>
                <SelectItem value="DISQUALIFIED">Descalificado</SelectItem>
                <SelectItem value="CONTACTED">Contactado</SelectItem>
                <SelectItem value="PAID">Pagado</SelectItem>
                <SelectItem value="LOST">Perdido</SelectItem>
              </SelectContent>
            </Select>
            <Select value={routeFilter} onValueChange={setRouteFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los stages</SelectItem>
                <SelectItem value="IN_COUNTRY_US">📍 In-Market</SelectItem>
                <SelectItem value="OUT_COUNTRY_GLOBAL">🌐 Out-of-Market</SelectItem>
              </SelectContent>
            </Select>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Región" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas</SelectItem>
                {regions?.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CollapsibleSection>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o país..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los estados</SelectItem>
                  <SelectItem value="NEW">Nuevo</SelectItem>
                  <SelectItem value="QUALIFIED">Calificado</SelectItem>
                  <SelectItem value="DISQUALIFIED">Descalificado</SelectItem>
                  <SelectItem value="CONTACTED">Contactado</SelectItem>
                  <SelectItem value="PAID">Pagado</SelectItem>
                  <SelectItem value="LOST">Perdido</SelectItem>
                </SelectContent>
              </Select>
              <Select value={routeFilter} onValueChange={setRouteFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los stages</SelectItem>
                  <SelectItem value="IN_COUNTRY_US">📍 In-Market</SelectItem>
                  <SelectItem value="OUT_COUNTRY_GLOBAL">🌐 Out-of-Market</SelectItem>
                </SelectContent>
              </Select>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Región" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  {regions?.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leads Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <Users className="h-4 w-4 inline mr-1" />
          {leads?.length || 0} leads encontrados
        </p>
      </div>

      {/* Leads Content */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse flex gap-4">
                  <div className="h-4 bg-muted rounded w-1/5" />
                  <div className="h-4 bg-muted rounded w-1/6" />
                  <div className="h-4 bg-muted rounded w-1/6" />
                  <div className="h-4 bg-muted rounded w-1/6" />
                  <div className="h-4 bg-muted rounded w-1/8" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : leads && leads.length > 0 ? (
        isMobile ? (
          /* Mobile: Stacked Cards */
          <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
            <AnimatePresence>
              {leads.map((lead) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <MobileLeadCard lead={lead} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          /* Desktop: Table */
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background z-10">
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs">Nombre</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs">Email</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs">País</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs">Stage</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs">Category</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs">Score</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs">Estado</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs">Fecha</th>
                      <th className="text-right py-2.5 px-3 font-medium text-muted-foreground text-xs">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {leads.map((lead) => (
                        <motion.tr
                          key={lead.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-medium text-xs">
                            {lead.firstName} {lead.lastName}
                          </td>
                          <td className="py-2.5 px-3 text-xs text-muted-foreground max-w-[150px] truncate">
                            {lead.email || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-xs">{lead.country}</td>
                          <td className="py-2.5 px-3 text-xs">
                            <span className={lead.route === 'IN_COUNTRY_US' ? 'text-teal-600 dark:text-teal-400' : 'text-amber-600 dark:text-amber-400'}>
                              {ROUTE_LABELS[lead.route] || lead.route}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-xs">
                            {CATEGORY_LABELS[lead.visaType || ''] || lead.visaType || '—'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`text-xs font-semibold ${
                              lead.qualificationScore >= 70 ? 'text-emerald-600' :
                              lead.qualificationScore >= 40 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {lead.qualificationScore}
                            </span>
                          </td>
                          <td className="py-2.5 px-3"><StatusBadge status={lead.status} /></td>
                          <td className="py-2.5 px-3 text-xs text-muted-foreground">
                            {format(new Date(lead.createdAt), 'dd/MM/yy HH:mm')}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              onClick={() => setSelectedLead(lead)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Sin leads encontrados</p>
            <p className="text-xs text-muted-foreground mt-1">Poblar datos de demostración para ver leads</p>
          </CardContent>
        </Card>
      )}

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedLead && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  {selectedLead.firstName} {selectedLead.lastName}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Status & Score */}
                <div className="flex items-center justify-between">
                  <StatusBadge status={selectedLead.status} />
                  <Badge variant="outline" className="text-xs">
                    Score: {selectedLead.qualificationScore}/100
                  </Badge>
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Contacto</h4>
                  {selectedLead.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      {selectedLead.email}
                    </div>
                  )}
                  {selectedLead.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {selectedLead.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {selectedLead.country} — {ROUTE_LABELS[selectedLead.route] || selectedLead.route}
                  </div>
                </div>

                <Separator />

                {/* Qualification Details */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Pre-Calificación</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Gavel className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Antecedentes:</span>
                      <span className={selectedLead.hasCriminalRecord ? 'text-red-600 font-medium' : 'text-emerald-600'}>
                        {selectedLead.hasCriminalRecord ? 'Sí' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Universidad:</span>
                      <span className={selectedLead.hasUniversityDegree ? 'text-emerald-600' : 'text-red-600'}>
                        {selectedLead.hasUniversityDegree ? 'Sí' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UsersRound className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Familia EE.UU.:</span>
                      <span className={selectedLead.hasUsFamily ? 'text-emerald-600' : 'text-muted-foreground'}>
                        {selectedLead.hasUsFamily ? 'Sí' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Capacidad:</span>
                      <span>{CAPACITY_LABELS[selectedLead.investmentCapacity || ''] || '—'}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Category & Source */}
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-muted-foreground">Category: </span>
                    <span className="font-medium">{CATEGORY_LABELS[selectedLead.visaType || ''] || selectedLead.visaType || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fuente: </span>
                    <Badge variant="outline" className="text-[10px]">{selectedLead.source}</Badge>
                  </div>
                </div>

                {/* Status Change */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Cambiar Estado</h4>
                  <div className="flex flex-wrap gap-2">
                    {['NEW', 'QUALIFIED', 'CONTACTED', 'PAID', 'DISQUALIFIED', 'LOST'].map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={selectedLead.status === s ? 'default' : 'outline'}
                        className="text-xs h-7"
                        onClick={() => handleStatusChange(selectedLead.id, s)}
                        disabled={updateLeadMutation.isPending}
                      >
                        {s === 'NEW' ? 'Nuevo' : s === 'QUALIFIED' ? 'Calificado' : s === 'CONTACTED' ? 'Contactado' : s === 'PAID' ? 'Pagado' : s === 'DISQUALIFIED' ? 'Descalificado' : 'Perdido'}
                      </Button>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Creado: {format(new Date(selectedLead.createdAt), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
