"use client"

import { useQuery } from "@tanstack/react-query"
import { useGV } from "@/store/gv"
import type { PropertiesResponse } from "@/lib/types"

/// Baut die Query-URL aus den aktiven Filtern.
function buildQueryUrl(filters: ReturnType<typeof useGV.getState>["filters"]) {
  const params = new URLSearchParams()
  if (filters.canton) params.set("canton", filters.canton)
  if (filters.city) params.set("city", filters.city)
  if (filters.zip) params.set("zip", filters.zip)
  if (filters.maxRent) params.set("maxRent", filters.maxRent)
  if (filters.minRooms) params.set("minRooms", filters.minRooms)
  if (filters.q) params.set("q", filters.q)
  params.set("sort", filters.sort)
  return `/api/properties?${params.toString()}`
}

export function useProperties() {
  const filters = useGV((s) => s.filters)
  const refreshFlag = useGV((s) => s.refreshSessionFlag)

  return useQuery<PropertiesResponse>({
    queryKey: ["properties", filters, refreshFlag],
    queryFn: async () => {
      const res = await fetch(buildQueryUrl(filters), { cache: "no-store" })
      if (!res.ok) throw new Error("Fehler beim Laden der Wohnungen")
      return res.json()
    },
    // Kurze Debounce-aehnliche Verzoegerung verhindert zu viele Requests beim Tippen
    staleTime: 30_000,
  })
}
