import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  runFlatfoxScraper,
  APIFY_ENABLED,
  FREE_TIER,
  checkRateLimit,
} from "@/lib/apify"
import { mapFlatfoxItems } from "@/lib/flatfox-mapper"

/// POST /api/sync-flatfox
/// Startet den Flatfox-Scraper via Apify und importiert echte Inserate.
/// Alle Inserate werden in der DB gespeichert (Caching fuer alle User).
/// Inserate aelter als 10 Tage werden automatisch entfernt (TTL).
///
/// Body (optional):
///   maxPrice?: number   - Max. Miete in CHF
///   minRooms?: number   - Min. Zimmer
///   maxRooms?: number   - Max. Zimmer
///   take?: number       - Anzahl Inserate (wird auf Free-Tier-Limit begrenzt)
///   replaceAll?: boolean - wenn true, werden alle alten Inserate vorher geloescht
///
/// Response:
///   { success, imported, updated, skipped, total, rateLimit, message }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Bitte zuerst einloggen, um Inserate zu synchronisieren." },
      { status: 401 },
    )
  }

  let body: any = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const filters = {
    maxPrice: body.maxPrice ? Number(body.maxPrice) : undefined,
    minRooms: body.minRooms ? Number(body.minRooms) : undefined,
    maxRooms: body.maxRooms ? Number(body.maxRooms) : undefined,
    take: Number(body.take) || FREE_TIER.actorMinItems,
  }

  // Optional: alle alten Inserate vorher loeschen
  if (body.replaceAll) {
    await db.property.deleteMany({})
  }

  // Apify ist Pflicht - ohne Token kein Sync (keine Fake-Daten mehr)
  if (!APIFY_ENABLED) {
    return NextResponse.json(
      {
        success: false,
        error:
          "APIFY_API_TOKEN ist nicht gesetzt. Bitte in .env konfigurieren, um echte Inserate zu laden.",
      },
      { status: 503 },
    )
  }

  // Rate-Limit vorab pruefen
  const rl = checkRateLimit()
  if (!rl.ok) {
    return NextResponse.json(
      {
        success: false,
        error: rl.reason ?? "Rate-Limit erreicht.",
        rateLimited: true,
        retryInMs: rl.retryInMs,
      },
      { status: 429 },
    )
  }

  try {
    const rawItems = await runFlatfoxScraper(filters, filters.take)
    const mapped = mapFlatfoxItems(rawItems)
    const result = await upsertProperties(mapped)
    return NextResponse.json({
      success: true,
      ...result,
      message: `${result.imported + result.updated} echte Flatfox-Inserate synchronisiert und fuer alle User zwischengespeichert. (Free-Tier: ${rawItems.length} Sample-Ergebnisse, TTL 10 Tage)`,
    })
  } catch (e: any) {
    console.error("Flatfox-Sync fehlgeschlagen:", e)
    return NextResponse.json(
      {
        success: false,
        error: e?.message ?? "Sync fehlgeschlagen",
      },
      { status: 500 },
    )
  }
}

/// Upsert: vorhandene Inserate (nach originalLink) aktualisieren, neue erstellen.
/// fetchedAt wird auf jetzt gesetzt (fuer 10-Tage-TTL).
async function upsertProperties(
  mapped: ReturnType<typeof mapFlatfoxItems>,
): Promise<{ imported: number; updated: number; skipped: number; total: number }> {
  let imported = 0
  let updated = 0
  let skipped = 0
  const now = new Date()

  for (const p of mapped) {
    // Pflichtfelder pruefen: Titel und Link muessen vorhanden sein.
    // Miete darf 0 sein (manche Listings haben sie nicht).
    if (!p.title || !p.originalLink) {
      skipped++
      continue
    }

    const existing = await db.property.findUnique({
      where: { originalLink: p.originalLink },
    })

    if (existing) {
      await db.property.update({
        where: { id: existing.id },
        data: {
          title: p.title,
          description: p.description,
          rent: p.rent,
          utilities: p.utilities,
          rooms: p.rooms,
          area: p.area,
          zip: p.zip,
          city: p.city,
          canton: p.canton,
          images: JSON.stringify(p.images),
          contactName: p.contactName,
          contactEmail: p.contactEmail,
          contactPhone: p.contactPhone,
          submitUrl: p.submitUrl,
          availableFrom: p.availableFrom,
          externalId: p.externalId,
          source: "flatfox",
          fetchedAt: now,
        },
      })
      updated++
    } else {
      await db.property.create({
        data: {
          title: p.title,
          description: p.description,
          rent: p.rent,
          utilities: p.utilities,
          rooms: p.rooms,
          area: p.area,
          zip: p.zip,
          city: p.city,
          canton: p.canton,
          images: JSON.stringify(p.images),
          contactName: p.contactName,
          contactEmail: p.contactEmail,
          contactPhone: p.contactPhone,
          originalLink: p.originalLink,
          submitUrl: p.submitUrl,
          availableFrom: p.availableFrom,
          externalId: p.externalId,
          source: "flatfox",
          fetchedAt: now,
        },
      })
      imported++
    }
  }

  return {
    imported,
    updated,
    skipped,
    total: imported + updated + skipped,
  }
}
