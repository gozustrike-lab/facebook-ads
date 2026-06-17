// ImmiScale Meta Engine v5 - API Client Functions

// =============================================
// TIPOS
// =============================================
export interface Region {
  id: string
  code: string
  name: string
  currency: string
  cplTarget: number
  cplKillSwitch: number
  language: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Campaign {
  id: string
  metaCampaignId: string | null
  name: string
  objective: string
  status: string
  totalBudget: number
  totalSpend: number
  matchScore: number
  autoScale: boolean
  lastScaledAt: string | null
  createdAt: string
  updatedAt: string
  adSets?: AdSet[]
}

export interface AdSet {
  id: string
  metaAdSetId: string | null
  name: string
  campaignId: string
  regionId: string
  budget: number
  budgetCurrency: string
  dailySpend: number
  cpl: number
  leadCount: number
  audienceType: string
  targetingJson: string | null
  status: string
  scaleDirection: string | null
  lastBudgetInc: string | null
  killSwitchTriggered: boolean
  createdAt: string
  updatedAt: string
  region?: Region
  campaign?: Campaign
}

export interface Lead {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  country: string
  regionId: string
  route: string
  visaType: string | null
  hasCriminalRecord: boolean | null
  investmentCapacity: string | null
  hasUniversityDegree: boolean | null
  hasUsFamily: boolean | null
  solvencyVerified: boolean | null
  qualificationScore: number
  status: string
  chatSessionId: string | null
  source: string
  metaAdId: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  region?: Region
  payments?: Payment[]
}

export interface Payment {
  id: string
  leadId: string
  amount: number
  currency: string
  amountUsd: number
  exchangeRate: number
  gateway: string
  gatewayRefId: string | null
  status: string
  description: string | null
  paidAt: string | null
  createdAt: string
  updatedAt: string
  lead?: Lead
}

export interface Metric {
  id: string
  regionId: string
  date: string
  totalSpend: number
  leadCount: number
  qualifiedCount: number
  paidCount: number
  cpql: number
  cpl: number
  revenue: number
  matchScore: number
  currency: string
  createdAt: string
  region?: Region
}

export interface CAPIEvent {
  id: string
  eventId: string
  eventName: string
  sourceUrl: string | null
  country: string | null
  userAgent: string | null
  ipHash: string | null
  fbclid: string | null
  fbp: string | null
  eventTime: string
  sentToMeta: boolean
  metaResponse: string | null
  createdAt: string
}

export interface DashboardMetrics {
  totalSpend: number
  totalLeads: number
  avgCpql: number
  paidConsultations: number
  matchScore: number
  totalRevenue: number
  completedPayments: number
  conversionRate: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// =============================================
// HELPERS
// =============================================
interface ApiResponse<T> {
  exito?: boolean
  datos?: T
  message?: string
  error?: string
}

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(endpoint, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Error de servidor' }))
    throw new Error(error.error || error.message || `Error ${res.status}`)
  }
  const data = await res.json()
  // Handle wrapped response format {exito: true, datos: [...]}
  if (data && typeof data === 'object' && 'exito' in data && 'datos' in data) {
    return data.datos as T
  }
  return data as T
}

// =============================================
// FETCH FUNCTIONS
// =============================================
export async function fetchRegions(): Promise<Region[]> {
  return apiFetch<Region[]>('/api/regions')
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  return apiFetch<Campaign[]>('/api/campaigns')
}

export async function fetchAdSets(campaignId?: string): Promise<AdSet[]> {
  const params = campaignId ? `?campaignId=${campaignId}` : ''
  return apiFetch<AdSet[]>(`/api/adsets${params}`)
}

export async function fetchLeads(params?: {
  status?: string
  route?: string
  regionId?: string
  search?: string
}): Promise<Lead[]> {
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set('status', params.status)
  if (params?.route) searchParams.set('route', params.route)
  if (params?.regionId) searchParams.set('regionId', params.regionId)
  if (params?.search) searchParams.set('search', params.search)
  const qs = searchParams.toString()
  return apiFetch<Lead[]>(`/api/leads${qs ? `?${qs}` : ''}`)
}

export async function fetchPayments(): Promise<Payment[]> {
  return apiFetch<Payment[]>('/api/payments')
}

export async function fetchMetrics(regionId?: string): Promise<Metric[]> {
  const params = regionId && regionId !== 'ALL' ? `?regionId=${regionId}` : ''
  return apiFetch<Metric[]>(`/api/metrics${params}`)
}

export async function fetchDashboardMetrics(regionId?: string): Promise<DashboardMetrics> {
  const params = regionId && regionId !== 'ALL' ? `?regionId=${regionId}` : ''
  return apiFetch<DashboardMetrics>(`/api/metrics/dashboard${params}`)
}

export async function fetchCAPIEvents(): Promise<CAPIEvent[]> {
  return apiFetch<CAPIEvent[]>('/api/capi-events')
}

// =============================================
// CREATE / UPDATE FUNCTIONS
// =============================================
export async function createCampaign(data: Partial<Campaign>): Promise<Campaign> {
  return apiFetch<Campaign>('/api/campaigns', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateAdSet(id: string, data: Partial<AdSet>): Promise<AdSet> {
  return apiFetch<AdSet>(`/api/adsets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function createLead(data: Partial<Lead>): Promise<Lead> {
  return apiFetch<Lead>('/api/leads', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
  return apiFetch<Lead>(`/api/leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function createPayment(data: Partial<Payment>): Promise<Payment> {
  return apiFetch<Payment>('/api/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function createRegion(data: Partial<Region>): Promise<Region> {
  return apiFetch<Region>('/api/regions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateRegion(id: string, data: Partial<Region>): Promise<Region> {
  return apiFetch<Region>(`/api/regions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteRegion(id: string): Promise<void> {
  return apiFetch<void>(`/api/regions/${id}`, {
    method: 'DELETE',
  })
}

// =============================================
// SPECIAL FUNCTIONS
// =============================================
export async function sendChatMessage(message: string, sessionId?: string): Promise<{ reply: string; nextStep: string; completed: boolean; sessionId: string }> {
  return apiFetch<{ reply: string; nextStep: string; completed: boolean; sessionId: string }>('/api/chatbot', {
    method: 'POST',
    body: JSON.stringify({
      message,
      visitorId: sessionId || crypto.randomUUID(),
      sessionId,
    }),
  })
}

export async function executeAutomation(): Promise<{ accionEjecutada: string; resultados: Array<{ accion: string; detalles: string[]; afectados: number }> }> {
  return apiFetch<{ accionEjecutada: string; resultados: Array<{ accion: string; detalles: string[]; afectados: number }> }>('/api/automation', {
    method: 'POST',
    body: JSON.stringify({ action: 'RUN_ALL' }),
  })
}

export async function seedDatabase(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/api/seed', {
    method: 'POST',
  })
}

export async function sendCAPIEvent(data: {
  eventName: string
  country?: string
  sourceUrl?: string
  eventId?: string
}): Promise<CAPIEvent> {
  return apiFetch<CAPIEvent>('/api/capi-events', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// =============================================
// TIPOS META / FACEBOOK
// =============================================
export interface MetaCredential {
  id: string
  appId: string
  appSecret: string
  accessToken: string
  tokenExpiresAt: string | null
  refreshToken: string | null
  accountId: string | null
  pixelId: string | null
  businessId: string | null
  graphApiVersion: string
  scope: string | null
  isConnected: boolean
  lastSyncAt: string | null
  connectionStatus: string
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

export interface MetaStatus {
  connected: boolean
  accountId?: string
  businessId?: string
  pixelId?: string
  tokenExpiresAt?: string
  scopes?: string[]
  lastSyncAt?: string
  error?: string
}

export interface ConnectionTestResult {
  exito: boolean
  datos?: {
    conectado: boolean
    tokenValido: boolean
    scopes: string[]
    error?: string
  }
  error?: string
}

// =============================================
// FUNCIONES META / FACEBOOK
// =============================================
export async function fetchMetaStatus(): Promise<MetaStatus> {
  return apiFetch<MetaStatus>('/api/meta/status')
}

export async function saveMetaCredentials(data: {
  appId: string
  appSecret: string
  accessToken: string
  accountId?: string
  pixelId?: string
  businessId?: string
  graphApiVersion?: string
}): Promise<MetaCredential> {
  return apiFetch<MetaCredential>('/api/meta/auth', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function disconnectMeta(): Promise<void> {
  return apiFetch<void>('/api/meta/auth', { method: 'DELETE' })
}

export async function testMetaConnection(): Promise<ConnectionTestResult> {
  return apiFetch<ConnectionTestResult>('/api/meta/status', { method: 'POST' })
}

export async function syncMetaData(type: 'campaigns' | 'insights' | 'all', dateRange?: { from: string; to: string }): Promise<{ synced: number; created: number; updated: number }> {
  return apiFetch<{ synced: number; created: number; updated: number }>('/api/meta/sync', {
    method: 'POST',
    body: JSON.stringify({ type, dateRange }),
  })
}

export async function getMetaOAuthUrl(): Promise<{ url: string; redirectUri: string }> {
  return apiFetch<{ url: string; redirectUri: string }>('/api/meta/auth')
}
