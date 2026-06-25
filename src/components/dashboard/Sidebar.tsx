'use client'

import { useAppStore, TabType } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Megaphone,
  Users,
  CreditCard,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Scale,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import { motion } from 'framer-motion'

const NAV_ITEMS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Resumen', icon: LayoutDashboard },
  { id: 'campaigns', label: 'Campañas', icon: Megaphone },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'payments', label: 'Pagos', icon: CreditCard },
  { id: 'chatbot', label: 'Chatbot', icon: MessageSquare },
  { id: 'settings', label: 'Ajustes', icon: Settings },
]

function NavItems({ collapsed, onItemClick }: { collapsed: boolean; onItemClick?: () => void }) {
  const { activeTab, setActiveTab } = useAppStore()

  return (
    <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto custom-scrollbar">
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id
        const Icon = item.icon

        const button = (
          <Button
            key={item.id}
            variant="ghost"
            onClick={() => {
              setActiveTab(item.id)
              onItemClick?.()
            }}
            className={cn(
              'w-full justify-start gap-3 h-10 px-2 transition-all',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            )}
          >
            <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-primary')} />
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm whitespace-nowrap"
              >
                {item.label}
              </motion.span>
            )}
          </Button>
        )

        if (collapsed) {
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>{button}</TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                {item.label}
              </TooltipContent>
            </Tooltip>
          )
        }

        return <div key={item.id}>{button}</div>
      })}
    </nav>
  )
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen } = useAppStore()
  const isMobile = useIsMobile()

  // Mobile: Sheet drawer
  if (isMobile) {
    return (
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
          <SheetHeader className="px-3 h-14 border-b border-sidebar-border flex flex-row items-center gap-2 space-y-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground shrink-0">
              <Scale className="h-5 w-5" />
            </div>
            <div className="overflow-hidden">
              <SheetTitle className="text-sm font-bold text-sidebar-foreground whitespace-nowrap">
                AdScale OS
              </SheetTitle>
              <p className="text-[10px] text-sidebar-foreground/50 whitespace-nowrap">
                AdScale OS
              </p>
            </div>
          </SheetHeader>
          <NavItems collapsed={false} onItemClick={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop: fixed sidebar
  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 64 : 220 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="h-screen bg-sidebar border-r border-sidebar-border flex flex-col sticky top-0 z-30"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-3 h-14 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground shrink-0">
            <Scale className="h-5 w-5" />
          </div>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="overflow-hidden"
            >
              <h1 className="text-sm font-bold text-sidebar-foreground whitespace-nowrap">AdScale OS</h1>
              <p className="text-[10px] text-sidebar-foreground/50 whitespace-nowrap">AdScale OS</p>
            </motion.div>
          )}
        </div>

        {/* Navigation */}
        <NavItems collapsed={sidebarCollapsed} />

        {/* Collapse toggle */}
        <div className="border-t border-sidebar-border p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="w-full justify-center h-8 text-sidebar-foreground/50 hover:text-sidebar-foreground"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}
