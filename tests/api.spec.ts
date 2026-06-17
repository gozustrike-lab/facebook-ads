// Tests E2E - API Routes
// Verifica que los endpoints respondan correctamente

import { test, expect } from '@playwright/test'

test.describe('API - Regiones', () => {
  test('GET /api/regions debe retornar regiones', async ({ request }) => {
    const res = await request.get('/api/regions')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    // Puede venir con wrapper {exito, datos} o como array directo
    const datos = body.datos || body
    expect(Array.isArray(datos)).toBeTruthy()
  })
})

test.describe('API - Campañas', () => {
  test('GET /api/campaigns debe retornar campañas', async ({ request }) => {
    const res = await request.get('/api/campaigns')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    const datos = body.datos || body
    expect(Array.isArray(datos)).toBeTruthy()
  })
})

test.describe('API - Leads', () => {
  test('GET /api/leads debe retornar leads', async ({ request }) => {
    const res = await request.get('/api/leads')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    const datos = body.datos || body
    expect(Array.isArray(datos)).toBeTruthy()
  })

  test('GET /api/leads con filtros', async ({ request }) => {
    const res = await request.get('/api/leads?status=NEW')
    expect(res.ok()).toBeTruthy()
  })
})

test.describe('API - Pagos', () => {
  test('GET /api/payments debe retornar pagos', async ({ request }) => {
    const res = await request.get('/api/payments')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    const datos = body.datos || body
    expect(Array.isArray(datos)).toBeTruthy()
  })
})

test.describe('API - Métricas', () => {
  test('GET /api/metrics debe retornar métricas', async ({ request }) => {
    const res = await request.get('/api/metrics')
    expect(res.ok()).toBeTruthy()
  })

  test('GET /api/metrics/dashboard debe retornar resumen', async ({ request }) => {
    const res = await request.get('/api/metrics/dashboard')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.totalSpend).toBeDefined()
    expect(body.totalLeads).toBeDefined()
  })
})

test.describe('API - Chatbot', () => {
  test('POST /api/chatbot debe procesar mensaje', async ({ request }) => {
    const res = await request.post('/api/chatbot', {
      data: {
        message: 'Hola, necesito ayuda con inmigración',
        visitorId: 'test-e2e-visitor-' + Date.now(),
        currentStep: 'GREETING',
      },
    })
    expect(res.status()).toBeLessThan(500)
    if (res.ok()) {
      const body = await res.json()
      expect(body.reply || body.datos?.reply).toBeDefined()
    }
  })
})

test.describe('API - Automatización', () => {
  test('GET /api/automation debe retornar estado', async ({ request }) => {
    const res = await request.get('/api/automation')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    const datos = body.datos || body
    expect(datos.resumen).toBeDefined()
  })
})

test.describe('API - Meta Status', () => {
  test('GET /api/meta/status debe retornar estado', async ({ request }) => {
    const res = await request.get('/api/meta/status')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.connected).toBeDefined()
  })
})

test.describe('API - Health Check', () => {
  test('GET /api/health debe retornar estado del sistema', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.status).toBeDefined()
    expect(body.checks).toBeDefined()
    expect(body.checks.database).toBeDefined()
  })
})

test.describe('API - Seed', () => {
  test('POST /api/seed debe poblar datos demo', async ({ request }) => {
    const res = await request.post('/api/seed')
    expect(res.status()).toBeLessThan(500)
    if (res.ok()) {
      const body = await res.json()
      expect(body.message || body.datos).toBeDefined()
    }
  })
})

test.describe('API - CAPI Events', () => {
  test('GET /api/capi-events debe retornar eventos', async ({ request }) => {
    const res = await request.get('/api/capi-events')
    expect(res.ok()).toBeTruthy()
  })
})
