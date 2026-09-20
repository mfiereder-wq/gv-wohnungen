"use client"

import { useCallback, useEffect, useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { motion } from "framer-motion"
import {
  X,
  Crown,
  CheckCircle2,
  XCircle,
  Loader2,
  CalendarDays,
  CreditCard,
  LogOut,
  RefreshCw,
  Lock,
  Mail,
  User,
  AlertCircle,
  Globe,
  Database,
  Trash2,
  Info,
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
import { formatCHF } from "@/lib/format"
import { toast } from "sonner"

interface MeResponse {
  user: {
    id: string
    email: string
    name: string | null
    subscriptionStatus: string
    stripeCustomerId: string | null
    subscription: {
      status: string
      currentPeriodStart: string | null
      currentPeriodEnd: string | null
      cancelAtPeriodEnd: boolean
    } | null
  } | null
}

export function AccountModal() {
  const { activeModal, closeModal, openPaywall } = useGV()
  const open = activeModal === "account"
  const { data: session, update: updateSession } = useSession()
  const refreshFlag = useGV((s) => s.refreshSessionFlag)

  const [me, setMe] = useState<MeResponse["user"] | null>(null)
  const [loading, setLoading] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const loadMe = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/me", { cache: "no-store" })
      const data: MeResponse = await res.json()
      setMe(data.user)
    } catch {
      toast.error("Kontodaten konnten nicht geladen werden.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) loadMe()
  }, [open, refreshFlag, loadMe])

  const status = me?.subscriptionStatus ?? "none"
  const isActive = status === "active" || status === "trialing"
  const sub = me?.subscription

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const res = await fetch("/api/portal", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Kuendigung fehlgeschlagen")
      if (data.demo) {
        toast.success("Abo gekuendigt. Schade, dass du gehst!")
        await loadMe()
        useGV.getState().triggerRefreshSession()
        if (updateSession) await updateSession()
      } else if (data.url) {
        window.location.href = data.url
      }
    } catch (e: any) {
      toast.error(e?.message || "Kuendigung fehlgeschlagen.")
    } finally {
      setCancelling(false)
    }
  }

  const formatDate = (d: string | null) => {
    if (!d) return "–"
    return new Date(d).toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeModal()}>
      <DialogContent className="max-w-lg p-0 shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary to-primary/80 px-6 py-6 text-primary-foreground">
          <button
            onClick={closeModal}
            className="absolute right-4 top-4 rounded-full p-1.5 text-primary-foreground/80 transition-colors hover:bg-white/15"
            aria-label="Schliessen"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <User className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Mein Konto
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/85">
                Verwalte dein Abo und deine Daten
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Body */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
          className="space-y-5 px-6 py-6"
        >
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : !me ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nicht eingeloggt.
            </div>
          ) : (
            <>
              {/* Profil */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Profil
                </h3>
                <div className="space-y-2 rounded-xl border border-border bg-secondary/20 p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">E-Mail:</span>
                    <span className="font-medium text-foreground">{me.email}</span>
                  </div>
                  {me.name && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium text-foreground">{me.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Abo-Status */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Abo-Status
                </h3>
                <div
                  className={`rounded-xl border p-4 ${
                    isActive
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-border bg-secondary/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="font-semibold text-foreground">
                        {isActive ? "Abo aktiv" : "Kein aktives Abo"}
                      </span>
                    </div>
                    <Badge
                      variant={isActive ? "secondary" : "outline"}
                      className={
                        isActive
                          ? "gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
                          : ""
                      }
                    >
                      {isActive && <Crown className="h-3 w-3" />}
                      {status === "active" && "aktiv"}
                      {status === "trialing" && "Probezeit"}
                      {status === "past_due" && "Zahlung ausstehend"}
                      {status === "canceled" && "gekündigt"}
                      {status === "none" && "kostenlos"}
                    </Badge>
                  </div>

                  {isActive ? (
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {sub?.currentPeriodEnd && (
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-primary" />
                          <span>
                            Nächste Abrechnung:{" "}
                            <span className="font-medium text-foreground">
                              {formatDate(sub.currentPeriodEnd)}
                            </span>
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        <span>
                          Betrag:{" "}
                          <span className="font-medium text-foreground">
                            {formatCHF(5.9)} / Woche
                          </span>
                        </span>
                      </div>
                      {sub?.cancelAtPeriodEnd && (
                        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-2 text-amber-700">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span className="text-xs">
                            Abo laeuft bis{" "}
                            {formatDate(sub.currentPeriodEnd)} und wird dann
                            nicht verlaengert.
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Schalte alle Flatfox-Links und Kontaktdaten fuer nur{" "}
                      <span className="font-semibold text-foreground">
                        CHF 5.90 / Woche
                      </span>{" "}
                      frei.
                    </p>
                  )}
                </div>
              </div>

              {/* Aktionen */}
              <Separator />

              <div className="space-y-2">
                {isActive ? (
                  <Button
                    variant="outline"
                    className="w-full justify-center gap-2"
                    onClick={handleCancel}
                    disabled={cancelling}
                  >
                    {cancelling ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Wird gekuendigt...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" />
                        Abo kündigen
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    className="w-full justify-center gap-2"
                    onClick={() => {
                      closeModal()
                      openPaywall()
                    }}
                  >
                    <Lock className="h-4 w-4" />
                    Abo abschliessen – CHF 5.90 / Woche
                  </Button>
                )}

                <Button
                  variant="ghost"
                  className="w-full justify-center gap-2 text-muted-foreground"
                  onClick={() => {
                    signOut({ redirect: false })
                    closeModal()
                    toast.success("Abgemeldet.")
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Abmelden
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

/// Flatfox-Sync-Sektion: importiert echte Inserate via Apify.
function FlatfoxSyncSection() {
  const [status, setStatus] = useState<{
    apifyEnabled: boolean
    flatfoxCount: number
    manualCount: number
    totalCount: number
    rateLimit?: {
      runsToday: number
      maxRunsPerDay: number
      cooldownSeconds: number
      maxItemsPerRun: number
      canRunNow: boolean
      nextRunInMs: number
      reason: string | null
    }
  } | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [progress, setProgress] = useState<string>("")
  const [result, setResult] = useState<{
    imported: number
    updated: number
    skipped: number
    demo: boolean
    message: string
  } | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [maxPrice, setMaxPrice] = useState("")
  const [minRooms, setMinRooms] = useState("")
  const [take, setTake] = useState("10")
  const [replaceDemo, setReplaceDemo] = useState(false)
  const refreshFlag = useGV((s) => s.refreshSessionFlag)

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/sync-status", { cache: "no-store" })
      const data = await res.json()
      setStatus(data)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus, refreshFlag])

  const handleSync = async () => {
    setSyncing(true)
    setResult(null)
    setProgress("Pruefe Rate-Limit...")
    try {
      const body: any = { take: Math.max(10, Number(take) || 10) }
      if (maxPrice) body.maxPrice = Number(maxPrice)
      if (minRooms) body.minRooms = Number(minRooms)
      if (replaceDemo) body.replaceAll = true

      const res = await fetch("/api/sync-flatfox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        // Rate-Limit-Fehler (429) gesondert behandeln
        if (res.status === 429 && data.rateLimited) {
          toast.warning(
            data.error || "Rate-Limit erreicht. Bitte spaeter erneut versuchen.",
          )
          loadStatus() // Rate-Limit-Status aktualisieren
        } else {
          throw new Error(data.error || "Sync fehlgeschlagen")
        }
      } else {
        setResult({
          imported: data.imported ?? 0,
          updated: data.updated ?? 0,
          skipped: data.skipped ?? 0,
          demo: data.demo ?? false,
          message: data.message ?? "Sync abgeschlossen.",
        })
        toast.success(data.message)
        // Properties neu laden
        useGV.getState().triggerRefreshSession()
        loadStatus()
      }
    } catch (e: any) {
      toast.error(e?.message || "Sync fehlgeschlagen.")
      setProgress("")
    } finally {
      setSyncing(false)
      setProgress("")
    }
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Flatfox-Synchronisation
      </h3>
      <div className="rounded-xl border border-border bg-secondary/20 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Globe className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-foreground">
                Echte Inserate von Flatfox
              </span>
              {status && (
                <Badge
                  variant={status.apifyEnabled ? "secondary" : "outline"}
                  className={
                    status.apifyEnabled
                      ? "gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
                      : "gap-1 text-amber-700"
                  }
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {status.apifyEnabled ? "Apify aktiv" : "Demo-Modus"}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Importiert reale Inserate von flatfox.ch. Gespeicherte Inserate
              werden fuer alle User geteilt und nach 10 Tagen automatisch
              entfernt (TTL-Caching).
            </p>
          </div>
        </div>

        {/* Statistik */}
        {status && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg border border-border bg-background p-2">
              <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <Globe className="h-3 w-3 text-primary" />
                Flatfox-Inserate
              </div>
              <div className="text-base font-bold text-foreground">
                {status.flatfoxCount}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-background p-2">
              <div className="text-[11px] text-muted-foreground">Gesamt</div>
              <div className="text-base font-bold text-foreground">
                {status.totalCount}
              </div>
            </div>
          </div>
        )}

        {/* Rate-Limit-Anzeige (nur mit Apify-Token) */}
        {status?.apifyEnabled && status.rateLimit && (
          <div className="mt-3 rounded-lg border border-border bg-background p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <AlertCircle className="h-3.5 w-3.5 text-primary" />
                Free-Tier Rate-Limit
              </span>
              <Badge
                variant={status.rateLimit.canRunNow ? "secondary" : "outline"}
                className={
                  status.rateLimit.canRunNow
                    ? "gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
                    : "gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700"
                }
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {status.rateLimit.canRunNow ? "bereit" : "gesperrt"}
              </Badge>
            </div>
            <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Runs heute (UTC)</span>
                <span className="font-mono font-medium text-foreground">
                  {status.rateLimit.runsToday} / {status.rateLimit.maxRunsPerDay}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Max. Inserate / Run</span>
                <span className="font-mono font-medium text-foreground">
                  {status.rateLimit.maxItemsPerRun}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Cooldown zwischen Runs</span>
                <span className="font-mono font-medium text-foreground">
                  {status.rateLimit.cooldownSeconds}s
                </span>
              </div>
            </div>
            {!status.rateLimit.canRunNow && status.rateLimit.reason && (
              <div className="mt-2 flex items-start gap-1.5 rounded-md bg-amber-500/10 p-2 text-[11px] text-amber-700">
                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                <span>{status.rateLimit.reason}</span>
              </div>
            )}
          </div>
        )}

        {/* Filter-Toggle */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="mt-3 flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
        >
          <span className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-primary" />
            Filter &amp; Optionen
          </span>
          <span className="text-muted-foreground">
            {showFilters ? "ausblenden" : "anpassen"}
          </span>
        </button>

        {showFilters && (
          <div className="mt-2 space-y-2 rounded-lg border border-border bg-background p-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-[11px] text-muted-foreground">
                  Max. Miete (CHF)
                </span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="z. B. 1500"
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[11px] text-muted-foreground">
                  Min. Zimmer
                </span>
                <input
                  type="number"
                  step="0.5"
                  value={minRooms}
                  onChange={(e) => setMinRooms(e.target.value)}
                  placeholder="z. B. 2.5"
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                />
              </label>
            </div>
            <label className="space-y-1">
              <span className="text-[11px] text-muted-foreground">
                Gewuenschte Anzahl{status?.apifyEnabled ? " (Free-Tier: 5 Samples)" : ""}
              </span>
              <input
                type="number"
                value={take}
                onChange={(e) => setTake(e.target.value)}
                min="10"
                max="100"
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
              />
              {status?.apifyEnabled && (
                <span className="text-[10px] text-amber-700">
                  Free-Tier liefert max. 5 Sample-Ergebnisse pro Run (min. 10 als Input erforderlich)
                </span>
              )}
            </label>
            <label className="flex items-center gap-2 rounded-md border border-border bg-secondary/30 px-3 py-2">
              <input
                type="checkbox"
                checked={replaceDemo}
                onChange={(e) => setReplaceDemo(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <span className="flex items-center gap-1.5 text-xs text-foreground">
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                Alle Inserate vorher loeschen
              </span>
            </label>
          </div>
        )}

        {/* Result-Anzeige */}
        {result && (
          <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <div className="flex-1 text-xs">
                <p className="font-medium text-foreground">{result.message}</p>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground">
                  <span>Neu: {result.imported}</span>
                  <span>Aktualisiert: {result.updated}</span>
                  {result.skipped > 0 && (
                    <span>Uebersprungen: {result.skipped}</span>
                  )}
                  {result.demo && (
                    <span className="text-amber-700">(Demo-Modus)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress */}
        {syncing && progress && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            {progress}
          </div>
        )}

        {/* Sync-Button */}
        <Button
          className="mt-3 w-full gap-2"
          onClick={handleSync}
          disabled={syncing || (status?.apifyEnabled ? !status?.rateLimit?.canRunNow : false)}
          variant="outline"
        >
          {syncing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Synchronisiere...
            </>
          ) : status?.apifyEnabled && !status?.rateLimit?.canRunNow ? (
            <>
              <AlertCircle className="h-4 w-4" />
              Rate-Limit aktiv – bitte warten
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Flatfox-Inserate synchronisieren
            </>
          )}
        </Button>

        {!status?.apifyEnabled ? (
          <p className="mt-2 text-[11px] text-amber-700">
            Hinweis: Kein <code className="font-mono">APIFY_API_TOKEN</code>{" "}
            gesetzt. Es werden Demo-Daten generiert. Fuer echte Inserate Token in{" "}
            <code className="font-mono">.env</code> eintragen.
          </p>
        ) : (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Free-Tier: max. 5 Inserate/Run, 5 Runs/Tag (UTC), 60s Pause zwischen
            Runs. Token gesetzt – echte Flatfox-Inserate werden geladen.
          </p>
        )}
      </div>
    </div>
  )
}
