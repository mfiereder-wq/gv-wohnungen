#!/usr/bin/env tsx
/**
 * GV Wohnungen – Daily Flatfox Scrape Agent
 * ===========================================
 *
 * What it does:
 * 1. Fetches ALL Flatfox listing URLs from the official sitemap
 * 2. Compares with existing DB listings
 * 3. Fetches detail data for NEW listings (from the sitemap)
 * 4. REMOVES listings that are no longer in the sitemap = nicht mehr verfügbar
 * 5. Updates existing listings if the sitemap shows a newer lastmod
 *
 * Usage:   npx tsx scripts/daily-scrape.ts
 * Cron:    @daily  or  0 9 * * *   (runs once daily, e.g. 09:00 UTC)
 *
 * Env:
 *   DATABASE_URL  – PostgreSQL connection string (required)
 *   MAX_RENT      – Max Miete in CHF (default: 1500, set 0 for no limit)
 *   MAX_DAYS_OLD  – Max age in days for new listings (default: 7)
 */

import { db } from "../src/lib/db"
import { ensureDbReady } from "../src/lib/ensure-db"
import { mapFlatfoxItem } from "../src/lib/flatfox-mapper"

const MAX_RENT = Number(process.env.MAX_RENT || 1500)
const MAX_DAYS_OLD = Number(process.env.MAX_DAYS_OLD || 7)
const SITEMAP_URL = "https://flatfox.ch/sitemaps/sitemap-pdp-listings-en-1.xml.gz"

interface SitemapEntry {
  url: string
  lastmod: string
}

/// Fetch and parse the Flatfox sitemap, return all listing URLs with lastmod
async function fetchSitemap(): Promise<SitemapEntry[]> {
  console.log("[sitemap] Fetching Flatfox listing sitemap …")
  const resp = await fetch(SITEMAP_URL)
  if (!resp.ok) throw new Error(`Sitemap fetch failed: ${resp.status}`)
  const buf = await resp.arrayBuffer()
  // Decompress gzip
  const decompressed = new Uint8Array(
    await new Response(
      new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip")),
    ).arrayBuffer(),
  )
  const xml = new TextDecoder().decode(decompressed)

  const entries: SitemapEntry[] = []
  const urlRegex = /<url>([\s\S]*?)<\/url>/g
  let match: RegExpExecArray | null
  while ((match = urlRegex.exec(xml)) !== null) {
    const block = match[1]
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1]
    const lastmod = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]
    if (loc) {
      entries.push({ url: loc, lastmod: lastmod || "" })
    }
  }

  console.log(`[sitemap] ${entries.length} listings found`)
  return entries
}

/// Fetch a single listing page and extract structured data
async function scrapeListingPage(url: string): Promise<Record<string, any> | null> {
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; GVWohnungen/1.0; +https://www.gv-wohnungen.online)",
        Accept: "text/html,application/xhtml+xml",
      },
    })
    if (!resp.ok) {
      if (resp.status === 404) return null // listing gone
      console.warn(`  [warn] ${resp.status} for ${url}`)
      return null
    }
    const html = await resp.text()

    // Extract Open Graph meta tags
    const og: Record<string, string> = {}
    const ogRegex = /<meta\s+(?:property|name)="(og:[^"]+)"\s+content="([^"]*)"\s*\/?>/gi
    let m: RegExpExecArray | null
    while ((m = ogRegex.exec(html)) !== null) {
      og[m[1]] = m[2]
    }

    // Extract price from title or description (e.g. "CHF 794" or "794")
    const titleText = og["og:title"] || ""
    const descText = og["og:description"] || ""
    const fullText = titleText + " " + descText

    // Try to find rent in the title/description
    let rent = 0
    const priceMatch = fullText.match(/(?:CHF\s*)?(\d[\d'’]?\d{0,3})(?:\s*incl)?/i)
    if (priceMatch) {
      rent = parseInt(priceMatch[1].replace(/['’]/g, ""), 10) || 0
    }

    // Try to extract rooms
    let rooms = 0
    const roomsMatch = fullText.match(/(\d+(?:\.\d)?)\s*(?:room|zimmer|piece)/i)
    if (roomsMatch) rooms = parseFloat(roomsMatch[1])

    // Try to extract area
    let area = 0
    const areaMatch = fullText.match(/(\d+)\s*m[²2]/i)
    if (areaMatch) area = parseInt(areaMatch[1], 10)

    // Try to extract canton from the URL or description
    const cantonKeywords = [
      "Zürich", "Bern", "Luzern", "Uri", "Schwyz", "Obwalden", "Nidwalden",
      "Glarus", "Zug", "Fribourg", "Solothurn", "Basel-Stadt", "Basel-Landschaft",
      "Schaffhausen", "Appenzell", "St. Gallen", "Graubünden", "Aargau",
      "Thurgau", "Ticino", "Vaud", "Valais", "Neuchâtel", "Genève", "Jura",
    ]
    let canton = ""
    for (const c of cantonKeywords) {
      if (descText.includes(c) || titleText.includes(c) || url.includes(encodeURIComponent(c))) {
        canton = c
        break
      }
    }

    // Try to extract city and zip
    let city = ""
    let zip = ""
    const locationMatch = descText.match(/(\d{4})\s+([A-Za-zäöüÄÖÜéèêÉÈ\s-]+)/)
    if (locationMatch) {
      zip = locationMatch[1]
      city = locationMatch[2].trim()
    }

    // Build a flatfox-like data object that the mapper can understand
    const item: Record<string, any> = {
      url: url,
      public_title: titleText.replace(/Rent a \d+ room apartment at?\s*/i, "").trim(),
      description: descText,
      rent_gross: rent,
      number_of_rooms: String(rooms),
      surface_living: area,
      cover_image: og["og:image"] || "",
      images: og["og:image"] ? [og["og:image"]] : [],
      city: city,
      zipcode: zip,
      state: canton,
      // The URL often contains the listing ID
      pk: url.match(/\/(\d+)\/?$/)?.[1] || null,
      // Flatfox submit URL pattern
      submit_url: url.includes("/flat/")
        ? url.replace("/flat/", "/en/listing/").replace(/\/\d+\/?$/, "/submit/")
        : null,
    }

    return item
  } catch (e) {
    console.warn(`  [error] Failed to scrape ${url}: ${e}`)
    return null
  }
}

/// Main routine
async function main() {
  console.log("=".repeat(60))
  console.log("GV Wohnungen – Daily Flatfox Scrape Agent")
  console.log(`Max rent: CHF ${MAX_RENT}, Max age: ${MAX_DAYS_OLD} days`)
  console.log("=".repeat(60))
  console.log()

  await ensureDbReady()

  // Step 1: Fetch sitemap
  const sitemap = await fetchSitemap()
  if (sitemap.length === 0) {
    console.error("[abort] No listings found in sitemap")
    process.exit(1)
  }

  // Build set of sitemap URLs (normalised to flatfox.ch/en/flat/... format)
  const sitemapUrls = new Set<string>()
  const sitemapByUrl = new Map<string, SitemapEntry>()
  for (const entry of sitemap) {
    // Normalize: ensure we track the English flat URL
    let normalized = entry.url
    if (normalized.includes("/de/wohnung/")) {
      normalized = normalized.replace("/de/wohnung/", "/en/flat/")
    }
    if (normalized.includes("/fr/flat/")) {
      normalized = normalized.replace("/fr/flat/", "/en/flat/")
    }
    if (normalized.includes("/it/flat/")) {
      normalized = normalized.replace("/it/flat/", "/en/flat/")
    }
    sitemapUrls.add(normalized)
    if (!sitemapByUrl.has(normalized)) {
      sitemapByUrl.set(normalized, entry)
    }
  }
  console.log(`[sitemap] ${sitemapUrls.size} unique normalized URLs`)

  // Step 2: Get all existing listings from DB
  const existingListings = await db.property.findMany({
    select: { id: true, originalLink: true, fetchedAt: true },
  })
  const existingByLink = new Map(existingListings.map((p) => [p.originalLink, p]))
  console.log(`[db] ${existingListings.length} existing listings`)

  // Step 3: Find listings to REMOVE (in DB but NOT in sitemap)
  const toRemove = existingListings.filter(
    (p) => !sitemapUrls.has(p.originalLink),
  )
  if (toRemove.length > 0) {
    console.log(`[cleanup] ${toRemove.length} listings no longer in sitemap, removing …`)
    for (const p of toRemove) {
      await db.property.delete({ where: { id: p.id } })
    }
    console.log(`[cleanup] Removed ${toRemove.length} stale listings`)
  } else {
    console.log(`[cleanup] No stale listings to remove`)
  }

  // Step 4: Find NEW listings (in sitemap but not in DB)
  const newUrls = [...sitemapUrls].filter((url) => !existingByLink.has(url))
  // Filter by max rent (from URL context or we'll scrape first)
  console.log(`[new] ${newUrls.length} potential new listings`)

  // Step 5: Scrape new listings (bounded by MAX_DAYS_OLD)
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - MAX_DAYS_OLD)
  const recentNewUrls = newUrls
    .filter((url) => {
      const entry = sitemapByUrl.get(url)
      if (!entry?.lastmod) return true
      const lastmod = new Date(entry.lastmod)
      return lastmod >= cutoffDate
    })
    .slice(0, 50) // Limit to 50 per day to avoid overloading

  console.log(`[scrape] Will scrape ${recentNewUrls.length} new listings (last ${MAX_DAYS_OLD} days)`)

  let imported = 0
  for (let i = 0; i < recentNewUrls.length; i++) {
    const url = recentNewUrls[i]
    const entry = sitemapByUrl.get(url)
    console.log(`  [${i + 1}/${recentNewUrls.length}] Scraping: ${url}`)

    const rawItem = await scrapeListingPage(url)
    if (!rawItem) {
      console.log(`    → skipped (no data)`)
      continue
    }

    // Map using the existing flatfox mapper
    const mapped = mapFlatfoxItem(rawItem)
    if (!mapped || !mapped.originalLink) {
      console.log(`    → skipped (mapper returned null)`)
      continue
    }

    // Filter by max rent
    if (MAX_RENT > 0 && mapped.rent > MAX_RENT) {
      console.log(`    → skipped (rent ${mapped.rent} > ${MAX_RENT})`)
      continue
    }

    // Skip 0-rent listings
    if (mapped.rent === 0) {
      console.log(`    → skipped (unknown rent)`)
      continue
    }

    // Check again for duplicates (race condition)
    const dup = await db.property.findUnique({
      where: { originalLink: mapped.originalLink },
    })
    if (dup) {
      console.log(`    → skipped (duplicate)`)
      continue
    }

    // Import into DB
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
        source: "flatfox",
        fetchedAt: new Date(),
      },
    })
    imported++
    console.log(`    → imported: ${mapped.title} (CHF ${mapped.rent}, ${mapped.city})`)
  }

  // Step 6: Summary
  console.log()
  console.log("=".repeat(60))
  console.log("SUMMARY")
  console.log(`  Removed (no longer available): ${toRemove.length}`)
  console.log(`  Imported (new affordable listings): ${imported}`)
  console.log(`  Total in DB: ${existingListings.length - toRemove.length + imported}`)
  console.log("=".repeat(60))

  await db.$disconnect()
}

main().catch((e) => {
  console.error("[FATAL]", e)
  process.exit(1)
})