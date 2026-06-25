'use client'

import React, { useState } from 'react'
import { useAppStore, TabType } from '@/lib/store'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { OverviewTab } from '@/components/dashboard/OverviewTab'
import { CampaignsTab } from '@/components/dashboard/CampaignsTab'
import { LeadsTab } from '@/components/dashboard/LeadsTab'
import { PaymentsTab } from '@/components/dashboard/PaymentsTab'
import { ChatbotTab } from '@/components/dashboard/ChatbotTab'
import { SettingsTab } from '@/components/dashboard/SettingsTab'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchRegions, seedDatabase } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Globe,
  Moon,
  Sun,
  Database,
  Loader2,
  Zap,
  Menu,
  LayoutDashboard,
  Megaphone,
  Users,
  CreditCard,
  MessageSquare,
  Settings,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

const TAB_COMPONENTS: Record<TabType, React.ComponentType> = {
  overview: OverviewTab,
  campaigns: CampaignsTab,
  leads: LeadsTab,
  payments: PaymentsTab,
  chatbot: ChatbotTab,
  settings: SettingsTab,
}

const TAB_TITLES: Record<TabType, string> = {
  overview: 'Resumen General',
  campaigns: 'Campañas y AdSets',
  leads: 'Pipeline de Leads',
  payments: 'Seguimiento de Pagos',
  chatbot: 'Chatbot Constructor',
  settings: 'Ajustes del Sistema',
}

const NAV_ITEMS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Resumen', icon: LayoutDashboard },
  { id: 'campaigns', label: 'Campañas', icon: Megaphone },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'payments', label: 'Pagos', icon: CreditCard },
  { id: 'chatbot', label: 'Chatbot', icon: MessageSquare },
  { id: 'settings', label: 'Ajustes', icon: Settings },
]

function MobileRegionSelector({
  selectedRegion,
  setSelectedRegion,
  regions,
}: {
  selectedRegion: string
  setSelectedRegion: (region: string) => void
  regions: { id: string; code: string; name: string }[] | undefined
}) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => setOpen(true)}
      >
        <Globe className="h-4 w-4 text-primary" />
      </Button>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle>Seleccionar Región</SheetTitle>
        </SheetHeader>
        <div className="space-y-1 py-4">
          <button
            onClick={() => { setSelectedRegion('ALL'); setOpen(false) }}
            className={cn(
              'w-full text-left px-4 py-3 rounded-lg text-sm transition-colors',
              selectedRegion === 'ALL' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
            )}
          >
            🌍 Todas las Regiones
          </button>
          {regions?.map((r) => (
            <button
              key={r.id}
              onClick={() => { setSelectedRegion(r.id); setOpen(false) }}
              className={cn(
                'w-full text-left px-4 py-3 rounded-lg text-sm transition-colors',
                selectedRegion === r.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
              )}
            >
              {r.code} — {r.name}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function Dashboard() {
  const { activeTab, setActiveTab, selectedRegion, setSelectedRegion, mobileMenuOpen, setMobileMenuOpen } = useAppStore()
  const { theme, setTheme } = useTheme()
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()

  const { data: regions } = useQuery({
    queryKey: ['regions'],
    queryFn: fetchRegions,
  })

  // Auto-inicializar la base de datos si no hay regiones
  const [dbInitialized, setDbInitialized] = useState(false)
  React.useEffect(() => {
    if (!dbInitialized && regions !== undefined) {
      if (regions.length === 0) {
        // Primero intentar /api/setup (crea tablas con raw SQL + seed)
        fetch('/api/setup')
          .then(r => r.json())
          .then(data => {
            console.log('[Dashboard] Auto-setup DB:', data)
            if (data.exito) {
              queryClient.invalidateQueries({ queryKey: ['regions'] })
              queryClient.invalidateQueries({ queryKey: ['meta-status'] })
              queryClient.invalidateQueries({ queryKey: ['campaigns'] })
              toast.success('Base de datos inicializada')
            }
          })
          .catch(err => console.warn('[Dashboard] Auto-setup failed:', err))
      }
      setDbInitialized(true)
    }
  }, [regions, dbInitialized, queryClient])

  const seedMutation = useMutation({
    mutationFn: seedDatabase,
    onSuccess: (data) => {
      toast.success(data.message)
      queryClient.invalidateQueries()
    },
    onError: () => {
      toast.error('Error al poblar la base de datos')
    },
  })

  const TabComponent = TAB_COMPONENTS[activeTab]

  return (
    <div className="flex h-dvh overflow-hidden bg-background max-w-[100vw]">
      {/* Sidebar - hidden on mobile, visible on desktop */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header - compact on mobile */}
        <header className={cn(
          'border-b border-border bg-card flex items-center justify-between shrink-0',
          isMobile ? 'h-12 px-3' : 'h-14 px-4'
        )}>
          <div className="flex items-center gap-2">
            {/* Hamburger menu - mobile only */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden h-8 w-8 p-0"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Logo on mobile (when no hamburger area) */}
            <div className="flex items-center gap-2 lg:hidden md:hidden">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground">
                <Zap className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Title - shows active tab short name on mobile, full title on desktop */}
            <h2 className={cn(
              'font-bold text-foreground truncate',
              isMobile ? 'text-xs' : 'text-sm hidden sm:block'
            )}>
              {isMobile ? NAV_ITEMS.find(i => i.id === activeTab)?.label : TAB_TITLES[activeTab]}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Region Selector - icon sheet on mobile, full select on desktop */}
            {isMobile ? (
              <MobileRegionSelector
                selectedRegion={selectedRegion}
                setSelectedRegion={setSelectedRegion}
                regions={regions}
              />
            ) : (
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-[130px] sm:w-[160px] h-8 text-xs">
                  <Globe className="h-3.5 w-3.5 mr-1.5 text-primary" />
                  <SelectValue placeholder="Región" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">🌍 Todas las Regiones</SelectItem>
                  {regions?.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.code} — {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Seed Demo Data Button - icon only on mobile */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className={cn('h-8 gap-1.5', isMobile ? 'w-8 p-0' : 'text-xs')}
            >
              {seedMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Database className="h-3.5 w-3.5" />
              )}
              {!isMobile && <span>Demo Data</span>}
            </Button>

            {/* Dark Mode Toggle */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-8 w-8 p-0"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </header>

        {/* Tab Content */}
        <main className={cn(
          'flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar',
          isMobile ? 'pb-20 p-3' : 'p-4 sm:p-6'
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabComponent />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer - hidden on mobile (bottom tab bar replaces it) */}
        {!isMobile && (
          <footer className="h-8 border-t border-border bg-card flex items-center justify-center px-4 shrink-0">
            <p className="text-[10px] text-muted-foreground">
              AdScale OS © {new Date().getFullYear()}
            </p>
          </footer>
        )}
      </div>

      {/* Bottom Tab Bar - mobile only */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-bottom">
          <nav className="flex justify-around items-center h-14 px-1 max-w-[100vw] overflow-x-hidden">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 px-1 py-1 min-w-0 rounded-md transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                  <span className={cn(
                    'truncate max-w-[60px] leading-none',
                    isActive ? 'text-[10px] font-semibold' : 'text-[9px]'
                  )}>
                    {item.label}
                  </span>
                </button>
              )
            })}
          </nav>
          {/* Safe area padding for notched phones */}
          <div className="h-[env(safe-area-inset-bottom,0px)]" />
        </div>
      )}
    </div>
  )
}
