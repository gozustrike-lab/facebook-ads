'use client'

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
import { Globe, Moon, Sun, Database, Loader2, Scale } from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

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

export default function Dashboard() {
  const { activeTab, selectedRegion, setSelectedRegion } = useAppStore()
  const { theme, setTheme } = useTheme()
  const queryClient = useQueryClient()

  const { data: regions } = useQuery({
    queryKey: ['regions'],
    queryFn: fetchRegions,
  })

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
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
                <Scale className="h-4 w-4" />
              </div>
            </div>
            <h2 className="text-sm font-bold text-foreground hidden sm:block">
              {TAB_TITLES[activeTab]}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Region Selector */}
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

            {/* Seed Demo Data Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="h-8 text-xs gap-1.5"
            >
              {seedMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Database className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Poblar Demo</span>
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
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
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

        {/* Footer */}
        <footer className="h-8 border-t border-border bg-card flex items-center justify-center px-4 shrink-0">
          <p className="text-[10px] text-muted-foreground">
            ImmiScale Meta Engine v5 — Global Edition © {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  )
}
