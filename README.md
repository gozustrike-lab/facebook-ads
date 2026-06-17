# 🏛️ ImmiScale Meta Engine v5 — Global Edition

Sistema autónomo multinacional de adquisición de clientes para **Abogados de Inmigración** que operan en EE.UU. y captan clientes en Perú, Latinoamérica y el mundo.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-cyan) ![Prisma](https://img.shields.io/badge/Prisma-SQLite-indigo) ![Playwright](https://img.shields.io/badge/Playwright-E2E-green)

---

## 🌍 Arquitectura del Sistema

| Módulo | Descripción |
|--------|-------------|
| **Meta Ads Automation** | Escalado Horizontal/Vertical, Kill-Switch Regional (1.5x CPL) |
| **Chatbot Multi-Ruta** | In-Country US (asilo, visas, criminal) / Out-Country Global (EB-2 NIW, inversión) |
| **Pagos Multidivisa** | USD, PEN, COP, MXN vía Stripe, MercadoPago, Niubiz, Culqi |
| **Dashboard Global** | 6 tabs con KPIs, gráficos Recharts, selector de región, modo oscuro |
| **Meta Graph API v21.0** | OAuth 2.0, CAPI con SHA-256, targeting por país, custom audiences |
| **CI/CD** | GitHub Actions + Playwright E2E tests + Rate limiting |

---

## 🚀 Quick Start

```bash
# 1. Clonar
git clone https://github.com/gozustrike-lab/facebook-ads.git
cd facebook-ads

# 2. Instalar dependencias
bun install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Inicializar base de datos
bun run db:push
bun run db:generate

# 5. Iniciar servidor
bun run dev

# 6. Poblar datos demo (desde el dashboard o API)
curl -X POST http://localhost:3000/api/seed
```

---

## 📋 Variables de Entorno Requeridas

Ver [`.env.example`](./.env.example) para la lista completa.

### Mínimas para funcionar:
```env
DATABASE_URL="file:./db/custom.db"
```

### Para conexión con Meta:
```env
META_APP_ID="tu_app_id"
META_APP_SECRET="tu_app_secret"
META_ACCESS_TOKEN="tu_token_larga_duracion"
META_AD_ACCOUNT_ID="act_123456789"
META_PIXEL_ID="tu_pixel_id"
```

### Para pagos:
```env
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

---

## 🧪 Testing

```bash
# Correr todos los tests E2E
bun run test

# Tests con UI interactiva
bun run test:ui

# Tests con navegador visible
bun run test:headed

# Ver reporte
bun run test:report
```

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── automation/     # Escalado V/H, Kill-Switch
│   │   ├── campaigns/      # CRUD campañas + Meta sync
│   │   ├── capi/           # Meta Conversions API
│   │   ├── capi-events/    # Log de eventos CAPI
│   │   ├── chatbot/        # Chatbot multi-ruta
│   │   ├── health/         # Health check endpoint
│   │   ├── leads/          # CRUD leads pre-calificados
│   │   ├── meta/
│   │   │   ├── auth/       # OAuth 2.0 flow
│   │   │   ├── status/     # Estado de conexión Meta
│   │   │   ├── sync/       # Sincronización de datos
│   │   │   └── webhook/    # Webhooks con HMAC-SHA256
│   │   ├── metrics/        # Métricas diarias + dashboard
│   │   ├── payments/       # Pagos multidivisa
│   │   ├── regions/        # CRUD regiones
│   │   └── seed/           # Datos demo
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx            # Dashboard principal
├── components/
│   ├── dashboard/          # 10 componentes del dashboard
│   ├── ErrorBoundary.tsx
│   └── ui/                 # 50+ shadcn/ui components
├── lib/
│   ├── api.ts              # API client tipado
│   ├── db.ts               # Prisma client
│   ├── meta-api.ts         # Meta Graph API service (1200+ líneas)
│   ├── store.ts            # Zustand store
│   └── utils.ts
├── hooks/
└── middleware.ts           # Rate limiting + security headers
```

---

## 🔌 Conectar con Facebook Developer

1. Ve a **Ajustes → Meta Connection**
2. Expande **"Configuración de Credenciales"**
3. Ingresa tu App ID, App Secret y Access Token
4. O usa el botón **"Conectar con Facebook"** para OAuth automático
5. Haz clic en **"Probar Conexión"**

Permisos requeridos: `ads_management`, `ads_read`, `business_management`

---

## 🔒 Seguridad

- Rate limiting por IP y ruta (middleware)
- SHA-256 hashing para CAPI user_data
- HMAC-SHA256 para webhook verification
- Security headers (X-Frame-Options, CSP, etc.)
- Tokens encriptados en base de datos (producción)
- `.env` excluido del repositorio

---

## 📊 Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/regions` | Gestión de regiones |
| GET/POST | `/api/campaigns` | Campañas + Meta sync |
| GET/POST/PUT | `/api/adsets` | AdSets + presupuesto |
| GET/POST/PUT | `/api/leads` | Leads pre-calificados |
| GET/POST | `/api/payments` | Pagos multidivisa |
| GET/POST | `/api/metrics` | Métricas diarias |
| GET | `/api/metrics/dashboard` | Resumen KPIs |
| POST | `/api/chatbot` | Chatbot conversacional |
| GET/POST | `/api/automation` | Escalado + Kill-Switch |
| GET/POST | `/api/capi` | Meta Conversions API |
| GET/POST/DELETE | `/api/meta/auth` | OAuth + credenciales |
| GET | `/api/meta/status` | Estado conexión Meta |
| POST | `/api/meta/sync` | Sincronización |
| GET/POST | `/api/meta/webhook` | Webhooks |
| GET | `/api/health` | Health check |
| POST | `/api/seed` | Datos demo |

---

## 🗺️ Roadmap

- [ ] Stripe integration con webhooks reales
- [ ] Pasarelas locales (MercadoPago, Niubiz, Culqi)
- [ ] App Android nativa (Kotlin/Jetpack Compose)
- [ ] Notificaciones push (Firebase)
- [ ] Dashboard de analytics avanzado
- [ ] Multi-tenant para múltiples abogados
- [ ] Exportación de reportes PDF/Excel
- [ ] Auditoría y logs de actividad

---

## 📝 Licencia

Propietario — Uso exclusivo bajo autorización.
