'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchRegions, fetchCAPIEvents, createRegion, updateRegion, deleteRegion } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { StatusBadge } from './StatusBadge'
import { toast } from 'sonner'
import {
  Settings,
  Globe,
  Activity,
  Server,
  Database,
  Wifi,
  Shield,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Zap,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { format } from 'date-fns'

interface RegionFormData {
  code: string
  name: string
  currency: string
  cplTarget: number
  cplKillSwitch: number
  language: string
  isActive: boolean
}

const defaultFormData: RegionFormData = {
  code: '',
  name: '',
  currency: 'USD',
  cplTarget: 25.0,
  cplKillSwitch: 37.5,
  language: 'es',
  isActive: true,
}

export function SettingsTab() {
  const queryClient = useQueryClient()
  const [isRegionDialogOpen, setIsRegionDialogOpen] = useState(false)
  const [editingRegion, setEditingRegion] = useState<string | null>(null)
  const [formData, setFormData] = useState<RegionFormData>(defaultFormData)

  const { data: regions, isLoading: regionsLoading } = useQuery({
    queryKey: ['regions'],
    queryFn: fetchRegions,
  })

  const { data: capiEvents, isLoading: capiLoading } = useQuery({
    queryKey: ['capi-events'],
    queryFn: fetchCAPIEvents,
  })

  const createRegionMutation = useMutation({
    mutationFn: createRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] })
      toast.success('Región creada exitosamente')
      setIsRegionDialogOpen(false)
      setFormData(defaultFormData)
    },
    onError: () => toast.error('Error al crear región'),
  })

  const updateRegionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RegionFormData> }) => updateRegion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] })
      toast.success('Región actualizada')
      setEditingRegion(null)
      setIsRegionDialogOpen(false)
    },
    onError: () => toast.error('Error al actualizar región'),
  })

  const deleteRegionMutation = useMutation({
    mutationFn: deleteRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] })
      toast.success('Región eliminada')
    },
    onError: () => toast.error('Error al eliminar región'),
  })

  const handleOpenCreate = () => {
    setFormData(defaultFormData)
    setEditingRegion(null)
    setIsRegionDialogOpen(true)
  }

  const handleOpenEdit = (region: RegionFormData & { id: string }) => {
    setFormData({
      code: region.code,
      name: region.name,
      currency: region.currency,
      cplTarget: region.cplTarget,
      cplKillSwitch: region.cplKillSwitch,
      language: region.language,
      isActive: region.isActive,
    })
    setEditingRegion(region.id)
    setIsRegionDialogOpen(true)
  }

  const handleSubmit = () => {
    if (editingRegion) {
      updateRegionMutation.mutate({ id: editingRegion, data: formData })
    } else {
      createRegionMutation.mutate(formData)
    }
  }

  // System health indicators
  const healthItems = [
    { label: 'Base de Datos', icon: Database, status: 'healthy', detail: 'SQLite - Conectado' },
    { label: 'API Meta Ads', icon: Wifi, status: 'healthy', detail: 'Conexión activa' },
    { label: 'CAPI Events', icon: Shield, status: 'warning', detail: `${capiEvents?.filter(e => !e.sentToMeta).length || 0} eventos pendientes` },
    { label: 'Automatización', icon: Zap, status: 'healthy', detail: 'Motor activo' },
  ]

  return (
    <div className="space-y-6">
      {/* System Health */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Estado del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {healthItems.map((item) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border"
                >
                  <div className={`p-2 rounded-lg ${
                    item.status === 'healthy' ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-amber-50 dark:bg-amber-950/20'
                  }`}>
                    <Icon className={`h-4 w-4 ${
                      item.status === 'healthy' ? 'text-emerald-600' : 'text-amber-600'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.status === 'healthy' ? (
                        <CheckCircle className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-amber-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Region Management */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Gestión de Regiones
            </CardTitle>
            <Dialog open={isRegionDialogOpen} onOpenChange={setIsRegionDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={handleOpenCreate} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Nueva Región
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingRegion ? 'Editar Región' : 'Nueva Región'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Código</Label>
                      <Input
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="US"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Nombre</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Estados Unidos"
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Moneda</Label>
                      <Input
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                        placeholder="USD"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Idioma</Label>
                      <Input
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value.toLowerCase() })}
                        placeholder="es"
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">CPL Objetivo</Label>
                      <Input
                        type="number"
                        value={formData.cplTarget}
                        onChange={(e) => setFormData({ ...formData, cplTarget: parseFloat(e.target.value) || 0 })}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Kill Switch (CPL)</Label>
                      <Input
                        type="number"
                        value={formData.cplKillSwitch}
                        onChange={(e) => setFormData({ ...formData, cplKillSwitch: parseFloat(e.target.value) || 0 })}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label className="text-sm">Región activa</Label>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={createRegionMutation.isPending || updateRegionMutation.isPending}
                    className="w-full"
                  >
                    {(createRegionMutation.isPending || updateRegionMutation.isPending) ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {editingRegion ? 'Actualizar Región' : 'Crear Región'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {regionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-16 bg-muted rounded-lg" />
              ))}
            </div>
          ) : regions && regions.length > 0 ? (
            <div className="space-y-2">
              {regions.map((region) => (
                <motion.div
                  key={region.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{region.code}</span>
                        <span className="text-sm text-muted-foreground">— {region.name}</span>
                        <Badge variant="outline" className="text-[10px]">{region.currency}</Badge>
                        {!region.isActive && (
                          <Badge variant="outline" className="text-[10px] text-red-500 border-red-300">Inactiva</Badge>
                        )}
                      </div>
                      <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                        <span>CPL: <span className="text-emerald-600 font-medium">${region.cplTarget}</span></span>
                        <span>Kill: <span className="text-red-600 font-medium">${region.cplKillSwitch}</span></span>
                        <span>Idioma: {region.language.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleOpenEdit(region as (RegionFormData & { id: string }))}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => deleteRegionMutation.mutate(region.id)}
                      disabled={deleteRegionMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Sin regiones configuradas
            </div>
          )}
        </CardContent>
      </Card>

      {/* Automation Rules */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Reglas de Automatización
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Kill Switch Automático', desc: 'Desactivar adsets cuando CPL supere el umbral 1.5x', enabled: true },
              { name: 'Escalado Vertical', desc: 'Incrementar presupuesto +15% para adsets con CPL < 80% del objetivo', enabled: true },
              { name: 'Pausa por Bajo Rendimiento', desc: 'Pausar adsets con CPL > 130% del objetivo', enabled: true },
              { name: 'Notificaciones Email', desc: 'Enviar alertas por email cuando se active un kill switch', enabled: false },
              { name: 'Escalado Horizontal', desc: 'Duplicar configuración de adsets exitosos a nuevas audiencias', enabled: false },
            ].map((rule) => (
              <div key={rule.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium">{rule.name}</p>
                  <p className="text-xs text-muted-foreground">{rule.desc}</p>
                </div>
                <Switch defaultChecked={rule.enabled} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CAPI Event Log */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Registro de Eventos CAPI
          </CardTitle>
        </CardHeader>
        <CardContent>
          {capiLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-10 bg-muted rounded" />
              ))}
            </div>
          ) : capiEvents && capiEvents.length > 0 ? (
            <div className="overflow-x-auto max-h-[300px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground text-xs">Evento</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground text-xs">País</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground text-xs">Enviado a Meta</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground text-xs">Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {capiEvents.map((event) => (
                    <tr key={event.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 px-2 text-xs font-medium">
                        <Badge variant="outline" className="text-[10px]">{event.eventName}</Badge>
                      </td>
                      <td className="py-2 px-2 text-xs">{event.country || '—'}</td>
                      <td className="py-2 px-2 text-xs">
                        {event.sentToMeta ? (
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-amber-500" />
                        )}
                      </td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">
                        {format(new Date(event.eventTime), 'dd/MM/yy HH:mm:ss')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Sin eventos CAPI registrados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
