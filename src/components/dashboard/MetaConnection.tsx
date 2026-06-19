'use client'

// ImmiScale Meta Engine v5 — MetaConnection Rediseñado
// Friction-Zero: 1 botón OAuth directo a Facebook Login for Business
// Mobile-First: Tarjeta minimalista con indicador de estado visual
// NO depende de Supabase — Usa /api/meta/auth directamente

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchMetaStatus, disconnectMeta, syncMetaData, testMetaConnection } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Facebook,
  RefreshCw,
  Unplug,
  Loader2,
  CheckCircle2,
  Shield,
  Key,
  Activity,
  Zap,
  AlertTriangle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function MetaConnection() {
  const queryClient = useQueryClient()

  // Query para obtener estado de conexión
  const { data: metaStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['meta-status'],
    queryFn: fetchMetaStatus,
    refetchInterval: 30000,
  })

  // Mutation para desconectar
  const disconnectMutation = useMutation({
    mutationFn: disconnectMeta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-status'] })
      toast.success('Cuenta de Meta desvinculada')
    },
    onError: () => toast.error('Error al desvincular Meta'),
  })

  // Mutation para sincronizar
  const syncMutation = useMutation({
    mutationFn: (tipo: 'campaigns' | 'insights' | 'all') => syncMetaData(tipo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-status'] })
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Sincronización completada')
    },
    onError: () => toast.error('Error al sincronizar'),
  })

  // Mutation para probar conexión
  const testMutation = useMutation({
    mutationFn: testMetaConnection,
    onSuccess: (data) => {
      if (data.exito) {
        toast.success('Conexión con Meta verificada')
      } else {
        toast.error('La verificación de conexión falló')
      }
      queryClient.invalidateQueries({ queryKey: ['meta-status'] })
    },
    onError: () => toast.error('Error al probar la conexión'),
  })

  const isConnected = metaStatus?.connected && !metaStatus?.error?.includes('expirado')
  const isExpired = metaStatus?.error?.includes('expirado') || metaStatus?.error?.includes('Token')

  // Estado visual del indicador
  const statusConfig = statusLoading
    ? { emoji: '🟡', label: 'Verificando...', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800', textColor: 'text-amber-600 dark:text-amber-400' }
    : isConnected
    ? { emoji: '🟢', label: 'Conectado', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800', textColor: 'text-emerald-600 dark:text-emerald-400' }
    : isExpired
    ? { emoji: '🟡', label: 'Token Expirado', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800', textColor: 'text-amber-600 dark:text-amber-400' }
    : { emoji: '🔴', label: 'Desconectado', bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-800', textColor: 'text-red-600 dark:text-red-400' }

  const status = statusConfig

  // =============================================
  // HANDLER: 1-Click OAuth via /api/meta/auth
  // Direct Facebook Login for Business — NO Supabase dependency
  // =============================================
  const handleConnect = async () => {
    // Direct redirect to our OAuth endpoint which will redirect to Facebook
    // with the correct config_id for Facebook Login for Business
    toast.info('Redirigiendo a Facebook Login for Business...')
    window.location.href = '/api/meta/auth'
  }

  // Detect success from OAuth callback redirect
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const metaConnected = urlParams?.get('meta_connected')
  const metaError = urlParams?.get('error')

  // Show toast on OAuth return
  if (metaConnected === 'true') {
    // Clean URL and show success
    setTimeout(() => {
      toast.success('Cuenta de Meta conectada exitosamente')
      queryClient.invalidateQueries({ queryKey: ['meta-status'] })
      window.history.replaceState({}, '', '/')
    }, 100)
  } else if (metaError?.startsWith('meta_')) {
    setTimeout(() => {
      const reason = urlParams?.get('reason') || ''
      if (metaError === 'meta_auth_denied') {
        toast.error('Permiso denegado. Debes autorizar los permisos de Meta para continuar.')
      } else if (metaError === 'meta_auth_config') {
        toast.error('Error de configuración. Verifica META_APP_ID y META_APP_SECRET en Vercel.')
      } else if (metaError === 'meta_token_exchange') {
        toast.error(`Error al obtener token de Meta: ${reason}`)
      } else {
        toast.error(`Error de autenticación con Meta: ${reason || metaError}`)
      }
      window.history.replaceState({}, '', '/')
    }, 100)
  }

  return (
    <div className="space-y-5">
      {/* ============================================= */}
      {/* INDICADOR DE ESTADO VISUAL — Grande y claro */}
      {/* ============================================= */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-2xl border-2 ${status.border} ${status.bg} p-5 sm:p-6`}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
          <Facebook className="w-full h-full" />
        </div>

        <div className="relative space-y-4">
          {/* Status indicator */}
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl">{status.emoji}</span>
            <div>
              <h3 className={`text-lg sm:text-xl font-bold ${status.textColor}`}>
                {status.label}
              </h3>
              {metaStatus?.error && (
                <p className="text-xs text-red-400 mt-0.5">{metaStatus.error}</p>
              )}
            </div>
          </div>

          {/* Connected info — auto-detected IDs */}
          <AnimatePresence mode="wait">
            {isConnected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2"
              >
                {metaStatus?.accountId && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/60 border border-border/50">
                    <Key className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground">Ad Account:</span>
                    <span className="text-xs font-mono font-semibold truncate">{metaStatus.accountId}</span>
                  </div>
                )}
                {metaStatus?.pixelId && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/60 border border-border/50">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground">Pixel ID:</span>
                    <span className="text-xs font-mono font-semibold truncate">{metaStatus.pixelId}</span>
                  </div>
                )}
                {metaStatus?.lastSyncAt && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/60 border border-border/50 sm:col-span-2">
                    <Activity className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground">Última sync:</span>
                    <span className="text-xs font-medium">
                      {format(new Date(metaStatus.lastSyncAt), "dd/MM/yy HH:mm", { locale: es })}
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ============================================= */}
      {/* BOTÓN PRINCIPAL — 1 Clic Facebook Login for Business */}
      {/* ============================================= */}
      <AnimatePresence mode="wait">
        {!isConnected ? (
          <motion.div
            key="connect-button"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-3"
          >
            <Button
              onClick={handleConnect}
              className="w-full py-5 sm:py-6 text-base sm:text-lg font-bold rounded-xl
                         bg-[#1877F2] hover:bg-[#166FE5] text-white
                         shadow-lg shadow-blue-500/25
                         active:scale-[0.98] transition-all duration-150
                         gap-3"
            >
              <Facebook className="h-6 w-6" />
              Vincular Meta Business con 1 Clic
              <Zap className="h-5 w-5 ml-1" />
            </Button>
            <p className="text-xs text-muted-foreground text-center leading-relaxed px-2">
              Autoriza con Facebook Business y configuramos tu Ad Account,
              Pixel y Business Manager automáticamente. Sin copiar ni pegar nada.
            </p>

            {/* Config warning — check if NEXT_PUBLIC_META_CONFIG_ID exists (server vars aren't accessible on client) */}
            {!process.env.NEXT_PUBLIC_META_CONFIG_ID && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700 dark:text-amber-300">
                  <p className="font-semibold">Configuración requerida</p>
                  <p className="mt-0.5">Configura <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">NEXT_PUBLIC_META_CONFIG_ID</code>, <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">META_APP_ID</code> y <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">META_APP_SECRET</code> en Vercel.</p>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="connected-actions"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <Button
              size="lg"
              variant="outline"
              className="flex-1 gap-2 rounded-xl py-3 border-emerald-200 dark:border-emerald-800
                         text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              onClick={() => syncMutation.mutate('all')}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sincronizar Todo
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 rounded-xl py-3"
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
            >
              {testMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Verificar
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="gap-2 rounded-xl py-3 text-red-500 hover:text-red-700
                         hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Unplug className="h-4 w-4" />
              )}
              Desvincular
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permissions info — Business Login scopes */}
      {!isConnected && (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {['ads_management', 'ads_read', 'business_management'].map((scope) => (
            <Badge key={scope} variant="secondary" className="text-[10px] font-mono">
              {scope}
            </Badge>
          ))}
          <Badge variant="outline" className="text-[10px] text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
            Business Login
          </Badge>
        </div>
      )}
    </div>
  )
}
