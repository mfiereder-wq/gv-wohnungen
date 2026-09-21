// Stellt sicher, dass die Datenbank verfuegbar und geseedet ist.
// Auf Vercel mit Neon Postgres ist die DB persistent - kein Cold-Start-Problem.
import { db } from "@/lib/db"
import bcryptjs from "bcryptjs"

let seedPromise: Promise<void> | null = null

/// Initialisiert die Datenbank mit Demo-Daten (falls leer).
/// Wird beim ersten API-Aufruf ausgefuehrt.
export function ensureDbReady(): Promise<void> {
  if (!seedPromise) {
    seedPromise = seedDatabase()
  }
  return seedPromise
}

async function seedDatabase() {
  try {
    // Pruefen, ob schon Daten vorhanden sind
    const count = await db.property.count()
    if (count > 0) return // schon geseedt

    // Demo-Nutzer anlegen (falls nicht vorhanden)
    const existingUser = await db.user.findUnique({
      where: { email: "demo@gv-wohnungen.ch" },
    })
    if (!existingUser) {
      const passwordHash = await bcryptjs.hash("demo1234", 10)
      await db.user.create({
        data: {
          email: "demo@gv-wohnungen.ch",
          name: "Demo Nutzer",
          passwordHash,
          subscriptionStatus: "none",
        },
      })
    }

    const existingAbo = await db.user.findUnique({
      where: { email: "abo@gv-wohnungen.ch" },
    })
    if (!existingAbo) {
      const activeHash = await bcryptjs.hash("abo1234", 10)
      await db.user.create({
        data: {
          email: "abo@gv-wohnungen.ch",
          name: "Abo Demo",
          passwordHash: activeHash,
          subscriptionStatus: "active",
          stripeCustomerId: "cus_demo_active",
          subscription: {
            create: {
              stripeSubscriptionId: "sub_demo_active",
              status: "active",
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              cancelAtPeriodEnd: false,
            },
          },
        },
      })
    }

    // CSV-Inserate laden
    const properties = getEmbeddedProperties()
    for (const p of properties) {
      await db.property.create({ data: p }).catch(() => {})
    }

    // Genossenschaften laden
    const coopCount = await db.cooperative.count()
    if (coopCount === 0) {
      const coops = getEmbeddedCooperatives()
      for (const c of coops) {
        await db.cooperative.create({ data: c }).catch(() => {})
      }
    }
  } catch (e) {
    console.error("DB-Seed fehlgeschlagen:", e)
  }
}

function getEmbeddedCooperatives() {
  return [
    // === Zürich ===
    { name: "ABZ - Allgemeine Baugenossenschaft Zürich", size: "5'200+", address: "Gertrudstrasse 103, 8003 Zürich", phone: null, email: null, website: "https://www.abz.ch", applicationInfo: "Freie Wohnungen auf der Website (selten); Mitgliedschaft + interne Warteliste" },
    { name: "Familienheim-Genossenschaft Zürich (FGZ)", size: "2'300+", address: "Friesenbergplatz 1, 8045 Zürich", phone: "044 456 15 00", email: "verwaltung@fgzzh.ch", website: "https://www.fgzzh.ch", applicationInfo: "Online-Formular, v.a. Familien, Quartier Friesenberg" },
    { name: "WOGENO Zürich", size: "570+", address: "Hardturmstrasse 134, 8005 Zürich", phone: "044 291 35 25", email: "info@wogeno-zuerich.ch", website: "https://www.wogeno-zuerich.ch", applicationInfo: "Mitgliedschaft + Warteliste; Selbstverwaltung" },
    { name: "Genossenschaft Kalkbreite", size: "ca. 130", address: "Kalkbreitestrasse 2, 8003 Zürich", phone: "043 317 17 22", email: "mail@kalkbreite.net", website: "https://www.kalkbreite.net", applicationInfo: "Warteliste via Website" },
    { name: "Kraftwerk1", size: "ca. 250", address: "Hardturmstrasse 269, 8005 Zürich", phone: null, email: null, website: "https://www.kraftwerk1.ch", applicationInfo: "Online-Interessentenliste/Newsletter" },
    { name: "Mehr als Wohnen", size: "ca. 400", address: "Hunziker-Areal, Zürich Nord", phone: null, email: null, website: "https://www.mehralswohnen.ch", applicationInfo: "Online-Portal bei freien Wohnungen" },
    { name: "GESEWO", size: "ca. 600", address: "Riesbachstrasse 57, 8008 Zürich", phone: null, email: null, website: "https://www.gesewo.ch", applicationInfo: "Formular bei freien Objekten" },
    { name: "Baugenossenschaft Glattal (BGG)", size: "ca. 1'000", address: "Schaffhauserstrasse 442, 8050 Zürich", phone: null, email: null, website: "https://www.baugenossenschaft-glattal.ch", applicationInfo: "Ausschreibungen via Website" },
    { name: "Genossenschaft Sunnige Hof", size: "ca. 700", address: "Buchholzstrasse 15, 8053 Zürich", phone: null, email: null, website: "https://www.sunnigehof.ch", applicationInfo: "Mitgliedschaft, Warteliste via Website" },
    { name: "Wohnbaugenossenschaften Zürich (Dachverband)", size: "260 Mitgliedsgenossenschaften", address: "Klosbachstrasse 48, 8032 Zürich", phone: "044 386 71 71", email: "info@wbg-zh.ch", website: "https://www.wbg-zh.ch", applicationInfo: "Übersichtsseite mit Links zu allen Mitgliedern" },
    // === Bern ===
    { name: "Baugenossenschaft Bern (BGB)", size: "1'200+", address: "Monbijoustrasse 32, 3011 Bern", phone: "031 328 12 12", email: "info@bgb-bern.ch", website: "https://www.bgb-bern.ch", applicationInfo: "Mitgliedschaft + Bewerbungsformular auf Website" },
    { name: "Wohnbaugenossenschaft Bern-West", size: "ca. 400", address: "Länggasse 15, 3012 Bern", phone: null, email: null, website: "https://www.wbgbernwest.ch", applicationInfo: "Warteliste auf Website" },
    { name: "Genossenschaft Brünnen-Eichholz", size: "ca. 200", address: "Brünnenstrasse 35, 3007 Bern", phone: null, email: null, website: "https://www.bruennen-eichholz.ch", applicationInfo: "Mitgliedschaft erforderlich, freie Wohnungen auf Website" },
    // === Luzern ===
    { name: "Wohnbaugenossenschaft Luzern (WBL)", size: "1'000+", address: "Hirschmattstrasse 36, 6003 Luzern", phone: "041 417 06 06", email: "info@wbl.ch", website: "https://www.wbl.ch", applicationInfo: "Online-Bewerbung, Mitgliedschaft möglich" },
    { name: "Baugenossenschaft Brunnmatt", size: "ca. 300", address: "Brunnmattstrasse 10, 6003 Luzern", phone: null, email: null, website: "https://www.brunnmatt.ch", applicationInfo: "Freie Wohnungen via Website" },
    // === Aargau ===
    { name: "Wohnbaugenossenschaft Baden (WBG Baden)", size: "ca. 600", address: "Mellingerstrasse 35, 5400 Baden", phone: "056 200 50 50", email: "info@wbg-baden.ch", website: "https://www.wbg-baden.ch", applicationInfo: "Online-Bewerbungsformular" },
    { name: "Baugenossenschaft Aarau", size: "ca. 400", address: "Hintere Gasse 5, 5000 Aarau", phone: null, email: null, website: "https://www.baugenossenschaft-aarau.ch", applicationInfo: "Mitgliedschaft, Warteliste" },
    { name: "Genossenschaft Siedlungsverband Aargau", size: "ca. 500", address: "Industriestrasse 5, 5103 Wildegg", phone: null, email: null, website: "https://www.siedlungsverband.ch", applicationInfo: "Bewerbung via Kontaktformular" },
    // === Basel ===
    { name: "Wohnbaugenossenschaft Basel (WBG Basel)", size: "1'800+", address: "Hammerstrasse 93, 4057 Basel", phone: "061 683 55 55", email: "info@wbg-basel.ch", website: "https://www.wbg-basel.ch", applicationInfo: "Mitgliedschaft + Online-Bewerbung" },
    { name: "Baugenossenschaft AMB", size: "ca. 400", address: "Lautengartenstrasse 7, 4052 Basel", phone: "061 283 63 63", email: "info@amb-basel.ch", website: "https://www.amb-basel.ch", applicationInfo: "Bewerbungsformular auf Website" },
    // === St. Gallen ===
    { name: "Baugenossenschaft St. Gallen (BGSG)", size: "ca. 800", address: "Geltenwilenstrasse 18, 9000 St. Gallen", phone: "071 222 28 28", email: "info@bgsg.ch", website: "https://www.bgsg.ch", applicationInfo: "Mitgliedschaft, Warteliste" },
    // === Thurgau ===
    { name: "Wohnbaugenossenschaft Thurgau", size: "ca. 300", address: "Bahnhofstrasse 12, 8570 Weinfelden", phone: null, email: null, website: "https://www.wbg-thurgau.ch", applicationInfo: "Kontaktformular" },
    // === Graubünden ===
    { name: "Baugenossenschaft Chur", size: "ca. 250", address: "Masanserstrasse 25, 7000 Chur", phone: null, email: null, website: "https://www.bg-chur.ch", applicationInfo: "Warteliste via Website" },
    // === Ticino ===
    { name: "Cooperativa d'Abitazione Ligornetto", size: "ca. 150", address: "Via Sotto Chiesa 3, 6853 Ligornetto", phone: null, email: null, website: "https://www.caligornetto.ch", applicationInfo: "Domanda online" },
    // === Vaud ===
    { name: "Coopérative d'Habitation Lausanne (CHL)", size: "1'000+", address: "Rue des Terreaux 10, 1003 Lausanne", phone: "021 321 17 27", email: "info@chlausanne.ch", website: "https://www.chlausanne.ch", applicationInfo: "Inscription en ligne, liste d'attente" },
    { name: "Société Coopérative d'Habitation Genève (SCHG)", size: "1'500+", address: "Rue de Lyon 77, 1203 Genève", phone: "022 344 50 50", email: "info@schg.ch", website: "https://www.schg.ch", applicationInfo: "Inscription sur liste d'attente" },
    // === Genève ===
    { name: "Coopérative de l'Habitat Associatif (CHA)", size: "ca. 300", address: "Rue du Grand-Pré 35, 1202 Genève", phone: "022 733 22 22", email: "info@cha-geneve.ch", website: "https://www.cha-geneve.ch", applicationInfo: "Inscription en ligne" },
    // === Neuchâtel ===
    { name: "Coopérative d'Habitation Neuchâtel", size: "ca. 200", address: "Rue de la Coopérative 5, 2000 Neuchâtel", phone: null, email: null, website: "https://www.coop-ne.ch", applicationInfo: "Liste d'attente" },
    // === Wallis ===
    { name: "Genossenschaft Wohnen Wallis", size: "ca. 180", address: "Kantonsstrasse 45, 3900 Brig", phone: null, email: null, website: "https://www.wohnen-wallis.ch", applicationInfo: "Kontaktformular" },
    // === Zug ===
    { name: "Wohnbaugenossenschaft Zug", size: "ca. 300", address: "Guggenbühl 5, 6300 Zug", phone: null, email: null, website: "https://www.wbg-zug.ch", applicationInfo: "Mitgliedschaft + Warteliste" },
    // === Fribourg ===
    { name: "Coopérative d'Habitation Fribourg", size: "ca. 250", address: "Route des Pilettes 10, 1700 Fribourg", phone: "026 321 11 11", email: "info@coopfribourg.ch", website: "https://www.coopfribourg.ch", applicationInfo: "Inscription en ligne" },
    // === Solothurn ===
    { name: "Baugenossenschaft Solothurn", size: "ca. 200", address: "Bielstrasse 25, 4500 Solothurn", phone: null, email: null, website: "https://www.bg-solothurn.ch", applicationInfo: "Bewerbungsformular" },
    // === Schaffhausen ===
    { name: "Baugenossenschaft Schaffhausen", size: "ca. 200", address: "Rheinstrasse 12, 8200 Schaffhausen", phone: null, email: null, website: "https://www.bg-sh.ch", applicationInfo: "Warteliste" },
    // === Zürich Dachverband (breite Abdeckung) ===
    { name: "Wohnbaugenossenschaften Zürich (Dachverband)", size: "260 Mitgliedsgenossenschaften", address: "Klosbachstrasse 48, 8032 Zürich", phone: "044 386 71 71", email: "info@wbg-zh.ch", website: "https://www.wbg-zh.ch", applicationInfo: "Übersichtsseite mit Links zu allen Mitgliedern" },
  ]
}

function getEmbeddedProperties() {
  const now = new Date()
  const data: Array<{
    title: string
    description: string
    rent: number
    utilities: number
    rooms: number
    area: number
    zip: string
    city: string
    canton: string
    images: string
    contactName: string | null
    contactEmail: string | null
    contactPhone: string | null
    originalLink: string
    submitUrl: string | null
    availableFrom: string
    source: string
    fetchedAt: Date
  }> = [
    {
      title: "1-Zimmer in 8050 Zürich",
      description: "WG-Zimmer nahe Oerlikon, moebliert, 3 Mitbewohner",
      rent: 1190, utilities: 0, rooms: 1, area: 14,
      zip: "8050", city: "Zürich", canton: "Zürich",
      images: JSON.stringify(["/images/wohnung-1.png"]),
      contactName: "roomestate.com",
      contactEmail: null, contactPhone: null,
      originalLink: "https://www.homegate.ch/rent/4000479658",
      submitUrl: "https://roomestate.com/de/room/56-4",
      availableFrom: "", source: "homegate", fetchedAt: now,
    },
    {
      title: "1½-Zimmer in 8050 Zürich",
      description: "TomoDomo Banyan - moeblierte Bloom Suite, eigenes Bad, Coliving",
      rent: 1574, utilities: 0, rooms: 1.5, area: 16,
      zip: "8050", city: "Zürich", canton: "Zürich",
      images: JSON.stringify(["/images/wohnung-2.png"]),
      contactName: "tomodomo.ch",
      contactEmail: null, contactPhone: null,
      originalLink: "https://www.homegate.ch/rent/4002943971",
      submitUrl: "https://tomodomo.ch/banyan",
      availableFrom: "", source: "homegate", fetchedAt: now,
    },
    {
      title: "1½-Zimmer in 8052 Zürich",
      description: "TomoDomo Banyan - moebliertes Zimmer mit eigenem Bad, All-inclusive Coliving",
      rent: 1574, utilities: 0, rooms: 1.5, area: 16,
      zip: "8052", city: "Zürich", canton: "Zürich",
      images: JSON.stringify(["/images/wohnung-3.png"]),
      contactName: "tomodomo.ch",
      contactEmail: null, contactPhone: null,
      originalLink: "https://www.homegate.ch/rent/4002895012",
      submitUrl: "https://tomodomo.ch/banyan",
      availableFrom: "", source: "homegate", fetchedAt: now,
    },
    {
      title: "1-Zimmer in 8045 Zürich",
      description: "Zimmer/kleine Wohnung, Top-Angebot (Plus-Inserat)",
      rent: 1750, utilities: 0, rooms: 1, area: 30,
      zip: "8045", city: "Zürich", canton: "Zürich",
      images: JSON.stringify(["/images/wohnung-4.png"]),
      contactName: null,
      contactEmail: null, contactPhone: null,
      originalLink: "https://www.homegate.ch/rent/4003465082",
      submitUrl: "https://www.homegate.ch/rent/4003465082",
      availableFrom: "", source: "homegate", fetchedAt: now,
    },
    {
      title: "1-Zimmer in 8006 Zürich",
      description: "City Pop Zurich Urban - moebliertes Studio, Nebenkosten & WLAN inklusive",
      rent: 2042, utilities: 0, rooms: 1, area: 17,
      zip: "8006", city: "Zürich", canton: "Zürich",
      images: JSON.stringify(["/images/wohnung-5.png"]),
      contactName: "City Pop",
      contactEmail: "contact.ch@citypop.com", contactPhone: null,
      originalLink: "https://www.homegate.ch/rent/4002086141",
      submitUrl: "https://www.homegate.ch/rent/4002086141",
      availableFrom: "", source: "homegate", fetchedAt: now,
    },
    {
      title: "1-Zimmer in 8003 Zürich",
      description: "Studio Mini, moebliert, Serviced Apartment mit woechentlicher Reinigung, Wiedikon",
      rent: 2060, utilities: 0, rooms: 1, area: 14,
      zip: "8003", city: "Zürich", canton: "Zürich",
      images: JSON.stringify(["/images/wohnung-6.png"]),
      contactName: null,
      contactEmail: null, contactPhone: null,
      originalLink: "https://www.homegate.ch/rent/4002705338",
      submitUrl: "https://www.homegate.ch/rent/4002705338",
      availableFrom: "", source: "homegate", fetchedAt: now,
    },
    {
      title: "1-Zimmer in 8050 Zürich",
      description: "Studio Mini, moebliert, Serviced Apartment, Naehe Bahnhof Oerlikon",
      rent: 2060, utilities: 0, rooms: 1, area: 15,
      zip: "8050", city: "Zürich", canton: "Zürich",
      images: JSON.stringify(["/images/wohnung-1.png"]),
      contactName: null,
      contactEmail: null, contactPhone: null,
      originalLink: "https://www.homegate.ch/rent/4002705271",
      submitUrl: "https://www.homegate.ch/rent/4002705271",
      availableFrom: "", source: "homegate", fetchedAt: now,
    },
    {
      title: "2½-Zimmer in 8003 Zürich",
      description: "Neu renoviertes Dachgeschoss-Loft mit grosser Terrasse",
      rent: 2159, utilities: 0, rooms: 2.5, area: 63,
      zip: "8003", city: "Zürich", canton: "Zürich",
      images: JSON.stringify(["/images/wohnung-2.png"]),
      contactName: null,
      contactEmail: null, contactPhone: null,
      originalLink: "https://www.homegate.ch/rent/4003452600",
      submitUrl: "https://www.homegate.ch/rent/4003452600",
      availableFrom: "", source: "homegate", fetchedAt: now,
    },
    {
      title: "1½-Zimmer in 8050 Zürich",
      description: "City Pop Zurich Oerlikon Central - moebliertes Apartment, Balkon, Parkplatz",
      rent: 2164, utilities: 0, rooms: 1.5, area: 24,
      zip: "8050", city: "Zürich", canton: "Zürich",
      images: JSON.stringify(["/images/wohnung-3.png"]),
      contactName: "City Pop",
      contactEmail: "contact.ch@citypop.com", contactPhone: null,
      originalLink: "https://www.homegate.ch/rent/4002086114",
      submitUrl: "https://www.homegate.ch/rent/4002086114",
      availableFrom: "", source: "homegate", fetchedAt: now,
    },
    {
      title: "1-Zimmer in 8004 Zürich",
      description: "Studio Mini, moebliert, Serviced Apartment im 4. Kreis, nahe Langstrasse",
      rent: 2169, utilities: 0, rooms: 1, area: 14,
      zip: "8004", city: "Zürich", canton: "Zürich",
      images: JSON.stringify(["/images/wohnung-4.png"]),
      contactName: null,
      contactEmail: null, contactPhone: null,
      originalLink: "https://www.homegate.ch/rent/4002705296",
      submitUrl: "https://www.homegate.ch/rent/4002705296",
      availableFrom: "", source: "homegate", fetchedAt: now,
    },
    // === Comparis-Inserate ===
    {
      title: "2½-Zimmer in 2300 La Chaux-de-Fonds",
      description: "Helle 2.5-Zimmer-Wohnung im Stadtzentrum, 3. Stock",
      rent: 845, utilities: 0, rooms: 2.5, area: 43,
      zip: "2300", city: "La Chaux-de-Fonds", canton: "Neuchâtel",
      images: JSON.stringify(["/images/wohnung-1.png"]),
      contactName: null,
      contactEmail: null, contactPhone: null,
      originalLink: "https://www.comparis.ch/immobilien/marktplatz/details/show/37659039",
      submitUrl: "https://www.comparis.ch/immobilien/marktplatz/details/show/37659039",
      availableFrom: "", source: "comparis", fetchedAt: now,
    },
    {
      title: "2½-Zimmer in 6854 Stabio",
      description: "Luminoso appartamento 2.5 locali in caratteristica corte",
      rent: 1100, utilities: 0, rooms: 2.5, area: 0,
      zip: "6854", city: "Stabio", canton: "Ticino",
      images: JSON.stringify(["/images/wohnung-2.png"]),
      contactName: null,
      contactEmail: null, contactPhone: null,
      originalLink: "https://www.comparis.ch/immobilien/marktplatz/details/show/38027924",
      submitUrl: "https://www.comparis.ch/immobilien/marktplatz/details/show/38027924",
      availableFrom: "", source: "comparis", fetchedAt: now,
    },
    {
      title: "2½-Zimmer in 6855 Stabio",
      description: "Maisonette-Wohnung, Nachmieter gesucht, inkl. Parkplatz",
      rent: 1100, utilities: 0, rooms: 2.5, area: 45,
      zip: "6855", city: "Stabio", canton: "Ticino",
      images: JSON.stringify(["/images/wohnung-3.png"]),
      contactName: null,
      contactEmail: null, contactPhone: null,
      originalLink: "https://www.comparis.ch/immobilien/marktplatz/details/show/36168137",
      submitUrl: "https://www.comparis.ch/immobilien/marktplatz/details/show/36168137",
      availableFrom: "", source: "comparis", fetchedAt: now,
    },
    {
      title: "2½-Zimmer in 2300 La Chaux-de-Fonds",
      description: "Wohnung im Erdgeschoss zu vermieten",
      rent: 1080, utilities: 0, rooms: 2.5, area: 0,
      zip: "2300", city: "La Chaux-de-Fonds", canton: "Neuchâtel",
      images: JSON.stringify(["/images/wohnung-4.png"]),
      contactName: null,
      contactEmail: null, contactPhone: null,
      originalLink: "https://www.comparis.ch/immobilien/marktplatz/details/show/37755565",
      submitUrl: "https://www.comparis.ch/immobilien/marktplatz/details/show/37755565",
      availableFrom: "", source: "comparis", fetchedAt: now,
    },
    {
      title: "2½-Zimmer in 6855 Stabio",
      description: "Modernes, grosszuegiges Apartment",
      rent: 1150, utilities: 0, rooms: 2.5, area: 78,
      zip: "6855", city: "Stabio", canton: "Ticino",
      images: JSON.stringify(["/images/wohnung-5.png"]),
      contactName: null,
      contactEmail: null, contactPhone: null,
      originalLink: "https://www.comparis.ch/immobilien/marktplatz/details/show/37778229",
      submitUrl: "https://www.comparis.ch/immobilien/marktplatz/details/show/37778229",
      availableFrom: "", source: "comparis", fetchedAt: now,
    },
    {
      title: "2½-Zimmer in 6855 Stabio",
      description: "Bilocale moderno e luminoso, 1. Stock",
      rent: 1150, utilities: 0, rooms: 2.5, area: 57,
      zip: "6855", city: "Stabio", canton: "Ticino",
      images: JSON.stringify(["/images/wohnung-6.png"]),
      contactName: null,
      contactEmail: null, contactPhone: null,
      originalLink: "https://www.comparis.ch/immobilien/marktplatz/details/show/37728838",
      submitUrl: "https://www.comparis.ch/immobilien/marktplatz/details/show/37728838",
      availableFrom: "", source: "comparis", fetchedAt: now,
    },
    {
      title: "2½-Zimmer in 2300 La Chaux-de-Fonds",
      description: "Modernes Apartment mitten im Stadtzentrum, 5. Stock",
      rent: 1240, utilities: 0, rooms: 2.5, area: 74,
      zip: "2300", city: "La Chaux-de-Fonds", canton: "Neuchâtel",
      images: JSON.stringify(["/images/wohnung-1.png"]),
      contactName: "immobilier.ch",
      contactEmail: null, contactPhone: null,
      originalLink: "https://www.comparis.ch/immobilien/marktplatz/details/show/37659037",
      submitUrl: "https://www.comparis.ch/immobilien/marktplatz/details/show/37659037",
      availableFrom: "", source: "comparis", fetchedAt: now,
    },
    {
      title: "2½-Zimmer in 6855 Stabio",
      description: "Appartamento im Erdgeschoss, sofort verfuegbar",
      rent: 1250, utilities: 0, rooms: 2.5, area: 0,
      zip: "6855", city: "Stabio", canton: "Ticino",
      images: JSON.stringify(["/images/wohnung-2.png"]),
      contactName: null,
      contactEmail: null, contactPhone: null,
      originalLink: "https://www.comparis.ch/immobilien/marktplatz/details/show/37798865",
      submitUrl: "https://www.comparis.ch/immobilien/marktplatz/details/show/37798865",
      availableFrom: "", source: "comparis", fetchedAt: now,
    },
    {
      title: "2½-Zimmer in 1020 Renens VD",
      description: "Appartement de 2.5 pieces au 5eme etage",
      rent: 1650, utilities: 0, rooms: 2.5, area: 43,
      zip: "1020", city: "Renens VD", canton: "Vaud",
      images: JSON.stringify(["/images/wohnung-3.png"]),
      contactName: "immobilier.ch",
      contactEmail: null, contactPhone: null,
      originalLink: "https://www.comparis.ch/immobilien/marktplatz/details/show/38018678",
      submitUrl: "https://www.comparis.ch/immobilien/marktplatz/details/show/38018678",
      availableFrom: "", source: "comparis", fetchedAt: now,
    },
    {
      title: "2½-Zimmer in 1020 Renens VD",
      description: "Charmant 2.5 pieces entierement renove, 2. Stock",
      rent: 1700, utilities: 0, rooms: 2.5, area: 68,
      zip: "1020", city: "Renens VD", canton: "Vaud",
      images: JSON.stringify(["/images/wohnung-4.png"]),
      contactName: "immobilier.ch",
      contactEmail: null, contactPhone: null,
      originalLink: "https://www.comparis.ch/immobilien/marktplatz/details/show/37987162",
      submitUrl: "https://www.comparis.ch/immobilien/marktplatz/details/show/37987162",
      availableFrom: "", source: "comparis", fetchedAt: now,
    },
    // === Flatfox-Inserate (echte Inserate via Apify) ===
    {
      title: "8134 Adliswil - CHF 700 incl. utilities per month",
      description: "Zwischenmiete 3 wochen. Hallo Ich vermiete meine Wohnung fuer 3 Wochen. Merkmale: moebliert",
      rent: 700, utilities: 0, rooms: 1, area: 70,
      zip: "8134", city: "Adliswil", canton: "Zürich",
      images: JSON.stringify(["https://flatfox.ch/media/ff/2026/09/jg405sbfyhr8t1rjrhrdo52iszaoq71mv3xn11e9m7x50v9ae2.jpg"]),
      contactName: null, contactEmail: null, contactPhone: null,
      originalLink: "https://flatfox.ch/en/flat/8134-adliswil/86360602/",
      submitUrl: "https://flatfox.ch/en/listing/86360602/submit/",
      availableFrom: "", source: "flatfox", fetchedAt: now,
    },
    {
      title: "Urdorferstrasse 96, 8952 Schlieren - CHF 794",
      description: "WG-Zimmer in Schlieren. Gemuetliches, helles WG-Zimmer zu vermieten.",
      rent: 794, utilities: 0, rooms: 1, area: 15,
      zip: "8952", city: "Schlieren", canton: "Zürich",
      images: JSON.stringify(["https://cdn.flatfox.ch/listings/v2/h572221/4003467627/image/34716b44e35c98680a2a38e4ebf062e5.jpg"]),
      contactName: null, contactEmail: null, contactPhone: null,
      originalLink: "https://flatfox.ch/en/flat/urdorferstrasse-96-8952-schlieren/86360612/",
      submitUrl: "https://flatfox.ch/en/listing/86360612/submit/",
      availableFrom: "", source: "flatfox", fetchedAt: now,
    },
    {
      title: "1400 Cheseaux-Noreaz - CHF 980",
      description: "Studio a louer a Yverdon proche centre ville. Tres joli studio, d'environ 30m2, lumineux.",
      rent: 980, utilities: 0, rooms: 1, area: 30,
      zip: "1400", city: "Cheseaux-Noreaz", canton: "Vaud",
      images: JSON.stringify(["https://cdn.flatfox.ch/listings/v2/anibisfill/4003467614/image/539e3288533893bb544b46eaf6dc4e5b.jpg"]),
      contactName: null, contactEmail: null, contactPhone: null,
      originalLink: "https://flatfox.ch/en/flat/1400-cheseaux-noreaz/86360590/",
      submitUrl: "https://flatfox.ch/en/listing/86360590/submit/",
      availableFrom: "", source: "flatfox", fetchedAt: now,
    },
    {
      title: "Blonay, 1807 Blonay - CHF 1'125",
      description: "Grand studio lumineux, balcon, vue montagnes et apercu lac. Loyer CHF 1025 + CHF 100 charges.",
      rent: 1125, utilities: 100, rooms: 1, area: 32,
      zip: "1807", city: "Blonay", canton: "Vaud",
      images: JSON.stringify(["https://cdn.flatfox.ch/listings/v2/anibisfill/4003467617/image/c7ab97df89d4089419f47d87d52d587e.jpg"]),
      contactName: null, contactEmail: null, contactPhone: null,
      originalLink: "https://flatfox.ch/en/flat/blonay-1807-blonay/86360591/",
      submitUrl: "https://flatfox.ch/en/listing/86360591/submit/",
      availableFrom: "", source: "flatfox", fetchedAt: now,
    },
    {
      title: "Rue des cretes 2a, Lausanne, 1018 Lausanne - CHF 1'200",
      description: "Chambre dans colocation spacieuse. 1 chambre dans un bel appartement de 116m2.",
      rent: 1200, utilities: 0, rooms: 1, area: 116,
      zip: "1018", city: "Lausanne", canton: "Vaud",
      images: JSON.stringify(["https://cdn.flatfox.ch/listings/v2/anibisfill/4003467611/image/d78a296dadfe47a7eb9cb258f990f631.jpg"]),
      contactName: null, contactEmail: null, contactPhone: null,
      originalLink: "https://flatfox.ch/en/flat/rue-des-cretes-2a-lausanne-1018-lausanne/86360596/",
      submitUrl: "https://flatfox.ch/en/listing/86360596/submit/",
      availableFrom: "", source: "flatfox", fetchedAt: now,
    },
    {
      title: "Rue de Plantassage 5, 3976 Champzabe - CHF 1'330",
      description: "Charmant appartement, entierement renove. Dans petite residence tres conviviale.",
      rent: 1330, utilities: 0, rooms: 3, area: 73,
      zip: "3976", city: "Champzabe", canton: "Bern",
      images: JSON.stringify(["https://cdn.flatfox.ch/listings/v2/anibisfill/4003467616/image/f9e7631f23c36e3cb6dbb77d9cfdba4a.jpg"]),
      contactName: null, contactEmail: null, contactPhone: null,
      originalLink: "https://flatfox.ch/en/flat/rue-de-plantassage-5-3976-champzabe/86360597/",
      submitUrl: "https://flatfox.ch/en/listing/86360597/submit/",
      availableFrom: "", source: "flatfox", fetchedAt: now,
    },
    {
      title: "Landstrasse 37, 5430 Wettingen - CHF 1'390 incl. utilities",
      description: "Nachmieter gesucht: Helle und ruhige 2.5-Zimmer-Wohnung in Wettingen.",
      rent: 1390, utilities: 0, rooms: 2.5, area: 0,
      zip: "5430", city: "Wettingen", canton: "Aargau",
      images: JSON.stringify(["https://flatfox.ch/media/ff/2026/09/2lfxatnp6685clfddiqq5fvmh0z7di594i361avsyos5670mik.jpg"]),
      contactName: null, contactEmail: null, contactPhone: null,
      originalLink: "https://flatfox.ch/en/flat/landstrasse-37-5430-wettingen/86360610/",
      submitUrl: "https://flatfox.ch/en/listing/86360610/submit/",
      availableFrom: "", source: "flatfox", fetchedAt: now,
    },
    {
      title: "1426 Corcelles-pres-Concise - CHF 1'570",
      description: "A LOUER - APPARTEMENT NEUF DE 2,5 PIECES AVEC JARDIN PRIVATIF.",
      rent: 1570, utilities: 0, rooms: 2, area: 50,
      zip: "1426", city: "Corcelles-pres-Concise", canton: "Vaud",
      images: JSON.stringify(["https://cdn.flatfox.ch/listings/v2/anibisfill/4003467604/image/b2e7f61e142c46f7cf3db62860c7486f.jpg"]),
      contactName: null, contactEmail: null, contactPhone: null,
      originalLink: "https://flatfox.ch/en/flat/1426-corcelles-pres-concise/86360600/",
      submitUrl: "https://flatfox.ch/en/listing/86360600/submit/",
      availableFrom: "", source: "flatfox", fetchedAt: now,
    },
    {
      title: "route de la maison neuve 17, 1753 Matran - CHF 1'595",
      description: "Attique neuf a Matran, avec superbe vue et place de parc.",
      rent: 1595, utilities: 0, rooms: 3, area: 75,
      zip: "1753", city: "Matran", canton: "Vaud",
      images: JSON.stringify(["https://cdn.flatfox.ch/listings/v2/anibisfill/4003467607/image/95949624b1f73f1836515625969f4700.jpg"]),
      contactName: null, contactEmail: null, contactPhone: null,
      originalLink: "https://flatfox.ch/en/flat/route-de-la-maison-neuve-17-1753-matran/86360599/",
      submitUrl: "https://flatfox.ch/en/listing/86360599/submit/",
      availableFrom: "", source: "flatfox", fetchedAt: now,
    },
    {
      title: "Chemin des Vignes, 3, 1260 Nyon - CHF 1'845 incl. utilities",
      description: "Opportunite unique: Arcade/Bureaux 90m2 a Nyon Gare - Loyer bloque exceptionnel.",
      rent: 1845, utilities: 0, rooms: 0, area: 0,
      zip: "1260", city: "Nyon", canton: "Vaud",
      images: JSON.stringify(["https://flatfox.ch/media/ff/2026/09/50pqh6d02dmrxgtego5rq0490ehi56xx8kscek5lkgqpw6kxud.jpg"]),
      contactName: null, contactEmail: null, contactPhone: null,
      originalLink: "https://flatfox.ch/en/flat/chemin-des-vignes-3-1260-nyon/86360604/",
      submitUrl: "https://flatfox.ch/en/listing/86360604/submit/",
      availableFrom: "", source: "flatfox", fetchedAt: now,
    },
    {
      title: "Rue du Midi 8, 1196 Gland - CHF 2'200",
      description: "Appartement 3,5 pieces traversant. Dans quartier calme, proche ecoles et gare.",
      rent: 2200, utilities: 0, rooms: 3.5, area: 92,
      zip: "1196", city: "Gland", canton: "Vaud",
      images: JSON.stringify(["https://cdn.flatfox.ch/listings/v2/anibisfill/4003467619/image/ec1d4f680ab5a5e85894f1f9ae2c7523.jpg"]),
      contactName: null, contactEmail: null, contactPhone: null,
      originalLink: "https://flatfox.ch/en/flat/rue-du-midi-8-1196-gland/86360598/",
      submitUrl: "https://flatfox.ch/en/listing/86360598/submit/",
      availableFrom: "", source: "flatfox", fetchedAt: now,
    },
    {
      title: "Im Winkel 2, 5620 Bremgarten - CHF 2'890 incl. utilities",
      description: "4.5 Zimmerwohnung. Miete ist inkl. 2 Parkplaetzen. Merkmale: Balkon/Garten, Garage/Parkplatz.",
      rent: 2890, utilities: 0, rooms: 4.5, area: 0,
      zip: "5620", city: "Bremgarten", canton: "Aargau",
      images: JSON.stringify(["https://flatfox.ch/media/ff/2026/09/sxke5wljokoj93k6gjj0vy6msq4rh7l8neoebv87oeyauq7j56.jpg"]),
      contactName: null, contactEmail: null, contactPhone: null,
      originalLink: "https://flatfox.ch/en/flat/im-winkel-2-5620-bremgarten/86360603/",
      submitUrl: "https://flatfox.ch/en/listing/86360603/submit/",
      availableFrom: "", source: "flatfox", fetchedAt: now,
    },
    {
      title: "Pfistergasse 3, 6003 Luzern - CHF 2'900 excl. utilities",
      description: "Lichtdurchflutetes 3.5-Zi-Bijou am Rande der Luzerner Altstadt - 8 Gehminuten vom Bahnhof entfernt.",
      rent: 2900, utilities: 0, rooms: 3.5, area: 120,
      zip: "6003", city: "Luzern", canton: "Luzern",
      images: JSON.stringify(["https://flatfox.ch/media/ff/2026/09/fm8b92hvhh0yc6fml6qmdsncbjzufeynkl9xj66goctu4izz3m.jpg"]),
      contactName: null, contactEmail: null, contactPhone: null,
      originalLink: "https://flatfox.ch/en/flat/pfistergasse-3-6003-luzern/86360613/",
      submitUrl: "https://flatfox.ch/en/listing/86360613/submit/",
      availableFrom: "", source: "flatfox", fetchedAt: now,
    },
  ]
  return data
}
