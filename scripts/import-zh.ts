#!/usr/bin/env tsx
/**
 * GV Wohnungen – Import Zürich Apartments
 * Holt günstige Wohnungen (≤ CHF 1'500) aus dem Kanton Zürich
 * via Flatfox Public API und importiert sie in die DB.
 *
 * Usage: npx tsx scripts/import-zh.ts
 */

import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const API_BASE = "https://flatfox.ch/api/v1/public-listing/"
const MAX_RENT = 1500
const STATE = "ZH"

const stateMap: Record<string, string> = {
  ZH: "Zürich", BE: "Bern", LU: "Luzern", UR: "Uri", SZ: "Schwyz",
  OW: "Obwalden", NW: "Nidwalden", GL: "Glarus", ZG: "Zug",
  FR: "Fribourg", SO: "Solothurn", BS: "Basel-Stadt", BL: "Basel-Landschaft",
  SH: "Schaffhausen", AR: "Appenzell Ausserrhoden", AI: "Appenzell Innerrhoden",
  SG: "St. Gallen", GR: "Graubünden", AG: "Aargau", TG: "Thurgau",
  TI: "Ticino", VD: "Vaud", VS: "Valais", NE: "Neuchâtel",
  GE: "Genève", JU: "Jura",
}

async function fetchImages(url: string): Promise<string[]> {
  try {
    const ctrl = new AbortController()
    setTimeout(() => ctrl.abort(), 8000)
    const resp = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GVWohnungen/1.0)" },
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
  console.log("GV Wohnungen – Zürich Import")
  console.log(`Max Miete: CHF ${MAX_RENT}, Kanton: ${STATE}`)
  console.log("=".repeat(60))

  // Step 1: Fetch from API
  const allListings: any[] = []
  for (let page = 1; page <= 15; page++) {
    const url = `${API_BASE}?max_price=${MAX_RENT}&limit=50&state=${STATE}&offset=${(page - 1) * 50}`
    const ctrl = new AbortController()
    const to = setTimeout(() => ctrl.abort(), 15000)
    try {
      const resp = await fetch(url, {
        signal: ctrl.signal,
        headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
      })
      clearTimeout(to)
      if (!resp.ok) { console.log(`  HTTP ${resp.status} – stop`); break }
      const data = await resp.json()
      const results = data.results || []
      if (results.length === 0) break
      allListings.push(...results)
      const apts = results.filter((r: any) => r.object_category === "APARTMENT").length
      console.log(`  Seite ${page}: ${results.length} total, ${apts} Wohnungen`)
    } catch (e: any) {
      clearTimeout(to)
      console.log(`  Seite ${page}: ${e.message}`)
      break
    }
    await new Promise((r) => setTimeout(r, 600))
  }

  const apartments = allListings.filter((r: any) => r.object_category === "APARTMENT")
  console.log(`\nGefunden: ${allListings.length} Inserate, ${apartments.length} Wohnungen\n`)

  // Step 2: Import
  let imported = 0, updated = 0, skipped = 0
  for (let i = 0; i < apartments.length; i++) {
    const item = apartments[i]
    const rent = item.price_display || item.rent_net || 0
    if (rent <= 0 || rent > MAX_RENT) { skipped++; continue }

    const relUrl = item.url || ""
    const originalLink = relUrl.startsWith("http") ? relUrl : `https://flatfox.ch${relUrl || `/en/flat/${item.pk}/`}`
    const canton = stateMap[String(item.state || "").toUpperCase()] || ""

    console.log(`  [${i + 1}/${apartments.length}] ${item.city || "?"}: CHF ${rent}`)

    const images = await fetchImages(originalLink)
    const finalImages = images.length > 0 ? images : ["/images/placeholder.svg"]

    const data = {
      title: (item.public_title || item.rent_title || `Wohnung ${item.zipcode} ${item.city}`).slice(0, 300),
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
  }

  const total = await prisma.property.count()
  console.log(`\n=== Resultat ===`)
  console.log(`  Neu: ${imported}`)
  console.log(`  Aktualisiert: ${updated}`)
  console.log(`  Übersprungen: ${skipped}`)
  console.log(`  Total DB: ${total}`)
  console.log("=".repeat(60))

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})