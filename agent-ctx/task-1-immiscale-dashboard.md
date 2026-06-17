# ImmiScale Meta Engine v5 - Global Edition Dashboard

## Summary
Built a complete single-page dashboard application for an immigration lawyer client acquisition system using Next.js 16, TypeScript, Tailwind CSS 4, and shadcn/ui.

## Files Created/Modified

### Core Configuration
- `src/app/globals.css` - Updated with emerald/teal primary theme and amber/gold accent
- `src/app/layout.tsx` - Added ThemeProvider, QueryClientProvider, Sonner toaster
- `src/components/providers.tsx` - React Query client provider

### State & API
- `src/lib/store.ts` - Zustand store (activeTab, selectedRegion, sidebarCollapsed)
- `src/lib/api.ts` - Typed API client with automatic `exito/datos` response unwrapping

### Dashboard Components
- `src/components/dashboard/Sidebar.tsx` - Collapsible sidebar with icons
- `src/components/dashboard/KpiCard.tsx` - Reusable KPI card with animations
- `src/components/dashboard/StatusBadge.tsx` - Status badge component
- `src/components/dashboard/OverviewTab.tsx` - KPIs, charts, recent leads, alerts
- `src/components/dashboard/CampaignsTab.tsx` - Campaign cards, adset table, automation
- `src/components/dashboard/LeadsTab.tsx` - Lead pipeline with filters and detail dialog
- `src/components/dashboard/PaymentsTab.tsx` - Payment stats, charts, history
- `src/components/dashboard/ChatbotTab.tsx` - Flow diagram, chat preview, CPL config
- `src/components/dashboard/SettingsTab.tsx` - Regions CRUD, automation rules, CAPI log

### API Routes (leveraging pre-existing implementations)
- `/api/regions` - CRUD regions
- `/api/campaigns` - Campaign management
- `/api/adsets` - AdSet management with scaling
- `/api/leads` - Lead pipeline with filters
- `/api/payments` - Multi-currency payments
- `/api/metrics` - Daily metrics by region
- `/api/metrics/dashboard` - Aggregate dashboard metrics
- `/api/chatbot` - State machine chatbot
- `/api/automation` - Scale vertical/horizontal, kill-switch
- `/api/seed` - Demo data population
- `/api/capi-events` - CAPI event logging

### Main Page
- `src/app/page.tsx` - Full dashboard layout with sidebar, header, tab navigation

## Key Features
- All UI in Spanish
- Emerald/teal primary color scheme (no indigo/blue)
- Dark mode support via next-themes
- TanStack Query for data fetching
- Framer Motion animations
- Responsive design (mobile-first)
- Real-time demo data seeding
- Multi-currency support (USD, PEN, COP, MXN)
- Kill-switch automation engine
