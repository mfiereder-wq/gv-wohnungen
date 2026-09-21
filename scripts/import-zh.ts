#!/usr/bin/env tsx
/**
 * GV Wohnungen – Import Zürich Apartments (v2)
 *
 * Holt alle günstigen Wohnungen ≤ CHF 1'500 aus der Flatfox API,
 * filtert NUR Kanton Zürich (state=ZH) und importiert in die DB.
 *
 * Usage: DATABASE_URL=... npx tsx scripts/import-zh.ts
 */

import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const API_BASE = "https://flatfox.ch/api/v1/public-listing/"

const stateMap: Record<string, string> = {
  ZH: "Zürich", BE: "Bern", LU: "Luzern", UR: "Uri", SZ: "Schwyz",
  OW: "Obwalden", NW: "Nidwalden", GL: "Glarus", ZG: "Zug",
  FR: "Fribourg", SO: "Solothurn", BS: "Basel-Stadt", BL: "Basel-Landschaft",
  SH: "Schaffhausen", AR: "Appenzell Ausserrhoden", AI: "Appenzell Innerrhoden",
  SG: "St. Gallen", GR: "Graubünden", AG: "Aargau", TG: "Thurgau",
  TI: "Ticino", VD: "Vaud", VS: "Valais", NE: "Neuchâtel",
  GE: "Genève", JU: "Jura",
}

const ZH_ZIP_RANGES = [
  [8000, 8099], [8100, 8199], [8300, 8499],
  [8600, 8699], [8700, 8799], [8800, 8899], [8900, 8999],
]

function isZurichZip(zip: string): boolean {
  const z = parseInt(zip, 10)
  if (isNaN(z)) return false
  for (const [lo, hi] of ZH_ZIP_RANGES) {
    if (z >= lo && z <= hi) return true
  }
  return false
}

async function fetchImages(url: string): Promise<string[]> {
  try {
    const ctrl = new AbortController()
    setTimeout(() => ctrl.abort(), 8000)
    const resp = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0" },
    })
    const html = await resp.text()
    const imgRegex = /href="(\/media\/ff\/\d{4}\/\d{2}\/[a-z0-9]+\.(?:jpg|jpeg|png))"/gi
    const images: string[] = []
    let m: RegExpExecArray | null
    while ((m = imgRegex.exec(html)) !== null) {
      const full = `https://flatfox.ch${m[1]}`
      if (!images.includes(full)) images.push(full)
    }
    return images
  } catch {
    return []
  }
}

async function main() {
  const prisma = new PrismaClient()

  console.log("=".repeat(60))
  console.log("GV Wohnungen – Zürich Import v2")
  console.log("Holt Wohnungen aus Flatfox API, filtert Kanton ZH")
  console.log("=".repeat(60))

  // Fetch 20 pages x 30 items = 600 total listings
  const allRaw: any[] = []
  for (let page = 1; page <= 20; page++) {
    const url = `${API_BASE}?max_price=1500&limit=30&offset=${(page - 1) * 30}`
    const ctrl = new AbortController()
    const to = setTimeout(() => ctrl.abort(), 15000)
    try {
      const resp = await fetch(url, {
        signal: ctrl.signal,
        headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 (GVWohnungen/1.0)" },
      })
      clearTimeout(to)
      if (!resp.ok) { console.log(`  HTTP ${resp.status} – stop`); break }
      const data = await resp.json()
      const results = data.results || []
      if (results.length === 0) break
      allRaw.push(...results)
      console.log(`  Seite ${page}: ${results.length} geladen`)
    } catch (e: any) {
      clearTimeout(to)
      console.log(`  Seite ${page}: ${e.message}`)
      break
    }
    await new Promise((r) => setTimeout(r, 500))
  }

  // Filter: Nur APARTMENT + Zürich (state=ZH oder ZIP in ZH-Bereich)
  const zhApartments = allRaw.filter((r: any) => {
    if (r.object_category !== "APARTMENT") return false
    const state = String(r.state || "").toUpperCase()
    if (state === "ZH") return true
    // Fallback: ZIP check
    return isZurichZip(String(r.zipcode || ""))
  })

  console.log(`\nGefunden: ${allRaw.length} Inserate, ${zhApartments.length} Zürich-Wohnungen\n`)

  let imported = 0, updated = 0
  for (let i = 0; i < zhApartments.length; i++) {
    const item = zhApartments[i]
    const rent = item.price_display || item.rent_net || 0
    if (rent <= 0 || rent > 1500) continue

    const relUrl = item.url || ""
    const originalLink = relUrl.startsWith("http") ? relUrl : `https://flatfox.ch${relUrl || `/en/flat/${item.pk}/`}`
    const canton = stateMap[String(item.state || "").toUpperCase()] || "Zürich"

    const images = await fetchImages(originalLink)
    const finalImages = images.length > 0 ? images : ["/images/placeholder.svg"]

    const data = {
      title: (item.public_title || item.rent_title || `Wohnung in ${item.zipcode} ${item.city}`).slice(0, 300),
      description: item.description || item.description_title || "",
      rent: Math.round(rent),
      utilities: Math.round(item.rent_charges || 0),
      rooms: parseFloat(String(item.number_of_rooms || "0")) || 0,
      area: item.livingspace || item.surface_living || item.space_display || 0,
      zip: String(item.zipcode || ""),
      city: item.city || "",
      canton,
      images: JSON.stringify(finalImages),
      contactName: item.agency?.name || item.agency?.name_2 || null,
      contactEmail: item.agency?.email || null,
      contactPhone: item.agency?.phone || null,
      originalLink,
      submitUrl: item.submit_url ? `https://flatfox.ch${item.submit_url}` : null,
      availableFrom: "",
      externalId: String(item.pk || ""),
      source: "flatfox-api",
      fetchedAt: new Date(),
    }

    const existing = await prisma.property.findUnique({ where: { originalLink } })
    if (existing) {
      await prisma.property.update({ where: { id: existing.id }, data })
      updated++
    } else {
      await prisma.property.create({ data })
      imported++
    }
    console.log(`  [${i + 1}/${zhApartments.length}] ${item.city || "?"}: CHF ${rent}, ${data.rooms} Zi, ${images.length} Bilder`)
  }

  const total = await prisma.property.count()
  console.log(`\n=== Resultat ===`)
  console.log(`  Neu importiert: ${imported}`)
  console.log(`  Aktualisiert: ${updated}`)
  console.log(`  Total in DB: ${total}`)
  console.log("=".repeat(60))

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})