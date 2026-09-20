import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Impressum – GV Wohnungen",
  description: "Impressum und Anbieterkennzeichnung von GV Wohnungen",
}

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-foreground">Impressum</h1>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="text-xl font-semibold">Anbieter</h2>
            <div className="mt-3 rounded-lg border border-border bg-secondary/30 p-4">
              <p className="font-semibold">GV Wohnungen</p>
              <p className="mt-1">Im Isengrind 35</p>
              <p>8046 Zürich</p>
              <p>Schweiz</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Kontakt</h2>
            <div className="mt-3 space-y-1">
              <p>
                E-Mail:{" "}
                <a href="mailto:gvwohnungen@gmail.com" className="text-primary hover:underline">
                  gvwohnungen@gmail.com
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Vertretungsberechtigte Person</h2>
            <p className="mt-2">
              Der Anbieter wird gesetzlich vertreten durch den Inhaber.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Haftungsausschluss</h2>
            <p className="mt-2">
              Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die
              Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschliesslich
              deren Betreiber verantwortlich.
            </p>
            <p className="mt-2">
              GV Wohnungen ist keine Immobilienvermittlung und vergibt keine Wohnungen. Wir
              bieten ausschliesslich eine Such-Hilfe für Wohnungsanzeigen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Urheberrecht</h2>
            <p className="mt-2">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
              unterliegen dem schweizerischen Urheberrecht. Die Vervielfältigung, Bearbeitung,
              Verbreitung und jede Art der Verwertung ausserhalb der Grenzen des Urheberrechts
              bedürfen der schriftlichen Zustimmung des Anbieters.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Zahlungsverkehr</h2>
            <p className="mt-2">
              Zahlungen werden über den externen Zahlungsdienstleister Stripe (Stripe Payments Europe, Ltd.,
              1 Grand Canal Street Lower, Dublin 2, Irland) abgewickelt. GV Wohnungen speichert
              keine Kreditkartendaten.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Streitbeilegung</h2>
            <p className="mt-2">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-primary hover:underline"
              >
                ec.europa.eu/consumers/odr
              </a>
              . Unsere E-Mail-Adresse finden Sie oben im Impressum.
            </p>
            <p className="mt-2">
              Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor
              einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <a href="/" className="text-sm text-primary hover:underline">← Zurück zur Startseite</a>
        </div>
      </div>
    </div>
  )
}
