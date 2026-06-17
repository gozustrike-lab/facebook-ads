'use client'

// Componente de Conexión Meta - ImmiScale Meta Engine v5
// Panel completo para conectar y gestionar la integración con Meta/Facebook
// Mobile-first: colapsado por defecto en móvil

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchMetaStatus,
  saveMetaCredentials,
  disconnectMeta,
  testMetaConnection,
  syncMetaData,
  getMetaOAuthUrl,
} from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CollapsibleSection } from './CollapsibleSection'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  Facebook,
  Plug,
  Unplug,
  RefreshCw,
  TestTube,
  Eye,
  EyeOff,
  Key,
  Globe,
  Shield,
  Clock,
  Activity,
  ExternalLink,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useMediaQuery } from '@/hooks/use-media-query'

// =============================================
// INTERFACES
// =============================================
interface CredencialFormData {
  appId: string
  appSecret: string
  accessToken: string
  accountId: string
  pixelId: string
  businessId: string
  graphApiVersion: string
}

interface EntradaRegistro {
  id: string
  timestamp: string
  accion: string
  estado: 'exito' | 'error'
  detalles: string
}

// Datos iniciales del formulario
const formDataInicial: CredencialFormData = {
  appId: '',
  appSecret: '',
  accessToken: '',
  accountId: '',
  pixelId: '',
  businessId: '',
  graphApiVersion: 'v21.0',
}

export function MetaConnection() {
  const queryClient = useQueryClient()
  const isMobile = useMediaQuery('(max-width: 768px)')

  // Estado del formulario de credenciales
  const [credenciales, setCredenciales] = useState<CredencialFormData>(formDataInicial)
  const [mostrarAppSecret, setMostrarAppSecret] = useState(false)
  const [mostrarAccessToken, setMostrarAccessToken] = useState(false)
  const [registroActividad, setRegistroActividad] = useState<EntradaRegistro[]>([])

  // Query para obtener estado de conexión
  const { data: metaStatus, isLoading: estadoCargando } = useQuery({
    queryKey: ['meta-status'],
    queryFn: fetchMetaStatus,
    refetchInterval: 30000,
  })

  // Mutation para guardar credenciales
  const guardarCredencialesMutation = useMutation({
    mutationFn: saveMetaCredentials,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-status'] })
      agregarRegistro('Guardar credenciales', 'exito', 'Credenciales guardadas correctamente')
      toast.success('Credenciales guardadas exitosamente')
    },
    onError: (error: Error) => {
      agregarRegistro('Guardar credenciales', 'error', error.message)
      toast.error('Error al guardar credenciales')
    },
  })

  // Mutation para probar conexión
  const probarConexionMutation = useMutation({
    mutationFn: testMetaConnection,
    onSuccess: (datos) => {
      queryClient.invalidateQueries({ queryKey: ['meta-status'] })
      if (datos.exito) {
        agregarRegistro('Probar conexión', 'exito', 'Conexión verificada correctamente')
        toast.success('Conexión con Meta verificada exitosamente')
      } else {
        agregarRegistro('Probar conexión', 'error', datos.error || 'Conexión fallida')
        toast.error('La verificación de conexión falló')
      }
    },
    onError: (error: Error) => {
      agregarRegistro('Probar conexión', 'error', error.message)
      toast.error('Error al probar la conexión')
    },
  })

  // Mutation para sincronizar datos
  const sincronizarMutation = useMutation({
    mutationFn: (tipo: 'campaigns' | 'insights' | 'all') => syncMetaData(tipo),
    onSuccess: (datos) => {
      queryClient.invalidateQueries({ queryKey: ['meta-status'] })
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['adsets'] })
      agregarRegistro('Sincronización', 'exito', `Sincronizados: ${datos.synced}, Creados: ${datos.created}, Actualizados: ${datos.updated}`)
      toast.success('Sincronización completada')
    },
    onError: (error: Error) => {
      agregarRegistro('Sincronización', 'error', error.message)
      toast.error('Error al sincronizar datos')
    },
  })

  // Mutation para desconectar
  const desconectarMutation = useMutation({
    mutationFn: disconnectMeta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-status'] })
      agregarRegistro('Desconectar', 'exito', 'Conexión con Meta desconectada')
      toast.success('Conexión con Meta desconectada')
    },
    onError: (error: Error) => {
      agregarRegistro('Desconectar', 'error', error.message)
      toast.error('Error al desconectar Meta')
    },
  })

  // Mutation para obtener URL de OAuth
  const oauthMutation = useMutation({
    mutationFn: getMetaOAuthUrl,
    onSuccess: (datos) => {
      agregarRegistro('OAuth', 'exito', `URL de OAuth generada: ${datos.url.substring(0, 50)}...`)
      window.open(datos.url, '_blank', 'noopener,noreferrer')
      toast.info('Ventana de Facebook abierta para autorización')
    },
    onError: (error: Error) => {
      agregarRegistro('OAuth', 'error', error.message)
      toast.error('Error al generar URL de OAuth. Guarda las credenciales primero.')
    },
  })

  // Agregar entrada al registro de actividad
  const agregarRegistro = (accion: string, estado: 'exito' | 'error', detalles: string) => {
    const nuevaEntrada: EntradaRegistro = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      accion,
      estado,
      detalles,
    }
    setRegistroActividad((prev) => [nuevaEntrada, ...prev].slice(0, 10))
  }

  // Manejar guardado de credenciales
  const handleGuardarCredenciales = () => {
    if (!credenciales.appId || !credenciales.appSecret || !credenciales.accessToken) {
      toast.error('App ID, App Secret y Access Token son obligatorios')
      return
    }
    guardarCredencialesMutation.mutate(credenciales)
  }

  // Determinar indicador de estado de conexión
  const indicadorEstado = () => {
    if (estadoCargando) {
      return { emoji: '🟡', texto: 'Verificando...', color: 'text-amber-500' }
    }
    if (!metaStatus?.connected) {
      if (metaStatus?.error?.includes('expirado') || metaStatus?.error?.includes('Token')) {
        return { emoji: '🟡', texto: 'Token Expirado', color: 'text-amber-500' }
      }
      return { emoji: '🔴', texto: 'Desconectado', color: 'text-red-500' }
    }
    return { emoji: '🟢', texto: 'Conectado', color: 'text-emerald-500' }
  }

  const estado = indicadorEstado()

  return (
    <div className="space-y-4">
      {/* ============================================= */}
      {/* SECCIÓN 1: Estado de Conexión */}
      {/* ============================================= */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Plug className="h-3.5 w-3.5" />
          Estado de Conexión
        </h4>

        {/* Status indicator - compact on mobile */}
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
          <span className={isMobile ? 'text-xl' : 'text-2xl'}>{estado.emoji}</span>
          <div className="min-w-0">
            <p className={`font-semibold text-sm ${estado.color}`}>{estado.texto}</p>
            {metaStatus?.error && (
              <p className="text-xs text-red-400 mt-0.5 truncate">{metaStatus.error}</p>
            )}
          </div>
        </div>

        {/* Información de la cuenta */}
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-2 text-xs`}>
          {metaStatus?.accountId && (
            <div className="flex items-center gap-1.5 p-2 rounded border border-border">
              <Key className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Ad Account:</span>
              <span className="font-mono font-medium truncate">{metaStatus.accountId}</span>
            </div>
          )}
          {metaStatus?.pixelId && (
            <div className="flex items-center gap-1.5 p-2 rounded border border-border">
              <Shield className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Pixel ID:</span>
              <span className="font-mono font-medium truncate">{metaStatus.pixelId}</span>
            </div>
          )}
          {metaStatus?.businessId && (
            <div className="flex items-center gap-1.5 p-2 rounded border border-border">
              <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Business ID:</span>
              <span className="font-mono font-medium truncate">{metaStatus.businessId}</span>
            </div>
          )}
          {metaStatus?.tokenExpiresAt && (
            <div className="flex items-center gap-1.5 p-2 rounded border border-border">
              <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Expiración:</span>
              <span className="font-medium">
                {format(new Date(metaStatus.tokenExpiresAt), "dd/MM/yy HH:mm", { locale: es })}
              </span>
            </div>
          )}
          {metaStatus?.lastSyncAt && (
            <div className="flex items-center gap-1.5 p-2 rounded border border-border col-span-1 sm:col-span-2">
              <Activity className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Última sincronización:</span>
              <span className="font-medium">
                {format(new Date(metaStatus.lastSyncAt), "dd/MM/yy HH:mm:ss", { locale: es })}
              </span>
            </div>
          )}
        </div>

        {/* Scopes/Permisos */}
        {metaStatus?.scopes && metaStatus.scopes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {metaStatus.scopes.map((scope) => (
              <Badge key={scope} variant="outline" className="text-[10px]">
                {scope}
              </Badge>
            ))}
          </div>
        )}

        {/* Botones de acción - full-width on mobile */}
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-wrap'} gap-2`}>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 w-full sm:w-auto"
            onClick={() => probarConexionMutation.mutate()}
            disabled={probarConexionMutation.isPending || estadoCargando}
          >
            {probarConexionMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <TestTube className="h-3.5 w-3.5" />
            )}
            Probar Conexión
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 w-full sm:w-auto"
            onClick={() => sincronizarMutation.mutate('all')}
            disabled={sincronizarMutation.isPending || !metaStatus?.connected}
          >
            {sincronizarMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Sincronizar Datos
          </Button>
          {metaStatus?.connected && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 w-full sm:w-auto"
              onClick={() => desconectarMutation.mutate()}
              disabled={desconectarMutation.isPending}
            >
              {desconectarMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Unplug className="h-3.5 w-3.5" />
              )}
              Desconectar
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* ============================================= */}
      {/* SECCIÓN 2: Configuración de Credenciales - Collapsible */}
      {/* ============================================= */}
      <CollapsibleSection
        value="meta-credentials"
        title="Configuración de Credenciales"
        icon={<Key className="h-4 w-4 text-primary" />}
        defaultOpen={false}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* App ID */}
          <div className="space-y-1.5">
            <Label className="text-xs">App ID</Label>
            <Input
              value={credenciales.appId}
              onChange={(e) => setCredenciales({ ...credenciales, appId: e.target.value })}
              placeholder="123456789012345"
              className="text-sm"
            />
          </div>

          {/* App Secret */}
          <div className="space-y-1.5">
            <Label className="text-xs">App Secret</Label>
            <div className="relative">
              <Input
                type={mostrarAppSecret ? 'text' : 'password'}
                value={credenciales.appSecret}
                onChange={(e) => setCredenciales({ ...credenciales, appSecret: e.target.value })}
                placeholder="abc123def456..."
                className="text-sm pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setMostrarAppSecret(!mostrarAppSecret)}
              >
                {mostrarAppSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          {/* Access Token */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Access Token</Label>
            <div className="relative">
              <Input
                type={mostrarAccessToken ? 'text' : 'password'}
                value={credenciales.accessToken}
                onChange={(e) => setCredenciales({ ...credenciales, accessToken: e.target.value })}
                placeholder="EAAxxxxxxx..."
                className="text-sm pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setMostrarAccessToken(!mostrarAccessToken)}
              >
                {mostrarAccessToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          {/* Ad Account ID */}
          <div className="space-y-1.5">
            <Label className="text-xs">Ad Account ID</Label>
            <Input
              value={credenciales.accountId}
              onChange={(e) => setCredenciales({ ...credenciales, accountId: e.target.value })}
              placeholder="act_123456789"
              className="text-sm"
            />
          </div>

          {/* Pixel ID */}
          <div className="space-y-1.5">
            <Label className="text-xs">Pixel ID</Label>
            <Input
              value={credenciales.pixelId}
              onChange={(e) => setCredenciales({ ...credenciales, pixelId: e.target.value })}
              placeholder="987654321"
              className="text-sm"
            />
          </div>

          {/* Business Manager ID */}
          <div className="space-y-1.5">
            <Label className="text-xs">Business Manager ID</Label>
            <Input
              value={credenciales.businessId}
              onChange={(e) => setCredenciales({ ...credenciales, businessId: e.target.value })}
              placeholder="1234567890"
              className="text-sm"
            />
          </div>

          {/* Graph API Version */}
          <div className="space-y-1.5">
            <Label className="text-xs">Graph API Version</Label>
            <Select
              value={credenciales.graphApiVersion}
              onValueChange={(valor) => setCredenciales({ ...credenciales, graphApiVersion: valor })}
            >
              <SelectTrigger className="text-sm w-full">
                <SelectValue placeholder="Seleccionar versión" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="v21.0">v21.0 (Recomendada)</SelectItem>
                <SelectItem value="v20.0">v20.0</SelectItem>
                <SelectItem value="v19.0">v19.0</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Botón guardar credenciales - full-width */}
        <Button
          onClick={handleGuardarCredenciales}
          disabled={guardarCredencialesMutation.isPending}
          className="w-full gap-1.5 mt-4"
        >
          {guardarCredencialesMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Key className="h-4 w-4" />
          )}
          Guardar Credenciales
        </Button>

        <p className="text-[11px] text-muted-foreground text-center mt-2">
          Puedes obtener estas credenciales en{' '}
          <a
            href="https://developers.facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 inline-flex items-center gap-0.5"
          >
            developers.facebook.com
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </p>
      </CollapsibleSection>

      <Separator />

      {/* ============================================= */}
      {/* SECCIÓN 3: OAuth (Conectar con Facebook) */}
      {/* ============================================= */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Facebook className="h-3.5 w-3.5" />
          OAuth (Conectar con Facebook)
        </h4>

        <Button
          onClick={() => oauthMutation.mutate()}
          disabled={oauthMutation.isPending || !credenciales.appId}
          className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {oauthMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Facebook className="h-4 w-4" />
          )}
          Conectar con Facebook
        </Button>

        {/* URI de redirección OAuth */}
        <div className="p-2.5 rounded-lg border border-dashed border-border bg-muted/10">
          <p className="text-[11px] text-muted-foreground mb-1">URI de redirección (configurar en Facebook App):</p>
          <code className="text-[11px] font-mono text-primary break-all">
            {typeof window !== 'undefined' ? `${window.location.origin}/api/meta/auth/callback` : '/api/meta/auth/callback'}
          </code>
        </div>

        {/* Permisos requeridos */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[11px] text-muted-foreground">Permisos requeridos:</span>
          {['ads_management', 'ads_read', 'business_management'].map((permiso) => (
            <Badge key={permiso} variant="secondary" className="text-[10px]">
              {permiso}
            </Badge>
          ))}
        </div>

        {!credenciales.appId && (
          <p className="text-[11px] text-amber-500 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Configura el App ID primero para habilitar OAuth
          </p>
        )}
      </div>

      <Separator />

      {/* ============================================= */}
      {/* SECCIÓN 4: Registro de Actividad - Collapsible on mobile */}
      {/* ============================================= */}
      <CollapsibleSection
        value="meta-activity-log"
        title="Registro de Actividad"
        icon={<Activity className="h-4 w-4 text-primary" />}
        defaultOpen={!isMobile}
      >
        {registroActividad.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            Sin actividad registrada aún
          </p>
        ) : (
          <ScrollArea className="max-h-48">
            <div className="space-y-1.5">
              {registroActividad.map((entrada, indice) => (
                <motion.div
                  key={entrada.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: indice * 0.05 }}
                  className="flex items-start gap-2 p-2 rounded border border-border/50 text-xs"
                >
                  {entrada.estado === 'exito' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{entrada.accion}</span>
                      <span className="text-muted-foreground">
                        {format(new Date(entrada.timestamp), 'HH:mm:ss', { locale: es })}
                      </span>
                    </div>
                    <p className="text-muted-foreground truncate">{entrada.detalles}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CollapsibleSection>
    </div>
  )
}
