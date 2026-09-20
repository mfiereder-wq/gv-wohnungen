"use client"

import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import {
  Building2,
  Lock,
  Check,
  Phone,
  Mail,
  Globe,
  MapPin,
  Users,
  Info,
  Loader2,
  Shield,
  Crown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useGV } from "@/store/gv"
import { toast } from "sonner"
import { useState } from "react"

interface Cooperative {
  id: string
  name: string
  size: string
  address: string
  website: string
  applicationInfo: string
  phone: string | null
  email: string | null
  gated: boolean
}

export function CooperativesSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["cooperatives"],
    queryFn: async () => {
      const res = await fetch("/api/cooperatives", { cache: "no-store" })
      return res.json()
    },
    staleTime: 60_000,
  })

  const { data: session } = useSession()
  const [purchasing, setPurchasing] = useState(false)
  const refreshFlag = useGV((s) => s.refreshSessionFlag)

  const cooperatives: Cooperative[] = data?.cooperatives ?? []
  const hasAccess: boolean = data?.hasAccess ?? false

  const handlePurchase = async () => {
    if (!session?.user) {
      useGV.getState().openAuth("login")
      toast.info("Bitte zuerst anmelden.")
      return
    }
    setPurchasing(true)
    try {
      const res = await fetch("/api/checkout-cooperatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      // Absichern: Response-Text zuerst lesen, dann JSON parsen
      const text = await res.text()
      const d = text ? JSON.parse(text) : {}
      if (!res.ok) throw new Error(d.error || `Fehler ${res.status}`)
      if (d.alreadyPurchased) {
        toast.success("Bereits freigeschaltet.")
        return
      }
      if (d.demo) {
        toast.success("Demo: Liste freigeschaltet.")
        useGV.getState().triggerRefreshSession()
        return
      }
      if (d.url) window.location.href = d.url
    } catch (e: any) {
      toast.error(e?.message || "Fehler beim Checkout")
    } finally {
      setPurchasing(false)
    }
  }

  return (
    <section id="genossenschaften" className="border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <Badge
            variant="secondary"
            className="mb-3 gap-1.5 border-primary/20 bg-primary/10 text-primary"
          >
            <Building2 className="h-3.5 w-3.5" />
            Genossenschaften Zürich
          </Badge>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Günstiger wohnen mit Genossenschaften
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Wohnbaugenossenschaften bieten in Zürich deutlich günstigere Mieten
            als der freie Markt. Mit der Kontaktliste erhältst du direkten
            Zugang zu 10 Genossenschaften mit günstigem Wohnraum.
          </p>
        </div>

        {/* Kauf-Hinweis */}
        {!hasAccess && (
          <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-background p-5 text-center">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Lock className="h-5 w-5" />
              <span className="font-semibold">Kontaktdaten geschützt</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Schalte die komplette Kontaktliste mit Telefon, E-Mail und
              Bewerbungsweg für <strong className="text-foreground">CHF 29.90</strong> frei.
              Einmaliger Kauf — kein Abo.
            </p>
            <Button
              className="mt-4 gap-2"
              size="lg"
              onClick={handlePurchase}
              disabled={purchasing || isLoading}
            >
              {purchasing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Wird verarbeitet...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Kontaktliste freischalten — CHF 29.90
                </>
              )}
            </Button>
            <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
              <Shield className="h-3 w-3" />
              Einmalige Zahlung · Kein Abo · Sofortiger Zugriff
            </p>
          </div>
        )}

        {hasAccess && (
          <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-emerald-600">
              <Check className="h-5 w-5" />
              <span className="font-semibold">Kontaktliste freigeschaltet</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Alle Kontaktdaten sind sichtbar.
            </p>
          </div>
        )}

        {/* Liste */}
        <div className="mt-8">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : cooperatives.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Keine Genossenschaften gefunden.
            </p>
          ) : (
            <motion.div
              variants={{
                hidden: {},
                show: {
                  transition: { staggerChildren: 0.06, delayChildren: 0.1 },
                },
              }}
              initial="hidden"
              animate="show"
              className="grid gap-4 md:grid-cols-2"
            >
              {cooperatives.map((coop) => (
                <motion.div
                  key={coop.id}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    show: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.4, ease: "easeOut" },
                    },
                  }}
                >
                  <CooperativeCard coop={coop} hasAccess={hasAccess} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}

function CooperativeCard({
  coop,
  hasAccess,
}: {
  coop: Cooperative
  hasAccess: boolean
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-md">
      {/* Name + Size */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-foreground">{coop.name}</h3>
        {coop.size && (
          <Badge variant="outline" className="shrink-0 gap-1">
            <Users className="h-3 w-3" />
            {coop.size}
          </Badge>
        )}
      </div>

      {/* Adresse */}
      {coop.address && coop.address !== "siehe Webseite" && (
        <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          {coop.address}
        </div>
      )}

      {/* Webseite */}
      {coop.website && (
        <a
          href={coop.website}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <Globe className="h-3.5 w-3.5" />
          {coop.website.replace("https://", "").replace("www.", "")}
        </a>
      )}

      {/* Bewerbungsweg */}
      {coop.applicationInfo && (
        <div className="mt-3 rounded-lg bg-secondary/40 p-2.5 text-xs text-muted-foreground">
          <Info className="mr-1 inline h-3 w-3 text-primary" />
          {coop.applicationInfo}
        </div>
      )}

      {/* Kontaktdaten (geschützt) */}
      <div className="mt-3 border-t border-border pt-3">
        {hasAccess ? (
          <div className="space-y-1.5 text-sm">
            {coop.phone && (
              <a
                href={`tel:${coop.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-2 text-foreground hover:text-primary"
              >
                <Phone className="h-3.5 w-3.5 text-primary" />
                {coop.phone}
              </a>
            )}
            {coop.email && (
              <a
                href={`mailto:${coop.email}`}
                className="flex items-center gap-2 text-foreground hover:text-primary"
              >
                <Mail className="h-3.5 w-3.5 text-primary" />
                {coop.email}
              </a>
            )}
            {!coop.phone && !coop.email && (
              <div className="text-xs text-muted-foreground">
                Kontakt via Webseite
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span className="font-mono tracking-wider">••••••••••</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span className="font-mono tracking-wider">••••••@••••.ch</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
