/* CSV-Import: Importiert echte Inserate aus CSV-Dateien.
   Unterstützt zwei Formate:
   1. guenstige_wohnungen_zuerich.csv (Spalten: Adresse, Preis, Zimmer, Quadratmeter, Beschreibung, Kontakt, Inseratlink)
   2. sehr_guenstige_wohnungen_schweiz.csv (Spalten: Adresse, Ort, Kanton, Preis, Zimmer, Quadratmeter, Beschreibung, Kontakt, Inseratlink)

   Anbieter wird aus dem Inseratlink erkannt (comparis.ch, homegate.ch, etc.)
   
   Ausfuehren mit: bun run prisma/import-csv.ts [csv-datei]
*/
import { db } from "../src/lib/db"
import fs from "fs"
import path from "path"

interface CsvRow {
  adresse: string
  ort?: string
  kanton?: string
  preis: number
  zimmer: number
  quadratmeter: number
  beschreibung: string
  kontakt: string
  inseratlink: string
}

/// Parst eine CSV-Zeile mit Quote-Handling
function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current)
      current = ""
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields
}

/// Extrahiert PLZ und Ort aus einer Adresse oder einem Ort-Feld
function parseLocation(addr: string, ortField?: string): { zip: string; city: string } {
  // Wenn ein separates Ort-Feld existiert (Format 2)
  if (ortField) {
    const m = ortField.match(/^(\d{4})\s+(.+)$/)
    if (m) return { zip: m[1], city: m[2].trim() }
    return { zip: "", city: ortField.trim() }
  }
  // Adresse-Format: "Birchstrasse, 8050 Zürich"
  const match = addr.match(/(\d{4})\s+([A-Za-zäöüÄÖÜéèàÉÈÀ\s/-]+)/)
  if (match) return { zip: match[1], city: match[2].trim() }
  return { zip: "", city: addr.trim() }
}

/// Erkennt den Anbieter aus dem Inseratlink
function detectProvider(link: string): string {
  try {
    const host = new URL(link).host.toLowerCase()
    if (host.includes("comparis")) return "comparis"
    if (host.includes("homegate")) return "homegate"
    if (host.includes("flatfox")) return "flatfox"
    if (host.includes("immoscout")) return "immoscout"
    if (host.includes("immostreet")) return "immostreet"
    if (host.includes("newhome")) return "newhome"
    return host.replace("www.", "")
  } catch {
    return "unbekannt"
  }
}

/// Extrahiert Kontaktdaten aus dem Kontakt-Feld
function parseContact(
  kontakt: string,
  inseratlink: string,
): {
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  submitUrl: string | null
} {
  const k = kontakt.trim()
  // E-Mail
  const emailMatch = k.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  if (emailMatch) {
    return {
      contactName: "Vermieter",
      contactEmail: emailMatch[0],
      contactPhone: null,
      submitUrl: inseratlink,
    }
  }
  // URL im Kontakt-Feld
  const urlMatch = k.match(/(https?:\/\/[^\s)]+)|([a-z0-9-]+\.(ch|com|de)\/[^\s)]*)/i)
  if (urlMatch) {
    let url = urlMatch[0]
    if (!url.startsWith("http")) url = "https://" + url
    return {
      contactName: new URL(url).host,
      contactEmail: null,
      contactPhone: null,
      submitUrl: url,
    }
  }
  // "immobilier.ch (via comparis.ch)" -> Name extrahieren, submitUrl = Inseratlink
  const providerInName = k.match(/^([a-z0-9.-]+\.(ch|com|de))\s*\(via/i)
  if (providerInName) {
    return {
      contactName: providerInName[1],
      contactEmail: null,
      contactPhone: null,
      submitUrl: inseratlink,
    }
  }
  // "Kontakt via Inserat" oder "via ..."
  if (k.toLowerCase().includes("via ") || k.toLowerCase().includes("inserat")) {
    return {
      contactName: null,
      contactEmail: null,
      contactPhone: null,
      submitUrl: inseratlink,
    }
  }
  // Fallback
  return {
    contactName: k || null,
    contactEmail: null,
    contactPhone: null,
    submitUrl: inseratlink,
  }
}

/// Kanton-Code in deutschen Namen umwandeln
const STATE_CODE_TO_CANTON: Record<string, string> = {
  ZH: "Zürich",
  BE: "Bern",
  LU: "Luzern",
  UR: "Uri",
  SZ: "Schwyz",
  OW: "Obwalden",
  NW: "Nidwalden",
  GL: "Glarus",
  ZG: "Zug",
  FR: "Fribourg",
  SO: "Solothurn",
  BS: "Basel-Stadt",
  BL: "Basel-Landschaft",
  SH: "Schaffhausen",
  AR: "Appenzell Ausserrhoden",
  AI: "Appenzell Innerrhoden",
  SG: "St. Gallen",
  GR: "Graubünden",
  AG: "Aargau",
  TG: "Thurgau",
  TI: "Ticino",
  VD: "Vaud",
  VS: "Valais",
  NE: "Neuchâtel",
  GE: "Genève",
  JU: "Jura",
}

function resolveCanton(kantonField: string, zip: string): string {
  if (kantonField) {
    const k = kantonField.trim().toUpperCase()
    if (STATE_CODE_TO_CANTON[k]) return STATE_CODE_TO_CANTON[k]
    return kantonField
  }
  // Fallback: Zürich (da die erste CSV nur Zürich-Inserate hatte)
  return "Zürich"
}

async function importCsv(csvPath: string): Promise<{ imported: number; updated: number }> {
  if (!fs.existsSync(csvPath)) {
    console.error("CSV-Datei nicht gefunden:", csvPath)
    return { imported: 0, updated: 0 }
  }

  const content = fs.readFileSync(csvPath, "utf-8")
  const lines = content.split("\n").filter((l) => l.trim())
  if (lines.length < 2) return { imported: 0, updated: 0 }

  const header = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  console.log(`\n=== ${path.basename(csvPath)} ===`)
  console.log(`Header: ${header.join(" | ")}`)
  console.log(`${lines.length - 1} Datenzeilen erkannt`)

  // Spalten-Indizes erkennen
  const idx = {
    adresse: header.findIndex((h) => h.includes("adresse")),
    ort: header.findIndex((h) => h === "ort"),
    kanton: header.findIndex((h) => h.includes("kanton")),
    preis: header.findIndex((h) => h.includes("preis")),
    zimmer: header.findIndex((h) => h.includes("zimmer")),
    qm: header.findIndex((h) => h.includes("quadratmeter") || h.includes("m²") || h === "fläche"),
    beschreibung: header.findIndex((h) => h.includes("beschreibung")),
    kontakt: header.findIndex((h) => h.includes("kontakt")),
    link: header.findIndex((h) => h.includes("link") || h.includes("inserat")),
  }

  let imported = 0
  let updated = 0
  const now = new Date()

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i])
    if (fields.length < 5) continue

    const adresse = fields[idx.adresse] || ""
    const ortField = idx.ort >= 0 ? fields[idx.ort] : undefined
    const kantonField = idx.kanton >= 0 ? fields[idx.kanton] : ""
    const preisStr = fields[idx.preis] || "0"
    const zimmerStr = fields[idx.zimmer] || "0"
    const qmStr = idx.qm >= 0 ? fields[idx.qm] : "0"
    const beschreibung = idx.beschreibung >= 0 ? fields[idx.beschreibung] : ""
    const kontakt = idx.kontakt >= 0 ? fields[idx.kontakt] : ""
    const inseratlink = idx.link >= 0 ? fields[idx.link] : ""

    if (!inseratlink) continue

    const preis = parseInt(preisStr.replace(/[^0-9]/g, ""), 10) || 0
    const zimmer = parseFloat(zimmerStr.replace(",", ".")) || 0
    const quadratmeter = parseInt(qmStr.replace(/[^0-9]/g, ""), 10) || 0

    const { zip, city } = parseLocation(adresse, ortField)
    const canton = resolveCanton(kantonField, zip)
    const contact = parseContact(kontakt, inseratlink)
    const provider = detectProvider(inseratlink)

    // Bild: cyclisch vorhandene Bilder verwenden
    const imageFile = `/images/wohnung-${((i - 1) % 6) + 1}.png`

    // Titel: "Zimmer-Zimmer in PLZ Ort"
    const zimmerStr2 = Number.isInteger(zimmer)
      ? zimmer.toString()
      : zimmer.toString().replace(".5", "½")
    const title = `${zimmerStr2}-Zimmer in ${zip} ${city}`

    const propertyData = {
      title,
      description: beschreibung,
      rent: preis,
      utilities: 0,
      rooms: zimmer,
      area: quadratmeter,
      zip,
      city,
      canton,
      images: JSON.stringify([imageFile]),
      contactName: contact.contactName,
      contactEmail: contact.contactEmail,
      contactPhone: contact.contactPhone,
      originalLink: inseratlink,
      submitUrl: contact.submitUrl,
      availableFrom: "",
      externalId: null,
      source: provider,
      fetchedAt: now,
    }

    // Upsert
    const existing = await db.property.findUnique({
      where: { originalLink: inseratlink },
    })
    if (existing) {
      await db.property.update({ where: { id: existing.id }, data: propertyData })
      updated++
    } else {
      await db.property.create({ data: propertyData })
      imported++
    }
    console.log(
      `  [${i}] ${title} - ${preis} CHF - ${provider} - ${canton}`,
    )
  }

  console.log(`Import: ${imported} neu, ${updated} aktualisiert`)
  return { imported, updated }
}

async function main() {
  const csvFiles = process.argv.slice(2)
  if (csvFiles.length === 0) {
    // Default: alle CSVs im upload-Ordner
    const uploadDir = path.resolve(process.cwd(), "upload")
    if (fs.existsSync(uploadDir)) {
      const files = fs
        .readdirSync(uploadDir)
        .filter((f) => f.endsWith(".csv"))
        .map((f) => path.join(uploadDir, f))
      csvFiles.push(...files)
    }
  }

  if (csvFiles.length === 0) {
    console.error("Keine CSV-Dateien gefunden.")
    process.exit(1)
  }

  let totalImported = 0
  let totalUpdated = 0

  for (const csv of csvFiles) {
    const r = await importCsv(csv)
    totalImported += r.imported
    totalUpdated += r.updated
  }

  console.log(`\n=== Gesamt: ${totalImported} neu, ${totalUpdated} aktualisiert ===`)
  await db.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
