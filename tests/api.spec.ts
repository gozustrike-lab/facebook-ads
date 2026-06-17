// Tests E2E - API Routes
// Verifica que los endpoints respondan correctamente

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

test.describe('API - Regiones', () => {
  test('GET /api/regions debe retornar regiones', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/regions`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.exito).toBe(true)
    expect(Array.isArray(body.datos)).toBeTruthy()
  })
})

test.describe('API - Campañas', () => {
  test('GET /api/campaigns debe retornar campañas', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/campaigns`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.exito).toBe(true)
  })
})

test.describe('API - Leads', () => {
  test('GET /api/leads debe retornar leads', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/leads`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.exito).toBe(true)
  })

  test('GET /api/leads con filtros', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/leads?status=NEW&route=IN_COUNTRY_US`)
    expect(res.ok()).toBeTruthy()
  })
})

test.describe('API - Pagos', () => {
  test('GET /api/payments debe retornar pagos', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/payments`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.exito).toBe(true)
  })
})

test.describe('API - Métricas', () => {
  test('GET /api/metrics debe retornar métricas', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/metrics`)
    expect(res.ok()).toBeTruthy()
  })

  test('GET /api/metrics/dashboard debe retornar resumen', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/metrics/dashboard`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.totalSpend).toBeDefined()
    expect(body.totalLeads).toBeDefined()
  })
})

test.describe('API - Chatbot', () => {
  test('POST /api/chatbot debe procesar mensaje', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/chatbot`, {
      data: {
        message: 'Hola',
        visitorId: 'test-visitor-123',
        currentStep: 'GREETING',
      },
    })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.reply).toBeDefined()
    expect(body.nextStep).toBeDefined()
  })
})

test.describe('API - Automatización', () => {
  test('GET /api/automation debe retornar estado', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/automation`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.datos.resumen).toBeDefined()
  })
})

test.describe('API - Meta Status', () => {
  test('GET /api/meta/status debe retornar estado', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/meta/status`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.connected).toBeDefined()
  })
})

test.describe('API - Seed', () => {
  test('POST /api/seed debe poblar datos demo', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/seed`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.message).toBeDefined()
  })
})

test.describe('API - CAPI Events', () => {
  test('GET /api/capi-events debe retornar eventos', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/capi-events`)
    expect(res.ok()).toBeTruthy()
  })
})
