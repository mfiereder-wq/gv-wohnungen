"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  X,
  MapPin,
  BedDouble,
  Maximize,
  CalendarDays,
  Lock,
  Crown,
  Phone,
  Mail,
  ExternalLink,
  Loader2,
  Shield,
  CheckCircle2,
  Euro,
  Globe,
  Info,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useGV } from "@/store/gv"
import {
  formatRentPerMonth,
  formatRooms,
  formatArea,
  formatAvailable,
  formatCHF,
} from "@/lib/format"
import type { Property } from "@/lib/types"
import { toast } from "sonner"

export function PropertyDetailModal() {
  const { activeModal, closeModal, detailPropertyId, openPaywall } = useGV()
  const open = activeModal === "detail" && !!detailPropertyId

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeModal()}>
      <DialogContent className="max-w-3xl overflow-hidden p-0 shadow-2xl sm:rounded-2xl">
        <DialogTitle className="sr-only">Inserat-Details</DialogTitle>
        <DialogDescription className="sr-only">
          Detailansicht des Immobilieninserats
        </DialogDescription>
        {open && detailPropertyId && (
          <DetailContent
            key={detailPropertyId}
            propertyId={detailPropertyId}
            onClose={closeModal}
            onUnlock={(id: string) => openPaywall(id)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

/// Inhalt wird bei Wechsel des propertyId neu gemountet (key),
/// daher ist der initiale State "loading" ohne synchrones setState im Effect.
function DetailContent({
  propertyId,
  onClose,
  onUnlock,
}: {
  propertyId: string
  onClose: () => void
  onUnlock: (id: string) => void
}) {
  const [property, setProperty] = useState<Property | null>(null)
  // Initial "loading", weil wir beim Mount sofort fetchen
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [activeImg, setActiveImg] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/properties/${propertyId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data.property) {
          setProperty(data.property)
          setHasAccess(!!data.hasAccess)
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("Inserat konnte nicht geladen werden.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [propertyId])

  const totalMonthly = property ? property.rent + property.utilities : 0

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Inserat nicht verfuegbar.
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
      className="max-h-[90vh] overflow-y-auto gv-scroll"
    >
      {/* Bildergalerie */}
      <div className="relative aspect-[16/9] w-full bg-muted">
        <img
          src={
            property.images[activeImg] ||
            property.images[0] ||
            "/images/placeholder.svg"
          }
          alt={property.title}
          className="h-full w-full object-cover"
          onError={(e) => {
            const t = e.currentTarget
            if (t.src.indexOf("placeholder") === -1)
              t.src = "/images/placeholder.svg"
          }}
        />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur transition-colors hover:bg-background"
          aria-label="Schliessen"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Preis-Badge */}
        <div className="absolute left-4 top-4 rounded-lg bg-background/95 px-3 py-1.5 shadow-sm backdrop-blur">
          <span className="text-base font-bold text-foreground">
            {formatRentPerMonth(property.rent)}
          </span>
        </div>

        {/* Gated-Badge */}
        <div className="absolute right-4 bottom-4">
          {hasAccess ? (
            <Badge className="gap-1 bg-emerald-600 text-white shadow-sm">
              <Crown className="h-3.5 w-3.5" />
              freigeschaltet
            </Badge>
          ) : (
            <Badge className="gap-1 bg-primary text-primary-foreground shadow-sm">
              <Lock className="h-3.5 w-3.5" />
              Kontakt gesperrt
            </Badge>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      {property.images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto border-b border-border bg-secondary/20 p-3 gv-scroll">
          {property.images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImg(i)}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                activeImg === i
                  ? "border-primary"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={img}
                alt={`Bild ${i + 1}`}
                className="h-full w-full object-cover"
                onError={(e) => {
                  const t = e.currentTarget
                  if (t.src.indexOf("placeholder") === -1)
                    t.src = "/images/placeholder.svg"
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="space-y-5 p-5 sm:p-6">
        {/* Titel + Ort */}
        <div>
          <h2 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">
            {property.title}
          </h2>
          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            {property.zip} {property.city}, {property.canton}
          </div>
        </div>

        {/* Kennzahlen-Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={<Euro className="h-4 w-4" />}
            label="Miete"
            value={formatCHF(property.rent)}
            sub="/ Monat"
          />
          <StatCard
            icon={<BedDouble className="h-4 w-4" />}
            label="Zimmer"
            value={formatRooms(property.rooms)}
          />
          <StatCard
            icon={<Maximize className="h-4 w-4" />}
            label="Flaeche"
            value={formatArea(property.area)}
          />
          <StatCard
            icon={<CalendarDays className="h-4 w-4" />}
            label="Verfuegbar"
            value={formatAvailable(property.availableFrom)}
          />
        </div>

        {/* Kosten-Uebersicht */}
        <div className="rounded-xl border border-border bg-secondary/20 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Kaltmiete</span>
            <span className="font-medium">{formatCHF(property.rent)}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Nebenkosten</span>
            <span className="font-medium">
              {formatCHF(property.utilities)}
            </span>
          </div>
          <Separator className="my-2.5" />
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">
              Gesamtmiete / Monat
            </span>
            <span className="text-lg font-bold text-primary">
              {formatCHF(totalMonthly)}
            </span>
          </div>
        </div>

        {/* Beschreibung */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            Beschreibung
          </h3>
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {property.description}
          </p>
        </div>

        {/* Kontakt-Bereich: Gated */}
        <Separator />

        <div className="rounded-xl border border-border p-4">
          {hasAccess && property.contact ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Vermieter-Kontakt
                </h3>
                <Badge className="gap-1 bg-emerald-600 text-white">
                  <Crown className="h-3 w-3" />
                  freigeschaltet
                </Badge>
              </div>

              {/* Direkte Kontaktdaten (falls vorhanden) */}
              {property.contact.hasDirectContact ? (
                <div className="space-y-2 text-sm">
                  {property.contact.contactName && (
                    <div className="flex items-center gap-2">
                      <span className="w-20 shrink-0 text-muted-foreground">
                        Name:
                      </span>
                      <span className="font-medium text-foreground">
                        {property.contact.contactName}
                      </span>
                    </div>
                  )}
                  {property.contact.contactEmail && (
                    <a
                      href={`mailto:${property.contact.contactEmail}`}
                      className="flex items-center gap-2 transition-colors hover:text-primary"
                    >
                      <span className="w-20 shrink-0 text-muted-foreground">
                        E-Mail:
                      </span>
                      <Mail className="h-3.5 w-3.5 text-primary" />
                      <span className="font-medium underline-offset-2 hover:underline">
                        {property.contact.contactEmail}
                      </span>
                    </a>
                  )}
                  {property.contact.contactPhone && (
                    <a
                      href={`tel:${property.contact.contactPhone.replace(/\s/g, "")}`}
                      className="flex items-center gap-2 transition-colors hover:text-primary"
                    >
                      <span className="w-20 shrink-0 text-muted-foreground">
                        Telefon:
                      </span>
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      <span className="font-medium underline-offset-2 hover:underline">
                        {property.contact.contactPhone}
                      </span>
                    </a>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                  <Info className="mr-1 inline h-3.5 w-3.5 text-primary" />
                  Fuer dieses Inserat sind keine direkten Kontaktdaten
                  oeffentlich. Nutze den Link unten, um den Vermieter
                  ueber das Kontaktformular des Anbieters zu erreichen.
                </div>
              )}

              {/* Original-Link + Bewerbungsformular - immer fuer Premium */}
              <div className="space-y-2 pt-1">
                <a
                  href={property.contact.originalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <ExternalLink className="h-4 w-4" />
                  Inserat ansehen
                </a>
                {property.contact.submitUrl && property.contact.submitUrl !== property.contact.originalLink && (
                  <a
                    href={property.contact.submitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-secondary/30 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    <Mail className="h-4 w-4 text-primary" />
                    Bewerbung einreichen
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Lock className="h-4 w-4 text-primary" />
                  Vermieter-Kontakt
                </h3>
                <Badge variant="secondary" className="gap-1">
                  <Lock className="h-3 w-3" />
                  gesperrt
                </Badge>
              </div>

              {/* Verschleierte Vorschau */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-muted-foreground">
                    Link:
                  </span>
                  <span className="font-mono tracking-wider text-muted-foreground">
                    flatfox.ch/••••••••/
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-muted-foreground">
                    Kontakt:
                  </span>
                  <span className="font-mono tracking-wider text-muted-foreground">
                    ••••••••@••••.ch
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-muted-foreground">
                    Telefon:
                  </span>
                  <span className="font-mono tracking-wider text-muted-foreground">
                    +41 •• ••• •• ••
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground">
                <Shield className="mr-1 inline h-3.5 w-3.5 text-primary" />
                Flatfox-Link und Kontaktdaten sind geschuetzt. Schalte sie
                fuer nur{" "}
                <span className="font-semibold text-foreground">
                  CHF 5.90 / Woche
                </span>{" "}
                frei.
              </div>

              <Button
                className="w-full gap-2"
                size="lg"
                onClick={() => onUnlock(property.id)}
              >
                <Lock className="h-4 w-4" />
                Flatfox-Link freischalten – CHF 5.90 / Woche
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div className="mt-1 text-sm font-bold text-foreground">
        {value}
        {sub && (
          <span className="ml-0.5 text-xs font-normal text-muted-foreground">
            {sub}
          </span>
        )}
      </div>
    </div>
  )
}
