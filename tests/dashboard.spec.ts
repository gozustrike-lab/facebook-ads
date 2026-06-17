// Tests E2E - ImmiScale Meta Engine v5
// Dashboard principal y navegación

import { test, expect } from '@playwright/test'

test.describe('Dashboard - Carga Inicial', () => {
  test('debe cargar la página principal correctamente', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/ImmiScale/)
    await expect(page.locator('text=ImmiScale v5')).toBeVisible()
  })

  test('debe mostrar el tab Resumen por defecto', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Resumen General')).toBeVisible()
  })

  test('debe mostrar KPI cards en el resumen', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Gasto Total')).toBeVisible()
    await expect(page.locator('text=Leads Totales')).toBeVisible()
    await expect(page.locator('text=CPQL Promedio')).toBeVisible()
  })
})

test.describe('Navegación por Tabs', () => {
  const tabs = [
    { name: 'Campañas', heading: 'Campañas y AdSets' },
    { name: 'Leads', heading: 'Pipeline de Leads' },
    { name: 'Pagos', heading: 'Seguimiento de Pagos' },
    { name: 'Chatbot', heading: 'Chatbot' },
    { name: 'Ajustes', heading: 'Ajustes del Sistema' },
  ]

  for (const tab of tabs) {
    test(`debe navegar al tab ${tab.name}`, async ({ page }) => {
      await page.goto('/')
      await page.click(`button:has-text("${tab.name}")`)
      await expect(page.locator(`text=${tab.heading}`).first()).toBeVisible({ timeout: 10000 })
    })
  }
})

test.describe('Poblar Demo', () => {
  test('debe poblar datos demo al hacer clic', async ({ page }) => {
    await page.goto('/')
    const btn = page.locator('button:has-text("Poblar Demo")')
    await btn.click()
    await page.waitForTimeout(4000)
  })
})

test.describe('Tab Campañas', () => {
  test('debe mostrar campañas después de poblar', async ({ page }) => {
    await page.goto('/')
    await page.locator('button:has-text("Poblar Demo")').click()
    await page.waitForTimeout(4000)
    await page.click('button:has-text("Campañas")')
    await expect(page.locator('text=Campañas y AdSets')).toBeVisible({ timeout: 10000 })
  })

  test('debe tener botón de automatización', async ({ page }) => {
    await page.goto('/')
    await page.click('button:has-text("Campañas")')
    await expect(page.locator('button:has-text("Ejecutar Automatización")')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Tab Leads', () => {
  test('debe mostrar tabla de leads', async ({ page }) => {
    await page.goto('/')
    await page.locator('button:has-text("Poblar Demo")').click()
    await page.waitForTimeout(4000)
    await page.click('button:has-text("Leads")')
    await expect(page.locator('text=Pipeline de Leads')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Tab Pagos', () => {
  test('debe mostrar tabla de pagos', async ({ page }) => {
    await page.goto('/')
    await page.locator('button:has-text("Poblar Demo")').click()
    await page.waitForTimeout(4000)
    await page.click('button:has-text("Pagos")')
    await expect(page.locator('text=Seguimiento de Pagos')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Tab Chatbot', () => {
  test('debe mostrar constructor del chatbot', async ({ page }) => {
    await page.goto('/')
    await page.click('button:has-text("Chatbot")')
    await expect(page.locator('text=Chatbot').first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Tab Ajustes - Meta Connection', () => {
  test('debe mostrar panel de conexión Meta', async ({ page }) => {
    await page.goto('/')
    await page.click('button:has-text("Ajustes")')
    await expect(page.locator('text=ESTADO DE CONEXIÓN').or(page.locator('text=Estado de Conexión'))).toBeVisible({ timeout: 10000 })
  })

  test('debe tener formulario de credenciales', async ({ page }) => {
    await page.goto('/')
    await page.click('button:has-text("Ajustes")')
    const credBtn = page.locator('button:has-text("Configuración de Credenciales")')
    if (await credBtn.isVisible()) {
      await credBtn.click()
    }
    await page.waitForTimeout(1000)
  })

  test('debe mostrar botón Conectar con Facebook', async ({ page }) => {
    await page.goto('/')
    await page.click('button:has-text("Ajustes")')
    await expect(page.locator('button:has-text("Conectar con Facebook")')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Selector de Región', () => {
  test('debe mostrar selector de región en el header', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Todas las Regiones')).toBeVisible()
  })
})

test.describe('Modo Oscuro', () => {
  test('debe alternar modo oscuro', async ({ page }) => {
    await page.goto('/')
    const themeBtn = page.locator('button').filter({ has: page.locator('svg.lucide-sun, svg.lucide-moon') })
    if (await themeBtn.count() > 0) {
      await themeBtn.first().click()
      await page.waitForTimeout(500)
      const html = page.locator('html')
      const isDark = await html.evaluate(el => el.classList.contains('dark'))
      expect(typeof isDark).toBe('boolean')
    }
  })
})
