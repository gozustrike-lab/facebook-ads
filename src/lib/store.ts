import { create } from 'zustand'

export type TabType = 'overview' | 'campaigns' | 'leads' | 'payments' | 'chatbot' | 'settings'

interface AppState {
  activeTab: TabType
  selectedRegion: string
  sidebarCollapsed: boolean
  setActiveTab: (tab: TabType) => void
  setSelectedRegion: (region: string) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'overview',
  selectedRegion: 'ALL',
  sidebarCollapsed: false,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedRegion: (region) => set({ selectedRegion: region }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}))
