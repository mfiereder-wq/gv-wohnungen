"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  Home,
  CheckCircle2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useGV } from "@/store/gv"
import { toast } from "sonner"

export function AuthModal() {
  const { activeModal, authMode, closeModal, setFilters } = useGV()
  const open = activeModal === "auth"
  const isRegister = authMode === "register"
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const switchMode = () =>
    useGV.setState({ authMode: isRegister ? "login" : "register" })

  const reset = () => {
    setEmail("")
    setPassword("")
    setName("")
    setShowPwd(false)
    setLoading(false)
  }

  const handleClose = () => {
    reset()
    closeModal()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isRegister) {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Registrierung fehlgeschlagen")

        // Nach Registrierung direkt einloggen
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })
        if (result?.error) {
          throw new Error(result.error)
        }
        toast.success("Konto erstellt und eingeloggt!")
        useGV.getState().triggerRefreshSession()
        handleClose()
        router.refresh()
      } else {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })
        if (result?.error) {
          throw new Error(
            result.error === "CredentialsSignin"
              ? "E-Mail oder Passwort falsch"
              : result.error,
          )
        }
        toast.success("Erfolgreich angemeldet!")
        useGV.getState().triggerRefreshSession()
        handleClose()
        router.refresh()
      }
    } catch (e: any) {
      toast.error(e?.message || "Etwas ist schiefgelaufen.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md p-0 shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary to-primary/80 px-6 py-6 text-primary-foreground">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-primary-foreground/80 transition-colors hover:bg-white/15"
            aria-label="Schliessen"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                {isRegister ? "Konto erstellen" : "Willkommen zurueck"}
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/85">
                {isRegister
                  ? "In wenigen Sekunden registrieren"
                  : "Melde dich an, um Kontakte freizuschalten"}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Body */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
          className="space-y-4 px-6 py-6"
        >
          {isRegister && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Name (optional)</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Dein Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9"
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">E-Mail</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="deine@email.ch"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Passwort</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPwd ? "text" : "password"}
                placeholder="mindestens 8 Zeichen"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-10"
                required
                minLength={8}
                autoComplete={isRegister ? "new-password" : "current-password"}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPwd ? "Verbergen" : "Anzeigen"}
              >
                {showPwd ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {isRegister && (
              <p className="text-[11px] text-muted-foreground">
                Mindestens 8 Zeichen. Wir speichern Passwoerter verschluesselt.
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isRegister ? "Wird erstellt..." : "Anmelden..."}
              </>
            ) : isRegister ? (
              "Konto erstellen"
            ) : (
              "Anmelden"
            )}
          </Button>

          <Separator />

          <div className="text-center text-sm text-muted-foreground">
            {isRegister ? (
              <>
                Bereits ein Konto?{" "}
                <button
                  type="button"
                  onClick={switchMode}
                  className="font-medium text-primary hover:underline"
                >
                  Anmelden
                </button>
              </>
            ) : (
              <>
                Noch kein Konto?{" "}
                <button
                  type="button"
                  onClick={switchMode}
                  className="font-medium text-primary hover:underline"
                >
                  Jetzt registrieren
                </button>
              </>
            )}
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  )
}
