import { create } from 'zustand'

export type TabType = 'overview' | 'campaigns' | 'leads' | 'payments' | 'chatbot' | 'settings'

interface AppState {
  activeTab: TabType
  selectedRegion: string
  sidebarCollapsed: boolean
  mobileMenuOpen: boolean
  setActiveTab: (tab: TabType) => void
  setSelectedRegion: (region: string) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setMobileMenuOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'overview',
  selectedRegion: 'ALL',
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  setActiveTab: (tab) => set({ activeTab: tab, mobileMenuOpen: false }),
  setSelectedRegion: (region) => set({ selectedRegion: region }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
}))
