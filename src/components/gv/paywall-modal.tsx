"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import {
  Lock,
  Crown,
  Check,
  X,
  CreditCard,
  Shield,
  RefreshCw,
  Zap,
  Phone,
  Mail,
  ExternalLink,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useGV } from "@/store/gv"
import { toast } from "sonner"

const FEATURES = [
  {
    icon: ExternalLink,
    title: "Flatfox-Links freischalten",
    desc: "Original-Link zu jedem Inserat auf flatfox.ch.",
  },
  {
    icon: Mail,
    title: "Bewerbung einreichen",
    desc: "Direkt ueber das Flatfox-Kontaktformular bewerben.",
  },
  {
    icon: Phone,
    title: "Direkte Kontaktdaten",
    desc: "Telefon & E-Mail des Vermieters, wenn oeffentlich vorhanden.",
  },
  {
    icon: Zap,
    title: "Unbegrenzte Anfragen",
    desc: "So viele Wohnungen kontaktieren wie du willst.",
  },
]

export function PaywallModal() {
  const { activeModal, closeModal, openAuth, paywallPropertyId } = useGV()
  const open = activeModal === "paywall"
  const { data: session, update: updateSession } = useSession()
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    // Falls nicht eingeloggt: zuerst Auth oeffnen
    if (!session?.user) {
      closeModal()
      openAuth("login")
      toast.info("Bitte zuerst anmelden, um das Abo abzuschliessen.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: paywallPropertyId }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Checkout fehlgeschlagen")
      }
      if (data.alreadyActive) {
        toast.success("Du hast bereits ein aktives Abo.")
        closeModal()
        return
      }
      if (data.demo) {
        // Demo-Modus: Abo sofort aktiviert -> Session aktualisieren
        toast.success(
          "Demo-Abo aktiviert! Alle Kontaktdaten sind nun freigeschaltet.",
        )
        useGV.getState().triggerRefreshSession()
        // NextAuth-Session explizit aktualisieren (JWT-Refresh)
        if (updateSession) {
          try { await updateSession() } catch { /* ignore */ }
        }
        useGV.getState().openCheckoutSuccess()
        return
      }
      // Produktiv-Modus: Weiterleitung zu Stripe
      if (data.url) {
        window.location.href = data.url
      }
    } catch (e: any) {
      toast.error(e?.message || "Etwas ist schiefgelaufen.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeModal()}>
      <DialogContent className="max-w-lg overflow-hidden p-0 shadow-2xl sm:rounded-2xl">
        {/* Header-Banner */}
        <div className="relative bg-gradient-to-br from-primary to-primary/80 px-6 py-7 text-primary-foreground">
          <button
            onClick={closeModal}
            className="absolute right-4 top-4 rounded-full p-1.5 text-primary-foreground/80 transition-colors hover:bg-white/15 hover:text-primary-foreground"
            aria-label="Schliessen"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                GV Wohnungen Abo
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/85">
                Flatfox-Links freischalten
              </DialogDescription>
            </div>
          </div>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight">
              CHF 5.90
            </span>
            <span className="text-sm text-primary-foreground/80">/ Woche</span>
            <Badge
              variant="secondary"
              className="ml-2 border-white/20 bg-white/15 text-primary-foreground"
            >
              woechentlich kuendbar
            </Badge>
          </div>
        </div>

        {/* Body */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
          className="space-y-5 px-6 py-6"
        >
          <p className="text-sm text-muted-foreground">
            Erhalte fuer nur{" "}
            <span className="font-semibold text-foreground">
              CHF 5.90 / Woche
            </span>{" "}
            unbegrenzten Zugriff auf alle Flatfox-Links und Kontaktdaten.
            Woechentlich kuendbar – jederzeit stoppen.
          </p>

          {/* Features */}
          <div className="grid gap-2.5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {f.title}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Trust-Zeile */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" />
              SSL-verschluesselt
            </span>
            <span className="flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5 text-primary" />
              Woechentlich kuendbar
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              Bezahlung via Stripe
            </span>
          </div>

          {/* CTA */}
          <Button
            size="lg"
            className="w-full gap-2 text-base"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Wird verarbeitet...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Jetzt freischalten – CHF 5.90 / Woche
              </>
            )}
          </Button>

          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            Mit dem Klick stimmst du den AGB zu. Das Abo verlaengert sich
            woechentlich, bis du es kuendigst. Kuendigung jederzeit im Konto
            moeglich.
          </p>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
