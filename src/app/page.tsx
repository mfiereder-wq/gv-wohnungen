"use client"

import { Suspense, useEffect, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Search,
  Home,
  ShieldCheck,
  Zap,
  MapPin,
  TrendingDown,
  Lock,
  Crown,
  Check,
  ArrowRight,
  Building2,
  Clock,
  Star,
} from "lucide-react"
import { Header } from "@/components/gv/header"
import { Footer } from "@/components/gv/footer"
import { SearchBar } from "@/components/gv/search-bar"
import { PropertyCard, PropertyCardSkeleton } from "@/components/gv/property-card"
import { PaywallModal } from "@/components/gv/paywall-modal"
import { AuthModal } from "@/components/gv/auth-modal"
import { PropertyDetailModal } from "@/components/gv/property-detail-modal"
import { AccountModal } from "@/components/gv/account-modal"
import { CheckoutSuccessModal } from "@/components/gv/checkout-success-modal"
import { CooperativesSection } from "@/components/gv/cooperatives-section"
import { CookieBanner } from "@/components/gv/cookie-banner"
import { useGV } from "@/store/gv"
import { useProperties } from "@/hooks/use-properties"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <HomePageContent />
    </Suspense>
  )
}

function HomePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { openAccount, openCheckoutSuccess, filters } = useGV()
  const { data, isLoading, isError } = useProperties()

  // URL-Query-Params verarbeiten (?checkout=success, ?account=1)
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      openCheckoutSuccess()
      router.replace("/")
    }
    if (searchParams.get("account") === "1") {
      openAccount()
      router.replace("/")
    }
  }, [searchParams, openCheckoutSuccess, openAccount, router])

  const properties = data?.properties ?? []
  const hasAccess = data?.hasAccess ?? false
  const total = data?.total ?? 0

  const activeFilterCount = useMemo(() => {
    let n = 0
    if (filters.canton) n++
    if (filters.city) n++
    if (filters.zip) n++
    if (filters.maxRent) n++
    if (filters.minRooms) n++
    if (filters.q) n++
    return n
  }, [filters])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* === HERO mit Video-Hintergrund === */}
        <section className="relative overflow-hidden border-b border-border">
          {/* Video-Hintergrund */}
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src="/videos/hero-bg.mp4" type="video/mp4" />
          </video>
          {/* Dunkles Overlay fuer Lesbarkeit */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />
          <div className="absolute inset-0 bg-primary/20" />

          {/* Content ueber dem Video */}
          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <Badge
                  variant="secondary"
                  className="mb-2 gap-1 border-white/20 bg-white/10 text-white backdrop-blur sm:mb-3 sm:gap-1.5"
                >
                  <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  Bezahlbarer Wohnraum Schweiz
                </Badge>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                className="text-balance text-2xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] sm:text-4xl lg:text-5xl"
              >
                Wohnungen in der Schweiz finden
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                className="mx-auto mt-3 max-w-xl text-pretty text-sm text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)] sm:text-lg"
              >
                Schluss mit endlosem Suchen auf dutzenden Portalen. Wir
                buendeln alle Inserate an einem Ort – damit du schneller die
                richtige Wohnung findest und als Erster beim Vermieter
                anklopfst. Wer frueh dran ist, bekommt den Zuschlag.
              </motion.p>
            </div>
          </div>
        </section>

        {/* === SUCHE === */}
        <section id="suche" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <SearchBar />
        </section>

        {/* === RESULTATE === */}
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          {/* Ergebnis-Kopf */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                Verfuegbare Wohnungen
              </h2>
              <Badge variant="secondary" className="gap-1">
                <Building2 className="h-3 w-3" />
                {isLoading ? "..." : total} Inserate
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {hasAccess ? (
                <Badge className="gap-1 bg-emerald-600 text-white">
                  <Crown className="h-3 w-3" />
                  Abo aktiv – alle Kontakte frei
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Kontakte gesperrt
                </Badge>
              )}
            </div>
          </div>

          {/* Grid */}
          {isError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
              <p className="text-sm text-destructive">
                Die Wohnungen konnten nicht geladen werden. Bitte versuche es
                spaeter erneut.
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {total === 0
                  ? "Noch keine Inserate synchronisiert"
                  : "Keine Wohnungen fuer diese Filter"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {total === 0
                  ? "Echte Flatfox-Inserate werden im Konto unter 'Flatfox-Synchronisation' geladen."
                  : "Versuche, die Filter anzupassen oder zurueckzusetzen."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {properties.map((p) => (
                <PropertyCard key={p.id} property={p} hasAccess={hasAccess} />
              ))}
            </div>
          )}
        </section>

        {/* === GENOSSENSCHAFTEN === */}
        <CooperativesSection />

        {/* === SO FUNKTIONIERT'S === */}
        <section className="border-t border-border bg-secondary/30">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                So funktioniert GV Wohnungen
              </h2>
              <p className="mt-2 text-muted-foreground">
                In drei einfachen Schritten zur neuen Wohnung
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <StepCard
                step={1}
                icon={<Search className="h-6 w-6" />}
                title="Suchen & Filtern"
                desc="Filtere nach Kanton, PLZ, Preis und Zimmeranzahl. Basisdaten wie Bilder, Preis und Lage sind fuer alle sichtbar."
              />
              <StepCard
                step={2}
                icon={<Lock className="h-6 w-6" />}
                title="Abo abschliessen"
                desc="Klicke auf 'Link freischalten' und schalte fuer CHF 5.90 / Woche alle Flatfox-Links und Kontaktdaten frei. Woechentlich kuendbar."
              />
              <StepCard
                step={3}
                icon={<Home className="h-6 w-6" />}
                title="Direkt kontaktieren"
                desc="Rufe den Vermitler an oder schreibe eine E-Mail. Kein Makler, keine Umwege – direkter Draht zum Vermitler."
              />
            </div>
          </div>
        </section>

        {/* === PREISE === */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div>
                <Badge variant="secondary" className="mb-3 gap-1">
                  <Crown className="h-3.5 w-3.5 text-primary" />
                  Preismodell
                </Badge>
                <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                  Ein Preis. Keine Ueberraschungen.
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Wir glauben an transparente Preise. Suche ist komplett gratis.
                  Nur wenn du Vermitter kontaktieren moechtest, brauchst du ein
                  Abo.
                </p>
                <ul className="mt-5 space-y-2.5">
                  {[
                    "Alle Basisdaten (Bilder, Preis, Lage) gratis",
                    "Flatfox-Links zu allen Inseraten",
                    "Direkte Kontaktdaten wenn verfuegbar",
                    "Woechentlich kuendbar – keine Bindung",
                  ].map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span className="text-foreground">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Preis-Karte */}
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
                <h3 className="text-base font-semibold text-foreground">
                  Vollzugang
                </h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight text-foreground">
                    CHF 5.90
                  </span>
                  <span className="text-sm text-muted-foreground">/ Woche</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Flatfox-Links und Kontaktdaten freischalten.
                </p>
                <div className="mt-5 space-y-2.5">
                  {[
                    "Flatfox-Links zu allen Inseraten",
                    "Bewerbungsformular (submit_url)",
                    "Direkte Telefonnummern wenn vorhanden",
                    "E-Mail-Kontakte wenn vorhanden",
                    "Woechentlich kuendbar",
                  ].map((t) => (
                    <div key={t} className="flex items-center gap-2 text-sm">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-foreground">{t}</span>
                    </div>
                  ))}
                </div>
                <Button
                  className="mt-6 w-full gap-2"
                  size="lg"
                  onClick={() => useGV.getState().openPaywall()}
                >
                  Jetzt freischalten
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="mt-3 text-center text-[11px] text-muted-foreground">
                  Bezahlung via Stripe · SSL-verschluesselt
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* === VERTRAUEN === */}
        <section className="border-t border-border bg-secondary/30">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-3">
              <TrustCard
                icon={<MapPin className="h-5 w-5" />}
                title="Schweizweit"
                desc="Wohnungen in allen Kantonen – von Zuerich bis Tessin."
              />
              <TrustCard
                icon={<Clock className="h-5 w-5" />}
                title="Aktuelle Inserate"
                desc="Taeglich neue Wohnungen von Privatvermietern."
              />
              <TrustCard
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Datenschutz"
                desc="Kontaktdaten geschuetzt – nur fuer Abonnenten sichtbar."
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* === MODALS === */}
      <AuthModal />
      <PaywallModal />
      <PropertyDetailModal />
      <AccountModal />
      <CheckoutSuccessModal />
      <CookieBanner />
    </div>
  )
}

function StepCard({
  step,
  icon,
  title,
  desc,
}: {
  step: number
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
      <div className="absolute right-5 top-5 text-5xl font-bold text-primary/10">
        {step}
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}

function TrustCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}
