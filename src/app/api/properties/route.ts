import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hasActiveSubscription } from "@/lib/session"
import { cleanupStaleProperties } from "@/lib/property-cache"
import { proxyImageUrls } from "@/lib/image-proxy"
import { ensureDbReady } from "@/lib/ensure-db"

/// Oeffentliche Felder (immer sichtbar)
function publicFields(p: any) {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    rent: p.rent,
    utilities: p.utilities,
    rooms: p.rooms,
    area: p.area,
    zip: p.zip,
    city: p.city,
    canton: p.canton,
    images: proxyImageUrls(safeParseImages(p.images)),
    availableFrom: p.availableFrom,
    createdAt: p.createdAt,
    fetchedAt: p.fetchedAt,
    source: p.source ?? "flatfox",
  }
}

/// Geschuetzte Felder (nur mit aktivem Abo).
/// Wichtig: originalLink und submitUrl werden IMMER geliefert, wenn der
/// Nutzer ein aktives Abo hat - auch wenn Name/E-Mail/Telefon fehlen.
/// Bei fehlenden direkten Kontaktdaten ist der Flatfox-Link der Weg zum Vermieter.
function protectedFields(p: any) {
  const hasDirectContact = Boolean(
    p.contactName || p.contactEmail || p.contactPhone,
  )
  return {
    contactName: p.contactName || null,
    contactEmail: p.contactEmail || null,
    contactPhone: p.contactPhone || null,
    // Original-Link und Submit-URL sind immer der primäre Kontaktweg
    originalLink: p.originalLink,
    submitUrl: p.submitUrl || null,
    hasDirectContact,
  }
}

function safeParseImages(raw: string): string[] {
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export async function GET(req: Request) {
  // Auf Vercel: DB initialisieren falls noetig (cold start)
  await ensureDbReady()
  // TTL-Cleanup: veraltete Inserate entfernen (spaetestens nach 10 Tagen)
  // Wird bei jeder Suchanfrage ausgefuehrt, damit die DB aktuell bleibt.
  await cleanupStaleProperties()

  const { searchParams } = new URL(req.url)
  const canton = searchParams.get("canton")?.trim()
  const city = searchParams.get("city")?.trim()
  const zip = searchParams.get("zip")?.trim()
  const maxRent = searchParams.get("maxRent")
  const minRooms = searchParams.get("minRooms")
  const q = searchParams.get("q")?.trim().toLowerCase()
  const sort = searchParams.get("sort") ?? "rent-asc"

  const where: any = {}
  if (canton) where.canton = { contains: canton }
  if (city) where.city = { contains: city }
  if (zip) where.zip = { startsWith: zip }
  if (maxRent && !Number.isNaN(Number(maxRent))) {
    where.rent = { lte: Number(maxRent) }
  }
  if (minRooms && !Number.isNaN(Number(minRooms))) {
    where.rooms = { gte: Number(minRooms) }
  }
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { city: { contains: q } },
      { canton: { contains: q } },
    ]
  }

  let orderBy: any = { rent: "asc" }
  if (sort === "rent-desc") orderBy = { rent: "desc" }
  else if (sort === "rooms-desc") orderBy = { rooms: "desc" }
  else if (sort === "area-desc") orderBy = { area: "desc" }
  else if (sort === "newest") orderBy = { fetchedAt: "desc" }

  const properties = await db.property.findMany({
    where,
    orderBy,
    take: 200,
  })

  const sub = await hasActiveSubscription()
  const hasAccess = sub.active

  const result = properties.map((p) => ({
    ...publicFields(p),
    // Geschuetzte Felder: bei aktivem Abo immer mit originalLink/submitUrl,
    // auch wenn direkte Kontaktdaten fehlen. Ohne Abo: null (Paywall).
    contact: hasAccess ? protectedFields(p) : null,
    gated: !hasAccess,
  }))

  return NextResponse.json({
    properties: result,
    total: result.length,
    hasAccess,
    cached: true,
    ttlDays: 10,
  })
}
