"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Home, LogIn, UserCircle, LogOut, Crown, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useGV } from "@/store/gv"
import { useState } from "react"

export function Header() {
  const { data: session } = useSession()
  const openAuth = useGV((s) => s.openAuth)
  const openAccount = useGV((s) => s.openAccount)
  const [mobileOpen, setMobileOpen] = useState(false)

  const subStatus = (session?.user as any)?.subscriptionStatus ?? "none"
  const hasAbo = subStatus === "active" || subStatus === "trialing"

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
          aria-label="GV Wohnungen Startseite"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Home className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-bold tracking-tight text-foreground">
              GV Wohnungen
            </span>
            <span className="text-[11px] text-muted-foreground">
              Bezahlbarer Wohnraum Schweiz
            </span>
          </div>
        </Link>

        {/* Desktop-Navigation */}
        <nav className="hidden items-center gap-2 md:flex">
          {session ? (
            <>
              {hasAbo && (
                <Badge
                  variant="secondary"
                  className="mr-1 gap-1 border-primary/20 bg-primary/10 text-primary"
                >
                  <Crown className="h-3.5 w-3.5" />
                  Abo aktiv
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={openAccount}
                className="gap-2"
              >
                <UserCircle className="h-4 w-4" />
                <span className="max-w-[160px] truncate">
                  {session.user?.name || session.user?.email}
                </span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ redirect: false })}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Abmelden
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openAuth("login")}
                className="gap-2"
              >
                <LogIn className="h-4 w-4" />
                Anmelden
              </Button>
              <Button
                size="sm"
                onClick={() => openAuth("register")}
                className="gap-2"
              >
                Konto erstellen
              </Button>
            </>
          )}
        </nav>

        {/* Mobile-Toggle */}
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-accent md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menü umschalten"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile-Menü */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-3 md:hidden">
          {session ? (
            <div className="flex flex-col gap-2">
              {hasAbo && (
                <Badge
                  variant="secondary"
                  className="w-fit gap-1 border-primary/20 bg-primary/10 text-primary"
                >
                  <Crown className="h-3.5 w-3.5" />
                  Abo aktiv
                </Badge>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setMobileOpen(false)
                  openAccount()
                }}
                className="justify-start gap-2"
              >
                <UserCircle className="h-4 w-4" />
                {session.user?.name || session.user?.email}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setMobileOpen(false)
                  signOut({ redirect: false })
                }}
                className="justify-start gap-2"
              >
                <LogOut className="h-4 w-4" />
                Abmelden
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setMobileOpen(false)
                  openAuth("login")
                }}
                className="justify-start gap-2"
              >
                <LogIn className="h-4 w-4" />
                Anmelden
              </Button>
              <Button
                onClick={() => {
                  setMobileOpen(false)
                  openAuth("register")
                }}
              >
                Konto erstellen
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
