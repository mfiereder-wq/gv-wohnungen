"use client"

import { useEffect, useState } from "react"
import { Cookie, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

const COOKIE_CONSENT_KEY = "gv-cookie-consent"

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      // Kleine Verzoegerung, damit das Banner nicht sofort beim Load aufspringt
      const timer = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const accept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ accepted: true, date: new Date().toISOString() }))
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ accepted: false, date: new Date().toISOString() }))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Cookie className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              Wir verwenden Cookies
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Diese Website verwendet notwendige Cookies für Login und Sicherheit sowie optionale
              Cookies für Statistik. Notwendige Cookies können nicht deaktiviert werden. Mit Klick
              auf «Alle akzeptieren» stimmen Sie der Verwendung aller Cookies zu. Weitere
              Informationen in unserer{" "}
              <a href="/datenschutz" className="text-primary underline">
                Datenschutzerklärung
              </a>.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={accept} className="gap-1.5">
                <Check className="h-3.5 w-3.5" />
                Alle akzeptieren
              </Button>
              <Button size="sm" variant="outline" onClick={decline}>
                Nur notwendige
              </Button>
            </div>
          </div>
          <button
            onClick={decline}
            className="rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Schliessen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
