// ImmiScale Meta Engine v5 - Servicio de Integración Meta Graph API
// Módulo central para todas las llamadas a la API de Meta/Facebook
// Todos los comentarios y textos en español

import { db } from '@/lib/db'

// =============================================
// TIPOS E INTERFACES
// =============================================

/** Campaña de Meta Ads */
export interface MetaCampaign {
  id: string
  name: string
  objective: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  effective_status: string[]
  daily_budget?: string
  lifetime_budget?: string
  spend_cap?: string
  created_time: string
  updated_time: string
  [key: string]: unknown
}

/** Conjunto de anuncios (AdSet) de Meta */
export interface MetaAdSet {
  id: string
  name: string
  campaign_id: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED'
  daily_budget?: string
  lifetime_budget?: string
  targeting?: MetaTargeting
  optimization_goal: string
  billing_event: string
  bid_amount?: number
  created_time: string
  updated_time: string
  [key: string]: unknown
}

/** Configuración de targeting para adsets */
export interface MetaTargeting {
  geo_locations?: {
    countries?: string[]
    regions?: Array<{ key: string; name: string }>
    cities?: Array<{ key: string; name: string; radius: number }>
  }
  age_min?: number
  age_max?: number
  genders?: number[] // 1=masculino, 2=femenino
  interests?: Array<{ id: string; name: string }>
  behaviors?: Array<{ id: string; name: string }>
  custom_audiences?: Array<{ id: string; name: string }>
  lookalike_audiences?: Array<{ id: string; name: string }>
  exclusions?: Record<string, unknown>
}

/** Métricas de rendimiento de Meta Insights */
export interface MetaInsight {
  date_start: string
  date_stop: string
  impressions: string
  clicks: string
  spend: string
  reach: string
  frequency: string
  cpc: string
  cpm: string
  ctr: string
  cost_per_action_type?: Array<{ action_type: string; value: string }>
  actions?: Array<{ action_type: string; value: string }>
  [key: string]: unknown
}

/** Payload de evento para Conversions API (CAPI) */
export interface CAPIEventPayload {
  event_name: string
  event_time: number
  event_id: string
  event_source_url?: string
  action_source: 'website' | 'email' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other'
  user_data: {
    em?: string[]    // correos hasheados (SHA-256)
    ph?: string[]    // teléfonos hasheados
    fn?: string[]    // nombre hasheado
    ln?: string[]    // apellido hasheado
    ct?: string[]    // ciudad hasheada
    st?: string[]    // estado/estado hasheado
    zp?: string[]    // código postal hasheado
    country?: string[] // país hasheado
    client_ip_address?: string
    client_user_agent?: string
    fbc?: string     // Facebook Click ID
    fbp?: string     // Facebook Browser ID
    external_id?: string[]
  }
  custom_data?: Record<string, unknown>
}

/** Resultado del envío de eventos CAPI */
export interface CAPIResponse {
  events_received: number
  messages: Array<{ message: string; code: number }>
  fbtrace_id: string
  [key: string]: unknown
}

/** Resultado de búsqueda de targeting */
export interface MetaTargetingResult {
  id: string
  name: string
  type: string
  audience_size?: number
  path?: string[]
  [key: string]: unknown
}

/** Audiencia personalizada de Meta */
export interface MetaCustomAudience {
  id: string
  name: string
  subtype?: string
  description?: string
  customer_count?: number
  [key: string]: unknown
}

/** Parámetros para crear campaña */
export interface CreateCampaignParams {
  name: string
  objective: string
  status?: 'ACTIVE' | 'PAUSED'
  daily_budget?: string
  lifetime_budget?: string
  spend_cap?: string
  special_ad_categories?: string[]
  [key: string]: unknown
}

/** Parámetros para actualizar campaña */
export interface UpdateCampaignParams {
  name?: string
  status?: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  daily_budget?: string
  lifetime_budget?: string
  spend_cap?: string
  [key: string]: unknown
}

/** Parámetros para crear adset */
export interface CreateAdSetParams {
  name: string
  campaign_id: string
  status?: 'ACTIVE' | 'PAUSED'
  daily_budget?: string
  lifetime_budget?: string
  targeting?: MetaTargeting
  optimization_goal: string
  billing_event: string
  bid_amount?: number
  [key: string]: unknown
}

/** Parámetros para actualizar adset */
export interface UpdateAdSetParams {
  name?: string
  status?: 'ACTIVE' | 'PAUSED' | 'DELETED'
  daily_budget?: string
  lifetime_budget?: string
  targeting?: MetaTargeting
  bid_amount?: number
  [key: string]: unknown
}

/** Parámetros para obtener insights */
export interface InsightParams {
  fields?: string[]
  date_preset?: string
  time_range?: { since: string; until: string }
  breakdowns?: string[]
  level?: 'ad' | 'adset' | 'campaign' | 'account'
  filtering?: Array<{ field: string; operator: string; value: string }>
  limit?: number
  [key: string]: unknown
}

/** Parámetros para crear audiencia personalizada */
export interface CreateCustomAudienceParams {
  name: string
  description?: string
  subtype?: string
  customer_file_source?: string
  [key: string]: unknown
}

/** Resultado del intercambio de token */
export interface TokenExchangeResult {
  access_token: string
  token_type: string
  expires_in: number
  [key: string]: unknown
}

/** Resultado de verificación de token */
export interface TokenVerificationResult {
  valid: boolean
  expiresAt?: string
  error?: string
  data?: {
    user_id?: string
    app_id?: string
    scopes?: string[]
  }
}

/** Información de depuración de token */
export interface TokenDebugInfo {
  data: {
    app_id: string
    type: string
    application: string
    expires_at: number
    is_valid: boolean
    scopes: string[]
    user_id?: string
    profile_id?: string
    error?: {
      message: string
      type: string
      code: number
    }
  }
}

/** Resultado de prueba de conexión */
export interface ConnectionTestResult {
  connected: boolean
  accountId?: string
  accountName?: string
  currency?: string
  timezone?: string
  error?: string
}

// =============================================
// ERROR PERSONALIZADO DE META API
// =============================================

/** Error específico de la API de Meta con detalles del error */
export class MetaAPIError extends Error {
  public readonly type: string
  public readonly code: number
  public readonly errorSubcode: number
  public readonly fbtraceId: string

  constructor(metaError: { message: string; type: string; code: number; error_subcode: number; fbtrace_id: string }) {
    super(metaError.message)
    this.name = 'MetaAPIError'
    this.type = metaError.type
    this.code = metaError.code
    this.errorSubcode = metaError.error_subcode
    this.fbtraceId = metaError.fbtrace_id
  }
}

// =============================================
// UTILIDADES DE HASH
// =============================================

/**
 * Hashea un valor con SHA-256 según lo requerido por Meta CAPI.
 * Los datos de usuario deben enviarse en minúsculas y sin espacios al inicio/fin.
 */
export async function hashSHA256(value: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(value.trim().toLowerCase())
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Hashea todos los datos de usuario para CAPI.
 * Convierte cada campo en su hash SHA-256 según las especificaciones de Meta.
 */
export async function hashUserData(userData: CAPIEventPayload['user_data']): Promise<CAPIEventPayload['user_data']> {
  const hashed: CAPIEventPayload['user_data'] = {}

  // Campos que deben ser hasheados como arrays de strings
  const camposHashear = ['em', 'ph', 'fn', 'ln', 'ct', 'st', 'zp', 'country'] as const

  for (const campo of camposHashear) {
    const valores = userData[campo]
    if (valores && valores.length > 0) {
      const valoresHasheados: string[] = []
      for (const valor of valores) {
        valoresHasheados.push(await hashSHA256(valor))
      }
      ;(hashed as Record<string, string[]>)[campo] = valoresHasheados
    }
  }

  // Campos que NO se hashean (se pasan tal cual)
  if (userData.client_ip_address) hashed.client_ip_address = userData.client_ip_address
  if (userData.client_user_agent) hashed.client_user_agent = userData.client_user_agent
  if (userData.fbc) hashed.fbc = userData.fbc
  if (userData.fbp) hashed.fbp = userData.fbp
  if (userData.external_id) hashed.external_id = userData.external_id

  return hashed
}

// =============================================
// CONFIGURACIÓN POR DEFECTO
// =============================================

const GRAPH_VERSION_DEFAULT = 'v21.0'
const BASE_URL_DEFAULT = `https://graph.facebook.com/${GRAPH_VERSION_DEFAULT}/`
const MAX_REINTENTOS = 3
const RETRASO_BASE_MS = 1000

/** Campos por defecto para campañas */
const CAMPAIGN_FIELDS_DEFAULT = [
  'id', 'name', 'objective', 'status', 'effective_status',
  'daily_budget', 'lifetime_budget', 'spend_cap',
  'created_time', 'updated_time',
]

/** Campos por defecto para adsets */
const ADSET_FIELDS_DEFAULT = [
  'id', 'name', 'campaign_id', 'status',
  'daily_budget', 'lifetime_budget', 'targeting',
  'optimization_goal', 'billing_event', 'bid_amount',
  'created_time', 'updated_time',
]

/** Campos por defecto para insights */
const INSIGHT_FIELDS_DEFAULT = [
  'impressions', 'clicks', 'spend', 'reach', 'frequency',
  'cpc', 'cpm', 'ctr', 'cost_per_action_type', 'actions',
]

// =============================================
// SERVICIO PRINCIPAL
// =============================================

/**
 * Servicio principal de integración con Meta Graph API.
 * Maneja todas las operaciones: campañas, adsets, insights, CAPI, targeting,
 * audiencias personalizadas, lookalike y gestión de tokens.
 */
export class MetaAPIService {
  private accessToken: string
  private adAccountId: string
  private pixelId: string
  private graphVersion: string
  private baseUrl: string
  private appId: string
  private appSecret: string

  constructor(config: {
    accessToken: string
    adAccountId: string
    pixelId: string
    graphVersion?: string
    appId?: string
    appSecret?: string
  }) {
    this.accessToken = config.accessToken
    this.adAccountId = config.adAccountId
    this.pixelId = config.pixelId
    this.graphVersion = config.graphVersion || GRAPH_VERSION_DEFAULT
    this.baseUrl = `https://graph.facebook.com/${this.graphVersion}/`
    this.appId = config.appId || ''
    this.appSecret = config.appSecret || ''
  }

  // =============================================
  // FÁBRICAS ESTÁTICAS
  // =============================================

  /**
   * Crea una instancia del servicio desde las credenciales almacenadas en la base de datos.
   * Retorna null si no hay credenciales configuradas.
   */
  static async fromDatabase(): Promise<MetaAPIService | null> {
    try {
      const credencial = await db.metaCredential.findFirst()
      if (!credencial || !credencial.accessToken) {
        console.log('[MetaAPI] No se encontraron credenciales en la base de datos')
        return null
      }

      return new MetaAPIService({
        accessToken: credencial.accessToken,
        adAccountId: credencial.accountId || '',
        pixelId: credencial.pixelId || '',
        graphVersion: credencial.graphApiVersion || GRAPH_VERSION_DEFAULT,
        appId: credencial.appId,
        appSecret: credencial.appSecret,
      })
    } catch (error) {
      console.error('[MetaAPI] Error al cargar credenciales desde la BD:', error)
      return null
    }
  }

  /**
   * Crea una instancia del servicio desde las variables de entorno.
   * Retorna null si las variables requeridas no están definidas.
   */
  static fromEnv(): MetaAPIService | null {
    const accessToken = process.env.META_ACCESS_TOKEN
    const adAccountId = process.env.META_AD_ACCOUNT_ID
    const pixelId = process.env.META_PIXEL_ID || ''

    if (!accessToken || !adAccountId) {
      console.log('[MetaAPI] Variables de entorno META_ACCESS_TOKEN o META_AD_ACCOUNT_ID no configuradas')
      return null
    }

    return new MetaAPIService({
      accessToken,
      adAccountId,
      pixelId,
      appId: process.env.META_APP_ID || '',
      appSecret: process.env.META_APP_SECRET || '',
    })
  }

  // =============================================
  // MÉTODO CENTRAL DE LLAMADAS API
  // =============================================

  /**
   * Método central para todas las llamadas a la Graph API de Meta.
   * Incluye: autenticación automática, reintentos con backoff exponencial,
   * manejo de rate limiting (HTTP 429), y parseo de errores de Meta.
   */
  private async apiCall<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE',
    params: Record<string, unknown> = {}
  ): Promise<T> {
    // Incluir access_token en todos los requests
    const parametrosConToken = { ...params, access_token: this.accessToken }

    let ultimoError: Error | null = null

    // Reintentos con backoff exponencial
    for (let intento = 0; intento < MAX_REINTENTOS; intento++) {
      try {
        let url: string
        let opciones: RequestInit

        if (method === 'GET') {
          // Para GET, los parámetros van en la URL
          const searchParams = new URLSearchParams()
          for (const [clave, valor] of Object.entries(parametrosConToken)) {
            if (valor !== undefined && valor !== null) {
              if (typeof valor === 'object') {
                searchParams.set(clave, JSON.stringify(valor))
              } else {
                searchParams.set(clave, String(valor))
              }
            }
          }
          url = `${this.baseUrl}${endpoint}?${searchParams.toString()}`
          opciones = { method: 'GET' }
        } else {
          // Para POST/DELETE, parámetros en el body como form-data
          url = `${this.baseUrl}${endpoint}`
          const formData = new URLSearchParams()
          for (const [clave, valor] of Object.entries(parametrosConToken)) {
            if (valor !== undefined && valor !== null) {
              if (typeof valor === 'object') {
                formData.set(clave, JSON.stringify(valor))
              } else {
                formData.set(clave, String(valor))
              }
            }
          }
          opciones = {
            method,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString(),
          }
        }

        // Registro de la llamada para depuración
        console.log(`[MetaAPI] ${method} ${endpoint} (intento ${intento + 1}/${MAX_REINTENTOS})`)

        const respuesta = await fetch(url, opciones)

        // Manejo de rate limiting (HTTP 429)
        if (respuesta.status === 429) {
          const retraso = RETRASO_BASE_MS * Math.pow(2, intento)
          console.warn(`[MetaAPI] Rate limit alcanzado. Reintentando en ${retraso}ms...`)
          await this.dormir(retraso)
          continue
        }

        // Manejo de error de token expirado
        if (respuesta.status === 401) {
          console.error('[MetaAPI] Token de acceso expirado o inválido')
          await this.marcarTokenExpirado()
          throw new MetaAPIError({
            message: 'Token de acceso expirado o inválido',
            type: 'OAuthException',
            code: 190,
            error_subcode: 463,
            fbtrace_id: '',
          })
        }

        const datos = await respuesta.json()

        // Verificar si Meta retornó un error en la respuesta
        if (datos.error) {
          const metaError = datos.error
          console.error(`[MetaAPI] Error de Meta API: ${metaError.message} (código: ${metaError.code})`)

          // Errores temporales que merecen reintento
          if (this.esErrorTemporal(metaError.code, metaError.error_subcode)) {
            const retraso = RETRASO_BASE_MS * Math.pow(2, intento)
            console.warn(`[MetaAPI] Error temporal, reintentando en ${retraso}ms...`)
            await this.dormir(retraso)
            ultimoError = new MetaAPIError(metaError)
            continue
          }

          throw new MetaAPIError(metaError)
        }

        return datos as T
      } catch (error) {
        if (error instanceof MetaAPIError) {
          ultimoError = error
          if (intento < MAX_REINTENTOS - 1) {
            const retraso = RETRASO_BASE_MS * Math.pow(2, intento)
            console.warn(`[MetaAPI] Reintentando en ${retraso}ms...`)
            await this.dormir(retraso)
            continue
          }
        } else {
          ultimoError = error instanceof Error ? error : new Error(String(error))
          console.error(`[MetaAPI] Error en llamada: ${ultimoError.message}`)
          if (intento < MAX_REINTENTOS - 1) {
            const retraso = RETRASO_BASE_MS * Math.pow(2, intento)
            await this.dormir(retraso)
            continue
          }
        }
      }
    }

    throw ultimoError || new Error('Error desconocido en llamada a Meta API')
  }

  // =============================================
  // CAMPAÑAS
  // =============================================

  /**
   * Obtener lista de campañas de la cuenta de anuncios.
   * GET /{ad_account_id}/campaigns
   */
  async getCampaigns(fields?: string[]): Promise<MetaCampaign[]> {
    const campos = fields || CAMPAIGN_FIELDS_DEFAULT
    const resultado = await this.apiCall<{ data: MetaCampaign[] }>(
      `${this.adAccountId}/campaigns`,
      'GET',
      { fields: campos.join(',') }
    )
    return resultado.data || []
  }

  /**
   * Crear una nueva campaña en Meta.
   * POST /{ad_account_id}/campaigns
   */
  async createCampaign(data: CreateCampaignParams): Promise<MetaCampaign> {
    return this.apiCall<MetaCampaign>(
      `${this.adAccountId}/campaigns`,
      'POST',
      { ...data }
    )
  }

  /**
   * Obtener detalles de una campaña específica.
   * GET /{campaign_id}
   */
  async getCampaign(campaignId: string, fields?: string[]): Promise<MetaCampaign> {
    const campos = fields || CAMPAIGN_FIELDS_DEFAULT
    return this.apiCall<MetaCampaign>(
      campaignId,
      'GET',
      { fields: campos.join(',') }
    )
  }

  /**
   * Actualizar una campaña (pausar, activar, cambiar presupuesto, etc.).
   * POST /{campaign_id}
   */
  async updateCampaign(campaignId: string, data: UpdateCampaignParams): Promise<MetaCampaign> {
    return this.apiCall<MetaCampaign>(
      campaignId,
      'POST',
      { ...data }
    )
  }

  // =============================================
  // ADSETS
  // =============================================

  /**
   * Obtener lista de adsets de una campaña.
   * GET /{campaign_id}/adsets
   */
  async getAdSets(campaignId: string, fields?: string[]): Promise<MetaAdSet[]> {
    const campos = fields || ADSET_FIELDS_DEFAULT
    const resultado = await this.apiCall<{ data: MetaAdSet[] }>(
      `${campaignId}/adsets`,
      'GET',
      { fields: campos.join(',') }
    )
    return resultado.data || []
  }

  /**
   * Crear un nuevo adset con configuración de targeting.
   * POST /{ad_account_id}/adsets
   */
  async createAdSet(data: CreateAdSetParams): Promise<MetaAdSet> {
    const params: Record<string, unknown> = {
      name: data.name,
      campaign_id: data.campaign_id,
      optimization_goal: data.optimization_goal,
      billing_event: data.billing_event,
    }
    if (data.status) params.status = data.status
    if (data.daily_budget) params.daily_budget = data.daily_budget
    if (data.lifetime_budget) params.lifetime_budget = data.lifetime_budget
    if (data.targeting) params.targeting = data.targeting
    if (data.bid_amount) params.bid_amount = data.bid_amount

    return this.apiCall<MetaAdSet>(
      `${this.adAccountId}/adsets`,
      'POST',
      params
    )
  }

  /**
   * Actualizar un adset (presupuesto, estado, targeting).
   * POST /{adset_id}
   */
  async updateAdSet(adsetId: string, data: UpdateAdSetParams): Promise<MetaAdSet> {
    return this.apiCall<MetaAdSet>(
      adsetId,
      'POST',
      { ...data }
    )
  }

  // =============================================
  // INSIGHTS / MÉTRICAS
  // =============================================

  /**
   * Obtener métricas de rendimiento de un objeto (campaña, adset, anuncio).
   * GET /{object_id}/insights
   */
  async getInsights(objectId: string, params: InsightParams): Promise<MetaInsight[]> {
    const parametros: Record<string, unknown> = {}

    // Campos de métricas
    if (params.fields) {
      parametros.fields = params.fields.join(',')
    } else {
      parametros.fields = INSIGHT_FIELDS_DEFAULT.join(',')
    }

    // Rango de fechas
    if (params.time_range) {
      parametros.time_range = JSON.stringify(params.time_range)
    } else if (params.date_preset) {
      parametros.date_preset = params.date_preset
    }

    // Nivel de desglose
    if (params.level) parametros.level = params.level
    if (params.breakdowns) parametros.breakdowns = params.breakdowns.join(',')
    if (params.filtering) parametros.filtering = JSON.stringify(params.filtering)
    if (params.limit) parametros.limit = params.limit

    const resultado = await this.apiCall<{ data: MetaInsight[] }>(
      `${objectId}/insights`,
      'GET',
      parametros
    )
    return resultado.data || []
  }

  /**
   * Obtener insights a nivel de cuenta de anuncios.
   * GET /{ad_account_id}/insights
   */
  async getAccountInsights(dateRange: { from: string; to: string }): Promise<MetaInsight[]> {
    return this.getInsights(this.adAccountId, {
      fields: INSIGHT_FIELDS_DEFAULT,
      time_range: { since: dateRange.from, until: dateRange.to },
      level: 'account',
    })
  }

  // =============================================
  // CAPI (Conversions API)
  // =============================================

  /**
   * Enviar eventos de conversión a Meta a través de CAPI.
   * POST /{pixel_id}/events
   * Los datos de usuario deben ser hasheados previamente con hashUserData().
   */
  async sendCAPIEvents(events: CAPIEventPayload[]): Promise<CAPIResponse> {
    if (!this.pixelId) {
      throw new Error('Pixel ID no configurado. No se pueden enviar eventos CAPI.')
    }

    return this.apiCall<CAPIResponse>(
      `${this.pixelId}/events`,
      'POST',
      { data: JSON.stringify(events) }
    )
  }

  // =============================================
  // TARGETING
  // =============================================

  /**
   * Buscar opciones de targeting (países, ciudades, intereses, comportamientos).
   * GET /search
   */
  async searchTargeting(params: {
    type: string
    q: string
    country_codes?: string[]
  }): Promise<MetaTargetingResult[]> {
    const parametros: Record<string, unknown> = {
      type: params.type,
      q: params.q,
    }
    if (params.country_codes) {
      parametros.country_codes = JSON.stringify(params.country_codes)
    }

    const resultado = await this.apiCall<{ data: MetaTargetingResult[] }>(
      'search',
      'GET',
      parametros
    )
    return resultado.data || []
  }

  /**
   * Obtener audiencias recomendadas para el vertical de inmigración/legal.
   * Busca intereses y comportamientos relevantes para servicios de inmigración
   * en el país especificado.
   */
  async getImmigrationAudiences(countryCode: string): Promise<MetaTargetingResult[]> {
    // Términos de búsqueda relevantes para servicios de inmigración
    const terminosBusqueda = [
      'inmigración',
      'visa',
      'ciudadanía',
      'pasaporte',
      'asilo político',
      'greencard',
      'abogado de inmigración',
      'trámite migratorio',
      'residencia permanente',
    ]

    const todasAudiencias: MetaTargetingResult[] = []

    for (const termino of terminosBusqueda) {
      try {
        const resultados = await this.searchTargeting({
          type: 'adinterest',
          q: termino,
          country_codes: [countryCode],
        })
        todasAudiencias.push(...resultados)
      } catch (error) {
        console.warn(`[MetaAPI] Error buscando audiencia para "${termino}":`, error)
      }
    }

    // Eliminar duplicados por ID
    const audienciasUnicas = new Map<string, MetaTargetingResult>()
    for (const audiencia of todasAudiencias) {
      if (!audienciasUnicas.has(audiencia.id)) {
        audienciasUnicas.set(audiencia.id, audiencia)
      }
    }

    return Array.from(audienciasUnicas.values())
  }

  // =============================================
  // AUDIENCIAS PERSONALIZADAS / LOOKALIKE
  // =============================================

  /**
   * Crear una audiencia personalizada.
   * POST /{ad_account_id}/customaudiences
   */
  async createCustomAudience(data: CreateCustomAudienceParams): Promise<MetaCustomAudience> {
    return this.apiCall<MetaCustomAudience>(
      `${this.adAccountId}/customaudiences`,
      'POST',
      { ...data }
    )
  }

  /**
   * Crear una audiencia lookalike basada en una audiencia fuente.
   * POST /{ad_account_id}/customaudiences
   */
  async createLookalikeAudience(
    sourceAudienceId: string,
    countryCode: string
  ): Promise<MetaCustomAudience> {
    return this.apiCall<MetaCustomAudience>(
      `${this.adAccountId}/customaudiences`,
      'POST',
      {
        name: `Lookalike - ${countryCode} - ${new Date().toISOString().split('T')[0]}`,
        subtype: 'LOOKALIKE',
        origin_audience_id: sourceAudienceId,
        lookalike_spec: JSON.stringify({
          type: 'similarity',
          country: countryCode,
          ratio: 0.01, // 1% de la población
        }),
      }
    )
  }

  // =============================================
  // GESTIÓN DE TOKENS
  // =============================================

  /**
   * Intercambiar un token de corta duración por uno de larga duración (60 días).
   * GET /oauth/access_token
   */
  async exchangeToken(shortLivedToken: string): Promise<TokenExchangeResult> {
    if (!this.appId || !this.appSecret) {
      throw new Error('App ID y App Secret son requeridos para intercambiar tokens')
    }

    const url = `${this.baseUrl}oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${this.appId}&` +
      `client_secret=${this.appSecret}&` +
      `fb_exchange_token=${shortLivedToken}`

    console.log('[MetaAPI] Intercambiando token de corta duración por uno de larga duración')

    const respuesta = await fetch(url, { method: 'GET' })
    const datos = await respuesta.json()

    if (datos.error) {
      throw new MetaAPIError(datos.error)
    }

    return datos as TokenExchangeResult
  }

  /**
   * Verificar la validez del token de acceso actual.
   * Realiza una llamada a /me para confirmar que el token sigue activo.
   */
  async verifyToken(): Promise<TokenVerificationResult> {
    try {
      const resultado = await this.apiCall<{ id: string; name?: string }>('me', 'GET')

      return {
        valid: true,
        data: {
          user_id: resultado.id,
        },
      }
    } catch (error) {
      const mensaje = error instanceof MetaAPIError ? error.message : 'Error desconocido'
      return {
        valid: false,
        error: mensaje,
      }
    }
  }

  /**
   * Depurar un token para obtener información de scopes y detalles.
   * GET /debug_token
   * Si no se proporciona inputToken, se depura el token de acceso actual.
   */
  async debugToken(inputToken?: string): Promise<TokenDebugInfo> {
    const tokenADepurar = inputToken || this.accessToken

    return this.apiCall<TokenDebugInfo>(
      'debug_token',
      'GET',
      { input_token: tokenADepurar }
    )
  }

  // =============================================
  // UTILIDADES
  // =============================================

  /**
   * Probar la conexión con Meta y retornar información de la cuenta.
   */
  async testConnection(): Promise<ConnectionTestResult> {
    try {
      // Intentar obtener información de la cuenta de anuncios
      const resultado = await this.apiCall<{
        id: string
        name: string
        currency: string
        timezone_name: string
      }>(this.adAccountId, 'GET', {
        fields: 'id,name,currency,timezone_name',
      })

      return {
        connected: true,
        accountId: resultado.id,
        accountName: resultado.name,
        currency: resultado.currency,
        timezone: resultado.timezone_name,
      }
    } catch (error) {
      const mensaje = error instanceof MetaAPIError ? error.message : 'Error de conexión desconocido'
      return {
        connected: false,
        error: mensaje,
      }
    }
  }

  /**
   * Sincronizar campañas desde Meta a la base de datos local.
   * Crea campañas nuevas y actualiza las existentes.
   */
  async syncCampaignsToDb(): Promise<{ synced: number; created: number; updated: number }> {
    let sincronizadas = 0
    let creadas = 0
    let actualizadas = 0

    try {
      const campanasMeta = await this.getCampaigns()
      sincronizadas = campanasMeta.length

      for (const campanaMeta of campanasMeta) {
        // Buscar si ya existe una campaña local con este ID de Meta
        const campanaExistente = await db.campaign.findFirst({
          where: { metaCampaignId: campanaMeta.id },
        })

        if (campanaExistente) {
          // Actualizar campaña existente
          await db.campaign.update({
            where: { id: campanaExistente.id },
            data: {
              name: campanaMeta.name,
              objective: campanaMeta.objective,
              status: campanaMeta.status,
              totalBudget: campanaMeta.daily_budget
                ? parseFloat(campanaMeta.daily_budget) / 100
                : campanaMeta.lifetime_budget
                  ? parseFloat(campanaMeta.lifetime_budget) / 100
                  : campanaExistente.totalBudget,
            },
          })
          actualizadas++
        } else {
          // Crear nueva campaña
          await db.campaign.create({
            data: {
              metaCampaignId: campanaMeta.id,
              name: campanaMeta.name,
              objective: campanaMeta.objective,
              status: campanaMeta.status,
              totalBudget: campanaMeta.daily_budget
                ? parseFloat(campanaMeta.daily_budget) / 100
                : campanaMeta.lifetime_budget
                  ? parseFloat(campanaMeta.lifetime_budget) / 100
                  : 0,
            },
          })
          creadas++
        }
      }

      // Actualizar fecha de última sincronización
      await this.actualizarUltimaSincronizacion()

      console.log(`[MetaAPI] Sincronización completada: ${sincronizadas} campañas, ${creadas} creadas, ${actualizadas} actualizadas`)
    } catch (error) {
      console.error('[MetaAPI] Error en sincronización de campañas:', error)
    }

    return { synced: sincronizadas, created: creadas, updated: actualizadas }
  }

  /**
   * Sincronizar insights/métricas desde Meta a la base de datos local.
   * Obtiene insights a nivel de cuenta y los guarda en la tabla de métricas.
   */
  async syncInsightsToDb(dateRange: { from: string; to: string }): Promise<{ synced: number }> {
    let sincronizadas = 0

    try {
      const insights = await this.getAccountInsights(dateRange)

      for (const insight of insights) {
        // Obtener o crear una región por defecto para las métricas sincronizadas
        let region = await db.region.findFirst({ where: { code: 'GLOBAL' } })
        if (!region) {
          region = await db.region.create({
            data: {
              code: 'GLOBAL',
              name: 'Global',
              currency: 'USD',
            },
          })
        }

        // Verificar si ya existe una métrica para esta fecha y región
        const fechaMetrica = new Date(insight.date_start)
        const metricaExistente = await db.metric.findFirst({
          where: {
            regionId: region.id,
            date: fechaMetrica,
          },
        })

        const datosMetrica = {
          totalSpend: parseFloat(insight.spend) || 0,
          leadCount: this.contarAccion(insight.actions, 'lead') || 0,
          matchScore: parseFloat(insight.ctr) || 0,
          cpl: parseFloat(insight.cpc) || 0,
          revenue: 0,
          date: fechaMetrica,
          regionId: region.id,
        }

        if (metricaExistente) {
          await db.metric.update({
            where: { id: metricaExistente.id },
            data: datosMetrica,
          })
        } else {
          await db.metric.create({
            data: datosMetrica,
          })
        }
        sincronizadas++
      }

      // Actualizar fecha de última sincronización
      await this.actualizarUltimaSincronizacion()

      console.log(`[MetaAPI] Sincronización de insights completada: ${sincronizadas} registros`)
    } catch (error) {
      console.error('[MetaAPI] Error en sincronización de insights:', error)
    }

    return { synced: sincronizadas }
  }

  // =============================================
  // MÉTODOS PRIVADOS DE APOYO
  // =============================================

  /**
   * Dormir el hilo por un número de milisegundos (para backoff exponencial).
   */
  private dormir(ms: number): Promise<void> {
    return new Promise((resolver) => setTimeout(resolver, ms))
  }

  /**
   * Determinar si un código de error de Meta es temporal y merece reintento.
   * Errores temporales: rate limiting, timeouts, errores de servidor.
   */
  private esErrorTemporal(codigo: number, subcodigo: number): boolean {
    // Rate limiting
    if (codigo === 4 || codigo === 17 || codigo === 341) return true
    // Temporalmente no disponible
    if (codigo === 2) return true
    // Token expirado pero renovable
    if (codigo === 190 && subcodigo === 463) return false // Token expirado, no reintentar
    // Timeout de la API
    if (codigo === 1) return true
    // Error de aplicación temporal
    if (codigo === 10) return true
    return false
  }

  /**
   * Marcar el token como expirado en la base de datos.
   */
  private async marcarTokenExpirado(): Promise<void> {
    try {
      await db.metaCredential.updateMany({
        where: { isConnected: true },
        data: {
          isConnected: false,
          connectionStatus: 'EXPIRED',
          errorMessage: 'Token de acceso expirado',
        },
      })
    } catch (error) {
      console.error('[MetaAPI] Error al marcar token como expirado:', error)
    }
  }

  /**
   * Actualizar la fecha de última sincronización en la base de datos.
   */
  private async actualizarUltimaSincronizacion(): Promise<void> {
    try {
      await db.metaCredential.updateMany({
        where: { isConnected: true },
        data: { lastSyncAt: new Date() },
      })
    } catch (error) {
      console.error('[MetaAPI] Error al actualizar última sincronización:', error)
    }
  }

  /**
   * Contar acciones de un tipo específico desde los datos de insights.
   */
  private contarAccion(
    acciones: Array<{ action_type: string; value: string }> | undefined,
    tipoAccion: string
  ): number {
    if (!acciones) return 0
    const accion = acciones.find((a) => a.action_type === tipoAccion)
    return accion ? parseInt(accion.value, 10) : 0
  }
}

// =============================================
// SINGLETON - INSTANCIA GLOBAL
// =============================================

let instanciaCache: MetaAPIService | null | undefined = undefined

/**
 * Obtener la instancia singleton del servicio Meta API.
 * Intenta cargar desde la base de datos primero, luego desde variables de entorno.
 * Retorna null si no hay credenciales configuradas.
 */
export async function getMetaAPI(): Promise<MetaAPIService | null> {
  // Usar caché en memoria si ya se resolvió
  if (instanciaCache !== undefined) {
    return instanciaCache
  }

  // Intentar cargar desde la base de datos primero
  const desdeBD = await MetaAPIService.fromDatabase()
  if (desdeBD) {
    instanciaCache = desdeBD
    return desdeBD
  }

  // Fallback a variables de entorno
  const desdeEnv = MetaAPIService.fromEnv()
  instanciaCache = desdeEnv
  return desdeEnv
}

/**
 * Invalidar la caché del singleton.
 * Útil cuando se actualizan las credenciales en la base de datos.
 */
export function invalidateMetaAPICache(): void {
  instanciaCache = undefined
}
