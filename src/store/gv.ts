"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

/// Filter-Parameter fuer die Wohnungssuche
export interface SearchFilters {
  canton: string
  city: string
  zip: string
  maxRent: string
  minRooms: string
  q: string
  sort: "rent-asc" | "rent-desc" | "rooms-desc" | "area-desc" | "newest"
}

export const defaultFilters: SearchFilters = {
  canton: "",
  city: "",
  zip: "",
  maxRent: "",
  minRooms: "",
  q: "",
  sort: "rent-asc",
}

type ModalType = "none" | "auth" | "paywall" | "account" | "detail" | "checkout-success"

interface SessionInfo {
  id: string
  email: string
  name?: string | null
  subscriptionStatus: string
}

interface UIState {
  // Suche / Filter
  filters: SearchFilters
  setFilters: (f: Partial<SearchFilters>) => void
  resetFilters: () => void

  // Modals
  activeModal: ModalType
  authMode: "login" | "register"
  paywallPropertyId: string | null
  detailPropertyId: string | null
  openAuth: (mode?: "login" | "register") => void
  openPaywall: (propertyId?: string | null) => void
  openAccount: () => void
  openDetail: (propertyId: string) => void
  openCheckoutSuccess: () => void
  closeModal: () => void

  // Session
  session: SessionInfo | null
  sessionLoading: boolean
  setSession: (s: SessionInfo | null) => void
  setSessionLoading: (b: boolean) => void
  refreshSessionFlag: number
  triggerRefreshSession: () => void
}

export const useGV = create<UIState>()(
  persist(
    (set) => ({
      filters: defaultFilters,
      setFilters: (f) =>
        set((s) => ({ filters: { ...s.filters, ...f } })),
      resetFilters: () => set({ filters: defaultFilters }),

      activeModal: "none",
      authMode: "login",
      paywallPropertyId: null,
      detailPropertyId: null,
      openAuth: (mode = "login") =>
        set({ activeModal: "auth", authMode: mode }),
      openPaywall: (propertyId = null) =>
        set({ activeModal: "paywall", paywallPropertyId: propertyId }),
      openAccount: () => set({ activeModal: "account" }),
      openDetail: (propertyId) =>
        set({ activeModal: "detail", detailPropertyId: propertyId }),
      openCheckoutSuccess: () => set({ activeModal: "checkout-success" }),
      closeModal: () =>
        set({
          activeModal: "none",
          paywallPropertyId: null,
          detailPropertyId: null,
        }),

      session: null,
      sessionLoading: true,
      setSession: (s) => set({ session: s, sessionLoading: false }),
      setSessionLoading: (b) => set({ sessionLoading: b }),
      refreshSessionFlag: 0,
      triggerRefreshSession: () =>
        set((s) => ({ refreshSessionFlag: s.refreshSessionFlag + 1 })),
    }),
    {
      name: "gv-wohnungen-ui",
      // Nur Filter persistieren, nicht die Modals/Session
      partialize: (s) => ({ filters: s.filters }),
      merge: (persisted, current) => {
        // Nur filters aus dem Speicher uebernehmen, Rest bleibt initial
        const p = (persisted as any) ?? {}
        return { ...current, filters: p.filters ?? current.filters }
      },
    },
  ),
)
