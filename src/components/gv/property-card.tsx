"use client"

import { Lock, MapPin, BedDouble, Maximize, CalendarDays, Eye, Crown, Globe, ExternalLink } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useGV } from "@/store/gv"
import {
  formatRentPerMonth,
  formatRooms,
  formatArea,
  formatAvailable,
  formatCHF,
} from "@/lib/format"
import type { Property } from "@/lib/types"

interface PropertyCardProps {
  property: Property
  hasAccess: boolean
}

export function PropertyCard({ property, hasAccess }: PropertyCardProps) {
  const openDetail = useGV((s) => s.openDetail)
  const openPaywall = useGV((s) => s.openPaywall)
  const openAuth = useGV((s) => s.openAuth)

  const totalMonthly = property.rent + property.utilities
  const image = property.images?.[0] || "/images/wohnung-2.png"

  const handleContactClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasAccess) {
      // Schon freigeschaltet -> Detail oeffnen
      openDetail(property.id)
    } else {
      openPaywall(property.id)
    }
  }

  return (
    <Card
      className="group cursor-pointer overflow-hidden py-0 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:ring-1 hover:ring-primary/20"
      onClick={() => openDetail(property.id)}
    >
      {/* Bild */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <img
          src={image}
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          loading="lazy"
          onError={(e) => {
            const t = e.currentTarget
            if (t.src.indexOf("placeholder") === -1)
              t.src = "/images/placeholder.svg"
          }}
        />
        {/* Preis-Badge */}
        <div className="absolute left-3 top-3 rounded-xl border border-white/10 bg-background/95 px-3 py-1.5 shadow-md backdrop-blur-md">
          <span className="text-sm font-bold tracking-tight text-foreground">
            {formatRentPerMonth(property.rent)}
          </span>
        </div>
        {/* Gated-Badge */}
        {!hasAccess && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-white/10 bg-primary/95 px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-md backdrop-blur-sm">
            <Lock className="h-3 w-3" />
            Kontakt gesperrt
          </div>
        )}
        {hasAccess && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-white/10 bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-md backdrop-blur-sm">
            <Crown className="h-3 w-3" />
            freigeschaltet
          </div>
        )}
      </div>

      <CardContent className="space-y-3 p-4">
        {/* Titel */}
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground">
          {property.title}
        </h3>

        {/* Ort */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate">
            {property.zip} {property.city}, {property.canton}
          </span>
        </div>

        {/* Kennzahlen */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
          <span className="flex items-center gap-1.5">
            <BedDouble className="h-3.5 w-3.5 text-muted-foreground" />
            {formatRooms(property.rooms)}
          </span>
          <span className="flex items-center gap-1.5">
            <Maximize className="h-3.5 w-3.5 text-muted-foreground" />
            {formatArea(property.area)}
          </span>
          {property.availableFrom && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatAvailable(property.availableFrom)}
            </span>
          )}
        </div>

        {/* Nebenkosten / Gesamt */}
        <div className="flex items-center justify-between border-t border-border pt-2.5 text-xs text-muted-foreground">
          <span>Nebenkosten: {formatCHF(property.utilities)} / Monat</span>
          <span className="font-medium text-foreground">
            Gesamt: {formatCHF(totalMonthly)} / Monat
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex items-center gap-2 px-4 pb-4">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-2"
          onClick={(e) => {
            e.stopPropagation()
            openDetail(property.id)
          }}
        >
          <Eye className="h-4 w-4" />
          Details
        </Button>
        {hasAccess ? (
          <Button
            size="sm"
            className="flex-1 gap-2"
            onClick={handleContactClick}
          >
            <ExternalLink className="h-4 w-4" />
            Inserat ansehen
          </Button>
        ) : (
          <Button
            size="sm"
            className="flex-1 gap-2"
            onClick={handleContactClick}
          >
            <Lock className="h-4 w-4" />
            Link freischalten
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

/// Skeleton-Variante fuer Ladezustand
export function PropertyCardSkeleton() {
  return (
    <Card className="overflow-hidden py-0">
      <div className="aspect-[4/3] w-full animate-pulse bg-muted" />
      <CardContent className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="flex gap-4">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
      </CardContent>
      <CardFooter className="gap-2 px-4 pb-4">
        <div className="h-8 flex-1 animate-pulse rounded bg-muted" />
        <div className="h-8 flex-1 animate-pulse rounded bg-muted" />
      </CardFooter>
    </Card>
  )
}
