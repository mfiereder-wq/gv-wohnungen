import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Datenschutzerklärung – GV Wohnungen",
  description: "Datenschutz von GV Wohnungen nach Schweizer DSG und DSGVO",
}

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-foreground">Datenschutzerklärung</h1>
        <p className="mt-2 text-sm text-muted-foreground">Stand: September 2025</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
          <section>
            <p className="text-muted-foreground">
              Der Schutz Ihrer persönlichen Daten ist uns ein wichtiges Anliegen. Wir behandeln Ihre
              personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften
              (DSG, DSGVO) sowie dieser Datenschutzerklärung.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">1. Verantwortliche Stelle</h2>
            <div className="mt-2 rounded-lg border border-border bg-secondary/30 p-4">
              <p className="font-semibold">GV Wohnungen</p>
              <p>Im Isengrind 35</p>
              <p>8046 Zürich</p>
              <p>Schweiz</p>
              <p className="mt-1">
                E-Mail:{" "}
                <a href="mailto:gvwohnungen@gmail.com" className="text-primary hover:underline">
                  gvwohnungen@gmail.com
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Erhebung und Verarbeitung von Daten</h2>
            <p className="mt-2">
              Wir erheben und verarbeiten folgende personenbezogene Daten:
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>
                <strong>Registrierungsdaten:</strong> E-Mail-Adresse, Name (optional),
                verschlüsseltes Passwort
              </li>
              <li>
                <strong>Nutzungsdaten:</strong> Abo-Status, Kauf-Historie, Suchanfragen
              </li>
              <li>
                <strong>Zahlungsdaten:</strong> Stripe-Kunden-ID (Kreditkartendaten werden von
                Stripe verarbeitet und nicht von uns gespeichert)
              </li>
              <li>
                <strong>Technische Daten:</strong> IP-Adresse, Browser-Typ, Zugriffszeitpunkt
                (für Sicherheitszwecke)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Zweck der Datenverarbeitung</h2>
            <p className="mt-2">Die Verarbeitung erfolgt zu folgenden Zwecken:</p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>Bereitstellung der Plattform und der Suchfunktion</li>
              <li>Verwaltung des Nutzerkontos und der Abonnements</li>
              <li>Abwicklung von Zahlungen über Stripe</li>
              <li>Freischaltung von Inserat-Links und Kontaktdaten</li>
              <li>Technischer Betrieb und Sicherheit der Plattform</li>
              <li>Rechtskonforme Aufbewahrung von Buchungsunterlagen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Rechtsgrundlagen</h2>
            <p className="mt-2">
              Die Verarbeitung erfolgt gestützt auf:
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>Art. 13 Abs. 1 DSG (schweizerisches Datenschutzgesetz)</li>
              <li>Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</li>
              <li>Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)</li>
              <li>Art. 6 Abs. 1 lit. c DSGVO (rechtliche Verpflichtung)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Cookies und lokale Speicherung</h2>
            <p className="mt-2">
              Diese Website verwendet Cookies und lokale Speicherung (localStorage) für folgende Zwecke:
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>
                <strong>Notwendige Cookies:</strong> Session-Token, CSRF-Token (für Login und Sicherheit)
              </li>
              <li>
                <strong>Funktionale Speicherung:</strong> Suchfilter-Einstellungen (in localStorage)
              </li>
              <li>
                <strong>Analytics (falls eingewilligt):</strong> Anonyme Nutzungsstatistiken
              </li>
            </ul>
            <p className="mt-2">
              Notwendige Cookies sind für den Betrieb der Website erforderlich und können nicht
              deaktiviert werden. Für nicht-notwendige Cookies wird vor dem Setzen eine Einwilligung
              eingeholt (Cookie-Banner).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Weitergabe von Daten</h2>
            <p className="mt-2">
              Eine Weitergabe personenbezogener Daten an Dritte erfolgt nur, soweit dies für die
              Vertragserfüllung erforderlich ist:
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>
                <strong>Stripe:</strong> E-Mail-Adresse und Zahlungsstatus für die Abwicklung
                von Zahlungen. Stripe verarbeitet Daten gemäss den eigenen Datenschutzbestimmungen.
              </li>
              <li>
                <strong>Hosting-Anbieter (Vercel):</strong> Technische Daten für den Betrieb der Website.
              </li>
              <li>
                <strong>Datenbank (Neon):</strong> Speicherung von Nutzerdaten in der Schweiz/EU.
              </li>
            </ul>
            <p className="mt-2">
              Eine Weitergabe an sonstige Dritte erfolgt nicht ohne ausdrückliche Einwilligung.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Stripe (Zahlungsdienstleister)</h2>
            <p className="mt-2">
              Für die Zahlungsabwicklung nutzen wir Stripe Payments Europe, Ltd. (Dublin, Irland).
              Beim Checkout werden Sie auf die Stripe-Website weitergeleitet. Stripe verarbeitet
              die Zahlungsdaten eigenverantwortlich. Es gelten die Datenschutzbestimmungen von Stripe:
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-primary hover:underline"
              >
                stripe.com/privacy
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Speicherdauer</h2>
            <p className="mt-2">
              Personendaten werden so lange gespeichert, wie es für den jeweiligen Zweck erforderlich ist:
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>Nutzerkonto: bis zur Löschung durch den Nutzer</li>
              <li>Zahlungsunterlagen: 10 Jahre (steuerrechtliche Aufbewahrungspflicht)</li>
              <li>Nutzungsdaten: 6 Monate nach der letzten Nutzung</li>
              <li>Inseratsdaten: 10 Tage (TTL-Caching), dann automatische Löschung</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Ihre Rechte</h2>
            <p className="mt-2">Sie haben folgende Rechte:</p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>Auskunft über Ihre gespeicherten Daten (Art. 25 DSG / Art. 15 DSGVO)</li>
              <li>Berichtigung unrichtiger Daten (Art. 32 DSG / Art. 16 DSGVO)</li>
              <li>Löschung Ihrer Daten (Art. 32 DSG / Art. 17 DSGVO)</li>
              <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruch gegen die Verarbeitung (Art. 21 DSG / Art. 21 DSGVO)</li>
              <li>Widerruf einer erteilten Einwilligung</li>
            </ul>
            <p className="mt-2">
              Zur Ausübung Ihrer Rechte wenden Sie sich an gvwohnungen@gmail.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. Datenübermittlung ins Ausland</h2>
            <p className="mt-2">
              Daten werden teilweise durch Vercel (USA) und Stripe (Irland) verarbeitet. Es gelten
              die entsprechenden Datenschutzabkommen zwischen der Schweiz/EU und diesen Ländern.
              Mit Vercel und Stripe wurden Auftragsverarbeitungsverträge abgeschlossen, die eine
              DSG-konforme Verarbeitung sicherstellen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">11. Datensicherheit</h2>
            <p className="mt-2">
              Wir treffen technische und organisatorische Massnahmen zum Schutz Ihrer Daten:
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>SSL-Verschlüsselung (HTTPS) für die gesamte Datenübertragung</li>
              <li>Passwort-Hashing mit bcrypt</li>
              <li>JWT-basierte Authentifizierung</li>
              <li>Zugriffskontrollen und Logging</li>
              <li>Regelmässige Sicherheitsupdates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">12. Anmeldung bei der Datenschutz-Aufsichtsbehörde</h2>
            <p className="mt-2">
              Zuständige Aufsichtsbehörde für GV Wohnungen ist der Eidgenössische Datenschutz-
              und Öffentlichkeitsbeauftragte (EDÖB):
            </p>
            <p className="mt-2">
              Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragter<br />
              Feldeggweg 1, 3003 Bern<br />
              <a
                href="https://www.edoeb.admin.ch"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                www.edoeb.admin.ch
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">13. Aktualität der Datenschutzerklärung</h2>
            <p className="mt-2">
              Diese Datenschutzerklärung kann bei Änderungen angepasst werden. Die jeweils aktuelle
              Version ist auf der Website abrufbar.
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
