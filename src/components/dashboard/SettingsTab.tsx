'use client'

// ImmiScale Meta Engine v5 — SettingsTab Rediseñado
// Friction-Zero: Solo 2 secciones limpias
// Eliminado: Health checks, reglas de automatización, registro CAPI

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchRegions, createRegion, updateRegion, deleteRegion } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { MetaConnection } from './MetaConnection'
import { toast } from 'sonner'
import {
  Globe,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Settings,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'

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
  const isMobile = useIsMobile()
  const [isRegionDialogOpen, setIsRegionDialogOpen] = useState(false)
  const [editingRegion, setEditingRegion] = useState<string | null>(null)
  const [formData, setFormData] = useState<RegionFormData>(defaultFormData)

  const { data: regions, isLoading: regionsLoading } = useQuery({
    queryKey: ['regions'],
    queryFn: fetchRegions,
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

  // Region form content (shared between Dialog and Sheet)
  const regionFormContent = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Código</Label>
          <Input
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="US"
            className="text-base" // Prevents iOS zoom
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Nombre</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Estados Unidos"
            className="text-base"
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
            className="text-base"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Idioma</Label>
          <Input
            value={formData.language}
            onChange={(e) => setFormData({ ...formData, language: e.target.value.toLowerCase() })}
            placeholder="es"
            className="text-base"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">CPL Objetivo ($)</Label>
          <Input
            type="number"
            value={formData.cplTarget}
            onChange={(e) => setFormData({ ...formData, cplTarget: parseFloat(e.target.value) || 0 })}
            className="text-base"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Kill Switch ($)</Label>
          <Input
            type="number"
            value={formData.cplKillSwitch}
            onChange={(e) => setFormData({ ...formData, cplKillSwitch: parseFloat(e.target.value) || 0 })}
            className="text-base"
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
        className="w-full py-3 rounded-xl text-base font-semibold"
      >
        {(createRegionMutation.isPending || updateRegionMutation.isPending) ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : null}
        {editingRegion ? 'Actualizar Región' : 'Crear Región'}
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* ============================================= */}
      {/* SECCIÓN 1: CONEXIÓN META — 1 Clic OAuth */}
      {/* ============================================= */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <h2 className="text-lg sm:text-xl font-bold">Conexión Meta</h2>
        </div>
        <Card className="rounded-2xl overflow-hidden border-2 border-border/50">
          <CardContent className="p-4 sm:p-6">
            <MetaConnection />
          </CardContent>
        </Card>
      </div>

      {/* ============================================= */}
      {/* SECCIÓN 2: REGIONES — Grid compacto */}
      {/* ============================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-bold">Regiones</h2>
          </div>
          {isMobile ? (
            <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 rounded-xl">
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          ) : (
            <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 rounded-xl">
              <Plus className="h-3.5 w-3.5" />
              Nueva Región
            </Button>
          )}
        </div>

        {regionsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-24 bg-muted rounded-xl" />
            ))}
          </div>
        ) : regions && regions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {regions.map((region, index) => (
              <motion.div
                key={region.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative p-4 rounded-xl border border-border/50 hover:border-border transition-all hover:shadow-sm"
              >
                {/* Active toggle — inline */}
                <div className="absolute top-3 right-3">
                  <Switch
                    checked={region.isActive}
                    onCheckedChange={(checked) => {
                      updateRegionMutation.mutate({
                        id: region.id,
                        data: { isActive: checked },
                      })
                    }}
                    className="scale-75"
                  />
                </div>

                <div className="flex items-center gap-2.5 mb-2 pr-10">
                  <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm">{region.code}</h4>
                    <p className="text-xs text-muted-foreground truncate">{region.name}</p>
                  </div>
                </div>

                <div className="flex gap-3 text-xs mb-2">
                  <span className="text-muted-foreground">
                    CPL: <span className="text-emerald-600 font-medium">${region.cplTarget}</span>
                  </span>
                  <Badge variant="outline" className="text-[10px] h-5">{region.currency}</Badge>
                </div>

                {!region.isActive && (
                  <Badge variant="outline" className="text-[10px] text-red-500 border-red-300 dark:border-red-700">
                    Inactiva
                  </Badge>
                )}

                {/* Edit/Delete — subtle on hover or always on mobile */}
                <div className={cn(
                  'flex gap-1 mt-2',
                  isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'
                )}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => handleOpenEdit(region as (RegionFormData & { id: string }))}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => deleteRegionMutation.mutate(region.id)}
                    disabled={deleteRegionMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Globe className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Sin regiones configuradas</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenCreate}
              className="mt-3 gap-1.5 rounded-xl"
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar Primera Región
            </Button>
          </div>
        )}
      </div>

      {/* ============================================= */}
      {/* REGION DIALOG/SHEET */}
      {/* ============================================= */}
      {isMobile ? (
        <Sheet open={isRegionDialogOpen} onOpenChange={setIsRegionDialogOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>{editingRegion ? 'Editar Región' : 'Nueva Región'}</SheetTitle>
            </SheetHeader>
            <div className="py-4">
              {regionFormContent}
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isRegionDialogOpen} onOpenChange={setIsRegionDialogOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>{editingRegion ? 'Editar Región' : 'Nueva Región'}</DialogTitle>
            </DialogHeader>
            {regionFormContent}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Helper for class merging
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
