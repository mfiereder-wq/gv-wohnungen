#!/usr/bin/env tsx
/**
 * GV Wohnungen – Daily Flatfox Scrape Agent (v2 – API-basiert)
 * ==============================================================
 *
 * Nutzt Flatfox' PUBLIC API (/api/v1/public-listing/) statt Sitemap.
 * Das liefert NUR Wohnungen direkt mit Preis, Zimmer, Kanton etc.
 *
 * Usage:   npx tsx scripts/daily-scrape.ts
 * Cron:    every day at 9am
 *
 * Env:
 *   DATABASE_URL  – PostgreSQL (required)
 *   MAX_RENT      – Max Miete CHF (default: 1500)
 *   MAX_DAYS_OLD  – Max Alter Tage für neue Inserate (default: 3)
 *   SCRAPE_LIMIT  – Max Inserate pro Scrape (default: 30)
 */

import "dotenv/config"
import * as path from "path"
import { config } from "dotenv"
config({ path: path.resolve(process.cwd(), ".env") })

import { db } from "../src/lib/db"
import { ensureDbReady } from "../src/lib/ensure-db"

const MAX_RENT = Number(process.env.MAX_RENT || 1500)
const MAX_DAYS_OLD = Number(process.env.MAX_DAYS_OLD || 3)
const SCRAPE_LIMIT = Number(process.env.SCRAPE_LIMIT || 30)
const API_BASE = "https://flatfox.ch/api/v1/public-listing/"

interface FlatfoxListing {
  pk: number
  title: string
  rent_display?: string
  rent?: number
  rent_charges?: number
  number_of_rooms?: string
  surface_living?: number
  city?: string
  zipcode?: string
  state?: string
  cover_image?: string
  images?: string[]
  url: string
  submit_url?: string
  move_in_date?: string
  listing_type?: string
  [key: string]: any
}

/// Fetch apartments from Flatfox API
async function fetchApartments(): Promise<FlatfoxListing[]> {
  console.log(`[api] Fetching from ${API_BASE}?max_price=${MAX_RENT}&limit=${SCRAPE_LIMIT} …`)
  const allListings: FlatfoxListing[] = []
  
  // Fetch multiple pages to find enough apartments (apartments are ~5% of listings)
  for (let page = 1; page <= 20; page++) {
    const url = `${API_BASE}?max_price=${MAX_RENT}&limit=${SCRAPE_LIMIT}&offset=${(page - 1) * SCRAPE_LIMIT}`
    const resp = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; GVWohnungen/1.0; +https://www.gv-wohnungen.online)",
        Referer: "https://flatfox.ch/en/search/",
      },
    })
    
    if (!resp.ok) {
      console.warn(`  [api] HTTP ${resp.status} on page ${page}`)
      break
    }
    
    const data = await resp.json()
    const results = data.results || []
    
    if (!Array.isArray(results) || results.length === 0) break
    
    allListings.push(...results)
    
    // Stop early if we have enough apartments
    const aptCount = allListings.filter((l) => (l.object_category || "").toUpperCase() === "APARTMENT").length
    if (aptCount >= 50) {
      console.log(`  [api] page ${page}: ${results.length} listings (${aptCount} apartments so far, enough)`)
      break
    }
    
    // Rate limit
    await new Promise((r) => setTimeout(r, 500))
  }
  
  console.log(`[api] Total: ${allListings.length} affordable listings fetched`)

  // Filter: nur echte Wohnungen (APARTMENT object_category)
  const apartments = allListings.filter((l) => {
    const cat = (l.object_category || "").toUpperCase()
    return cat === "APARTMENT"
  })

  return apartments
}

/// Map Flatfox API item to our schema
function mapListing(item: FlatfoxListing): Record<string, any> | null {
  if (!item.pk) return null
  
  // Nur APARTMENT object_category
  const cat = (item.object_category || "").toUpperCase()
  if (cat !== "APARTMENT") return null

  const rent = item.price_display || item.rent_net || 0
  if (rent <= 0) return null
  if (rent > MAX_RENT) return null

  const zip = String(item.zipcode || "")
  const city = item.city || ""
  
  // State code -> canton name
  const stateMap: Record<string, string> = {
    ZH: "Zürich", BE: "Bern", LU: "Luzern", UR: "Uri", SZ: "Schwyz",
    OW: "Obwalden", NW: "Nidwalden", GL: "Glarus", ZG: "Zug",
    FR: "Fribourg", SO: "Solothurn", BS: "Basel-Stadt", BL: "Basel-Landschaft",
    SH: "Schaffhausen", AR: "Appenzell Ausserrhoden", AI: "Appenzell Innerrhoden",
    SG: "St. Gallen", GR: "Graubünden", AG: "Aargau", TG: "Thurgau",
    TI: "Ticino", VD: "Vaud", VS: "Valais", NE: "Neuchâtel",
    GE: "Genève", JU: "Jura",
  }
  const stateCode = String(item.state || "").toUpperCase()
  const canton = stateMap[stateCode] || ""

  // Build absolute URL from relative path
  const relUrl = item.url || ""
  const originalLink = relUrl.startsWith("http") ? relUrl : `https://flatfox.ch${relUrl || `/en/flat/${item.pk}/`}`
  
  // Submit URL
  const relSubmit = item.submit_url || ""
  const submitUrl = relSubmit.startsWith("http") ? relSubmit : relSubmit ? `https://flatfox.ch${relSubmit}` : null

  // Images: cover_image and images are IDs, construct URLs
  const images: string[] = []
  if (item.cover_image) {
    images.push(`https://flatfox.ch/media/ff/2026/09/${item.cover_image}.jpg`)
  }
  // images array also contains IDs
  if (item.images && Array.isArray(item.images)) {
    for (const imgId of item.images) {
      const id = typeof imgId === "object" ? (imgId as any).pk || (imgId as any).id : imgId
      if (id && typeof id === "number") {
        const url = `https://flatfox.ch/media/ff/2026/09/${id}.jpg`
        if (!images.includes(url)) images.push(url)
      }
    }
  }

  // Rent utilities
  const utilities = item.rent_charges || 0

  // Rooms (API returns null for some fields)
  const rooms = parseFloat(String(item.number_of_rooms || "0")) || 0

  // Area
  const area = item.livingspace || item.surface_living || item.space_display || 0

  // Available from
  let availableFrom = ""
  if (item.moving_date && item.moving_date_type !== "agr") {
    try {
      availableFrom = new Date(item.moving_date).toISOString().slice(0, 10)
    } catch { /* ignore */ }
  }

  // Title: use public_title or construct one
  const title = item.public_title || item.rent_title || item.short_title || `Wohnung in ${zip} ${city}`

  return {
    title: String(title).slice(0, 300),
    description: item.description || item.description_title || title,
    rent: Math.round(rent),
    utilities: Math.round(utilities),
    rooms,
    area,
    zip,
    city,
    canton,
    images,
    contactName: item.agency?.name || item.agency?.name_2 || null,
    contactEmail: item.agency?.email || null,
    contactPhone: item.agency?.phone || null,
    originalLink,
    submitUrl,
    availableFrom,
    externalId: String(item.pk || ""),
    source: "flatfox-api",
  }
}

async function main() {
  console.log("=".repeat(60))
  console.log("GV Wohnungen – Daily Flatfox Scrape (v2 API)")
  console.log(`Max rent: CHF ${MAX_RENT}, Limit: ${SCRAPE_LIMIT}/page`)
  console.log("=".repeat(60))
  console.log()

  await ensureDbReady()

  // Step 1: Check existing DB listings count
  const existingCount = await db.property.count()
  console.log(`[db] ${existingCount} existing listings`)

  // Step 2: Fetch apartments from Flatfox API
  const apartments = await fetchApartments()
  if (apartments.length === 0) {
    console.log("[api] No listings found. Trying without location filter…")
    // API might need offset/page params different
  }

  // Step 3: Import each listing
  let imported = 0
  let updated = 0
  let skipped = 0

  for (let i = 0; i < apartments.length; i++) {
    const item = apartments[i]
    const mapped = mapListing(item)
    if (!mapped) { skipped++; continue }

    // Skip 0-rent
    if (mapped.rent <= 0) { skipped++; continue }

    // Skip if rent exceeds max
    if (mapped.rent > MAX_RENT) { skipped++; continue }

    const progress = `[${i + 1}/${apartments.length}]`

    // Check for duplicate
    const existing = await db.property.findUnique({
      where: { originalLink: mapped.originalLink },
    })

    if (existing) {
      // Update existing listing
      await db.property.update({
        where: { id: existing.id },
        data: {
          title: mapped.title,
          description: mapped.description,
          rent: mapped.rent,
          utilities: mapped.utilities,
          rooms: mapped.rooms,
          area: mapped.area,
          images: JSON.stringify(mapped.images),
          availableFrom: mapped.availableFrom,
          fetchedAt: new Date(),
        },
      })
      updated++
      console.log(`${progress} ✓ Updated: ${mapped.title} (CHF ${mapped.rent}, ${mapped.city})`)
    } else {
      // New listing
      await db.property.create({
        data: {
          title: mapped.title,
          description: mapped.description,
          rent: mapped.rent,
          utilities: mapped.utilities,
          rooms: mapped.rooms,
          area: mapped.area,
          zip: mapped.zip,
          city: mapped.city,
          canton: mapped.canton,
          images: JSON.stringify(mapped.images),
          contactName: mapped.contactName,
          contactEmail: mapped.contactEmail,
          contactPhone: mapped.contactPhone,
          originalLink: mapped.originalLink,
          submitUrl: mapped.submitUrl,
          availableFrom: mapped.availableFrom,
          externalId: mapped.externalId,
          source: "flatfox-api",
          fetchedAt: new Date(),
        },
      })
      imported++
      console.log(`${progress} ✓ New: ${mapped.title} (CHF ${mapped.rent}, ${mapped.zip} ${mapped.city}, ${mapped.canton || "?"})`)
    }

    // Small delay to be nice to the API
    if (i < apartments.length - 1) await new Promise((r) => setTimeout(r, 300))
  }

  // Step 4: Remove listings that are no longer available
  // (We keep the 10-day TTL cleanup from property-cache.ts)
  // Add a soft cleanup: remove listings older than 14 days with no update
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 14)
  const staleResult = await db.property.deleteMany({
    where: { fetchedAt: { lt: cutoffDate } },
  })
  if (staleResult.count > 0) {
    console.log(`[cleanup] Removed ${staleResult.count} stale listings (>14 days without refresh)`)
  }

  // Summary
  console.log()
  console.log("=".repeat(60))
  console.log("SUMMARY")
  console.log(`  New: ${imported}`)
  console.log(`  Updated: ${updated}`)
  console.log(`  Skipped (invalid/duplicate): ${skipped}`)
  console.log(`  Removed (stale): ${staleResult.count}`)
  console.log(`  Total in DB: ${await db.property.count()}`)
  console.log("=".repeat(60))

  await db.$disconnect()
}

main().catch((e) => {
  console.error("[FATAL]", e)
  process.exit(1)
})