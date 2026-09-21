import Link from "next/link"
import { Home, Mail, Shield } from "lucide-react"

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-auto border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Marke */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Home className="h-4 w-4" strokeWidth={2.5} />
              </div>
              <span className="text-base font-bold">GV Wohnungen</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Bezahlbare Mietwohnungen in der Schweiz – ohne Maklerueberlastung.
              Echte Flatfox-Inserate mit freischaltbaren Links.
            </p>
          </div>

          {/* Plattform */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Plattform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/"
                  className="relative inline-block transition-colors after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-current after:content-[''] after:transition-[width] after:duration-300 hover:text-primary hover:after:w-full"
                >
                  Wohnungen suchen
                </Link>
              </li>
              <li>
                <Link
                  href="/?account=1"
                  className="relative inline-block transition-colors after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-current after:content-[''] after:transition-[width] after:duration-300 hover:text-primary hover:after:w-full"
                >
                  Mein Konto
                </Link>
              </li>
              <li>
                <span className="cursor-default">Preise &amp; Abo</span>
              </li>
            </ul>
          </div>

          {/* Rechtliches */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Rechtliches</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/impressum" className="relative inline-block transition-colors after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-current after:content-[''] after:transition-[width] after:duration-300 hover:text-primary hover:after:w-full">
                  Impressum
                </Link>
              </li>
              <li>
                <Link href="/datenschutz" className="relative inline-block transition-colors after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-current after:content-[''] after:transition-[width] after:duration-300 hover:text-primary hover:after:w-full">
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link href="/agb" className="relative inline-block transition-colors after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-current after:content-[''] after:transition-[width] after:duration-300 hover:text-primary hover:after:w-full">
                  AGB
                </Link>
              </li>
              <li>
                <span className="cursor-default">Widerrufsrecht</span>
              </li>
            </ul>
          </div>

          {/* Kontakt */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Kontakt</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>gvwohnungen@gmail.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Schweizer Sitz</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>&copy; {year} GV Wohnungen. Alle Rechte vorbehalten.</p>
          <p className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            Made in Switzerland
          </p>
        </div>
      </div>
    </footer>
  )
}
