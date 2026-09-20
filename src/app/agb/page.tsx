import { Metadata } from "next"

export const metadata: Metadata = {
  title: "AGB – GV Wohnungen",
  description: "Allgemeine Geschäftsbedingungen von GV Wohnungen",
}

export default function AGBPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-foreground">Allgemeine Geschäftsbedingungen (AGB)</h1>
        <p className="mt-2 text-sm text-muted-foreground">Stand: September 2025</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="text-xl font-semibold">§ 1 Anbieter und Geltungsbereich</h2>
            <p className="mt-2">
              Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der Website
              www.gv-wohnungen.online (nachfolgend «Plattform») betrieben durch:
            </p>
            <p className="mt-2">
              GV Wohnungen<br />
              Im Isengrind 35<br />
              8046 Zürich<br />
              Schweiz<br />
              E-Mail: gvwohnungen@gmail.com
            </p>
            <p className="mt-2">
              Die Plattform bietet eine Such- und Vermittlungshilfe für Wohnungsanzeigen in der Schweiz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">§ 2 Wesen der Dienstleistung</h2>
            <p className="mt-2">
              <strong>Wichtiger Hinweis:</strong> GV Wohnungen ist <strong>keine Immobilienvermittlung</strong>
              und vergibt <strong>keine Wohnungen</strong>. Wir sind keine Partei bei Mietverträgen und
              haben keinen Einfluss auf die Vergabe von Wohnungen durch Vermieter oder Immobilienanbieter.
            </p>
            <p className="mt-2">
              Die Plattform vereinfacht ausschliesslich die <strong>Suche</strong> nach verfügbaren
              Wohnungsanzeigen, indem sie Inserate verschiedener Quellen (z. B. Homegate, Comparis,
              Flatfox) bündelt und durchsuchbar macht. Nutzer erhalten Zugang zu:
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>Direkten Inserat-Links zu den ursprünglichen Anbietern</li>
              <li>Grundlegenden Inseratsinformationen (Preis, Zimmer, Fläche, Ort)</li>
              <li>Bildern und Beschreibungen der Inserate</li>
              <li>Einer Liste von Wohnbaugenossenschaften mit Kontaktdaten</li>
            </ul>
            <p className="mt-2">
              Die eigentliche Kontaktaufnahme mit Vermietern und die Bewerbung um Wohnungen
              erfolgt ausserhalb unserer Plattform direkt über die jeweiligen Anbieter.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">§ 3 Hinweis zu Inseratsbildern und Informationen</h2>
            <p className="mt-2">
              Die auf der Plattform angezeigten <strong>Bilder können variieren</strong> und sind
              <strong> nicht immer echte Fotos</strong> des konkret inserierten Objekts. Bilder dienen
              teilweise lediglich der Veranschaulichung und können Platzhalter oder generierte
              Abbildungen sein. Massgeblich für die Beurteilung einer Wohnung sind ausschliesslich
              die Informationen auf der Originalseite des jeweiligen Anbieters.
            </p>
            <p className="mt-2">
              Auch sonstige Inseratsinformationen (Preise, Zimmeranzahl, Flächen, Verfügbarkeit)
              können unvollständig, veraltet oder fehlerhaft sein. GV Wohnungen übernimmt keine
              Gewähr für die Richtigkeit, Vollständigkeit und Aktualität der angezeigten Daten.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">§ 4 Registrierung und Nutzerkonto</h2>
            <p className="mt-2">
              Für die Nutzung bestimmter Funktionen (Freischaltung von Inserat-Links, Genossenschaftsliste)
              ist eine Registrierung erforderlich. Bei der Registrierung sind wahrheitsgemässe
              Angaben zu machen. Das Passwort ist vertraulich zu behandeln.
            </p>
            <p className="mt-2">
              Nutzer sind für alle Aktivitäten unter ihrem Konto verantwortlich. Die Weitergabe
              von Zugangsdaten an Dritte ist untersagt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">§ 5 Kosten und Abonnements</h2>
            <p className="mt-2">
              Die grundsätzliche Nutzung der Plattform (Suche, Anzeige von Basis-Inseratsdaten)
              ist kostenlos. Folgende kostenpflichtige Dienste werden angeboten:
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>
                <strong>Wochen-Abo (CHF 5.90 / Woche):</strong> Freischaltung aller Inserat-Links
                und Kontaktdaten. Wöchentlich kündbar.
              </li>
              <li>
                <strong>Einmaliger Kauf Genossenschaftsliste (CHF 29.90):</strong> Einmalige Zahlung
                für dauerhaften Zugriff auf die Kontaktliste der Wohnbaugenossenschaften.
              </li>
            </ul>
            <p className="mt-2">
              Zahlungen erfolgen über den externen Zahlungsdienstleister Stripe. GV Wohnungen
              speichert keine Kreditkartendaten.
            </p>
            <p className="mt-2">
              Das Wochen-Abo verlängert sich automatisch jede Woche, bis es gekündigt wird.
              Die Kündigung ist jederzeit über das Nutzerkonto oder das Stripe Customer Portal möglich.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">§ 6 Widerrufsrecht</h2>
            <p className="mt-2">
              Gemäss Art. 40a ff. des Bundesgesetzes über den Konsumkredit (KKG) bzw. den
              Bestimmungen über Fernabsatzverträge besteht ein Widerrufsrecht von 14 Tagen
              ab Vertragsabschluss.
            </p>
            <p className="mt-2">
              Das Widerrufsrecht erlischt jedoch bei Verträgen über digitale Inhalte, die nicht
              auf einem materiellen Datenträger geliefert werden (wie der Zugang zu Links und
              Kontaktdaten), wenn mit ausdrücklicher Zustimmung des Nutzers vor Ablauf der
              Widerrufsfrist mit der Leistung begonnen wurde.
            </p>
            <p className="mt-2">
              Durch das Freischalten von Links oder das Anzeigen von Kontaktdaten willigt der
              Nutzer ausdrücklich ein, dass die Leistung vor Ablauf der Widerrufsfrist erbracht wird.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">§ 7 Haftungsausschluss</h2>
            <p className="mt-2">
              GV Wohnungen haftet nach Massgabe der folgenden Bestimmungen:
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>
                Eine Haftung für leichte Fahrlässigkeit ist ausgeschlossen, soweit es sich nicht
                um die Verletzung von vertragswesentlichen Pflichten handelt.
              </li>
              <li>
                Für die Richtigkeit, Vollständigkeit und Aktualität der Inseratsdaten sowie für
                die Verfügbarkeit und Inhalte der verlinkten externen Seiten wird keine Haftung übernommen.
              </li>
              <li>
                GV Wohnungen ist nicht Vertragspartei bei Mietverhältnissen, die zwischen
                Nutzern und Vermietern zustande kommen.
              </li>
              <li>
                Für Schäden aus der Nutzung verlinkter externer Angebote haftet ausschliesslich
                der jeweilige Anbieter.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">§ 8 Links zu externen Angeboten</h2>
            <p className="mt-2">
              Die Plattform enthält Links zu externen Websites (z. B. Homegate, Comparis, Flatfox),
              deren Inhalte nicht von GV Wohnungen kontrolliert werden. Für diese Inhalte sind
              ausschliesslich die jeweiligen Betreiber verantwortlich.
            </p>
            <p className="mt-2">
              Die Einrichtung von Links stellt keine Zustimmung zu den Inhalten der verlinkten
              Seiten dar und begründet keine vertragliche Beziehung zwischen GV Wohnungen und
              den externen Anbietern.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">§ 9 Genossenschaftsliste</h2>
            <p className="mt-2">
              Die erworbene Genossenschaftsliste enthält Kontaktdaten von Wohnbaugenossenschaften,
              die günstigen Wohnraum anbieten. GV Wohnungen garantiert nicht, dass durch die
              Kontaktaufnahme eine Wohnung erhalten wird. Die Aufnahme in Wartelisten und die
              Vergabe von Wohnungen obliegt ausschliesslich den jeweiligen Genossenschaften.
            </p>
            <p className="mt-2">
              Die Kontaktdaten werden nach bestem Wissen recherchiert, können sich jedoch ändern.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">§ 10 Pflichten des Nutzers</h2>
            <p className="mt-2">Der Nutzer verpflichtet sich:</p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>Keine missbräuchlichen Handlungen vorzunehmen</li>
              <li>Keine automatisierten Abfragesysteme (Bots, Scraper) einzusetzen</li>
              <li>Keine Inhalte zu kopieren oder anderweitig kommerziell zu nutzen</li>
              <li>Bei Vermietern wahrheitsgemässe Angaben zu machen</li>
              <li>Die geltenden Gesetze, insbesondere das Schweizerische Obligationenrecht, zu beachten</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">§ 11 Beendigung</h2>
            <p className="mt-2">
              Das Wochen-Abo kann jederzeit gekündigt werden. Die Kündigung wird am Ende der
              laufenden Abrechnungsperiode wirksam.
            </p>
            <p className="mt-2">
              GV Wohnungen behält sich vor, Konten bei Verstössen gegen diese AGB oder geltendes
              Recht ohne Vorankündigung zu sperren.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">§ 12 Datenschutz</h2>
            <p className="mt-2">
              Die Verarbeitung personenbezogener Daten erfolgt gemäss unserer
              <a href="/datenschutz" className="text-primary underline"> Datenschutzerklärung</a> und dem
              Schweizer Datenschutzgesetz (DSG) sowie der Datenschutz-Grundverordnung (DSGVO).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">§ 13 Anwendbares Recht und Gerichtsstand</h2>
            <p className="mt-2">
              Es gilt ausschliesslich schweizerisches Recht. Ausschliesslicher Gerichtsstand für
              alle Streitigkeiten ist Zürich, Schweiz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">§ 14 Änderungen der AGB</h2>
            <p className="mt-2">
              GV Wohnungen behält sich vor, diese AGB jederzeit zu ändern. Über wesentliche
              Änderungen werden Nutzer per E-Mail informiert. Die jeweils aktuelle Version ist
              auf der Website abrufbar.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">§ 15 Schlussbestimmungen</h2>
            <p className="mt-2">
              Sollten einzelne Bestimmungen dieser AGB unwirksam oder undurchführbar sein oder werden,
              bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. An die Stelle der unwirksamen
              Bestimmung tritt eine wirksame, die dem wirtschaftlichen Zweck am nächsten kommt.
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
