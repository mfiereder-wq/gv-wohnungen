"use client"

import { useState } from "react"
import { Search, RotateCcw, SlidersHorizontal, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useGV, defaultFilters } from "@/store/gv"

const CANTONS = [
  "Zürich",
  "Bern",
  "Luzern",
  "Uri",
  "Schwyz",
  "Obwalden",
  "Nidwalden",
  "Glarus",
  "Zug",
  "Fribourg",
  "Solothurn",
  "Basel-Stadt",
  "Basel-Landschaft",
  "Schaffhausen",
  "Appenzell Ausserrhoden",
  "Appenzell Innerrhoden",
  "St. Gallen",
  "Graubünden",
  "Aargau",
  "Thurgau",
  "Ticino",
  "Vaud",
  "Valais",
  "Neuchâtel",
  "Genève",
  "Jura",
]

const MAX_RENT_OPTIONS = [
  { value: "", label: "keine Begrenzung" },
  { value: "800", label: "bis CHF 800.–" },
  { value: "1000", label: "bis CHF 1'000.–" },
  { value: "1200", label: "bis CHF 1'200.–" },
  { value: "1500", label: "bis CHF 1'500.–" },
  { value: "1800", label: "bis CHF 1'800.–" },
  { value: "2000", label: "bis CHF 2'000.–" },
  { value: "2500", label: "bis CHF 2'500.–" },
  { value: "3000", label: "bis CHF 3'000.–" },
]

const MIN_ROOMS_OPTIONS = [
  { value: "", label: "egal" },
  { value: "1", label: "ab 1 Zimmer" },
  { value: "1.5", label: "ab 1½ Zimmer" },
  { value: "2", label: "ab 2 Zimmer" },
  { value: "2.5", label: "ab 2½ Zimmer" },
  { value: "3", label: "ab 3 Zimmer" },
  { value: "3.5", label: "ab 3½ Zimmer" },
  { value: "4", label: "ab 4 Zimmer" },
  { value: "4.5", label: "ab 4½ Zimmer" },
  { value: "5", label: "ab 5 Zimmer" },
]

const SORT_OPTIONS = [
  { value: "rent-asc", label: "Preis: aufsteigend" },
  { value: "rent-desc", label: "Preis: absteigend" },
  { value: "rooms-desc", label: "Zimmer: meisten zuerst" },
  { value: "area-desc", label: "Flaeche: groesste zuerst" },
  { value: "newest", label: "Neueste Inserate" },
]

export function SearchBar() {
  const { filters, setFilters, resetFilters } = useGV()
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow duration-300 focus-within:shadow-md sm:p-5">
      {/* Haupt-Suchleiste */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-4">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="q" className="text-xs font-medium text-muted-foreground">
            Suchbegriff
          </Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="q"
              placeholder="Ort, Kanton oder Stichwort..."
              value={filters.q}
              onChange={(e) => setFilters({ q: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 space-y-1.5">
          <Label htmlFor="canton" className="text-xs font-medium text-muted-foreground">
            Kanton
          </Label>
          <Select
            value={filters.canton || "__all"}
            onValueChange={(v) =>
              setFilters({ canton: v === "__all" ? "" : v })
            }
          >
            <SelectTrigger id="canton" className="w-full">
              <SelectValue placeholder="Alle Kantone" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="__all">Alle Kantone</SelectItem>
              {CANTONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-1.5">
          <Label htmlFor="maxRent" className="text-xs font-medium text-muted-foreground">
            Max. Miete
          </Label>
          <Select
            value={filters.maxRent || "__any"}
            onValueChange={(v) =>
              setFilters({ maxRent: v === "__any" ? "" : v })
            }
          >
            <SelectTrigger id="maxRent" className="w-full">
              <SelectValue placeholder="keine Begrenzung" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {MAX_RENT_OPTIONS.map((o) => (
                <SelectItem key={o.value || "__any"} value={o.value || "__any"}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-1.5">
          <Label htmlFor="minRooms" className="text-xs font-medium text-muted-foreground">
            Min. Zimmer
          </Label>
          <Select
            value={filters.minRooms || "__any"}
            onValueChange={(v) =>
              setFilters({ minRooms: v === "__any" ? "" : v })
            }
          >
            <SelectTrigger id="minRooms" className="w-full">
              <SelectValue placeholder="egal" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {MIN_ROOMS_OPTIONS.map((o) => (
                <SelectItem key={o.value || "__any"} value={o.value || "__any"}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAdvanced((v) => !v)}
          className="gap-2 transition-colors lg:self-end"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="lg:hidden xl:inline">Erweitert</span>
        </Button>
      </div>

      {/* Erweiterte Filter */}
      {showAdvanced && (
        <div className="mt-4 grid gap-3 rounded-xl border border-border bg-secondary/30 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-xs font-medium text-muted-foreground">
              Ortschaft
            </Label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="city"
                placeholder="z. B. Zürich"
                value={filters.city}
                onChange={(e) => setFilters({ city: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zip" className="text-xs font-medium text-muted-foreground">
              PLZ
            </Label>
            <Input
              id="zip"
              placeholder="z. B. 8000"
              value={filters.zip}
              onChange={(e) => setFilters({ zip: e.target.value })}
              inputMode="numeric"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sort" className="text-xs font-medium text-muted-foreground">
              Sortierung
            </Label>
            <Select
              value={filters.sort}
              onValueChange={(v) => setFilters({ sort: v as any })}
            >
              <SelectTrigger id="sort" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => resetFilters()}
              className="w-full justify-start gap-2 text-muted-foreground"
            >
              <RotateCcw className="h-4 w-4" />
              Filter zuruecksetzen
            </Button>
          </div>
        </div>
      )}

      {/* Mobile: Reset */}
      {!showAdvanced && (
        <div className="mt-3 flex justify-end lg:hidden">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => resetFilters()}
            className="gap-2 text-muted-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            Zuruecksetzen
          </Button>
        </div>
      )}
    </div>
  )
}
